import { json } from '../_lib/helpers.js';

export async function onRequestGet({ data, env }) {
  const owner = await env.DB.prepare(
    'SELECT id, email, name, brand, is_admin, product_limit, storage_limit_mb, storage_used_bytes, onboarded FROM owners WHERE id = ?'
  ).bind(data.owner_id).first();
  if (!owner) return json({ error: 'Not found' }, 404);
  return json({
    id:                 owner.id,
    email:              owner.email,
    name:               owner.name || '',
    brand:              owner.brand || '',
    is_admin:           !!owner.is_admin,
    product_limit:      owner.product_limit ?? 50,
    storage_limit_mb:   owner.storage_limit_mb ?? 100,
    storage_used_bytes: owner.storage_used_bytes ?? 0,
    onboarded:          owner.onboarded ?? 1,
  });
}
