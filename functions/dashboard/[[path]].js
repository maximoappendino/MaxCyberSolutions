// Serves the dashboard SPA for all /dashboard/* routes.
// Auth is checked client-side against /api/me; this keeps the function simple
// and avoids a round-trip D1 query on every page navigation.

const DASHBOARD_HTML = `<!DOCTYPE html>
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
      --accent: #e2a14a; --accent-soft: rgba(226,161,74,.14);
      --cream: #efeae0; --ink: #1c1a16;
      --ink-soft: #45403a; --ink-faint: #7a736a;
      --rule: #d4cdbd; --rule-soft: #e2dccd;
      --bg: var(--cream); --fg: var(--ink);
      --fg-soft: var(--ink-soft); --fg-faint: var(--ink-faint);
      --line: var(--rule); --line-soft: var(--rule-soft);
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans:  "DM Sans", sans-serif;
      --mono:  "JetBrains Mono", monospace;
      --pad:   clamp(20px, 4vw, 64px);
    }
    [data-dark="true"] {
      --bg: #0c0a07; --fg: #efeae0;
      --fg-soft: #b9b3a6; --fg-faint: #7a736a;
      --line: #2a2620; --line-soft: #1a1813;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0;
      background: var(--bg); color: var(--fg);
      font-family: var(--sans); font-size: 15px; line-height: 1.5;
      -webkit-font-smoothing: antialiased; }
    body { overflow-x: hidden; }
    a { color: var(--fg); }
    ::selection { background: var(--accent); color: #fff; }
    button { cursor: pointer; }
    input, textarea, select {
      font-family: var(--sans); font-size: 14px; color: var(--fg);
      background: transparent; border: 1px solid var(--line);
      padding: 10px 14px; outline: none; width: 100%;
      transition: border-color 160ms ease;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--accent); }
    label { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint);
      display: block; margin-bottom: 6px; }

    /* ── Layout ── */
    .d-bar {
      position: sticky; top: 0; z-index: 40;
      padding: 0 var(--pad);
      background: color-mix(in srgb, var(--bg) 85%, transparent);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--line-soft);
      display: flex; justify-content: space-between; align-items: center;
      height: 60px;
    }
    .d-bar__brand {
      font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase;
      display: flex; align-items: center; gap: 10px;
    }
    .d-bar__brand img { width: 32px; height: 32px; object-fit: contain; }
    .d-bar__right { display: flex; align-items: center; gap: 16px; }
    .d-bar__email { font-family: var(--mono); font-size: 10px;
      color: var(--fg-faint); letter-spacing: 0.08em; }
    .d-bar__logout {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 8px 14px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-faint);
      transition: color 160ms ease, border-color 160ms ease;
    }
    .d-bar__logout:hover { color: var(--fg); border-color: var(--fg); }

    .d-content { max-width: 1200px; margin: 0 auto; padding: var(--pad); }

    /* ── Screens ── */
    .screen { display: none; }
    .screen.active { display: block; }

    /* ── Login ── */
    .login-wrap {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: var(--pad);
    }
    .login-box {
      width: 100%; max-width: 440px;
      border: 1px solid var(--line); padding: 48px;
      display: flex; flex-direction: column; gap: 32px;
    }
    .login-box__head { display: flex; flex-direction: column; gap: 8px; }
    .login-box__tag { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); }
    .login-box__title { font-family: var(--serif);
      font-size: clamp(36px, 6vw, 60px); letter-spacing: -0.02em;
      line-height: 1; margin: 0; }
    .login-box__subtitle { font-family: var(--serif); font-style: italic;
      font-size: 17px; color: var(--fg-soft); margin: 0; }
    .login-tabs { display: flex; border-bottom: 1px solid var(--line); }
    .login-tab {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 10px 16px; border: none;
      background: transparent; color: var(--fg-faint);
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: color 160ms ease;
    }
    .login-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .login-form { display: flex; flex-direction: column; gap: 18px; }
    .login-form__field { display: flex; flex-direction: column; gap: 0; }
    .login-submit {
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 14px 24px;
      background: var(--fg); color: var(--bg); border: none;
      transition: opacity 160ms ease;
    }
    .login-submit:hover { opacity: 0.85; }
    .login-submit:disabled { opacity: 0.45; cursor: wait; }
    .login-msg { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.12em; min-height: 1.4em; }
    .login-msg.error { color: #b33; }
    .login-msg.success { color: var(--accent); }

    /* ── Section head ── */
    .sec-head { margin-bottom: 40px; }
    .sec-head__tag { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .sec-head__title { font-family: var(--serif);
      font-size: clamp(36px, 5vw, 60px); letter-spacing: -0.02em; margin: 0; }

    /* ── Stores list ── */
    .stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 48px; }
    .store-card {
      border: 1px solid var(--line); padding: 24px;
      display: flex; flex-direction: column; gap: 12px;
      background: var(--bg); transition: background 200ms ease; cursor: pointer;
    }
    .store-card:hover { background: var(--accent-soft); border-color: var(--accent); }
    .store-card__slug { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .store-card__name { font-family: var(--serif); font-size: 24px; letter-spacing: -0.01em; }
    .store-card__meta { font-family: var(--mono); font-size: 10px;
      color: var(--fg-faint); letter-spacing: 0.08em; }
    .store-card__actions { display: flex; gap: 10px; margin-top: auto; }
    .btn-ghost {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 8px 14px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-soft);
      transition: color 160ms ease, border-color 160ms ease;
    }
    .btn-ghost:hover { color: var(--fg); border-color: var(--fg); }
    .btn-ghost--danger:hover { color: #b33; border-color: #b33; }
    .btn-solid {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 10px 18px;
      background: var(--fg); color: var(--bg); border: 1px solid var(--fg);
      transition: opacity 160ms ease;
    }
    .btn-solid:hover { opacity: 0.85; }
    .btn-solid:disabled { opacity: 0.45; cursor: wait; }
    .btn-accent {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; padding: 10px 18px;
      background: var(--accent); color: #fff; border: 1px solid var(--accent);
      transition: opacity 160ms ease;
    }
    .btn-accent:hover { opacity: 0.85; }

    /* ── New store form ── */
    .new-store-form {
      border: 1px solid var(--line); padding: 32px;
      display: flex; flex-direction: column; gap: 20px;
      max-width: 520px;
    }
    .new-store-form__title { font-family: var(--serif); font-size: 26px;
      letter-spacing: -0.01em; margin: 0; }
    .form-row { display: flex; gap: 12px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }

    /* ── Store detail ── */
    .store-detail__back {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--fg-faint);
      background: none; border: none; padding: 0; margin-bottom: 32px;
      display: inline-flex; align-items: center; gap: 8px;
      transition: color 160ms ease;
    }
    .store-detail__back:hover { color: var(--fg); }
    .store-detail__back::before { content: "←"; }
    .store-detail__header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 24px; margin-bottom: 40px; flex-wrap: wrap;
    }
    .store-detail__title { font-family: var(--serif);
      font-size: clamp(32px, 5vw, 60px); letter-spacing: -0.02em; margin: 0; }
    .store-detail__slug  { font-family: var(--mono); font-size: 10px;
      color: var(--fg-faint); letter-spacing: 0.12em; margin-top: 6px; }
    .store-detail__preview {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--fg-faint); text-decoration: none;
      border-bottom: 1px solid var(--line); padding-bottom: 2px;
      transition: color 160ms ease, border-color 160ms ease;
    }
    .store-detail__preview:hover { color: var(--accent); border-color: var(--accent); }

    /* ── Feature flags ── */
    .flags-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px; margin-bottom: 40px; }
    .flag-card {
      border: 1px solid var(--line); padding: 18px 20px;
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .flag-card__info { display: flex; flex-direction: column; gap: 4px; }
    .flag-card__name { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.14em; text-transform: uppercase; }
    .flag-card__desc { font-size: 12px; color: var(--fg-faint); }
    .toggle {
      position: relative; width: 44px; height: 24px; flex-shrink: 0;
    }
    .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle__track {
      position: absolute; inset: 0; border-radius: 12px;
      background: var(--line); transition: background 220ms ease; cursor: pointer;
    }
    .toggle input:checked + .toggle__track { background: var(--accent); }
    .toggle__thumb {
      position: absolute; left: 3px; top: 3px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #fff; transition: transform 220ms ease; pointer-events: none;
    }
    .toggle input:checked ~ .toggle__thumb { transform: translateX(20px); }

    /* ── Config panel ── */
    .config-panel { border: 1px solid var(--line); padding: 28px;
      display: flex; flex-direction: column; gap: 20px; max-width: 520px; margin-bottom: 48px; }
    .config-panel__title { font-family: var(--serif); font-size: 22px;
      letter-spacing: -0.01em; margin: 0; }

    /* ── Products table ── */
    .products-toolbar {
      display: flex; justify-content: space-between; align-items: center;
      gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .products-toolbar__title { font-family: var(--serif); font-size: 26px;
      letter-spacing: -0.01em; margin: 0; }
    .products-list { border-top: 1px solid var(--line); }
    .product-row {
      border-bottom: 1px solid var(--line-soft);
      padding: 16px 0; display: grid;
      grid-template-columns: 1fr 2fr 1fr 100px 80px;
      gap: 16px; align-items: center;
    }
    .product-row--head {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--fg-faint);
      border-bottom: 1px solid var(--line); padding-bottom: 10px;
    }
    .product-row__sku   { font-family: var(--mono); font-size: 11px; color: var(--fg-faint); }
    .product-row__name  { font-family: var(--serif); font-size: 16px; }
    .product-row__price { font-family: var(--serif); font-size: 18px; }
    .product-row__stock { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.1em; text-transform: uppercase; }
    .product-row__stock--yes { color: var(--accent); }
    .product-row__stock--no  { color: #b33; }
    .product-row__actions { display: flex; gap: 8px; }
    .product-row__btn {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 6px 10px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-faint);
      transition: color 160ms ease, border-color 160ms ease;
    }
    .product-row__btn:hover { color: var(--fg); border-color: var(--fg); }
    .product-row__btn--del:hover { color: #b33; border-color: #b33; }

    /* ── Product form modal ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
      padding: 24px; opacity: 0; pointer-events: none; transition: opacity 300ms ease;
    }
    .modal-overlay.active { opacity: 1; pointer-events: auto; }
    .modal-box {
      background: var(--bg); border: 1px solid var(--line);
      width: 100%; max-width: 580px; padding: 40px;
      display: flex; flex-direction: column; gap: 24px;
      max-height: calc(100vh - 48px); overflow-y: auto;
    }
    .modal-box__head { display: flex; justify-content: space-between; align-items: baseline; }
    .modal-box__title { font-family: var(--serif); font-size: 28px; letter-spacing: -0.01em; margin: 0; }
    .modal-close {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; background: none; border: none;
      color: var(--fg-faint); transition: color 160ms ease;
    }
    .modal-close:hover { color: var(--fg); }
    .modal-form { display: flex; flex-direction: column; gap: 16px; }
    .modal-form__actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }

    /* ── Empty ── */
    .empty-msg { font-family: var(--serif); font-style: italic;
      font-size: 20px; color: var(--fg-soft); padding: 40px 0; }
    .status-msg { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.12em; padding: 8px 0; min-height: 1.4em; }
    .status-msg.error { color: #b33; }
    .status-msg.success { color: var(--accent); }

    @media (max-width: 700px) {
      .product-row { grid-template-columns: 1fr 1fr; }
      .product-row__sku, .product-row--head .product-row__stock { display: none; }
    }
  </style>
</head>
<body>
  <!-- ── Auth bar (hidden until logged in) ────────────────────────── -->
  <div class="d-bar" id="d-bar" style="display:none">
    <div class="d-bar__brand">
      <img src="/img/icon.webp" alt="" />
      MaxCyberSolutions Dashboard
    </div>
    <div class="d-bar__right">
      <span class="d-bar__email" id="d-email"></span>
      <button class="d-bar__logout" id="d-logout">Sign out</button>
    </div>
  </div>

  <!-- ── Login screen ─────────────────────────────────────────────── -->
  <div class="screen active" id="screen-login">
    <div class="login-wrap">
      <div class="login-box">
        <div class="login-box__head">
          <span class="login-box__tag">MaxCyberSolutions</span>
          <h1 class="login-box__title">Dashboard.</h1>
          <p class="login-box__subtitle">Sign in to manage your stores.</p>
        </div>
        <div class="login-tabs">
          <button class="login-tab active" data-tab="signin">Sign in</button>
          <button class="login-tab" data-tab="register">Register</button>
        </div>
        <form class="login-form" id="login-form">
          <div class="login-form__field">
            <label for="login-email">Email</label>
            <input id="login-email" type="email" required autocomplete="email" />
          </div>
          <div class="login-form__field">
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
      <div class="new-store-form" id="new-store-form">
        <h3 class="new-store-form__title">Create a store</h3>
        <div class="form-row">
          <div class="form-field">
            <label for="ns-slug">Slug (URL identifier)</label>
            <input id="ns-slug" type="text" placeholder="my-store" pattern="[a-z0-9-]{2,48}" required />
          </div>
          <div class="form-field">
            <label for="ns-name">Store name</label>
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

  <!-- ── Store detail screen ──────────────────────────────────────── -->
  <div class="screen" id="screen-detail">
    <div class="d-content">
      <button class="store-detail__back" id="detail-back">Stores</button>
      <div class="store-detail__header">
        <div>
          <h2 class="store-detail__title" id="detail-name"></h2>
          <p class="store-detail__slug" id="detail-slug-label"></p>
        </div>
        <a class="store-detail__preview" id="detail-preview" target="_blank" rel="noopener">Preview store ↗</a>
      </div>

      <!-- Config -->
      <div class="config-panel">
        <h3 class="config-panel__title">Store settings</h3>
        <div class="form-field">
          <label for="cfg-name">Display name</label>
          <input id="cfg-name" type="text" />
        </div>
        <div class="form-field">
          <label for="cfg-desc">SEO description</label>
          <input id="cfg-desc" type="text" />
        </div>
        <div class="form-field">
          <label for="cfg-accent">Accent colour</label>
          <input id="cfg-accent" type="color" style="height:42px;padding:4px 8px;" />
        </div>
        <div>
          <button class="btn-solid" id="cfg-save">Save settings</button>
          <p class="status-msg" id="cfg-msg"></p>
        </div>
      </div>

      <!-- Feature flags -->
      <div class="sec-head" style="margin-bottom:16px">
        <p class="sec-head__tag">Feature flags</p>
      </div>
      <div class="flags-grid" id="flags-grid"></div>

      <!-- Products -->
      <div class="products-toolbar">
        <h3 class="products-toolbar__title">Products</h3>
        <button class="btn-accent" id="btn-new-product">+ New product</button>
      </div>
      <p class="status-msg" id="products-msg"></p>
      <div class="product-row product-row--head">
        <span>SKU</span><span>Name</span><span>Price</span><span>Stock</span><span></span>
      </div>
      <div class="products-list" id="products-list"></div>
    </div>
  </div>

  <!-- ── Product form modal ────────────────────────────────────────── -->
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
            <label class="toggle" style="margin-top:10px">
              <input type="checkbox" id="pm-stock" checked />
              <span class="toggle__track"></span>
              <span class="toggle__thumb"></span>
            </label>
          </div>
        </div>
        <div class="form-field">
          <label for="pm-meta">Metadata (JSON, optional)</label>
          <textarea id="pm-meta" rows="2" placeholder='{"color":"red","size":"M"}' style="resize:vertical;font-family:var(--mono);font-size:12px"></textarea>
        </div>
        <div class="modal-form__actions">
          <button type="button" class="btn-ghost" id="pm-cancel">Cancel</button>
          <button type="submit" class="btn-solid" id="pm-submit">Save product</button>
        </div>
        <p class="status-msg" id="pm-msg"></p>
      </form>
    </div>
  </div>

  <script src="/js/dashboard.js"></script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(DASHBOARD_HTML, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
