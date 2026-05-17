import { json, uuid } from '../../_lib/helpers.js';

export async function onRequestGet({ request, data, env }) {
  const url     = new URL(request.url);
  const storeId = url.searchParams.get('store_id');
  if (!storeId) return json({ error: 'store_id query parameter is required' }, 400);

  // Ownership check — prevent cross-tenant data leaks
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(storeId, data.owner_id).first();
  if (!store) return json({ error: 'Store not found or access denied' }, 404);

  const { results } = await env.DB.prepare(
    'SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC'
  ).bind(storeId).all();

  return json((results || []).map(parseMeta));
}

export async function onRequestPost({ request, data, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { store_id, sku, name, description = '', price_cents, metadata = {}, in_stock = true } = body ?? {};
  if (!store_id || !sku || !name || price_cents === undefined) {
    return json({ error: 'store_id, sku, name, and price_cents are required' }, 400);
  }
  if (!Number.isInteger(price_cents) || price_cents < 0) {
    return json({ error: 'price_cents must be a non-negative integer' }, 400);
  }

  // Ownership check — UPDATE products WHERE store_id IN (SELECT id FROM stores WHERE owner_id = ?)
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(store_id, data.owner_id).first();
  if (!store) return json({ error: 'Store not found or access denied' }, 404);

  const id = uuid();
  try {
    await env.DB.prepare(
      'INSERT INTO products (id, store_id, sku, name, description, price_cents, metadata, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, store_id, sku, name, description, price_cents, JSON.stringify(metadata), in_stock ? 1 : 0).run();
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return json({ error: 'SKU already exists in this store' }, 409);
    throw e;
  }

  return json({ id, store_id, sku, name, description, price_cents, metadata, in_stock: !!in_stock }, 201);
}

function parseMeta(row) {
  try { row.metadata = JSON.parse(row.metadata); } catch { row.metadata = {}; }
  row.in_stock = !!row.in_stock;
  return row;
}
