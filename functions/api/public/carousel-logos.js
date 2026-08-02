// GET /api/public/carousel-logos
// Returns [{name, logo, url}] for stores with show_in_carousel = 1
import { json } from '../../_lib/helpers.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(`
    SELECT s.slug, s.config, s.name AS store_name
    FROM stores s
    JOIN owners o ON o.id = s.owner_id
    WHERE s.show_in_carousel = 1 AND o.status = 'active'
    ORDER BY s.created_at ASC
  `).all();

  const logos = (results || []).flatMap(row => {
    let cfg = {};
    try { cfg = JSON.parse(row.config || '{}'); } catch {}
    if (!cfg.logo) return [];
    return [{
      name: cfg.name || row.store_name || '',
      logo: cfg.logo,
      url: `/store/${row.slug}/`,
    }];
  });

  return new Response(JSON.stringify(logos), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=120' },
  });
}
