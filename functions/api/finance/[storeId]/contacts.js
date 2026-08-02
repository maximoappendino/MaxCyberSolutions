import { json, uuid } from '../../../_lib/helpers.js';
import { ownedStore } from '../../../_lib/finance.js';

export async function onRequestGet({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  const url  = new URL(request.url);
  const type = url.searchParams.get('type') || '';
  let query  = `
    SELECT
      fc.*,
      COALESCE(SUM(CASE WHEN ft.type='income'  THEN ft.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN ft.type='expense' THEN ft.amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(CASE WHEN ft.type='income'  THEN ft.amount ELSE -ft.amount END), 0) AS balance,
      MAX(ft.occurred_at) AS last_tx_date,
      COUNT(ft.id) AS tx_count
    FROM finance_contacts fc
    LEFT JOIN finance_transactions ft
      ON ft.contact_id = fc.id AND ft.store_id = fc.store_id AND ft.status = 'posted'
    WHERE fc.store_id = ?
  `;
  const bind = [params.storeId];
  if (type) { query += ' AND fc.type = ?'; bind.push(type); }
  query += ' GROUP BY fc.id ORDER BY fc.name ASC';
  const { results } = await env.DB.prepare(query).bind(...bind).all();
  return json(results || []);
}

export async function onRequestPost({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { type, name, contact_info, notes } = body ?? {};
  if (!name?.trim()) return json({ error: 'name is required' }, 400);
  if (!['client', 'provider'].includes(type)) return json({ error: 'type must be client or provider' }, 400);
  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO finance_contacts (id, store_id, type, name, contact_info, notes) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, params.storeId, type, name.trim(), contact_info || null, notes || null).run();
  return json({ id, type, name: name.trim(), contact_info, notes }, 201);
}
