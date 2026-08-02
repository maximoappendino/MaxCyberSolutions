// GET /api/stores/:id/orders — authenticated, returns orders for a store the owner controls
import { json } from '../../../_lib/helpers.js';

export async function onRequestGet({ params, request, data, env }) {
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  const url    = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  const type   = url.searchParams.get('type')   || '';
  const limit  = Math.min(500, parseInt(url.searchParams.get('limit') || '50', 10));

  let query  = 'SELECT * FROM orders WHERE store_id = ?';
  const bind = [params.id];
  if (status) { query += ' AND status = ?'; bind.push(status); }
  if (type)   { query += ' AND order_type = ?'; bind.push(type); }
  query += ' ORDER BY created_at DESC LIMIT ?';
  bind.push(limit);

  const { results } = await env.DB.prepare(query).bind(...bind).all();
  return json(results || []);
}
