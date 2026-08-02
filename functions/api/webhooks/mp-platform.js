// POST /api/webhooks/mp-platform
// MercadoPago IPN webhook for platform billing.
// Handles: payment (legacy Checkout Pro), preapproval (subscription created/updated),
//          authorized_payment (recurring charge succeeded or failed).
import { json, uuid } from '../../_lib/helpers.js';
import { hashPassword } from '../../_lib/auth.js';
import { verifyMpSignature } from '../../_lib/mp-verify.js';
import { sendPlatformEmail, emailWelcomeOwner, emailSubscriptionPastDue } from '../../_lib/email.js';
import { createNotification } from '../../_lib/notifications.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));

  const type       = body.type || '';
  const resourceId = String(body.data?.id || '');

  if (!resourceId || !env.MP_ACCESS_TOKEN) return json({ ok: true });

  // Verify HMAC signature for supported webhook types
  if (['payment', 'preapproval', 'authorized_payment'].includes(type)) {
    if (!await verifyMpSignature(request, resourceId, env)) {
      return json({ error: 'Invalid signature' }, 400);
    }
  }

  if (type === 'payment') {
    return handlePayment(resourceId, body, env);
  }
  if (type === 'preapproval') {
    return handlePreapproval(resourceId, env);
  }
  if (type === 'authorized_payment') {
    return handleAuthorizedPayment(resourceId, env);
  }

  return json({ ok: true });
}

// ── Legacy one-time Checkout Pro payment ─────────────────────────────────────
async function handlePayment(paymentId, body, env) {
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!mpRes.ok) return json({ ok: true });

  const payment = await mpRes.json();
  if (payment.status !== 'approved') return json({ ok: true });

  const meta   = payment.metadata || {};
  const extRef = payment.external_reference || '';
  const plan   = meta.plan || extRef.match(/plan:([^|]+)/)?.[1] || 'basic';
  const email  = meta.email || extRef.match(/email:([^|]+)/)?.[1]?.replace(/%40/g, '@') || payment.payer?.email;

  if (!email) return json({ ok: true });

  await ensureOwnerAccount(email, plan, env);

  const owner = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(email).first();
  if (owner) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO subscriptions (id, owner_id, plan, status, mp_payment_id, amount_cents, payer_email) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(uuid(), owner.id, plan, 'active', paymentId, Math.round((payment.transaction_amount || 0) * 100), email).run();
  }

  return json({ ok: true });
}

// ── Preapproval (subscription created / status changed) ──────────────────────
async function handlePreapproval(preapprovalId, env) {
  const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!mpRes.ok) return json({ ok: true });

  const pa     = await mpRes.json();
  const status = pa.status || '';
  const email  = pa.payer_email || '';
  const extRef = pa.external_reference || '';
  const plan   = extRef.match(/plan:([^|]+)/)?.[1] || 'basic';

  // Log event
  const owner = email ? await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(email).first() : null;
  await logEvent(owner?.id || null, 'preapproval', preapprovalId, status, pa, env);

  const base = env.PUBLIC_URL || 'https://maxcybersolutions.online';

  if (status === 'authorized' && email) {
    await ensureOwnerAccount(email, plan, env);

    const row = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(email).first();
    if (row) {
      await env.DB.prepare(
        "UPDATE owners SET preapproval_id = ?, subscription_status = 'active', role = 'owner', status = 'active' WHERE id = ?"
      ).bind(preapprovalId, row.id).run();

      await env.DB.prepare(
        'INSERT OR IGNORE INTO subscriptions (id, owner_id, plan, status, preapproval_id, mp_preference_id, mp_payment_id, amount_cents, payer_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(uuid(), row.id, plan, 'active', preapprovalId, '', '', Math.round((pa.auto_recurring?.transaction_amount || 0) * 100), email).run();

      const planNames = { basic: 'Basic', plus: 'Plus', pro: 'Pro', ultra: 'Ultra' };
      const planName  = `MaxCyberSolutions ${planNames[plan] || plan}`;
      sendPlatformEmail(env, {
        to:      email,
        subject: 'Welcome to MaxCyberSolutions — your account is active',
        html:    emailWelcomeOwner({ email, planName, dashboardUrl: `${base}/dashboard/` }),
      }).catch(() => {});
      createNotification(env, {
        ownerId: row.id,
        type:    'subscription_active',
        title:   `${planName} — active`,
        body:    'Your subscription is active. You can now create your first store.',
        link:    '/dashboard/',
      }).catch(() => {});
    }
  } else if (status === 'cancelled' && email) {
    const row = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(email).first();
    if (row) {
      await env.DB.prepare(
        "UPDATE owners SET subscription_status = 'cancelled', status = 'frozen' WHERE id = ?"
      ).bind(row.id).run();
      createNotification(env, {
        ownerId: row.id,
        type:    'subscription_cancelled',
        title:   'Subscription cancelled',
        body:    'Your subscription has been cancelled. Your store is no longer visible. Re-subscribe to reactivate.',
        link:    '/dashboard/#pricing',
      }).catch(() => {});
    }
  } else if (status === 'paused' && email) {
    const row = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(email).first();
    if (row) {
      await env.DB.prepare(
        "UPDATE owners SET subscription_status = 'paused', status = 'paused' WHERE id = ?"
      ).bind(row.id).run();
    }
  }

  return json({ ok: true });
}

