import { json } from '../../_lib/helpers.js';

export async function onRequest({ data, env, next }) {
  const owner = await env.DB.prepare(
    'SELECT is_admin FROM owners WHERE id = ?'
  ).bind(data.owner_id).first();

  if (!owner?.is_admin) return json({ error: 'Forbidden' }, 403);
  return next();
}
