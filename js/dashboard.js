/* MaxCyberSolutions — Dashboard SPA */

// ── Translations ──────────────────────────────────────────────────────────────
const I18N = {
  en: { design:'Design', sections:'Sections', items:'Items', config:'Config',
        newItem:'+ New item', saveDraft:'Save Draft', pushLive:'🚀 Push Live',
        discard:'Discard', noItems:'No items yet.', noSections:'No sections yet. Add one below.' },
  es: { design:'Diseño', sections:'Secciones', items:'Artículos', config:'Config',
        newItem:'+ Nuevo artículo', saveDraft:'Guardar borrador', pushLive:'🚀 Publicar',
        discard:'Descartar', noItems:'Sin artículos todavía.', noSections:'Sin secciones aún. Añade una.' },
  it: { design:'Design', sections:'Sezioni', items:'Articoli', config:'Config',
        newItem:'+ Nuovo articolo', saveDraft:'Salva bozza', pushLive:'🚀 Pubblica',
        discard:'Annulla', noItems:'Nessun articolo ancora.', noSections:'Nessuna sezione. Aggiungine una.' },
  pt: { design:'Design', sections:'Seções', items:'Itens', config:'Config',
        newItem:'+ Novo item', saveDraft:'Salvar rascunho', pushLive:'🚀 Publicar',
        discard:'Descartar', noItems:'Sem itens ainda.', noSections:'Sem seções. Adicione uma.' },
};
function t(key) { return (I18N[dashConfig.lang] || I18N.en)[key] || key; }

// ── Dashboard config (localStorage, UI only) ──────────────────────────────────
let dashConfig = { lang: 'en', size: 'medium', preview: 'desktop', autoRefresh: true, dashStyle: 'maxcybersolutions' };

function loadDashConfig() {
  try { Object.assign(dashConfig, JSON.parse(localStorage.getItem('dash_config') || '{}')); } catch {}
  if (dashConfig.autoRefresh === undefined) dashConfig.autoRefresh = true;
}
function saveDashConfig() {
  localStorage.setItem('dash_config', JSON.stringify(dashConfig));
}

// ── Section type definitions ──────────────────────────────────────────────────
const SECTION_TYPES = {
  hero: {
    label: 'Hero Banner', icon: '◈',
    defaults: {
      headline: 'Welcome', subline: '', layout: 'static', image: '', images: [],
      overlay: 0.45, align: 'left', cta: { label: 'Shop now', url: '#products' },
    },
  },
  'product-grid': {
    label: 'Product Grid', icon: '⊞',
    defaults: { title: 'All products.', tag: '§ Catalogue', columns: 3, showOutOfStock: true },
  },
  'text-banner': {
    label: 'Text Banner', icon: '▬',
    defaults: { text: 'Announcement text', bg: '#1c1a16', color: '#e2a14a', align: 'center' },
  },
  'image-gallery': {
    label: 'Image Gallery', icon: '⊟',
    defaults: { title: '', columns: 3, images: [] },
  },
  'floating-cta': {
    label: 'Floating Button', icon: '◎',
    defaults: { icon: 'whatsapp', label: 'Chat with us', url: '', position: 'bottom-right', color: '#25D366' },
  },
  'rich-text': {
    label: 'Text Block', icon: '¶',
    defaults: { content: '<p>Your content here.</p>', align: 'left', maxWidth: 'normal' },
  },
};

const PANEL_SIZES = { small: '280px', medium: '360px', large: '440px' };

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'minimal', name: 'Minimal', icon: '◻',
    desc: 'Clean hero + product grid.',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults, headline: 'Welcome', subline: '' },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults },
    ],
  },
  {
    id: 'full-store', name: 'Full Store', icon: '⊞',
    desc: 'Hero, banner, grid, gallery.',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults },
      { id: uid(), type: 'text-banner', ...SECTION_TYPES['text-banner'].defaults },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults },
      { id: uid(), type: 'image-gallery', ...SECTION_TYPES['image-gallery'].defaults },
    ],
  },
  {
    id: 'portfolio', name: 'Portfolio', icon: '◈',
    desc: 'Gallery-first with rich text.',
    sections: () => [
      { id: uid(), type: 'image-gallery', ...SECTION_TYPES['image-gallery'].defaults, title: 'Work' },
      { id: uid(), type: 'rich-text', ...SECTION_TYPES['rich-text'].defaults },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults, title: 'Services' },
    ],
  },
  {
    id: 'service', name: 'Service', icon: '¶',
    desc: 'Hero, intro text, CTA, grid.',
    sections: () => [
      { id: uid(), type: 'hero', ...SECTION_TYPES.hero.defaults },
      { id: uid(), type: 'text-banner', ...SECTION_TYPES['text-banner'].defaults },
      { id: uid(), type: 'rich-text', ...SECTION_TYPES['rich-text'].defaults },
      { id: uid(), type: 'product-grid', ...SECTION_TYPES['product-grid'].defaults },
      { id: uid(), type: 'floating-cta', ...SECTION_TYPES['floating-cta'].defaults },
    ],
  },
];

// ── Store styles (storefront visual themes) ───────────────────────────────────
const STYLES = [
  {
    id: 'maxcybersolutions', name: 'MaxCyberSolutions', icon: '◈',
    desc: 'Warm cream, golden accent, editorial serif.',
    swatches: ['#efeae0', '#e2a14a', '#1c1a16'],
    theme: {
      bg: '#efeae0', accent: '#e2a14a', fg: '#1c1a16',
      fonts: { titleFamily: 'Cormorant Garamond', bodyFamily: 'DM Sans', accentFamily: 'JetBrains Mono' },
    },
  },
  {
    id: 'bubblegum', name: 'BubbleGum', icon: '◎',
    desc: 'Pastel pink, playful, bold and fun.',
    swatches: ['#fff0f5', '#ff85b0', '#3d1f2e'],
    theme: {
      bg: '#fff0f5', accent: '#ff85b0', fg: '#3d1f2e',
      fonts: { titleFamily: 'Pacifico', bodyFamily: 'Nunito', accentFamily: 'Nunito' },
    },
  },
  {
    id: 'rockstar', name: 'Rockstar', icon: '⚡',
    desc: 'Dark stage, bold white, electric red.',
    swatches: ['#111111', '#e8003a', '#f0f0f0'],
    theme: {
      bg: '#111111', accent: '#e8003a', fg: '#f0f0f0',
      fonts: { titleFamily: 'Bebas Neue', bodyFamily: 'Barlow', accentFamily: 'Barlow Condensed' },
    },
  },
  {
    id: 'neon', name: 'Neon', icon: '⬡',
    desc: 'Cyber night, electric cyan on deep black.',
    swatches: ['#0a0a14', '#00ffe7', '#e0e0ff'],
    theme: {
      bg: '#0a0a14', accent: '#00ffe7', fg: '#e0e0ff',
      fonts: { titleFamily: 'Orbitron', bodyFamily: 'Share Tech Mono', accentFamily: 'Share Tech Mono' },
    },
  },
];

// ── Dashboard styles (CSS vars applied to the dashboard itself) ───────────────
const DASH_STYLES = {
  maxcybersolutions: {
    '--accent': '#e2a14a', '--accent-soft': 'rgba(226,161,74,.13)',
    '--cream':  '#efeae0', '--ink':         '#1c1a16',
    '--ink-soft': '#45403a', '--ink-faint': '#7a736a',
    '--rule':   '#d4cdbd', '--rule-soft':   '#e2dccd',
  },
  bubblegum: {
    '--accent': '#ff85b0', '--accent-soft': 'rgba(255,133,176,.13)',
    '--cream':  '#fff0f5', '--ink':         '#3d1f2e',
    '--ink-soft': '#6b3a52', '--ink-faint': '#a07080',
    '--rule':   '#f0c8d8', '--rule-soft':   '#f8e0ea',
  },
  rockstar: {
    '--accent': '#e8003a', '--accent-soft': 'rgba(232,0,58,.13)',
    '--cream':  '#111111', '--ink':         '#f0f0f0',
    '--ink-soft': '#c8c8c8', '--ink-faint': '#888888',
    '--rule':   '#333333', '--rule-soft':   '#2a2a2a',
  },
  neon: {
    '--accent': '#00ffe7', '--accent-soft': 'rgba(0,255,231,.13)',
    '--cream':  '#0a0a14', '--ink':         '#e0e0ff',
    '--ink-soft': '#a0a0d0', '--ink-faint': '#6060a0',
    '--rule':   '#1a1a2e', '--rule-soft':   '#14142a',
  },
};

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  owner:           null,
  stores:          [],
  activeStore:     null,
  draft:           null,
  products:        [],
  editingProduct:  null,
  editingSection:  null,
  isDirty:         false,
  previewTimer:    null,
  pushTimer:       null,
  imgUploadTarget: null,
  history:         [],
  future:          [],
  bulkSelected:    new Set(),
  allowEditIds:    false,
  variations:      [],
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadDashConfig();
  setupLoginTabs();
  setupLoginForm();
  setupNewStoreForm();
  setupEditorTabs();
  setupDesignListeners();
  setupSectionControls();
  setupProductModal();
  setupTopBarActions();
  setupConfigTab();
  setupTemplateGallery();
  setupStyleGallery();
  setupBulkBar();
  setupItemsTab();
  applyDashSize(dashConfig.size);
  applyDashStyle(dashConfig.dashStyle || 'maxcybersolutions');
  document.addEventListener('keydown', handleKeyboardShortcuts);

  document.getElementById('d-logout').addEventListener('click', logout);
  await checkAuth();
});

