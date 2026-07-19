import { json } from '../_lib/helpers.js';

export async function onRequestGet({ data, env }) {
  const owner = await env.DB.prepare(
    `SELECT id, email, name, brand, is_admin, status, plan,
            product_limit, storage_limit_mb, storage_used_bytes, onboarded,
            push_daily_limit, push_weekly_limit,
            push_daily_used, push_weekly_used,
            push_daily_reset, push_weekly_reset
     FROM owners WHERE id = ?`
  ).bind(data.owner_id).first();
  if (!owner) return json({ error: 'Not found' }, 404);

  const today = new Date().toISOString().slice(0, 10);
  const week  = getWeekKey(new Date());

  const dailyUsed  = owner.push_daily_reset  === today ? (owner.push_daily_used  ?? 0) : 0;
  const weeklyUsed = owner.push_weekly_reset === week  ? (owner.push_weekly_used ?? 0) : 0;

  return json({
    id:                 owner.id,
    email:              owner.email,
    name:               owner.name || '',
    brand:              owner.brand || '',
    is_admin:           !!owner.is_admin,
    status:             owner.status || 'active',
    plan:               owner.plan   || 'basic',
    product_limit:      owner.product_limit ?? 50,
    storage_limit_mb:   owner.storage_limit_mb ?? 100,
    storage_used_bytes: owner.storage_used_bytes ?? 0,
    onboarded:          owner.onboarded ?? 1,
    push_daily_limit:   owner.push_daily_limit  ?? 10,
    push_weekly_limit:  owner.push_weekly_limit ?? 50,
    push_daily_used:    dailyUsed,
    push_weekly_used:   weeklyUsed,
  });
}

function getWeekKey(d) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayNum = Math.round((d - jan4) / 86400000);
  const weekNum = Math.ceil((dayNum + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
