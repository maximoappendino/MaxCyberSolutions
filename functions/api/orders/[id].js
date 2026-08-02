// GET  /api/orders/:id — fetch order + items (authenticated, owner only)
// PUT  /api/orders/:id — update order status (authenticated, owner only)
import { json } from '../../_lib/helpers.js';

async function ownedOrder(id, ownerId, env) {
  return env.DB.prepare(`
    SELECT o.* FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.id = ? AND s.owner_id = ?
  `).bind(id, ownerId).first();
}

export async function onRequestGet({ params, data, env }) {
  const order = await ownedOrder(params.id, data.owner_id, env);
  if (!order) return json({ error: 'Not found' }, 404);

  const { results: items } = await env.DB.prepare(
    'SELECT * FROM order_items WHERE order_id = ?'
  ).bind(params.id).all();

  return json({ ...order, items: items || [] });
}

export async function onRequestPut({ params, request, data, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const order = await ownedOrder(params.id, data.owner_id, env);
  if (!order) return json({ error: 'Not found' }, 404);

  const VALID = new Set(['pending', 'awaiting_transfer', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'confirmed']);
  const { status, notes, reservation_at, reservation_notes } = body ?? {};

  const sets = ["updated_at = datetime('now')"];
  const vals = [];

  if (status !== undefined) {
    if (!VALID.has(status)) return json({ error: 'Invalid status' }, 400);
    sets.push('status = ?'); vals.push(status);
  }
  if (notes !== undefined)             { sets.push('notes = ?');             vals.push(notes); }
  if (reservation_at !== undefined)    { sets.push('reservation_at = ?');    vals.push(reservation_at); }
  if (reservation_notes !== undefined) { sets.push('reservation_notes = ?'); vals.push(reservation_notes); }

  if (sets.length === 1) return json({ error: 'Nothing to update' }, 400);

  vals.push(params.id);
  await env.DB.prepare(
    `UPDATE orders SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...vals).run();

  return json({ ok: true, id: params.id, status: status ?? order.status });
}
