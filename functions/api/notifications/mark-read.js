// POST /api/notifications/mark-read — mark one notification (by id) or all as read
import { json } from '../../_lib/helpers.js';

export async function onRequestPost({ request, data, env }) {
  let body;
  try { body = await request.json(); } catch { body = {}; }

  const { id } = body ?? {};

  if (id) {
    await env.DB.prepare(
      'UPDATE notifications SET read = 1 WHERE id = ? AND owner_id = ?'
    ).bind(id, data.owner_id).run();
  } else {
    await env.DB.prepare(
      'UPDATE notifications SET read = 1 WHERE owner_id = ?'
    ).bind(data.owner_id).run();
  }

  return json({ ok: true });
}
