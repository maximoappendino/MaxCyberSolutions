/* MaxCyberSolutions — Dashboard SPA
   Section builder, live preview, local save, push-to-live.               */

// ── Section type definitions ──────────────────────────────────────────────────
const SECTION_TYPES = {
  hero: {
    label: 'Hero Banner', icon: '◈',
    defaults: {
      headline: 'Welcome', subline: '', image: '', overlay: false,
      align: 'left', cta: { label: 'Shop now', url: '#products' },
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

const FLAG_DEFS = [
  { key: 'hasDiscountCountdown', label: 'Countdown timer',    desc: '24-hour promotional countdown bar.' },
  { key: 'hasNewsletterPopup',   label: 'Newsletter popup',   desc: 'Email signup modal after 3.5s.' },
  { key: 'hasInventoryTracking', label: 'Inventory tracking', desc: 'Show in-stock / out-of-stock badges.' },
];

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  owner:           null,
  stores:          [],
  activeStore:     null,
  draft:           null,   // working config
  products:        [],
  editingProduct:  null,
  editingSection:  null,   // index in draft.sections, or null
  isDirty:         false,
  previewTimer:    null,
  imgUploadTarget: null,   // { type:'logo'|'section'|'product', sectionIdx?, field? }
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupLoginTabs();
  setupLoginForm();
  setupNewStoreForm();
  setupEditorTabs();
  setupDesignListeners();
  setupSectionControls();
  setupProductModal();
  setupTopBarActions();

  document.getElementById('d-logout').addEventListener('click', logout);
  await checkAuth();
});

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
        const lr   = await api('POST', '/api/auth/login', { email, password });
        const ld   = await safeJson(lr);
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

  // Load draft from localStorage first; fall back to live config
  const saved = loadLocalDraft(storeId);
  state.draft = saved || deepClone(state.activeStore.config || {});
  if (!Array.isArray(state.draft.sections)) state.draft.sections = [];

  state.isDirty      = !!saved;
  state.editingSection = null;

  await loadProducts();

  showScreen('editor');
  showEditorBar();
  renderDesignTab();
  renderSectionList();
  renderProductsList();
  updateDirty();
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

// ── Top bar: Save / Export / Import / Push ────────────────────────────────────
function setupTopBarActions() {
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
        state.draft = imported;
        if (!Array.isArray(state.draft.sections)) state.draft.sections = [];
        state.isDirty = true;
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
}

function showEditorBar() {
  const sep     = document.getElementById('d-bar-sep');
  const store   = document.getElementById('d-bar-store');
  const actions = document.getElementById('d-bar-actions');
  const push    = document.getElementById('btn-push-live');
  sep.style.display   = '';
  store.textContent   = state.activeStore.name || state.activeStore.slug;
  actions.style.display = '';
  push.style.display    = '';
}

function hideEditorBar() {
  document.getElementById('d-bar-sep').style.display    = 'none';
  document.getElementById('d-bar-store').textContent    = '';
  document.getElementById('d-bar-actions').style.display = 'none';
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
  schedulePreviewSave();
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
  const blob = new Blob([JSON.stringify(state.draft, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `${state.activeStore.slug}-config.json`,
  });
  a.click();
  URL.revokeObjectURL(url);
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
    state.isDirty = false;
    updateDirty(false);
    localStorage.removeItem(`draft_${state.activeStore.id}`);
    btn.textContent = 'Published ✓';
    setTimeout(() => { btn.textContent = '🚀 Push Live'; btn.disabled = false; }, 2500);
  } else {
    alert('Failed to publish. Check the console.');
    btn.textContent = '🚀 Push Live';
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
  updatePreview();
}

function updatePreview() {
  const iframe = document.getElementById('preview-iframe');
  const slug   = state.activeStore?.slug;
  if (!slug) return;
  iframe.src = `/store/${slug}?preview=1&t=${Date.now()}`;
}

// ── Design tab ────────────────────────────────────────────────────────────────
function renderDesignTab() {
  const d = state.draft;
  const theme    = d.theme    || {};
  const seo      = d.seo      || {};
  const features = d.features || {};

  document.getElementById('d-name').value      = d.name  || '';
  document.getElementById('d-seo-title').value = seo.title       || '';
  document.getElementById('d-seo-desc').value  = seo.description || '';
  document.getElementById('d-accent').value    = theme.accent    || '#e2a14a';

  // Logo
  renderLogoPicker(d.logo || '');

  // Feature flags
  document.getElementById('flags-list').innerHTML = FLAG_DEFS.map(f => `
    <div class="flag-row">
      <div class="flag-row__info">
        <span class="flag-row__name">${esc(f.label)}</span>
        <span class="flag-row__desc">${esc(f.desc)}</span>
      </div>
      <label class="toggle">
        <input type="checkbox" data-flag="${esc(f.key)}" ${features[f.key] ? 'checked' : ''} />
        <span class="toggle__track"></span>
        <span class="toggle__thumb"></span>
      </label>
    </div>`).join('');

  document.querySelectorAll('[data-flag]').forEach(el => {
    el.addEventListener('change', () => {
      if (!state.draft.features) state.draft.features = {};
      state.draft.features[el.dataset.flag] = el.checked;
      markDirty();
    });
  });
}

function setupDesignListeners() {
  const watch = (id, setter) => {
    document.getElementById(id)?.addEventListener('input', e => { setter(e.target.value); markDirty(); });
  };
  watch('d-name',      v => { state.draft.name = v; if (!state.draft.seo) state.draft.seo = {}; state.draft.seo.title = state.draft.seo.title || v; });
  watch('d-seo-title', v => { if (!state.draft.seo) state.draft.seo = {}; state.draft.seo.title = v; });
  watch('d-seo-desc',  v => { if (!state.draft.seo) state.draft.seo = {}; state.draft.seo.description = v; });
  watch('d-accent',    v => { if (!state.draft.theme) state.draft.theme = {}; state.draft.theme.accent = v; });

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
}

function renderLogoPicker(url) {
  const wrap = document.getElementById('logo-preview-wrap');
  const clear = document.getElementById('btn-logo-clear');
  if (url) {
    wrap.innerHTML = `<img src="${esc(url)}" alt="Logo" class="logo-thumb" />`;
    clear.style.display = '';
  } else {
    wrap.innerHTML = `<div class="logo-placeholder">☰</div>`;
    clear.style.display = 'none';
  }
}

// ── Section list ──────────────────────────────────────────────────────────────
function renderSectionList() {
  const list    = document.getElementById('sec-list');
  const sections = state.draft.sections || [];

  if (!sections.length) {
    list.innerHTML = '<p style="padding:16px;font-size:12px;color:var(--fg-faint)">No sections yet. Add one below.</p>';
    return;
  }

  list.innerHTML = sections.map((s, i) => {
    const def = SECTION_TYPES[s.type] || { label: s.type, icon: '?' };
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

  // Add section type menu
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
  const section = { id: uid(), type, ...deepClone(def.defaults) };
  state.draft.sections.push(section);
  state.editingSection = state.draft.sections.length - 1;
  renderSectionList();
  openSectionEditor(state.editingSection);
  markDirty();
};

window.removeSection = function(i) {
  if (!confirm('Remove this section?')) return;
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

  document.getElementById('sec-editor').style.display = '';
  document.getElementById('sec-editor-title').textContent = def.label || section.type;
  document.getElementById('sec-editor-fields').innerHTML  = buildSectionFields(section, i);

  bindSectionFields(i);
}

function closeSectionEditor() {
  state.editingSection = null;
  document.getElementById('sec-editor').style.display = 'none';
  renderSectionList();
}

function buildSectionFields(s, i) {
  switch (s.type) {
    case 'hero': return [
      field('text',   'Headline',           'headline', esc(s.headline || '')),
      field('text',   'Subline',            'subline',  esc(s.subline  || '')),
      fieldImg('Background image', 'image', s.image, i),
      fieldToggle('Dark overlay', 'overlay', s.overlay),
      fieldSelect('Alignment', 'align', s.align || 'left', ['left','center','right']),
      fieldGroup('CTA Button', [
        field('text', 'Button label', 'cta.label', esc((s.cta||{}).label || '')),
        field('text', 'Button URL',   'cta.url',   esc((s.cta||{}).url   || '')),
      ]),
    ].join('');

    case 'product-grid': return [
      field('text',   'Section title', 'title',          esc(s.title   || '')),
      field('text',   'Tag label',     'tag',             esc(s.tag     || '')),
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
      <img src="${esc(img.url)}" class="gallery-thumb" />
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

// Bind change events for section editor fields
function bindSectionFields(i) {
  const container = document.getElementById('sec-editor-fields');

  container.querySelectorAll('input[data-field], select[data-field], textarea[data-field]').forEach(el => {
    const event = el.type === 'color' ? 'input' : 'change';
    el.addEventListener(event, () => {
      const path  = el.dataset.field;
      const value = el.type === 'checkbox' ? el.checked : el.value;
      setNestedField(state.draft.sections[i], path, value);
      markDirty();
    });
    // Also bind input for text fields so preview updates while typing
    if (el.tagName === 'INPUT' && el.type === 'text' || el.tagName === 'TEXTAREA') {
      el.addEventListener('input', () => {
        setNestedField(state.draft.sections[i], el.dataset.field, el.value);
        markDirty();
      });
    }
  });
}

// ── Gallery image actions ──────────────────────────────────────────────────────
window.triggerGalleryImgAdd = function(sectionIdx) {
  state.imgUploadTarget = { type: 'gallery', sectionIdx };
  document.getElementById('img-upload-input').click();
};

window.removeGalleryImg = function(sectionIdx, imgIdx) {
  state.draft.sections[sectionIdx].images.splice(imgIdx, 1);
  openSectionEditor(sectionIdx);
  markDirty();
};

// ── Section image upload ───────────────────────────────────────────────────────
window.triggerSecImgUpload = function(sectionIdx, field) {
  state.imgUploadTarget = { type: 'section', sectionIdx, field };
  document.getElementById('img-upload-input').click();
};

window.clearSecImg = function(sectionIdx, fieldPath) {
  setNestedField(state.draft.sections[sectionIdx], fieldPath, '');
  openSectionEditor(sectionIdx);
  markDirty();
};

// ── Image upload handler (shared) ─────────────────────────────────────────────
async function handleImgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = '';

  const target = state.imgUploadTarget;
  if (!target) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('store_id', state.activeStore.id);

  const btn = document.querySelector('[onclick*="triggerSecImgUpload"]') || document.getElementById('btn-logo-upload');
  const origText = btn?.textContent;
  if (btn) { btn.textContent = 'Uploading…'; btn.disabled = true; }

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
    } else if (target.type === 'product') {
      document.getElementById('pm-image').value = url;
      renderProductImgPreview(url);
    }
  } finally {
    if (btn) { btn.textContent = origText; btn.disabled = false; }
    state.imgUploadTarget = null;
  }
}

// ── Products ──────────────────────────────────────────────────────────────────
async function loadProducts() {
  if (!state.activeStore) return;
  const res = await api('GET', `/api/products?store_id=${state.activeStore.id}`);
  if (!res.ok) return;
  state.products = await res.json();
}

function renderProductsList() {
  const list = document.getElementById('products-list');
  if (!state.products.length) {
    list.innerHTML = '<p class="empty-msg">No products yet.</p>';
    return;
  }
  list.innerHTML = state.products.map(p => `
    <div class="product-row">
      ${p.image
        ? `<img src="${esc(p.image)}" class="product-row__thumb" alt="" />`
        : `<div class="product-row__thumb" style="background:var(--line-soft)"></div>`}
      <span class="product-row__name" title="${esc(p.name)}">${esc(p.name)}</span>
      <span class="product-row__price">$${esc((p.price_cents/100).toFixed(2))}</span>
      <span class="product-row__btns">
        <button class="product-row__btn" onclick="editProduct('${esc(p.id)}')">✏</button>
        <button class="product-row__btn product-row__btn--del" onclick="deleteProduct('${esc(p.id)}')">✕</button>
      </span>
    </div>`).join('');
}

function setupProductModal() {
  document.getElementById('btn-new-product').addEventListener('click', openNewProductModal);
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
}

function renderProductImgPreview(url) {
  const wrap  = document.getElementById('pm-img-placeholder');
  const clear = document.getElementById('pm-img-clear');
  if (url) {
    wrap.outerHTML = `<img src="${esc(url)}" class="img-thumb" id="pm-img-placeholder" alt="" />`;
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
  document.getElementById('pm-title').textContent = 'New product';
  ['pm-sku','pm-name','pm-desc','pm-meta'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pm-price').value   = '';
  document.getElementById('pm-stock').checked = true;
  document.getElementById('pm-image').value   = '';
  renderProductImgPreview('');
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
}

window.editProduct = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  state.editingProduct = p;
  document.getElementById('pm-title').textContent = 'Edit product';
  document.getElementById('pm-sku').value         = p.sku;
  document.getElementById('pm-name').value        = p.name;
  document.getElementById('pm-desc').value        = p.description || '';
  document.getElementById('pm-price').value       = p.price_cents;
  document.getElementById('pm-stock').checked     = !!p.in_stock;
  document.getElementById('pm-image').value       = p.image || '';
  document.getElementById('pm-meta').value        =
    p.metadata && Object.keys(p.metadata).length ? JSON.stringify(p.metadata, null, 2) : '';
  renderProductImgPreview(p.image || '');
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
};

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  state.editingProduct = null;
}

async function saveProduct(e) {
  e.preventDefault();
  const btn     = document.getElementById('pm-submit');
  const metaRaw = document.getElementById('pm-meta').value.trim();
  let metadata  = {};
  if (metaRaw) {
    try { metadata = JSON.parse(metaRaw); }
    catch { setMsg('pm-msg', 'Metadata must be valid JSON', 'error'); return; }
  }
  const payload = {
    sku:         document.getElementById('pm-sku').value.trim(),
    name:        document.getElementById('pm-name').value.trim(),
    description: document.getElementById('pm-desc').value.trim(),
    price_cents: parseInt(document.getElementById('pm-price').value, 10),
    in_stock:    document.getElementById('pm-stock').checked,
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
    closeProductModal();
    await loadProducts();
    renderProductsList();
    schedulePreviewSave();
  } else {
    setMsg('pm-msg', data.error || 'Failed to save product', 'error');
    btn.disabled = false;
  }
}

window.deleteProduct = async function(productId) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  const res = await api('DELETE', `/api/products/${productId}`);
  if (res.ok) {
    await loadProducts();
    renderProductsList();
    schedulePreviewSave();
  } else {
    setMsg('products-msg', 'Failed to delete', 'error');
  }
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
  el.className = `status-msg ${type}`;
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Set a nested field by dot path, e.g. "cta.label" or "images[0].caption"
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
