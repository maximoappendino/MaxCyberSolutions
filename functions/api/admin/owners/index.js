import { json, uuid } from '../../../_lib/helpers.js';
import { hashPassword } from '../../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { email, password, name } = body ?? {};
  if (!email || !password) return json({ error: 'email and password are required' }, 400);
  if (password.length < 6)  return json({ error: 'Password must be at least 6 characters' }, 400);

  const existing = await env.DB.prepare('SELECT id FROM owners WHERE email = ?')
    .bind(email.toLowerCase().trim()).first();
  if (existing) return json({ error: 'Email already in use' }, 409);

  const { salt, hash } = await hashPassword(password);
  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO owners (id, email, salt, hash, plain_password, name, plan, product_limit, storage_limit_mb, role, email_verified, onboarded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email.toLowerCase().trim(), salt, hash, password, (name || '').trim(), 'basic', 50, 100, 'owner', 1, 1).run();

  return json({ id, email: email.toLowerCase().trim() }, 201);
}

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
