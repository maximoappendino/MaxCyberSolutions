import { json, uuid } from '../../_lib/helpers.js';

export async function onRequestGet({ data, env }) {
  const { results } = await env.DB.prepare(
    'SELECT id, slug, name, config, created_at FROM stores WHERE owner_id = ? ORDER BY created_at DESC'
  ).bind(data.owner_id).all();

  return json((results || []).map(parseConfig));
}

export async function onRequestPost({ request, data, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { slug, name, config = {} } = body ?? {};
  if (!slug) return json({ error: 'slug is required' }, 400);
  if (!/^[a-z0-9-]{2,48}$/.test(slug)) {
    return json({ error: 'slug must be 2–48 chars: lowercase letters, numbers, hyphens' }, 400);
  }

  const taken = await env.DB.prepare('SELECT id FROM stores WHERE slug = ?').bind(slug).first();
  if (taken) return json({ error: 'Slug already taken' }, 409);

  const storeName = name || slug;
  const merged = {
    name: storeName,
    theme:    { accent: '#e2a14a', dark: false, ...(config.theme    || {}) },
    seo:      { title: storeName, description: '', ...(config.seo      || {}) },
    features: {
      hasInventoryTracking:   false,
      hasNewsletterPopup:     false,
      hasDiscountCountdown:   false,
      ...(config.features || {}),
    },
    ...(config.name ? {} : {}),
  };

  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO stores (id, slug, owner_id, name, config) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, slug, data.owner_id, storeName, JSON.stringify(merged)).run();

  return json({ id, slug, name: storeName, config: merged }, 201);
}

function parseConfig(row) {
  try { row.config = JSON.parse(row.config); } catch { row.config = {}; }
  return row;
}
