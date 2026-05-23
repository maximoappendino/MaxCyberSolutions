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
    'SELECT * FROM products WHERE store_id = ? AND visible = 1 ORDER BY created_at DESC'
  ).bind(store.id).all();

  const html = renderStorefront(store, config, products || [], isPreview);
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

const STYLE_VARS = {
  max:    { r: '0px',  rb: '0px',  bw: '1px', sh: 'none',                             shc: 'none' },
  alexis: { r: '0px',  rb: '0px',  bw: '4px', sh: '4px 4px 0 var(--ink)',             shc: '8px 8px 0 var(--ink)' },
  alicia: { r: '6px',  rb: '6px',  bw: '1px', sh: '0 2px 16px rgba(0,0,0,.45)',       shc: '0 4px 28px rgba(0,0,0,.55)' },
  ciro:   { r: '12px', rb: '48px', bw: '1px', sh: '0 2px 12px rgba(0,0,0,.06)',       shc: '0 4px 20px rgba(0,0,0,.09)' },
  emilse: { r: '10px', rb: '20px', bw: '1px', sh: '0 4px 20px rgba(0,0,0,.08)',       shc: '0 6px 28px rgba(0,0,0,.11)' },
  frank:  { r: '4px',  rb: '4px',  bw: '1px', sh: '0 0 0 1px rgba(0,240,255,.12)',    shc: '0 0 24px rgba(0,240,255,.08)' },
  gaspar: { r: '20px', rb: '20px', bw: '2px', sh: 'none',                             shc: 'none' },
  nani:   { r: '0px',  rb: '0px',  bw: '1px', sh: '0 1px 8px rgba(0,0,0,.04)',        shc: '0 2px 16px rgba(0,0,0,.06)' },
  saira:  { r: '8px',  rb: '8px',  bw: '0px', sh: '0 8px 32px rgba(0,0,0,.12)',       shc: '0 12px 40px rgba(0,0,0,.15)' },
  vivi:   { r: '0px',  rb: '2px',  bw: '1px', sh: 'none',                             shc: '0 2px 8px rgba(0,0,0,.07)' },
};

