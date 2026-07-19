// POST /api/webhooks/mp-store?order={orderId}
// Mercado Pago IPN webhook for storefront orders.
import { json } from '../../_lib/helpers.js';
import { sendEmail, canSendEmail, incrementEmailCount, emailPaymentConfirmedOwner, emailPaymentConfirmedCustomer } from '../../_lib/email.js';

export async function onRequestPost({ request, env }) {
  const url  = new URL(request.url);
  const body = await request.json().catch(() => ({}));

  if (body.type !== 'payment') return json({ ok: true });

  const paymentId = String(body.data?.id || '');
  const orderId   = url.searchParams.get('order') || '';
  if (!paymentId || !orderId) return json({ ok: true });

  const row = await env.DB.prepare(`
    SELECT o.status, o.customer_name, o.customer_email, o.total_cents,
           s.name AS store_name, s.mp_access_token,
           o2.id AS owner_id, o2.email AS owner_email
    FROM orders o
    JOIN stores s ON s.id = o.store_id
    JOIN owners o2 ON o2.id = s.owner_id
    WHERE o.id = ?
  `).bind(orderId).first();

  if (!row || !row.mp_access_token || row.status === 'paid') return json({ ok: true });

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${row.mp_access_token}` },
  });
  if (!mpRes.ok) return json({ ok: true });

  const payment = await mpRes.json();

  if (payment.status === 'approved' && payment.external_reference === orderId) {
    await env.DB.prepare(
      "UPDATE orders SET status='paid', payment_id=?, updated_at=datetime('now') WHERE id=? AND status='pending'"
    ).bind(paymentId, orderId).run();

    if (await canSendEmail(env, row.owner_id)) {
      const base      = env.PUBLIC_URL || 'https://maxcybersolutions.online';
      const storeName = row.store_name || '';
      const order     = { id: orderId, customer_name: row.customer_name, customer_email: row.customer_email, total_cents: row.total_cents };
      await Promise.all([
        sendEmail(env, {
          to: row.owner_email,
          subject: `Pago confirmado #${orderId.slice(0,8).toUpperCase()} — ${storeName}`,
          html: emailPaymentConfirmedOwner({ order, storeName, dashboardUrl: `${base}/dashboard` }),
        }),
        sendEmail(env, {
          to: row.customer_email,
          subject: `¡Pago confirmado! #${orderId.slice(0,8).toUpperCase()} — ${storeName}`,
          html: emailPaymentConfirmedCustomer({ order, storeName }),
        }),
      ]);
      await incrementEmailCount(env, row.owner_id, 2);
    }
  }

  return json({ ok: true });
}
