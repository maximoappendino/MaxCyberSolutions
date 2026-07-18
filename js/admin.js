/* js/admin.js — MaxCyberSolutions Admin Panel */

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

async function api(method, path, body) {
  const opts = { method, headers: {}, credentials: 'include' };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  return fetch(path, opts);
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtBytes(b) {
  if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
  if (b >= 1024)    return (b / 1024).toFixed(0) + ' KB';
  return b + ' B';
}

function statusBadge(status) {
  const map = {
    active:   { label: 'Active',   cls: 'status--active'   },
    paused:   { label: 'Paused',   cls: 'status--paused'   },
    archived: { label: 'Archived', cls: 'status--archived' },
  };
  const s = map[status] || map.active;
  return `<span class="status-badge ${s.cls}">${s.label}</span>`;
}

// ── State ──────────────────────────────────────────────────────────────────
const state = { me: null, clients: [], selected: null };

// ── Boot ───────────────────────────────────────────────────────────────────
async function boot() {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (!res.ok) { window.location.replace('/dashboard/'); return; }

  state.me = await safeJson(res);
  if (!state.me.is_admin) { window.location.replace('/dashboard/'); return; }

  document.getElementById('admin-email').textContent = state.me.email;
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('client-search').addEventListener('input', renderSidebar);

  await loadClients();
}

async function logout() {
  await api('POST', '/api/auth/logout');
  window.location.replace('/dashboard/');
}

async function loadClients() {
  const res = await api('GET', '/api/admin/owners');
  if (!res.ok) return;
  state.clients = await safeJson(res);
  renderSidebar();
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function renderSidebar() {
  const q    = (document.getElementById('client-search').value || '').toLowerCase();
  const list = document.getElementById('client-list');

  let clients = state.clients;
  if (q) clients = clients.filter(c =>
    (c.email + ' ' + c.name + ' ' + c.brand).toLowerCase().includes(q));

  if (!clients.length) {
    list.innerHTML = '<div class="empty-msg">No clients found</div>';
    return;
  }

  list.innerHTML = clients.map(c => {
    const initial     = (c.name || c.email || '?').charAt(0).toUpperCase();
    const productPct  = Math.min(100, Math.round((c.product_count ?? 0) / Math.max(1, c.product_limit || 50) * 100));
    const storagePct  = Math.min(100, Math.round((c.storage_used_bytes ?? 0) / Math.max(1, (c.storage_limit_mb || 100) * 1048576) * 100));
    const active      = state.selected?.id === c.id ? ' active' : '';
    const adminBadge  = c.is_admin ? '<span class="badge badge--admin">Admin</span>' : '';
    return `
    <div class="client-card${active}" onclick="selectClient('${esc(c.id)}')">
      <div class="client-avatar">${esc(initial)}</div>
      <div class="client-info">
        <div class="client-name">${esc(c.name || c.email)}${adminBadge}</div>
        <div class="client-sub">${statusBadge(c.status)} ${esc(c.email)} &middot; <span class="plan-tag">${esc(c.plan || 'basic')}</span></div>
        <div class="mini-bars">
          <div class="mini-bar" title="Products: ${c.product_count ?? 0}/${c.product_limit}">
            <div class="mini-bar__fill${productPct > 90 ? ' warn' : ''}" style="width:${productPct}%"></div>
          </div>
          <div class="mini-bar" title="Storage: ${fmtBytes(c.storage_used_bytes ?? 0)} / ${c.storage_limit_mb} MB">
            <div class="mini-bar__fill${storagePct > 90 ? ' warn' : ''}" style="width:${storagePct}%"></div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Client detail ───────────────────────────────────────────────────────────
window.selectClient = async function(id) {
  const res = await api('GET', `/api/admin/owners/${id}`);
  if (!res.ok) return;
  state.selected = await safeJson(res);
  renderDetail();
  renderSidebar();
};

function renderDetail() {
  const c = state.selected;
  if (!c) return;

  const productPct = Math.min(100, Math.round((c.product_count ?? 0) / Math.max(1, c.product_limit || 50) * 100));
  const storagePct = Math.min(100, Math.round((c.storage_used_bytes ?? 0) / Math.max(1, (c.storage_limit_mb || 100) * 1048576) * 100));
  const joined     = new Date(c.created_at).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });

  document.getElementById('admin-detail').innerHTML = `
  <div class="detail-inner">

    <div class="detail-topbar">
      <div class="detail-identity">
        <div class="detail-avatar">${(c.name || c.email || '?').charAt(0).toUpperCase()}</div>
        <div>
          <div class="detail-heading">${esc(c.name || '—')}</div>
          <div class="detail-sub">${esc(c.email)} &middot; joined ${joined}</div>
        </div>
      </div>
      <button class="btn-solid" onclick="saveClient()">Save</button>
    </div>

    <div id="detail-msg" style="display:none" class="detail-msg"></div>

    ${!c.is_admin ? `
    <div class="dsection">
      <div class="dsection__title">Account Status</div>
      <div class="status-control">
        <div class="status-current">${statusBadge(c.status || 'active')}</div>
        <div class="status-actions">
          ${(c.status || 'active') !== 'active' ? `
            <button class="btn-status btn-status--resume" onclick="setClientStatus('${esc(c.id)}', 'active')">▶ Resume</button>
          ` : `
            <button class="btn-status btn-status--pause" onclick="setClientStatus('${esc(c.id)}', 'paused')">⏸ Pause</button>
          `}
          ${(c.status || 'active') === 'paused' ? `
            <button class="btn-status btn-status--archive" onclick="archiveClient('${esc(c.id)}', '${esc(c.email)}')">◫ Archive &amp; free storage</button>
          ` : ''}
        </div>
      </div>
      ${(c.status || 'active') === 'paused' ? '<p class="status-note">Client storefront is blocked. New uploads are disabled. Their data is safe.</p>' : ''}
      ${(c.status || 'active') === 'archived' ? '<p class="status-note">Storefront blocked. All images were deleted to free storage. Product data is intact — images must be re-uploaded on resume.</p>' : ''}
    </div>` : ''}

    <div class="dsection">
      <div class="dsection__title">Identity</div>
      <div class="dfield-grid">
        <div class="dfield">
          <label>Full name</label>
          <input id="d-name" value="${esc(c.name)}" placeholder="John Doe"/>
        </div>
        <div class="dfield">
          <label>Business brand</label>
          <input id="d-brand" value="${esc(c.brand)}" placeholder="My Brand"/>
        </div>
        <div class="dfield">
          <label>Category</label>
          <input id="d-category" value="${esc(c.category)}" placeholder="Fashion, Food, Art…"/>
        </div>
      </div>
    </div>

    <div class="dsection">
      <div class="dsection__title">Contact</div>
      <div class="dfield-grid">
        <div class="dfield">
          <label>Phone</label>
          <input id="d-phone" value="${esc(c.phone)}" placeholder="+1 555 000 0000"/>
        </div>
        <div class="dfield dfield--full">
          <label>Physical address</label>
          <input id="d-address" value="${esc(c.address)}" placeholder="Street, City, Country"/>
        </div>
      </div>
    </div>

    <div class="dsection">
      <div class="dsection__title">Plan &amp; Limits</div>
      <div class="dfield-grid">
        <div class="dfield">
          <label>Plan name</label>
          <input id="d-plan" value="${esc(c.plan)}" placeholder="basic"/>
        </div>
        <div class="dfield">
          <label>Max products</label>
          <input id="d-product-limit" type="number" min="0" value="${c.product_limit}"/>
        </div>
        <div class="dfield">
          <label>Storage limit (MB)</label>
          <input id="d-storage-limit" type="number" min="0" value="${c.storage_limit_mb}"/>
        </div>
      </div>
      <div class="usage-rows">
        <div class="usage-row">
          <span class="usage-lbl">Products</span>
          <div class="usage-bar"><div class="usage-bar__fill${productPct > 90 ? ' warn' : ''}" style="width:${productPct}%"></div></div>
          <span class="usage-val">${c.product_count ?? 0} / ${c.product_limit}</span>
        </div>
        <div class="usage-row">
          <span class="usage-lbl">Storage</span>
          <div class="usage-bar"><div class="usage-bar__fill${storagePct > 90 ? ' warn' : ''}" style="width:${storagePct}%"></div></div>
          <span class="usage-val">${fmtBytes(c.storage_used_bytes ?? 0)} / ${c.storage_limit_mb} MB</span>
        </div>
      </div>
    </div>

    <div class="dsection">
      <div class="dsection__title">Payment</div>
      <div class="dfield-grid">
        <div class="dfield">
          <label>Method</label>
          <input id="d-payment-method" value="${esc(c.payment_method)}" placeholder="Cash, Bank transfer, Stripe…"/>
        </div>
        <div class="dfield dfield--full">
          <label>Notes</label>
          <input id="d-payment-notes" value="${esc(c.payment_notes)}" placeholder="Last payment, agreements…"/>
        </div>
      </div>
    </div>

    <div class="dsection">
      <div class="dsection__title">Notes</div>
      <div class="dfield">
        <textarea id="d-description" rows="4" placeholder="Any notes about this client…">${esc(c.description)}</textarea>
      </div>
    </div>

    <div class="dsection">
      <div class="dsection__title">Websites (${(c.stores || []).length})</div>
      ${(c.stores || []).length === 0
        ? '<div class="empty-msg">No stores yet</div>'
        : (c.stores || []).map(s => `
        <div class="store-row">
          <span class="store-slug">/${esc(s.slug)}</span>
          <span class="store-name">${esc(s.name || s.slug)}</span>
          <a class="store-link" href="/${esc(s.slug)}" target="_blank" rel="noopener">↗</a>
        </div>`).join('')
      }
    </div>

    ${!c.is_admin ? `
    <div class="dsection dsection--danger">
      <div class="dsection__title">Danger zone</div>
      <p class="danger-note">Deleting this account will remove all their stores, products, and uploaded images. This cannot be undone.</p>
      <button class="btn-danger" onclick="deleteClient('${esc(c.id)}', '${esc(c.email)}')">Delete account</button>
    </div>` : ''}

  </div>`;
}

window.setClientStatus = async function(id, newStatus) {
  const label = newStatus === 'active' ? 'resume' : 'pause';
  if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} this account?`)) return;

  const res  = await api('PUT', `/api/admin/owners/${id}`, { status: newStatus });
  const data = await safeJson(res);

  if (!res.ok) { flashDetailMsg(data.error || 'Failed', 'err'); return; }

  if (state.selected?.id === id) state.selected.status = newStatus;
  const listItem = state.clients.find(c => c.id === id);
  if (listItem) listItem.status = newStatus;

  if (state.selected?.id === id) renderDetail();
  renderSidebar();
};

window.archiveClient = async function(id, email) {
  if (!confirm(`Archive "${email}"?\n\nThis will DELETE all their uploaded images to free storage space. Their product data (names, prices, descriptions) will be kept. They can resume later but will need to re-upload images.\n\nThis cannot be undone.`)) return;

  const res  = await api('POST', `/api/admin/owners/${id}/archive`);
  const data = await safeJson(res);

  if (!res.ok) { flashDetailMsg(data.error || 'Archive failed', 'err'); return; }

  if (state.selected?.id === id) {
    state.selected.status = 'archived';
    state.selected.storage_used_bytes = 0;
  }
  const listItem = state.clients.find(c => c.id === id);
  if (listItem) { listItem.status = 'archived'; listItem.storage_used_bytes = 0; }

  const freed = data.bytes_freed ?? 0;
  if (state.selected?.id === id) renderDetail();
  renderSidebar();
  flashDetailMsg(`Archived — freed ${fmtBytes(freed)} of storage`, 'ok');
};

window.saveClient = async function() {
  const c = state.selected;
  if (!c) return;

  const btn = document.querySelector('#admin-detail .btn-solid');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  const body = {
    name:             (document.getElementById('d-name')?.value || '').trim(),
    brand:            (document.getElementById('d-brand')?.value || '').trim(),
    category:         (document.getElementById('d-category')?.value || '').trim(),
    plan:             (document.getElementById('d-plan')?.value || '').trim(),
    phone:            (document.getElementById('d-phone')?.value || '').trim(),
    address:          (document.getElementById('d-address')?.value || '').trim(),
    payment_method:   (document.getElementById('d-payment-method')?.value || '').trim(),
    payment_notes:    (document.getElementById('d-payment-notes')?.value || '').trim(),
    description:      (document.getElementById('d-description')?.value || '').trim(),
    product_limit:    Math.max(0, parseInt(document.getElementById('d-product-limit')?.value, 10) || 50),
    storage_limit_mb: Math.max(0, parseInt(document.getElementById('d-storage-limit')?.value, 10) || 100),
  };

  const res  = await api('PUT', `/api/admin/owners/${c.id}`, body);
  const data = await safeJson(res);

  if (res.ok) {
    Object.assign(c, body);
    const listItem = state.clients.find(x => x.id === c.id);
    if (listItem) Object.assign(listItem, body);
    renderSidebar();
    flashDetailMsg('Saved', 'ok');
  } else {
    flashDetailMsg(data.error || 'Save failed', 'err');
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
};

window.deleteClient = async function(id, email) {
  if (!confirm(`Delete account for "${email}"?\n\nThis removes all their stores, products, and images. This cannot be undone.`)) return;

  const res  = await api('DELETE', `/api/admin/owners/${id}`);
  const data = await safeJson(res);

  if (!res.ok) { flashDetailMsg(data.error || 'Delete failed', 'err'); return; }

  state.clients  = state.clients.filter(c => c.id !== id);
  state.selected = null;
  document.getElementById('admin-detail').innerHTML = `<div class="detail-empty">Select a client from the list</div>`;
  renderSidebar();
};

function flashDetailMsg(msg, type) {
  const el = document.getElementById('detail-msg');
  if (!el) return;
  el.textContent  = msg;
  el.className    = `detail-msg detail-msg--${type}`;
  el.style.display = '';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
}

document.addEventListener('DOMContentLoaded', boot);
