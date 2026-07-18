// POST /api/webhooks/mp-store?order={orderId}
// Mercado Pago IPN webhook for storefront orders.
// The notification_url in the MP preference includes ?order={orderId} so we can
// look up the order's store and verify the payment using the store's own token.
import { json } from '../../_lib/helpers.js';

export async function onRequestPost({ request, env }) {
  const url  = new URL(request.url);
  const body = await request.json().catch(() => ({}));

  // MP sends type='payment' for IPN notifications
  if (body.type !== 'payment') return json({ ok: true });

  const paymentId = String(body.data?.id || '');
  const orderId   = url.searchParams.get('order') || '';
  if (!paymentId || !orderId) return json({ ok: true });

  // Get order + store token
  const row = await env.DB.prepare(`
    SELECT o.status, s.mp_access_token
    FROM orders o JOIN stores s ON s.id = o.store_id
    WHERE o.id = ?
  `).bind(orderId).first();

  if (!row || !row.mp_access_token || row.status === 'paid') return json({ ok: true });

  // Verify with MP using the store's own access token
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${row.mp_access_token}` },
  });
  if (!mpRes.ok) return json({ ok: true });

  const payment = await mpRes.json();

  if (payment.status === 'approved' && payment.external_reference === orderId) {
    await env.DB.prepare(
      "UPDATE orders SET status='paid', payment_id=?, updated_at=datetime('now') WHERE id=? AND status='pending'"
    ).bind(paymentId, orderId).run();
  }

  return json({ ok: true });
}
