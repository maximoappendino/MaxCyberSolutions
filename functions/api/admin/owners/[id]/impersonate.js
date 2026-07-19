// POST /api/admin/owners/:id/impersonate
// Creates a short-lived token. Admin JS opens /api/auth/impersonate?t={token} in new tab.
import { json, uuid } from '../../../../_lib/helpers.js';

export async function onRequestPost({ params, env }) {
  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Not found' }, 404);

  const token = uuid();
  await env.DB.prepare(
    'INSERT INTO impersonation_tokens (id, owner_id) VALUES (?, ?)'
  ).bind(token, params.id).run();

  return json({ token });
}
