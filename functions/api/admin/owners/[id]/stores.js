// POST /api/admin/owners/:id/stores — create a new store under a client account
import { json, uuid } from '../../../../_lib/helpers.js';

export async function onRequestPost({ params, request, env }) {
  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { slug, name } = body ?? {};
  if (!slug) return json({ error: 'slug is required' }, 400);
  if (!/^[a-z0-9-]{2,48}$/.test(slug)) {
    return json({ error: 'slug must be 2–48 chars: lowercase letters, numbers, hyphens' }, 400);
  }

  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Client not found' }, 404);

  const taken = await env.DB.prepare('SELECT id FROM stores WHERE slug = ?').bind(slug).first();
  if (taken) return json({ error: 'Slug already taken' }, 409);

  const storeName = name || slug;
  const config = JSON.stringify({
    name: storeName,
    theme:    { accent: '#e2a14a', dark: false },
    seo:      { title: storeName, description: '' },
    features: { hasInventoryTracking: false, hasNewsletterPopup: false, hasDiscountCountdown: false },
  });

  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO stores (id, slug, owner_id, name, config) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, slug, params.id, storeName, config).run();

  return json({ id, slug, name: storeName }, 201);
}
