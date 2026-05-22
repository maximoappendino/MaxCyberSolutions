import { json, uuid } from '../_lib/helpers.js';

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

  const rawExt = (file.name || 'file').split('.').pop().toLowerCase();
  const ext    = /^[a-z0-9]{1,6}$/.test(rawExt) ? rawExt : 'bin';
  const key    = `stores/${storeId}/${uuid()}.${ext}`;

  await env.ASSETS_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  return json({ url: `/api/assets/${key}` });
}
