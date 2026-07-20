// GET /api/admin/metrics — platform-wide stats for admin panel
import { json } from '../../_lib/helpers.js';

export async function onRequestGet({ env }) {
  const [owners, stores, orders, products, customers, revenue] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS n FROM owners WHERE is_admin = 0").first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM stores").first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM orders").first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM products").first(),
    env.DB.prepare("SELECT COUNT(*) AS n FROM customers").first(),
    env.DB.prepare("SELECT COALESCE(SUM(total_cents),0) AS n FROM orders WHERE status IN ('paid','processing','shipped','delivered')").first(),
  ]);

  const byStatus = await env.DB.prepare(
    "SELECT status, COUNT(*) AS n FROM orders GROUP BY status ORDER BY n DESC"
  ).all();

  const byType = await env.DB.prepare(
    "SELECT store_type, COUNT(*) AS n FROM stores GROUP BY store_type"
  ).all();

  const topStores = await env.DB.prepare(`
    SELECT s.slug, s.name, COUNT(o.id) AS order_count,
           COALESCE(SUM(o.total_cents),0) AS revenue_cents
    FROM stores s LEFT JOIN orders o ON o.store_id = s.id
    GROUP BY s.id ORDER BY revenue_cents DESC LIMIT 10
  `).all();

  const recentOrders = await env.DB.prepare(`
    SELECT o.id, o.status, o.total_cents, o.customer_name, o.created_at, s.slug
    FROM orders o JOIN stores s ON s.id = o.store_id
    ORDER BY o.created_at DESC LIMIT 20
  `).all();

  const emailUsage = await env.DB.prepare(`
    SELECT SUM(CASE WHEN email_monthly_reset = ? THEN email_monthly_used ELSE 0 END) AS used,
           SUM(email_monthly_limit) AS total_limit
    FROM owners WHERE is_admin = 0
  `).bind(new Date().toISOString().slice(0, 7)).first();

  return json({
    totals: {
      clients:   owners?.n   ?? 0,
      stores:    stores?.n   ?? 0,
      orders:    orders?.n   ?? 0,
      products:  products?.n ?? 0,
      customers: customers?.n ?? 0,
      revenue_cents: revenue?.n ?? 0,
    },
    orders_by_status: byStatus.results || [],
    stores_by_type:   byType.results   || [],
    top_stores:       topStores.results || [],
    recent_orders:    recentOrders.results || [],
    email_usage: {
      used:  emailUsage?.used  ?? 0,
      limit: emailUsage?.total_limit ?? 0,
    },
  });
}
