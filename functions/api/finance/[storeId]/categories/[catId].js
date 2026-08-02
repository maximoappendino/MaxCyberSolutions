import { json } from '../../../../_lib/helpers.js';
import { ownedStore } from '../../../../_lib/finance.js';

async function ownedCat(catId, storeId, env) {
  return env.DB.prepare(
    'SELECT id FROM finance_categories WHERE id = ? AND store_id = ?'
  ).bind(catId, storeId).first();
}

export async function onRequestPut({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  const cat = await ownedCat(params.catId, params.storeId, env);
  if (!cat) return json({ error: 'Not found' }, 404);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { name, color } = body ?? {};
  const sets = [], vals = [];
  if (name?.trim()) { sets.push('name = ?'); vals.push(name.trim()); }
  if (color)        { sets.push('color = ?'); vals.push(color); }
  if (!sets.length) return json({ error: 'Nothing to update' }, 400);
  vals.push(params.catId);
  await env.DB.prepare(`UPDATE finance_categories SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

export async function onRequestDelete({ params, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  const cat = await ownedCat(params.catId, params.storeId, env);
  if (!cat) return json({ error: 'Not found' }, 404);
  const inUse = await env.DB.prepare(
    'SELECT id FROM finance_transactions WHERE category_id = ? LIMIT 1'
  ).bind(params.catId).first();
  if (inUse) return json({ error: 'Category has transactions — cannot delete' }, 409);
  await env.DB.prepare('DELETE FROM finance_categories WHERE id = ?').bind(params.catId).run();
  return json({ ok: true });
}
