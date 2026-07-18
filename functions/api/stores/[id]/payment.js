// GET /api/stores/:id/payment  — fetch store payment & shipping settings
// PUT /api/stores/:id/payment  — update those settings
import { json } from '../../../_lib/helpers.js';

export async function onRequestGet({ params, data, env }) {
  const row = await env.DB.prepare(`
    SELECT mp_public_key, mp_access_token, cbu_cvu, bank_name, bank_holder,
           store_address, store_zip, store_city, store_province,
           whatsapp_number, whatsapp_message
    FROM stores WHERE id = ? AND owner_id = ?
  `).bind(params.id, data.owner_id).first();

  if (!row) return json({ error: 'Not found' }, 404);
  // Never send the access token to the browser
  const safe = { ...row, mp_access_token: row.mp_access_token ? '••••••••' : '' };
  return json(safe);
}

export async function onRequestPut({ params, request, data, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  const allowed = ['mp_public_key', 'mp_access_token', 'cbu_cvu', 'bank_name', 'bank_holder',
                   'store_address', 'store_zip', 'store_city', 'store_province',
                   'whatsapp_number', 'whatsapp_message'];
  const sets = [];
  const vals = [];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      sets.push(`${key} = ?`);
      vals.push(String(body[key]).trim());
    }
  }

  if (!sets.length) return json({ error: 'No fields to update' }, 400);

  vals.push(params.id, data.owner_id);
  await env.DB.prepare(
    `UPDATE stores SET ${sets.join(', ')} WHERE id = ? AND owner_id = ?`
  ).bind(...vals).run();

  return json({ ok: true });
}
