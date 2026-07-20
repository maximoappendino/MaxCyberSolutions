// GET /api/stores/:id/analytics — inventory + sales stats for dashboard Analytics tab
import { json } from '../../../_lib/helpers.js';

export async function onRequestGet({ params, data, env }) {
  const store = await env.DB.prepare(
    'SELECT id FROM stores WHERE id = ? AND owner_id = ?'
  ).bind(params.id, data.owner_id).first();
  if (!store) return json({ error: 'Not found' }, 404);

  const [inventory, orderStats, recentOrders, topProducts] = await Promise.all([
    // Inventory: all products with stock info
    env.DB.prepare(`
      SELECT p.id, p.name, p.price_cents, p.stock, p.track_stock, p.active,
             (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) AS variant_count
      FROM products p WHERE p.store_id = ? ORDER BY p.name ASC
    `).bind(params.id).all(),

    // Order counts by status
    env.DB.prepare(`
      SELECT status, COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS revenue_cents
      FROM orders WHERE store_id = ? GROUP BY status
    `).bind(params.id).all(),

    // Last 30 days order count + revenue
    env.DB.prepare(`
      SELECT COUNT(*) AS n,
             COALESCE(SUM(total_cents),0) AS revenue_cents
      FROM orders WHERE store_id = ? AND created_at >= datetime('now','-30 days')
    `).bind(params.id).first(),

    // Top 10 products by units sold
    env.DB.prepare(`
      SELECT oi.product_id, oi.name, SUM(oi.quantity) AS units_sold,
             COALESCE(SUM(oi.price_cents * oi.quantity),0) AS revenue_cents
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.store_id = ? AND o.status IN ('paid','processing','shipped','delivered')
      GROUP BY oi.product_id, oi.name ORDER BY units_sold DESC LIMIT 10
    `).bind(params.id).all(),
  ]);

  return json({
    inventory:     inventory.results   || [],
    order_stats:   orderStats.results  || [],
    last_30_days:  recentOrders        || { n: 0, revenue_cents: 0 },
    top_products:  topProducts.results || [],
  });
}
