const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin — MaxCyberSolutions</title>
  <link rel="icon" href="/img/icon.webp" type="image/webp"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --accent: #e2a14a; --accent-soft: rgba(226,161,74,.13);
      --cream: #efeae0; --ink: #1c1a16;
      --ink-soft: #45403a; --ink-faint: #7a736a;
      --rule: #d4cdbd; --rule-soft: #e2dccd;
      --red: #b33; --red-soft: rgba(187,51,51,.1);
      --bar-h: 54px;
      --side-w: 290px;
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans:  "DM Sans", sans-serif;
      --mono:  "JetBrains Mono", monospace;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; background: var(--cream); color: var(--ink);
      font-family: var(--sans); font-size: 14px; line-height: 1.5;
      -webkit-font-smoothing: antialiased; }
    a { color: var(--ink); }
    button { cursor: pointer; font-family: var(--sans); }
    input, textarea, select {
      font-family: var(--sans); font-size: 13px; color: var(--ink);
      background: transparent; border: 1px solid var(--rule);
      padding: 8px 11px; outline: none; width: 100%;
      transition: border-color 150ms;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--accent); }
    textarea { resize: vertical; }
    label { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.13em; text-transform: uppercase; color: var(--ink-faint);
      display: block; margin-bottom: 4px; }

    /* ── Top bar ── */
    .a-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: var(--bar-h);
      background: color-mix(in srgb, var(--cream) 92%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--rule-soft);
      display: flex; align-items: center; padding: 0 20px; gap: 14px;
    }
    .a-bar__brand {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em;
      text-transform: uppercase; display: flex; align-items: center; gap: 8px;
    }
    .a-bar__brand img { width: 26px; height: 26px; object-fit: contain; }
    .a-bar__badge {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.15em;
      text-transform: uppercase; color: var(--accent);
      border: 1px solid var(--accent); padding: 2px 7px;
    }
    .a-bar__right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
    .a-bar__link {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--ink-faint); text-decoration: none;
      transition: color 150ms;
    }
    .a-bar__link:hover { color: var(--ink); }
    .icon-grid-item { border: 2px solid var(--rule-soft); border-radius: 6px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 6px; background: #f8f7f4; }
    .icon-grid-item img { width: 48px; height: 48px; object-fit: contain; }
    .icon-grid-item span { font-size: 9px; color: #888; word-break: break-all; text-align: center; max-width: 90px; }
    .icon-grid-item button { font-size: 10px; background: none; border: none; color: #c00; cursor: pointer; padding: 2px 4px; }
    .a-bar__email { font-family: var(--mono); font-size: 10px; color: var(--ink-faint); }
    .a-bar__logout {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 6px 13px;
      border: 1px solid var(--rule); background: transparent; color: var(--ink-faint);
      transition: color 150ms, border-color 150ms;
    }
    .a-bar__logout:hover { color: var(--ink); border-color: var(--ink); }

    /* ── Layout ── */
    .a-layout { display: flex; height: 100vh; padding-top: var(--bar-h); overflow: hidden; }

    /* ── Sidebar ── */
    .a-sidebar {
      width: var(--side-w); flex-shrink: 0;
      border-right: 1px solid var(--rule);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .a-sidebar__head {
      padding: 16px 16px 10px;
      border-bottom: 1px solid var(--rule-soft);
      flex-shrink: 0;
    }
    .a-sidebar__heading {
      font-family: var(--serif); font-size: 20px;
      letter-spacing: -0.01em; margin-bottom: 10px;
    }
    .a-sidebar__search {
      width: 100%; font-size: 12px; padding: 7px 10px;
    }
    #client-list { flex: 1; overflow-y: auto; }

    /* Client cards */
    .client-card {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; border-bottom: 1px solid var(--rule-soft);
      cursor: pointer; transition: background 150ms;
    }
    .client-card:hover { background: var(--accent-soft); }
    .client-card.active { background: var(--accent-soft); border-left: 3px solid var(--accent); padding-left: 11px; }
    .client-avatar {
      width: 34px; height: 34px; flex-shrink: 0;
      background: var(--ink); color: var(--cream);
      font-family: var(--mono); font-size: 14px; font-weight: 500;
      display: flex; align-items: center; justify-content: center;
    }
    .client-info { flex: 1; min-width: 0; }
    .client-name { font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .client-sub  { font-family: var(--mono); font-size: 9px; letter-spacing: 0.07em;
      color: var(--ink-faint); margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .plan-tag { color: var(--accent); }

    /* Mini bars */
    .mini-bars { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
    .mini-bar { height: 3px; background: var(--rule); border-radius: 2px; overflow: hidden; }
    .mini-bar__fill { height: 100%; background: var(--ink-faint); border-radius: 2px; transition: width 300ms; }
    .mini-bar__fill.warn { background: var(--red); }

    /* Admin badge */
    .badge { font-family: var(--mono); font-size: 8px; letter-spacing: 0.1em;
      text-transform: uppercase; padding: 1px 5px; border: 1px solid; }
    .badge--admin { color: var(--accent); border-color: var(--accent); }

    /* ── Detail panel ── */
    #admin-detail { flex: 1; overflow-y: auto; }
    .detail-empty {
      height: 100%; display: flex; align-items: center; justify-content: center;
      font-family: var(--serif); font-style: italic; font-size: 20px; color: var(--ink-faint);
    }
    .detail-inner { max-width: 720px; padding: 32px 36px 64px; }

    .detail-topbar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px;
    }
    .detail-identity { display: flex; align-items: center; gap: 14px; }
    .detail-avatar {
      width: 52px; height: 52px; flex-shrink: 0;
      background: var(--ink); color: var(--cream);
      font-family: var(--mono); font-size: 22px;
      display: flex; align-items: center; justify-content: center;
    }
    .detail-heading { font-family: var(--serif); font-size: 26px; letter-spacing: -0.01em; line-height: 1.1; }
    .detail-sub { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; color: var(--ink-faint); margin-top: 3px; }

    .detail-msg { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
      padding: 8px 12px; margin-bottom: 20px; }
    .detail-msg--ok  { background: rgba(28,107,58,.1); color: #1c6b3a; }
    .detail-msg--err { background: var(--red-soft); color: var(--red); }

    /* Sections */
    .dsection { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--rule-soft); }
    .dsection:last-child { border-bottom: none; }
    .dsection__title {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em;
      text-transform: uppercase; color: var(--ink-faint);
      margin-bottom: 14px;
    }
    .dfield-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .dfield { display: flex; flex-direction: column; gap: 4px; }
    .dfield--full { grid-column: 1 / -1; }

    /* Usage bars */
    .usage-rows { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
    .usage-row { display: flex; align-items: center; gap: 10px; }
    .usage-lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--ink-faint); width: 60px; flex-shrink: 0; }
    .usage-bar { flex: 1; height: 5px; background: var(--rule); border-radius: 3px; overflow: hidden; }
    .usage-bar__fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 400ms; }
    .usage-bar__fill.warn { background: var(--red); }
    .usage-val { font-family: var(--mono); font-size: 10px; color: var(--ink-faint); width: 120px; text-align: right; flex-shrink: 0; }

    /* Stores list */
    .store-row { display: flex; align-items: center; gap: 10px; padding: 8px 0;
      border-bottom: 1px solid var(--rule-soft); }
    .store-row:last-child { border-bottom: none; }
    .store-slug { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; color: var(--ink-faint); }
    .store-name { flex: 1; font-size: 13px; }
    .store-link { font-family: var(--mono); font-size: 11px; color: var(--accent); text-decoration: none; }
    .store-link:hover { text-decoration: underline; }
    .store-remove-btn { background: none; border: none; color: var(--ink-faint);
      font-size: 20px; line-height: 1; padding: 0 2px; cursor: pointer; transition: color 150ms; }
    .store-remove-btn:hover { color: var(--red); }
    .store-add-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
    .store-add-input { flex: 1; padding: 7px 10px; font-size: 12px; }
    .store-add-hint { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
      white-space: nowrap; min-width: 70px; }
    .store-add-hint--ok  { color: #1c6b3a; }
    .store-add-hint--err { color: var(--red); }
    .store-add-btn { flex-shrink: 0; width: 34px; height: 34px; background: var(--ink); color: var(--cream);
      border: none; font-size: 22px; cursor: pointer; transition: opacity 150ms;
      display: flex; align-items: center; justify-content: center; line-height: 1; }
    .store-add-btn:hover { opacity: 0.75; }

    /* Danger zone */
    .dsection--danger .dsection__title { color: var(--red); }
    .danger-note { font-size: 12px; color: var(--ink-faint); margin-bottom: 12px; }

    /* Buttons */
    .btn-solid {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 10px 20px;
      background: var(--ink); color: var(--cream);
      border: 1px solid var(--ink); transition: opacity 150ms;
    }
    .btn-solid:hover    { opacity: 0.82; }
    .btn-solid:disabled { opacity: 0.4; cursor: wait; }
    .btn-danger {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 9px 18px;
      background: transparent; color: var(--red);
      border: 1px solid var(--red); transition: background 150ms, color 150ms;
    }
    .btn-danger:hover { background: var(--red); color: #fff; }

    /* Status badges */
    .status-badge { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
      text-transform: uppercase; padding: 2px 6px; border: 1px solid; border-radius: 0; }
    .status--active   { color: #1c6b3a; border-color: #1c6b3a; }
    .status--paused   { color: #9a6200; border-color: #9a6200; }
    .status--frozen   { color: #1a5a8a; border-color: #1a5a8a; }
    .status--archived { color: var(--ink-faint); border-color: var(--ink-faint); }

    /* Status control */
    .status-control { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
    .status-current { display: flex; align-items: center; }
    .status-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .status-note { font-size: 12px; color: var(--ink-faint); font-style: italic; margin-top: 6px; }
    .btn-status {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 6px 12px;
      background: transparent; border: 1px solid; transition: background 150ms, color 150ms;
    }
    .btn-status--resume  { color: #1c6b3a; border-color: #1c6b3a; }
    .btn-status--resume:hover  { background: #1c6b3a; color: #fff; }
    .btn-status--pause   { color: #9a6200; border-color: #9a6200; }
    .btn-status--pause:hover   { background: #9a6200; color: #fff; }
    .btn-status--freeze  { color: #1a5a8a; border-color: #1a5a8a; }
    .btn-status--freeze:hover  { background: #1a5a8a; color: #fff; }
    .btn-status--archive { color: var(--ink-faint); border-color: var(--ink-faint); }
    .btn-status--archive:hover { background: var(--ink-faint); color: var(--cream); }

    /* Push limits */
    .push-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 10px; }
    .push-row  { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .push-row label { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; min-width: 90px; }
    .push-adj  { display: flex; align-items: center; gap: 6px; }
    .push-adj-btn { font-family: var(--mono); font-size: 13px; padding: 3px 10px;
      border: 1px solid var(--ink-faint); background: transparent; cursor: pointer; }
    .push-adj-btn:hover { background: var(--ink-faint); color: var(--cream); }
    .push-adj-val { font-family: var(--mono); font-size: 12px; min-width: 32px; text-align: center; }

    /* Password toggle */
    .pw-wrap { position: relative; display: flex; }
    .pw-wrap input { flex: 1; }
    .pw-eye { position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 13px; color: var(--ink-faint);
      padding: 0; line-height: 1; }

    /* Store row border */
    .store-row { gap: 6px; flex-wrap: wrap; }
    .store-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    /* Store type pills */
    .type-pills { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
    .type-pill { font-family: var(--mono); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 2px 7px; border: 1px solid var(--rule); background: transparent; cursor: pointer;
      color: var(--ink-faint); transition: background 120ms, color 120ms, border-color 120ms; }
    .type-pill:hover { border-color: var(--ink-faint); color: var(--ink); }
    .type-pill.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }
    .type-pill--ecommerce.active   { background: #1c6b3a; border-color: #1c6b3a; }
    .type-pill--services.active    { background: #1a5a8a; border-color: #1a5a8a; }
    .type-pill--memberships.active { background: #6b2fa0; border-color: #6b2fa0; }
    .type-pill--reservations.active{ background: #9a4200; border-color: #9a4200; }
    /* Metrics panel */
    .metrics-panel { display: none; flex: 1; overflow-y: auto; padding: 32px 36px 64px; max-width: 900px; }
    .metrics-panel.active { display: block; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap: 16px; margin-bottom: 32px; }
    .metric-tile { border: 1px solid var(--rule); padding: 18px 16px; }
    .metric-tile__val { font-family: var(--serif); font-size: 32px; letter-spacing: -0.02em; line-height: 1; margin-bottom: 4px; }
    .metric-tile__lbl { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-faint); }
    .metrics-section { margin-bottom: 28px; }
    .metrics-section__title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--rule-soft); }
    .metrics-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .metrics-table th { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--rule); }
    .metrics-table td { padding: 8px 8px; border-bottom: 1px solid var(--rule-soft); vertical-align: top; }
    .metrics-table tr:last-child td { border-bottom: none; }

    /* Misc */
    .empty-msg { font-family: var(--serif); font-style: italic;
      font-size: 15px; color: var(--ink-faint); padding: 20px 14px; }

    /* ── Mobile sidebar toggle ── */
    .a-sidebar-toggle {
      display: none;
      background: none; border: none; padding: 6px 8px; cursor: pointer;
      font-size: 20px; color: var(--ink); line-height: 1;
    }
    .a-sidebar-overlay {
      display: none; position: fixed; inset: 0; z-index: 149;
      background: rgba(0,0,0,.35);
    }
    @media (max-width: 720px) {
      .a-sidebar-toggle { display: flex; align-items: center; }
      .a-layout { position: relative; }
      .a-sidebar {
        position: fixed; top: var(--bar-h); left: 0; bottom: 0; z-index: 150;
        transform: translateX(-100%); transition: transform 260ms ease;
        box-shadow: 2px 0 16px rgba(0,0,0,.14);
      }
      .a-sidebar.open { transform: translateX(0); }
      .a-sidebar-overlay.open { display: block; }
      #admin-detail { max-width: 100vw; padding-left: 12px; padding-right: 12px; }
      .detail-inner { padding: 20px 16px 48px; }
      .dfield-grid { grid-template-columns: 1fr; }
      .push-grid { grid-template-columns: 1fr; }
      .detail-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
      .metrics-panel { padding: 20px 16px 48px; }
      .metrics-grid { grid-template-columns: repeat(auto-fill, minmax(130px,1fr)); }
    }

    /* New-client / generic modal */
    .a-modal-overlay { position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,.45);
      display: none; align-items: center; justify-content: center; }
    .a-modal-overlay.active { display: flex; }
    .a-modal-box { background: #fff; width: min(460px, 96vw); padding: 28px 32px; display: flex; flex-direction: column; gap: 18px; }
    .a-modal-title { font-family: var(--serif); font-size: 22px; letter-spacing: -0.01em; }
    .a-modal-field { display: flex; flex-direction: column; gap: 5px; }
    .a-modal-error { font-family: var(--mono); font-size: 10px; color: var(--red);
      background: var(--red-soft); padding: 7px 10px; display: none; }
    .a-modal-foot { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
  </style>
</head>
<body>

<div class="a-bar">
  <button class="a-sidebar-toggle" id="btn-sidebar-toggle" aria-label="Toggle client list">☰</button>
  <div class="a-bar__brand">
    <img src="/img/icon.webp" alt=""/>
    MaxCyberSolutions
    <span class="a-bar__badge">Admin</span>
  </div>
  <div class="a-bar__right">
    <button class="a-bar__link" id="btn-manage-icons" style="background:none;border:none;cursor:pointer">Icons ⊕</button>
    <button class="a-bar__link" id="btn-toggle-metrics" style="background:none;border:none;cursor:pointer">Metrics</button>
    <a class="a-bar__link" href="/dashboard/">Dashboard ↗</a>
    <span class="a-bar__email" id="admin-email"></span>
    <button class="a-bar__logout" id="btn-logout">Sign out</button>
  </div>
</div>

<!-- Icons management modal -->
<div class="a-modal-overlay" id="icons-modal" onclick="if(event.target.id==='icons-modal')closeModal('icons-modal')">
  <div class="a-modal-box" style="width:min(720px,96vw);max-height:85vh;display:flex;flex-direction:column">
    <div class="a-modal-title" style="flex-shrink:0">Icon Library</div>
    <p style="font-size:12px;color:#5a6060;margin:-6px 0 10px;flex-shrink:0">Upload icons (PNG, SVG, WebP) that your clients can use on their floating buttons.</p>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-shrink:0">
      <button class="btn-solid" id="btn-icon-upload" style="padding:7px 16px;font-size:11px">+ Upload icon</button>
      <input type="file" id="icon-upload-input" accept="image/png,image/svg+xml,image/webp,image/jpeg,image/gif" style="display:none" multiple />
    </div>
    <div id="icon-grid" style="flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;padding:4px"></div>
    <div class="a-modal-foot" style="flex-shrink:0">
      <button class="btn-danger" style="padding:8px 16px" onclick="closeModal('icons-modal')">Close</button>
    </div>
  </div>
</div>

<div class="a-sidebar-overlay" id="a-sidebar-overlay" onclick="closeSidebar()"></div>
<div class="a-layout">
  <aside class="a-sidebar" id="a-sidebar">
    <div class="a-sidebar__head">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div class="a-sidebar__heading" style="margin-bottom:0">Clients</div>
        <button class="btn-solid" id="btn-new-client" style="padding:6px 14px;font-size:9px">+ New</button>
      </div>
      <input class="a-sidebar__search" id="client-search" type="search" placeholder="Search by name, email…"/>
    </div>
    <div id="client-list">
      <div class="empty-msg">Loading…</div>
    </div>
  </aside>

  <main id="admin-detail">
    <div class="detail-empty">Select a client from the list</div>
  </main>

  <!-- Metrics panel (hidden until toggled) -->
  <div class="metrics-panel" id="metrics-panel">
    <div style="margin-bottom:28px">
      <p style="font-family:var(--mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:6px">Platform Overview</p>
      <h2 style="font-family:var(--serif);font-size:28px;letter-spacing:-.02em">Metrics</h2>
    </div>
    <div class="metrics-grid" id="metrics-tiles"></div>
    <div class="metrics-section">
      <div class="metrics-section__title">Orders by status</div>
      <div id="metrics-by-status"></div>
    </div>
    <div class="metrics-section">
      <div class="metrics-section__title">Stores by type</div>
      <div id="metrics-by-type"></div>
    </div>
    <div class="metrics-section">
      <div class="metrics-section__title">Top stores (by revenue)</div>
      <table class="metrics-table" id="metrics-top-stores">
        <thead><tr><th>Store</th><th>Orders</th><th>Revenue</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="metrics-section">
      <div class="metrics-section__title">Recent orders</div>
      <table class="metrics-table" id="metrics-recent-orders">
        <thead><tr><th>Store</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div class="metrics-section">
      <div class="metrics-section__title">Email usage this month</div>
      <div id="metrics-email"></div>
    </div>
    <button class="btn-solid" style="margin-top:8px;padding:8px 18px;font-size:10px" onclick="loadMetrics()">↻ Refresh</button>
  </div>
</div>

<!-- ── Slug transfer modal ── -->
<div class="a-modal-overlay" id="transfer-modal" onclick="if(event.target.id==='transfer-modal')closeModal('transfer-modal')">
  <div class="a-modal-box" style="width:min(540px,96vw)">
    <div class="a-modal-title">Transfer Website</div>
    <p style="font-size:13px;color:#5a6060;margin:-6px 0 4px">Move this website to another client account.</p>
    <div class="a-modal-field">
      <label>Target client</label>
      <select id="tr-target-owner" style="width:100%;padding:8px 10px;border:1px solid #d0cac0;font-size:13px">
        <option value="">— select a client —</option>
      </select>
    </div>
    <div class="a-modal-field">
      <label>Transfer type</label>
      <select id="tr-type" style="width:100%;padding:8px 10px;border:1px solid #d0cac0;font-size:13px">
        <option value="complete">Complete — move entire website (data, products, images)</option>
        <option value="partial">Partial — give slug only (target gets empty store; original keeps data with a temp slug)</option>
      </select>
    </div>
    <div class="a-modal-error" id="tr-error"></div>
    <div class="a-modal-foot">
      <button class="btn-danger" style="padding:8px 16px" onclick="closeModal('transfer-modal')">Cancel</button>
      <button class="btn-solid" id="btn-tr-submit" onclick="submitTransfer()">Transfer</button>
    </div>
  </div>
</div>

<!-- ── New client modal ── -->
<div class="a-modal-overlay" id="new-client-modal" onclick="if(event.target.id==='new-client-modal')closeModal('new-client-modal')">
  <div class="a-modal-box">
    <div class="a-modal-title">New Client</div>
    <div class="a-modal-field">
      <label>Full name (optional)</label>
      <input id="nc-name" type="text" placeholder="Jane Doe" />
    </div>
    <div class="a-modal-field">
      <label>Email *</label>
      <input id="nc-email" type="email" placeholder="client@email.com" />
    </div>
    <div class="a-modal-field">
      <label>Password *</label>
      <input id="nc-password" type="password" placeholder="Min. 6 characters" autocomplete="new-password" />
    </div>
    <div class="a-modal-error" id="nc-error"></div>
    <div class="a-modal-foot">
      <button class="btn-danger" style="padding:8px 16px" onclick="closeModal('new-client-modal')">Cancel</button>
      <button class="btn-solid" id="btn-nc-submit" onclick="submitNewClient()">Create client</button>
    </div>
  </div>
</div>

<script>
  (function() {
    var sidebar  = document.getElementById('a-sidebar');
    var overlay  = document.getElementById('a-sidebar-overlay');
    var toggle   = document.getElementById('btn-sidebar-toggle');
    function openSidebar()  { sidebar.classList.add('open'); overlay.classList.add('open'); }
    window.closeSidebar = function() { sidebar.classList.remove('open'); overlay.classList.remove('open'); }
    if (toggle) toggle.addEventListener('click', function() {
      sidebar.classList.contains('open') ? window.closeSidebar() : openSidebar();
    });
    // Close sidebar when a client card is tapped on mobile
    document.addEventListener('click', function(e) {
      if (e.target.closest && e.target.closest('.client-card') && window.innerWidth <= 720) {
        window.closeSidebar();
      }
    });
  })();
</script>
<script src="/js/admin.js?v=20260719a"></script>
</body>
</html>`;

export async function onRequest() {
  return new Response(HTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
