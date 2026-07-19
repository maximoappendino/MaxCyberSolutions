// GET /api/auth/impersonate?t={token}
// Validates a one-time admin impersonation token, creates a real session,
// sets the session cookie, and redirects to /dashboard/.
import { uuid, sessionCookie } from '../../_lib/helpers.js';

const SESSION_TTL = 8 * 60 * 60; // 8 hours

export async function onRequestGet({ request, env }) {
  const url   = new URL(request.url);
  const token = url.searchParams.get('t');
  if (!token) return new Response('Missing token', { status: 400 });

  const row = await env.DB.prepare(`
    SELECT id, owner_id, created_at, used
    FROM impersonation_tokens
    WHERE id = ?
  `).bind(token).first();

  if (!row || row.used) {
    return new Response('Invalid or expired impersonation token', { status: 403 });
  }

  // Expire tokens older than 5 minutes
  const ageMs = Date.now() - new Date(row.created_at + 'Z').getTime();
  if (ageMs > 5 * 60 * 1000) {
    return new Response('Impersonation token has expired', { status: 403 });
  }

  // Mark token as used
  await env.DB.prepare('UPDATE impersonation_tokens SET used = 1 WHERE id = ?').bind(token).run();

  // Create a real session for the target owner
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);

  await env.DB.prepare(
    'INSERT INTO sessions (id, owner_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, row.owner_id, expiresAt).run();

  return new Response(null, {
    status: 302,
    headers: {
      Location:    '/dashboard/',
      'Set-Cookie': sessionCookie(sessionId, SESSION_TTL),
    },
  });
}