// ── Keyboard shortcuts ─────────────────────────────────────────────────────────
function handleKeyboardShortcuts(e) {
  if (!state.activeStore) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  if (mod && e.key === 's') { e.preventDefault(); saveLocalDraft(); updateDirty(false); flash('btn-save-draft', 'Saved ✓'); }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await api('GET', '/api/me');
    if (res.ok) { state.owner = await res.json(); onAuthenticated(); }
    else showScreen('login');
  } catch { showScreen('login'); }
}

function onAuthenticated() {
  document.getElementById('d-bar').style.display    = '';
  document.getElementById('d-email').textContent    = state.owner.email;
  showStoresScreen();
}

async function logout() {
  await api('POST', '/api/auth/logout');
  state.owner = null;
  document.getElementById('d-bar').style.display = 'none';
  showScreen('login');
}

// ── Login ─────────────────────────────────────────────────────────────────────
function setupLoginTabs() {
  const tabs = document.querySelectorAll('.login-tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isReg = tab.dataset.tab === 'register';
    document.getElementById('login-submit').textContent = isReg ? 'Create account →' : 'Sign in →';
    document.querySelector('input[autocomplete]')
      .setAttribute('autocomplete', isReg ? 'new-password' : 'current-password');
    setMsg('login-msg', '', '');
  }));
}

function setupLoginForm() {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const isReg    = document.querySelector('.login-tab.active').dataset.tab === 'register';
    const btn      = document.getElementById('login-submit');

    btn.disabled = true;
    setMsg('login-msg', '', '');

    try {
      const endpoint = isReg ? '/api/auth/register' : '/api/auth/login';
      const res  = await api('POST', endpoint, { email, password });
      const data = await safeJson(res);

      if (!res.ok) {
        setMsg('login-msg', data.error || `Server error (${res.status})`, 'error');
        btn.disabled = false; return;
      }

      if (isReg) {
        const lr = await api('POST', '/api/auth/login', { email, password });
        const ld = await safeJson(lr);
        if (lr.ok) { state.owner = ld; onAuthenticated(); }
        else {
          setMsg('login-msg', 'Account created — please sign in.', 'success');
          document.querySelector('.login-tab[data-tab="signin"]').click();
          btn.disabled = false;
        }
        return;
      }

      state.owner = data;
      onAuthenticated();
    } catch {
      setMsg('login-msg', 'Network error — is the dev server running?', 'error');
      btn.disabled = false;
    }
  });
}

// ── Stores screen ─────────────────────────────────────────────────────────────
async function showStoresScreen() {
  hideEditorBar();
  showScreen('stores');
  await loadStores();
}

async function loadStores() {
  const res = await api('GET', '/api/stores');
  if (!res.ok) return;
  state.stores = await res.json();
  renderStoresGrid();
}

function renderStoresGrid() {
  const grid = document.getElementById('stores-grid');
  if (!state.stores.length) {
    grid.innerHTML = '<p class="empty-msg">No stores yet — create one below.</p>';
    return;
  }
  grid.innerHTML = state.stores.map(s => `
    <div class="store-card">
      <div class="store-card__slug">/store/${esc(s.slug)}</div>
      <div class="store-card__name">${esc(s.name || s.slug)}</div>
      <div class="store-card__actions">
        <button class="btn-ghost btn-sm" onclick="openStore('${esc(s.id)}')">Edit →</button>
        <button class="btn-ghost btn-sm btn-ghost--danger" onclick="deleteStore('${esc(s.id)}')">Delete</button>
      </div>
    </div>`).join('');
}

function setupNewStoreForm() {
  document.getElementById('ns-submit').addEventListener('click', async () => {
    const slug = document.getElementById('ns-slug').value.trim().toLowerCase();
    const name = document.getElementById('ns-name').value.trim();
    const desc = document.getElementById('ns-desc').value.trim();
    if (!slug) { setMsg('ns-msg', 'Slug is required', 'error'); return; }

    document.getElementById('ns-submit').disabled = true;
    const res  = await api('POST', '/api/stores', {
      slug, name, config: {
        sections: [],
        seo: { description: desc },
        features: { hasInventoryTracking: true },
      },
    });
    const data = await safeJson(res);

    if (res.ok) {
      ['ns-slug','ns-name','ns-desc'].forEach(id => document.getElementById(id).value = '');
      setMsg('ns-msg', `Store "${data.slug}" created!`, 'success');
      await loadStores();
    } else {
      setMsg('ns-msg', data.error || 'Failed', 'error');
    }
    document.getElementById('ns-submit').disabled = false;
  });
}

window.deleteStore = async function(id) {
  const store = state.stores.find(s => s.id === id);
  if (!store || !confirm(`Delete store "${store.slug}"? This also removes all its products.`)) return;
  const res = await api('DELETE', `/api/stores/${id}`);
  if (res.ok) await loadStores();
};

// ── Open store → editor ───────────────────────────────────────────────────────
window.openStore = async function(storeId) {
  const res = await api('GET', `/api/stores/${storeId}`);
  if (!res.ok) return;
  state.activeStore = await res.json();

  const saved    = loadLocalDraft(storeId);
  state.draft    = saved || deepClone(state.activeStore.config || {});
  if (!Array.isArray(state.draft.sections)) state.draft.sections = [];

  state.isDirty        = !!saved;
  state.editingSection = null;
  state.history        = [];
  state.future         = [];
  state.bulkSelected   = new Set();

  await loadProducts();

  showScreen('editor');
  showEditorBar();
  renderDesignTab();
  renderSectionList();
  renderItemsList();
  renderGlance();
  renderConfigTab();
  updateDirty();
  updateUndoRedoBtns();
  updatePreview();
  document.getElementById('etab-design').scrollTop = 0;
};

// ── Editor tabs ───────────────────────────────────────────────────────────────
function setupEditorTabs() {
  document.querySelectorAll('.etab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.etab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.etab-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`etab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

// ── Top bar actions ────────────────────────────────────────────────────────────
function setupTopBarActions() {
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-discard').addEventListener('click', discardChanges);

  document.getElementById('btn-save-draft').addEventListener('click', () => {
    saveLocalDraft();
    updateDirty(false);
    flash('btn-save-draft', 'Saved ✓');
  });

  document.getElementById('btn-export').addEventListener('click', exportDraft);

  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!confirm('Replace current draft with imported config?')) return;
        pushUndo();
        state.draft = imported;
        if (!Array.isArray(state.draft.sections)) state.draft.sections = [];
        state.isDirty        = true;
        state.editingSection = null;
        renderDesignTab();
        renderSectionList();
        closeSectionEditor();
        schedulePreviewSave();
        updateDirty();
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btn-push-live').addEventListener('click', pushLive);
  document.getElementById('btn-preview-refresh').addEventListener('click', updatePreview);
  document.getElementById('btn-preview-open').addEventListener('click', () => {
    window.open(`/store/${state.activeStore.slug}`, '_blank');
  });
  document.getElementById('btn-preview-desktop').addEventListener('click', () => setPreviewMode('desktop'));
  document.getElementById('btn-preview-mobile').addEventListener('click', ()  => setPreviewMode('mobile'));
}

function showEditorBar() {
  document.getElementById('d-bar-sep').style.display    = '';
  document.getElementById('d-bar-store').textContent    = state.activeStore.name || state.activeStore.slug;
  document.getElementById('d-bar-actions').style.display = '';
  document.getElementById('d-bar-history').style.display = '';
  document.getElementById('btn-push-live').style.display = '';
}

function hideEditorBar() {
  document.getElementById('d-bar-sep').style.display    = 'none';
  document.getElementById('d-bar-store').textContent    = '';
  document.getElementById('d-bar-actions').style.display = 'none';
  document.getElementById('d-bar-history').style.display = 'none';
  document.getElementById('btn-push-live').style.display = 'none';
  document.getElementById('d-bar-dirty').textContent    = '';
}

function updateDirty(dirty) {
  if (dirty !== undefined) state.isDirty = dirty;
  document.getElementById('d-bar-dirty').textContent = state.isDirty ? '● unsaved' : '';
}

function markDirty() {
  state.isDirty = true;
  updateDirty();
  schedulePush();
  schedulePreviewSave();
}

// ── Undo / Redo ───────────────────────────────────────────────────────────────
function pushUndo() {
  state.history.push(deepClone(state.draft));
  if (state.history.length > 50) state.history.shift();
  state.future = [];
  updateUndoRedoBtns();
}

function schedulePush() {
  clearTimeout(state.pushTimer);
  state.pushTimer = setTimeout(() => {
    const last = state.history[state.history.length - 1];
    const cur  = JSON.stringify(state.draft);
    if (!last || JSON.stringify(last) !== cur) {
      state.history.push(deepClone(state.draft));
      if (state.history.length > 50) state.history.shift();
      state.future = [];
      updateUndoRedoBtns();
    }
  }, 600);
}

function undo() {
  if (!state.history.length) return;
  state.future.push(deepClone(state.draft));
  state.draft = state.history.pop();
  afterHistoryJump();
}

function redo() {
  if (!state.future.length) return;
  state.history.push(deepClone(state.draft));
  state.draft = state.future.pop();
  afterHistoryJump();
}

function afterHistoryJump() {
  if (!Array.isArray(state.draft.sections)) state.draft.sections = [];
  state.isDirty = true;
  renderDesignTab();
  renderSectionList();
  if (state.editingSection !== null && state.draft.sections[state.editingSection]) {
    openSectionEditor(state.editingSection);
  } else {
    closeSectionEditor();
  }
  schedulePreviewSave();
  updateDirty(true);
  updateUndoRedoBtns();
}

function updateUndoRedoBtns() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.disabled = !state.history.length;
  if (btnRedo) btnRedo.disabled = !state.future.length;
}

