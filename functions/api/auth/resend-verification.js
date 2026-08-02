// POST /api/auth/resend-verification
// Regenerates and resends the email verification link. Rate-limited to 1 per 5 min per email.
import { json } from '../../_lib/helpers.js';
import { rateLimit } from '../../_lib/ratelimit.js';
import { sendPlatformEmail, emailVerify } from '../../_lib/email.js';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const email = (body?.email || '').toLowerCase().trim();
  if (!email) return json({ error: 'email required' }, 400);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ok = await rateLimit(env, `resend-verify:${ip}:${email}`, 1);
  if (!ok) return json({ error: 'Please wait a few minutes before requesting another link' }, 429);

  const owner = await env.DB.prepare(
    'SELECT id, email_verified FROM owners WHERE email = ?'
  ).bind(email).first();

  // Return 200 in all cases to prevent email enumeration
  if (!owner || owner.email_verified) return json({ ok: true });

  const tokenBytes    = new Uint8Array(16);
  crypto.getRandomValues(tokenBytes);
  const verifyToken   = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);

  await env.DB.prepare(
    'UPDATE owners SET email_verify_token = ?, email_verify_expires = ? WHERE id = ?'
  ).bind(verifyToken, verifyExpires, owner.id).run();

  const base      = env.PUBLIC_URL || 'https://maxcybersolutions.online';
  const verifyUrl = `${base}/api/auth/verify-email?token=${verifyToken}`;

  sendPlatformEmail(env, {
    to:      email,
    subject: 'Verify your MaxCyberSolutions email',
    html:    emailVerify({ verifyUrl }),
  }).catch(() => {});

  return json({ ok: true });
}
