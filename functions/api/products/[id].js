import { json } from '../../_lib/helpers.js';
import { r2KeyFromUrl, deleteR2Object } from '../../_lib/storage.js';

async function owned(id, ownerId, env) {
  return env.DB.prepare(`
    SELECT p.*, s.owner_id FROM products p
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

  if (body.price_cents !== undefined && (!Number.isInteger(body.price_cents) || body.price_cents < 0)) {
    return json({ error: 'price_cents must be a non-negative integer' }, 400);
  }

  const newImage = body.image !== undefined ? body.image : (product.image || '');

  const u = {
    name:         body.name        ?? product.name,
    description:  body.description ?? product.description,
    price_cents:  body.price_cents ?? product.price_cents,
    sku:          body.sku         ?? product.sku,
    in_stock:     body.in_stock !== undefined ? (body.in_stock ? 1 : 0) : product.in_stock,
    metadata:     JSON.stringify(body.metadata ?? JSON.parse(product.metadata || '{}')),
    category:     body.category !== undefined ? body.category : (product.category || ''),
    visible:      body.visible  !== undefined ? (body.visible ? 1 : 0) : (product.visible ?? 1),
    image:        newImage,
    weight_grams: body.weight_grams !== undefined ? (parseInt(body.weight_grams) || 0) : (product.weight_grams || 0),
    width_cm:     body.width_cm     !== undefined ? (parseInt(body.width_cm)     || 0) : (product.width_cm     || 0),
    height_cm:    body.height_cm    !== undefined ? (parseInt(body.height_cm)    || 0) : (product.height_cm    || 0),
    depth_cm:     body.depth_cm     !== undefined ? (parseInt(body.depth_cm)     || 0) : (product.depth_cm     || 0),
  };

  try {
    await env.DB.prepare(`
      UPDATE products
      SET name = ?, description = ?, price_cents = ?, sku = ?, in_stock = ?, metadata = ?,
          category = ?, visible = ?, image = ?, weight_grams = ?, width_cm = ?, height_cm = ?, depth_cm = ?
      WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)
    `).bind(u.name, u.description, u.price_cents, u.sku, u.in_stock, u.metadata,
            u.category, u.visible, u.image, u.weight_grams, u.width_cm, u.height_cm, u.depth_cm,
            params.id, data.owner_id).run();
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return json({ error: 'SKU already exists in this store' }, 409);
    throw e;
  }

  // Delete the old R2 image if it was replaced with a different URL
  const oldImage = product.image || '';
  if (body.image !== undefined && newImage !== oldImage) {
    const oldKey = r2KeyFromUrl(oldImage);
    if (oldKey) await deleteR2Object(oldKey, data.owner_id, env);
  }

  return json({ ...u, id: params.id, metadata: JSON.parse(u.metadata),
                in_stock: !!u.in_stock, visible: !!u.visible,
                weight_grams: u.weight_grams, width_cm: u.width_cm,
                height_cm: u.height_cm, depth_cm: u.depth_cm });
}

export async function onRequestDelete({ params, data, env }) {
  const product = await owned(params.id, data.owner_id, env);
  if (!product) return json({ error: 'Not found' }, 404);

  await env.DB.prepare(`
    DELETE FROM products
    WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)
  `).bind(params.id, data.owner_id).run();

  // Delete the product's R2 image
  const key = r2KeyFromUrl(product.image || '');
  if (key) await deleteR2Object(key, data.owner_id, env);

  return json({ ok: true });
}

function parseMeta(row) {
  try { row.metadata = JSON.parse(row.metadata); } catch { row.metadata = {}; }
  row.in_stock = !!row.in_stock;
  row.visible  = row.visible !== 0;
  row.category = row.category || '';
  return row;
}
