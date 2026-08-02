import { json } from '../../../../_lib/helpers.js';
import { ownedStore } from '../../../../_lib/finance.js';

export async function onRequestPatch({ params, request, data, env }) {
  const store = await ownedStore(params.storeId, data.owner_id, env);
  if (!store) return json({ error: 'Not found' }, 404);

  const tx = await env.DB.prepare(
    'SELECT id, status FROM finance_transactions WHERE id = ? AND store_id = ?'
  ).bind(params.txId, params.storeId).first();
  if (!tx) return json({ error: 'Not found' }, 404);
  if (tx.status === 'voided') return json({ error: 'Transaction is already voided' }, 409);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const reason = (body?.void_reason || '').trim() || 'Voided by user';

  await env.DB.prepare(`
    UPDATE finance_transactions
    SET status = 'voided', voided_at = datetime('now'), void_reason = ?
    WHERE id = ?
  `).bind(reason, params.txId).run();

  return json({ ok: true });
}
