// POST /api/public/stores/:slug/orders
// Creates an order. For MP: also creates a preference and returns init_point.
// For bank transfer: returns CBU/CVU details for the customer to complete payment.
import { json, uuid } from '../../../../_lib/helpers.js';

export async function onRequestPost({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const store = await env.DB.prepare(`
    SELECT s.*, o.status AS owner_status
    FROM stores s JOIN owners o ON o.id = s.owner_id
    WHERE s.slug = ?
  `).bind(params.slug).first();

  if (!store)                         return json({ error: 'Store not found' }, 404);
  if (store.owner_status !== 'active') return json({ error: 'Store unavailable' }, 503);

  const {
    customer_name, customer_email, customer_phone = '',
    shipping_address = '', shipping_zip = '', shipping_city = '',
    shipping_province = '', shipping_method = '', shipping_cost_cents = 0,
    payment_method = 'mp',
    items = [],
  } = body ?? {};

  if (!customer_name || !customer_email) return json({ error: 'Name and email required' }, 400);
  if (!items.length)                     return json({ error: 'Cart is empty' }, 400);

  const subtotal_cents = items.reduce((s, i) => s + (i.price_cents * (i.quantity || 1)), 0);
  const total_cents    = subtotal_cents + (parseInt(shipping_cost_cents) || 0);
  const orderId        = uuid();
  const initialStatus  = payment_method === 'mp' ? 'pending' : 'awaiting_transfer';

  await env.DB.prepare(`
    INSERT INTO orders
      (id, store_id, status, customer_name, customer_email, customer_phone,
       shipping_address, shipping_zip, shipping_city, shipping_province,
       shipping_method, shipping_cost_cents, subtotal_cents, total_cents, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(orderId, store.id, initialStatus,
    customer_name, customer_email, customer_phone,
    shipping_address, shipping_zip, shipping_city, shipping_province,
    shipping_method, shipping_cost_cents, subtotal_cents, total_cents,
    payment_method).run();

  for (const item of items) {
    await env.DB.prepare(`
      INSERT INTO order_items (id, order_id, product_id, sku, name, price_cents, quantity, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(uuid(), orderId, item.product_id || '', item.sku || '',
      item.name, item.price_cents, item.quantity || 1, item.image || '').run();
  }

  // ── Bank Transfer ────────────────────────────────────────────────────────────
  if (payment_method === 'bank') {
    return json({
      order_id: orderId,
      status: 'awaiting_transfer',
      total_cents,
      transfer: {
        cbu_cvu:     store.cbu_cvu,
        bank_name:   store.bank_name,
        bank_holder: store.bank_holder,
        reference:   orderId.slice(0, 8).toUpperCase(),
        amount:      (total_cents / 100).toFixed(2),
      },
    });
  }

  // ── Mercado Pago ─────────────────────────────────────────────────────────────
  if (!store.mp_access_token) return json({ error: 'Store payment not configured' }, 503);

  const base = env.PUBLIC_URL || 'https://maxcybersolutions.online';

  // Aggregate dimensions for MercadoEnvíos
  const totalWeight = items.reduce((s, i) => s + ((i.weight_grams || 100) * (i.quantity || 1)), 0);
  const maxWidth    = Math.max(...items.map(i => i.width_cm  || 10));
  const maxHeight   = Math.max(...items.map(i => i.height_cm || 10));
  const maxDepth    = Math.max(...items.map(i => i.depth_cm  || 10));

  const preference = {
    items: items.map(i => ({
      title:       i.name,
      unit_price:  i.price_cents / 100,
      quantity:    i.quantity || 1,
      currency_id: 'ARS',
    })),
    payer: {
      name:  customer_name,
      email: customer_email,
      phone: { number: customer_phone },
    },
    back_urls: {
      success: `${base}/checkout/${params.slug}?order=${orderId}&status=approved`,
      failure: `${base}/checkout/${params.slug}?order=${orderId}&status=failed`,
      pending: `${base}/checkout/${params.slug}?order=${orderId}&status=pending`,
    },
    notification_url: `${base}/api/webhooks/mp-store?order=${orderId}`,
    external_reference: orderId,
    auto_return: 'approved',
  };

  // Add MercadoEnvíos if store has origin zip and customer has shipping zip
  if (store.store_zip && shipping_zip && shipping_method === 'me') {
    preference.shipments = {
      mode: 'me2',
      local_pickup: false,
      dimensions: `${maxWidth}x${maxHeight}x${maxDepth},${totalWeight}`,
      receiver_address: {
        zip_code:   shipping_zip,
        city_name:  shipping_city,
        state_name: shipping_province,
      },
    };
  }

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${store.mp_access_token}`,
    },
    body: JSON.stringify(preference),
  });

  if (!mpRes.ok) {
    const err = await mpRes.text();
    return json({ error: 'Failed to create MP preference', detail: err }, 502);
  }

  const mpData = await mpRes.json();

  await env.DB.prepare('UPDATE orders SET mp_preference_id = ? WHERE id = ?')
    .bind(mpData.id, orderId).run();

  return json({ order_id: orderId, mp_init_point: mpData.init_point });
}
