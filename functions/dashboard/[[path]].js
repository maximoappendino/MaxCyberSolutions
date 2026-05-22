// Serves the dashboard SPA for all /dashboard/* routes.

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard — MaxCyberSolutions</title>
  <link rel="icon" href="/img/icon.webp" type="image/webp" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --accent: #e2a14a; --accent-soft: rgba(226,161,74,.13);
      --cream: #efeae0; --ink: #1c1a16;
      --ink-soft: #45403a; --ink-faint: #7a736a;
      --rule: #d4cdbd; --rule-soft: #e2dccd;
      --bg: var(--cream); --fg: var(--ink);
      --fg-soft: var(--ink-soft); --fg-faint: var(--ink-faint);
      --line: var(--rule); --line-soft: var(--rule-soft);
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans:  "DM Sans", sans-serif;
      --mono:  "JetBrains Mono", monospace;
      --bar-h: 56px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg);
      font-family: var(--sans); font-size: 14px; line-height: 1.5;
      -webkit-font-smoothing: antialiased; height: 100%; }
    a { color: var(--fg); }
    ::selection { background: var(--accent); color: #fff; }
    button { cursor: pointer; font-family: var(--sans); }
    input, textarea, select {
      font-family: var(--sans); font-size: 13px; color: var(--fg);
      background: transparent; border: 1px solid var(--line);
      padding: 8px 12px; outline: none; width: 100%;
      transition: border-color 160ms ease;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--accent); }
    label { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.13em; text-transform: uppercase; color: var(--fg-faint);
      display: block; margin-bottom: 5px; }

    /* ── Buttons ── */
    .btn-ghost {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.13em;
      text-transform: uppercase; padding: 8px 14px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-soft);
      transition: color 160ms ease, border-color 160ms ease;
    }
    .btn-ghost:hover { color: var(--fg); border-color: var(--fg); }
    .btn-ghost--danger:hover { color: #b33; border-color: #b33; }
    .btn-sm { padding: 6px 11px; font-size: 9px; }
    .btn-solid {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.13em;
      text-transform: uppercase; padding: 10px 18px;
      background: var(--fg); color: var(--bg); border: 1px solid var(--fg);
      transition: opacity 160ms ease;
    }
    .btn-solid:hover { opacity: 0.82; }
    .btn-solid:disabled { opacity: 0.42; cursor: wait; }
    .btn-accent {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.13em;
      text-transform: uppercase; padding: 10px 18px;
      background: var(--accent); color: #fff; border: 1px solid var(--accent);
      transition: opacity 160ms ease;
    }
    .btn-accent:hover { opacity: 0.85; }
    .btn-push {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 8px 20px;
      background: #1c6b3a; color: #fff; border: 1px solid #1c6b3a;
      transition: opacity 160ms ease;
    }
    .btn-push:hover    { opacity: 0.85; }
    .btn-push:disabled { opacity: 0.45; cursor: wait; }

    /* ── Top bar ── */
    .d-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: var(--bar-h); padding: 0 20px;
      background: color-mix(in srgb, var(--bg) 92%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--line-soft);
      display: flex; align-items: center; gap: 12px;
    }
    .d-bar__brand { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.16em; text-transform: uppercase;
      display: flex; align-items: center; gap: 8px; white-space: nowrap; }
    .d-bar__brand img { width: 28px; height: 28px; object-fit: contain; }
    .d-bar__sep { color: var(--fg-faint); }
    .d-bar__store { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.12em; text-transform: uppercase; }
    .d-bar__dirty { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.1em; color: var(--accent); }
    .d-bar__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .d-bar__right   { display: flex; align-items: center; gap: 10px; margin-left: 12px; }
    .d-bar__email   { font-family: var(--mono); font-size: 10px; color: var(--fg-faint); }
    .d-bar__logout  {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 6px 12px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-faint);
      transition: color 160ms ease, border-color 160ms ease;
    }
    .d-bar__logout:hover { color: var(--fg); border-color: var(--fg); }

    /* ── Screens ── */
    .screen { display: none; padding-top: var(--bar-h); }
    .screen.active { display: block; }
    #screen-editor { padding-top: 0; }

    /* ── Login ── */
    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .login-box  { width: 100%; max-width: 420px; border: 1px solid var(--line); padding: 48px;
      display: flex; flex-direction: column; gap: 28px; }
    .login-box__tag   { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); }
    .login-box__title { font-family: var(--serif);
      font-size: clamp(36px,6vw,60px); letter-spacing: -0.02em; line-height: 1; margin: 0; }
    .login-box__sub   { font-family: var(--serif); font-style: italic;
      font-size: 17px; color: var(--fg-soft); margin: 0; }
    .login-tabs { display: flex; border-bottom: 1px solid var(--line); }
    .login-tab  { font-family: var(--mono); font-size: 10px; letter-spacing: 0.13em;
      text-transform: uppercase; padding: 9px 14px; border: none; background: transparent;
      color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 160ms ease; }
    .login-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .login-form  { display: flex; flex-direction: column; gap: 16px; }
    .login-field { display: flex; flex-direction: column; gap: 0; }
    .login-submit {
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 13px 22px;
      background: var(--fg); color: var(--bg); border: none; transition: opacity 160ms ease;
    }
    .login-submit:hover    { opacity: 0.85; }
    .login-submit:disabled { opacity: 0.42; cursor: wait; }
    .login-msg { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; min-height: 1.4em; }
    .login-msg.error   { color: #b33; }
    .login-msg.success { color: var(--accent); }

    /* ── Section head ── */
    .d-content { max-width: 1100px; margin: 0 auto; padding: 40px clamp(20px,4vw,60px); }
    .sec-head { margin-bottom: 36px; }
    .sec-head__tag { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 10px; }
    .sec-head__title { font-family: var(--serif);
      font-size: clamp(32px,5vw,56px); letter-spacing: -0.02em; margin: 0; }

    /* ── Stores grid ── */
    .stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr));
      gap: 14px; margin-bottom: 48px; }
    .store-card { border: 1px solid var(--line); padding: 22px;
      display: flex; flex-direction: column; gap: 10px;
      transition: background 200ms ease, border-color 200ms ease; }
    .store-card:hover { background: var(--accent-soft); border-color: var(--accent); }
    .store-card__slug { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .store-card__name { font-family: var(--serif); font-size: 22px; letter-spacing: -0.01em; }
    .store-card__actions { display: flex; gap: 8px; margin-top: 4px; }

    /* ── Create store form ── */
    .new-store-form { border: 1px solid var(--line); padding: 28px;
      display: flex; flex-direction: column; gap: 16px; max-width: 480px; }
    .new-store-form__title { font-family: var(--serif); font-size: 22px;
      letter-spacing: -0.01em; margin: 0; }
    .form-row   { display: flex; gap: 10px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .status-msg { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.1em; padding: 6px 0; min-height: 1.4em; }
    .status-msg.error   { color: #b33; }
    .status-msg.success { color: var(--accent); }
    .empty-msg { font-family: var(--serif); font-style: italic;
      font-size: 18px; color: var(--fg-soft); padding: 32px 0; }

    /* ════════════════════════════════════════════════════════════════
       EDITOR LAYOUT
    ════════════════════════════════════════════════════════════════ */
    .editor-wrap {
      display: flex;
      height: 100vh;
      padding-top: var(--bar-h);
      overflow: hidden;
    }

    /* Left panel */
    .editor-left {
      width: 360px; flex-shrink: 0;
      border-right: 1px solid var(--line);
      display: flex; flex-direction: column;
      overflow: hidden; background: var(--bg);
    }

    /* Editor tabs */
    .etabs { display: flex; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .etab  {
      flex: 1; font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 11px 6px; border: none; background: transparent;
      color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 160ms ease;
    }
    .etab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .etab-pane { display: none; flex: 1; overflow-y: auto; }
    .etab-pane.active { display: flex; flex-direction: column; }

    /* Design tab */
    .design-pane { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
    .pane-section { display: flex; flex-direction: column; gap: 10px; }
    .pane-section__label { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.16em; text-transform: uppercase; color: var(--fg-faint);
      padding-bottom: 6px; border-bottom: 1px solid var(--line-soft); }

    /* Logo upload */
    .logo-field { display: flex; align-items: center; gap: 10px; }
    .logo-thumb  { width: 48px; height: 48px; object-fit: contain;
      border: 1px solid var(--line); background: var(--line-soft); }
    .logo-placeholder { width: 48px; height: 48px; display: flex; align-items: center;
      justify-content: center; border: 1px solid var(--line);
      font-family: var(--mono); font-size: 9px; color: var(--fg-faint); }

    /* Toggle */
    .toggle { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle__track { position: absolute; inset: 0; border-radius: 11px;
      background: var(--line); transition: background 200ms ease; cursor: pointer; }
    .toggle input:checked + .toggle__track { background: var(--accent); }
    .toggle__thumb { position: absolute; left: 3px; top: 3px; width: 16px; height: 16px;
      border-radius: 50%; background: #fff; transition: transform 200ms ease; pointer-events: none; }
    .toggle input:checked ~ .toggle__thumb { transform: translateX(18px); }

    /* Feature flag row */
    .flag-row { display: flex; justify-content: space-between; align-items: center;
      gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line-soft); }
    .flag-row:last-child { border-bottom: none; }
    .flag-row__info { display: flex; flex-direction: column; gap: 2px; }
    .flag-row__name { font-size: 12px; }
    .flag-row__desc { font-size: 11px; color: var(--fg-faint); }

    /* Sections tab */
    .sections-pane { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
    .sec-list { flex: 1; overflow-y: auto; }
    .sec-item {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; border-bottom: 1px solid var(--line-soft);
      transition: background 160ms ease; cursor: pointer;
    }
    .sec-item:hover    { background: var(--accent-soft); }
    .sec-item.active   { background: var(--accent-soft); }
    .sec-item.drag-over { border-top: 2px solid var(--accent); }
    .sec-item__drag  { cursor: grab; color: var(--fg-faint); font-size: 14px;
      padding: 2px; user-select: none; flex-shrink: 0; }
    .sec-item__icon  { font-size: 13px; color: var(--accent); flex-shrink: 0; }
    .sec-item__label { flex: 1; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sec-item__btns  { display: flex; gap: 4px; flex-shrink: 0; }
    .sec-item__btn   { font-family: var(--mono); font-size: 10px; padding: 3px 7px;
      border: 1px solid transparent; background: transparent; color: var(--fg-faint);
      transition: color 160ms ease, border-color 160ms ease; }
    .sec-item__btn:hover        { color: var(--fg); border-color: var(--line); }
    .sec-item__btn--del:hover   { color: #b33; border-color: #b33; }

    .sec-add-wrap { padding: 10px 12px; border-bottom: 1px solid var(--line); position: relative; }
    .sec-add-menu {
      position: absolute; left: 12px; right: 12px; bottom: calc(100% + 4px);
      background: var(--bg); border: 1px solid var(--line);
      box-shadow: 0 8px 32px rgba(0,0,0,.12); z-index: 10;
    }
    .sec-add-menu__item {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      font-size: 13px; cursor: pointer; border-bottom: 1px solid var(--line-soft);
      transition: background 140ms ease;
    }
    .sec-add-menu__item:last-child { border-bottom: none; }
    .sec-add-menu__item:hover      { background: var(--accent-soft); }
    .sec-add-menu__icon { font-size: 15px; }
    .sec-add-menu__desc { font-size: 11px; color: var(--fg-faint); }

    /* Section editor */
    .sec-editor { border-top: 2px solid var(--accent); background: var(--bg);
      display: flex; flex-direction: column; overflow: hidden; max-height: 55%; }
    .sec-editor__head { display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .sec-editor__title { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
    .sec-editor__close { font-family: var(--mono); font-size: 10px; background: none;
      border: none; color: var(--fg-faint); padding: 2px 6px; transition: color 160ms ease; }
    .sec-editor__close:hover { color: var(--fg); }
    .sec-editor__fields { padding: 12px; display: flex; flex-direction: column;
      gap: 12px; overflow-y: auto; }

    /* Image upload field */
    .img-field { display: flex; flex-direction: column; gap: 6px; }
    .img-field__row { display: flex; align-items: center; gap: 8px; }
    .img-thumb { width: 56px; height: 42px; object-fit: cover;
      border: 1px solid var(--line); background: var(--line-soft); }
    .img-placeholder { width: 56px; height: 42px; display: flex; align-items: center;
      justify-content: center; border: 1px solid var(--line);
      font-size: 18px; color: var(--fg-faint); background: var(--line-soft); }

    /* Gallery images list */
    .gallery-row { display: flex; align-items: center; gap: 6px;
      padding: 6px 0; border-bottom: 1px solid var(--line-soft); }
    .gallery-thumb { width: 40px; height: 32px; object-fit: cover;
      border: 1px solid var(--line); flex-shrink: 0; }
    .gallery-row input { flex: 1; padding: 5px 8px; font-size: 12px; }

    /* Field group */
    .field-group { border: 1px solid var(--line-soft); padding: 10px;
      display: flex; flex-direction: column; gap: 8px; }
    .field-group__label { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint); }

    /* Products tab */
    .products-pane { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
    .product-row {
      border-bottom: 1px solid var(--line-soft); padding: 10px 0;
      display: grid; grid-template-columns: 44px 1fr 70px 50px;
      gap: 8px; align-items: center;
    }
    .product-row--head { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint);
      border-bottom: 1px solid var(--line); padding-bottom: 8px; }
    .product-row__thumb { width: 40px; height: 32px; object-fit: cover;
      border: 1px solid var(--line); background: var(--line-soft); }
    .product-row__name  { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .product-row__price { font-family: var(--serif); font-size: 14px; }
    .product-row__btns  { display: flex; gap: 4px; }
    .product-row__btn   { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
      text-transform: uppercase; padding: 4px 8px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-faint);
      transition: color 160ms ease, border-color 160ms ease; }
    .product-row__btn:hover       { color: var(--fg); border-color: var(--fg); }
    .product-row__btn--del:hover  { color: #b33; border-color: #b33; }

    /* Right panel — preview */
    .editor-right {
      flex: 1; display: flex; flex-direction: column;
      background: #111; overflow: hidden;
    }
    .preview-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 14px; background: #1a1a1a; border-bottom: 1px solid #333;
      flex-shrink: 0;
    }
    .preview-label { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.16em; text-transform: uppercase; color: #888; }
    .preview-actions { display: flex; align-items: center; gap: 8px; }
    .preview-actions .btn-ghost { border-color: #444; color: #aaa; }
    .preview-actions .btn-ghost:hover { border-color: #888; color: #eee; }
    .editor-iframe { flex: 1; width: 100%; border: none; background: #fff; }

    /* ── Product modal ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
      padding: 24px; opacity: 0; pointer-events: none; transition: opacity 280ms ease;
    }
    .modal-overlay.active { opacity: 1; pointer-events: auto; }
    .modal-box {
      background: var(--bg); border: 1px solid var(--line);
      width: 100%; max-width: 560px; padding: 36px;
      display: flex; flex-direction: column; gap: 20px;
      max-height: calc(100vh - 48px); overflow-y: auto;
    }
    .modal-box__head  { display: flex; justify-content: space-between; align-items: baseline; }
    .modal-box__title { font-family: var(--serif); font-size: 26px; letter-spacing: -0.01em; margin: 0; }
    .modal-close {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
      text-transform: uppercase; background: none; border: none;
      color: var(--fg-faint); transition: color 160ms ease;
    }
    .modal-close:hover { color: var(--fg); }
    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .modal-form__actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }

    @media (max-width: 900px) {
      .editor-left { width: 300px; }
    }
    @media (max-width: 640px) {
      .editor-wrap { flex-direction: column; }
      .editor-left { width: 100%; height: 50vh; border-right: none; border-bottom: 1px solid var(--line); }
      .editor-right { height: 50vh; }
      .d-bar__email { display: none; }
    }
  </style>
</head>
<body>
  <!-- ── Top bar ──────────────────────────────────────────────────── -->
  <div class="d-bar" id="d-bar" style="display:none">
    <div class="d-bar__brand">
      <img src="/img/icon.webp" alt="" />
      MaxCyberSolutions
    </div>
    <span class="d-bar__sep" id="d-bar-sep" style="display:none">›</span>
    <span class="d-bar__store" id="d-bar-store"></span>
    <span class="d-bar__dirty"  id="d-bar-dirty"></span>

    <div class="d-bar__actions" id="d-bar-actions" style="display:none">
      <button class="btn-ghost btn-sm" id="btn-save-draft">Save Draft</button>
      <button class="btn-ghost btn-sm" id="btn-export">Export ↓</button>
      <button class="btn-ghost btn-sm" id="btn-import">Import ↑</button>
      <input type="file" id="import-file" accept=".json" style="display:none" />
    </div>

    <div class="d-bar__right">
      <button class="btn-push" id="btn-push-live" style="display:none">🚀 Push Live</button>
      <span class="d-bar__email" id="d-email"></span>
      <button class="d-bar__logout" id="d-logout">Sign out</button>
    </div>
  </div>

  <!-- ── Login screen ─────────────────────────────────────────────── -->
  <div class="screen active" id="screen-login">
    <div class="login-wrap">
      <div class="login-box">
        <div>
          <span class="login-box__tag">MaxCyberSolutions</span>
          <h1 class="login-box__title">Dashboard.</h1>
          <p class="login-box__sub">Sign in to manage your stores.</p>
        </div>
        <div class="login-tabs">
          <button class="login-tab active" data-tab="signin">Sign in</button>
          <button class="login-tab" data-tab="register">Register</button>
        </div>
        <form class="login-form" id="login-form">
          <div class="login-field">
            <label for="login-email">Email</label>
            <input id="login-email" type="email" required autocomplete="email" />
          </div>
          <div class="login-field">
            <label for="login-password">Password</label>
            <input id="login-password" type="password" required autocomplete="current-password" minlength="8" />
          </div>
          <button type="submit" class="login-submit" id="login-submit">Sign in →</button>
          <p class="login-msg" id="login-msg"></p>
        </form>
      </div>
    </div>
  </div>

  <!-- ── Stores screen ────────────────────────────────────────────── -->
  <div class="screen" id="screen-stores">
    <div class="d-content">
      <div class="sec-head">
        <p class="sec-head__tag">§ Stores</p>
        <h2 class="sec-head__title">Your storefronts.</h2>
      </div>
      <div class="stores-grid" id="stores-grid"></div>
      <div class="new-store-form">
        <h3 class="new-store-form__title">Create a store</h3>
        <div class="form-row">
          <div class="form-field">
            <label for="ns-slug">Slug (URL)</label>
            <input id="ns-slug" type="text" placeholder="my-store" pattern="[a-z0-9-]{2,48}" required />
          </div>
          <div class="form-field">
            <label for="ns-name">Name</label>
            <input id="ns-name" type="text" placeholder="My Store" />
          </div>
        </div>
        <div class="form-field">
          <label for="ns-desc">Description (optional)</label>
          <input id="ns-desc" type="text" placeholder="A short description" />
        </div>
        <div>
          <button class="btn-solid" id="ns-submit">Create store →</button>
          <p class="status-msg" id="ns-msg"></p>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Editor screen (split pane) ───────────────────────────────── -->
  <div class="screen" id="screen-editor">
    <div class="editor-wrap">

      <!-- Left: editor panel -->
      <div class="editor-left">
        <div class="etabs">
          <button class="etab active" data-tab="design">Design</button>
          <button class="etab" data-tab="sections">Sections</button>
          <button class="etab" data-tab="products">Products</button>
        </div>

        <!-- Design tab -->
        <div class="etab-pane active" id="etab-design">
          <div class="design-pane">
            <!-- Logo -->
            <div class="pane-section">
              <span class="pane-section__label">Logo</span>
              <div class="logo-field">
                <div id="logo-preview-wrap">
                  <div class="logo-placeholder" id="logo-placeholder">☰</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  <button class="btn-ghost btn-sm" id="btn-logo-upload">Upload logo</button>
                  <button class="btn-ghost btn-sm" id="btn-logo-clear" style="display:none">Clear</button>
                </div>
              </div>
            </div>

            <!-- Identity -->
            <div class="pane-section">
              <span class="pane-section__label">Identity</span>
              <div class="form-field">
                <label for="d-name">Store name</label>
                <input id="d-name" type="text" />
              </div>
              <div class="form-field">
                <label for="d-seo-title">SEO title</label>
                <input id="d-seo-title" type="text" />
              </div>
              <div class="form-field">
                <label for="d-seo-desc">SEO description</label>
                <textarea id="d-seo-desc" rows="2" style="resize:vertical"></textarea>
              </div>
            </div>

            <!-- Theme -->
            <div class="pane-section">
              <span class="pane-section__label">Colors</span>
              <div class="form-row">
                <div class="form-field">
                  <label for="d-accent">Accent</label>
                  <input id="d-accent" type="color" style="height:38px;padding:3px 6px;" />
                </div>
              </div>
            </div>

            <!-- Features -->
            <div class="pane-section">
              <span class="pane-section__label">Features</span>
              <div id="flags-list"></div>
            </div>
          </div>
        </div>

        <!-- Sections tab -->
        <div class="etab-pane" id="etab-sections">
          <div class="sections-pane">
            <div class="sec-list" id="sec-list"></div>
            <div class="sec-add-wrap">
              <button class="btn-solid btn-sm" id="sec-add-trigger" style="width:100%">+ Add Section ▾</button>
              <div class="sec-add-menu" id="sec-add-menu" style="display:none"></div>
            </div>
            <div class="sec-editor" id="sec-editor" style="display:none">
              <div class="sec-editor__head">
                <span class="sec-editor__title" id="sec-editor-title"></span>
                <button class="sec-editor__close" id="sec-editor-close">✕ close</button>
              </div>
              <div class="sec-editor__fields" id="sec-editor-fields"></div>
            </div>
          </div>
        </div>

        <!-- Products tab -->
        <div class="etab-pane" id="etab-products">
          <div class="products-pane">
            <button class="btn-accent btn-sm" id="btn-new-product">+ New product</button>
            <p class="status-msg" id="products-msg"></p>
            <div class="product-row product-row--head">
              <span></span><span>Name</span><span>Price</span><span></span>
            </div>
            <div id="products-list"></div>
          </div>
        </div>
      </div>

      <!-- Right: preview -->
      <div class="editor-right">
        <div class="preview-bar">
          <span class="preview-label">Live Preview</span>
          <div class="preview-actions">
            <button class="btn-ghost btn-sm" id="btn-preview-refresh">↻ Refresh</button>
            <a class="btn-ghost btn-sm" id="btn-preview-open" target="_blank" rel="noopener">↗ Open</a>
          </div>
        </div>
        <iframe class="editor-iframe" id="preview-iframe" src="about:blank" title="Store preview"></iframe>
      </div>
    </div>
  </div>

  <!-- ── Product modal ────────────────────────────────────────────── -->
  <div class="modal-overlay" id="product-modal">
    <div class="modal-box">
      <div class="modal-box__head">
        <h3 class="modal-box__title" id="pm-title">New product</h3>
        <button class="modal-close" id="pm-close">Close ✕</button>
      </div>
      <form class="modal-form" id="pm-form">
        <div class="form-row">
          <div class="form-field">
            <label for="pm-sku">SKU *</label>
            <input id="pm-sku" type="text" required />
          </div>
          <div class="form-field">
            <label for="pm-name">Name *</label>
            <input id="pm-name" type="text" required />
          </div>
        </div>
        <div class="form-field">
          <label for="pm-desc">Description</label>
          <textarea id="pm-desc" rows="3" style="resize:vertical"></textarea>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="pm-price">Price (cents) *</label>
            <input id="pm-price" type="number" min="0" step="1" required />
          </div>
          <div class="form-field" style="justify-content:flex-end;padding-bottom:2px">
            <label>In stock</label>
            <label class="toggle" style="margin-top:8px">
              <input type="checkbox" id="pm-stock" checked />
              <span class="toggle__track"></span>
              <span class="toggle__thumb"></span>
            </label>
          </div>
        </div>
        <div class="form-field">
          <label>Product image</label>
          <div class="img-field" id="pm-img-field">
            <div class="img-field__row">
              <div class="img-placeholder" id="pm-img-placeholder">🖼</div>
              <div style="display:flex;flex-direction:column;gap:5px">
                <button type="button" class="btn-ghost btn-sm" id="pm-img-upload">Upload image</button>
                <button type="button" class="btn-ghost btn-sm" id="pm-img-clear" style="display:none">Clear</button>
              </div>
            </div>
          </div>
          <input type="hidden" id="pm-image" />
        </div>
        <div class="form-field">
          <label for="pm-meta">Metadata (JSON)</label>
          <textarea id="pm-meta" rows="2" placeholder='{"color":"red","size":"M"}'
            style="resize:vertical;font-family:var(--mono);font-size:11px"></textarea>
        </div>
        <div class="modal-form__actions">
          <button type="button" class="btn-ghost" id="pm-cancel">Cancel</button>
          <button type="submit" class="btn-solid" id="pm-submit">Save product</button>
        </div>
        <p class="status-msg" id="pm-msg"></p>
      </form>
    </div>
  </div>

  <!-- Hidden file inputs -->
  <input type="file" id="img-upload-input" accept="image/*" style="display:none" />
  <input type="file" id="pm-img-input"     accept="image/*" style="display:none" />

  <script src="/js/dashboard.js"></script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
