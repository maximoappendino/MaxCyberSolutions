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
    frozen:   { label: 'Frozen',   cls: 'status--frozen'   },
    archived: { label: 'Archived', cls: 'status--archived' },
  };
  const s = map[status] || map.active;
  return `<span class="status-badge ${s.cls}">${s.label}</span>`;
}

// ── State ──────────────────────────────────────────────────────────────────
const state = { me: null, clients: [], selected: null, transferStoreId: null };

// ── Boot ───────────────────────────────────────────────────────────────────
async function boot() {
  const res = await fetch('/api/me', { credentials: 'include' });
  if (!res.ok) { window.location.replace('/dashboard/'); return; }

  state.me = await safeJson(res);
  if (!state.me.is_admin) { window.location.replace('/dashboard/'); return; }

  document.getElementById('admin-email').textContent = state.me.email;
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('client-search').addEventListener('input', renderSidebar);
  document.getElementById('btn-new-client').addEventListener('click', () => openModal('new-client-modal'));

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
  loadCollaborators(id);
};

function getWeekKey(d) {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayNum = Math.round((d - jan4) / 86400000);
  const weekNum = Math.ceil((dayNum + jan4.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function renderDetail() {
  const c = state.selected;
  if (!c) return;

  const productPct = Math.min(100, Math.round((c.product_count ?? 0) / Math.max(1, c.product_limit || 50) * 100));
  const storagePct = Math.min(100, Math.round((c.storage_used_bytes ?? 0) / Math.max(1, (c.storage_limit_mb || 100) * 1048576) * 100));
  const joined     = new Date(c.created_at).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });

  const today = new Date().toISOString().slice(0, 10);
  const week  = getWeekKey(new Date());
  const dailyUsed  = c.push_daily_reset  === today ? (c.push_daily_used  ?? 0) : 0;
  const weeklyUsed = c.push_weekly_reset === week  ? (c.push_weekly_used ?? 0) : 0;

  const st = c.status || 'active';

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
        <div class="status-current">${statusBadge(st)}</div>
        <div class="status-actions">
          ${st !== 'active' ? `
            <button class="btn-status btn-status--resume" onclick="setClientStatus('${esc(c.id)}', 'active')">▶ Resume</button>
          ` : `
            <button class="btn-status btn-status--pause" onclick="setClientStatus('${esc(c.id)}', 'paused')">⏸ Pause dashboard</button>
            <button class="btn-status btn-status--freeze" onclick="setClientStatus('${esc(c.id)}', 'frozen')">❄ Freeze website</button>
          `}
          ${st === 'paused' ? `
            <button class="btn-status btn-status--freeze" onclick="setClientStatus('${esc(c.id)}', 'frozen')">❄ Freeze website</button>
            <button class="btn-status btn-status--archive" onclick="archiveClient('${esc(c.id)}', '${esc(c.email)}')">◫ Archive &amp; free storage</button>
          ` : ''}
          ${st === 'frozen' ? `
            <button class="btn-status btn-status--pause" onclick="setClientStatus('${esc(c.id)}', 'paused')">⏸ Pause dashboard</button>
          ` : ''}
        </div>
      </div>
      ${st === 'paused'   ? '<p class="status-note">Dashboard locked — client cannot sign in. Their website is still live for visitors.</p>' : ''}
      ${st === 'frozen'   ? '<p class="status-note">Website frozen — visitors see a frozen page. Client can still sign into their dashboard.</p>' : ''}
      ${st === 'archived' ? '<p class="status-note">Storefront blocked. All images were deleted to free storage. Product data is intact — images must be re-uploaded on resume.</p>' : ''}
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
      <div class="dsection__title">Publish Limits</div>
      <div class="push-grid">
        <div class="dfield">
          <label>Daily limit</label>
          <input id="d-push-daily-limit" type="number" min="0" value="${c.push_daily_limit ?? 10}"/>
        </div>
        <div class="dfield">
          <label>Weekly limit</label>
          <input id="d-push-weekly-limit" type="number" min="0" value="${c.push_weekly_limit ?? 50}"/>
        </div>
      </div>
      <div style="margin-bottom:8px">
        <button class="btn-solid" style="padding:6px 14px;font-size:10px" onclick="savePushLimits('${esc(c.id)}')">Save limits</button>
      </div>
      <div class="push-row">
        <label>Daily used</label>
        <div class="push-adj">
          <button class="push-adj-btn" onclick="adjustPushes('${esc(c.id)}','daily',-1)">−</button>
          <span class="push-adj-val" id="d-push-daily-used">${dailyUsed}</span>
          <button class="push-adj-btn" onclick="adjustPushes('${esc(c.id)}','daily',1)">+</button>
        </div>
        <span style="font-size:11px;color:var(--ink-faint);margin-left:4px">/ ${c.push_daily_limit ?? 10} today</span>
      </div>
      <div class="push-row" style="margin-top:8px">
        <label>Weekly used</label>
        <div class="push-adj">
          <button class="push-adj-btn" onclick="adjustPushes('${esc(c.id)}','weekly',-1)">−</button>
          <span class="push-adj-val" id="d-push-weekly-used">${weeklyUsed}</span>
          <button class="push-adj-btn" onclick="adjustPushes('${esc(c.id)}','weekly',1)">+</button>
        </div>
        <span style="font-size:11px;color:var(--ink-faint);margin-left:4px">/ ${c.push_weekly_limit ?? 50} this week</span>
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
      <div id="d-stores-list">
        ${(c.stores || []).map(s => `
        <div class="store-row" data-store-id="${esc(s.id)}">
          <span class="store-slug" id="slug-display-${esc(s.id)}" title="click to edit" style="cursor:pointer" onclick="startEditSlug('${esc(c.id)}','${esc(s.id)}','${esc(s.slug)}')">/${esc(s.slug)}</span>
          <span class="store-name">${esc(s.name || s.slug)}</span>
          <a class="store-link" href="/${esc(s.slug)}" target="_blank" rel="noopener" title="Open website">↗</a>
          <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="accessDashboard('${esc(c.id)}')" title="Access dashboard as this client">🔑</button>
          <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="openTransferModal('${esc(c.id)}','${esc(s.id)}')" title="Transfer website">⇄</button>
          <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="downloadTemplate('${esc(c.id)}','${esc(s.id)}','website')" title="Download website JSON">⤓W</button>
          <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="downloadTemplate('${esc(c.id)}','${esc(s.id)}','items')" title="Download items CSV">⤓I</button>
          <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="downloadTemplate('${esc(c.id)}','${esc(s.id)}','gallery')" title="Download gallery URLs">⤓G</button>
          <button class="store-remove-btn" onclick="removeStore('${esc(c.id)}','${esc(s.id)}')" title="Remove website">−</button>
        </div>`).join('') || '<div class="empty-msg">No stores yet</div>'}
      </div>
      <div class="store-add-row">
        <input class="store-add-input" id="d-new-slug" type="text" placeholder="new-slug" oninput="checkNewSlug()" autocomplete="off"/>
        <span class="store-add-hint" id="d-slug-hint"></span>
        <button class="store-add-btn" onclick="addStore('${esc(c.id)}')" title="Add website">+</button>
      </div>
    </div>

    <div class="dsection">
      <div class="dsection__title">Password</div>
      <div class="dfield-grid">
        <div class="dfield">
          <label>Current password (admin-visible)</label>
          <input type="text" readonly value="${esc(c.plain_password || '— set a new one to store it —')}" style="color:${c.plain_password ? 'inherit' : 'var(--ink-faint)'}"/>
        </div>
      </div>
      <div class="dfield-grid" style="margin-top:12px">
        <div class="dfield">
          <label>Set new password</label>
          <input type="text" id="d-new-password" placeholder="Min. 6 characters" autocomplete="off"/>
        </div>
        <div class="dfield" style="justify-content:flex-end;padding-bottom:2px">
          <button class="btn-solid" onclick="changePassword('${esc(c.id)}')">Set password</button>
        </div>
      </div>
    </div>

    <div class="dsection" id="d-collabs-section">
      <div class="dsection__title" style="display:flex;align-items:center;justify-content:space-between">
        <span>Collaborators</span>
        <button class="btn-solid" style="padding:6px 12px" onclick="openAddCollabForm('${esc(c.id)}')">+ Add</button>
      </div>
      <div id="d-collab-add-form" style="display:none;margin-bottom:16px">
        <div class="dfield-grid" style="margin-bottom:10px">
          <div class="dfield">
            <label>Email</label>
            <input type="email" id="d-col-email" placeholder="collaborator@email.com"/>
          </div>
          <div class="dfield">
            <label>Password</label>
            <div class="pw-wrap">
              <input type="password" id="d-col-password" placeholder="Min. 6 characters"/>
              <button class="pw-eye" type="button" onclick="togglePw('d-col-password',this)" title="Show/hide">👁</button>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-solid" onclick="addCollaborator('${esc(c.id)}')">Add collaborator</button>
          <button class="btn-danger" style="padding:6px 14px" onclick="document.getElementById('d-collab-add-form').style.display='none'">Cancel</button>
        </div>
      </div>
      <div id="d-collabs-list"><div class="empty-msg">Loading…</div></div>
    </div>

    ${!c.is_admin ? `
    <div class="dsection dsection--danger">
      <div class="dsection__title">Danger zone</div>
      <p class="danger-note">Deleting this account will remove all their stores, products, and uploaded images. This cannot be undone.</p>
      <button class="btn-danger" onclick="deleteClient('${esc(c.id)}', '${esc(c.email)}')">Delete account</button>
    </div>` : ''}

  </div>`;
}

// ── Status ──────────────────────────────────────────────────────────────────
window.setClientStatus = async function(id, newStatus) {
  const labels = { active: 'resume', paused: 'pause dashboard', frozen: 'freeze website', archived: 'archive' };
  const label = labels[newStatus] || newStatus;
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

// ── Save client ──────────────────────────────────────────────────────────────
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

// ── Delete client ────────────────────────────────────────────────────────────
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
  el.textContent   = msg;
  el.className     = `detail-msg detail-msg--${type}`;
  el.style.display = '';
  setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
}

// ── Stores ────────────────────────────────────────────────────────────────────
window.removeStore = async function(ownerId, storeId) {
  if (!confirm('Remove this website?\n\nAll its products and images will be permanently deleted.')) return;
  const res  = await api('DELETE', `/api/admin/owners/${ownerId}/stores/${storeId}`);
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Remove failed', 'err'); return; }
  if (state.selected) {
    state.selected.stores = (state.selected.stores || []).filter(s => s.id !== storeId);
    renderDetail();
    renderSidebar();
  }
};

window.addStore = async function(ownerId) {
  const slugEl = document.getElementById('d-new-slug');
  const slug   = (slugEl?.value || '').trim().toLowerCase();
  if (!slug) { flashDetailMsg('Enter a slug first', 'err'); return; }
  const res  = await api('POST', `/api/admin/owners/${ownerId}/stores`, { slug });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed to add website', 'err'); return; }
  if (state.selected) {
    state.selected.stores = [...(state.selected.stores || []), { id: data.id, slug: data.slug, name: data.name }];
    renderDetail();
    renderSidebar();
  }
};

let _slugCheckTimer = null;
window.checkNewSlug = function() {
  const slugEl = document.getElementById('d-new-slug');
  const hintEl = document.getElementById('d-slug-hint');
  const raw    = (slugEl?.value || '').trim().toLowerCase();
  if (hintEl) { hintEl.textContent = ''; hintEl.className = 'store-add-hint'; }
  clearTimeout(_slugCheckTimer);
  if (!raw || raw.length < 2) return;
  _slugCheckTimer = setTimeout(async () => {
    const res  = await fetch(`/api/public/slug-check?slug=${encodeURIComponent(raw)}`, { credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (!hintEl) return;
    if (data.available) {
      hintEl.textContent = '✓ available';
      hintEl.className   = 'store-add-hint store-add-hint--ok';
    } else {
      hintEl.textContent = data.error || '✗ taken';
      hintEl.className   = 'store-add-hint store-add-hint--err';
    }
  }, 400);
};

// ── Slug editing ──────────────────────────────────────────────────────────────
window.startEditSlug = function(ownerId, storeId, currentSlug) {
  const display = document.getElementById(`slug-display-${storeId}`);
  if (!display) return;
  const input = document.createElement('input');
  input.value = currentSlug;
  input.style.cssText = 'font-family:var(--mono);font-size:11px;width:130px;padding:2px 5px;border:1px solid #c0b8a8';
  display.replaceWith(input);
  input.focus();
  input.select();

  const commit = async () => {
    const newSlug = input.value.trim().toLowerCase();
    if (!newSlug || newSlug === currentSlug) {
      input.replaceWith(display);
      return;
    }
    if (!/^[a-z0-9-]{2,48}$/.test(newSlug)) {
      flashDetailMsg('Slug: 2–48 chars, lowercase letters, numbers, hyphens only', 'err');
      input.replaceWith(display);
      return;
    }
    const res  = await api('PATCH', `/api/admin/owners/${ownerId}/stores/${storeId}`, { slug: newSlug });
    const data = await safeJson(res);
    if (!res.ok) { flashDetailMsg(data.error || 'Slug update failed', 'err'); input.replaceWith(display); return; }

    display.textContent = `/${newSlug}`;
    input.replaceWith(display);
    if (state.selected) {
      const s = (state.selected.stores || []).find(x => x.id === storeId);
      if (s) s.slug = newSlug;
    }
    flashDetailMsg(`Slug updated to /${newSlug}`, 'ok');
  };

  input.addEventListener('blur',  commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { input.blur(); }
    if (e.key === 'Escape') { input.replaceWith(display); }
  });
};

// ── Slug transfer ─────────────────────────────────────────────────────────────
window.openTransferModal = function(ownerId, storeId) {
  state.transferStoreId = { ownerId, storeId };
  const errEl  = document.getElementById('tr-error');
  if (errEl) errEl.style.display = 'none';

  const select = document.getElementById('tr-target-owner');
  if (select) {
    select.innerHTML = '<option value="">— select a client —</option>' +
      state.clients
        .filter(c => c.id !== ownerId && !c.is_admin)
        .map(c => `<option value="${esc(c.id)}">${esc(c.name || c.email)} (${esc(c.email)})</option>`)
        .join('');
  }
  openModal('transfer-modal');
};

window.submitTransfer = async function() {
  const { ownerId, storeId } = state.transferStoreId || {};
  if (!ownerId || !storeId) return;

  const targetOwnerId = document.getElementById('tr-target-owner')?.value;
  const type          = document.getElementById('tr-type')?.value;
  const errEl         = document.getElementById('tr-error');

  if (!targetOwnerId) { if (errEl) { errEl.textContent = 'Select a target client.'; errEl.style.display=''; } return; }

  const btn = document.getElementById('btn-tr-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Transferring…'; }

  const res  = await api('POST', `/api/admin/owners/${ownerId}/stores/${storeId}/transfer`, { target_owner_id: targetOwnerId, type });
  const data = await safeJson(res);

  if (btn) { btn.disabled = false; btn.textContent = 'Transfer'; }

  if (!res.ok) { if (errEl) { errEl.textContent = data.error || 'Transfer failed'; errEl.style.display=''; } return; }

  closeModal('transfer-modal');
  flashDetailMsg(type === 'complete' ? 'Website transferred successfully.' : `Slug transferred. Original store now at /${data.original_temp_slug}`, 'ok');
  selectClient(ownerId);
};

// ── Access dashboard (impersonation) ─────────────────────────────────────────
window.accessDashboard = async function(ownerId) {
  const res  = await api('POST', `/api/admin/owners/${ownerId}/impersonate`);
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Impersonation failed', 'err'); return; }

  const url = `/api/auth/impersonate?t=${encodeURIComponent(data.token)}`;
  // Browser cookies are shared across all tabs — opening this will replace the admin session.
  // Tip: open in a private/incognito window to keep both sessions active simultaneously.
  if (confirm('This will open the client\'s dashboard in a new tab.\n\n⚠️ Note: browser cookies are shared across tabs — your admin session will be replaced by the client\'s session in ALL tabs. To keep your admin session active, open this link in a private/incognito window instead.\n\nCopy link to clipboard and open incognito?')) {
    navigator.clipboard?.writeText(window.location.origin + url).catch(() => {});
    alert('Link copied. Now open a new private/incognito window and paste it there.\n\n' + window.location.origin + url);
  } else {
    window.open(url, '_blank');
  }
};

// ── Download templates ────────────────────────────────────────────────────────
window.downloadTemplate = function(ownerId, storeId, type) {
  const url = `/api/admin/owners/${ownerId}/export?type=${type}&storeId=${storeId}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

// ── Push limits ───────────────────────────────────────────────────────────────
window.savePushLimits = async function(id) {
  const daily  = Math.max(0, parseInt(document.getElementById('d-push-daily-limit')?.value, 10) || 0);
  const weekly = Math.max(0, parseInt(document.getElementById('d-push-weekly-limit')?.value, 10) || 0);

  const res  = await api('PUT', `/api/admin/owners/${id}`, { push_daily_limit: daily, push_weekly_limit: weekly });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed to save push limits', 'err'); return; }

  if (state.selected?.id === id) {
    state.selected.push_daily_limit  = daily;
    state.selected.push_weekly_limit = weekly;
  }
  flashDetailMsg('Push limits saved', 'ok');
};

window.adjustPushes = async function(id, period, delta) {
  const el = document.getElementById(`d-push-${period}-used`);
  const cur = parseInt(el?.textContent ?? '0', 10);
  const next = Math.max(0, cur + delta);

  const field = period === 'daily' ? 'push_daily_used' : 'push_weekly_used';
  const res  = await api('PUT', `/api/admin/owners/${id}`, { [field]: next });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed', 'err'); return; }

  if (el) el.textContent = next;
  if (state.selected?.id === id) state.selected[field] = next;
};

// ── Password show/hide ────────────────────────────────────────────────────────
window.togglePw = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
};

// ── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// ── Add new client ────────────────────────────────────────────────────────────
window.submitNewClient = async function() {
  const email    = document.getElementById('nc-email')?.value.trim();
  const password = document.getElementById('nc-password')?.value;
  const name     = document.getElementById('nc-name')?.value.trim();
  const errEl    = document.getElementById('nc-error');

  if (!email || !password) { errEl.textContent = 'Email and password are required.'; errEl.style.display=''; return; }
  errEl.style.display = 'none';

  const btn = document.getElementById('btn-nc-submit');
  btn.disabled = true; btn.textContent = 'Creating…';

  const res  = await api('POST', '/api/admin/owners', { email, password, name });
  const data = await safeJson(res);
  btn.disabled = false; btn.textContent = 'Create client';

  if (!res.ok) { errEl.textContent = data.error || 'Failed'; errEl.style.display=''; return; }

  closeModal('new-client-modal');
  document.getElementById('nc-email').value    = '';
  document.getElementById('nc-password').value = '';
  document.getElementById('nc-name').value     = '';
  await loadClients();
  selectClient(data.id);
};

// ── Change password ────────────────────────────────────────────────────────────
window.changePassword = async function(id) {
  const pw = document.getElementById('d-new-password')?.value;
  if (!pw || pw.length < 6) { flashDetailMsg('Password must be at least 6 characters', 'err'); return; }

  const res  = await api('PATCH', `/api/admin/owners/${id}`, { password: pw });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed', 'err'); return; }

  document.getElementById('d-new-password').value = '';
  // Update the stored-password display without re-rendering the whole panel
  if (state.selected?.id === id) state.selected.plain_password = pw;
  const stored = document.querySelector('#admin-detail input[readonly]');
  if (stored) { stored.value = pw; stored.style.color = 'inherit'; }
  flashDetailMsg('Password updated', 'ok');
};

// ── Collaborators ──────────────────────────────────────────────────────────────
async function loadCollaborators(ownerId) {
  const listEl = document.getElementById('d-collabs-list');
  if (!listEl) return;
  const res  = await api('GET', `/api/admin/owners/${ownerId}/collaborators`);
  const data = await safeJson(res);
  const cols  = Array.isArray(data) ? data : [];

  if (!cols.length) {
    listEl.innerHTML = '<div class="empty-msg">No collaborators yet.</div>';
    return;
  }
  listEl.innerHTML = cols.map(c => `
    <div class="store-row" id="col-row-${esc(c.id)}">
      <span class="store-name">${esc(c.email)}</span>
      <span style="font-family:var(--mono);font-size:10px;color:var(--ink-faint)">${c.plain_password ? esc(c.plain_password) : '—'}</span>
      <button class="btn-solid" style="padding:4px 10px;font-size:9px" onclick="changeCollabPassword('${esc(ownerId)}','${esc(c.id)}','${esc(c.email)}')">Change PW</button>
      <button class="store-remove-btn" onclick="removeCollaborator('${esc(ownerId)}','${esc(c.id)}')" title="Remove">−</button>
    </div>`).join('');
}

window.openAddCollabForm = function() {
  const form = document.getElementById('d-collab-add-form');
  if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
};

window.addCollaborator = async function(ownerId) {
  const email    = document.getElementById('d-col-email')?.value.trim();
  const password = document.getElementById('d-col-password')?.value;
  if (!email || !password) { flashDetailMsg('Email and password required', 'err'); return; }

  const res  = await api('POST', `/api/admin/owners/${ownerId}/collaborators`, { email, password });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed', 'err'); return; }

  document.getElementById('d-col-email').value    = '';
  document.getElementById('d-col-password').value = '';
  document.getElementById('d-collab-add-form').style.display = 'none';
  flashDetailMsg('Collaborator added', 'ok');
  loadCollaborators(ownerId);
};

window.removeCollaborator = async function(ownerId, colId) {
  if (!confirm('Remove this collaborator?')) return;
  const res  = await api('DELETE', `/api/admin/owners/${ownerId}/collaborators/${colId}`);
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed', 'err'); return; }
  document.getElementById(`col-row-${colId}`)?.remove();
  flashDetailMsg('Collaborator removed', 'ok');
};

window.changeCollabPassword = async function(ownerId, colId, email) {
  const pw = prompt(`New password for ${email}:`);
  if (!pw) return;
  if (pw.length < 6) { flashDetailMsg('Password must be at least 6 characters', 'err'); return; }
  const res  = await api('PATCH', `/api/admin/owners/${ownerId}/collaborators/${colId}`, { password: pw });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed', 'err'); return; }
  flashDetailMsg('Password updated', 'ok');
};

document.addEventListener('DOMContentLoaded', boot);
