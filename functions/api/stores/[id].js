import { json } from '../../_lib/helpers.js';

export async function onRequestGet({ params, data, env }) {
  const store = await env.DB.prepare(
    'SELECT id, slug, name, config, created_at FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();

  if (!store) return json({ error: 'Not found' }, 404);
  try { store.config = JSON.parse(store.config); } catch { store.config = {}; }
  return json(store);
}

export async function onRequestPut({ params, request, data, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const row = await env.DB.prepare(
    'SELECT config FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!row) return json({ error: 'Not found' }, 404);

  let current;
  try { current = JSON.parse(row.config); } catch { current = {}; }

  const { name, config } = body ?? {};

  // Deep-merge features so callers can toggle individual flags without overwriting others
  const updated = config
    ? {
        ...current,
        ...config,
        features: { ...(current.features || {}), ...(config.features || {}) },
        theme:    { ...(current.theme    || {}), ...(config.theme    || {}) },
        seo:      { ...(current.seo      || {}), ...(config.seo      || {}) },
      }
    : current;

  const updatedName = name ?? (current.name || '');
  if (name) updated.name = name;

  await env.DB.prepare(
    'UPDATE stores SET name = ?, config = ? WHERE id = ? AND owner_id = ?'
  ).bind(updatedName, JSON.stringify(updated), params.id, data.owner_id).run();

  return json({ id: params.id, name: updatedName, config: updated });
}

export async function onRequestDelete({ params, data, env }) {
  const result = await env.DB.prepare(
    'DELETE FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).run();

  if (!result.meta?.changes) return json({ error: 'Not found' }, 404);
  return json({ ok: true });
}
