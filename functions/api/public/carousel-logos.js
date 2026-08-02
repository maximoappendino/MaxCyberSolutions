// GET /api/public/carousel-logos
// Returns [{name, logo, url}] for owners with show_in_carousel = 1
import { json } from '../../_lib/helpers.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`
    SELECT o.name AS owner_name, s.slug, s.config
    FROM owners o
    JOIN stores s ON s.owner_id = o.id
    WHERE o.show_in_carousel = 1 AND o.status = 'active'
    ORDER BY o.created_at ASC
  `).all();

  const logos = (results || []).flatMap(row => {
    let cfg = {};
    try { cfg = JSON.parse(row.config || '{}'); } catch {}
    if (!cfg.logo) return [];
    return [{
      name: cfg.name || row.owner_name || '',
      logo: cfg.logo,
      url: `/store/${row.slug}/`,
    }];
  });

  return new Response(JSON.stringify(logos), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=120' },
  });
}