function renderStorefront(store, config, products, isPreview = false) {
  const name     = config.name  || store.name || store.slug;
  const theme    = config.theme    || {};
  const seo      = config.seo      || {};
  const features = config.features || {};
  const accent   = theme.accent    || '#e2a14a';
  const bgColor  = theme.bg        || '#efeae0';
  const fgColor  = theme.fg        || '#1c1a16';
  const logo     = config.logo     || '';
  const fonts    = theme.fonts     || {};
  const sv       = STYLE_VARS[config.style] || STYLE_VARS.max;
  const sections = Array.isArray(config.sections) && config.sections.length
    ? config.sections : null;

  const hasHeaderSection = sections ? sections.some(s => s.type === 'header') : false;
  const hasFooterSection = sections ? sections.some(s => s.type === 'footer') : false;

  const floaters    = sections ? sections.filter(s => s.type === 'floating-cta') : [];
  const customBtns  = Array.isArray(config.buttons) ? config.buttons.filter(b => b.text && b.url) : [];
  const body        = sections
    ? sections.filter(s => s.type !== 'floating-cta').map(s => renderSection(s, products, config)).join('\n')
    : renderLegacyBody(store, config, products);

  // Custom font links (onerror falls through to CSS fallback stack)
  const fontLinks = [fonts.titleUrl, fonts.bodyUrl, fonts.accentUrl, fonts.sloganUrl]
    .filter(Boolean)
    .map(u => `<link rel="stylesheet" href="${esc(u)}" />`)
    .join('\n  ');

  const fgSoft  = fgColor === '#1c1a16' ? '#45403a' : fgColor + 'bb';
  const fgFaint = fgColor === '#1c1a16' ? '#7a736a' : fgColor + '77';
  const ruleSoft = bgColor === '#efeae0' ? '#e2dccd' : bgColor + '44';

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
  ${fontLinks}
  <link rel="icon" href="/img/icon.webp" type="image/webp" />
  <style>
    :root {
      --accent:      ${esc(accent)};
      --accent-soft: color-mix(in srgb, ${esc(accent)} 18%, transparent);
      --cream: ${esc(bgColor)}; --ink: ${esc(fgColor)};
      --ink-soft: ${esc(fgSoft)}; --ink-faint: ${esc(fgFaint)};
      --rule: #d4cdbd; --rule-soft: ${esc(ruleSoft)};
      --bg: var(--cream); --fg: var(--ink);
      --fg-soft: var(--ink-soft); --fg-faint: var(--ink-faint);
      --line: var(--rule); --line-soft: var(--rule-soft);
      --serif: ${fonts.titleFamily  ? `"${esc(fonts.titleFamily)}"  ,` : ''}"Cormorant Garamond", Georgia, serif;
      --sans:  ${fonts.bodyFamily   ? `"${esc(fonts.bodyFamily)}"   ,` : ''}"DM Sans", sans-serif;
      --mono:  ${fonts.accentFamily ? `"${esc(fonts.accentFamily)}" ,` : ''}"JetBrains Mono", monospace;
      --slogan:${fonts.sloganFamily ? `"${esc(fonts.sloganFamily)}" ,` : ''}"Cormorant Garamond", Georgia, serif;
      --pad:   clamp(24px, 6vw, 96px);
      --s-radius: ${sv.r}; --s-radius-btn: ${sv.rb};
      --s-border-w: ${sv.bw}; --s-shadow: ${sv.sh}; --s-shadow-card: ${sv.shc};
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0;
      background: var(--bg); color: var(--fg);
      font-family: var(--sans); font-size: 16px; line-height: 1.5;
      -webkit-font-smoothing: antialiased; }
    body { overflow-x: hidden; }
    h1,h2,h3,h4,p,span,a { overflow-wrap: break-word; word-break: break-word; }
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
      border-radius: var(--s-radius-btn); border: var(--s-border-w) solid var(--fg);
      box-shadow: var(--s-shadow);
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
    .s-banner__sub    { font-size: 11px; opacity: .75; display: block; margin-top: 3px; }
    .s-banner__cta    { display: inline-block; margin-left: 16px; font-size: 10px;
      letter-spacing: 0.13em; text-transform: uppercase; padding: 5px 14px;
      border: 1px solid currentColor; color: inherit; text-decoration: none; border-radius: var(--s-radius-btn); }
    .s-banner--sticky { position: sticky; top: 0; z-index: 30; }
    .s-banner--dismiss-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: inherit; cursor: pointer; font-size: 14px; opacity: .6; }
    .s-banner--relative { position: relative; }
    .s-banner--marquee { overflow: hidden; padding-top: 12px; padding-bottom: 12px; }
    .s-banner__marquee { display: flex; gap: 80px; animation: s-marquee 22s linear infinite; width: max-content; }
    .s-banner__marquee span { white-space: nowrap; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
    @keyframes s-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    /* ── Products ── */
    .s-products { padding: 64px var(--pad); }
    .s-products__head { margin-bottom: 48px; }
    .s-products__tag  { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .s-products__title { font-family: var(--serif);
      font-size: clamp(36px, 4.5vw, 64px); letter-spacing: -0.02em; margin: 0; }
    .s-products__title em { color: var(--fg-soft); font-style: italic; }

    /* ── Filter / Sort toolbar ── */
    .s-grid-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 16px 0; border-top: 1px solid var(--line-soft); margin-bottom: 0; }
    .s-grid-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .s-filter-btn { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 6px 14px; background: transparent;
      border: 1px solid var(--line); color: var(--fg-faint); cursor: pointer;
      border-radius: var(--s-radius-btn); transition: all 160ms ease; }
    .s-filter-btn:hover        { color: var(--fg); border-color: var(--fg); }
    .s-filter-btn--active      { background: var(--fg); color: var(--bg); border-color: var(--fg); }
    .s-filter-btn--tag.s-filter-btn--active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .s-sort-select { margin-left: auto; font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.08em; padding: 6px 12px; background: var(--bg); color: var(--fg);
      border: 1px solid var(--line); border-radius: var(--s-radius-btn); cursor: pointer; }

    /* Grid base */
    .s-grid { display: grid; border-top: 1px solid var(--line); border-left: 1px solid var(--line); }

    /* Grid layout: list */
    .s-grid--list { grid-template-columns: 1fr !important; }
    .s-grid--list .s-card { flex-direction: row; min-height: 200px; }
    .s-grid--list .s-card__img { width: 260px; min-width: 260px; aspect-ratio: unset; flex-shrink: 0; }

    /* Grid layout: featured (first item spans 2 cols) */
    .s-grid--featured .s-card:first-child { grid-column: span 2; }
    .s-grid--featured .s-card:first-child .s-card__img { aspect-ratio: 16/9; }
    .s-grid--featured .s-card:first-child .s-card__name { font-size: clamp(28px, 3vw, 42px); }

    /* Grid layout: minimal (2 cols, generous spacing) */
    .s-grid--minimal .s-card__body { padding: 32px 36px 44px; gap: 18px; }
    .s-grid--minimal .s-card__name { font-size: 28px; }
    .s-grid--minimal .s-card__price { font-size: 40px; }

    .s-card {
      border-right: var(--s-border-w) solid var(--line); border-bottom: var(--s-border-w) solid var(--line);
      border-radius: var(--s-radius); box-shadow: var(--s-shadow-card);
      display: flex; flex-direction: column; gap: 12px;
      background: var(--bg); transition: background 200ms ease; overflow: hidden; position: relative;
    }
    .s-card:hover { background: color-mix(in srgb, var(--accent) 5%, var(--bg)); }
    .s-card__img  {
      width: 100%; aspect-ratio: 4/3;
      background-size: cover; background-position: center;
      background-color: var(--line-soft); transition: transform 300ms ease, opacity 300ms ease;
    }
    /* Hover effects */
    .s-card--zoom:hover .s-card__img    { transform: scale(1.06); }
    .s-card--fade:hover .s-card__img    { opacity: 0.78; }
    .s-card--overlay::after { content: ''; position: absolute; inset: 0; background: transparent; transition: background 300ms ease; pointer-events: none; }
    .s-card--overlay:hover::after { background: rgba(0,0,0,.18); }

    .s-card__body { padding: 0 24px 28px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .s-card--noimg .s-card__body { padding-top: 28px; }
    .s-card__sku   { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .s-card__name  { font-family: var(--serif); font-size: 24px;
      letter-spacing: -0.01em; line-height: 1.1; }
    .s-card__cat   { font-family: var(--mono); font-size: 9px; letter-spacing: 0.15em;
      text-transform: uppercase; color: var(--fg-faint); }
    .s-card__desc  { font-family: var(--serif); font-style: italic;
      font-size: 14px; color: var(--fg-soft); flex: 1; }
    .s-card__price { font-family: var(--serif); font-size: 34px; letter-spacing: -0.02em; line-height: 1; }
    .s-card__rating { font-family: var(--mono); font-size: 11px; color: var(--accent); letter-spacing: 0.05em; }
    .s-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .s-card__badge  { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 7px;
      border: var(--s-border-w) solid var(--line); border-radius: var(--s-radius-sm); color: var(--fg-faint); }
    .s-card__badge--oos { border-color: #b33; color: #b33; }
    .s-card__cta {
      margin-top: auto; padding: 12px 0;
      border-top: 1px solid var(--line-soft); border-left: none; border-right: none; border-bottom: none;
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
    .s-gallery__item { position: relative; overflow: hidden; }
    .s-gallery__item img { width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform 300ms ease, opacity 300ms ease; }
    .s-gallery__item--zoom:hover img   { transform: scale(1.06); }
    .s-gallery__item--fade:hover img   { opacity: 0.78; }
    .s-gallery__item--overlay::after { content: ''; position: absolute; inset: 0; background: transparent; transition: background 300ms ease; }
    .s-gallery__item--overlay:hover::after { background: rgba(0,0,0,.2); }
    .s-gallery__caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 8px 12px; background: rgba(0,0,0,.55); color: #fff;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
    }
    /* Gallery: strip layout (horizontal scroll) */
    .s-gallery--strip .s-gallery__grid { display: flex; overflow-x: auto; flex-wrap: nowrap; gap: 12px;
      scrollbar-width: thin; padding-bottom: 8px; }
    .s-gallery--strip .s-gallery__item { flex-shrink: 0; width: 300px; }
    /* Gallery: featured (first image larger) */
    .s-gallery--featured .s-gallery__item:first-child { grid-column: span 2; grid-row: span 2; }
    /* Gallery: minimal (2 cols, more gap) */
    .s-gallery--minimal .s-gallery__grid { gap: 20px; }

    /* ── Rich text / Text Block ── */
    .s-rich { padding: 64px var(--pad); }
    .s-rich--sm  { padding: 32px var(--pad); }
    .s-rich--lg  { padding: 96px var(--pad); }
    .s-rich--center { text-align: center; }
    .s-rich--center .s-rich__body { margin-left: auto; margin-right: auto; }
    .s-rich__inner { margin: 0 auto; }
    .s-rich--narrow .s-rich__inner { max-width: 60ch; }
    .s-rich--normal .s-rich__inner { max-width: 80ch; }
    .s-rich--wide   .s-rich__inner { max-width: 100%; }
    .s-rich__heading    { font-family: var(--serif); font-size: clamp(32px,4vw,56px);
      letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 16px; }
    .s-rich__subheading { font-family: var(--serif); font-style: italic;
      font-size: clamp(17px,1.8vw,22px); color: var(--fg-soft); margin: 0 0 28px; }
    .s-rich__body { font-family: var(--serif); font-size: 18px; color: var(--fg-soft);
      line-height: 1.75; max-width: 72ch; white-space: pre-wrap; }
    .s-rich__cta  { display: inline-block; margin-top: 28px; font-family: var(--mono);
      font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; padding: 12px 28px;
      border-radius: var(--s-radius-btn); border: var(--s-border-w) solid var(--fg);
      background: var(--fg); color: var(--bg); text-decoration: none; transition: opacity 160ms ease; }
    .s-rich__cta:hover { opacity: 0.82; }
    .s-rich__cta--outline { background: transparent; color: var(--fg); }
    .s-rich__cta--ghost   { background: transparent; border-color: transparent; }
    .s-rich p  { font-family: var(--serif); font-size: 18px; color: var(--fg-soft); line-height: 1.75; }
    .s-rich h2 { font-family: var(--serif); font-size: clamp(28px,3vw,44px); letter-spacing: -0.02em; }

    /* ── Floating CTAs ── */
    .s-floats { position: fixed; inset: 0; z-index: 50; pointer-events: none; }
    .s-float {
      position: absolute; pointer-events: auto;
      display: flex; align-items: center; gap: 8px; padding: 12px 18px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
      text-decoration: none; color: #fff; border-radius: var(--s-radius-btn);
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .s-float:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,.32); }
    .s-float--bottom-right { bottom: 28px; right: 28px; }
    .s-float--bottom-left  { bottom: 28px; left:  28px; }
    .s-float--top-right    { top: 88px;    right: 28px; }
    .s-float--top-left     { top: 88px;    left:  28px; }
    .s-float__icon { font-size: 16px; line-height: 1; }

    /* ── Carousel ── */
    .s-hero--carousel { position: relative; overflow: hidden; }
    .s-carousel__track { position: absolute; inset: 0; }
    .s-carousel__slide { position: absolute; inset: 0; background-size: cover; background-position: center;
      opacity: 0; transition: opacity 900ms ease; }
    .s-carousel__slide.active { opacity: 1; }
    .s-carousel__btn {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 2;
      background: rgba(255,255,255,.18); border: none; color: #fff;
      font-size: 28px; line-height: 1; padding: 10px 16px; cursor: pointer;
      backdrop-filter: blur(4px); transition: background 160ms ease;
    }
    .s-carousel__btn:hover { background: rgba(255,255,255,.35); }
    .s-carousel__btn--prev { left: 16px; }
    .s-carousel__btn--next { right: 16px; }

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

    /* ── Header section ── */
    .s-announce {
      padding: 0 var(--pad); display: flex; align-items: center; justify-content: center;
      gap: 16px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; position: relative;
    }
    .s-announce--sticky { position: sticky; top: 0; z-index: 50; }
    .s-announce__dismiss {
      position: absolute; right: var(--pad); background: none; border: none; cursor: pointer;
      font-family: var(--mono); font-size: 14px; opacity: 0.6; color: inherit; line-height: 1;
      transition: opacity 160ms; padding: 4px;
    }
    .s-announce__dismiss:hover { opacity: 1; }
    .s-announce__label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.85; }
    .s-announce__time  { font-size: 18px; letter-spacing: 0.06em; }
    .s-header {
      padding: 14px var(--pad);
      display: flex; align-items: center;
    }
    .s-header--sticky-always,
    .s-header--sticky-smart,
    .s-header--sticky-shrinking { position: sticky; top: 0; z-index: 40; }
    .s-header--sticky-partial   { position: sticky; top: 0; z-index: 40; }
    .s-header--sticky-floating  { position: fixed; top: 0; left: 0; right: 0; z-index: 40; }
    .s-header__inner {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .s-header--centered-logo .s-header__inner { justify-content: center; gap: 24px; }
    .s-header__brand { display: flex; align-items: center; gap: 12px; }
    .s-header__actions { display: flex; align-items: center; gap: 14px; }
    .s-header__action {
      background: none; border: none; cursor: pointer; font-size: 18px; color: inherit;
      padding: 4px; transition: opacity 160ms; line-height: 1;
    }
    .s-header__action:hover { opacity: 0.65; }
    .s-header__lang {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    }

    /* ── Footer section ── */
    .s-section-foot { border-top: 1px solid var(--line); }
    .s-section-foot__newsletter {
      padding: 48px var(--pad); border-bottom: 1px solid var(--line-soft);
      display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;
    }
    .s-section-foot__nl-title {
      font-family: var(--serif); font-size: clamp(24px,3vw,40px); letter-spacing: -0.02em; margin: 0;
    }
    .s-section-foot__nl-text {
      font-family: var(--serif); font-style: italic; font-size: 15px; color: var(--fg-soft); margin: 0;
    }
    .s-section-foot__bottom {
      padding: 20px var(--pad); display: flex; flex-wrap: wrap; align-items: center;
      justify-content: space-between; gap: 16px;
    }
    .s-section-foot__copyright {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint);
    }
    .s-section-foot__socials { display: flex; gap: 16px; align-items: center; }
    .s-section-foot__social {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none; transition: color 160ms;
    }
    .s-section-foot__social:hover { color: var(--accent); }
    .s-section-foot__legal { display: flex; gap: 16px; align-items: center; }
    .s-section-foot__legal a {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none; transition: color 160ms;
    }
    .s-section-foot__legal a:hover { color: var(--fg); }
    .s-section-foot__pay {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-faint);
    }

    /* ── Newsletter modal ── */
    .nl-overlay { position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; transition: opacity 360ms ease; }
    .nl-overlay.active { opacity: 1; pointer-events: auto; }
    .nl-modal { background: var(--bg); border: var(--s-border-w) solid var(--line);
      border-radius: var(--s-radius); box-shadow: var(--s-shadow-card);
      padding: 48px; max-width: 460px; width: calc(100% - 40px);
      display: flex; flex-direction: column; gap: 22px; }
    .nl-modal__title { font-family: var(--serif);
      font-size: clamp(28px, 5vw, 52px); letter-spacing: -0.02em; margin: 0; }
    .nl-modal__lede  { font-family: var(--serif); font-style: italic;
      font-size: 17px; color: var(--fg-soft); margin: 0; }
    .nl-form  { display: flex; border: var(--s-border-w) solid var(--line); border-radius: var(--s-radius-btn); overflow: hidden; }
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
  ${!hasHeaderSection ? `<nav class="s-bar">
    <div style="display:flex;align-items:center;gap:12px">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" class="s-bar__logo" />` : ''}
      <span class="s-bar__name">${esc(name)}</span>
    </div>
    <a href="/" class="s-bar__back">← MaxCyberSolutions</a>
  </nav>` : ''}

  ${features.hasDiscountCountdown && !hasHeaderSection ? renderCountdown() : ''}

  ${body}

  ${features.hasNewsletterPopup && !isPreview ? renderNewsletterModal() : ''}

  ${floaters.length || customBtns.length ? `<div class="s-floats">
    ${floaters.map(renderFloatingCta).join('\n')}
    ${customBtns.map((b, i) => renderCustomBtn(b, i)).join('\n')}
  </div>` : ''}

  ${!hasFooterSection ? `<footer class="s-foot">
    <span class="s-foot__brand">Powered by MaxCyberSolutions</span>
    <a href="/" class="s-foot__link">maxcybersolutions.com ↗</a>
  </footer>` : ''}

  ${features.hasDiscountCountdown && !hasHeaderSection ? countdownScript() : ''}
  ${features.hasNewsletterPopup && !isPreview ? newsletterScript() : ''}
</body>
</html>`;
}

