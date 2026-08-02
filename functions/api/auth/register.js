import { json, uuid, sessionCookie } from '../../_lib/helpers.js';
import { hashPassword } from '../../_lib/auth.js';
import { rateLimit } from '../../_lib/ratelimit.js';
import { sendPlatformEmail, emailVerify } from '../../_lib/email.js';

const SESSION_TTL = 7 * 24 * 60 * 60;

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ok = await rateLimit(env, `register:${ip}`, 5);
  if (!ok) return json({ error: 'Too many attempts — try again in a minute' }, 429);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { email, password } = body ?? {};
  if (!email || !password)                  return json({ error: 'email and password are required' }, 400);
  if (password.length < 8)                  return json({ error: 'Password must be at least 8 characters' }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email))        return json({ error: 'Invalid email format' }, 400);

  const normalEmail = email.toLowerCase().trim();

  const exists = await env.DB.prepare('SELECT id FROM owners WHERE email = ?').bind(normalEmail).first();
  if (exists) return json({ error: 'Email already registered' }, 409);

  const { salt, hash } = await hashPassword(password);
  const id = uuid();

  // Generate 32-hex verification token valid for 24 hours
  const tokenBytes  = new Uint8Array(16);
  crypto.getRandomValues(tokenBytes);
  const verifyToken   = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);

  await env.DB.prepare(
    'INSERT INTO owners (id, email, salt, hash, role, email_verified, email_verify_token, email_verify_expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, normalEmail, salt, hash, 'client', 0, verifyToken, verifyExpires).run();

  // Send verification email (best-effort — don't fail registration if it errors)
  const base      = env.PUBLIC_URL || 'https://maxcybersolutions.online';
  const verifyUrl = `${base}/api/auth/verify-email?token=${verifyToken}`;
  sendPlatformEmail(env, {
    to:      normalEmail,
    subject: 'Verify your MaxCyberSolutions email',
    html:    emailVerify({ verifyUrl }),
  }).catch(() => {});

  // Auto-login so the user lands directly in the dashboard
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);
  await env.DB.prepare(
    'INSERT INTO sessions (id, owner_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, id, expiresAt).run();

  return new Response(JSON.stringify({ id, email: normalEmail, email_verified: false }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie':   sessionCookie(sessionId, SESSION_TTL),
    },
  });
}
