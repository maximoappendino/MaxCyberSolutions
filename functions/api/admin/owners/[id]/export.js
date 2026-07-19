// GET /api/admin/owners/:id/export?type=website|items|gallery&storeId=xxx
import { json } from '../../../../_lib/helpers.js';

export async function onRequestGet({ params, request, env }) {
  const url     = new URL(request.url);
  const type    = url.searchParams.get('type');
  const storeId = url.searchParams.get('storeId');

  if (!type) return json({ error: 'type parameter required (website, items, gallery)' }, 400);

  const owner = await env.DB.prepare('SELECT id FROM owners WHERE id = ?').bind(params.id).first();
  if (!owner) return json({ error: 'Owner not found' }, 404);

  if (type === 'website') {
    if (!storeId) return json({ error: 'storeId required for website export' }, 400);
    const store = await env.DB.prepare(
      'SELECT slug, name, config FROM stores WHERE id = ? AND owner_id = ?'
    ).bind(storeId, params.id).first();
    if (!store) return json({ error: 'Store not found' }, 404);

    let config;
    try { config = JSON.parse(store.config || '{}'); } catch { config = {}; }
    const filename = `${store.slug}-website.json`;
    return new Response(JSON.stringify({ slug: store.slug, name: store.name, config }, null, 2), {
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  }

  if (type === 'items') {
    if (!storeId) return json({ error: 'storeId required for items export' }, 400);
    const store = await env.DB.prepare('SELECT slug FROM stores WHERE id = ? AND owner_id = ?').bind(storeId, params.id).first();
    if (!store) return json({ error: 'Store not found' }, 404);

    const { results: products } = await env.DB.prepare(
      'SELECT name, description, price_cents, currency, sku, stock_qty, visible, image_url FROM products WHERE store_id = ? ORDER BY created_at'
    ).bind(storeId).all();

    const headers = ['name', 'description', 'price_cents', 'currency', 'sku', 'stock_qty', 'visible', 'image_url'];
    const rows = (products || []).map(p =>
      headers.map(h => {
        const v = String(p[h] ?? '').replace(/"/g, '""');
        return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
      }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\r\n');

    return new Response(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${store.slug}-items.csv"`,
      },
    });
  }

  if (type === 'gallery') {
    if (!storeId) return json({ error: 'storeId required for gallery export' }, 400);
    const store = await env.DB.prepare('SELECT slug FROM stores WHERE id = ? AND owner_id = ?').bind(storeId, params.id).first();
    if (!store) return json({ error: 'Store not found' }, 404);

    const prefix  = `stores/${storeId}/`;
    const listed  = await env.ASSETS_BUCKET.list({ prefix });
    const urls    = (listed.objects || []).map(o => `/images/${o.key}`);

    const csv = ['url', ...urls].join('\r\n');
    return new Response(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${store.slug}-gallery.csv"`,
      },
    });
  }

  return json({ error: 'Unknown type. Use: website, items, gallery' }, 400);
}