// ── Section dispatcher ────────────────────────────────────────────────────────

function renderSection(section, products, config) {
  if (section.hidden) return '';
  switch (section.type) {
    case 'header':        return renderHeader(section, config);
    case 'hero':          return renderHero(section, config);
    case 'product-grid':  return renderProductGrid(section, products);
    case 'text-banner':   return renderBanner(section);
    case 'image-gallery': return renderGallery(section);
    case 'rich-text':     return renderRichText(section);
    case 'footer':        return renderFooter(section, config);
    default:              return '';
  }
}

function renderHeader(s, config) {
  const theme  = config.theme || {};
  const logo   = config.logo  || '';
  const name   = config.name  || '';
  const c      = s.colors || {};
  const bg     = c.bg     || theme.bg     || '#efeae0';
  const fg     = c.fg     || theme.fg     || '#1c1a16';
  const accent = c.accent || theme.accent || '#e2a14a';

  const annBg    = s.announcementBg    || '#1c1a16';
  const annColor = s.announcementColor || '#e2a14a';
  const annH     = s.announcementHeight || 40;

  let announceBar = '';
  if (s.announcementEnabled) {
    const dismissBtn = s.announcementDismissible
      ? `<button class="s-announce__dismiss" onclick="this.closest('.s-announce').remove()" aria-label="Dismiss">✕</button>` : '';
    const stickyClass = s.announcementSticky ? ' s-announce--sticky' : '';
    if (s.countdownEnabled && s.countdownEnd) {
      announceBar = `<div class="s-announce${stickyClass}" id="s-announce"
        style="background:${esc(annBg)};color:${esc(annColor)};min-height:${annH}px">
        <span class="s-announce__label">Limited offer ends in</span>
        <span class="s-announce__time" id="cd-time">--:--:--</span>
        ${dismissBtn}
      </div>`;
    } else {
      announceBar = `<div class="s-announce${stickyClass}" id="s-announce"
        style="background:${esc(annBg)};color:${esc(annColor)};min-height:${annH}px">
        <span>${esc(s.announcementText || '')}</span>
        ${dismissBtn}
      </div>`;
    }
  }

  const sticky      = s.sticky      || 'smart';
  const stickyStyle = s.stickyStyle || 'solid';
  const layout      = s.layout      || 'left-aligned';

  let headerBg   = esc(bg);
  let extraStyle = `border-bottom:1px solid var(--line-soft);`;
  if (stickyStyle === 'transparent') {
    headerBg   = 'transparent';
  } else if (stickyStyle === 'blur') {
    headerBg   = `color-mix(in srgb, ${esc(bg)} 88%, transparent)`;
    extraStyle += 'backdrop-filter:blur(14px) saturate(120%);';
  }

  const actions = [];
  if (s.showSearch  !== false) actions.push('<button class="s-header__action" title="Search" aria-label="Search">⌕</button>');
  if (s.showAccount !== false) actions.push('<button class="s-header__action" title="Account" aria-label="Account">◎</button>');
  if (s.showWishlist)          actions.push('<button class="s-header__action" title="Wishlist" aria-label="Wishlist">♡</button>');
  if (s.showCart    !== false) actions.push('<button class="s-header__action" title="Cart" aria-label="Cart">⊞</button>');
  if (s.showLanguage !== false) actions.push('<span class="s-header__lang">EN</span>');
  if (s.showCurrency)          actions.push('<span class="s-header__lang">USD</span>');

  const countdownJs = s.countdownEnabled && s.countdownEnd
    ? `<script>(function(){
  var end=new Date(${JSON.stringify(s.countdownEnd)});
  function tick(){
    var d=end-Date.now();if(d<=0){document.getElementById('cd-time').textContent='00:00:00';return;}
    var h=Math.floor(d/3600000),m=Math.floor(d%3600000/60000),sec=Math.floor(d%60000/1000);
    document.getElementById('cd-time').textContent=[h,m,sec].map(function(n){return String(n).padStart(2,'0');}).join(':');
    setTimeout(tick,1000);
  }tick();
})();</script>` : '';

  return `${announceBar}
<header class="s-header s-header--${esc(layout)} s-header--sticky-${esc(sticky)}"
  style="background:${headerBg};color:${esc(fg)};${extraStyle}">
  <div class="s-header__inner">
    <div class="s-header__brand">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" class="s-bar__logo" />` : ''}
      <span class="s-bar__name">${esc(name)}</span>
    </div>
    <div class="s-header__actions">
      ${actions.join('\n      ')}
    </div>
  </div>
