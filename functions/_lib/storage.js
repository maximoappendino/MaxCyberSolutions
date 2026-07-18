// R2 cleanup and limit enforcement helpers.

// Extract the R2 key from an internal asset URL.
export function r2KeyFromUrl(url) {
  const prefix = '/api/assets/';
  if (typeof url === 'string' && url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}

// Delete one R2 object and decrement the owner's storage counter.
// Returns the number of bytes freed.
export async function deleteR2Object(key, ownerId, env) {
  if (!key) return 0;
  try {
    const obj = await env.ASSETS_BUCKET.head(key);
    if (!obj) return 0;
    const bytes = obj.size;
    await env.ASSETS_BUCKET.delete(key);
    if (ownerId) {
      await env.DB.prepare(
        'UPDATE owners SET storage_used_bytes = MAX(0, storage_used_bytes - ?) WHERE id = ?'
      ).bind(bytes, ownerId).run();
    }
    return bytes;
  } catch {
    return 0;
  }
}

// Delete all R2 objects under stores/{storeId}/ and decrement owner storage.
// Pass ownerId = null to skip the DB decrement (e.g., when deleting the owner).
export async function deleteStoreImages(storeId, ownerId, env) {
  const keys = [];
  let totalBytes = 0;
  let cursor;

  do {
    const listed = await env.ASSETS_BUCKET.list({ prefix: `stores/${storeId}/`, cursor });
    for (const obj of listed.objects) {
      keys.push(obj.key);
      totalBytes += obj.size;
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  if (keys.length === 0) return 0;

  for (let i = 0; i < keys.length; i += 1000) {
    await env.ASSETS_BUCKET.delete(keys.slice(i, i + 1000));
  }

  if (ownerId && totalBytes > 0) {
    await env.DB.prepare(
      'UPDATE owners SET storage_used_bytes = MAX(0, storage_used_bytes - ?) WHERE id = ?'
    ).bind(totalBytes, ownerId).run();
  }

  return totalBytes;
}

// Check whether ownerId can upload newBytes more of data.
export async function checkStorageLimit(ownerId, newBytes, env) {
  const owner = await env.DB.prepare(
    'SELECT storage_used_bytes, storage_limit_mb FROM owners WHERE id = ?'
  ).bind(ownerId).first();
  if (!owner) return { ok: false, error: 'Owner not found' };
  const limitBytes = (owner.storage_limit_mb ?? 100) * 1024 * 1024;
  const used = owner.storage_used_bytes ?? 0;
  if (used + newBytes > limitBytes) {
    const usedMb = (used / 1048576).toFixed(1);
    const limMb  = owner.storage_limit_mb ?? 100;
    return { ok: false, error: `Storage limit reached (${usedMb} MB of ${limMb} MB used). Contact your administrator to upgrade your plan.` };
  }
  return { ok: true };
}

// Check whether the owner's account is active (not paused or archived).
export async function checkOwnerActive(ownerId, env) {
  const owner = await env.DB.prepare(
    'SELECT status FROM owners WHERE id = ?'
  ).bind(ownerId).first();
  const status = owner?.status ?? 'active';
  if (status !== 'active') {
    return { ok: false, error: 'Your account is currently suspended. Please contact your administrator.' };
  }
  return { ok: true };
}

// Check whether ownerId can create another product (across all their stores).
export async function checkProductLimit(ownerId, env) {
  const owner = await env.DB.prepare(
    'SELECT product_limit FROM owners WHERE id = ?'
  ).bind(ownerId).first();
  const limit = owner?.product_limit ?? 50;
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS cnt FROM products p
     JOIN stores s ON s.id = p.store_id
     WHERE s.owner_id = ?`
  ).bind(ownerId).first();
  const count = row?.cnt ?? 0;
  if (count >= limit) {
    return { ok: false, error: `Product limit reached (${count}/${limit} items). Contact your administrator to upgrade your plan.` };
  }
  return { ok: true };
}
