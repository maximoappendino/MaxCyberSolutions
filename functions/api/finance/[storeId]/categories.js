import { json, uuid } from '../../../_lib/helpers.js';
import { ownedStore, ensureDefaultCategories } from '../../../_lib/finance.js';

export async function onRequestGet({ params, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  await ensureDefaultCategories(params.storeId, env);
  const { results } = await env.DB.prepare(
    'SELECT * FROM finance_categories WHERE store_id = ? ORDER BY type DESC, name ASC'
  ).bind(params.storeId).all();
  return json(results || []);
}

export async function onRequestPost({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { name, type, color } = body ?? {};
  if (!name?.trim()) return json({ error: 'name is required' }, 400);
  if (!['income', 'expense'].includes(type)) return json({ error: 'type must be income or expense' }, 400);
  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO finance_categories (id, store_id, name, type, color) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, params.storeId, name.trim(), type, color || '#7a736a').run();
  return json({ id, name: name.trim(), type, color: color || '#7a736a', is_default: 0 }, 201);
}