// ── Discard changes ───────────────────────────────────────────────────────────
function discardChanges() {
  if (!confirm('Discard all unsaved changes and revert to the last published version?')) return;
  state.draft        = deepClone(state.activeStore.config || {});
  if (!Array.isArray(state.draft.sections)) state.draft.sections = [];
  state.history      = [];
  state.future       = [];
  state.isDirty      = false;
  state.editingSection = null;
  localStorage.removeItem(`draft_${state.activeStore.id}`);
  renderDesignTab();
  renderSectionList();
  closeSectionEditor();
  schedulePreviewSave();
  updateDirty(false);
  updateUndoRedoBtns();
}

// ── Local save / export / import ──────────────────────────────────────────────
function saveLocalDraft() {
  localStorage.setItem(`draft_${state.activeStore.id}`, JSON.stringify({
    draft:   state.draft,
    savedAt: new Date().toISOString(),
  }));
}

function loadLocalDraft(storeId) {
  try {
    const raw = localStorage.getItem(`draft_${storeId}`);
    if (!raw) return null;
    return JSON.parse(raw).draft;
  } catch { return null; }
}

function exportDraft() {
  download(JSON.stringify(state.draft, null, 2), `${state.activeStore.slug}-config.json`, 'application/json');
}

// ── Push live ─────────────────────────────────────────────────────────────────
async function pushLive() {
  if (!confirm('Push changes to the live site?\nThis updates the public storefront immediately.')) return;
  const btn = document.getElementById('btn-push-live');
  btn.disabled = true; btn.textContent = 'Publishing…';

  const res = await api('PUT', `/api/stores/${state.activeStore.id}`, {
    name:   state.draft.name || state.activeStore.name,
    config: state.draft,
  });

  if (res.ok) {
    state.activeStore.config = deepClone(state.draft);
    state.isDirty = false;
    state.history = []; state.future = [];
    updateDirty(false);
    updateUndoRedoBtns();
    localStorage.removeItem(`draft_${state.activeStore.id}`);
    btn.textContent = 'Published ✓';
    setTimeout(() => { btn.textContent = t('pushLive'); btn.disabled = false; }, 2500);
  } else {
    alert('Failed to publish. Check the console.');
    btn.textContent = t('pushLive');
    btn.disabled = false;
  }
}

// ── Preview ───────────────────────────────────────────────────────────────────
async function schedulePreviewSave() {
  clearTimeout(state.previewTimer);
  state.previewTimer = setTimeout(savePreviewDraft, 900);
}

async function savePreviewDraft() {
  if (!state.activeStore || !state.draft) return;
  await api('PUT', `/api/stores/${state.activeStore.id}`, {
    _draft: true,
    name:   state.draft.name || state.activeStore.name,
    config: state.draft,
  });
  if (dashConfig.autoRefresh !== false) updatePreview();
}

function updatePreview() {
  const iframe = document.getElementById('preview-iframe');
  const slug   = state.activeStore?.slug;
  if (!slug) return;
  iframe.src = `/store/${slug}?preview=1&t=${Date.now()}`;
}

function setPreviewMode(mode) {
  dashConfig.preview = mode;
  saveDashConfig();
  const wrap = document.getElementById('preview-frame-wrap');
  const label = document.getElementById('preview-label');
  wrap.className = `preview-frame-wrap${mode === 'mobile' ? ' preview-frame-wrap--mobile' : ''}`;
  label.textContent = mode === 'mobile' ? 'Mobile Preview' : 'Live Preview';
  document.getElementById('btn-preview-desktop').classList.toggle('active', mode === 'desktop');
  document.getElementById('btn-preview-mobile').classList.toggle('active',  mode === 'mobile');
}

// ── Store at a Glance ─────────────────────────────────────────────────────────
function renderGlance() {
  const total    = state.products.length;
  const oos      = state.products.filter(p => !p.in_stock).length;
  const tagCounts = {};
  state.products.forEach(p => {
    if (p.category) {
      p.category.split(',').forEach(t => {
        const s = t.trim();
        if (s) tagCounts[s] = (tagCounts[s] || 0) + 1;
      });
    }
  });
  const topTag = Object.entries(tagCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';

  document.getElementById('glance').innerHTML = `
    <div class="glance__stat">
      <div class="glance__val">${total}</div>
      <div class="glance__lbl">Items</div>
    </div>
    <div class="glance__stat">
      <div class="glance__val">${oos}</div>
      <div class="glance__lbl">Out of stock</div>
    </div>
    <div class="glance__stat">
      <div class="glance__val" style="font-size:13px;line-height:1.3">${esc(topTag)}</div>
      <div class="glance__lbl">Top tag</div>
    </div>`;
}

// ── Design tab ────────────────────────────────────────────────────────────────
function renderDesignTab() {
  const d     = state.draft;
  const theme = d.theme    || {};
  const seo   = d.seo      || {};
  const fonts = theme.fonts || {};

  document.getElementById('d-name').value      = d.name          || '';
  document.getElementById('d-seo-title').value = seo.title       || '';
  document.getElementById('d-seo-desc').value  = seo.description || '';

  // Hex color inputs — sync both swatch and text field
  const setHex = (swId, txtId, val) => {
    const hex = val || '';
    document.getElementById(swId).value = hexToColorInput(hex);
    document.getElementById(txtId).value = hex.toUpperCase() || '';
  };
  setHex('d-accent-sw', 'd-accent', theme.accent || '#e2a14a');
  setHex('d-bg-sw',     'd-bg',     theme.bg     || '#efeae0');
  setHex('d-fg-sw',     'd-fg',     theme.fg     || '#1c1a16');

  setSelectVal('d-catalog-placement', d.catalogPlacement || 'landing-full');

  document.getElementById('d-font-title-family').value  = fonts.titleFamily  || '';
  document.getElementById('d-font-title-url').value     = fonts.titleUrl     || '';
  document.getElementById('d-font-body-family').value   = fonts.bodyFamily   || '';
  document.getElementById('d-font-body-url').value      = fonts.bodyUrl      || '';
  document.getElementById('d-font-accent-family').value = fonts.accentFamily || '';
  document.getElementById('d-font-accent-url').value    = fonts.accentUrl    || '';
  document.getElementById('d-font-slogan-family').value = fonts.sloganFamily || '';
  document.getElementById('d-font-slogan-url').value    = fonts.sloganUrl    || '';

  renderLogoPicker(d.logo || '');
  renderCustomBtnsList();
}

// ── Hex color helpers ─────────────────────────────────────────────────────────
function hexToColorInput(hex) {
  hex = (hex || '#000000').trim();
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    hex = '#' + hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3];
  }
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : '#000000';
}

function isValidHex(hex) {
  return /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test((hex || '').trim());
}

function setupHexPair(swId, txtId, setter) {
  const sw  = document.getElementById(swId);
  const txt = document.getElementById(txtId);
  if (!sw || !txt) return;
  sw.addEventListener('input', () => {
    txt.value = sw.value.toUpperCase();
    setter(sw.value);
    markDirty();
  });
  txt.addEventListener('input', () => {
    const v = txt.value.trim();
    if (isValidHex(v)) {
      sw.value = hexToColorInput(v);
      setter(v);
      markDirty();
    }
  });
}

function setupDesignListeners() {
  const watch = (id, setter) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => { setter(e.target.value); markDirty(); });
  };
  watch('d-name',      v => { state.draft.name = v; });
  watch('d-seo-title', v => { ensureObj('seo'); state.draft.seo.title = v; });
  watch('d-seo-desc',  v => { ensureObj('seo'); state.draft.seo.description = v; });

  // Hex color pairs (swatch + text field kept in sync)
  setupHexPair('d-accent-sw', 'd-accent', v => { ensureObj('theme'); state.draft.theme.accent = v; });
  setupHexPair('d-bg-sw',     'd-bg',     v => { ensureObj('theme'); state.draft.theme.bg     = v; });
  setupHexPair('d-fg-sw',     'd-fg',     v => { ensureObj('theme'); state.draft.theme.fg     = v; });

  document.getElementById('d-catalog-placement')?.addEventListener('change', e => {
    state.draft.catalogPlacement = e.target.value; markDirty();
  });

  // Font fields
  const fontFields = [
    ['d-font-title-family',  'titleFamily'],  ['d-font-title-url',    'titleUrl'],
    ['d-font-body-family',   'bodyFamily'],   ['d-font-body-url',     'bodyUrl'],
    ['d-font-accent-family', 'accentFamily'], ['d-font-accent-url',   'accentUrl'],
    ['d-font-slogan-family', 'sloganFamily'], ['d-font-slogan-url',   'sloganUrl'],
  ];
  fontFields.forEach(([id, key]) => {
    document.getElementById(id)?.addEventListener('input', e => {
      ensureObj('theme'); ensureObj('theme.fonts');
      state.draft.theme.fonts[key] = e.target.value;
      markDirty();
    });
  });

  // Logo upload
  document.getElementById('btn-logo-upload').addEventListener('click', () => {
    state.imgUploadTarget = { type: 'logo' };
    document.getElementById('img-upload-input').click();
  });
  document.getElementById('btn-logo-clear').addEventListener('click', () => {
    state.draft.logo = '';
    renderLogoPicker('');
    markDirty();
  });

  document.getElementById('img-upload-input').addEventListener('change', handleImgUpload);

  // Template gallery button
  document.getElementById('btn-change-tmpl').addEventListener('click', () => {
    document.getElementById('tmpl-overlay').classList.add('active');
  });

  // Style gallery button
  document.getElementById('btn-change-style').addEventListener('click', () => {
    document.getElementById('style-overlay').classList.add('active');
  });

  // Custom button add
  document.getElementById('btn-add-custom-btn').addEventListener('click', () => {
    if (!Array.isArray(state.draft.buttons)) state.draft.buttons = [];
    if (state.draft.buttons.length >= 3) { alert('Maximum 3 custom buttons.'); return; }
    state.draft.buttons.push({ text: 'Button', image: '', url: '#', sticky: false, color: '#e2a14a' });
    renderCustomBtnsList();
    markDirty();
  });
}

