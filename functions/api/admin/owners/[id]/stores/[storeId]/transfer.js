// POST /api/admin/owners/:id/stores/:storeId/transfer
// type=complete: move entire store to target owner
// type=partial:  give slug to target owner (new empty store); original store gets a temp slug
import { json, uuid } from '../../../../../../_lib/helpers.js';

async function measureStoreBytes(storeId, env) {
  let total = 0, cursor;
  do {
    const listed = await env.ASSETS_BUCKET.list({ prefix: `stores/${storeId}/`, cursor });
    for (const obj of listed.objects) total += obj.size;
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return total;
}

export async function onRequestPost({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { target_owner_id, type } = body ?? {};
  if (!target_owner_id) return json({ error: 'target_owner_id is required' }, 400);
  if (!['complete', 'partial'].includes(type)) return json({ error: 'type must be complete or partial' }, 400);

  const store = await env.DB.prepare(
    'SELECT id, slug, name, config FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.storeId, params.id).first();
  if (!store) return json({ error: 'Source store not found' }, 404);

  const target = await env.DB.prepare(
    'SELECT id FROM owners WHERE id = ?'
  ).bind(target_owner_id).first();
  if (!target) return json({ error: 'Target owner not found' }, 404);

  if (params.id === target_owner_id) return json({ error: 'Source and target owner are the same' }, 400);

  if (type === 'complete') {
    // Measure store's R2 footprint before moving
    const storeBytes = await measureStoreBytes(store.id, env).catch(() => 0);

    await env.DB.prepare(
      'UPDATE stores SET owner_id = ? WHERE id = ?'
    ).bind(target_owner_id, store.id).run();

    // Transfer storage accounting: subtract from source, add to target
    if (storeBytes > 0) {
      await Promise.all([
        env.DB.prepare(
          'UPDATE owners SET storage_used_bytes = MAX(0, storage_used_bytes - ?) WHERE id = ?'
        ).bind(storeBytes, params.id).run(),
        env.DB.prepare(
          'UPDATE owners SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?'
        ).bind(storeBytes, target_owner_id).run(),
      ]);
    }

    return json({ ok: true, type: 'complete', slug: store.slug, bytes_transferred: storeBytes });
  }

  // Partial: target gets a new empty store at this slug; original gets a temp slug
  const originalSlug = store.slug;
  const tempSlug = `${originalSlug}-old-${Date.now().toString(36)}`;

  // Rename original store's slug so the target can claim it
  await env.DB.prepare('UPDATE stores SET slug = ? WHERE id = ?').bind(tempSlug, store.id).run();

  // Create new empty store under target with original slug
  const newId = uuid();
  const newName = store.name || originalSlug;
  const defaultConfig = JSON.stringify({
    name: newName,
    theme:    { accent: '#e2a14a', dark: false },
    seo:      { title: newName, description: '' },
    features: { hasInventoryTracking: false, hasNewsletterPopup: false, hasDiscountCountdown: false },
  });

  await env.DB.prepare(
    'INSERT INTO stores (id, slug, owner_id, name, config) VALUES (?, ?, ?, ?, ?)'
  ).bind(newId, originalSlug, target_owner_id, newName, defaultConfig).run();

  return json({ ok: true, type: 'partial', new_store_id: newId, original_temp_slug: tempSlug });
}
