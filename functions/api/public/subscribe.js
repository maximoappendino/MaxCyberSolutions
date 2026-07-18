// POST /api/public/subscribe — create a Mercado Pago preference for platform billing
import { json } from '../../_lib/helpers.js';

const PLANS = {
  starter: { name: 'MaxCyberSolutions Starter', unit_price: 9990  },
  basic:   { name: 'MaxCyberSolutions Basic',   unit_price: 19990 },
  pro:     { name: 'MaxCyberSolutions Pro',      unit_price: 39990 },
};

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { plan = 'basic', email } = body ?? {};
  if (!email) return json({ error: 'email required' }, 400);
  const p = PLANS[plan];
  if (!p)   return json({ error: 'Invalid plan' }, 400);
  if (!env.MP_ACCESS_TOKEN) return json({ error: 'Payment not configured on this server' }, 503);

  const base = env.PUBLIC_URL || 'https://maxcybersolutions.online';

  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [{
        title: p.name,
        unit_price: p.unit_price / 100,
        quantity: 1,
        currency_id: 'ARS',
      }],
      payer: { email },
      back_urls: {
        success: `${base}/dashboard/?subscribed=1`,
        failure: `${base}/#pricing`,
        pending: `${base}/dashboard/?subscribed=pending`,
      },
      notification_url: `${base}/api/webhooks/mp-platform`,
      auto_return: 'approved',
      external_reference: `plan:${plan}|email:${encodeURIComponent(email)}`,
      metadata: { plan, email },
    }),
  });

  if (!mpRes.ok) {
    const err = await mpRes.text();
    return json({ error: 'Failed to create payment preference', detail: err }, 502);
  }

  const data = await mpRes.json();
  return json({ init_point: data.init_point, sandbox_init_point: data.sandbox_init_point, preference_id: data.id });
}
