// GET /api/public/slug-check?slug=mybrand
import { json } from '../../_lib/helpers.js';

const RESERVED = new Set([
  'admin', 'dashboard', 'api', 'store', 'checkout', 'pricing',
  'en', 'es', 'it', 'pt', 'img', 'js', 'webhooks', 'public',
]);

export async function onRequestGet({ request, env }) {
  const url  = new URL(request.url);
  const raw  = (url.searchParams.get('slug') || '').toLowerCase();
  const slug = raw.replace(/[^a-z0-9-]/g, '').slice(0, 40);

  if (slug.length < 2) return json({ available: false, error: 'Too short (min 2 chars)' });
  if (RESERVED.has(slug)) return json({ available: false, error: 'Reserved word' });

  const row = await env.DB.prepare('SELECT id FROM stores WHERE slug = ?').bind(slug).first();
  return json({ available: !row, slug });
}