</header>
${countdownJs}`;
}

function renderFooter(s, config) {
  const theme  = config.theme || {};
  const c      = s.colors || {};
  const bg     = c.bg     || theme.bg     || '#efeae0';
  const fg     = c.fg     || theme.fg     || '#1c1a16';
  const accent = c.accent || theme.accent || '#e2a14a';
  const name   = config.name || '';

  const nlHtml = s.newsletterEnabled !== false ? `
  <div class="s-section-foot__newsletter" style="background:${esc(bg)};color:${esc(fg)}">
    <h3 class="s-section-foot__nl-title">${esc(s.newsletterTitle || 'Stay in the loop.')}</h3>
    ${s.newsletterText ? `<p class="s-section-foot__nl-text">${esc(s.newsletterText)}</p>` : ''}
    <form class="nl-form" onsubmit="event.preventDefault()">
      <input class="nl-input" type="email" placeholder="your@email.com" required />
      <button type="submit" class="nl-btn" style="background:${esc(fg)};color:${esc(bg)}">Subscribe</button>
    </form>
  </div>` : '';

  const socials = [
    s.socialInstagram ? `<a href="${esc(s.socialInstagram)}" class="s-section-foot__social" target="_blank" rel="noopener">Instagram</a>` : '',
    s.socialTiktok    ? `<a href="${esc(s.socialTiktok)}"   class="s-section-foot__social" target="_blank" rel="noopener">TikTok</a>`    : '',
    s.socialYoutube   ? `<a href="${esc(s.socialYoutube)}"  class="s-section-foot__social" target="_blank" rel="noopener">YouTube</a>`   : '',
    s.socialFacebook  ? `<a href="${esc(s.socialFacebook)}" class="s-section-foot__social" target="_blank" rel="noopener">Facebook</a>`  : '',
  ].filter(Boolean);

  const legalLinks = [
    s.privacyUrl ? `<a href="${esc(s.privacyUrl)}">Privacy</a>` : '',
    s.termsUrl   ? `<a href="${esc(s.termsUrl)}">Terms</a>`     : '',
  ].filter(Boolean);

  const payHtml = s.showPaymentIcons !== false
    ? `<span class="s-section-foot__pay">VISA &nbsp; MC &nbsp; AMEX &nbsp; PAYPAL</span>` : '';

  const year      = new Date().getFullYear();
  const copyright = s.copyrightText || `© ${year} ${name || 'MaxCyberSolutions'}`;

  return `<footer class="s-section-foot" style="background:${esc(bg)};color:${esc(fg)}">
  ${nlHtml}
  <div class="s-section-foot__bottom">
    <span class="s-section-foot__copyright">${esc(copyright)}</span>
    ${socials.length ? `<div class="s-section-foot__socials">${socials.join('')}</div>` : ''}
    ${legalLinks.length ? `<div class="s-section-foot__legal">${legalLinks.join('')}</div>` : ''}
    ${payHtml}
  </div>
