// GET /api/auth/verify-email?token=TOKEN
// Marks the account as verified, creates a session, and redirects to the dashboard.
import { uuid, sessionCookie } from '../../_lib/helpers.js';
import { createNotification } from '../../_lib/notifications.js';

const SESSION_TTL = 7 * 24 * 60 * 60;

export async function onRequestGet({ request, env }) {
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!token) return redirect('/dashboard/?verified=error');

  const owner = await env.DB.prepare(
    "SELECT id, email FROM owners WHERE email_verify_token = ? AND email_verify_expires > datetime('now') AND email_verified = 0"
  ).bind(token).first();

  if (!owner) {
    // Token invalid or already used — still redirect, dashboard shows context-appropriate message
    return redirect('/dashboard/?verified=error');
  }

  await env.DB.prepare(
    "UPDATE owners SET email_verified = 1, email_verify_token = NULL, email_verify_expires = NULL WHERE id = ?"
  ).bind(owner.id).run();

  // Create a welcome notification
  createNotification(env, {
    ownerId: owner.id,
    type:    'verify_email',
    title:   'Email verified',
    body:    'Your email address has been confirmed. You can now create your first store.',
    link:    '/dashboard/',
  }).catch(() => {});

  // Create session → auto-login
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);

  await env.DB.prepare(
    'INSERT INTO sessions (id, owner_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, owner.id, expiresAt).run();

  return new Response(null, {
    status: 302,
    headers: {
      'Location':   '/dashboard/?verified=1',
      'Set-Cookie': sessionCookie(sessionId, SESSION_TTL),
    },
  });
}

function redirect(url) {
  return new Response(null, { status: 302, headers: { 'Location': url } });
}
