/* MaxCyberSolutions — main.js */

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  dark:      false,
  accent:    '#e2a14a',
  density:   'airy',    // 'airy' | 'compact'
  headline:  'serif',   // 'serif' | 'sans'
  animate:   true,
  closeness: 50,        // 0–100
};

// ── Data ──────────────────────────────────────────────────────────────────────
// Mirror of data.json — edit both together.
const DATA = {
  clients: [
    'Helios Labs', 'Northwind & Co.', 'Atelier Polaris', 'Studio Vermillion',
    'Kasselmark', 'Plinth', 'Orbital 9', 'Maison Bréa',
  ],
  pricing: [
    {
      num: 'I', name: 'Web Development',
      lede: 'From a single landing page to a full storefront.',
      tiers: [
        { name: 'Page', num: '01', price: '€900', unit: '/ project', lede: 'A single, considered page.', feat: false,
          items: ['One-page site or landing', 'Custom typography & motion', 'Mobile + desktop', 'Two rounds of revision', 'Two-week delivery'] },
        { name: 'Site', num: '02', price: '€2,800', unit: '/ project', lede: 'A multi-page site, end-to-end.', feat: true,
          items: ['Up to 8 pages', 'CMS integration', 'Custom front-end', 'Performance & SEO pass', 'Four-week delivery', 'Three months post-launch care'] },
        { name: 'Platform', num: '03', price: 'From €6,500', unit: '', lede: 'Stores, dashboards, custom back-end.', feat: false,
          items: ['Full-stack architecture', 'Auth, payments, admin', 'Custom APIs', 'Eight-week build cycle', 'Optional retainer', 'Direct line during build'] },
      ],
    },
    {
      num: 'II', name: '2D Design',
      lede: 'Editorial, brand, character — original illustration and motion.',
      tiers: [
        { name: 'Spot', num: '01', price: '€220', unit: '/ piece', lede: 'A single illustration.', feat: false,
          items: ['One key illustration', 'Two rounds of revision', 'Print-ready & web exports', 'Source files included', 'One-week delivery'] },
        { name: 'Series', num: '02', price: '€1,400', unit: '/ set', lede: 'A coordinated set of 6–10 pieces.', feat: true,
          items: ['Up to 10 illustrations', 'Shared visual language', 'Style frames upfront', 'Three rounds of revision', 'Three-week delivery'] },
        { name: 'System', num: '03', price: 'From €3,800', unit: '', lede: 'A complete visual identity in 2D.', feat: false,
          items: ['Logo & wordmark', 'Pattern, iconography, motion', 'Brand guide PDF', 'Master files for print + web', 'Six-week build', 'One year of small updates'] },
      ],
    },
    {
      num: 'III', name: '3D Modeling',
      lede: 'Props, characters, environments — game-ready or rendered.',
      tiers: [
        { name: 'Asset', num: '01', price: '€280', unit: '/ model', lede: 'A single prop or character bust.', feat: false,
          items: ['Low or high-poly', 'PBR textures included', 'Two rounds of revision', 'Game-ready FBX / GLB', 'Two-week delivery'] },
        { name: 'Pack', num: '02', price: '€1,800', unit: '/ pack', lede: 'A coherent set, ready to ship.', feat: true,
          items: ['Up to 12 assets', 'Shared material library', 'Rigged where needed', 'LODs on request', 'Four-week delivery', 'Engine import support'] },
        { name: 'Production', num: '03', price: 'From €5,400', unit: '', lede: 'Full pipeline: model, rig, animate.', feat: false,
          items: ['Hero characters or environments', 'Rigging & animation', 'Render or engine setup', 'Pipeline documentation', 'Eight-week build', 'Direct line through delivery'] },
      ],
    },
    {
      num: 'IV', name: 'Sound and Voice Acting',
      lede: 'Voice, sound design, music supervision.',
      tiers: [
        { name: 'Voice', num: '01', price: '€180', unit: '/ session', lede: 'A single 1-hour session.', feat: false,
          items: ['Up to 1 hour recording', 'Studio-quality WAV', 'Two takes per line', 'Light post-processing', '48-hour turnaround'] },
        { name: 'Production', num: '02', price: '€1,200', unit: '/ project', lede: 'Full voice + sound for a short.', feat: true,
          items: ['Voice acting & narration', 'SFX & foley', 'Mix-ready stems', 'Three rounds of revision', 'Two-week delivery', 'Stereo & mono masters'] },
        { name: 'Soundtrack', num: '03', price: 'From €3,400', unit: '', lede: 'Original music + full sound design.', feat: false,
          items: ['Composed score', 'Adaptive layers for games', 'Full sound design', 'Implementation support', 'Six-week build', 'Stem delivery + master'] },
      ],
    },
  ],
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  buildMarquee(DATA.clients);
  buildPricing(DATA.pricing);
  initDarkToggle();
  initCursorHalo();
  initContactForm();
});