</footer>`;
}

function renderHero(s, config) {
  const align   = s.align  || 'left';
  const layout  = s.layout || 'static';
  const cta     = s.cta    || {};
  const c       = s.colors || {};
  const theme   = config.theme || {};

  const sectionBg    = c.bg     || '';
  const titleColor   = c.title  || '';
  const bodyColor    = c.body   || '';
  const accentColor  = c.accent || theme.accent || '';

  const ctaStyle = accentColor ? `style="background:${esc(accentColor)};border-color:${esc(accentColor)}"` : '';
  const ctaHtml = cta.label && cta.url
    ? `<a href="${esc(cta.url)}" class="s-hero__cta" ${ctaStyle}>${esc(cta.label)}</a>` : '';
  const overlayVal = typeof s.overlay === 'number' ? s.overlay : (s.overlay ? 0.48 : 0);

  const sectionStyle = sectionBg ? `style="background:${esc(sectionBg)}"` : '';

  const inner = `
    <p class="s-hero__tag"${bodyColor ? ` style="color:${esc(bodyColor)}"` : ''}>Store &nbsp;/&nbsp; ${esc((config.name || ''))}</p>
    <h1 class="s-hero__title"${titleColor ? ` style="color:${esc(titleColor)}"` : ''}>${esc(s.headline || '')}</h1>
    ${s.subline ? `<p class="s-hero__desc"${bodyColor ? ` style="color:${esc(bodyColor)}"` : ''}>${esc(s.subline)}</p>` : ''}
    ${ctaHtml}`;

  // Carousel mode: multiple images
  const images = Array.isArray(s.images) && s.images.length ? s.images : (s.image ? [s.image] : []);
  if (layout === 'carousel' && images.length > 1) {
    const slides = images.map((img, i) =>
      `<div class="s-carousel__slide${i===0?' active':''}" style="background-image:url('${esc(img)}')"></div>`
    ).join('');
    return `<header class="s-hero s-hero--img s-hero--${esc(align)} s-hero--carousel" id="s-hero" ${sectionStyle}>
  <div class="s-carousel__track">${slides}</div>
  ${overlayVal ? `<div class="s-hero__overlay" style="background:rgba(0,0,0,${overlayVal})"></div>` : ''}
  <div class="s-hero__inner" style="position:relative;z-index:1">${inner}</div>
  ${images.length > 1 ? `<button class="s-carousel__btn s-carousel__btn--prev" onclick="carouselStep(-1)">‹</button>
  <button class="s-carousel__btn s-carousel__btn--next" onclick="carouselStep(1)">›</button>` : ''}
