import { json, uuid } from '../../_lib/helpers.js';
import { hashPassword } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { email, password } = body ?? {};
  if (!email || !password)    return json({ error: 'email and password are required' }, 400);
  if (password.length < 8)    return json({ error: 'Password must be at least 8 characters' }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email)) return json({ error: 'Invalid email format' }, 400);

  const exists = await env.DB.prepare('SELECT id FROM owners WHERE email = ?')
    .bind(email.toLowerCase()).first();
  if (exists) return json({ error: 'Email already registered' }, 409);

  const { salt, hash } = await hashPassword(password);
  const id = uuid();

  await env.DB.prepare(
    'INSERT INTO owners (id, email, salt, hash) VALUES (?, ?, ?, ?)'
  ).bind(id, email.toLowerCase(), salt, hash).run();

  return json({ id, email: email.toLowerCase() }, 201);
}
