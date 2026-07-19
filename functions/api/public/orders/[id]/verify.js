// POST /api/public/orders/:id/verify
// Called from the checkout success page to verify a Mercado Pago payment.
// Fallback path — the webhook should have already fired; this ensures the
// order is marked paid even if the IPN notification was delayed.
import { json } from '../../../../_lib/helpers.js';
import { sendEmail, canSendEmail, incrementEmailCount, emailPaymentConfirmedOwner, emailPaymentConfirmedCustomer } from '../../../../_lib/email.js';

export async function onRequestPost({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const payment_id = String(body.payment_id || '').trim();
  if (!payment_id) return json({ error: 'payment_id required' }, 400);

  const row = await env.DB.prepare(`
    SELECT o.id, o.status, o.customer_name, o.customer_email, o.total_cents,
           s.name AS store_name, s.mp_access_token,
           ow.id AS owner_id, ow.email AS owner_email
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    JOIN owners ow ON ow.id = s.owner_id
    WHERE o.id = ?
  `).bind(params.id).first();

  if (!row) return json({ error: 'Order not found' }, 404);
  if (row.status === 'paid') return json({ ok: true, status: 'paid' });
  if (!row.mp_access_token)  return json({ error: 'Store not configured for MP' }, 503);

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
    headers: { 'Authorization': `Bearer ${row.mp_access_token}` },
  });
  if (!mpRes.ok) return json({ error: 'Payment lookup failed' }, 502);

  const payment = await mpRes.json();

  if (payment.external_reference !== params.id) {
    return json({ error: 'Payment does not match this order' }, 400);
  }

  if (payment.status === 'approved') {
    const updated = await env.DB.prepare(
      "UPDATE orders SET status='paid', payment_id=?, updated_at=datetime('now') WHERE id=? AND status='pending'"
    ).bind(payment_id, params.id).run();

    // Only send emails if this call actually changed the status (not already handled by webhook)
    if (updated.meta?.changes > 0 && await canSendEmail(env, row.owner_id)) {
      const base      = env.PUBLIC_URL || 'https://maxcybersolutions.online';
      const storeName = row.store_name || '';
      const order     = { id: params.id, customer_name: row.customer_name, customer_email: row.customer_email, total_cents: row.total_cents };
      await Promise.all([
        sendEmail(env, {
          to: row.owner_email,
          subject: `Pago confirmado #${params.id.slice(0,8).toUpperCase()} — ${storeName}`,
          html: emailPaymentConfirmedOwner({ order, storeName, dashboardUrl: `${base}/dashboard` }),
        }),
        sendEmail(env, {
          to: row.customer_email,
          subject: `¡Pago confirmado! #${params.id.slice(0,8).toUpperCase()} — ${storeName}`,
          html: emailPaymentConfirmedCustomer({ order, storeName }),
        }),
      ]);
      await incrementEmailCount(env, row.owner_id, 2);
    }

    return json({ ok: true, status: 'paid' });
  }

  return json({ ok: true, status: payment.status });
}