</header>
<script>(function(){
  var slides=document.querySelectorAll('.s-carousel__slide'),cur=0;
  window.carouselStep=function(d){slides[cur].classList.remove('active');cur=(cur+d+slides.length)%slides.length;slides[cur].classList.add('active');};
  setInterval(function(){carouselStep(1);},5000);
})();</script>`;
  }

  // Static mode
  const bgImg = images[0] || '';
  if (bgImg) {
    return `<header class="s-hero s-hero--img s-hero--${esc(align)}" ${sectionStyle}>
  <div class="s-hero__bg" style="background-image:url('${esc(bgImg)}')"></div>
  ${overlayVal ? `<div class="s-hero__overlay" style="background:rgba(0,0,0,${overlayVal})"></div>` : ''}
  <div class="s-hero__inner">${inner}</div>
</header>`;
  }

  return `<header class="s-hero s-hero--${esc(align)}" ${sectionStyle}>
  <div class="s-hero__inner">${inner}</div>
</header>`;
}

function renderProductGrid(s, products) {
  const layout    = s.layout || 'classic';
  const cols      = Math.max(1, parseInt(s.columns) || 3);
  const colsMob   = Math.max(1, parseInt(s.colsMobile) || 1);
  const maxProd   = parseInt(s.maxProducts) || 0;
  const c         = s.colors || {};
  const secStyle  = [
    c.bg ? `background:${esc(c.bg)}` : '',
    c.fg ? `color:${esc(c.fg)}`     : '',
  ].filter(Boolean).join(';');
  const titleStyle = c.title ? ` style="color:${esc(c.title)}"` : '';
  const tagStyle   = c.body  ? ` style="color:${esc(c.body)}"` : '';

  let filtered = s.showOutOfStock === false ? products.filter(p => p.in_stock) : products;
  if (Array.isArray(s.selectedProducts) && s.selectedProducts.length > 0) {
    const ids = new Set(s.selectedProducts.map(String));
    filtered = filtered.filter(p => ids.has(String(p.id)));
  }

  const cardOpts = {
    showImage:       s.cardShowImage       !== false,
    showBadge:       s.cardShowBadge       !== false,
    showTitle:       s.cardShowTitle       !== false,
    showDescription: s.cardShowDescription !== false,
    showCategory:    s.cardShowCategory    === true,
    showPrice:       s.cardShowPrice       !== false,
    showRating:      s.cardShowRating      === true,
    showCTA:         s.cardShowCTA         !== false,
    imgRatio:        (s.imgRatio || '4/3').replace(':', '/'),
    hoverEffect:     s.hoverEffect || 'none',
  };

  const gridCols    = layout === 'list' ? '1fr' : `repeat(${cols}, 1fr)`;
  const showFilters = !!s.showFilters;
  const showSort    = !!s.showSort;
  const gridId      = `sg-${Math.random().toString(36).slice(2,7)}`;

  // Collect unique tags from the filtered product set (server-side)
  const allTags = showFilters
    ? [...new Set(filtered.flatMap(p => (p.category || '').split(',').map(t => t.trim()).filter(Boolean)))]
    : [];

  const toolbar = (showFilters || showSort) ? `
  <div class="s-grid-toolbar" id="${gridId}-tb">
    ${showFilters ? `<div class="s-grid-filters">
      <button class="s-filter-btn s-filter-btn--active" data-filter="all" onclick="sgStockFilter('${gridId}','all',this)">All</button>
      <button class="s-filter-btn" data-filter="instock" onclick="sgStockFilter('${gridId}','instock',this)">In stock</button>
      ${allTags.map(tag => `<button class="s-filter-btn s-filter-btn--tag" data-tag="${esc(tag)}" onclick="sgTagToggle('${gridId}',${JSON.stringify(tag)},this)">${esc(tag)}</button>`).join('')}
    </div>` : ''}
    ${showSort ? `<select class="s-sort-select" onchange="sgSort('${gridId}',this.value)">
      <option value="">Sort by…</option>
      <option value="price-asc">Price: Low → High</option>
      <option value="price-desc">Price: High → Low</option>
      <option value="name-asc">Name: A → Z</option>
      <option value="name-desc">Name: Z → A</option>
    </select>` : ''}
  </div>` : '';

  const gridScript = (showFilters || showSort) ? `<script>
