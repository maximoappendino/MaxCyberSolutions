import { json, uuid } from '../../../_lib/helpers.js';

// Admin-only icon management.
// GET  /api/admin/icons        — list all icons
// POST /api/admin/icons        — upload new icon (multipart, field: file)
// DELETE /api/admin/icons      — delete icon (body: { key })

export async function onRequestGet({ env }) {
  const listed = await env.ASSETS_BUCKET.list({ prefix: 'icons/' });
  const icons = listed.objects
    .filter(o => o.size > 0)
    .map(o => ({
      key:  o.key,
      name: o.key.replace('icons/', ''),
      url:  `/api/assets/${o.key}`,
      size: o.size,
    }));
  return json({ icons });
}

export async function onRequestPost({ request, env }) {
  let formData;
  try { formData = await request.formData(); }
  catch { return json({ error: 'Expected multipart/form-data' }, 400); }

  const file = formData.get('file');
  if (!file || typeof file.arrayBuffer !== 'function')
    return json({ error: 'No file provided' }, 400);

  const rawExt = (file.name || 'icon').split('.').pop().toLowerCase();
  const ext    = /^(png|jpg|jpeg|gif|svg|webp|ico)$/.test(rawExt) ? rawExt : 'png';
  const name   = (file.name || 'icon').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '');
  const key    = `icons/${name}-${uuid().slice(0,8)}.${ext}`;

  const buffer = await file.arrayBuffer();
  await env.ASSETS_BUCKET.put(key, buffer, {
    httpMetadata: { contentType: file.type || 'image/png' },
  });

  return json({ key, url: `/api/assets/${key}`, name: key.replace('icons/', '') }, 201);
}

export async function onRequestDelete({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { key } = body ?? {};
  if (!key || !key.startsWith('icons/')) return json({ error: 'Invalid key' }, 400);
  await env.ASSETS_BUCKET.delete(key);
  return json({ ok: true });
}
