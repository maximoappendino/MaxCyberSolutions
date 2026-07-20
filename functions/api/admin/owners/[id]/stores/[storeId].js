// Admin store management: update type (PUT), edit slug (PATCH), delete (DELETE)
import { json } from '../../../../../_lib/helpers.js';

const VALID_TYPES = new Set(['ecommerce', 'services', 'memberships', 'reservations']);

export async function onRequestPut({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { store_type } = body ?? {};
  if (!store_type || !VALID_TYPES.has(store_type)) {
    return json({ error: 'store_type must be one of: ecommerce, services, memberships, reservations' }, 400);
  }

  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.storeId, params.id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  await env.DB.prepare('UPDATE stores SET store_type = ? WHERE id = ?').bind(store_type, params.storeId).run();
  return json({ ok: true, store_type });
}
import { deleteStoreImages } from '../../../../../_lib/storage.js';

export async function onRequestPatch({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { slug } = body ?? {};
  if (!slug) return json({ error: 'slug is required' }, 400);
  if (!/^[a-z0-9-]{2,48}$/.test(slug)) {
    return json({ error: 'slug must be 2–48 chars: lowercase letters, numbers, hyphens' }, 400);
  }

  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.storeId, params.id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  const conflict = await env.DB.prepare(
    'SELECT id FROM stores WHERE slug = ? AND id != ?'
  ).bind(slug, params.storeId).first();
  if (conflict) return json({ error: 'Slug already taken' }, 409);

  await env.DB.prepare('UPDATE stores SET slug = ? WHERE id = ?').bind(slug, params.storeId).run();
  return json({ ok: true, slug });
}

export async function onRequestDelete({ params, env }) {
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.storeId, params.id).first();

  if (!store) return json({ error: 'Not found' }, 404);

  await deleteStoreImages(store.id, null, env);
  await env.DB.prepare('DELETE FROM stores WHERE id = ?').bind(params.storeId).run();

  return json({ ok: true });
}
