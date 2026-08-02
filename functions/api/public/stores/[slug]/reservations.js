// POST /api/public/stores/:slug/reservations
// Creates a reservation order (order_type='reservation').
// payment_mode 'on_arrival' → order created immediately, no upfront charge.
// payment_mode 'upfront'    → creates an MP preference and returns init_point.
import { json, uuid } from '../../../../_lib/helpers.js';
import { sendEmail, canSendEmail, incrementEmailCount } from '../../../../_lib/email.js';

export async function onRequestPost({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const store = await env.DB.prepare(`
    SELECT s.*, o.id AS owner_id, o.email AS owner_email, o.status AS owner_status
    FROM stores s JOIN owners o ON o.id = s.owner_id
    WHERE s.slug = ?
  `).bind(params.slug).first();

  if (!store)                          return json({ error: 'Store not found' }, 404);
  if (store.owner_status !== 'active') return json({ error: 'Store unavailable' }, 503);

  const {
    customer_name, customer_email, customer_phone = '',
    reservation_date, reservation_time,
    reservation_notes = '',
    payment_mode = 'on_arrival',
    price_cents = 0,
    service_name = 'Reservation',
    confirm_msg = 'Your reservation is confirmed.',
  } = body ?? {};

  if (!customer_name || !customer_email) return json({ error: 'Name and email required' }, 400);
  if (!reservation_date || !reservation_time) return json({ error: 'Date and time are required' }, 400);

  const reservation_at = `${reservation_date}T${reservation_time}:00`;
  const priceCents = parseInt(price_cents) || 0;
  const orderId = uuid();
  const initialStatus = payment_mode === 'upfront' ? 'pending' : 'confirmed';

  await env.DB.prepare(`
    INSERT INTO orders
      (id, store_id, status, order_type, reservation_at, reservation_notes,
       customer_name, customer_email, customer_phone,
       subtotal_cents, total_cents, payment_method)
    VALUES (?, ?, ?, 'reservation', ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    orderId, store.id, initialStatus,
    reservation_at, reservation_notes,
    customer_name, customer_email, customer_phone,
    priceCents, priceCents,
    payment_mode === 'upfront' ? 'mp' : 'on_arrival'
  ).run();

  // Notify store owner via email
  if (store.owner_email && await canSendEmail(env, store.owner_id)) {
    await incrementEmailCount(env, store.owner_id);
    sendEmail(env, {
      to:      store.owner_email,
      subject: `New reservation — ${service_name}`,
      text:    `New reservation request:\n\nService: ${service_name}\nDate/Time: ${reservation_at}\nCustomer: ${customer_name}\nEmail: ${customer_email}\nPhone: ${customer_phone || '—'}\nNotes: ${reservation_notes || '—'}\nPayment: ${payment_mode === 'upfront' ? 'upfront' : 'on arrival'}\nAmount: $${(priceCents/100).toFixed(2)}`,
    }).catch(() => {});
  }

  // Upfront payment: create MP preference
  if (payment_mode === 'upfront' && priceCents > 0 && env.MP_ACCESS_TOKEN) {
    const base    = env.PUBLIC_URL || 'https://maxcybersolutions.online';
    const mpRes   = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}` },
      body: JSON.stringify({
        items: [{ title: `${service_name} — ${reservation_at.slice(0, 16)}`, quantity: 1, unit_price: priceCents / 100, currency_id: 'ARS' }],
        payer:              { email: customer_email },
        external_reference: orderId,
        back_urls: { success: `${base}/store/${params.slug}/?res_ok=1`, failure: `${base}/store/${params.slug}/?res_fail=1` },
        auto_return: 'approved',
      }),
    });
    if (mpRes.ok) {
      const mpData = await mpRes.json();
      await env.DB.prepare('UPDATE orders SET mp_preference_id = ? WHERE id = ?')
        .bind(mpData.id, orderId).run().catch(() => {});
      return json({ order_id: orderId, status: initialStatus, init_point: mpData.init_point });
    }
  }

  return json({ order_id: orderId, status: initialStatus, message: confirm_msg });
}
