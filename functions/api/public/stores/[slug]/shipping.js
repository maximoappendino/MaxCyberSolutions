// GET /api/public/stores/:slug/shipping?zip=1000&weight=500&width=20&height=15&depth=10&value=10000
// Returns shipping quotes from Andreani. MercadoEnvíos is handled directly in the MP preference.
import { json } from '../../../../_lib/helpers.js';

async function andreaniToken(env) {
  if (!env.ANDREANI_USER || !env.ANDREANI_PASS) return null;
  try {
    const basic = btoa(`${env.ANDREANI_USER}:${env.ANDREANI_PASS}`);
    const res = await fetch('https://apis.andreani.com/login', {
      method: 'POST',
      headers: { 'x-access-token': basic },
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d.token || null;
  } catch { return null; }
}

export async function onRequestGet({ params, request, env }) {
  const u    = new URL(request.url);
  const zip  = (u.searchParams.get('zip') || '').trim();
  const wg   = Math.max(1, parseInt(u.searchParams.get('weight') || '500', 10));
  const w    = Math.max(1, parseInt(u.searchParams.get('width')  || '20',  10));
  const h    = Math.max(1, parseInt(u.searchParams.get('height') || '15',  10));
  const d    = Math.max(1, parseInt(u.searchParams.get('depth')  || '10',  10));
  const val  = parseFloat(u.searchParams.get('value') || '0');

  if (!zip) return json({ error: 'zip required' }, 400);

  const store = await env.DB.prepare('SELECT store_zip FROM stores WHERE slug = ?')
    .bind(params.slug).first();
  if (!store?.store_zip) return json({ quotes: [], note: 'Store origin zip not set' });

  const quotes = [];

  // Andreani
  const token = await andreaniToken(env);
  if (token && env.ANDREANI_CONTRATO) {
    try {
      const res = await fetch('https://apis.andreani.com/v2/cotizaciones', {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contrato: env.ANDREANI_CONTRATO,
          destinatario: { codigoPostal: zip },
          remitente:    { codigoPostal: store.store_zip },
          bultos: [{ kilos: wg / 1000, largoEnCm: d, anchoEnCm: w, altoEnCm: h, valorDeclarado: val }],
        }),
      });
      if (res.ok) {
        const rows = await res.json();
        for (const q of (rows || [])) {
          quotes.push({
            id:            `andreani_${q.idServicio || ''}`,
            carrier:       'andreani',
            label:         `Andreani — ${q.descripcion || 'Envío estándar'}`,
            price_cents:   Math.round((q.tarifaConIva || 0) * 100),
            estimated_days: q.diasHabiles || null,
          });
        }
      }
    } catch { /* Andreani unavailable */ }
  }

  // MercadoEnvíos note (handled in MP preference, not here)
  if (!quotes.length) {
    return json({ quotes: [], note: 'No Andreani quotes returned. Configure ANDREANI_USER, ANDREANI_PASS and ANDREANI_CONTRATO in Cloudflare env vars.' });
  }

  return json({ quotes });
}
