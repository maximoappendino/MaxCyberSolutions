import { json, uuid } from '../../../../../_lib/helpers.js';
import { hashPassword } from '../../../../../_lib/auth.js';

export async function onRequestGet({ params, env }) {
  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Not found' }, 404);

  const { results } = await env.DB.prepare(
    'SELECT id, email, created_at FROM collaborators WHERE owner_id = ? ORDER BY created_at ASC'
  ).bind(params.id).all();

  return json(results || []);
}

export async function onRequestPost({ params, request, env }) {
  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Not found' }, 404);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { email, password } = body ?? {};
  if (!email || !password)  return json({ error: 'email and password are required' }, 400);
  if (password.length < 6)  return json({ error: 'Password must be at least 6 characters' }, 400);

  const normalEmail = email.toLowerCase().trim();

  const ownerConflict = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(normalEmail).first();
  if (ownerConflict) return json({ error: 'Email already in use by an owner account' }, 409);

  const colConflict = await env.DB.prepare('SELECT id FROM collaborators WHERE email = ?').bind(normalEmail).first();
  if (colConflict) return json({ error: 'Email already in use' }, 409);

  const { salt, hash } = await hashPassword(password);
  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO collaborators (id, owner_id, email, salt, hash) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, params.id, normalEmail, salt, hash).run();

  return json({ id, email: normalEmail }, 201);
}