function renderLogoPicker(url) {
  const wrap  = document.getElementById('logo-preview-wrap');
  const clear = document.getElementById('btn-logo-clear');
  if (url) {
    wrap.innerHTML = `<img src="${esc(url)}" alt="Logo" class="logo-thumb" />`;
    clear.style.display = '';
  } else {
    wrap.innerHTML = `<div class="logo-placeholder">☰</div>`;
    clear.style.display = 'none';
  }
}

function renderCustomBtnsList() {
  const list = document.getElementById('custom-btns-list');
  const btns = Array.isArray(state.draft.buttons) ? state.draft.buttons : [];
  if (!btns.length) { list.innerHTML = ''; return; }

  list.innerHTML = btns.map((b, i) => `
    <div class="field-group" style="margin-bottom:6px">
      <div class="field-group__label">Button ${i+1}</div>
      <div class="form-row">
        <div class="form-field">
          <label>Text</label>
          <input type="text" value="${esc(b.text||'')}" data-cb="${i}" data-cb-key="text" />
        </div>
        <div class="form-field">
          <label>URL</label>
          <input type="text" value="${esc(b.url||'')}" data-cb="${i}" data-cb-key="url" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Color</label>
          <input type="color" value="${esc(b.color||'#e2a14a')}" data-cb="${i}" data-cb-key="color" style="height:32px;padding:2px 4px" />
        </div>
        <div class="form-field" style="justify-content:flex-end">
          <label>Sticky</label>
          <label class="toggle" style="margin-top:6px">
            <input type="checkbox" ${b.sticky?'checked':''} data-cb="${i}" data-cb-key="sticky" />
            <span class="toggle__track"></span><span class="toggle__thumb"></span>
          </label>
        </div>
      </div>
      <button type="button" class="btn-ghost btn-sm btn-ghost--danger" onclick="removeCustomBtn(${i})">Remove</button>
    </div>`).join('');

  list.querySelectorAll('[data-cb]').forEach(el => {
    const ev = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      const i   = parseInt(el.dataset.cb);
      const key = el.dataset.cbKey;
      if (!Array.isArray(state.draft.buttons)) state.draft.buttons = [];
      state.draft.buttons[i][key] = el.type === 'checkbox' ? el.checked : el.value;
      markDirty();
    });
  });
}

window.removeCustomBtn = function(i) {
  state.draft.buttons.splice(i, 1);
  renderCustomBtnsList();
  markDirty();
};

// ── Style gallery ─────────────────────────────────────────────────────────────
function setupStyleGallery() {
  document.getElementById('style-close').addEventListener('click', () => {
    document.getElementById('style-overlay').classList.remove('active');
  });
  document.getElementById('style-overlay').addEventListener('click', e => {
    if (e.target.id === 'style-overlay') document.getElementById('style-overlay').classList.remove('active');
  });

  document.getElementById('style-grid').innerHTML = STYLES.map(s => `
    <div class="gallery-card" onclick="applyStyle('${esc(s.id)}')">
      <div class="style-swatches">
        ${s.swatches.map(c => `<div class="style-swatch" style="background:${esc(c)}"></div>`).join('')}
      </div>
      <div class="gallery-card__name">${esc(s.name)}</div>
      <div class="gallery-card__desc">${esc(s.desc)}</div>
    </div>`).join('');
}

window.applyStyle = function(id) {
  const style = STYLES.find(s => s.id === id);
  if (!style) return;
  if (!confirm(`Apply the "${style.name}" style? This replaces your current theme colors and fonts.`)) return;
  pushUndo();
  ensureObj('theme');
  state.draft.theme.bg     = style.theme.bg;
  state.draft.theme.accent = style.theme.accent;
  state.draft.theme.fg     = style.theme.fg;
  if (style.theme.fonts) {
    ensureObj('theme.fonts');
    Object.assign(state.draft.theme.fonts, style.theme.fonts);
  }
  renderDesignTab();
  markDirty();
  document.getElementById('style-overlay').classList.remove('active');
};

// ── Dashboard style ───────────────────────────────────────────────────────────
function applyDashStyle(id) {
  const vars = DASH_STYLES[id] || DASH_STYLES.maxcybersolutions;
  for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }
}

window.selectDashStyle = function(id) {
  dashConfig.dashStyle = id;
  saveDashConfig();
  applyDashStyle(id);
  renderDashStyleGrid();
};

function renderDashStyleGrid() {
  const grid = document.getElementById('dash-style-grid');
  if (!grid) return;
  const cur = dashConfig.dashStyle || 'maxcybersolutions';
  grid.innerHTML = STYLES.map(s => `
    <button class="dash-style-btn${s.id === cur ? ' active' : ''}" onclick="selectDashStyle('${esc(s.id)}')">
      <div class="dash-style-btn__swatch">
        ${s.swatches.map(c => `<div class="dash-style-btn__dot" style="background:${esc(c)}"></div>`).join('')}
      </div>
      <div class="dash-style-btn__name">${esc(s.name)}</div>
    </button>`).join('');
}

// ── Section list ──────────────────────────────────────────────────────────────
function renderSectionList() {
  const list     = document.getElementById('sec-list');
  const sections = state.draft.sections || [];

  if (!sections.length) {
    list.innerHTML = `<p style="padding:16px;font-size:12px;color:var(--fg-faint)">${t('noSections')}</p>`;
    return;
  }

  list.innerHTML = sections.map((s, i) => {
    const def      = SECTION_TYPES[s.type] || { label: s.type, icon: '?' };
    const isActive = state.editingSection === i;
    return `
<div class="sec-item${isActive ? ' active' : ''}" draggable="true" data-index="${i}">
  <span class="sec-item__drag" title="Drag to reorder">⠿</span>
  <span class="sec-item__icon">${def.icon}</span>
  <span class="sec-item__label">${esc(sectionLabel(s, def))}</span>
  <span class="sec-item__btns">
    <button class="sec-item__btn" onclick="editSection(${i})" title="Edit">✏</button>
    <button class="sec-item__btn sec-item__btn--del" onclick="removeSection(${i})" title="Delete">✕</button>
  </span>
</div>`;
  }).join('');

  setupDragDrop();

  document.getElementById('sec-add-menu').innerHTML = Object.entries(SECTION_TYPES).map(([type, def]) =>
    `<div class="sec-add-menu__item" onclick="addSection('${type}')">
      <span class="sec-add-menu__icon">${def.icon}</span>
      <span>${esc(def.label)}</span>
    </div>`).join('');
}

function sectionLabel(s, def) {
  return s.headline || s.title || s.text || s.label || def.label;
}

function setupSectionControls() {
  const trigger = document.getElementById('sec-add-trigger');
  const menu    = document.getElementById('sec-add-menu');

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? '' : 'none';
  });
  document.addEventListener('click', () => { menu.style.display = 'none'; });
  document.getElementById('sec-editor-close').addEventListener('click', closeSectionEditor);
}

window.addSection = function(type) {
  document.getElementById('sec-add-menu').style.display = 'none';
  const def = SECTION_TYPES[type];
  if (!def) return;
  pushUndo();
  const section = { id: uid(), type, ...deepClone(def.defaults) };
  state.draft.sections.push(section);
  state.editingSection = state.draft.sections.length - 1;
  renderSectionList();
  openSectionEditor(state.editingSection);
  markDirty();
};

window.removeSection = function(i) {
  if (!confirm('Remove this section?')) return;
  pushUndo();
  state.draft.sections.splice(i, 1);
  if (state.editingSection === i) closeSectionEditor();
  else if (state.editingSection > i) state.editingSection--;
  renderSectionList();
  markDirty();
};

window.editSection = function(i) {
  state.editingSection = i;
  renderSectionList();
  openSectionEditor(i);
};

// ── Drag & drop reorder ───────────────────────────────────────────────────────
function setupDragDrop() {
  let dragIdx = null;
  document.querySelectorAll('.sec-item').forEach(el => {
    el.addEventListener('dragstart', () => {
      dragIdx = parseInt(el.dataset.index);
      setTimeout(() => el.style.opacity = '0.4', 0);
    });
    el.addEventListener('dragend', () => {
      el.style.opacity = '';
      document.querySelectorAll('.sec-item').forEach(e => e.classList.remove('drag-over'));
    });
    el.addEventListener('dragover', e => {
      e.preventDefault();
      document.querySelectorAll('.sec-item').forEach(e => e.classList.remove('drag-over'));
      el.classList.add('drag-over');
    });
    el.addEventListener('drop', e => {
      e.preventDefault();
      const dropIdx = parseInt(el.dataset.index);
      if (dragIdx === null || dragIdx === dropIdx) return;
      pushUndo();
      const sections = state.draft.sections;
      const [moved]  = sections.splice(dragIdx, 1);
      sections.splice(dropIdx, 0, moved);
      if (state.editingSection === dragIdx) state.editingSection = dropIdx;
      dragIdx = null;
      renderSectionList();
      if (state.editingSection !== null) openSectionEditor(state.editingSection);
      markDirty();
    });
  });
}

