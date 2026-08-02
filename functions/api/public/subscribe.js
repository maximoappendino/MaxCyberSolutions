// POST /api/public/subscribe — new client signup: create account + preapproval in one request.
// Card is tokenized by the Card Payment Brick on the frontend; only the token reaches here.
import { json, uuid, sessionCookie } from '../../_lib/helpers.js';
import { hashPassword } from '../../_lib/auth.js';
import { sendPlatformEmail, emailWelcomeOwner } from '../../_lib/email.js';
import { createNotification } from '../../_lib/notifications.js';

// Monthly amounts in ARS minor units (cents). Update before going to production.
const PLANS = {
  basic: { name: 'MaxCyberSolutions Basic', amount: 1500  },
  plus:  { name: 'MaxCyberSolutions Plus',  amount: 2000  },
  pro:   { name: 'MaxCyberSolutions Pro',   amount: 3000  },
  ultra: { name: 'MaxCyberSolutions Ultra', amount: 5000  },
};

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const {
    plan = 'basic', email, password, brandName = '',
    cardToken, paymentMethodId, issuerId,
  } = body ?? {};

  if (!email || !password) return json({ error: 'email and password are required' }, 400);
  if (password.length < 8)  return json({ error: 'Password must be at least 8 characters' }, 400);
  if (!cardToken)           return json({ error: 'card token required' }, 400);

  const p = PLANS[plan];
  if (!p)                   return json({ error: 'Invalid plan' }, 400);
  if (!env.MP_ACCESS_TOKEN) return json({ error: 'Payment not configured' }, 503);

  const normalEmail = email.toLowerCase().trim();

  // ── Account: create or update existing ───────────────────────────────────────
  const { salt, hash } = await hashPassword(password);

  let ownerId;
  const existing = await env.DB.prepare(
    'SELECT id FROM owners WHERE email = ?'
  ).bind(normalEmail).first();

  if (existing) {
    ownerId = existing.id;
    await env.DB.prepare(
      'UPDATE owners SET salt = ?, hash = ?, plan = ?, brand = CASE WHEN brand = "" THEN ? ELSE brand END WHERE id = ?'
    ).bind(salt, hash, plan, brandName.trim(), ownerId).run();
  } else {
    ownerId = uuid();
    // email_verified=1: payment proves email access (they received the pricing page)
    await env.DB.prepare(
      'INSERT INTO owners (id, email, salt, hash, plan, brand, onboarded, role, email_verified, subscription_status) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, ?)'
    ).bind(ownerId, normalEmail, salt, hash, plan, brandName.trim(), 'owner', 'pending').run();
  }

  // ── Preapproval ───────────────────────────────────────────────────────────────
  const base = env.PUBLIC_URL || 'https://maxcybersolutions.online';

  const mpPayload = {
    reason:             p.name,
    external_reference: `plan:${plan}|owner:${ownerId}`,
    payer_email:        normalEmail,
    card_token_id:      cardToken,
    back_url:           `${base}/dashboard/?subscribed=1`,
    auto_recurring: {
      frequency:          1,
      frequency_type:     'months',
      transaction_amount: p.amount / 100,
      currency_id:        'ARS',
    },
    status: 'authorized',
  };

  if (paymentMethodId) mpPayload.payment_method_id = paymentMethodId;
  if (issuerId)        mpPayload.issuer_id          = String(issuerId);

  const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` },
    body:    JSON.stringify(mpPayload),
  });

  const mpData = await mpRes.json().catch(() => ({}));

  if (!mpRes.ok) {
    const cause = Array.isArray(mpData?.cause) ? mpData.cause[0] : null;
    return json({
      error:  cause?.description || mpData?.message || 'Card payment failed. Please try again.',
      code:   cause?.code,
    }, 502);
  }

  // ── Persist subscription state ────────────────────────────────────────────────
  const subStatus = mpData.status === 'authorized' ? 'active' : 'pending';

  await env.DB.prepare(
    "UPDATE owners SET preapproval_id = ?, subscription_status = ?, role = 'owner', status = 'active' WHERE id = ?"
  ).bind(mpData.id, subStatus, ownerId).run();

  await env.DB.prepare(
    'INSERT OR IGNORE INTO subscriptions (id, owner_id, plan, status, preapproval_id, mp_preference_id, mp_payment_id, amount_cents, payer_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(uuid(), ownerId, plan, subStatus, mpData.id, '', '', p.amount, normalEmail).run();

  // Send welcome email and notification if payment went through immediately
  if (subStatus === 'active') {
    const dashboardUrl = `${base}/dashboard/?subscribed=1`;
    sendPlatformEmail(env, {
      to:      normalEmail,
      subject: 'Welcome to MaxCyberSolutions — your account is active',
      html:    emailWelcomeOwner({ email: normalEmail, planName: p.name, dashboardUrl }),
    }).catch(() => {});
    createNotification(env, {
      ownerId,
      type:  'subscription_active',
      title: `${p.name} — active`,
      body:  'Your subscription is active. You can now create your first store.',
      link:  '/dashboard/',
    }).catch(() => {});
  }

  // ── Auto-login: create session so user lands directly on dashboard ─────────────
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);

  await env.DB.prepare(
    'INSERT INTO sessions (id, owner_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, ownerId, expiresAt).run();

  return new Response(JSON.stringify({
    preapproval_id: mpData.id,
    status:         mpData.status,
    init_point:     mpData.init_point || null,
  }), {
    status:  200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie':   sessionCookie(sessionId, SESSION_TTL),
    },
  });
}
