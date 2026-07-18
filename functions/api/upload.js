import { json, uuid } from '../_lib/helpers.js';
import { checkStorageLimit, checkOwnerActive } from '../_lib/storage.js';

export async function onRequestPost({ request, env, data }) {
  let formData;
  try { formData = await request.formData(); }
  catch { return json({ error: 'Expected multipart/form-data' }, 400); }

  const file    = formData.get('file');
  const storeId = formData.get('store_id');

  if (!file || typeof file.arrayBuffer !== 'function')
    return json({ error: 'No file provided' }, 400);
  if (!storeId)
    return json({ error: 'store_id is required' }, 400);

  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(storeId, data.owner_id).first();
  if (!store) return json({ error: 'Store not found' }, 404);

  const activeCheck = await checkOwnerActive(data.owner_id, env);
  if (!activeCheck.ok) return json({ error: activeCheck.error }, 403);

  const buffer   = await file.arrayBuffer();
  const fileSize = buffer.byteLength;

  const limitCheck = await checkStorageLimit(data.owner_id, fileSize, env);
  if (!limitCheck.ok) return json({ error: limitCheck.error }, 403);

  const rawExt = (file.name || 'file').split('.').pop().toLowerCase();
  const ext    = /^[a-z0-9]{1,6}$/.test(rawExt) ? rawExt : 'bin';
  const key    = `stores/${storeId}/${uuid()}.${ext}`;

  await env.ASSETS_BUCKET.put(key, buffer, {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  await env.DB.prepare(
    'UPDATE owners SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?'
  ).bind(fileSize, data.owner_id).run();

  return json({ url: `/api/assets/${key}` });
}
