import { json } from '../../../../../_lib/helpers.js';
import { hashPassword } from '../../../../../_lib/auth.js';

export async function onRequestDelete({ params, env }) {
  const col = await env.DB.prepare(
    'SELECT id FROM collaborators WHERE id = ? AND owner_id = ?'
  ).bind(params.colId, params.id).first();
  if (!col) return json({ error: 'Not found' }, 404);

  await env.DB.prepare('DELETE FROM collaborators WHERE id = ?').bind(params.colId).run();
  return json({ ok: true });
}

export async function onRequestPatch({ params, request, env }) {
  const col = await env.DB.prepare(
    'SELECT id FROM collaborators WHERE id = ? AND owner_id = ?'
  ).bind(params.colId, params.id).first();
  if (!col) return json({ error: 'Not found' }, 404);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { password } = body ?? {};
  if (!password || password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400);

  const { salt, hash } = await hashPassword(password);
  await env.DB.prepare('UPDATE collaborators SET salt = ?, hash = ?, plain_password = ? WHERE id = ?').bind(salt, hash, password, params.colId).run();
  return json({ ok: true });
}
