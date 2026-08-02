import { uuid } from './helpers.js';

export async function ownedStore(storeId, ownerId, env) {
  return env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(storeId, ownerId).first();
}

const DEFAULTS = [
  { name: 'Sales',          type: 'income',  color: '#22c55e' },
  { name: 'Other Income',   type: 'income',  color: '#86efac' },
  { name: 'Cost of Goods',  type: 'expense', color: '#ef4444' },
  { name: 'Shipping Costs', type: 'expense', color: '#f97316' },
  { name: 'Supplies',       type: 'expense', color: '#eab308' },
  { name: 'Marketing',      type: 'expense', color: '#a855f7' },
  { name: 'Rent',           type: 'expense', color: '#3b82f6' },
  { name: 'Taxes',          type: 'expense', color: '#6b7280' },
  { name: 'Other Expenses', type: 'expense', color: '#9ca3af' },
];

export async function ensureDefaultCategories(storeId, env) {
  const existing = await env.DB.prepare(
    'SELECT id FROM finance_categories WHERE store_id = ? LIMIT 1'
  ).bind(storeId).first();
  if (existing) return;
  const stmt = env.DB.prepare(
    'INSERT INTO finance_categories (id, store_id, name, type, color, is_default) VALUES (?, ?, ?, ?, ?, 1)'
  );
  await env.DB.batch(DEFAULTS.map(d => stmt.bind(uuid(), storeId, d.name, d.type, d.color)));
}

// Called from the MP webhook to auto-import a confirmed order into the ledger.
// The UNIQUE index on linked_order_id WHERE type='income' makes this idempotent.
export async function autoCreateOrderIncome(storeId, orderId, amountCents, env) {
  await ensureDefaultCategories(storeId, env);
  const cat = await env.DB.prepare(
    "SELECT id FROM finance_categories WHERE store_id = ? AND name = 'Sales' AND type = 'income' LIMIT 1"
  ).bind(storeId).first();
  const today = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare(`
      INSERT INTO finance_transactions
        (id, store_id, type, amount, occurred_at, category_id, linked_order_id, payment_method, notes)
      VALUES (?, ?, 'income', ?, ?, ?, ?, 'mercadopago', 'Auto-imported from confirmed order')
    `).bind(uuid(), storeId, amountCents, today, cat?.id || null, orderId).run();
  } catch (e) {
    // UNIQUE constraint violation → already imported; swallow silently
    if (!String(e).includes('UNIQUE') && !String(e).includes('SQLITE_CONSTRAINT')) throw e;
  }
}
