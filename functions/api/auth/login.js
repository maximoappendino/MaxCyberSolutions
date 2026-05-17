import { json, uuid, sessionCookie } from '../../_lib/helpers.js';
import { verifyPassword } from '../../_lib/auth.js';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { email, password } = body ?? {};
  if (!email || !password) return json({ error: 'email and password are required' }, 400);

  const owner = await env.DB.prepare('SELECT * FROM owners WHERE email = ?')
    .bind(email.toLowerCase()).first();

  // Always verify to prevent user enumeration via timing
  if (!owner) {
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    return json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await verifyPassword(password, owner.salt, owner.hash);
  if (!valid) return json({ error: 'Invalid credentials' }, 401);

  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);

  await env.DB.prepare(
    'INSERT INTO sessions (id, owner_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, owner.id, expiresAt).run();

  return new Response(JSON.stringify({ id: owner.id, email: owner.email }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookie(sessionId, SESSION_TTL_SECONDS),
    },
  });
}
