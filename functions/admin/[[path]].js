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
    .btn-status--archive { color: var(--ink-faint); border-color: var(--ink-faint); }
    .btn-status--archive:hover { background: var(--ink-faint); color: var(--cream); }

    /* Misc */
    .empty-msg { font-family: var(--serif); font-style: italic;
      font-size: 15px; color: var(--ink-faint); padding: 20px 14px; }
  </style>
</head>
<body>

<div class="a-bar">
  <div class="a-bar__brand">
    <img src="/img/icon.webp" alt=""/>
    MaxCyberSolutions
    <span class="a-bar__badge">Admin</span>
  </div>
  <div class="a-bar__right">
    <a class="a-bar__link" href="/dashboard/">Dashboard ↗</a>
    <span class="a-bar__email" id="admin-email"></span>
    <button class="a-bar__logout" id="btn-logout">Sign out</button>
  </div>
</div>

<div class="a-layout">
  <aside class="a-sidebar">
    <div class="a-sidebar__head">
      <div class="a-sidebar__heading">Clients</div>
      <input class="a-sidebar__search" id="client-search" type="search" placeholder="Search by name, email…"/>
    </div>
    <div id="client-list">
      <div class="empty-msg">Loading…</div>
    </div>
  </aside>

  <main id="admin-detail">
    <div class="detail-empty">Select a client from the list</div>
  </main>
</div>

<script src="/js/admin.js"></script>
</body>
</html>`;

export async function onRequest() {
  return new Response(HTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