(function(){
  var _stock='all', _tags=new Set();
  function _apply(id){
    document.querySelectorAll('#'+id+' article.s-card').forEach(function(c){
      var stockOk = _stock==='all' || (_stock==='instock' && c.dataset.instock==='1');
      var cardTags = c.dataset.tags ? c.dataset.tags.split(',').map(function(t){return t.trim();}) : [];
      var tagOk = _tags.size===0 || cardTags.some(function(t){return _tags.has(t);});
      c.style.display = (stockOk && tagOk) ? '' : 'none';
    });
  }
  function sgStockFilter(id,f,btn){
    _stock=f;
    document.querySelectorAll('#'+id+' .s-filter-btn:not(.s-filter-btn--tag)').forEach(function(b){b.classList.remove('s-filter-btn--active');});
    btn.classList.add('s-filter-btn--active');
    _apply(id);
  }
  function sgTagToggle(id,tag,btn){
    if(_tags.has(tag)){_tags.delete(tag);btn.classList.remove('s-filter-btn--active');}
    else{_tags.add(tag);btn.classList.add('s-filter-btn--active');}
    _apply(id);
  }
  function sgSort(id,val){
    var grid=document.querySelector('#'+id+' .s-grid');
    if(!grid||!val)return;
    var cards=[].slice.call(grid.querySelectorAll('article.s-card'));
    cards.sort(function(a,b){
      if(val==='price-asc')  return parseFloat(a.dataset.price)-parseFloat(b.dataset.price);
      if(val==='price-desc') return parseFloat(b.dataset.price)-parseFloat(a.dataset.price);
      if(val==='name-asc')   return a.dataset.name.localeCompare(b.dataset.name);
      if(val==='name-desc')  return b.dataset.name.localeCompare(a.dataset.name);
      return 0;
    });
    cards.forEach(function(c){grid.appendChild(c);});
  }
  window.sgStockFilter=sgStockFilter; window.sgTagToggle=sgTagToggle; window.sgSort=sgSort;
})();
</script>` : '';

  return `<section class="s-products" id="${gridId}"${secStyle ? ` style="${secStyle}"` : ''}>
  <a name="products" style="display:block;height:0;overflow:hidden"></a>
  <div class="s-products__head">
    ${s.tag   ? `<p class="s-products__tag"${tagStyle}>${esc(s.tag)}</p>` : ''}
    ${s.title ? `<h2 class="s-products__title"${titleStyle}>${esc(s.title)}</h2>` : ''}
  </div>
  ${toolbar}
  ${filtered.length
    ? `<div class="s-grid s-grid--${esc(layout)}" style="grid-template-columns:${gridCols}">
        ${filtered.map(p => renderCard(p, cardOpts)).join('')}
       </div>`
    : `<div class="s-empty"><p class="s-empty__text">No products yet &mdash; check back soon.</p></div>`}
  ${gridScript}
</section>`;
}

function renderBanner(s) {
  const c      = s.colors || {};
  const bg     = c.bg    || s.bg    || '#1c1a16';
  const color  = c.fg    || s.color || '#e2a14a';
  const align  = s.align  || 'center';
  const layout = s.layout || 'single';

  const stickyClass  = s.sticky ? ' s-banner--sticky' : ' s-banner--relative';
  const dismissBtn   = s.dismissible
    ? `<button class="s-banner--dismiss-btn" onclick="this.closest('.s-banner').remove()" aria-label="Dismiss">✕</button>` : '';
  const ctaHtml = s.ctaLabel && s.ctaUrl
    ? `<a href="${esc(s.ctaUrl)}" class="s-banner__cta">${esc(s.ctaLabel)}</a>` : '';

  if (layout === 'marquee') {
    const txt = esc(s.text || '');
    const repeated = Array(8).fill(`<span>${txt}</span>`).join('');
    return `<div class="s-banner s-banner--marquee${stickyClass}" style="background:${esc(bg)};color:${esc(color)};position:relative">
  <div class="s-banner__marquee">${repeated}${repeated}</div>
  ${dismissBtn}
</div>`;
  }

  return `<div class="s-banner s-banner--${esc(align)}${stickyClass}" style="background:${esc(bg)};color:${esc(color)};position:relative">
  <span class="s-banner__text">${esc(s.text || '')}</span>
  ${s.subtitle ? `<span class="s-banner__sub">${esc(s.subtitle)}</span>` : ''}
  ${ctaHtml}
  ${dismissBtn}
