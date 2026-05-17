import { json, getCookie } from '../_lib/helpers.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Auth endpoints are public — skip session check
  if (url.pathname.startsWith('/api/auth/')) {
    return next();
  }

  const sessionId = getCookie(request, 'session_id');
  if (!sessionId) return json({ error: 'Unauthorized' }, 401);

  const session = await env.DB.prepare(
    "SELECT owner_id FROM sessions WHERE id = ? AND expires_at > datetime('now')"
  ).bind(sessionId).first();

  if (!session) return json({ error: 'Unauthorized' }, 401);

  context.data.owner_id = session.owner_id;
  return next();
}
