// GET  /api/stores/:id/customers — list store customers with their discount info
// POST /api/stores/:id/customers — add or update a customer for this store
// DELETE /api/stores/:id/customers?customer_id=X — remove from store
import { json, uuid } from '../../../_lib/helpers.js';

async function getStore(id, ownerId, env) {
  return env.DB.prepare('SELECT id FROM stores WHERE id = ? AND owner_id = ?').bind(id, ownerId).first();
}

export async function onRequestGet({ params, request, data, env }) {
  const store = await getStore(params.id, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  const url = new URL(request.url);
  const q   = (url.searchParams.get('q') || '').toLowerCase();
  const group = url.searchParams.get('group') || '';

  let query = `
    SELECT c.id, c.email, c.name, c.phone, c.city, c.province, c.zip, c.address,
           sc.discount_pct, sc.group_name, sc.notes, sc.created_at
    FROM store_customers sc JOIN customers c ON c.id = sc.customer_id
    WHERE sc.store_id = ?`;
  const bind = [params.id];

  if (group) { query += ' AND sc.group_name = ?'; bind.push(group); }
  query += ' ORDER BY sc.created_at DESC LIMIT 200';

  const { results } = await env.DB.prepare(query).bind(...bind).all();
  const filtered = q
    ? (results || []).filter(r =>
        r.email.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.city || '').toLowerCase().includes(q))
    : (results || []);

  const groups = await env.DB.prepare(
    'SELECT DISTINCT group_name FROM store_customers WHERE store_id = ? AND group_name != "" ORDER BY group_name'
  ).bind(params.id).all();

  return json({ customers: filtered, groups: (groups.results || []).map(g => g.group_name) });
}

export async function onRequestPost({ params, request, data, env }) {
  const store = await getStore(params.id, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { email, name = '', phone = '', address = '', city = '', province = '', zip = '',
          discount_pct = 0, group_name = '', notes = '' } = body ?? {};

  if (!email) return json({ error: 'email required' }, 400);

  // Upsert global customer record
  let customer = await env.DB.prepare('SELECT id FROM customers WHERE email = ?').bind(email).first();
  if (!customer) {
    const cid = uuid();
    await env.DB.prepare(
      'INSERT INTO customers (id, email, name, phone, address, city, province, zip) VALUES (?,?,?,?,?,?,?,?)'
    ).bind(cid, email, name, phone, address, city, province, zip).run();
    customer = { id: cid };
  } else if (name || phone || city) {
    // Update global profile if new info provided
    await env.DB.prepare(
      'UPDATE customers SET name=COALESCE(NULLIF(?,\'\'),name), phone=COALESCE(NULLIF(?,\'\'),phone), city=COALESCE(NULLIF(?,\'\'),city), province=COALESCE(NULLIF(?,\'\'),province), zip=COALESCE(NULLIF(?,\'\'),zip), address=COALESCE(NULLIF(?,\'\'),address) WHERE id=?'
    ).bind(name, phone, city, province, zip, address, customer.id).run();
  }

  // Upsert store-customer relationship
  const existing = await env.DB.prepare(
    'SELECT id FROM store_customers WHERE store_id = ? AND customer_id = ?'
  ).bind(params.id, customer.id).first();

  if (existing) {
    await env.DB.prepare(
      'UPDATE store_customers SET discount_pct=?, group_name=?, notes=? WHERE id=?'
    ).bind(discount_pct, group_name, notes, existing.id).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO store_customers (id, store_id, customer_id, discount_pct, group_name, notes) VALUES (?,?,?,?,?,?)'
    ).bind(uuid(), params.id, customer.id, discount_pct, group_name, notes).run();
  }

  return json({ ok: true, customer_id: customer.id });
}

export async function onRequestDelete({ params, request, data, env }) {
  const store = await getStore(params.id, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  const url = new URL(request.url);
  const cid = url.searchParams.get('customer_id');
  if (!cid) return json({ error: 'customer_id required' }, 400);

  await env.DB.prepare(
    'DELETE FROM store_customers WHERE store_id = ? AND customer_id = ?'
  ).bind(params.id, cid).run();

  return json({ ok: true });
}
