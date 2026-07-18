import { json } from '../../../../_lib/helpers.js';
import { deleteStoreImages } from '../../../../_lib/storage.js';

// POST /api/admin/owners/:id/archive
// Deletes all R2 images for the owner's stores, clears product image fields,
// resets storage counter to 0, and sets status = 'archived'.
// The owner's data (products, store config, etc.) is preserved — they can resume later.
export async function onRequestPost({ params, data, env }) {
  if (params.id === data.owner_id) {
    return json({ error: 'Cannot archive your own account' }, 400);
  }

  const owner = await env.DB.prepare(
    'SELECT id, is_admin FROM owners WHERE id = ?'
  ).bind(params.id).first();
  if (!owner) return json({ error: 'Not found' }, 404);
  if (owner.is_admin) return json({ error: 'Cannot archive an admin account' }, 400);

  const { results: stores } = await env.DB.prepare(
    'SELECT id FROM stores WHERE owner_id = ?'
  ).bind(params.id).all();

  let totalFreed = 0;
  for (const store of stores || []) {
    // Delete all R2 images (pass ownerId=null — we update storage_used_bytes manually below)
    totalFreed += await deleteStoreImages(store.id, null, env);

    // Clear image URLs on all products in this store
    await env.DB.prepare(
      "UPDATE products SET image = '' WHERE store_id = ?"
    ).bind(store.id).run();
  }

  // Reset storage counter and mark as archived
  await env.DB.prepare(
    "UPDATE owners SET storage_used_bytes = 0, status = 'archived' WHERE id = ?"
  ).bind(params.id).run();

  return json({ ok: true, bytes_freed: totalFreed });
}
