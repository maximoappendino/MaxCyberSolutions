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
  document.getElementById('btn-toggle-metrics').addEventListener('click', toggleMetrics);

  await loadClients();
}

function toggleMetrics() {
  const panel   = document.getElementById('metrics-panel');
  const sidebar = document.getElementById('a-sidebar');
  const detail  = document.getElementById('admin-detail');
  const active  = panel.classList.toggle('active');
  sidebar.style.display = active ? 'none' : '';
  detail.style.display  = active ? 'none' : '';
  document.getElementById('btn-toggle-metrics').style.color = active ? 'var(--accent)' : '';
  if (active) loadMetrics();
}

async function loadMetrics() {
  const res  = await api('GET', '/api/admin/metrics');
  if (!res.ok) return;
  const d = await safeJson(res);

  const fmtARS = c => '$' + ((c||0)/100).toLocaleString('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2});

  // Tiles
  document.getElementById('metrics-tiles').innerHTML = [
    { val: d.totals?.clients,   lbl: 'Clients'  },
    { val: d.totals?.stores,    lbl: 'Stores'   },
    { val: d.totals?.orders,    lbl: 'Orders'   },
    { val: d.totals?.products,  lbl: 'Products' },
    { val: d.totals?.customers, lbl: 'Customers'},
    { val: fmtARS(d.totals?.revenue_cents), lbl: 'Total Revenue' },
  ].map(t => `<div class="metric-tile"><div class="metric-tile__val">${t.val ?? 0}</div><div class="metric-tile__lbl">${t.lbl}</div></div>`).join('');

  // Orders by status
  document.getElementById('metrics-by-status').innerHTML = `
    <table class="metrics-table"><thead><tr><th>Status</th><th>Count</th></tr></thead><tbody>
    ${(d.orders_by_status||[]).map(r=>`<tr><td>${esc(r.status)}</td><td>${r.n}</td></tr>`).join('')}
    </tbody></table>`;

  // Stores by type
  document.getElementById('metrics-by-type').innerHTML = `
    <table class="metrics-table"><thead><tr><th>Type</th><th>Count</th></tr></thead><tbody>
    ${(d.stores_by_type||[]).map(r=>`<tr><td>${esc(r.store_type||'ecommerce')}</td><td>${r.n}</td></tr>`).join('')}
    </tbody></table>`;

  // Top stores
  document.querySelector('#metrics-top-stores tbody').innerHTML =
    (d.top_stores||[]).map(r=>`<tr><td>/${esc(r.slug)}</td><td>${r.order_count}</td><td>${fmtARS(r.revenue_cents)}</td></tr>`).join('') ||
    '<tr><td colspan="3" style="color:var(--ink-faint)">No data yet</td></tr>';

  // Recent orders
  document.querySelector('#metrics-recent-orders tbody').innerHTML =
    (d.recent_orders||[]).map(r=>`<tr>
      <td>/${esc(r.slug)}</td><td>${esc(r.customer_name)}</td>
      <td>${esc(r.status)}</td><td>${fmtARS(r.total_cents)}</td>
      <td style="color:var(--ink-faint)">${new Date(r.created_at).toLocaleDateString('es-AR')}</td>
    </tr>`).join('') || '<tr><td colspan="5" style="color:var(--ink-faint)">No orders yet</td></tr>';

  // Email usage
  const eu = d.email_usage || {};
  const pct = eu.limit ? Math.min(100,Math.round((eu.used/eu.limit)*100)) : 0;
  document.getElementById('metrics-email').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-top:8px">
      <div style="flex:1;height:6px;background:var(--rule);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:3px"></div>
      </div>
      <span style="font-family:var(--mono);font-size:11px;color:var(--ink-faint)">${eu.used||0} / ${eu.limit||0} this month</span>
    </div>`;
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
  const month = new Date().toISOString().slice(0, 7);
  const dailyUsed   = c.push_daily_reset  === today ? (c.push_daily_used  ?? 0) : 0;
  const weeklyUsed  = c.push_weekly_reset === week  ? (c.push_weekly_used ?? 0) : 0;
  const monthlyEmailUsed = c.email_monthly_reset === month ? (c.email_monthly_used ?? 0) : 0;

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
      <label class="toggle-row" style="margin-top:10px;display:flex;align-items:center;gap:10px;cursor:pointer">
        <input type="checkbox" id="d-show-in-carousel" ${c.show_in_carousel ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer" />
        <span style="font-size:12px">Show logo in landing page carousel</span>
      </label>
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
      <div class="dsection__title">Email Limits</div>
      <div class="push-grid">
        <div class="dfield">
          <label>Monthly limit</label>
          <input id="d-email-monthly-limit" type="number" min="0" value="${c.email_monthly_limit ?? 200}"/>
        </div>
      </div>
      <div style="margin-bottom:8px">
        <button class="btn-solid" style="padding:6px 14px;font-size:10px" onclick="saveEmailLimits('${esc(c.id)}')">Save limit</button>
      </div>
      <div class="push-row">
        <label>Monthly used</label>
        <div class="push-adj">
          <button class="push-adj-btn" onclick="adjustEmails('${esc(c.id)}',-1)">−</button>
          <span class="push-adj-val" id="d-email-monthly-used">${monthlyEmailUsed}</span>
          <button class="push-adj-btn" onclick="adjustEmails('${esc(c.id)}',1)">+</button>
        </div>
        <span style="font-size:11px;color:var(--ink-faint);margin-left:4px">/ ${c.email_monthly_limit ?? 200} this month</span>
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
        ${(c.stores || []).map(s => {
          const t = s.store_type || 'ecommerce';
          return `
        <div class="store-row" data-store-id="${esc(s.id)}">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span class="store-slug" id="slug-display-${esc(s.id)}" title="click to edit" style="cursor:pointer" onclick="startEditSlug('${esc(c.id)}','${esc(s.id)}','${esc(s.slug)}')">/${esc(s.slug)}</span>
              <span class="store-name">${esc(s.name || s.slug)}</span>
              <a class="store-link" href="/store/${esc(s.slug)}" target="_blank" rel="noopener" title="Open website">↗</a>
            </div>
            <div class="type-pills">
              ${['ecommerce','services','memberships','reservations'].map(tp => `
                <button class="type-pill type-pill--${tp}${t===tp?' active':''}" onclick="setStoreType('${esc(c.id)}','${esc(s.id)}','${tp}',this)">${tp}</button>
              `).join('')}
            </div>
          </div>
          <div class="store-actions">
            <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="accessDashboard('${esc(c.id)}')" title="Access dashboard as this client">🔑</button>
            <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="openTransferModal('${esc(c.id)}','${esc(s.id)}')" title="Transfer website">⇄</button>
            <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="downloadTemplate('${esc(c.id)}','${esc(s.id)}','website')" title="Download website JSON">⤓W</button>
            <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="downloadTemplate('${esc(c.id)}','${esc(s.id)}','items')" title="Download items CSV">⤓I</button>
            <button class="btn-solid" style="padding:3px 8px;font-size:9px" onclick="downloadTemplate('${esc(c.id)}','${esc(s.id)}','gallery')" title="Download gallery URLs">⤓G</button>
            <button class="store-remove-btn" onclick="removeStore('${esc(c.id)}','${esc(s.id)}')" title="Remove website">−</button>
          </div>
        </div>`;}).join('') || '<div class="empty-msg">No stores yet</div>'}
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
          <label>New password</label>
          <div class="pw-wrap">
            <input type="password" id="d-new-password" placeholder="Min. 6 characters" autocomplete="new-password"/>
            <button class="pw-eye" type="button" onclick="togglePw('d-new-password',this)" title="Show/hide">👁</button>
          </div>
        </div>
        <div class="dfield" style="justify-content:flex-end;gap:6px;padding-bottom:2px;display:flex;flex-direction:row;align-items:flex-end">
          <button class="btn-solid" style="background:var(--ink-faint)" onclick="generatePassword()">Generate</button>
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
    show_in_carousel: document.getElementById('d-show-in-carousel')?.checked ? 1 : 0,
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
  navigator.clipboard.writeText(window.location.origin + url).catch(() => {
    prompt('Copy this link and open it in a private/incognito window:', window.location.origin + url);
  });
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

// ── Store type ────────────────────────────────────────────────────────────────
window.setStoreType = async function(ownerId, storeId, type, btn) {
  const res  = await api('PUT', `/api/admin/owners/${ownerId}/stores/${storeId}`, { store_type: type });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed to update store type', 'err'); return; }
  // Update pills in the row
  const row = btn.closest('.store-row');
  row.querySelectorAll('.type-pill').forEach(p => {
    p.classList.toggle('active', p.textContent.trim() === type);
  });
  // Update cached store data
  const store = (state.selected?.stores || []).find(s => s.id === storeId);
  if (store) store.store_type = type;
};

// ── Email limits ──────────────────────────────────────────────────────────────
window.saveEmailLimits = async function(id) {
  const monthly = Math.max(0, parseInt(document.getElementById('d-email-monthly-limit')?.value, 10) || 0);
  const res  = await api('PUT', `/api/admin/owners/${id}`, { email_monthly_limit: monthly });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed to save email limit', 'err'); return; }
  if (state.selected?.id === id) state.selected.email_monthly_limit = monthly;
  flashDetailMsg('Email limit saved', 'ok');
};

window.adjustEmails = async function(id, delta) {
  const el  = document.getElementById('d-email-monthly-used');
  const cur = parseInt(el?.textContent ?? '0', 10);
  const next = Math.max(0, cur + delta);
  const res  = await api('PUT', `/api/admin/owners/${id}`, { email_monthly_used: next });
  const data = await safeJson(res);
  if (!res.ok) { flashDetailMsg(data.error || 'Failed', 'err'); return; }
  if (el) el.textContent = next;
  if (state.selected?.id === id) state.selected.email_monthly_used = next;
};

// ── Password show/hide ────────────────────────────────────────────────────────
window.togglePw = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
};

window.generatePassword = function() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$';
  const arr   = crypto.getRandomValues(new Uint8Array(14));
  const pw    = Array.from(arr).map(b => chars[b % chars.length]).join('');
  const input = document.getElementById('d-new-password');
  if (!input) return;
  input.value = pw;
  input.type  = 'text';
  const eye = input.parentElement?.querySelector('.pw-eye');
  if (eye) eye.textContent = '🙈';
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

// ── Icon library ──────────────────────────────────────────────────────────────
async function loadIcons() {
  const grid = document.getElementById('icon-grid');
  if (!grid) return;
  grid.innerHTML = '<p style="font-size:12px;color:#888;grid-column:1/-1">Loading…</p>';
  const res = await api('GET', '/api/admin/icons');
  const data = await safeJson(res);
  if (!res.ok) { grid.innerHTML = '<p style="color:red;font-size:12px;grid-column:1/-1">Failed to load icons.</p>'; return; }
  const icons = data.icons || [];
  if (!icons.length) { grid.innerHTML = '<p style="font-size:12px;color:#888;grid-column:1/-1">No icons yet. Upload some above.</p>'; return; }
  grid.innerHTML = icons.map(ic => `
    <div class="icon-grid-item">
      <img src="${ic.url}" alt="${ic.name}" />
      <span>${ic.name}</span>
      <button onclick="deleteIcon('${ic.key}', this)">Delete</button>
    </div>`).join('');
}

window.deleteIcon = async function(key, btn) {
  if (!confirm('Delete this icon? Clients using it will lose the image.')) return;
  btn.disabled = true;
  const res = await api('DELETE', '/api/admin/icons', { key });
  if (!res.ok) { btn.disabled = false; alert('Failed to delete icon.'); return; }
  btn.closest('.icon-grid-item')?.remove();
};

function setupIconsModal() {
  const btn = document.getElementById('btn-manage-icons');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.getElementById('icons-modal').classList.add('active');
    loadIcons();
  });
  const uploadInput = document.getElementById('icon-upload-input');
  document.getElementById('btn-icon-upload')?.addEventListener('click', () => uploadInput?.click());
  uploadInput?.addEventListener('change', async e => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/icons', { method: 'POST', body: fd });
      if (!res.ok) { alert(`Failed to upload ${file.name}`); }
    }
    loadIcons();
  });
}

document.addEventListener('DOMContentLoaded', () => { boot(); setupIconsModal(); });