</div>`;
}

function renderGallery(s) {
  const images      = Array.isArray(s.images) ? s.images : [];
  const layout      = s.layout      || 'classic';
  const cols        = Math.max(1, parseInt(s.columns) || 3);
  const ratio       = (s.ratio || '1/1').replace(':', '/');
  const hoverEffect = s.hoverEffect || 'none';
  const c           = s.colors || {};
  const bg          = c.bg  || s.bg    || '';
  const fg          = c.fg  || s.color || '';
  const secStyle    = [
    bg ? `background:${esc(bg)}` : '',
    fg ? `color:${esc(fg)}`     : '',
  ].filter(Boolean).join(';');

  const hoverClass  = hoverEffect && hoverEffect !== 'none' ? ` s-gallery__item--${esc(hoverEffect)}` : '';
  const gridCols    = layout === 'list' ? '1fr' : `repeat(${cols}, 1fr)`;

  return `<section class="s-gallery s-gallery--${esc(layout)}"${secStyle ? ` style="${secStyle}"` : ''}>
  ${s.title ? `<h2 class="s-gallery__title">${esc(s.title)}</h2>` : ''}
  <div class="s-gallery__grid" style="grid-template-columns:${gridCols}">
    ${images.map(img => {
      const url     = typeof img === 'string' ? img : (img.url || '');
      const caption = typeof img === 'object' ? (img.caption || '') : '';
      return `<div class="s-gallery__item${hoverClass}">
      <img src="${esc(url)}" alt="${esc(caption)}" loading="lazy" style="aspect-ratio:${esc(ratio)};object-fit:cover;width:100%;display:block" />
      ${caption ? `<span class="s-gallery__caption">${esc(caption)}</span>` : ''}
    </div>`;
    }).join('')}
  </div>
</section>`;
}

function renderRichText(s) {
  const align    = s.align    || 'left';
  const maxWidth = s.maxWidth || 'normal';
  const padding  = s.padding  || 'normal';
  const c        = s.colors || {};
  const bg       = c.bg || s.bgColor || '';
  const fg       = c.fg || '';
  const secStyle = [
    bg ? `background:${esc(bg)}` : '',
    fg ? `color:${esc(fg)}`     : '',
  ].filter(Boolean).join(';');

  const ctaHtml = s.ctaLabel && s.ctaUrl
    ? `<a href="${esc(s.ctaUrl)}" class="s-rich__cta">${esc(s.ctaLabel)}</a>` : '';
  const paddingClass = padding === 'sm' ? ' s-rich--sm' : padding === 'lg' ? ' s-rich--lg' : '';

  const hasStructured = s.heading || s.subheading || s.body;
  const inner = hasStructured
    ? `${s.heading    ? `<h2 class="s-rich__heading">${esc(s.heading)}</h2>` : ''}
    ${s.subheading ? `<p class="s-rich__subheading">${esc(s.subheading)}</p>` : ''}
    ${s.body       ? `<p class="s-rich__body">${esc(s.body)}</p>` : ''}
    ${ctaHtml}`
    : (s.content || '');

  return `<section class="s-rich s-rich--${esc(align)} s-rich--${esc(maxWidth)}${paddingClass}"${secStyle ? ` style="${secStyle}"` : ''}>
  <div class="s-rich__inner">${inner}</div>
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

function renderCustomBtn(b, i) {
  const POSITIONS = ['bottom-right','bottom-left','top-right','top-left'];
  const pos   = POSITIONS[i % POSITIONS.length];
  const style = b.sticky ? 'position:fixed' : '';
  const color = b.color || 'var(--accent)';
  return `<a href="${esc(b.url)}" class="s-float s-float--${esc(pos)}"
  style="background:${esc(color)};${style}" target="_blank" rel="noopener noreferrer">
  ${b.image ? `<img src="${esc(b.image)}" style="width:20px;height:20px;object-fit:contain" alt="" />` : ''}
  ${b.text ? `<span>${esc(b.text)}</span>` : ''}
</a>`;
}

// ── Card ──────────────────────────────────────────────────────────────────────

function renderCard(p, opts = {}) {
  const {
    showImage       = true,
    showBadge       = true,
    showTitle       = true,
    showDescription = true,
    showCategory    = false,
    showPrice       = true,
    showRating      = false,
    showCTA         = true,
    imgRatio        = '4/3',
    hoverEffect     = 'none',
  } = opts;

  const dollars = (p.price_cents / 100).toFixed(2);
  let meta = {};
  try { meta = JSON.parse(p.metadata || '{}'); } catch {}
  const badges = Object.entries(meta)
    .map(([k, v]) => `<span class="s-card__badge">${esc(k)}: ${esc(String(v))}</span>`)
    .join('');
  const hasImg     = !!p.image && showImage;
  const hoverClass = hoverEffect && hoverEffect !== 'none' ? ` s-card--${esc(hoverEffect)}` : '';

  return `<article class="s-card${hasImg ? '' : ' s-card--noimg'}${hoverClass}"
  data-price="${p.price_cents / 100}" data-name="${esc(p.name)}" data-instock="${p.in_stock ? 1 : 0}" data-tags="${esc(p.category || '')}">
  ${hasImg ? `<div class="s-card__img" style="background-image:url('${esc(p.image)}');aspect-ratio:${esc(imgRatio)}"></div>` : ''}
  <div class="s-card__body">
    <div class="s-card__sku">SKU ${esc(p.sku)}</div>
    ${showCategory && p.category ? `<div class="s-card__cat">${esc(p.category)}</div>` : ''}
    ${showTitle ? `<h3 class="s-card__name">${esc(p.name)}</h3>` : ''}
    ${showDescription && p.description ? `<p class="s-card__desc">${esc(p.description)}</p>` : ''}
    ${showPrice ? `<div class="s-card__price">$${esc(dollars)}</div>` : ''}
    ${showRating ? `<div class="s-card__rating">★★★★☆</div>` : ''}
    ${showBadge ? `<div class="s-card__badges">
      ${!p.in_stock ? '<span class="s-card__badge s-card__badge--oos">Out of stock</span>' : ''}
      ${badges}
    </div>` : ''}
    ${showCTA ? `<button class="s-card__cta">Inquire</button>` : ''}
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
