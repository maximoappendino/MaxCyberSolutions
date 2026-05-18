/* MaxCyberSolutions — Dashboard SPA
   Manages: auth, stores, products, feature flags
   Communicates entirely with /api/* endpoints.                               */

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  owner:       null,   // { id, email }
  stores:      [],
  activeStore: null,   // full store object (with config parsed)
  products:    [],
  editingProduct: null, // product being edited, or null for new
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupLoginTabs();
  setupLoginForm();
  setupNewStoreForm();
  setupConfigPanel();
  setupProductModal();

  document.getElementById('d-logout').addEventListener('click', logout);
  document.getElementById('detail-back').addEventListener('click', showStoresScreen);
  document.getElementById('btn-new-product').addEventListener('click', openNewProductModal);

  await checkAuth();
});

// ── Auth ──────────────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const res = await api('GET', '/api/me');
    if (res.ok) {
      state.owner = await res.json();
      onAuthenticated();
    } else {
      showScreen('login');
    }
  } catch {
    showScreen('login');
  }
}

function onAuthenticated() {
  document.getElementById('d-bar').style.display = '';
  document.getElementById('d-email').textContent = state.owner.email;
  showStoresScreen();
}

async function logout() {
  await api('POST', '/api/auth/logout');
  state.owner = null;
  document.getElementById('d-bar').style.display = 'none';
  showScreen('login');
}

// ── Login form ────────────────────────────────────────────────────────────────
function setupLoginTabs() {
  const tabs = document.querySelectorAll('.login-tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isRegister = tab.dataset.tab === 'register';
    document.getElementById('login-submit').textContent = isRegister ? 'Create account →' : 'Sign in →';
    document.querySelector('input[autocomplete="current-password"]')
      .setAttribute('autocomplete', isRegister ? 'new-password' : 'current-password');
    setMsg('login-msg', '', '');
  }));
}

function setupLoginForm() {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const isRegister = document.querySelector('.login-tab.active').dataset.tab === 'register';
    const btn = document.getElementById('login-submit');

    btn.disabled = true;
    setMsg('login-msg', '', '');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res  = await api('POST', endpoint, { email, password });
      const data = await safeJson(res);

      if (!res.ok) {
        setMsg('login-msg', data.error || `Server error (${res.status})`, 'error');
        btn.disabled = false;
        return;
      }

      if (isRegister) {
        // Auto-login after successful registration
        const loginRes  = await api('POST', '/api/auth/login', { email, password });
        const loginData = await safeJson(loginRes);
        if (loginRes.ok) {
          state.owner = loginData;
          onAuthenticated();
        } else {
          setMsg('login-msg', 'Account created — please sign in.', 'success');
          document.querySelector('.login-tab[data-tab="signin"]').click();
          btn.disabled = false;
        }
        return;
      }

      state.owner = data;
      onAuthenticated();

    } catch (err) {
      setMsg('login-msg', 'Network error — is the dev server running?', 'error');
      btn.disabled = false;
    }
  });
}

// ── Stores screen ─────────────────────────────────────────────────────────────
async function showStoresScreen() {
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
  grid.innerHTML = state.stores.map(store => `
    <div class="store-card" data-id="${esc(store.id)}">
      <div class="store-card__slug">/store/${esc(store.slug)}</div>
      <div class="store-card__name">${esc(store.name || store.slug)}</div>
      <div class="store-card__meta">${countProducts(store)} product(s)</div>
      <div class="store-card__actions">
        <button class="btn-ghost" onclick="openStore('${esc(store.id)}')">Manage →</button>
        <button class="btn-ghost btn-ghost--danger" onclick="deleteStore('${esc(store.id)}')">Delete</button>
      </div>
    </div>`).join('');
}

function countProducts(store) {
  return store._productCount !== undefined ? store._productCount : '—';
}

