/* MaxCyberSolutions — main.js
   PAGE_DATA is defined inline in each language's index.html
   SITE_CONFIG is loaded from js/config.js                        */

const CONFIG = { dark: false, accent: '#e2a14a', density: 'airy', headline: 'serif', animate: true, closeness: 50 };
const DATA   = window.PAGE_DATA;
const S      = DATA.strings;
const CONF   = window.SITE_CONFIG || {};

document.addEventListener('DOMContentLoaded', () => {
  applyConfig();
  patchConfigLinks();
  buildMarquee(CONF.clients || []);
  buildPricing(DATA.pricing);
  initDarkToggle();
  initCursorHalo();
  initContactForm();
  initPromoCode();
  highlightActiveLang();
  initHamburger();
  initFAQ();
  initLeadForm();
  initScrollReveal();
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

function patchConfigLinks() {
  document.querySelectorAll('[data-config]').forEach(el => {
    const key = el.dataset.config;
    if (key && CONF[key]) el.href = CONF[key];
  });
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
function initDarkToggle() {
  const toggle = () => {
    CONFIG.dark = !CONFIG.dark;
    document.documentElement.dataset.dark = CONFIG.dark;
    syncLabel();
  };
  document.getElementById('theme-toggle')?.addEventListener('click', toggle);
  document.querySelectorAll('.bar__theme--mobile').forEach(b => b.addEventListener('click', toggle));
}

function syncLabel() {
  const v = CONFIG.dark ? S.light : S.dark;
  document.querySelectorAll('[data-theme-label]').forEach(el => el.textContent = v);
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
  document.addEventListener('pointerleave', () => { live = false; halo.classList.remove('active'); });
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
  const GAP     = 60;
  const makeSet = () => clients.map(c =>
    `<a class="marquee__item" href="${esc(c.url)}" target="_blank" rel="noopener">` +
    `<img src="${esc(c.logo)}" alt="${esc(c.name)}" /></a>`
  ).join('');
  track.innerHTML = makeSet();
  function cloneToFill() {
    const setW   = track.scrollWidth + GAP;
    const copies = Math.ceil((window.innerWidth * 4) / setW) + 2;
    track.innerHTML = Array.from({ length: copies }, makeSet).join('');
    track.style.setProperty('--marquee-dist', setW + 'px');
  }
  const imgs    = [...track.querySelectorAll('img')];
  let   pending = imgs.filter(i => !i.complete).length;
  if (pending === 0) { requestAnimationFrame(cloneToFill); return; }
  imgs.forEach(img => {
    if (!img.complete) img.addEventListener('load', () => { if (--pending === 0) cloneToFill(); }, { once: true });
  });
}

// ── Flat 5-tier pricing with WebGL shader cards ───────────────────────────────
function buildPricing(tiers) {
  const el = document.getElementById('pricing-tiers');
  if (!el || !tiers) return;
  el.innerHTML = tiers.map(renderTier).join('');
  requestAnimationFrame(() => {
    tiers.forEach(t => {
      const card   = el.querySelector(`[data-tier-id="${t.id}"]`);
      const canvas = card && card.querySelector('.tier__canvas');
      if (canvas && SHADERS[t.id] && window.WebGLRenderingContext) initShader(canvas, t.id);
    });
  });
}

function renderTier(t) {
  const isMax     = t.id === 'max';
  const coAttrs   = isMax ? '' : `data-checkout-plan="${esc(t.id)}" data-checkout-name="${esc(t.name)}" data-checkout-price="${esc(t.price + (t.period || ''))}"`;
  const cursorCss = isMax ? '' : ' style="cursor:pointer"';
  return `
<div class="tier${t.feat ? ' tier--featured' : ''}${isMax ? ' tier--max' : ''}"
     data-most-chosen="${esc(S.mostChosen)}"
     data-tier-id="${esc(t.id)}"
     ${coAttrs}${cursorCss}>
  <canvas class="tier__canvas" aria-hidden="true"></canvas>
  <div class="tier__head">
    <div class="tier__name">${esc(t.name)}</div>
  </div>
  <div>
    <div class="tier__price" data-price="${esc(t.price)}" data-unit="${esc(t.period || '')}">
      ${esc(t.price)}${t.period ? `<small>${esc(t.period)}</small>` : ''}
    </div>
  </div>
  <ul class="tier__list">${t.items.map(i => `<li><span>${esc(i)}</span></li>`).join('')}</ul>
  ${isMax
    ? `<a href="#contact" class="tier__cta">${esc(S.ctaMax || S.commission)}</a>`
    : `<button type="button" class="tier__cta"
         data-checkout-plan="${esc(t.id)}"
         data-checkout-name="${esc(t.name)}"
         data-checkout-price="${esc(t.price + (t.period || ''))}">${esc(S.ctaSubscribe || S.commission)}</button>`
  }
</div>`;
}

// ── WebGL fragment shaders — falling rain-stars, one subtle tint per tier ─────
const SHADERS = {

basic: `precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
float h(float n){return fract(sin(n)*43758.5);}
void main(){
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  vec3 tint=vec3(0.78,0.88,1.0);
  float acc=0.0;
  for(int i=0;i<48;i++){
    float f=float(i);
    float spd=0.06+h(f*7.3)*0.13;
    float cx=h(f);
    float cy=fract(h(f*4.1)-iTime*spd);
    float dx=(uv.x-cx)*iResolution.x/iResolution.y;
    float dy=uv.y-cy;
    float r2=dx*dx+dy*dy;
    float bri=h(f*13.7+0.1);
    float star=bri*0.00045/(r2+0.00018);
    float tail=bri*step(0.0,dy)*step(dy,0.08)*exp(-dx*dx*iResolution.x*iResolution.x*2.0)*smoothstep(0.08,0.0,dy)*0.22;
    acc+=clamp(star+tail,0.0,0.7);
  }
  gl_FragColor=vec4(tint*min(acc,1.0),min(acc*0.9,0.88));
}`,

plus: `precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
float h(float n){return fract(sin(n)*43758.5);}
void main(){
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  vec3 tint=vec3(1.0,0.88,0.62);
  float acc=0.0;
  for(int i=0;i<48;i++){
    float f=float(i);
    float spd=0.06+h(f*7.3)*0.13;
    float cx=h(f);
    float cy=fract(h(f*4.1)-iTime*spd);
    float dx=(uv.x-cx)*iResolution.x/iResolution.y;
    float dy=uv.y-cy;
    float r2=dx*dx+dy*dy;
    float bri=h(f*13.7+0.1);
    float star=bri*0.00045/(r2+0.00018);
    float tail=bri*step(0.0,dy)*step(dy,0.08)*exp(-dx*dx*iResolution.x*iResolution.x*2.0)*smoothstep(0.08,0.0,dy)*0.22;
    acc+=clamp(star+tail,0.0,0.7);
  }
  gl_FragColor=vec4(tint*min(acc,1.0),min(acc*0.9,0.88));
}`,

pro: `precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
float h(float n){return fract(sin(n)*43758.5);}
void main(){
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  vec3 tint=vec3(0.6,0.95,1.0);
  float acc=0.0;
  for(int i=0;i<48;i++){
    float f=float(i);
    float spd=0.06+h(f*7.3)*0.13;
    float cx=h(f);
    float cy=fract(h(f*4.1)-iTime*spd);
    float dx=(uv.x-cx)*iResolution.x/iResolution.y;
    float dy=uv.y-cy;
    float r2=dx*dx+dy*dy;
    float bri=h(f*13.7+0.1);
    float star=bri*0.00045/(r2+0.00018);
    float tail=bri*step(0.0,dy)*step(dy,0.08)*exp(-dx*dx*iResolution.x*iResolution.x*2.0)*smoothstep(0.08,0.0,dy)*0.22;
    acc+=clamp(star+tail,0.0,0.7);
  }
  gl_FragColor=vec4(tint*min(acc,1.0),min(acc*0.9,0.88));
}`,

ultra: `precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
float h(float n){return fract(sin(n)*43758.5);}
void main(){
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  vec3 tint=vec3(0.82,0.70,1.0);
  float acc=0.0;
  for(int i=0;i<48;i++){
    float f=float(i);
    float spd=0.06+h(f*7.3)*0.13;
    float cx=h(f);
    float cy=fract(h(f*4.1)-iTime*spd);
    float dx=(uv.x-cx)*iResolution.x/iResolution.y;
    float dy=uv.y-cy;
    float r2=dx*dx+dy*dy;
    float bri=h(f*13.7+0.1);
    float star=bri*0.00045/(r2+0.00018);
    float tail=bri*step(0.0,dy)*step(dy,0.08)*exp(-dx*dx*iResolution.x*iResolution.x*2.0)*smoothstep(0.08,0.0,dy)*0.22;
    acc+=clamp(star+tail,0.0,0.7);
  }
  gl_FragColor=vec4(tint*min(acc,1.0),min(acc*0.9,0.88));
}`,

max: `precision mediump float;
uniform vec2 iResolution;
uniform float iTime;
float h(float n){return fract(sin(n)*43758.5);}
void main(){
  vec2 uv=gl_FragCoord.xy/iResolution.xy;
  vec3 tint=vec3(1.0,1.0,1.0);
  float acc=0.0;
  for(int i=0;i<48;i++){
    float f=float(i);
    float spd=0.06+h(f*7.3)*0.13;
    float cx=h(f);
    float cy=fract(h(f*4.1)-iTime*spd);
    float dx=(uv.x-cx)*iResolution.x/iResolution.y;
    float dy=uv.y-cy;
    float r2=dx*dx+dy*dy;
    float bri=h(f*13.7+0.1);
    float star=bri*0.00045/(r2+0.00018);
    float tail=bri*step(0.0,dy)*step(dy,0.08)*exp(-dx*dx*iResolution.x*iResolution.x*2.0)*smoothstep(0.08,0.0,dy)*0.22;
    acc+=clamp(star+tail,0.0,0.7);
  }
  gl_FragColor=vec4(tint*min(acc,1.0),min(acc*0.9,0.88));
}`

};

function initShader(canvas, id) {
  const fSrc = SHADERS[id];
  if (!fSrc) return;
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;
  const vSrc = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
  const prog  = buildProgram(gl, vSrc, fSrc);
  if (!prog) return;
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const aLoc   = gl.getAttribLocation(prog, 'a');
  const resLoc = gl.getUniformLocation(prog, 'iResolution');
  const tLoc   = gl.getUniformLocation(prog, 'iTime');
  let rafId = null, t0 = null;
  function frame(ts) {
    if (t0 === null) t0 = ts;
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resLoc, canvas.width, canvas.height);
    gl.uniform1f(tLoc, (ts - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    rafId = requestAnimationFrame(frame);
  }
  const card = canvas.closest('.tier');
  card.addEventListener('mouseenter', () => {
    if (!rafId) { t0 = null; rafId = requestAnimationFrame(frame); }
    canvas.style.opacity = '0.45';
  });
  card.addEventListener('mouseleave', () => {
    canvas.style.opacity = '0';
    setTimeout(() => { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }, 450);
  });
}

function buildProgram(gl, vSrc, fSrc) {
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const v = compile(gl.VERTEX_SHADER, vSrc), f = compile(gl.FRAGMENT_SHADER, fSrc);
  if (!v || !f) return null;
  const p = gl.createProgram();
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

// ── Hamburger (mobile nav) ────────────────────────────────────────────────────
function initHamburger() {
  const btn  = document.getElementById('nav-hamburger');
  const menu = document.getElementById('nav-mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', () => {
    menu.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
  menu.addEventListener('click', e => e.stopPropagation());
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        document.querySelectorAll('.faq-item[open]').forEach(other => {
          if (other !== item) other.open = false;
        });
      }
    });
  });
}

// ── Lead capture form → WhatsApp ──────────────────────────────────────────────
function initLeadForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const fd  = new FormData(form);
    const get = k => (fd.get(k) || '').trim();
    const lines = [
      `*MaxCyberSolutions — Nueva consulta*`,
      `Nombre: ${get('fname')} ${get('lname')}`,
      `Tel: ${get('phone')}`,
      `Email: ${get('email')}`,
    ];
    if (get('brand'))     lines.push(`Negocio: ${get('brand')}`);
    if (get('btype'))     lines.push(`Rubro: ${get('btype')}`);
    if (get('storetype')) lines.push(`Tipo de tienda: ${get('storetype')}`);
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`${CONF.whatsappUrl || 'https://wa.me/5493517146520'}?text=${msg}`, '_blank', 'noopener');
    form.reset();
  });
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────
function initScrollReveal() {
  if (!window.IntersectionObserver) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay) || 0;
        setTimeout(() => { e.target.dataset.revealed = 'true'; }, delay);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('[data-reveal]').forEach(el => obs.observe(el));
}

