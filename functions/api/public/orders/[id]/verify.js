// POST /api/public/orders/:id/verify
// Called from the checkout success page to verify a Mercado Pago payment.
// Uses the store's own MP access token to verify the payment belongs to this order.
import { json } from '../../../../_lib/helpers.js';

export async function onRequestPost({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const payment_id = String(body.payment_id || '').trim();
  if (!payment_id) return json({ error: 'payment_id required' }, 400);

  const row = await env.DB.prepare(`
    SELECT o.id, o.status, o.store_id, s.mp_access_token
    FROM orders o JOIN stores s ON s.id = o.store_id
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
    await env.DB.prepare(
      "UPDATE orders SET status='paid', payment_id=?, updated_at=datetime('now') WHERE id=? AND status='pending'"
    ).bind(payment_id, params.id).run();
    return json({ ok: true, status: 'paid' });
  }

  return json({ ok: true, status: payment.status });
}