// ── Section editor ────────────────────────────────────────────────────────────
function openSectionEditor(i) {
  const section = state.draft.sections[i];
  if (!section) return;
  const def = SECTION_TYPES[section.type] || { label: section.type };

  document.getElementById('sec-editor').style.display       = '';
  document.getElementById('sec-editor-title').textContent   = def.label || section.type;
  document.getElementById('sec-editor-fields').innerHTML    = buildSectionFields(section, i);

  bindSectionFields(i);
}

function closeSectionEditor() {
  state.editingSection = null;
  document.getElementById('sec-editor').style.display = 'none';
  renderSectionList();
}

function buildSectionFields(s, i) {
  switch (s.type) {
    case 'hero': {
      const isCarousel = s.layout === 'carousel';
      return [
        field('text', 'Headline', 'headline', esc(s.headline || '')),
        field('text', 'Subline',  'subline',  esc(s.subline  || '')),
        fieldSelect('Layout', 'layout', s.layout || 'static',
          ['static','carousel'], ['Static (single image)','Carousel (multiple images)']),
        isCarousel
          ? buildCarouselImages(s.images || [], i)
          : fieldImg('Background image', 'image', s.image, i),
        field('text', 'Overlay opacity (0–1)', 'overlay', s.overlay ?? 0.45),
        fieldSelect('Alignment', 'align', s.align || 'left', ['left','center','right']),
        fieldGroup('CTA Button', [
          field('text', 'Button label', 'cta.label', esc((s.cta||{}).label || '')),
          field('text', 'Button URL',   'cta.url',   esc((s.cta||{}).url   || '')),
        ]),
      ].join('');
    }

    case 'product-grid': return [
      field('text', 'Section title', 'title', esc(s.title || '')),
      field('text', 'Tag label',     'tag',   esc(s.tag   || '')),
      fieldSelect('Columns', 'columns', String(s.columns||3), ['2','3','4']),
      fieldToggle('Show out-of-stock items', 'showOutOfStock', s.showOutOfStock !== false),
    ].join('');

    case 'text-banner': return [
      field('text',  'Text',             'text',  esc(s.text  || '')),
      field('color', 'Background color', 'bg',    s.bg    || '#1c1a16'),
      field('color', 'Text color',       'color', s.color || '#e2a14a'),
      fieldSelect('Alignment', 'align', s.align || 'center', ['left','center','right']),
    ].join('');

    case 'image-gallery': return [
      field('text', 'Title (optional)', 'title', esc(s.title || '')),
      fieldSelect('Columns', 'columns', String(s.columns||3), ['2','3','4']),
      buildGalleryImages(s.images || [], i),
    ].join('');

    case 'floating-cta': return [
      fieldSelect('Icon', 'icon', s.icon || 'whatsapp',
        ['whatsapp','phone','email','link'],
        ['WhatsApp','Phone','Email','Custom link']),
      field('text',  'Button label', 'label', esc(s.label || '')),
      field('text',  'URL / link',   'url',   esc(s.url   || '')),
      fieldSelect('Position', 'position', s.position || 'bottom-right',
        ['bottom-right','bottom-left','top-right','top-left'],
        ['Bottom right','Bottom left','Top right','Top left']),
      field('color', 'Button color', 'color', s.color || '#25D366'),
    ].join('');

    case 'rich-text': return [
      `<div class="form-field"><label>HTML content</label>
        <textarea data-field="content" rows="6"
          style="resize:vertical;font-family:var(--mono);font-size:11px">${esc(s.content||'')}</textarea>
      </div>`,
      fieldSelect('Alignment', 'align', s.align || 'left', ['left','center','right']),
      fieldSelect('Max width', 'maxWidth', s.maxWidth || 'normal',
        ['narrow','normal','wide'],['Narrow (60ch)','Normal (80ch)','Full width']),
    ].join('');

    default: return '<p style="padding:8px;color:var(--fg-faint)">No fields for this section type.</p>';
  }
}

// Field builders
function field(type, label, fieldPath, value) {
  const isColor   = type === 'color';
  const styleAttr = isColor ? ' style="height:38px;padding:3px 6px;"' : '';
  return `<div class="form-field">
    <label>${esc(label)}</label>
    <input type="${type}" data-field="${esc(fieldPath)}" value="${value}"${styleAttr} />
  </div>`;
}

function fieldToggle(label, fieldPath, checked) {
  return `<div class="flag-row">
    <span class="flag-row__name">${esc(label)}</span>
    <label class="toggle">
      <input type="checkbox" data-field="${esc(fieldPath)}" ${checked ? 'checked' : ''} />
      <span class="toggle__track"></span>
      <span class="toggle__thumb"></span>
    </label>
  </div>`;
}

function fieldSelect(label, fieldPath, selected, values, labels) {
  const opts = values.map((v, i) =>
    `<option value="${esc(v)}" ${selected === v ? 'selected' : ''}>${esc((labels||values)[i])}</option>`
  ).join('');
  return `<div class="form-field">
    <label>${esc(label)}</label>
    <select data-field="${esc(fieldPath)}">${opts}</select>
  </div>`;
}

function fieldImg(label, fieldPath, currentUrl, sectionIdx) {
  const hasImg = !!currentUrl;
  return `<div class="form-field">
    <label>${esc(label)}</label>
    <div class="img-field">
      <div class="img-field__row">
        ${hasImg
          ? `<img src="${esc(currentUrl)}" class="img-thumb" id="sec-img-thumb-${esc(fieldPath)}" />`
          : `<div class="img-placeholder" id="sec-img-thumb-${esc(fieldPath)}">🖼</div>`}
        <div style="display:flex;flex-direction:column;gap:5px">
          <button type="button" class="btn-ghost btn-sm"
            onclick="triggerSecImgUpload(${sectionIdx},'${esc(fieldPath)}')">Upload</button>
          ${hasImg ? `<button type="button" class="btn-ghost btn-sm"
            onclick="clearSecImg(${sectionIdx},'${esc(fieldPath)}')">Clear</button>` : ''}
        </div>
      </div>
    </div>
  </div>`;
}

function fieldGroup(label, fieldsHtml) {
  return `<div class="field-group">
    <span class="field-group__label">${esc(label)}</span>
    ${Array.isArray(fieldsHtml) ? fieldsHtml.join('') : fieldsHtml}
  </div>`;
}

function buildGalleryImages(images, sectionIdx) {
  const rows = images.map((img, gi) => `
    <div class="gallery-row" data-gidx="${gi}">
      <img src="${esc(img.url)}" class="gallery-thumb" onerror="this.style.display='none'" />
      <input type="text" placeholder="Caption"
        value="${esc(img.caption||'')}"
        data-field="images[${gi}].caption" />
      <button type="button" class="btn-ghost btn-sm"
        onclick="removeGalleryImg(${sectionIdx},${gi})">✕</button>
    </div>`).join('');

  return `<div class="form-field">
    <label>Images (${images.length})</label>
    <div id="gallery-img-list">${rows}</div>
    <button type="button" class="btn-ghost btn-sm" style="margin-top:6px"
      onclick="triggerGalleryImgAdd(${sectionIdx})">+ Add image</button>
  </div>`;
}

function buildCarouselImages(images, sectionIdx) {
  const rows = images.map((url, ci) => `
    <div class="gallery-row">
      <img src="${esc(url)}" class="gallery-thumb" onerror="this.style.display='none'" />
      <span style="flex:1;font-size:11px;overflow:hidden;text-overflow:ellipsis">${esc(url)}</span>
      <button type="button" class="btn-ghost btn-sm"
        onclick="removeCarouselImg(${sectionIdx},${ci})">✕</button>
    </div>`).join('');

  return `<div class="form-field">
    <label>Carousel images (${images.length})</label>
    <div id="carousel-img-list">${rows}</div>
    <button type="button" class="btn-ghost btn-sm" style="margin-top:6px"
      onclick="triggerCarouselImgAdd(${sectionIdx})">+ Add image</button>
  </div>`;
}

function bindSectionFields(i) {
  const container = document.getElementById('sec-editor-fields');
  container.querySelectorAll('input[data-field], select[data-field], textarea[data-field]').forEach(el => {
    const isColor = el.type === 'color';
    el.addEventListener(isColor ? 'input' : 'change', () => {
      const value = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? parseFloat(el.value) || 0 : el.value);
      setNestedField(state.draft.sections[i], el.dataset.field, value);
      markDirty();
    });
    if ((el.tagName === 'INPUT' && el.type === 'text') || el.tagName === 'TEXTAREA') {
      el.addEventListener('input', () => {
        setNestedField(state.draft.sections[i], el.dataset.field, el.value);
        markDirty();
      });
    }
  });
}

// ── Gallery / carousel image actions ──────────────────────────────────────────
window.triggerGalleryImgAdd = function(sectionIdx) {
  state.imgUploadTarget = { type: 'gallery', sectionIdx };
  document.getElementById('img-upload-input').click();
};
window.removeGalleryImg = function(sectionIdx, imgIdx) {
  state.draft.sections[sectionIdx].images.splice(imgIdx, 1);
  openSectionEditor(sectionIdx);
  markDirty();
};
window.triggerCarouselImgAdd = function(sectionIdx) {
  state.imgUploadTarget = { type: 'carousel', sectionIdx };
  document.getElementById('img-upload-input').click();
};
window.removeCarouselImg = function(sectionIdx, imgIdx) {
  state.draft.sections[sectionIdx].images.splice(imgIdx, 1);
  openSectionEditor(sectionIdx);
  markDirty();
};
window.triggerSecImgUpload = function(sectionIdx, fld) {
  state.imgUploadTarget = { type: 'section', sectionIdx, field: fld };
  document.getElementById('img-upload-input').click();
};
window.clearSecImg = function(sectionIdx, fieldPath) {
  setNestedField(state.draft.sections[sectionIdx], fieldPath, '');
  openSectionEditor(sectionIdx);
  markDirty();
};

