import { json } from '../../../_lib/helpers.js';
import { ownedStore } from '../../../_lib/finance.js';

export async function onRequestGet({ params, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  const sid = params.storeId;

  const [thisMonth, lastMonth, trend, cats, topClients, topProviders] = await Promise.all([
    // This calendar month
    env.DB.prepare(`
      SELECT type, COALESCE(SUM(amount), 0) AS total
      FROM finance_transactions
      WHERE store_id = ? AND status = 'posted'
        AND occurred_at >= date('now','start of month')
        AND occurred_at <  date('now','start of month','+1 month')
      GROUP BY type
    `).bind(sid).all(),

    // Last calendar month
    env.DB.prepare(`
      SELECT type, COALESCE(SUM(amount), 0) AS total
      FROM finance_transactions
      WHERE store_id = ? AND status = 'posted'
        AND occurred_at >= date('now','start of month','-1 month')
        AND occurred_at <  date('now','start of month')
      GROUP BY type
    `).bind(sid).all(),

    // 6-month trend (month buckets, income + expense)
    env.DB.prepare(`
      SELECT strftime('%Y-%m', occurred_at) AS month, type, COALESCE(SUM(amount), 0) AS total
      FROM finance_transactions
      WHERE store_id = ? AND status = 'posted'
        AND occurred_at >= date('now','-6 months')
      GROUP BY month, type
      ORDER BY month ASC
    `).bind(sid).all(),

    // Category breakdown — this month
    env.DB.prepare(`
      SELECT fc.name, fc.color, ft.type, COALESCE(SUM(ft.amount), 0) AS total
      FROM finance_transactions ft
      JOIN finance_categories fc ON fc.id = ft.category_id
      WHERE ft.store_id = ? AND ft.status = 'posted'
        AND ft.occurred_at >= date('now','start of month')
        AND ft.occurred_at <  date('now','start of month','+1 month')
      GROUP BY fc.id, fc.name, fc.color, ft.type
      ORDER BY total DESC
    `).bind(sid).all(),

    // Top 5 clients by income this month
    env.DB.prepare(`
      SELECT fcon.id, fcon.name, COALESCE(SUM(ft.amount), 0) AS total
      FROM finance_contacts fcon
      JOIN finance_transactions ft ON ft.contact_id = fcon.id
      WHERE fcon.store_id = ? AND fcon.type = 'client' AND ft.status = 'posted'
        AND ft.type = 'income'
        AND ft.occurred_at >= date('now','start of month')
      GROUP BY fcon.id, fcon.name
      ORDER BY total DESC
      LIMIT 5
    `).bind(sid).all(),

    // Top 5 providers by expense this month
    env.DB.prepare(`
      SELECT fcon.id, fcon.name, COALESCE(SUM(ft.amount), 0) AS total
      FROM finance_contacts fcon
      JOIN finance_transactions ft ON ft.contact_id = fcon.id
      WHERE fcon.store_id = ? AND fcon.type = 'provider' AND ft.status = 'posted'
        AND ft.type = 'expense'
        AND ft.occurred_at >= date('now','start of month')
      GROUP BY fcon.id, fcon.name
      ORDER BY total DESC
      LIMIT 5
    `).bind(sid).all(),
  ]);

  function sumByType(rows) {
    const m = { income: 0, expense: 0 };
    (rows.results || []).forEach(r => { m[r.type] = r.total; });
    return { income: m.income, expense: m.expense, profit: m.income - m.expense };
  }

  return json({
    thisMonth:    sumByType(thisMonth),
    lastMonth:    sumByType(lastMonth),
    trend:        trend.results || [],
    categories:   cats.results || [],
    topClients:   topClients.results || [],
    topProviders: topProviders.results || [],
  });
}
