import { json } from '../../../_lib/helpers.js';
import { ownedStore } from '../../../_lib/finance.js';

export async function onRequestGet({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  const url  = new URL(request.url);
  const from = url.searchParams.get('date_from') || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const to   = url.searchParams.get('date_to')   || new Date().toISOString().slice(0, 10);
  const sid  = params.storeId;

  const [plRows, cashflow, rawTx] = await Promise.all([
    // P&L: totals by category and type within range
    env.DB.prepare(`
      SELECT fc.id, fc.name, fc.color, ft.type,
        COALESCE(SUM(ft.amount), 0) AS total
      FROM finance_transactions ft
      LEFT JOIN finance_categories fc ON fc.id = ft.category_id
      WHERE ft.store_id = ? AND ft.status = 'posted'
        AND ft.occurred_at >= ? AND ft.occurred_at <= ?
      GROUP BY fc.id, fc.name, fc.color, ft.type
      ORDER BY ft.type DESC, total DESC
    `).bind(sid, from, to).all(),

    // Cash flow by month within range
    env.DB.prepare(`
      SELECT strftime('%Y-%m', occurred_at) AS month, type, COALESCE(SUM(amount), 0) AS total
      FROM finance_transactions
      WHERE store_id = ? AND status = 'posted'
        AND occurred_at >= ? AND occurred_at <= ?
      GROUP BY month, type
      ORDER BY month ASC
    `).bind(sid, from, to).all(),

    // All transactions for CSV export
    env.DB.prepare(`
      SELECT ft.occurred_at, ft.type, ft.amount, ft.currency, ft.payment_method,
        ft.status, ft.notes, ft.linked_order_id, ft.receipt_asset_url,
        fc.name AS category, fcon.name AS contact
      FROM finance_transactions ft
      LEFT JOIN finance_categories fc ON fc.id = ft.category_id
      LEFT JOIN finance_contacts fcon ON fcon.id = ft.contact_id
      WHERE ft.store_id = ? AND ft.occurred_at >= ? AND ft.occurred_at <= ?
      ORDER BY ft.occurred_at ASC, ft.created_at ASC
    `).bind(sid, from, to).all(),
  ]);

  const pl       = plRows.results   || [];
  const income   = pl.filter(r => r.type === 'income');
  const expenses = pl.filter(r => r.type === 'expense');
  const totalIncome  = income.reduce((s, r) => s + r.total, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.total, 0);

  return json({
    date_from:     from,
    date_to:       to,
    income_lines:  income,
    expense_lines: expenses,
    total_income:  totalIncome,
    total_expense: totalExpense,
    net_profit:    totalIncome - totalExpense,
    cashflow:      cashflow.results || [],
    transactions:  rawTx.results || [],
  });
}
