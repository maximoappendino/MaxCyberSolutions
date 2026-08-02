import { json } from '../../../../_lib/helpers.js';
import { ownedStore } from '../../../../_lib/finance.js';

async function ownedContact(contactId, storeId, env) {
  return env.DB.prepare(
    'SELECT * FROM finance_contacts WHERE id = ? AND store_id = ?'
  ).bind(contactId, storeId).first();
}

export async function onRequestGet({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  const contact = await ownedContact(params.contactId, params.storeId, env);
  if (!contact) return json({ error: 'Not found' }, 404);
  const url   = new URL(request.url);
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10));
  const page  = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

  const [balRow, { results: txs }] = await Promise.all([
    env.DB.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) AS balance,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expense
      FROM finance_transactions
      WHERE contact_id = ? AND store_id = ? AND status = 'posted'
    `).bind(params.contactId, params.storeId).first(),
    env.DB.prepare(`
      SELECT ft.*, fc.name AS category_name, fc.color AS category_color
      FROM finance_transactions ft
      LEFT JOIN finance_categories fc ON fc.id = ft.category_id
      WHERE ft.contact_id = ? AND ft.store_id = ?
      ORDER BY ft.occurred_at DESC, ft.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(params.contactId, params.storeId, limit, (page - 1) * limit).all(),
  ]);

  return json({ ...contact, ...balRow, transactions: txs || [] });
}

export async function onRequestPatch({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  const contact = await ownedContact(params.contactId, params.storeId, env);
  if (!contact) return json({ error: 'Not found' }, 404);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const FIELDS = ['name', 'contact_info', 'notes'];
  const sets = [], vals = [];
  for (const f of FIELDS) {
    if (body[f] !== undefined) { sets.push(`${f} = ?`); vals.push(body[f]); }
  }
  if (!sets.length) return json({ error: 'Nothing to update' }, 400);
  vals.push(params.contactId);
  await env.DB.prepare(`UPDATE finance_contacts SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ ok: true });
}

export async function onRequestDelete({ params, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  const contact = await ownedContact(params.contactId, params.storeId, env);
  if (!contact) return json({ error: 'Not found' }, 404);
  const inUse = await env.DB.prepare(
    'SELECT id FROM finance_transactions WHERE contact_id = ? LIMIT 1'
  ).bind(params.contactId).first();
  if (inUse) return json({ error: 'Contact has transactions — cannot delete' }, 409);
  await env.DB.prepare('DELETE FROM finance_contacts WHERE id = ?').bind(params.contactId).run();
  return json({ ok: true });
}
