import { json } from '../../_lib/helpers.js';
import { deleteStoreImages } from '../../_lib/storage.js';

function getWeekKey(d) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayNum = Math.round((d - jan4) / 86400000);
  const weekNum = Math.ceil((dayNum + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function onRequestGet({ params, data, env }) {
  const store = await env.DB.prepare(
    'SELECT id, slug, name, config, preview_config, created_at FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();

  if (!store) return json({ error: 'Not found' }, 404);
  try { store.config = JSON.parse(store.config); } catch { store.config = {}; }
  if (store.preview_config) {
    try { store.preview_config = JSON.parse(store.preview_config); }
    catch { store.preview_config = null; }
  }
  return json(store);
}

export async function onRequestPut({ params, request, data, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const row = await env.DB.prepare(
    'SELECT config, preview_config FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!row) return json({ error: 'Not found' }, 404);

  const isDraft = body._draft === true;
  const baseStr = isDraft && row.preview_config ? row.preview_config : row.config;
  let current;
  try { current = JSON.parse(baseStr || '{}'); } catch { current = {}; }

  const { name, config } = body ?? {};

  const updated = config ? {
    ...current,
    ...config,
    features: { ...(current.features || {}), ...(config.features || {}) },
    theme:    { ...(current.theme    || {}), ...(config.theme    || {}) },
    seo:      { ...(current.seo      || {}), ...(config.seo      || {}) },
    sections: config.sections !== undefined ? config.sections : (current.sections || []),
  } : current;

  if (name) updated.name = name;

  if (isDraft) {
    await env.DB.prepare(
      'UPDATE stores SET preview_config = ? WHERE id = ? AND owner_id = ?'
    ).bind(JSON.stringify(updated), params.id, data.owner_id).run();
    return json({ id: params.id, draft: true, config: updated });
  }

  // Enforce push limits on publish
  const ownerRow = await env.DB.prepare(
    `SELECT push_daily_limit, push_weekly_limit, push_daily_used, push_weekly_used,
            push_daily_reset, push_weekly_reset, is_admin
     FROM owners WHERE id = ?`
  ).bind(data.owner_id).first();

  if (ownerRow && !ownerRow.is_admin) {
    const today = new Date().toISOString().slice(0, 10);
    const week  = getWeekKey(new Date());

    const dailyUsed  = ownerRow.push_daily_reset  === today ? (ownerRow.push_daily_used  ?? 0) : 0;
    const weeklyUsed = ownerRow.push_weekly_reset === week  ? (ownerRow.push_weekly_used ?? 0) : 0;
    const dailyLimit  = ownerRow.push_daily_limit  ?? 10;
    const weeklyLimit = ownerRow.push_weekly_limit ?? 50;

    if (dailyUsed >= dailyLimit) {
      return json({ error: `Daily publish limit reached (${dailyLimit}/day). Try again tomorrow.` }, 429);
    }
    if (weeklyUsed >= weeklyLimit) {
      return json({ error: `Weekly publish limit reached (${weeklyLimit}/week). Try again next week.` }, 429);
    }

    await env.DB.prepare(
      `UPDATE owners SET push_daily_used = ?, push_weekly_used = ?,
                        push_daily_reset = ?, push_weekly_reset = ? WHERE id = ?`
    ).bind(dailyUsed + 1, weeklyUsed + 1, today, week, data.owner_id).run();
  }

  const updatedName = name ?? (current.name || '');
  await env.DB.prepare(
    'UPDATE stores SET name = ?, config = ?, preview_config = NULL WHERE id = ? AND owner_id = ?'
  ).bind(updatedName, JSON.stringify(updated), params.id, data.owner_id).run();

  return json({ id: params.id, name: updatedName, config: updated });
}

export async function onRequestDelete({ params, data, env }) {
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  // Delete all R2 images for this store before removing the DB record
  await deleteStoreImages(params.id, data.owner_id, env);

  await env.DB.prepare(
    'DELETE FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).run();

  return json({ ok: true });
}
