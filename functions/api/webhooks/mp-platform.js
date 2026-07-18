// POST /api/webhooks/mp-platform
// Mercado Pago IPN webhook for platform subscriptions.
// When a new client pays Maximo, this creates their account automatically.
import { json, uuid } from '../_lib/helpers.js';
import { hashPassword } from '../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));

  if (body.type !== 'payment') return json({ ok: true });

  const paymentId = String(body.data?.id || '');
  if (!paymentId || !env.MP_ACCESS_TOKEN) return json({ ok: true });

  // Fetch payment details using Maximo's platform token
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  if (!mpRes.ok) return json({ ok: true });

  const payment = await mpRes.json();
  if (payment.status !== 'approved') return json({ ok: true });

  // Extract plan and email from metadata or external_reference
  const meta        = payment.metadata || {};
  const extRef      = payment.external_reference || '';
  const plan        = meta.plan || (extRef.match(/plan:([^|]+)/)?.[1]) || 'basic';
  const email       = meta.email || (extRef.match(/email:([^|]+)/)?.[1]).replace(/%40/g, '@') || payment.payer?.email;

  if (!email) return json({ ok: true });

  // Idempotency: skip if account already exists
  const existing = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(email).first();
  if (existing) {
    // Still record subscription
    await env.DB.prepare(
      'INSERT OR IGNORE INTO subscriptions (id, owner_id, plan, status, mp_payment_id, amount_cents, payer_email) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(uuid(), existing.id, plan, 'active', paymentId, Math.round((payment.transaction_amount || 0) * 100), email).run();
    return json({ ok: true });
  }

  // Generate a temporary password (shown once on the landing page success return)
  const tempPw   = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  const { salt, hash } = await hashPassword(tempPw);
  const ownerId  = uuid();

  await env.DB.prepare(
    'INSERT INTO owners (id, email, salt, hash, plan, onboarded, pending_setup_token) VALUES (?, ?, ?, ?, ?, 0, ?)'
  ).bind(ownerId, email, salt, hash, plan, tempPw).run();

  await env.DB.prepare(
    'INSERT INTO subscriptions (id, owner_id, plan, status, mp_payment_id, amount_cents, payer_email) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(uuid(), ownerId, plan, 'active', paymentId, Math.round((payment.transaction_amount || 0) * 100), email).run();

  return json({ ok: true });
}
