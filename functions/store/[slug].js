import { esc } from '../_lib/helpers.js';

const CACHE_TTL = 60; // seconds — edge cache per slug

export async function onRequestGet({ params, env, request }) {
  const { slug } = params;

  // ── Edge cache (Cloudflare Cache API) ─────────────────────────────────────
  const cache    = caches.default;
  const cacheKey = new Request(`https://store-cache.internal/${slug}`);
  const cached   = await cache.match(cacheKey);
  if (cached) return cached;

  // ── Tenant lookup — isolate by slug ───────────────────────────────────────
  // Pattern: SELECT * FROM stores WHERE slug = ?
  const store = await env.DB.prepare('SELECT * FROM stores WHERE slug = ?')
    .bind(slug).first();

  if (!store) {
    return new Response('Store not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    });
  }

  let config;
  try { config = JSON.parse(store.config || '{}'); } catch { config = {}; }

  const { results: products } = await env.DB.prepare(
    'SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC'
  ).bind(store.id).all();

  const html     = renderStorefront(store, config, products || []);
  const response = new Response(html, {
    headers: {
      'Content-Type':  'text/html;charset=UTF-8',
      'Cache-Control': `public, s-maxage=${CACHE_TTL}`,
    },
  });

  // Populate edge cache
  await cache.put(cacheKey, response.clone());
  return response;
}

// ── Renderer ──────────────────────────────────────────────────────────────────

function renderStorefront(store, config, products) {
  const name     = config.name  || store.name || store.slug;
  const theme    = config.theme    || {};
  const seo      = config.seo      || {};
  const features = config.features || {};
  const accent   = theme.accent || '#e2a14a';
  const dark     = theme.dark ? 'true' : 'false';

  return `<!DOCTYPE html>
<html lang="en" data-dark="${dark}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(seo.title || name)}</title>
  <meta name="description" content="${esc(seo.description || '')}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="icon" href="/img/icon.webp" type="image/webp" />
  <style>
    :root {
      --accent:      ${esc(accent)};
      --accent-soft: color-mix(in srgb, ${esc(accent)} 18%, transparent);
      --cream: #efeae0; --ink: #1c1a16;
      --ink-soft: #45403a; --ink-faint: #7a736a;
      --rule: #d4cdbd; --rule-soft: #e2dccd;
      --bg: var(--cream); --fg: var(--ink);
      --fg-soft: var(--ink-soft); --fg-faint: var(--ink-faint);
      --line: var(--rule); --line-soft: var(--rule-soft);
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans:  "DM Sans", sans-serif;
      --mono:  "JetBrains Mono", monospace;
      --pad:   clamp(24px, 6vw, 96px);
    }
    [data-dark="true"] {
      --bg: #0c0a07; --fg: #efeae0;
      --fg-soft: #b9b3a6; --fg-faint: #7a736a;
      --line: #2a2620; --line-soft: #1a1813;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0;
      background: var(--bg); color: var(--fg);
      font-family: var(--sans); font-size: 16px; line-height: 1.5;
      -webkit-font-smoothing: antialiased; }
    body { overflow-x: hidden; }
    a { color: var(--fg); }
    ::selection { background: var(--accent); color: #fff; }

    /* ── Nav ── */
    .s-bar {
      position: sticky; top: 0; z-index: 40;
      padding: 16px var(--pad);
      background: color-mix(in srgb, var(--bg) 85%, transparent);
      backdrop-filter: blur(14px) saturate(120%);
      border-bottom: 1px solid var(--line-soft);
      display: flex; justify-content: space-between; align-items: center;
    }
    .s-bar__name {
      font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase;
    }
    .s-bar__back {
      font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none;
      transition: color 160ms ease;
    }
    .s-bar__back:hover { color: var(--accent); }

    /* ── Countdown ── */
    .countdown {
      padding: 14px var(--pad);
      background: var(--accent); color: #fff;
      display: flex; align-items: center; gap: 20px;
      font-family: var(--mono);
    }
    .countdown__label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.85; }
    .countdown__time  { font-size: 20px; letter-spacing: 0.06em; }

    /* ── Hero ── */
    .s-hero {
      padding: 80px var(--pad) 60px;
      border-bottom: 1px solid var(--line);
    }
    .s-hero__tag  { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 20px; }
    .s-hero__title { font-family: var(--serif);
      font-size: clamp(52px, 9vw, 128px); line-height: 0.93;
      letter-spacing: -0.02em; font-weight: 400; margin: 0 0 24px; }
    .s-hero__desc  { font-family: var(--serif); font-style: italic;
      font-size: clamp(18px, 1.8vw, 26px); color: var(--fg-soft); max-width: 60ch; margin: 0; }

    /* ── Products ── */
    .s-products { padding: 64px var(--pad); }
    .s-products__head { margin-bottom: 48px; }
    .s-products__tag  { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .s-products__title { font-family: var(--serif);
      font-size: clamp(36px, 4.5vw, 64px); letter-spacing: -0.02em; margin: 0; }
    .s-products__title em { color: var(--fg-soft); font-style: italic; }

    .s-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      border-top: 1px solid var(--line); border-left: 1px solid var(--line);
    }
    .s-card {
      border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
      padding: 28px 24px; display: flex; flex-direction: column; gap: 12px;
      background: var(--bg); transition: background 200ms ease;
    }
    .s-card:hover { background: color-mix(in srgb, var(--accent) 5%, var(--bg)); }
    .s-card__sku   { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .s-card__name  { font-family: var(--serif); font-size: 24px;
      letter-spacing: -0.01em; line-height: 1.1; }
    .s-card__desc  { font-family: var(--serif); font-style: italic;
      font-size: 14px; color: var(--fg-soft); flex: 1; }
    .s-card__price { font-family: var(--serif); font-size: 34px;
      letter-spacing: -0.02em; line-height: 1; }
    .s-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .s-card__badge  { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 7px;
      border: 1px solid var(--line); color: var(--fg-faint); }
    .s-card__badge--oos { border-color: #b33; color: #b33; }
    .s-card__cta {
      margin-top: auto; padding: 12px 0;
      border-top: 1px solid var(--line-soft); border-left: none;
      border-right: none; border-bottom: none;
      font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase;
      background: none; color: var(--fg); width: 100%;
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; transition: color 160ms ease;
    }
    .s-card__cta:hover  { color: var(--accent); }
    .s-card__cta::after { content: "→"; }

    /* ── Empty state ── */
    .s-empty {
      padding: 80px var(--pad); text-align: center;
      border-top: 1px solid var(--line);
    }
    .s-empty__text { font-family: var(--serif); font-style: italic;
      font-size: 26px; color: var(--fg-soft); }

    /* ── Footer ── */
    .s-foot {
      padding: 40px var(--pad); border-top: 1px solid var(--line);
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .s-foot__brand { font-family: var(--serif); font-size: 13px; color: var(--fg-faint); }
    .s-foot__link  { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint);
      text-decoration: none; transition: color 160ms ease; }
    .s-foot__link:hover { color: var(--accent); }

    /* ── Newsletter modal ── */
    .nl-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,.55);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity 360ms ease;
    }
    .nl-overlay.active { opacity: 1; pointer-events: auto; }
    .nl-modal {
      background: var(--bg); border: 1px solid var(--line);
      padding: 48px; max-width: 460px; width: calc(100% - 40px);
      display: flex; flex-direction: column; gap: 22px;
    }
    .nl-modal__title { font-family: var(--serif);
      font-size: clamp(28px, 5vw, 52px); letter-spacing: -0.02em; margin: 0; }
    .nl-modal__lede  { font-family: var(--serif); font-style: italic;
      font-size: 17px; color: var(--fg-soft); margin: 0; }
    .nl-form { display: flex; border: 1px solid var(--line); }
    .nl-input {
      flex: 1; background: transparent; border: none; outline: none;
      font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em;
      color: var(--fg); padding: 12px 16px;
    }
    .nl-btn {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 12px 20px;
      background: var(--fg); color: var(--bg); border: none; cursor: pointer;
      transition: opacity 160ms ease;
    }
    .nl-btn:hover { opacity: .85; }
    .nl-close {
      align-self: flex-end; background: none; border: none;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--fg-faint); cursor: pointer;
      transition: color 160ms ease;
    }
    .nl-close:hover { color: var(--fg); }

    @media (max-width: 640px) {
      .s-grid { grid-template-columns: 1fr; }
      .s-foot { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <nav class="s-bar">
    <span class="s-bar__name">${esc(name)}</span>
    <a href="/" class="s-bar__back">← MaxCyberSolutions</a>
  </nav>

  ${features.hasDiscountCountdown ? renderCountdown() : ''}

  <header class="s-hero">
    <p class="s-hero__tag">Store &nbsp;/&nbsp; ${esc(store.slug)}</p>
    <h1 class="s-hero__title">${esc(name)}</h1>
    ${seo.description ? `<p class="s-hero__desc">${esc(seo.description)}</p>` : ''}
  </header>

  <section class="s-products">
    <div class="s-products__head">
      <p class="s-products__tag">§ Catalogue</p>
      <h2 class="s-products__title">All <em>products</em>.</h2>
    </div>
    ${products.length
      ? `<div class="s-grid">${products.map(renderCard).join('')}</div>`
      : `<div class="s-empty"><p class="s-empty__text">No products yet &mdash; check back soon.</p></div>`}
  </section>

  ${features.hasNewsletterPopup ? renderNewsletterModal() : ''}

  <footer class="s-foot">
    <span class="s-foot__brand">Powered by MaxCyberSolutions</span>
    <a href="/" class="s-foot__link">maxcybersolutions.com ↗</a>
  </footer>

  ${features.hasDiscountCountdown ? countdownScript()   : ''}
  ${features.hasNewsletterPopup   ? newsletterScript()  : ''}
</body>
</html>`;
}

function renderCard(p) {
  const dollars = (p.price_cents / 100).toFixed(2);
  let meta = {};
  try { meta = JSON.parse(p.metadata || '{}'); } catch {}
  const badges = Object.entries(meta)
    .map(([k, v]) => `<span class="s-card__badge">${esc(k)}: ${esc(String(v))}</span>`)
    .join('');

  return `
  <article class="s-card">
    <div class="s-card__sku">SKU ${esc(p.sku)}</div>
    <h3 class="s-card__name">${esc(p.name)}</h3>
    ${p.description ? `<p class="s-card__desc">${esc(p.description)}</p>` : ''}
    <div class="s-card__price">$${esc(dollars)}</div>
    <div class="s-card__badges">
      ${!p.in_stock ? '<span class="s-card__badge s-card__badge--oos">Out of stock</span>' : ''}
      ${badges}
    </div>
    <button class="s-card__cta">Inquire</button>
  </article>`;
}

function renderCountdown() {
  return `<div class="countdown">
    <span class="countdown__label">Limited offer ends in</span>
    <span class="countdown__time" id="cd-time">--:--:--</span>
  </div>`;
}

function countdownScript() {
  return `<script>
(function(){
  var end = new Date(); end.setHours(end.getHours() + 24, 0, 0, 0);
  function tick(){
    var d = end - Date.now();
    if(d <= 0){ document.getElementById('cd-time').textContent = '00:00:00'; return; }
    var h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000);
    document.getElementById('cd-time').textContent = [h,m,s].map(function(n){return String(n).padStart(2,'0');}).join(':');
    setTimeout(tick, 1000);
  }
  tick();
})();
</script>`;
}

function renderNewsletterModal() {
  return `<div class="nl-overlay" id="nl-overlay" role="dialog" aria-modal="true" aria-label="Newsletter signup">
  <div class="nl-modal">
    <button class="nl-close" id="nl-close">Close ✕</button>
    <h2 class="nl-modal__title">Stay in the loop.</h2>
    <p class="nl-modal__lede">New arrivals, exclusive drops. No noise.</p>
    <form class="nl-form" id="nl-form">
      <input class="nl-input" type="email" placeholder="your@email.com" required aria-label="Email address" />
      <button type="submit" class="nl-btn">Subscribe</button>
    </form>
  </div>
</div>`;
}

function newsletterScript() {
  return `<script>
(function(){
  var overlay = document.getElementById('nl-overlay');
  var closeBtn = document.getElementById('nl-close');
  var form = document.getElementById('nl-form');
  setTimeout(function(){ overlay.classList.add('active'); }, 3500);
  closeBtn.addEventListener('click', function(){ overlay.classList.remove('active'); });
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.classList.remove('active'); });
  form.addEventListener('submit', function(e){ e.preventDefault(); overlay.classList.remove('active'); });
})();
</script>`;
}