function applyConfig() {
  const r = document.documentElement;
  r.style.setProperty('--accent',      CONFIG.accent);
  r.style.setProperty('--accent-soft', CONFIG.accent + '2e');
  r.style.setProperty('--accent-glow', CONFIG.accent + '8c');
  r.dataset.dark     = CONFIG.dark;
  r.dataset.density  = CONFIG.density;
  r.dataset.headline = CONFIG.headline;
  r.dataset.animate  = CONFIG.animate;
  r.style.setProperty('--hand-gap', `${(1 - CONFIG.closeness / 100) * 12 + 1}vw`);
  syncLabel();
}

function initDarkToggle() {
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    CONFIG.dark = !CONFIG.dark;
    document.documentElement.dataset.dark = CONFIG.dark;
    syncLabel();
  });
}

function syncLabel() {
  const el = document.getElementById('theme-label');
  if (el) el.textContent = CONFIG.dark ? 'Light' : 'Dark';
}

function initCursorHalo() {
  const halo = document.getElementById('cursor-halo');
  if (!halo) return;
  let live = false;
  window.addEventListener('pointermove', e => {
    halo.style.setProperty('--mx', e.clientX + 'px');
    halo.style.setProperty('--my', e.clientY + 'px');
    if (!live) { live = true; halo.classList.add('active'); }
  });
  document.addEventListener('pointerleave', () => {
    live = false; halo.classList.remove('active');
  });
}

function initContactForm() {
  document.getElementById('contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    alert('Thanks — Max will be in touch within a day.');
  });
}

function buildMarquee(clients) {
  const track = document.getElementById('marquee-track');
  if (!track) return;
  track.innerHTML = [...clients, ...clients].map(c => `<div class="marquee__item">${esc(c)}</div>`).join('');
}

function buildPricing(cats) {
  const el = document.getElementById('pricing-categories');
  if (!el) return;
  el.innerHTML = cats.map(cat => `
    <div class="price-cat">
      <div class="price-cat__head">
        <div class="price-cat__num">${esc(cat.num)}</div>
        <div>
          <h3 class="price-cat__name">${esc(cat.name)}</h3>
          <p class="price-cat__lede">${esc(cat.lede)}</p>
        </div>
      </div>
      <div class="tiers-grid">${cat.tiers.map(tier).join('')}</div>
    </div>`).join('');
}

function tier(t) {
  return `
    <div class="tier${t.feat ? ' tier--featured' : ''}">
      <div class="tier__head">
        <div class="tier__name">${esc(t.name)}</div>
        <div class="tier__num">Tier ${esc(t.num)}</div>
      </div>
      <div>
        <div class="tier__price">${esc(t.price)}${t.unit ? `<small>${esc(t.unit)}</small>` : ''}</div>
        <div class="tier__lede">${esc(t.lede)}</div>
      </div>
      <ul class="tier__list">${t.items.map(i => `<li><span>${esc(i)}</span></li>`).join('')}</ul>
      <a href="#contact" class="tier__cta">Commission</a>
    </div>`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
