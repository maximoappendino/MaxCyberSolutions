/* MaxCyberSolutions — main.js
   PAGE_DATA is defined inline in each language's index.html              */

// ── Config ────────────────────────────────────────────────────────────────────
const CONFIG = {
  dark:      false,
  accent:    '#e2a14a',
  density:   'airy',
  headline:  'serif',
  animate:   true,
  closeness: 50,
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
  initPromoCode();
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
        <div class="tier__price"
             data-price="${esc(t.price)}"
             data-unit="${esc(t.unit || '')}">
          ${esc(t.price)}${t.unit ? `<small>${esc(t.unit)}</small>` : ''}
        </div>
        <div class="tier__lede">${esc(t.lede)}</div>
      </div>
      <ul class="tier__list">${t.items.map(i => `<li><span>${esc(i)}</span></li>`).join('')}</ul>
      <a href="#contact" class="tier__cta">${esc(S.commission)}</a>
    </div>`;
}

// ── Promo code ────────────────────────────────────────────────────────────────
function initPromoCode() {
  const form = document.getElementById('promo-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (code === 'ARGENTINA') {
      applyDiscount(0.20);
    } else {
      showPromoMsg('error', S.promoInvalid);
    }
  });
}

function applyDiscount(pct) {
  // Lock the form
  document.getElementById('promo-input').disabled = true;
  document.querySelector('.promo-btn').disabled = true;
  showPromoMsg('success', S.promoSuccess);

  // Update every price element
  document.querySelectorAll('.tier__price').forEach(el => {
    const original = el.dataset.price;
    const unit     = el.dataset.unit;
    const reduced  = calcDiscount(original, pct);

    el.classList.add('price--discounted');
    el.innerHTML =
      `<span class="tier__price-old">${esc(original)}</span>` +
      `<span class="tier__price-new">${esc(reduced)}</span>` +
      (unit ? `<small>${esc(unit)}</small>` : '');
  });

  // Staggered card celebration
  document.querySelectorAll('.tier').forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('tier--celebrating');
      card.addEventListener('animationend',
        () => card.classList.remove('tier--celebrating'), { once: true });
    }, i * 90);
  });
}

// Applies `pct` discount to the numeric part of a price string.
// Handles both "," and "." as thousand separators (EN vs ES/IT formats).
function calcDiscount(priceStr, pct) {
  return priceStr.replace(/\d[\d.,]*/, match => {
    const num     = parseInt(match.replace(/[.,]/g, ''), 10);
    const reduced = Math.round(num * (1 - pct));
    // Detect original thousand separator: "." only if string is long enough to be thousands
    const sep = match.includes('.') && match.replace('.', '').length >= 3 ? '.' : ',';
    return formatNum(reduced, sep);
  });
}

function formatNum(n, sep) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

function showPromoMsg(type, text) {
  const msg = document.getElementById('promo-msg');
  if (!msg) return;
  msg.textContent = text;
  msg.className = `promo-msg visible ${type}`;
}

// ── Utility ───────────────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