// ── Image upload handler ──────────────────────────────────────────────────────
async function handleImgUpload(e) {
  const file   = e.target.files[0];
  if (!file) return;
  e.target.value = '';

  const target = state.imgUploadTarget;
  if (!target) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('store_id', state.activeStore.id);

  try {
    const res  = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await safeJson(res);
    if (!res.ok) { alert(data.error || 'Upload failed'); return; }
    const url = data.url;

    if (target.type === 'logo') {
      state.draft.logo = url;
      renderLogoPicker(url);
      markDirty();
    } else if (target.type === 'section') {
      setNestedField(state.draft.sections[target.sectionIdx], target.field, url);
      openSectionEditor(target.sectionIdx);
      markDirty();
    } else if (target.type === 'gallery') {
      if (!Array.isArray(state.draft.sections[target.sectionIdx].images))
        state.draft.sections[target.sectionIdx].images = [];
      state.draft.sections[target.sectionIdx].images.push({ url, caption: '' });
      openSectionEditor(target.sectionIdx);
      markDirty();
    } else if (target.type === 'carousel') {
      if (!Array.isArray(state.draft.sections[target.sectionIdx].images))
        state.draft.sections[target.sectionIdx].images = [];
      state.draft.sections[target.sectionIdx].images.push(url);
      openSectionEditor(target.sectionIdx);
      markDirty();
    } else if (target.type === 'product') {
      document.getElementById('pm-image').value = url;
      renderProductImgPreview(url);
    }
  } finally {
    state.imgUploadTarget = null;
  }
}

// ── Items tab ─────────────────────────────────────────────────────────────────
async function loadProducts() {
  if (!state.activeStore) return;
  const res = await api('GET', `/api/products?store_id=${state.activeStore.id}`);
  if (!res.ok) return;
  state.products = await res.json();
}

function setupItemsTab() {
  document.getElementById('items-search').addEventListener('input', renderItemsList);
  document.getElementById('items-sort').addEventListener('change', renderItemsList);
  document.getElementById('items-filter-tag').addEventListener('change', renderItemsList);
  document.getElementById('items-filter-stock').addEventListener('change', renderItemsList);
  document.getElementById('select-all-items').addEventListener('change', toggleSelectAll);

  document.getElementById('btn-new-item').addEventListener('click', openNewProductModal);
  document.getElementById('btn-dl-template').addEventListener('click', downloadItemTemplate);
  document.getElementById('btn-export-csv').addEventListener('click', exportCsv);
  document.getElementById('btn-export-json-items').addEventListener('click', exportItemsJson);
  document.getElementById('btn-import-items').addEventListener('click', () => {
    document.getElementById('import-items-file').click();
  });
  document.getElementById('import-items-file').addEventListener('change', importItems);
  document.getElementById('btn-fetch-items').addEventListener('click', async () => {
    await loadProducts(); renderItemsList(); renderGlance();
    flash('btn-fetch-items', 'Done ✓');
  });
  document.getElementById('btn-check-links').addEventListener('click', checkBrokenLinks);
}

function allTags() {
  const tags = new Set();
  state.products.forEach(p => {
    if (p.category) {
      p.category.split(',').forEach(t => { const s = t.trim(); if (s) tags.add(s); });
    }
  });
  return [...tags].sort();
}

function renderItemsList() {
  const query      = document.getElementById('items-search').value.toLowerCase();
  const sortBy     = document.getElementById('items-sort').value;
  const filterTag  = document.getElementById('items-filter-tag').value;
  const filterStk  = document.getElementById('items-filter-stock').value;

  // Refresh tag filter options
  const tagSel = document.getElementById('items-filter-tag');
  const curTag = tagSel.value;
  tagSel.innerHTML = '<option value="">All tags</option>' +
    allTags().map(tag => `<option value="${esc(tag)}"${tag===curTag?' selected':''}>${esc(tag)}</option>`).join('');

  let items = [...state.products];
  if (query) items = items.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
  if (filterTag) items = items.filter(p => {
    if (!p.category) return false;
    return p.category.split(',').map(s => s.trim()).includes(filterTag);
  });
  if (filterStk === 'in')     items = items.filter(p => p.in_stock);
  if (filterStk === 'out')    items = items.filter(p => !p.in_stock);
  if (filterStk === 'hidden') items = items.filter(p => !p.visible);

  if (sortBy === 'name')           items.sort((a,b) => a.name.localeCompare(b.name));
  else if (sortBy === 'price-asc') items.sort((a,b) => a.price_cents - b.price_cents);
  else if (sortBy === 'price-desc')items.sort((a,b) => b.price_cents - a.price_cents);

  const list = document.getElementById('items-list');
  if (!items.length) {
    list.innerHTML = `<p class="empty-msg" style="padding:16px">${t('noItems')}</p>`;
    return;
  }

  list.innerHTML = items.map(p => {
    const isSel = state.bulkSelected.has(p.id);
    const draft = !p.visible;
    return `
<div class="item-row">
  <input type="checkbox" class="item-row__check" data-id="${esc(p.id)}" ${isSel?'checked':''} onchange="toggleItemSelect('${esc(p.id)}',this.checked)" />
  ${p.image
    ? `<img src="${esc(p.image)}" class="item-row__thumb" alt="" onerror="this.style.opacity=0.2" />`
    : `<div class="item-row__thumb"></div>`}
  <span class="item-row__name${draft?' item-row__name--draft':''}" title="${esc(p.name)}">${esc(p.name)}${draft?' [hidden]':''}</span>
  <span class="item-row__price">$${esc((p.price_cents/100).toFixed(2))}</span>
  <span class="item-row__btns">
    <button class="item-row__btn" onclick="editProduct('${esc(p.id)}')">✏</button>
    <button class="item-row__btn" onclick="duplicateProduct('${esc(p.id)}')">⊕</button>
    <button class="item-row__btn item-row__btn--del" onclick="deleteProduct('${esc(p.id)}')">✕</button>
  </span>
</div>`;
  }).join('');
}

// Bulk select
window.toggleItemSelect = function(id, checked) {
  if (checked) state.bulkSelected.add(id); else state.bulkSelected.delete(id);
  updateBulkBar();
};
function toggleSelectAll() {
  const checked = document.getElementById('select-all-items').checked;
  state.bulkSelected = checked ? new Set(state.products.map(p => p.id)) : new Set();
  renderItemsList();
  updateBulkBar();
}
function updateBulkBar() {
  const bar   = document.getElementById('bulk-bar');
  const count = state.bulkSelected.size;
  bar.classList.toggle('visible', count > 0);
  document.getElementById('bulk-count').textContent = `${count} selected`;
}

function setupBulkBar() {
  document.getElementById('btn-bulk-apply').addEventListener('click', bulkApply);
  document.getElementById('btn-bulk-clear').addEventListener('click', () => {
    state.bulkSelected = new Set();
    document.getElementById('select-all-items').checked = false;
    renderItemsList();
    updateBulkBar();
  });
}

async function bulkApply() {
  if (!state.bulkSelected.size) return;
  const tags   = document.getElementById('bulk-tag-input').value.trim();
  const priceS = document.getElementById('bulk-price-input').value;
  const visS   = document.getElementById('bulk-vis-input').value;
  if (!tags && !priceS && visS === '') return;

  if (!confirm(`Apply changes to ${state.bulkSelected.size} item(s)?`)) return;

  const payload = {};
  if (tags)   payload.category    = tags;
  if (priceS) payload.price_cents = Math.round(parseFloat(priceS) * 100);
  if (visS !== '') payload.visible = visS === '1';

  const ids = [...state.bulkSelected];
  await Promise.all(ids.map(id => api('PUT', `/api/products/${id}`, payload)));

  state.bulkSelected = new Set();
  document.getElementById('bulk-tag-input').value   = '';
  document.getElementById('bulk-price-input').value = '';
  document.getElementById('bulk-vis-input').value   = '';
  document.getElementById('select-all-items').checked = false;
  await loadProducts();
  renderItemsList();
  renderGlance();
  updateBulkBar();
}

// Duplicate product
window.duplicateProduct = async function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const newSku = p.sku + '-copy';
  const payload = { ...p, sku: newSku, name: p.name + ' -1', visible: false, store_id: state.activeStore.id };
  delete payload.id; delete payload.created_at;
  const res = await api('POST', '/api/products', payload);
  const data = await safeJson(res);
  if (res.ok) {
    await loadProducts(); renderItemsList(); renderGlance();
    setMsg('items-msg', `Duplicated as hidden draft "${data.name}".`, 'success');
    setTimeout(() => setMsg('items-msg', '', ''), 3500);
  } else {
    setMsg('items-msg', data.error || 'Duplicate failed', 'error');
  }
};

// Broken link checker
async function checkBrokenLinks() {
  const result = document.getElementById('broken-links-result');
  const images = state.products.filter(p => p.image).map(p => ({ name: p.name, url: p.image }));
  if (!images.length) { result.textContent = 'No product images to check.'; return; }

  result.textContent = 'Checking…';
  const broken = [];
  await Promise.all(images.map(async ({ name, url }) => {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (!r.ok) broken.push(name);
    } catch { broken.push(name); }
  }));

  result.textContent = broken.length
    ? `⚠ Broken image(s): ${broken.join(', ')}`
    : `✓ All ${images.length} image(s) OK`;
}

