import { json } from '../_lib/helpers.js';

export async function onRequestGet({ data, env }) {
  const owner = await env.DB.prepare('SELECT id, email FROM owners WHERE id = ?')
    .bind(data.owner_id).first();
  if (!owner) return json({ error: 'Not found' }, 404);
  return json({ id: owner.id, email: owner.email });
}
