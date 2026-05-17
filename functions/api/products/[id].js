import { json } from '../../_lib/helpers.js';

// All queries scope through stores.owner_id to enforce multi-tenant isolation.
// Pattern from spec: UPDATE products SET … WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)

async function owned(id, ownerId, env) {
  return env.DB.prepare(`
    SELECT p.* FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = ? AND s.owner_id = ?
  `).bind(id, ownerId).first();
}

export async function onRequestGet({ params, data, env }) {
  const product = await owned(params.id, data.owner_id, env);
  if (!product) return json({ error: 'Not found' }, 404);
  return json(parseMeta(product));
}

export async function onRequestPut({ params, request, data, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const product = await owned(params.id, data.owner_id, env);
  if (!product) return json({ error: 'Not found' }, 404);

  const { name, description, price_cents, metadata, sku, in_stock } = body ?? {};

  if (price_cents !== undefined && (!Number.isInteger(price_cents) || price_cents < 0)) {
    return json({ error: 'price_cents must be a non-negative integer' }, 400);
  }

  const u = {
    name:        name        ?? product.name,
    description: description ?? product.description,
    price_cents: price_cents ?? product.price_cents,
    sku:         sku         ?? product.sku,
    in_stock:    in_stock !== undefined ? (in_stock ? 1 : 0) : product.in_stock,
    metadata:    JSON.stringify(metadata ?? JSON.parse(product.metadata || '{}')),
  };

  try {
    await env.DB.prepare(`
      UPDATE products
      SET name = ?, description = ?, price_cents = ?, sku = ?, in_stock = ?, metadata = ?
      WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)
    `).bind(u.name, u.description, u.price_cents, u.sku, u.in_stock, u.metadata,
             params.id, data.owner_id).run();
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return json({ error: 'SKU already exists in this store' }, 409);
    throw e;
  }

  return json({ ...u, id: params.id, metadata: JSON.parse(u.metadata), in_stock: !!u.in_stock });
}

export async function onRequestDelete({ params, data, env }) {
  const result = await env.DB.prepare(`
    DELETE FROM products
    WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)
  `).bind(params.id, data.owner_id).run();

  if (!result.meta?.changes) return json({ error: 'Not found' }, 404);
  return json({ ok: true });
}

function parseMeta(row) {
  try { row.metadata = JSON.parse(row.metadata); } catch { row.metadata = {}; }
  row.in_stock = !!row.in_stock;
  return row;
}