// ── Promo code ────────────────────────────────────────────────────────────────
function initPromoCode() {
  const form = document.getElementById('promo-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (code === 'ARGENTINA') applyDiscount(0.20);
    else showPromoMsg('error', S.promoInvalid);
  });
}

function applyDiscount(pct) {
  document.getElementById('promo-input').disabled = true;
  document.querySelector('.promo-btn').disabled = true;
  showPromoMsg('success', S.promoSuccess);
  document.querySelectorAll('.tier__price').forEach(el => {
    const original = el.dataset.price, unit = el.dataset.unit, reduced = calcDiscount(original, pct);
    el.classList.add('price--discounted');
    el.innerHTML = `<span class="tier__price-old">${esc(original)}</span><span class="tier__price-new">${esc(reduced)}</span>${unit ? `<small>${esc(unit)}</small>` : ''}`;
  });
  document.querySelectorAll('.tier').forEach((card, i) => {
    setTimeout(() => {
      card.classList.add('tier--celebrating');
      card.addEventListener('animationend', () => card.classList.remove('tier--celebrating'), { once: true });
    }, i * 90);
  });
}

function calcDiscount(priceStr, pct) {
  return priceStr.replace(/\d[\d.,]*/, match => {
    const num     = parseInt(match.replace(/[.,]/g, ''), 10);
    const reduced = Math.round(num * (1 - pct));
    const sep     = match.includes('.') && match.replace('.', '').length >= 3 ? '.' : ',';
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