// CSV / JSON export
function exportCsv() {
  const headers = ['SKU','Name','Description','Price ($)','In Stock','Tags','Visible','Image'];
  const rows    = state.products.map(p => [
    p.sku, p.name, p.description || '', (p.price_cents/100).toFixed(2),
    p.in_stock ? '1' : '0', p.category || '', p.visible ? '1' : '0', p.image || '',
  ]);
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(','))
    .join('\n');
  download(csv, `${state.activeStore.slug}-items.csv`, 'text/csv');
}

function exportItemsJson() {
  download(JSON.stringify(state.products, null, 2),
    `${state.activeStore.slug}-items.json`, 'application/json');
}

function downloadItemTemplate() {
  const csv = '"SKU","Name","Description","Price ($)","In Stock","Tags"\n"ITEM-01","Example Product","A short description","99.00","1","featured, summer"';
  download(csv, 'items-template.csv', 'text/csv');
}

async function importItems(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';

  if (!confirm('Import items? Existing items with the same SKU will not be overwritten.')) return;

  const text = await file.text();
  let items  = [];

  if (file.name.endsWith('.json')) {
    try { items = JSON.parse(text); } catch { alert('Invalid JSON file.'); return; }
  } else {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const hdr   = parseCsvRow(lines[0]);
    items = lines.slice(1).map(l => {
      const vals = parseCsvRow(l);
      const obj  = {};
      hdr.forEach((h, i) => obj[h.toLowerCase().replace(/ /g,'_')] = vals[i] || '');
      return {
        sku:         obj.sku,
        name:        obj.name,
        description: obj.description || '',
        price_cents: Math.round(parseFloat(obj['price_($)'] || obj.price || 0) * 100),
        in_stock:    obj.in_stock !== '0',
        category:    obj.tags || obj.category || '',
        visible:     obj.visible !== '0',
      };
    }).filter(p => p.sku && p.name);
  }

  if (!items.length) { alert('No valid items found.'); return; }
  let added = 0, skipped = 0;
  for (const item of items) {
    const res = await api('POST', '/api/products', { ...item, store_id: state.activeStore.id });
    const d   = await safeJson(res);
    if (res.ok) added++;
    else if (d.error?.includes('SKU')) skipped++;
  }
  await loadProducts(); renderItemsList(); renderGlance();
  setMsg('items-msg', `Import done: ${added} added, ${skipped} skipped (dup SKU).`, 'success');
  setTimeout(() => setMsg('items-msg','',''), 5000);
}

function parseCsvRow(row) {
  const result = []; let cur = ''; let inQ = false;
  for (const ch of row) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result.map(s => s.trim());
}

// ── Product modal ─────────────────────────────────────────────────────────────
function setupProductModal() {
  document.getElementById('btn-new-item').addEventListener('click', openNewProductModal);
  document.getElementById('pm-close').addEventListener('click',  closeProductModal);
  document.getElementById('pm-cancel').addEventListener('click', closeProductModal);
  document.getElementById('product-modal').addEventListener('click', e => {
    if (e.target.id === 'product-modal') closeProductModal();
  });
  document.getElementById('pm-form').addEventListener('submit', saveProduct);

  document.getElementById('pm-img-upload').addEventListener('click', () => {
    state.imgUploadTarget = { type: 'product' };
    document.getElementById('pm-img-input').click();
  });
  document.getElementById('pm-img-input').addEventListener('change', handleImgUpload);
  document.getElementById('pm-img-clear').addEventListener('click', () => {
    document.getElementById('pm-image').value = '';
    renderProductImgPreview('');
  });

  // Collapsible modal sections
  document.querySelectorAll('.modal-section__head').forEach(h => {
    h.addEventListener('click', () => {
      const body = h.nextElementSibling;
      body.style.display = body.style.display === 'none' ? 'flex' : 'none';
    });
  });

  // Badge selector
  document.getElementById('badge-opts').addEventListener('click', e => {
    const btn = e.target.closest('.badge-opt');
    if (!btn) return;
    document.querySelectorAll('.badge-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isCustom = btn.dataset.badge === 'custom';
    const customIn = document.getElementById('pm-badge-custom');
    customIn.style.display = isCustom ? '' : 'none';
  });

  // Variation add
  document.getElementById('btn-add-variation').addEventListener('click', addVariation);
}

function renderProductImgPreview(url) {
  const wrap  = document.getElementById('pm-img-placeholder');
  const clear = document.getElementById('pm-img-clear');
  if (url) {
    if (wrap.tagName !== 'IMG') {
      const img = document.createElement('img');
      img.className = 'img-thumb'; img.id = 'pm-img-placeholder'; img.alt = '';
      wrap.replaceWith(img);
    }
    document.getElementById('pm-img-placeholder').src = url;
    clear.style.display = '';
  } else {
    if (wrap.tagName === 'IMG') {
      const div = document.createElement('div');
      div.className = 'img-placeholder'; div.id = 'pm-img-placeholder'; div.textContent = '🖼';
      wrap.replaceWith(div);
    }
    clear.style.display = 'none';
  }
}

function openNewProductModal() {
  state.editingProduct = null;
  state.variations     = [];
  document.getElementById('pm-title').textContent = 'New item';
  ['pm-sku','pm-name','pm-desc','pm-meta','pm-tags'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pm-price').value    = '';
  document.getElementById('pm-stock').checked  = true;
  document.getElementById('pm-visible').checked = true;
  document.getElementById('pm-image').value    = '';
  document.getElementById('pm-disc-type').value   = 'none';
  document.getElementById('pm-disc-amount').value  = '';
  document.getElementById('pm-badge-custom').value = '';
  document.getElementById('pm-badge-custom').style.display = 'none';
  document.querySelectorAll('.badge-opt').forEach((b,i) => b.classList.toggle('active', i===0));
  renderVariationsList();
  renderProductImgPreview('');
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
  document.getElementById('pm-sku').readOnly = false;
}

window.editProduct = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  state.editingProduct = p;
  state.variations     = [];
  document.getElementById('pm-title').textContent      = 'Edit item';
  document.getElementById('pm-sku').value              = p.sku;
  document.getElementById('pm-name').value             = p.name;
  document.getElementById('pm-desc').value             = p.description || '';
  document.getElementById('pm-price').value            = p.price_cents;
  document.getElementById('pm-stock').checked          = !!p.in_stock;
  document.getElementById('pm-visible').checked        = p.visible !== false;
  document.getElementById('pm-tags').value             = p.category || '';
  document.getElementById('pm-image').value            = p.image || '';
  document.getElementById('pm-meta').value             =
    p.metadata && Object.keys(p.metadata).length ? JSON.stringify(p.metadata, null, 2) : '';

  const meta = p.metadata || {};
  document.getElementById('pm-disc-type').value   = meta.discountType   || 'none';
  document.getElementById('pm-disc-amount').value = meta.discountAmount  || '';
  const badge = meta.badge || '';
  document.querySelectorAll('.badge-opt').forEach(b => {
    const match = b.dataset.badge === badge || (b.dataset.badge === 'custom' && badge && !['','-20%','NEW','FLASH SALE'].includes(badge));
    b.classList.toggle('active', match);
  });
  const customIn = document.getElementById('pm-badge-custom');
  customIn.style.display = badge && !['','-20%','NEW','FLASH SALE'].includes(badge) ? '' : 'none';
  customIn.value = badge && !['','-20%','NEW','FLASH SALE'].includes(badge) ? badge : '';

  const varRe = new RegExp(`^${escapeRegExp(p.sku)}V\\d+$`);
  state.variations = state.products
    .filter(x => varRe.test(x.sku) && x.id !== p.id)
    .map(x => ({ id: x.id, sku: x.sku, name: x.name, price_cents: x.price_cents }));
  renderVariationsList();

  document.getElementById('pm-sku').readOnly = !state.allowEditIds;

  renderProductImgPreview(p.image || '');
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
};

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  state.editingProduct = null;
  state.variations     = [];
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('pm-submit');
  const sku = document.getElementById('pm-sku').value.trim();

  if (/V\d+$/.test(sku) && !state.editingProduct) {
    setMsg('pm-msg', 'Base SKU must not end in V+number (that pattern is reserved for variations).', 'error');
    return;
  }

  const metaRaw = document.getElementById('pm-meta').value.trim();
  let metadata  = {};
  if (metaRaw) {
    try { metadata = JSON.parse(metaRaw); }
    catch { setMsg('pm-msg', 'Metadata must be valid JSON', 'error'); return; }
  }

  const discType   = document.getElementById('pm-disc-type').value;
  const discAmount = parseFloat(document.getElementById('pm-disc-amount').value) || 0;
  const activeOpt  = document.querySelector('.badge-opt.active');
  let badge = activeOpt?.dataset.badge || '';
  if (badge === 'custom') badge = document.getElementById('pm-badge-custom').value.trim();

  if (discType !== 'none') { metadata.discountType = discType; metadata.discountAmount = discAmount; }
  else { delete metadata.discountType; delete metadata.discountAmount; }
  if (badge) metadata.badge = badge; else delete metadata.badge;

  const payload = {
    sku,
    name:        document.getElementById('pm-name').value.trim(),
    description: document.getElementById('pm-desc').value.trim(),
    price_cents: parseInt(document.getElementById('pm-price').value, 10),
    in_stock:    document.getElementById('pm-stock').checked,
    visible:     document.getElementById('pm-visible').checked,
    category:    document.getElementById('pm-tags').value.trim(),
    image:       document.getElementById('pm-image').value,
    metadata,
  };

  btn.disabled = true;
  setMsg('pm-msg', '', '');

  const res = state.editingProduct
    ? await api('PUT',  `/api/products/${state.editingProduct.id}`, payload)
    : await api('POST', '/api/products', { ...payload, store_id: state.activeStore.id });

  const data = await safeJson(res);
  if (res.ok) {
    for (const v of state.variations) {
      if (v._new) {
        await api('POST', '/api/products', {
          store_id: state.activeStore.id,
          sku: v.sku, name: v.name,
          price_cents: v.price_cents, in_stock: true, visible: true, metadata: {},
        });
      }
    }
    closeProductModal();
    await loadProducts();
    renderItemsList();
    renderGlance();
    schedulePreviewSave();
  } else {
    setMsg('pm-msg', data.error || 'Failed to save item', 'error');
    btn.disabled = false;
  }
}

