import { esc, getCookie } from '../_lib/helpers.js';

const CACHE_TTL = 60;

export async function onRequestGet({ params, env, request }) {
  const { slug }    = params;
  const url         = new URL(request.url);
  const isPreview   = url.searchParams.get('preview') === '1';

  if (!isPreview) {
    const cache    = caches.default;
    const cacheKey = new Request(`https://store-cache.internal/${slug}`);
    const cached   = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const store = await env.DB.prepare('SELECT * FROM stores WHERE slug = ?')
    .bind(slug).first();

  if (!store) {
    return new Response('Store not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
  }

  let config;
  if (isPreview) {
    const sessionId = getCookie(request, 'session_id');
    let isOwner     = false;
    if (sessionId) {
      const session = await env.DB.prepare(
        "SELECT owner_id FROM sessions WHERE id = ? AND expires_at > datetime('now')"
      ).bind(sessionId).first();
      isOwner = session?.owner_id === store.owner_id;
    }
    const raw = isOwner && store.preview_config ? store.preview_config : store.config;
    try { config = JSON.parse(raw || '{}'); } catch { config = {}; }
  } else {
    try { config = JSON.parse(store.config || '{}'); } catch { config = {}; }
  }

  const { results: products } = await env.DB.prepare(
    'SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC'
  ).bind(store.id).all();

  const html = renderStorefront(store, config, products || []);
  const response = new Response(html, {
    headers: {
      'Content-Type':  'text/html;charset=UTF-8',
      'Cache-Control': isPreview ? 'private, no-store' : `public, s-maxage=${CACHE_TTL}`,
    },
  });

  if (!isPreview) {
    const cache    = caches.default;
    const cacheKey = new Request(`https://store-cache.internal/${slug}`);
    await cache.put(cacheKey, response.clone());
  }
  return response;
}

// ── Top-level renderer ────────────────────────────────────────────────────────

function renderStorefront(store, config, products) {
  const name     = config.name  || store.name || store.slug;
  const theme    = config.theme    || {};
  const seo      = config.seo      || {};
  const features = config.features || {};
  const accent   = theme.accent    || '#e2a14a';
  const logo     = config.logo     || '';
  const sections = Array.isArray(config.sections) && config.sections.length
    ? config.sections : null;

  const floaters = sections ? sections.filter(s => s.type === 'floating-cta') : [];
  const body     = sections
    ? sections.filter(s => s.type !== 'floating-cta').map(s => renderSection(s, products, config)).join('\n')
    : renderLegacyBody(store, config, products);

  return `<!DOCTYPE html>
<html lang="en">
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
      padding: 14px var(--pad);
      background: color-mix(in srgb, var(--bg) 88%, transparent);
      backdrop-filter: blur(14px) saturate(120%);
      border-bottom: 1px solid var(--line-soft);
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .s-bar__logo { height: 32px; width: auto; object-fit: contain; }
    .s-bar__name { font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase; }
    .s-bar__back { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none; transition: color 160ms ease; }
    .s-bar__back:hover { color: var(--accent); }

    /* ── Countdown ── */
    .countdown {
      padding: 12px var(--pad); background: var(--accent); color: #fff;
      display: flex; align-items: center; gap: 20px; font-family: var(--mono);
    }
    .countdown__label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.85; }
    .countdown__time  { font-size: 20px; letter-spacing: 0.06em; }

    /* ── Hero (base) ── */
    .s-hero { border-bottom: 1px solid var(--line); }
    .s-hero__inner { padding: 80px var(--pad) 60px; }
    .s-hero__tag   { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 20px; }
    .s-hero__title { font-family: var(--serif);
      font-size: clamp(52px, 9vw, 128px); line-height: 0.93;
      letter-spacing: -0.02em; font-weight: 400; margin: 0 0 24px; }
    .s-hero__desc  { font-family: var(--serif); font-style: italic;
      font-size: clamp(18px, 1.8vw, 26px); color: var(--fg-soft); max-width: 60ch; margin: 0; }
    .s-hero__cta   {
      display: inline-block; margin-top: 32px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 14px 32px;
      background: var(--fg); color: var(--bg); text-decoration: none;
      transition: opacity 160ms ease;
    }
    .s-hero__cta:hover { opacity: 0.8; }

    /* ── Hero with image ── */
    .s-hero--img { position: relative; overflow: hidden; min-height: 60vh; display: flex; align-items: center; }
    .s-hero__bg  { position: absolute; inset: 0; background-size: cover; background-position: center; }
    .s-hero__overlay { position: absolute; inset: 0; background: rgba(0,0,0,.48); }
    .s-hero--img .s-hero__inner { position: relative; z-index: 1; width: 100%; }
    .s-hero--img .s-hero__tag,
    .s-hero--img .s-hero__title,
    .s-hero--img .s-hero__desc { color: #fff; }
    .s-hero--img .s-hero__cta  { background: #fff; color: #1c1a16; }

    /* ── Alignment ── */
    .s-hero--center .s-hero__inner { text-align: center; }
    .s-hero--center .s-hero__desc  { margin-left: auto; margin-right: auto; }
    .s-hero--right  .s-hero__inner { text-align: right; }
    .s-hero--right  .s-hero__desc  { margin-left: auto; }

    /* ── Text banner ── */
    .s-banner { padding: 14px var(--pad); font-family: var(--mono); }
    .s-banner--center { text-align: center; }
    .s-banner--right  { text-align: right; }
    .s-banner__text   { font-size: 12px; letter-spacing: 0.12em; }

    /* ── Products ── */
    .s-products { padding: 64px var(--pad); }
    .s-products__head { margin-bottom: 48px; }
    .s-products__tag  { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .s-products__title { font-family: var(--serif);
      font-size: clamp(36px, 4.5vw, 64px); letter-spacing: -0.02em; margin: 0; }
    .s-products__title em { color: var(--fg-soft); font-style: italic; }

    .s-grid { display: grid; border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
    .s-card {
      border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
      display: flex; flex-direction: column; gap: 12px;
      background: var(--bg); transition: background 200ms ease; overflow: hidden;
    }
    .s-card:hover { background: color-mix(in srgb, var(--accent) 5%, var(--bg)); }
    .s-card__img  {
      width: 100%; aspect-ratio: 4/3;
      background-size: cover; background-position: center;
      background-color: var(--line-soft);
    }
    .s-card__body { padding: 0 24px 28px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .s-card--noimg .s-card__body { padding-top: 28px; }
    .s-card__sku   { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .s-card__name  { font-family: var(--serif); font-size: 24px;
      letter-spacing: -0.01em; line-height: 1.1; }
    .s-card__desc  { font-family: var(--serif); font-style: italic;
      font-size: 14px; color: var(--fg-soft); flex: 1; }
    .s-card__price { font-family: var(--serif); font-size: 34px; letter-spacing: -0.02em; line-height: 1; }
    .s-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .s-card__badge  { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 7px;
      border: 1px solid var(--line); color: var(--fg-faint); }
    .s-card__badge--oos { border-color: #b33; color: #b33; }
    .s-card__cta {
      margin-top: auto; padding: 12px 0;
      border-top: 1px solid var(--line-soft); border: none; border-top: 1px solid var(--line-soft);
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
      background: none; color: var(--fg); width: 100%;
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; transition: color 160ms ease;
    }
    .s-card__cta:hover  { color: var(--accent); }
    .s-card__cta::after { content: "→"; }

    /* ── Image gallery ── */
    .s-gallery { padding: 64px var(--pad); }
    .s-gallery__title { font-family: var(--serif);
      font-size: clamp(32px, 4.5vw, 56px); letter-spacing: -0.02em; margin: 0 0 40px; }
    .s-gallery__grid { display: grid; gap: 12px; }
    .s-gallery__grid--2 { grid-template-columns: repeat(2, 1fr); }
    .s-gallery__grid--3 { grid-template-columns: repeat(3, 1fr); }
    .s-gallery__grid--4 { grid-template-columns: repeat(4, 1fr); }
    .s-gallery__item { position: relative; aspect-ratio: 4/3; overflow: hidden; }
    .s-gallery__item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .s-gallery__caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 8px 12px; background: rgba(0,0,0,.55); color: #fff;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
    }

    /* ── Rich text ── */
    .s-rich { padding: 64px var(--pad); }
    .s-rich--center { text-align: center; }
    .s-rich--right  { text-align: right; }
    .s-rich__inner { margin: 0 auto; }
    .s-rich--narrow .s-rich__inner { max-width: 60ch; }
    .s-rich--normal .s-rich__inner { max-width: 80ch; }
    .s-rich--wide   .s-rich__inner { max-width: 100%; }
    .s-rich p  { font-family: var(--serif); font-size: 18px; color: var(--fg-soft); line-height: 1.75; }
    .s-rich h2 { font-family: var(--serif); font-size: clamp(28px,3vw,44px); letter-spacing: -0.02em; }

    /* ── Floating CTAs ── */
    .s-floats { position: fixed; inset: 0; z-index: 50; pointer-events: none; }
    .s-float {
      position: absolute; pointer-events: auto;
      display: flex; align-items: center; gap: 8px; padding: 12px 18px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
      text-decoration: none; color: #fff; border-radius: 2px;
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .s-float:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,.32); }
    .s-float--bottom-right { bottom: 28px; right: 28px; }
    .s-float--bottom-left  { bottom: 28px; left:  28px; }
    .s-float--top-right    { top: 88px;    right: 28px; }
    .s-float--top-left     { top: 88px;    left:  28px; }
    .s-float__icon { font-size: 16px; line-height: 1; }

    /* ── Empty ── */
    .s-empty { padding: 80px var(--pad); text-align: center; border-top: 1px solid var(--line); }
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
    .nl-overlay { position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; transition: opacity 360ms ease; }
    .nl-overlay.active { opacity: 1; pointer-events: auto; }
    .nl-modal { background: var(--bg); border: 1px solid var(--line);
      padding: 48px; max-width: 460px; width: calc(100% - 40px);
      display: flex; flex-direction: column; gap: 22px; }
    .nl-modal__title { font-family: var(--serif);
      font-size: clamp(28px, 5vw, 52px); letter-spacing: -0.02em; margin: 0; }
    .nl-modal__lede  { font-family: var(--serif); font-style: italic;
      font-size: 17px; color: var(--fg-soft); margin: 0; }
    .nl-form  { display: flex; border: 1px solid var(--line); }
    .nl-input { flex: 1; background: transparent; border: none; outline: none;
      font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em;
      color: var(--fg); padding: 12px 16px; }
    .nl-btn   { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 12px 20px;
      background: var(--fg); color: var(--bg); border: none; cursor: pointer; }
    .nl-close { align-self: flex-end; background: none; border: none;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--fg-faint); cursor: pointer; }

    @media (max-width: 700px) {
      .s-grid { grid-template-columns: 1fr !important; }
      .s-gallery__grid--3, .s-gallery__grid--4 { grid-template-columns: repeat(2, 1fr); }
      .s-foot { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <nav class="s-bar">
    <div style="display:flex;align-items:center;gap:12px">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" class="s-bar__logo" />` : ''}
      <span class="s-bar__name">${esc(name)}</span>
    </div>
    <a href="/" class="s-bar__back">← MaxCyberSolutions</a>
  </nav>

  ${features.hasDiscountCountdown ? renderCountdown() : ''}

  ${body}

  ${features.hasNewsletterPopup ? renderNewsletterModal() : ''}

  ${floaters.length ? `<div class="s-floats">${floaters.map(renderFloatingCta).join('\n')}</div>` : ''}

  <footer class="s-foot">
    <span class="s-foot__brand">Powered by MaxCyberSolutions</span>
    <a href="/" class="s-foot__link">maxcybersolutions.com ↗</a>
  </footer>

  ${features.hasDiscountCountdown ? countdownScript()  : ''}
  ${features.hasNewsletterPopup   ? newsletterScript() : ''}
</body>
</html>`;
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(section, products, config) {
  switch (section.type) {
    case 'hero':          return renderHero(section, config);
    case 'product-grid':  return renderProductGrid(section, products);
    case 'text-banner':   return renderBanner(section);
    case 'image-gallery': return renderGallery(section);
    case 'rich-text':     return renderRichText(section);
    default:              return '';
  }
}

function renderHero(s, config) {
  const align  = s.align || 'left';
  const cta    = s.cta   || {};
  const ctaHtml = cta.label && cta.url
    ? `<a href="${esc(cta.url)}" class="s-hero__cta">${esc(cta.label)}</a>` : '';

  const inner = `
    <p class="s-hero__tag">Store &nbsp;/&nbsp; ${esc((config.name || ''))}</p>
    <h1 class="s-hero__title">${esc(s.headline || '')}</h1>
    ${s.subline ? `<p class="s-hero__desc">${esc(s.subline)}</p>` : ''}
    ${ctaHtml}`;

  if (s.image) {
    return `<header class="s-hero s-hero--img s-hero--${esc(align)}">
  <div class="s-hero__bg" style="background-image:url('${esc(s.image)}')"></div>
  ${s.overlay ? '<div class="s-hero__overlay"></div>' : ''}
  <div class="s-hero__inner">${inner}</div>
</header>`;
  }

  return `<header class="s-hero s-hero--${esc(align)}">
  <div class="s-hero__inner">${inner}</div>
</header>`;
}

function renderProductGrid(s, products) {
  const cols     = parseInt(s.columns) || 3;
  const minW     = cols === 2 ? 340 : cols === 4 ? 220 : 280;
  const filtered = s.showOutOfStock === false ? products.filter(p => p.in_stock) : products;

  return `<section class="s-products" id="products">
  <div class="s-products__head">
    ${s.tag   ? `<p class="s-products__tag">${esc(s.tag)}</p>` : ''}
    ${s.title ? `<h2 class="s-products__title">${esc(s.title)}</h2>` : ''}
  </div>
  ${filtered.length
    ? `<div class="s-grid" style="grid-template-columns:repeat(auto-fill,minmax(${minW}px,1fr))">
        ${filtered.map(renderCard).join('')}
       </div>`
    : `<div class="s-empty"><p class="s-empty__text">No products yet &mdash; check back soon.</p></div>`}
</section>`;
}

function renderBanner(s) {
  const bg    = s.bg    || '#1c1a16';
  const color = s.color || '#e2a14a';
  const align = s.align || 'center';
  return `<div class="s-banner s-banner--${esc(align)}" style="background:${esc(bg)};color:${esc(color)}">
  <span class="s-banner__text">${esc(s.text || '')}</span>
</div>`;
}

function renderGallery(s) {
  const images = Array.isArray(s.images) ? s.images : [];
  const cols   = parseInt(s.columns) || 3;
  return `<section class="s-gallery">
  ${s.title ? `<h2 class="s-gallery__title">${esc(s.title)}</h2>` : ''}
  <div class="s-gallery__grid s-gallery__grid--${cols}">
    ${images.map(img => `<div class="s-gallery__item">
      <img src="${esc(img.url)}" alt="${esc(img.caption || '')}" loading="lazy" />
      ${img.caption ? `<span class="s-gallery__caption">${esc(img.caption)}</span>` : ''}
    </div>`).join('')}
  </div>
</section>`;
}

function renderRichText(s) {
  const align    = s.align    || 'left';
  const maxWidth = s.maxWidth || 'normal';
  // Content is owner-authored HTML — intentionally not escaped
  return `<section class="s-rich s-rich--${esc(align)} s-rich--${esc(maxWidth)}">
  <div class="s-rich__inner">${s.content || ''}</div>
</section>`;
}

function renderFloatingCta(s) {
  const ICONS = { whatsapp: '💬', phone: '📞', email: '✉️', link: '↗' };
  const icon  = ICONS[s.icon] || '↗';
  const pos   = s.position || 'bottom-right';
  const color = s.color    || '#25D366';
  return `<a href="${esc(s.url || '#')}" class="s-float s-float--${esc(pos)}"
  style="background:${esc(color)}" target="_blank" rel="noopener noreferrer">
  <span class="s-float__icon">${icon}</span>
  ${s.label ? `<span>${esc(s.label)}</span>` : ''}
</a>`;
}

// ── Card ──────────────────────────────────────────────────────────────────────

function renderCard(p) {
  const dollars = (p.price_cents / 100).toFixed(2);
  let meta = {};
  try { meta = JSON.parse(p.metadata || '{}'); } catch {}
  const badges = Object.entries(meta)
    .map(([k, v]) => `<span class="s-card__badge">${esc(k)}: ${esc(String(v))}</span>`)
    .join('');
  const hasImg = !!p.image;

  return `<article class="s-card${hasImg ? '' : ' s-card--noimg'}">
  ${hasImg ? `<div class="s-card__img" style="background-image:url('${esc(p.image)}')"></div>` : ''}
  <div class="s-card__body">
    <div class="s-card__sku">SKU ${esc(p.sku)}</div>
    <h3 class="s-card__name">${esc(p.name)}</h3>
    ${p.description ? `<p class="s-card__desc">${esc(p.description)}</p>` : ''}
    <div class="s-card__price">$${esc(dollars)}</div>
    <div class="s-card__badges">
      ${!p.in_stock ? '<span class="s-card__badge s-card__badge--oos">Out of stock</span>' : ''}
      ${badges}
    </div>
    <button class="s-card__cta">Inquire</button>
  </div>
</article>`;
}

// ── Legacy layout (backward compat — no sections in config) ───────────────────

function renderLegacyBody(store, config, products) {
  const name    = config.name || store.name || store.slug;
  const seo     = config.seo  || {};
  return `
<header class="s-hero">
  <div class="s-hero__inner">
    <p class="s-hero__tag">Store &nbsp;/&nbsp; ${esc(store.slug)}</p>
    <h1 class="s-hero__title">${esc(name)}</h1>
    ${seo.description ? `<p class="s-hero__desc">${esc(seo.description)}</p>` : ''}
  </div>
</header>
<section class="s-products" id="products">
  <div class="s-products__head">
    <p class="s-products__tag">§ Catalogue</p>
    <h2 class="s-products__title">All <em>products</em>.</h2>
  </div>
  ${products.length
    ? `<div class="s-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
        ${products.map(renderCard).join('')}
       </div>`
    : `<div class="s-empty"><p class="s-empty__text">No products yet &mdash; check back soon.</p></div>`}
</section>`;
}

// ── Feature scripts ───────────────────────────────────────────────────────────

function renderCountdown() {
  return `<div class="countdown">
  <span class="countdown__label">Limited offer ends in</span>
  <span class="countdown__time" id="cd-time">--:--:--</span>
</div>`;
}

function countdownScript() {
  return `<script>
(function(){
  var end=new Date(); end.setHours(end.getHours()+24,0,0,0);
  function tick(){
    var d=end-Date.now(); if(d<=0){document.getElementById('cd-time').textContent='00:00:00';return;}
    var h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000);
    document.getElementById('cd-time').textContent=[h,m,s].map(function(n){return String(n).padStart(2,'0');}).join(':');
    setTimeout(tick,1000);
  } tick();
})();
</script>`;
}

function renderNewsletterModal() {
  return `<div class="nl-overlay" id="nl-overlay" role="dialog" aria-modal="true">
  <div class="nl-modal">
    <button class="nl-close" id="nl-close">Close ✕</button>
    <h2 class="nl-modal__title">Stay in the loop.</h2>
    <p class="nl-modal__lede">New arrivals, exclusive drops. No noise.</p>
    <form class="nl-form" id="nl-form">
      <input class="nl-input" type="email" placeholder="your@email.com" required />
      <button type="submit" class="nl-btn">Subscribe</button>
    </form>
  </div>
</div>`;
}

function newsletterScript() {
  return `<script>
(function(){
  var o=document.getElementById('nl-overlay'),c=document.getElementById('nl-close'),f=document.getElementById('nl-form');
  setTimeout(function(){o.classList.add('active');},3500);
  c.addEventListener('click',function(){o.classList.remove('active');});
  o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('active');});
  f.addEventListener('submit',function(e){e.preventDefault();o.classList.remove('active');});
})();
</script>`;
}
