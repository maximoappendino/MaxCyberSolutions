import { json } from '../../../_lib/helpers.js';
import { deleteR2Object } from '../../../_lib/storage.js';

export async function onRequestGet({ params, env, data }) {
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  const prefix  = `stores/${params.id}/`;
  const objects = [];
  let cursor;
  do {
    const listed = await env.ASSETS_BUCKET.list({ prefix, cursor });
    for (const obj of listed.objects) {
      objects.push({
        key:      obj.key,
        url:      `/api/assets/${obj.key}`,
        size:     obj.size,
        uploaded: obj.uploaded,
        name:     obj.key.replace(prefix, ''),
      });
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  objects.sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));
  return json({ images: objects });
}

export async function onRequestDelete({ params, request, env, data }) {
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { key } = body ?? {};
  if (!key || !key.startsWith(`stores/${params.id}/`)) return json({ error: 'Invalid key' }, 400);

  await deleteR2Object(key, data.owner_id, env);
  return json({ ok: true });
}