// ── New store form ────────────────────────────────────────────────────────────
function setupNewStoreForm() {
  document.getElementById('ns-submit').addEventListener('click', async () => {
    const slug = document.getElementById('ns-slug').value.trim().toLowerCase();
    const name = document.getElementById('ns-name').value.trim();
    const desc = document.getElementById('ns-desc').value.trim();

    if (!slug) { setMsg('ns-msg', 'Slug is required', 'error'); return; }

    setMsg('ns-msg', '', '');
    document.getElementById('ns-submit').disabled = true;

    const res = await api('POST', '/api/stores', {
      slug, name,
      config: { seo: { description: desc } },
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById('ns-slug').value = '';
      document.getElementById('ns-name').value = '';
      document.getElementById('ns-desc').value = '';
      setMsg('ns-msg', `Store "${data.slug}" created!`, 'success');
      await loadStores();
    } else {
      setMsg('ns-msg', data.error || 'Failed to create store', 'error');
    }
    document.getElementById('ns-submit').disabled = false;
  });
}

// ── Store detail screen ───────────────────────────────────────────────────────
window.openStore = async function(storeId) {
  const res = await api('GET', `/api/stores/${storeId}`);
  if (!res.ok) return;
  state.activeStore = await res.json();
  await loadProducts();
  renderStoreDetail();
  showScreen('detail');
};

function renderStoreDetail() {
  const s = state.activeStore;
  const config = s.config || {};

  document.getElementById('detail-name').textContent       = s.name || s.slug;
  document.getElementById('detail-slug-label').textContent = `/store/${s.slug}`;
  document.getElementById('detail-preview').href           = `/store/${s.slug}`;

  // Config panel
  document.getElementById('cfg-name').value   = config.name  || s.name || '';
  document.getElementById('cfg-desc').value   = (config.seo  || {}).description || '';
  document.getElementById('cfg-accent').value = (config.theme || {}).accent || '#e2a14a';
  setMsg('cfg-msg', '', '');

  // Feature flags
  renderFlagsGrid(config.features || {});

  // Products
  renderProductsList();
}

// ── Config panel ──────────────────────────────────────────────────────────────
function setupConfigPanel() {
  document.getElementById('cfg-save').addEventListener('click', async () => {
    const name   = document.getElementById('cfg-name').value.trim();
    const desc   = document.getElementById('cfg-desc').value.trim();
    const accent = document.getElementById('cfg-accent').value;

    setMsg('cfg-msg', '', '');
    document.getElementById('cfg-save').disabled = true;

    const res = await api('PUT', `/api/stores/${state.activeStore.id}`, {
      name,
      config: {
        name,
        seo:   { title: name, description: desc },
        theme: { accent },
      },
    });
    const data = await res.json();

    if (res.ok) {
      state.activeStore = { ...state.activeStore, ...data };
      document.getElementById('detail-name').textContent = data.name || state.activeStore.slug;
      setMsg('cfg-msg', 'Settings saved.', 'success');
    } else {
      setMsg('cfg-msg', data.error || 'Failed to save', 'error');
    }
    document.getElementById('cfg-save').disabled = false;
  });
}

// ── Feature flags ─────────────────────────────────────────────────────────────
const FLAG_DEFS = [
  { key: 'hasDiscountCountdown', label: 'Countdown timer',   desc: 'Show a 24-hour discount countdown on the storefront.' },
  { key: 'hasNewsletterPopup',   label: 'Newsletter popup',  desc: 'Show a newsletter signup modal after 3.5 seconds.' },
  { key: 'hasInventoryTracking', label: 'Inventory tracking', desc: 'Display in-stock / out-of-stock status on products.' },
];

function renderFlagsGrid(features) {
  const grid = document.getElementById('flags-grid');
  grid.innerHTML = FLAG_DEFS.map(f => `
    <div class="flag-card">
      <div class="flag-card__info">
        <span class="flag-card__name">${esc(f.label)}</span>
        <span class="flag-card__desc">${esc(f.desc)}</span>
      </div>
      <label class="toggle" title="${esc(f.label)}">
        <input type="checkbox" data-flag="${esc(f.key)}" ${features[f.key] ? 'checked' : ''} />
        <span class="toggle__track"></span>
        <span class="toggle__thumb"></span>
      </label>
    </div>`).join('');

  grid.querySelectorAll('input[data-flag]').forEach(input => {
    input.addEventListener('change', () => saveFlag(input.dataset.flag, input.checked));
  });
}

async function saveFlag(key, value) {
  const res = await api('PUT', `/api/stores/${state.activeStore.id}`, {
    config: { features: { [key]: value } },
  });
  if (res.ok) {
    const data = await res.json();
    state.activeStore.config = data.config;
  }
}

// ── Products ──────────────────────────────────────────────────────────────────
async function loadProducts() {
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
      <span class="product-row__sku">${esc(p.sku)}</span>
      <span class="product-row__name">${esc(p.name)}</span>
      <span class="product-row__price">$${esc((p.price_cents / 100).toFixed(2))}</span>
      <span class="product-row__stock ${p.in_stock ? 'product-row__stock--yes' : 'product-row__stock--no'}">
        ${p.in_stock ? 'In stock' : 'Out of stock'}
      </span>
      <span class="product-row__actions">
        <button class="product-row__btn" onclick="editProduct('${esc(p.id)}')">Edit</button>
        <button class="product-row__btn product-row__btn--del" onclick="deleteProduct('${esc(p.id)}')">Del</button>
      </span>
    </div>`).join('');
}

// ── Product modal ─────────────────────────────────────────────────────────────
function setupProductModal() {
  document.getElementById('pm-close').addEventListener('click',  closeProductModal);
  document.getElementById('pm-cancel').addEventListener('click', closeProductModal);
  document.getElementById('product-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('product-modal')) closeProductModal();
  });
  document.getElementById('pm-form').addEventListener('submit', saveProduct);
}

function openNewProductModal() {
  state.editingProduct = null;
  document.getElementById('pm-title').textContent = 'New product';
  document.getElementById('pm-sku').value   = '';
  document.getElementById('pm-name').value  = '';
  document.getElementById('pm-desc').value  = '';
  document.getElementById('pm-price').value = '';
  document.getElementById('pm-stock').checked = true;
  document.getElementById('pm-meta').value  = '';
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
}

window.editProduct = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  state.editingProduct = product;
  document.getElementById('pm-title').textContent = 'Edit product';
  document.getElementById('pm-sku').value   = product.sku;
  document.getElementById('pm-name').value  = product.name;
  document.getElementById('pm-desc').value  = product.description || '';
  document.getElementById('pm-price').value = product.price_cents;
  document.getElementById('pm-stock').checked = product.in_stock;
  document.getElementById('pm-meta').value  =
    product.metadata && Object.keys(product.metadata).length
      ? JSON.stringify(product.metadata, null, 2) : '';
  setMsg('pm-msg', '', '');
  document.getElementById('product-modal').classList.add('active');
};

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
  state.editingProduct = null;
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById('pm-submit');

  const metaRaw = document.getElementById('pm-meta').value.trim();
  let metadata = {};
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
    metadata,
  };

  btn.disabled = true;
  setMsg('pm-msg', '', '');

  let res;
  if (state.editingProduct) {
    res = await api('PUT', `/api/products/${state.editingProduct.id}`, payload);
  } else {
    res = await api('POST', '/api/products', { ...payload, store_id: state.activeStore.id });
  }

  const data = await res.json();
  if (res.ok) {
    closeProductModal();
    await loadProducts();
    renderProductsList();
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
  } else {
    setMsg('products-msg', 'Failed to delete product', 'error');
  }
};

// ── Delete store ──────────────────────────────────────────────────────────────
window.deleteStore = async function(storeId) {
  const store = state.stores.find(s => s.id === storeId);
  if (!store) return;
  if (!confirm(`Delete store "${store.slug}"? This removes all its products too.`)) return;
  const res = await api('DELETE', `/api/stores/${storeId}`);
  if (res.ok) await loadStores();
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
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
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
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
