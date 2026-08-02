// POST /api/admin/owners/:id/recalculate-storage
// Measures actual R2 usage for all of an owner's stores and corrects storage_used_bytes.
import { json } from '../../../../_lib/helpers.js';

export async function onRequestPost({ params, env }) {
  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Not found' }, 404);

  const { results: stores } = await env.DB.prepare(
    'SELECT id FROM stores WHERE owner_id = ?'
  ).bind(params.id).all();

  let totalBytes = 0;
  for (const store of stores || []) {
    let cursor;
    do {
      const listed = await env.ASSETS_BUCKET.list({ prefix: `stores/${store.id}/`, cursor });
      for (const obj of listed.objects) totalBytes += obj.size;
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  }

  await env.DB.prepare(
    'UPDATE owners SET storage_used_bytes = ? WHERE id = ?'
  ).bind(totalBytes, params.id).run();

  return json({ ok: true, storage_used_bytes: totalBytes, store_count: (stores || []).length });
}