// Variations
function addVariation() {
  const baseSku = document.getElementById('pm-sku').value.trim();
  if (!baseSku) { alert('Set the base SKU first.'); return; }
  const n   = state.variations.length + 1;
  const sku = `${baseSku}V${n}`;
  state.variations.push({ _new: true, sku, name: `${document.getElementById('pm-name').value} V${n}`, price_cents: 0 });
  renderVariationsList();
}

function renderVariationsList() {
  const list = document.getElementById('pm-vars-list');
  if (!list) return;
  list.innerHTML = state.variations.map((v, i) => `
    <div class="var-row">
      <input type="text" value="${esc(v.name)}" placeholder="Name"
        onchange="updateVariation(${i},'name',this.value)" />
      <input type="number" value="${(v.price_cents/100).toFixed(2)}" placeholder="Price $" min="0" step="0.01"
        onchange="updateVariation(${i},'price_cents',Math.round(parseFloat(this.value||0)*100))" style="width:90px" />
      <span style="font-family:var(--mono);font-size:9px;color:var(--fg-faint)">${esc(v.sku)}</span>
      ${v._new ? `<button type="button" class="var-row__del" onclick="removeVariation(${i})">✕</button>` : ''}
    </div>`).join('') || '<p style="font-size:11px;color:var(--fg-faint);margin:0">No variations.</p>';
}

window.updateVariation = function(i, key, val) { state.variations[i][key] = val; };
window.removeVariation  = function(i) { state.variations.splice(i, 1); renderVariationsList(); };

window.deleteProduct = async function(productId) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  const res = await api('DELETE', `/api/products/${productId}`);
  if (res.ok) {
    await loadProducts();
    renderItemsList();
    renderGlance();
    schedulePreviewSave();
  } else {
    setMsg('items-msg', 'Failed to delete', 'error');
  }
};

// ── Config tab ────────────────────────────────────────────────────────────────
function setupConfigTab() {
  // Language
  document.getElementById('cfg-lang').addEventListener('change', e => {
    dashConfig.lang = e.target.value;
    saveDashConfig();
    applyTranslations();
  });

  // Panel size
  document.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-size]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dashConfig.size = btn.dataset.size;
      saveDashConfig();
      applyDashSize(dashConfig.size);
    });
  });

  // Preview mode
  document.querySelectorAll('[data-preview]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-preview]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dashConfig.preview = btn.dataset.preview;
      saveDashConfig();
      setPreviewMode(dashConfig.preview);
    });
  });

  // Auto-refresh toggle
  document.getElementById('cfg-auto-refresh').addEventListener('change', e => {
    dashConfig.autoRefresh = e.target.checked;
    saveDashConfig();
  });

  // Feature toggles (store features — countdown, newsletter, inventory)
  document.querySelectorAll('.tweak-feat').forEach(cb => {
    cb.addEventListener('change', () => {
      ensureObj('features');
      state.draft.features[cb.dataset.feature] = cb.checked;
      markDirty();
    });
  });

  // Newsletter fields
  const nlSave = () => {
    ensureObj('features');
    state.draft.features.newsletterTitle = document.getElementById('nl-title').value;
    state.draft.features.newsletterText  = document.getElementById('nl-text').value;
    state.draft.features.newsletterImage = document.getElementById('nl-image').value;
    markDirty();
  };
  ['nl-title','nl-text','nl-image'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', nlSave);
  });

  // Countdown fields
  const cdSave = () => {
    ensureObj('features');
    state.draft.features.countdownEnd      = document.getElementById('cd-end').value;
    state.draft.features.countdownCategory = document.getElementById('cd-cat').value;
    markDirty();
  };
  ['cd-end','cd-cat'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', cdSave);
  });

  // Out of stock
  document.getElementById('oos-mode').addEventListener('change', e => {
    ensureObj('features');
    state.draft.features.oosMode = e.target.value;
    markDirty();
  });
  document.getElementById('stock-public').addEventListener('change', e => {
    ensureObj('features');
    state.draft.features.stockPublic = e.target.checked;
    markDirty();
  });

  // Edit IDs toggle
  document.getElementById('tweak-allow-ids').addEventListener('change', e => {
    state.allowEditIds = e.target.checked;
  });

  // Start all over
  document.getElementById('btn-start-over').addEventListener('click', async () => {
    const input = document.getElementById('reset-confirm-input').value.trim();
    if (input !== 'RESET') { alert('Type RESET to confirm.'); return; }
    if (!confirm('This will wipe all sections and config on the live store. Are you absolutely sure?')) return;
    const empty = { sections: [], features: {}, theme: {}, seo: {} };
    await api('PUT', `/api/stores/${state.activeStore.id}`, { name: state.activeStore.name, config: empty });
    state.draft = deepClone(empty);
    state.history = []; state.future = [];
    state.isDirty = false;
    localStorage.removeItem(`draft_${state.activeStore.id}`);
    renderDesignTab(); renderSectionList(); closeSectionEditor();
    schedulePreviewSave(); updateDirty(false); updateUndoRedoBtns();
    document.getElementById('reset-confirm-input').value = '';
    document.getElementById('tmpl-overlay').classList.add('active');
  });
}

function renderConfigTab() {
  const f = state.draft.features || {};
  document.getElementById('cfg-lang').value       = dashConfig.lang || 'en';
  document.getElementById('cfg-auto-refresh').checked = dashConfig.autoRefresh !== false;
  document.getElementById('oos-mode').value       = f.oosMode || 'show';
  document.getElementById('stock-public').checked = !!f.stockPublic;
  document.getElementById('nl-title').value       = f.newsletterTitle || '';
  document.getElementById('nl-text').value        = f.newsletterText  || '';
  document.getElementById('nl-image').value       = f.newsletterImage || '';
  if (f.countdownEnd) {
    try { document.getElementById('cd-end').value = new Date(f.countdownEnd).toISOString().slice(0,16); } catch {}
  }
  document.getElementById('cd-cat').value = f.countdownCategory || '';

  // Feature toggles
  document.querySelectorAll('.tweak-feat').forEach(cb => {
    cb.checked = !!(f[cb.dataset.feature]);
  });

  // Segment controls
  document.querySelectorAll('[data-size]').forEach(b =>
    b.classList.toggle('active', b.dataset.size === (dashConfig.size || 'medium')));
  document.querySelectorAll('[data-preview]').forEach(b =>
    b.classList.toggle('active', b.dataset.preview === (dashConfig.preview || 'desktop')));

  renderDashStyleGrid();
  setPreviewMode(dashConfig.preview || 'desktop');
}

function applyDashSize(size) {
  const w = PANEL_SIZES[size] || PANEL_SIZES.medium;
  document.documentElement.style.setProperty('--panel-w', w);
}

function applyTranslations() {
  const setT = (id, key) => { const e = document.getElementById(id); if (e) e.textContent = t(key); };
  setT('btn-save-draft', 'saveDraft');
  setT('btn-discard',    'discard');
  setT('btn-new-item',   'newItem');
  setT('btn-push-live',  'pushLive');
  document.querySelectorAll('.etab').forEach(tab => {
    const key = tab.dataset.tab;
    if (I18N.en[key]) tab.textContent = t(key);
  });
}

// ── Template gallery ──────────────────────────────────────────────────────────
function setupTemplateGallery() {
  document.getElementById('tmpl-close').addEventListener('click', () => {
    document.getElementById('tmpl-overlay').classList.remove('active');
  });
  document.getElementById('tmpl-overlay').addEventListener('click', e => {
    if (e.target.id === 'tmpl-overlay') document.getElementById('tmpl-overlay').classList.remove('active');
  });

  document.getElementById('tmpl-grid').innerHTML = TEMPLATES.map(tmpl => `
    <div class="gallery-card" onclick="applyTemplate('${esc(tmpl.id)}')">
      <div class="gallery-card__icon">${esc(tmpl.icon)}</div>
      <div class="gallery-card__name">${esc(tmpl.name)}</div>
      <div class="gallery-card__desc">${esc(tmpl.desc)}</div>
    </div>`).join('');
}

window.applyTemplate = function(id) {
  const tmpl = TEMPLATES.find(t => t.id === id);
  if (!tmpl) return;
  if (!confirm(`Apply the "${tmpl.name}" template? This replaces your current sections.`)) return;
  pushUndo();
  state.draft.sections = tmpl.sections();
  state.editingSection = null;
  renderSectionList();
  closeSectionEditor();
  markDirty();
  document.getElementById('tmpl-overlay').classList.remove('active');
};

// ── Screen navigation ─────────────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  window.scrollTo(0, 0);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

async function api(method, path, body) {
  const opts = { method, headers: {} };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  return fetch(path, opts);
}

function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = `status-msg ${type}`;
}

function setSelectVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function ensureObj(path) {
  const parts = path.split('.');
  let cur = state.draft;
  for (const p of parts) {
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
}

function setNestedField(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] === undefined || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function flash(btnId, text, ms = 1800) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = text;
  setTimeout(() => { btn.textContent = orig; }, ms);
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