// ── Authorized payment (recurring charge) ────────────────────────────────────
async function handleAuthorizedPayment(apId, env) {
  const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${apId}`, {
    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!mpRes.ok) return json({ ok: true });

  const ap            = await mpRes.json();
  const preapprovalId = ap.preapproval_id || '';
  const status        = ap.status || '';

  // Look up owner by preapproval_id
  const owner = preapprovalId
    ? await env.DB.prepare('SELECT id, email, plan FROM owners WHERE preapproval_id = ?').bind(preapprovalId).first()
    : null;

  await logEvent(owner?.id || null, 'authorized_payment', apId, status, ap, env);

  if (!owner) return json({ ok: true });

  // Idempotency: skip if payment already recorded
  const exists = await env.DB.prepare(
    'SELECT id FROM subscriptions WHERE mp_payment_id = ?'
  ).bind(apId).first();
  if (exists) return json({ ok: true });

  const amountCents = Math.round((ap.transaction_amount || 0) * 100);

  const base2 = env.PUBLIC_URL || 'https://maxcybersolutions.online';

  if (status === 'approved') {
    const nextPeriod = new Date();
    nextPeriod.setMonth(nextPeriod.getMonth() + 1);
    const nextPeriodStr = nextPeriod.toISOString().slice(0, 10);

    await Promise.all([
      env.DB.prepare(
        "UPDATE owners SET subscription_status = 'active', status = 'active', current_period_end = ? WHERE id = ?"
      ).bind(nextPeriodStr, owner.id).run(),

      env.DB.prepare(
        'INSERT INTO subscriptions (id, owner_id, plan, status, preapproval_id, mp_preference_id, mp_payment_id, amount_cents, payer_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(uuid(), owner.id, owner.plan || 'basic', 'active', preapprovalId, '', apId, amountCents, owner.email).run(),
    ]);
  } else if (['rejected', 'cancelled'].includes(status)) {
    await env.DB.prepare(
      "UPDATE owners SET subscription_status = 'past_due', status = 'paused' WHERE id = ?"
    ).bind(owner.id).run();

    const planNames = { basic: 'Basic', plus: 'Plus', pro: 'Pro', ultra: 'Ultra' };
    const planName  = `MaxCyberSolutions ${planNames[owner.plan] || owner.plan}`;
    sendPlatformEmail(env, {
      to:      owner.email,
      subject: 'Payment failed — your store is temporarily unavailable',
      html:    emailSubscriptionPastDue({ planName, dashboardUrl: `${base2}/dashboard/` }),
    }).catch(() => {});
    createNotification(env, {
      ownerId: owner.id,
      type:    'subscription_past_due',
      title:   'Payment failed',
      body:    'We couldn\'t process your renewal. Your store is paused until payment is resolved.',
      link:    '/dashboard/',
    }).catch(() => {});
  }

  return json({ ok: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ensureOwnerAccount(email, plan, env) {
  const existing = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(email).first();
  if (existing) return;

  const tempPw        = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const { salt, hash } = await hashPassword(tempPw);
  const ownerId       = uuid();

  await env.DB.prepare(
    'INSERT INTO owners (id, email, salt, hash, plan, onboarded, pending_setup_token, subscription_status) VALUES (?, ?, ?, ?, ?, 0, ?, ?)'
  ).bind(ownerId, email, salt, hash, plan, tempPw, 'active').run();
}

async function logEvent(ownerId, eventType, resourceId, status, payload, env) {
  try {
    await env.DB.prepare(
      'INSERT INTO subscription_events (id, owner_id, event_type, resource_id, status, payload) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(uuid(), ownerId, eventType, resourceId, status, JSON.stringify(payload)).run();
  } catch { /* non-fatal */ }
}
