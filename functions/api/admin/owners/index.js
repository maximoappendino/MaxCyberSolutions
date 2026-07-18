import { json } from '../../../_lib/helpers.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`
    SELECT
      o.id, o.email, o.name, o.brand, o.category, o.plan,
      o.phone, o.address, o.is_admin, o.status,
      o.product_limit, o.storage_limit_mb, o.storage_used_bytes, o.created_at,
      (SELECT COUNT(*) FROM stores s WHERE s.owner_id = o.id)                                       AS store_count,
      (SELECT COUNT(*) FROM products p JOIN stores s ON s.id = p.store_id WHERE s.owner_id = o.id)  AS product_count
    FROM owners o
    ORDER BY o.created_at DESC
  `).all();
  return json(results || []);
}
