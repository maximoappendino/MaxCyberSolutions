import { json } from '../../../_lib/helpers.js';
import { deleteStoreImages } from '../../../_lib/storage.js';
import { hashPassword } from '../../../_lib/auth.js';

const PROFILE_FIELDS = [
  'name', 'brand', 'category', 'plan',
  'phone', 'address', 'description',
  'payment_method', 'payment_notes',
  'product_limit', 'storage_limit_mb',
  'status', 'role', 'email_verified', 'onboarded',
  'push_daily_limit', 'push_weekly_limit',
  'push_daily_used', 'push_weekly_used',
  'email_monthly_limit', 'email_monthly_used',
  'show_in_carousel',
];

export async function onRequestGet({ params, env }) {
  const owner = await env.DB.prepare(`
    SELECT
      o.id, o.email, o.name, o.brand, o.category, o.plan,
      o.phone, o.address, o.description,
      o.payment_method, o.payment_notes,
      o.is_admin, o.status,
      o.product_limit, o.storage_limit_mb, o.storage_used_bytes,
      o.push_daily_limit, o.push_weekly_limit,
      o.push_daily_used, o.push_weekly_used,
      o.push_daily_reset, o.push_weekly_reset,
      o.email_monthly_limit, o.email_monthly_used, o.email_monthly_reset,
      o.show_in_carousel,
      o.created_at,
      (SELECT COUNT(*) FROM products p JOIN stores s ON s.id = p.store_id WHERE s.owner_id = o.id) AS product_count
    FROM owners o
    WHERE o.id = ?
  `).bind(params.id).first();

  if (!owner) return json({ error: 'Not found' }, 404);

  const { results: stores } = await env.DB.prepare(
    'SELECT id, slug, name, store_type, created_at FROM stores WHERE owner_id = ? ORDER BY created_at DESC'
  ).bind(params.id).all();

  return json({ ...owner, stores: stores || [] });
}

export async function onRequestPut({ params, request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const sets = [];
  const vals = [];
  for (const key of PROFILE_FIELDS) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(body[key]);
    }
  }
  if (!sets.length) return json({ error: 'Nothing to update' }, 400);

  vals.push(params.id);
  await env.DB.prepare(
    `UPDATE owners SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...vals).run();

  return json({ ok: true });
}

export async function onRequestPatch({ params, request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { password } = body ?? {};
  if (!password || password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);

  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Not found' }, 404);

  const { salt, hash } = await hashPassword(password);
  await env.DB.prepare('UPDATE owners SET salt = ?, hash = ? WHERE id = ?').bind(salt, hash, params.id).run();
  return json({ ok: true });
}

export async function onRequestDelete({ params, data, env }) {
  if (params.id === data.owner_id) {
    return json({ error: 'Cannot delete your own account' }, 400);
  }

  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Not found' }, 404);

  // Clean up all R2 images for every store (ownerId=null skips the DB decrement)
  const { results: stores } = await env.DB.prepare(
    'SELECT id FROM stores WHERE owner_id = ?'
  ).bind(params.id).all();

  for (const store of stores || []) {
    await deleteStoreImages(store.id, null, env);
  }

  await env.DB.prepare('DELETE FROM owners WHERE id = ?').bind(params.id).run();
  return json({ ok: true });
}
