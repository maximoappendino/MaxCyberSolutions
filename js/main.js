/* MaxCyberSolutions — main.js
   PAGE_DATA is defined inline in each language's index.html              */

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  dark:      false,
  accent:    '#e2a14a',
  density:   'airy',    // 'airy' | 'compact'
  headline:  'serif',   // 'serif' | 'sans'
  animate:   true,
  closeness: 50,        // 0–100
};

const DATA = window.PAGE_DATA;
const S    = DATA.strings;

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  buildMarquee(DATA.clients);
  buildPricing(DATA.pricing);
  initDarkToggle();
  initCursorHalo();
  initContactForm();
  highlightActiveLang();
});

// ── Config ────────────────────────────────────────────────────────────────────
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

// ── Theme toggle ──────────────────────────────────────────────────────────────
function initDarkToggle() {
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    CONFIG.dark = !CONFIG.dark;
    document.documentElement.dataset.dark = CONFIG.dark;
    syncLabel();
  });
}

function syncLabel() {
  const el = document.getElementById('theme-label');
  if (el) el.textContent = CONFIG.dark ? S.light : S.dark;
}

// ── Language switcher ─────────────────────────────────────────────────────────
function highlightActiveLang() {
  const lang = document.documentElement.dataset.lang || 'en';
  document.querySelectorAll('.bar__lang-btn').forEach(a => {
    a.classList.toggle('bar__lang-btn--active', a.dataset.lang === lang);
  });
}

// ── Cursor halo ───────────────────────────────────────────────────────────────
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

// ── Contact form ──────────────────────────────────────────────────────────────
function initContactForm() {
  document.getElementById('contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    alert(S.contactAlert);
  });
}

// ── Marquee ───────────────────────────────────────────────────────────────────
function buildMarquee(clients) {
  const track = document.getElementById('marquee-track');
  if (!track) return;
  track.innerHTML = [...clients, ...clients]
    .map(c => `<div class="marquee__item">${esc(c)}</div>`).join('');
}

// ── Pricing ───────────────────────────────────────────────────────────────────
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
      <div class="tiers-grid">${cat.tiers.map(renderTier).join('')}</div>
    </div>`).join('');
}

function renderTier(t) {
  return `
    <div class="tier${t.feat ? ' tier--featured' : ''}"
         data-most-chosen="${esc(S.mostChosen)}">
      <div class="tier__head">
        <div class="tier__name">${esc(t.name)}</div>
        <div class="tier__num">${esc(S.tierLabel)} ${esc(t.num)}</div>
      </div>
      <div>
        <div class="tier__price">${esc(t.price)}${t.unit ? `<small>${esc(t.unit)}</small>` : ''}</div>
        <div class="tier__lede">${esc(t.lede)}</div>
      </div>
      <ul class="tier__list">${t.items.map(i => `<li><span>${esc(i)}</span></li>`).join('')}</ul>
      <a href="#contact" class="tier__cta">${esc(S.commission)}</a>
    </div>`;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
