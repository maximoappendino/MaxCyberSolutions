// GET /api/notifications — list recent notifications for the authenticated owner
import { json } from '../../_lib/helpers.js';

export async function onRequestGet({ data, env, request }) {
  const url    = new URL(request.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit') || '30', 10), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const rows = await env.DB.prepare(
    `SELECT id, type, title, body, link, read, created_at
     FROM notifications
     WHERE owner_id = ?
     ORDER BY read ASC, created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(data.owner_id, limit, offset).all();

  const unread = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM notifications WHERE owner_id = ? AND read = 0'
  ).bind(data.owner_id).first();

  return json({
    notifications: rows.results || [],
    unread_count:  unread?.n ?? 0,
  });
}
