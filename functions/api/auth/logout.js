import { getCookie, sessionCookie } from '../../_lib/helpers.js';

export async function onRequestPost({ request, env }) {
  const sessionId = getCookie(request, 'session_id');
  if (sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookie('', 0),
    },
  });
}
