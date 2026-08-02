import { json, uuid } from '../../../_lib/helpers.js';
import { ownedStore, ensureDefaultCategories } from '../../../_lib/finance.js';

const PAYMENT_METHODS = new Set(['cash', 'bank_transfer', 'mercadopago', 'card', 'check', 'other']);

export async function onRequestGet({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  const url     = new URL(request.url);
  const type    = url.searchParams.get('type') || '';
  const catId   = url.searchParams.get('category_id') || '';
  const contId  = url.searchParams.get('contact_id') || '';
  const method  = url.searchParams.get('payment_method') || '';
  const from    = url.searchParams.get('date_from') || '';
  const to      = url.searchParams.get('date_to') || '';
  const page    = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit   = Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10));

  const conditions = ['ft.store_id = ?'];
  const bind       = [params.storeId];

  if (type)   { conditions.push('ft.type = ?');           bind.push(type); }
  if (catId)  { conditions.push('ft.category_id = ?');    bind.push(catId); }
  if (contId) { conditions.push('ft.contact_id = ?');     bind.push(contId); }
  if (method) { conditions.push('ft.payment_method = ?'); bind.push(method); }
  if (from)   { conditions.push('ft.occurred_at >= ?');   bind.push(from); }
  if (to)     { conditions.push('ft.occurred_at <= ?');   bind.push(to); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [totals, { results: rows }] = await Promise.all([
    env.DB.prepare(`
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(CASE WHEN ft.type='income'  AND ft.status='posted' THEN ft.amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN ft.type='expense' AND ft.status='posted' THEN ft.amount ELSE 0 END), 0) AS total_expense
      FROM finance_transactions ft ${where}
    `).bind(...bind).first(),
    env.DB.prepare(`
      SELECT ft.*,
        fc.name AS category_name, fc.color AS category_color,
        fcon.name AS contact_name, fcon.type AS contact_type
      FROM finance_transactions ft
      LEFT JOIN finance_categories fc ON fc.id = ft.category_id
      LEFT JOIN finance_contacts fcon ON fcon.id = ft.contact_id
      ${where}
      ORDER BY ft.occurred_at DESC, ft.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bind, limit, (page - 1) * limit).all(),
  ]);

  return json({
    transactions: rows || [],
    total_count:  totals?.total_count  || 0,
    total_income: totals?.total_income || 0,
    total_expense: totals?.total_expense || 0,
    page,
    limit,
  });
}

export async function onRequestPost({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const {
    type, amount_cents, occurred_at, category_id,
    contact_id, payment_method, receipt_asset_url, notes, currency,
  } = body ?? {};

  if (!['income', 'expense'].includes(type)) return json({ error: 'type must be income or expense' }, 400);
  if (!amount_cents || amount_cents <= 0)    return json({ error: 'amount_cents must be positive' }, 400);
  if (!occurred_at)                          return json({ error: 'occurred_at (YYYY-MM-DD) is required' }, 400);

  if (category_id) {
    const cat = await env.DB.prepare(
      'SELECT id FROM finance_categories WHERE id = ? AND store_id = ?'
    ).bind(category_id, params.storeId).first();
    if (!cat) return json({ error: 'Category not found' }, 400);
  }
  if (contact_id) {
    const con = await env.DB.prepare(
      'SELECT id FROM finance_contacts WHERE id = ? AND store_id = ?'
    ).bind(contact_id, params.storeId).first();
    if (!con) return json({ error: 'Contact not found' }, 400);
  }

  const pm = payment_method && PAYMENT_METHODS.has(payment_method) ? payment_method : null;
  const id = uuid();
  await env.DB.prepare(`
    INSERT INTO finance_transactions
      (id, store_id, type, amount, currency, occurred_at, category_id, contact_id, payment_method, receipt_asset_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, params.storeId, type, amount_cents, currency || 'ARS',
    occurred_at, category_id || null, contact_id || null,
    pm, receipt_asset_url || null, notes || null,
  ).run();

  return json({ id }, 201);
}
