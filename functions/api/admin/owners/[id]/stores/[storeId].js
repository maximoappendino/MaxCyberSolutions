// DELETE /api/admin/owners/:id/stores/:storeId — remove a store from a client account
import { json } from '../../../../../_lib/helpers.js';
import { deleteStoreImages } from '../../../../../_lib/storage.js';

export async function onRequestDelete({ params, env }) {
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.storeId, params.id).first();

  if (!store) return json({ error: 'Not found' }, 404);

  await deleteStoreImages(store.id, null, env);
  await env.DB.prepare('DELETE FROM stores WHERE id = ?').bind(params.storeId).run();

  return json({ ok: true });
}
