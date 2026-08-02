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

  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.storeId, params.id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  const sets = [];
  const vals = [];

  if (body.slug !== undefined) {
    const { slug } = body;
    if (!slug || !/^[a-z0-9-]{2,48}$/.test(slug)) {
      return json({ error: 'slug must be 2–48 chars: lowercase letters, numbers, hyphens' }, 400);
    }
    const conflict = await env.DB.prepare(
      'SELECT id FROM stores WHERE slug = ? AND id != ?'
    ).bind(slug, params.storeId).first();
    if (conflict) return json({ error: 'Slug already taken' }, 409);
    sets.push('slug = ?'); vals.push(slug);
  }

  if (body.show_in_carousel !== undefined) {
    sets.push('show_in_carousel = ?'); vals.push(body.show_in_carousel ? 1 : 0);
  }

  if (!sets.length) return json({ error: 'Nothing to update' }, 400);
  vals.push(params.storeId);
  await env.DB.prepare(`UPDATE stores SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
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
