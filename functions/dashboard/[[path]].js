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
      --panel-w: 360px;
      --s-radius: 0px; --s-radius-btn: 0px; --s-radius-sm: 0px;
      --s-border-w: 1px; --s-shadow: none; --s-shadow-card: none;
    }
    /* Dark mode */
    body.dark-mode {
      --cream: #1a1816; --ink: #f0ece2;
      --ink-soft: #c0b8a8; --ink-faint: #8a8278;
      --rule: #32302c; --rule-soft: #28261e;
      --accent-soft: rgba(226,161,74,.18);
    }
    /* Large text */
    body.large-text { font-size: 16px !important; }
    body.large-text input, body.large-text textarea, body.large-text select { font-size: 15px; }
    /* High contrast */
    body.high-contrast { --ink-faint: var(--ink-soft); --rule: var(--ink-faint); }
    body.high-contrast.dark-mode { --ink-faint: var(--ink-soft); }

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
    .btn-ghost:disabled { opacity: 0.4; cursor: default; }
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
    .btn-icon {
      font-family: var(--mono); font-size: 13px; padding: 6px 10px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-soft);
      transition: color 160ms ease, border-color 160ms ease; line-height: 1;
    }
    .btn-icon:hover { color: var(--fg); border-color: var(--fg); }
    .btn-icon:disabled { opacity: 0.4; cursor: default; }

    /* ── Top bar ── */
    .d-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: var(--bar-h); padding: 0 16px;
      background: color-mix(in srgb, var(--bg) 92%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--line-soft);
      display: flex; align-items: center; gap: 10px;
    }
    .d-bar__brand { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.16em; text-transform: uppercase;
      display: flex; align-items: center; gap: 8px; white-space: nowrap; }
    .d-bar__brand img { width: 28px; height: 28px; object-fit: contain; }
    .d-bar__sep   { color: var(--fg-faint); }
    .d-bar__store { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }
    .d-bar__dirty { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; color: var(--accent); }
    .d-bar__history { display: flex; align-items: center; gap: 4px; }
    .d-bar__actions { display: flex; align-items: center; gap: 6px; }
    .d-bar__right   { display: flex; align-items: center; gap: 10px; margin-left: auto; }
    .d-bar__email   { font-family: var(--mono); font-size: 10px; color: var(--fg-faint); }
    .d-bar__logout  {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 6px 12px;
      border: 1px solid var(--line); background: transparent; color: var(--fg-faint);
      transition: color 160ms ease, border-color 160ms ease;
    }
    .d-bar__logout:hover { color: var(--fg); border-color: var(--fg); }
    .d-bar__admin-link {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--accent); text-decoration: none;
      transition: opacity 150ms;
    }
    .d-bar__admin-link:hover { opacity: 0.7; }

    /* ── Screens ── */
    .screen { display: none; padding-top: var(--bar-h); }
    .screen.active { display: block; }
    #screen-editor { padding-top: 0; }

    /* ── Onboarding ── */
    .ob-wrap { min-height: calc(100vh - var(--bar-h)); display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
    .ob-card { background: var(--bg); border: 1px solid var(--line); max-width: 480px; width: 100%; padding: 40px; }
    .ob-title { font-family: var(--serif); font-size: 28px; letter-spacing: -0.01em; margin-bottom: 6px; }
    .ob-sub   { font-size: 13px; color: var(--fg-faint); margin-bottom: 24px; }
    .ob-step  { display: flex; flex-direction: column; gap: 14px; }
    .slug-row { display: flex; gap: 8px; }
    .slug-row input { flex: 1; }
    .slug-status { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; }
    .slug-hint   { font-family: var(--mono); font-size: 9px; color: var(--fg-faint); margin-top: 3px; }
    .ob-actions  { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; }

    /* ── Orders tab ── */
    .orders-pane { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
    .orders-toolbar { display: flex; gap: 6px; padding: 8px 10px; border-bottom: 1px solid var(--line-soft); flex-shrink: 0; }
    #orders-list { flex: 1; overflow-y: auto; }
    .order-row { padding: 10px 12px; border-bottom: 1px solid var(--line-soft); cursor: pointer; transition: background 150ms; }
    .order-row:hover { background: var(--bg-soft); }
    .order-row__head { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
    .order-ref   { font-family: var(--mono); font-size: 9px; color: var(--fg-faint); }
    .order-name  { font-size: 12px; font-weight: 500; flex: 1; }
    .order-amt   { font-family: var(--mono); font-size: 11px; }
    .order-badge { font-family: var(--mono); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; padding: 1px 5px; border: 1px solid; }
    .order-badge--pending          { color: #9a6200; border-color: #9a6200; }
    .order-badge--awaiting_transfer{ color: #6b4c00; border-color: #6b4c00; }
    .order-badge--paid             { color: #1c6b3a; border-color: #1c6b3a; }
    .order-badge--processing       { color: var(--accent); border-color: var(--accent); }
    .order-badge--shipped          { color: #1a50a0; border-color: #1a50a0; }
    .order-badge--delivered        { color: #1c6b3a; border-color: #1c6b3a; }
    .order-badge--cancelled        { color: var(--fg-faint); border-color: var(--fg-faint); }
    .order-date  { font-family: var(--mono); font-size: 9px; color: var(--fg-faint); }
    .order-detail { padding: 14px; background: var(--bg); border-bottom: 2px solid var(--accent); display: none; }
    .order-detail.open { display: block; }
    .order-detail__row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; border-bottom: 1px solid var(--line-soft); }
    .order-detail__key { color: var(--fg-faint); font-family: var(--mono); font-size: 9px; letter-spacing: 0.08em; }
    .order-status-sel { font-family: var(--mono); font-size: 10px; padding: 5px 8px; margin-top: 8px; width: 100%; }

    /* ── Login ── */
    .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px; }
    .login-box  { width: 100%; max-width: 420px; border: 1px solid var(--line); padding: 48px;
      display: flex; flex-direction: column; gap: 28px; }
    .login-box__tag   { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); }
    .login-box__title { font-family: var(--serif); font-size: clamp(36px,6vw,60px); letter-spacing: -0.02em; line-height: 1; margin: 0; }
    .login-box__sub   { font-family: var(--serif); font-style: italic; font-size: 17px; color: var(--fg-soft); margin: 0; }
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

    /* ── Stores screen ── */
    .d-content { max-width: 1100px; margin: 0 auto; padding: 40px clamp(20px,4vw,60px); }
    .sec-head { margin-bottom: 36px; }
    .sec-head__tag   { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 10px; }
    .sec-head__title { font-family: var(--serif); font-size: clamp(32px,5vw,56px); letter-spacing: -0.02em; margin: 0; }
    .stores-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 14px; margin-bottom: 48px; }
    .store-card { border: 1px solid var(--line); padding: 22px; display: flex; flex-direction: column; gap: 10px; transition: background 200ms, border-color 200ms; }
    .store-card:hover { background: var(--accent-soft); border-color: var(--accent); }
    .store-card__slug { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .store-card__name { font-family: var(--serif); font-size: 22px; letter-spacing: -0.01em; }
    .store-card__actions { display: flex; gap: 8px; margin-top: 4px; }
    .store-card__plan { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
      padding: 2px 7px; border: 1px solid var(--accent); color: var(--accent); display: inline-block; width: fit-content; }

    /* Plan banner */
    .plan-banner { display: flex; align-items: center; gap: 12px; border: 1px solid var(--line); padding: 14px 20px; margin-bottom: 32px; }
    .plan-banner__label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); }
    .plan-banner__name  { font-family: var(--serif); font-size: 22px; letter-spacing: -0.01em; }
    .plan-banner__right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

    /* Action cards */
    .action-section { margin-top: 32px; }
    .action-section__title { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 14px; }
    .action-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px,1fr)); gap: 10px; }
    .action-card { border: 1px solid var(--line); padding: 18px 16px; display: flex; flex-direction: column; gap: 6px;
      cursor: pointer; background: none; text-align: left; width: 100%; transition: background 180ms, border-color 180ms; }
    .action-card:hover { background: var(--accent-soft); border-color: var(--accent); }
    .action-card__icon { font-size: 22px; line-height: 1; }
    .action-card__title { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }
    .action-card__sub   { font-size: 11px; color: var(--fg-faint); line-height: 1.4; }

    /* Accessibility panel */
    .access-panel { margin-top: 32px; border: 1px solid var(--line); padding: 20px; }
    .access-panel__title { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 14px; }
    .access-controls { display: flex; gap: 10px; flex-wrap: wrap; }
    .access-btn { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 8px 14px; border: 1px solid var(--line); background: transparent; cursor: pointer; transition: background 150ms, color 150ms; }
    .access-btn:hover, .access-btn.active { background: var(--ink); color: var(--cream); border-color: var(--ink); }
    .access-btn.active { border-color: var(--accent); background: var(--accent); }
    .new-store-form { border: 1px solid var(--line); padding: 28px; display: flex; flex-direction: column; gap: 16px; max-width: 480px; }
    .new-store-form__title { font-family: var(--serif); font-size: 22px; letter-spacing: -0.01em; margin: 0; }
    .form-row   { display: flex; gap: 10px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
    .form-field input, .form-field textarea, .form-field select { word-break: break-word; overflow-wrap: break-word; }
    .status-msg { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; padding: 6px 0; min-height: 1.4em; }
    .status-msg.error   { color: #b33; }
    .status-msg.success { color: var(--accent); }
    .empty-msg { font-family: var(--serif); font-style: italic; font-size: 18px; color: var(--fg-soft); padding: 32px 0; }

    /* ══════════════════════ EDITOR LAYOUT ══════════════════════ */
    .editor-wrap { display: flex; flex-direction: column; height: 100vh; padding-top: var(--bar-h); overflow: hidden; }

    /* Control Panel tabs */
    .cp-tabbar { display: flex; align-items: center; border-bottom: 1px solid var(--line); flex-shrink: 0; background: var(--bg); }
    .cp-tab { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; padding: 9px 16px; border: none; background: transparent; color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 160ms; cursor: pointer; }
    .cp-tab:hover { color: var(--fg); }
    .cp-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .cp-panel { display: none; flex: 1; overflow: hidden; }
    .cp-panel.active { display: flex; }
    #cp-dashboard { flex-direction: row; }
    #cp-gallery { flex-direction: column; align-items: stretch; }
    #cp-wip { align-items: center; justify-content: center; }

    /* Gallery panel */
    .gallery-pane { display: flex; flex-direction: column; width: 100%; }
    .gallery-pane__toolbar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .gallery-pane__title { font-family: var(--mono); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: var(--fg-faint); flex: 1; }
    .gallery-pane__grid { flex: 1; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 12px; align-content: start; }
    .gallery-item { position: relative; border: 1px solid var(--line); overflow: hidden; }
    .gallery-item__img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: var(--line-soft); }
    .gallery-item__actions { position: absolute; inset: 0; background: rgba(0,0,0,.55); display: none; align-items: center; justify-content: center; gap: 8px; }
    .gallery-item:hover .gallery-item__actions { display: flex; }
    .gallery-item__btn { font-family: var(--mono); font-size: 10px; padding: 5px 10px; border: 1px solid rgba(255,255,255,.4); background: rgba(0,0,0,.4); color: #fff; cursor: pointer; transition: background 150ms; }
    .gallery-item__btn:hover { background: rgba(0,0,0,.7); }
    .gallery-item__size { font-family: var(--mono); font-size: 8px; letter-spacing: .08em; color: var(--fg-faint); padding: 4px 6px; text-align: right; }
    .gallery-empty { grid-column: 1/-1; color: var(--fg-faint); font-size: 13px; text-align: center; padding: 40px; }
    .gallery-pane__grid.drag-over { outline: 2px dashed var(--accent); outline-offset: -6px; background: color-mix(in srgb, var(--accent) 8%, var(--bg)); }
    .gallery-drop-hint { grid-column: 1/-1; text-align: center; padding: 24px; font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--fg-faint); border: 2px dashed var(--line); }

    /* Image picker modal */
    .img-picker-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.65); display: none; align-items: center; justify-content: center; }
    .img-picker-overlay.active { display: flex; }
    .img-picker-box { background: var(--bg); width: min(780px, 96vw); max-height: 88vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); }
    .img-picker-head { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .img-picker-title { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; flex: 1; }
    .img-picker-toolbar { display: flex; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .img-picker-grid { flex: 1; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 12px; align-content: start; }
    .picker-item { position: relative; border: 2px solid transparent; overflow: hidden; cursor: pointer; }
    .picker-item img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; background: var(--line-soft); }
    .picker-item:hover { border-color: var(--accent); }
    .img-picker-empty { grid-column: 1/-1; color: var(--fg-faint); font-size: 13px; text-align: center; padding: 40px; }

    /* Canvas Image Editor */
    .img-editor-overlay { position: fixed; inset: 0; z-index: 600; background: rgba(0,0,0,.75); display: none; align-items: center; justify-content: center; }
    .img-editor-overlay.active { display: flex; }
    .img-editor-box { background: var(--bg); width: min(900px, 96vw); max-height: 94vh; display: flex; flex-direction: column; overflow: hidden; }
    .img-editor-head { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .img-editor-head__title { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; flex: 1; }
    .img-editor-body { display: flex; flex: 1; overflow: hidden; gap: 0; }
    .img-editor-canvas-wrap { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; background: #111; overflow: hidden; padding: 16px; }
    .img-editor-canvas-wrap canvas { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
    .ie-crop-overlay { position: absolute; inset: 0; display: none; cursor: crosshair; }
    .ie-crop-overlay.active { display: block; }
    .ie-crop-rect { position: absolute; box-shadow: 0 0 0 9999px rgba(0,0,0,.6); border: 1.5px solid #fff; cursor: move; box-sizing: border-box; }
    .ie-handle { position: absolute; width: 10px; height: 10px; background: #fff; border: 1px solid rgba(0,0,0,.4); box-sizing: border-box; }
    .ie-handle--tl { top:-5px; left:-5px; cursor:nw-resize; }
    .ie-handle--tr { top:-5px; right:-5px; cursor:ne-resize; }
    .ie-handle--bl { bottom:-5px; left:-5px; cursor:sw-resize; }
    .ie-handle--br { bottom:-5px; right:-5px; cursor:se-resize; }
    .ie-handle--tm { top:-5px; left:calc(50% - 5px); cursor:n-resize; }
    .ie-handle--bm { bottom:-5px; left:calc(50% - 5px); cursor:s-resize; }
    .ie-handle--ml { left:-5px; top:calc(50% - 5px); cursor:w-resize; }
    .ie-handle--mr { right:-5px; top:calc(50% - 5px); cursor:e-resize; }
    .img-editor-tools { width: 220px; flex-shrink: 0; border-left: 1px solid var(--line); display: flex; flex-direction: column; overflow-y: auto; }
    .img-editor-tabs { display: flex; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .img-editor-tab { flex: 1; font-family: var(--mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; padding: 8px 4px; border: none; background: transparent; color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; }
    .img-editor-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .img-editor-panel { display: none; padding: 14px 12px; flex-direction: column; gap: 12px; }
    .img-editor-panel.active { display: flex; }
    .img-editor-slider { display: flex; flex-direction: column; gap: 4px; }
    .img-editor-slider label { font-family: var(--mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--fg-faint); display: flex; justify-content: space-between; }
    .img-editor-slider input[type=range] { width: 100%; }
    .img-editor-foot { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--line); flex-shrink: 0; justify-content: flex-end; }
    .palette-swatch { width: 16px; height: 16px; border: 1px solid var(--line); border-radius: 50%; flex-shrink: 0; }

    /* Left panel */
    .editor-left { width: var(--panel-w); flex-shrink: 0; border-right: 1px solid var(--line);
      display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }


    /* Editor tabs */
    .etabs { display: flex; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .etab  { flex: 1; font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 10px 4px; border: none; background: transparent;
      color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 160ms; }
    .etab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .etab-pane { display: none; flex: 1; overflow-y: auto; }
    .etab-pane.active { display: flex; flex-direction: column; }

    /* Design tab */
    .design-pane { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
    .pane-section { display: flex; flex-direction: column; gap: 10px; }
    .pane-section__label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--fg-faint); padding-bottom: 6px; border-bottom: 1px solid var(--line-soft); }

    /* Logo */
    .logo-field { display: flex; align-items: center; gap: 10px; }
    .logo-thumb { width: 48px; height: 48px; object-fit: contain; border: 1px solid var(--line); background: var(--line-soft); }
    .logo-placeholder { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--line); font-family: var(--mono); font-size: 9px; color: var(--fg-faint); }

    /* HEX color input */
    .hex-input { display: flex; align-items: center; gap: 8px; }
    .hex-input__swatch { width: 36px; height: 36px; padding: 2px 3px; border: 1px solid var(--line);
      background: none; flex-shrink: 0; cursor: pointer; }
    .hex-input__text { font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em;
      text-transform: uppercase; flex: 1; padding: 7px 10px; }

    /* Toggle */
    .toggle { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle__track { position: absolute; inset: 0; border-radius: 11px; background: var(--line); transition: background 200ms; cursor: pointer; }
    .toggle input:checked + .toggle__track { background: var(--accent); }
    .toggle__thumb { position: absolute; left: 3px; top: 3px; width: 16px; height: 16px;
      border-radius: 50%; background: #fff; transition: transform 200ms; pointer-events: none; }
    .toggle input:checked ~ .toggle__thumb { transform: translateX(18px); }

    /* Font row */
    .font-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

    /* Sections tab */
    .sections-pane { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
    .sec-list { flex: 1; overflow-y: auto; }
    .sec-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      border-bottom: 1px solid var(--line-soft); transition: background 160ms; cursor: pointer; }
    .sec-item:hover  { background: var(--accent-soft); }
    .sec-item.active { background: var(--accent-soft); }
    .sec-item.drag-over { border-top: 2px solid var(--accent); }
    .sec-item__drag  { cursor: grab; color: var(--fg-faint); font-size: 14px; padding: 2px; user-select: none; flex-shrink: 0; }
    .sec-item__icon  { font-size: 13px; color: var(--accent); flex-shrink: 0; }
    .sec-item__label { flex: 1; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sec-item__btns  { display: flex; gap: 4px; flex-shrink: 0; }
    .sec-item__btn   { font-family: var(--mono); font-size: 10px; padding: 3px 7px;
      border: 1px solid transparent; background: transparent; color: var(--fg-faint); transition: color 160ms, border-color 160ms; }
    .sec-item__btn:hover       { color: var(--fg); border-color: var(--line); }
    .sec-item__btn--del:hover  { color: #b33; border-color: #b33; }
    .sec-item--fixed           { background: color-mix(in srgb, var(--accent) 4%, transparent); }
    .sec-item--hidden          { opacity: 0.45; }
    .sec-item--fixed .sec-item__drag { display: none; }

    .sec-add-wrap { padding: 10px 12px; border-bottom: 1px solid var(--line); position: relative; flex-shrink: 0; }
    .sec-add-menu { position: absolute; left: 12px; right: 12px; bottom: calc(100% + 4px);
      background: var(--bg); border: 1px solid var(--line); box-shadow: 0 8px 32px rgba(0,0,0,.12); z-index: 10; }
    .sec-add-menu__item { display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      font-size: 13px; cursor: pointer; border-bottom: 1px solid var(--line-soft); transition: background 140ms; }
    .sec-add-menu__item:last-child { border-bottom: none; }
    .sec-add-menu__item:hover { background: var(--accent-soft); }
    .sec-add-menu__icon { font-size: 15px; }

    /* Floating Buttons panel */
    .float-panel { border-top: 1px solid var(--line); padding: 10px 12px; flex-shrink: 0; }
    .float-panel__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .float-panel__label { font-family: var(--mono); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: var(--fg-faint); }
    .float-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line-soft); cursor: pointer; }
    .float-item:last-child { border-bottom: none; }
    .float-item__icon { font-size: 14px; flex-shrink: 0; }
    .float-item__label { flex: 1; font-size: 12px; }
    .float-item__btn { background: none; border: none; color: var(--fg-faint); cursor: pointer; padding: 2px 6px; font-size: 13px; }
    .float-item__btn:hover { color: #b33; }

    /* Section editor modal */
    .sec-modal-overlay { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,.45); display: none; align-items: center; justify-content: center; }
    .sec-modal-overlay.active { display: flex; }
    .sec-modal-box { background: var(--bg); width: min(540px, 96vw); max-height: 88vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); border-top: 2px solid var(--accent); }
    .sec-editor__head { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .sec-editor__title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
    .sec-editor__close { font-family: var(--mono); font-size: 10px; background: none; border: none; color: var(--fg-faint); padding: 2px 6px; cursor: pointer; }
    .sec-editor__close:hover { color: var(--fg); }
    .sec-editor__fields { padding: 12px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }

    /* Image fields */
    .img-field { display: flex; flex-direction: column; gap: 6px; }
    .img-field__row { display: flex; align-items: center; gap: 8px; }
    .img-thumb { width: 56px; height: 42px; object-fit: cover; border: 1px solid var(--line); background: var(--line-soft); }
    .img-placeholder { width: 56px; height: 42px; display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--line); font-size: 18px; color: var(--fg-faint); background: var(--line-soft); }
    .gallery-row { display: flex; align-items: center; gap: 6px; padding: 6px 0; border-bottom: 1px solid var(--line-soft); }
    .gallery-thumb { width: 40px; height: 32px; object-fit: cover; border: 1px solid var(--line); flex-shrink: 0; }
    .gallery-row input { flex: 1; padding: 5px 8px; font-size: 12px; }
    .field-group { border: 1px solid var(--line-soft); padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .field-group__label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint); }

    /* ── Items tab ── */
    .items-pane { padding: 0; display: flex; flex-direction: column; gap: 0; }
    .items-toolbar { padding: 8px 12px; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
    .items-toolbar__row { display: flex; gap: 6px; align-items: center; }
    .items-search { flex: 1; padding: 6px 10px; font-size: 12px; }
    .items-actions { padding: 8px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; display: flex; flex-wrap: wrap; gap: 6px; }
    .items-list { flex: 1; overflow-y: auto; }

    /* Item rows — bigger buttons */
    .item-row { border-bottom: 1px solid var(--line-soft); padding: 8px 12px;
      display: grid; grid-template-columns: 20px 44px 1fr 68px auto; gap: 8px; align-items: center; }
    .item-row--head { font-family: var(--mono); font-size: 8px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--fg-faint); border-bottom: 1px solid var(--line); padding-bottom: 6px; }
    .item-row__check { width: 14px; height: 14px; cursor: pointer; flex-shrink: 0; accent-color: var(--accent); }
    .item-row__thumb { width: 40px; height: 32px; object-fit: cover; border: 1px solid var(--line); background: var(--line-soft); }
    .item-row__name  { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-row__name--draft { color: var(--fg-faint); font-style: italic; }
    .item-row__price { font-family: var(--serif); font-size: 13px; }
    .item-row__btns  { display: flex; gap: 5px; }
    .item-row__btn   {
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
      padding: 7px 12px; border: 1px solid var(--line); background: transparent; color: var(--fg-soft);
      transition: color 160ms, border-color 160ms, background 160ms; white-space: nowrap;
    }
    .item-row__btn:hover       { color: var(--fg); border-color: var(--fg); background: var(--accent-soft); }
    .item-row__btn--del:hover  { color: #b33; border-color: #b33; background: rgba(187,51,51,.07); }

    /* Bulk actions bar */
    .bulk-bar { display: none; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 8px 12px; background: var(--accent-soft); border-bottom: 1px solid var(--accent); flex-shrink: 0; }
    .bulk-bar.visible { display: flex; }
    .bulk-bar__count { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-faint); }
    .bulk-bar select { width: auto; padding: 5px 8px; font-size: 11px; }
    .bulk-bar input[type=number] { width: 90px; padding: 5px 8px; font-size: 11px; }

    /* Troubleshoot */
    .troubleshoot { padding: 10px 12px; border-top: 1px solid var(--line-soft); flex-shrink: 0; }
    .troubleshoot__label { font-family: var(--mono); font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 6px; }
    .troubleshoot__row { display: flex; gap: 6px; flex-wrap: wrap; }
    .broken-links-result { font-family: var(--mono); font-size: 10px; margin-top: 6px; color: var(--fg-faint); }

    /* Right panel — preview */
    .editor-right { flex: 1; display: flex; flex-direction: column; background: #111; overflow: hidden; }
    .preview-bar { display: flex; align-items: center; justify-content: space-between;
      padding: 8px 14px; background: #1a1a1a; border-bottom: 1px solid #333; flex-shrink: 0; }
    .preview-actions { display: flex; align-items: center; gap: 8px; }
    .preview-actions .btn-ghost { border-color: #444; color: #aaa; }
    .preview-actions .btn-ghost:hover { border-color: #888; color: #eee; }
    .preview-mode-btn { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 5px 10px; border: 1px solid #555; background: transparent; color: #888; transition: color 160ms, border-color 160ms; }
    .preview-mode-btn.active { color: var(--accent); border-color: var(--accent); }
    .preview-live-btn { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 5px 10px; border: 1px solid #555; background: transparent; color: #555; cursor: pointer;
      transition: color 160ms, border-color 160ms; }
    .preview-live-btn.active { color: #4caf50; border-color: #4caf50; }
    .preview-icon-btn { width: 28px; height: 28px; padding: 0; border: 1px solid #555; background: transparent;
      color: #888; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center;
      transition: color 160ms, border-color 160ms; }
    .preview-icon-btn:hover { color: #eee; border-color: #888; }
    .preview-icon-btn.active { color: var(--accent); border-color: var(--accent); }
    .preview-frame-wrap { flex: 1; display: flex; align-items: flex-start; justify-content: center; overflow: hidden; background: #111; }
    .preview-frame-wrap--mobile { padding: 20px; align-items: center; }
    .preview-frame-wrap--mobile .editor-iframe { width: 390px; max-width: 100%; border: 2px solid #444; border-radius: 8px; height: calc(100% - 40px); flex: none; }
    .editor-iframe { flex: 1; width: 100%; height: 100%; border: none; background: #fff; }

    /* ── Config tab ── */
    .config-pane { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
    .config-section { display: flex; flex-direction: column; gap: 10px; }
    .config-section__label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--fg-faint); padding-bottom: 6px; border-bottom: 1px solid var(--line-soft); }
    .flag-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line-soft); }
    .flag-row:last-child { border-bottom: none; }
    .flag-row__info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .flag-row__name { font-size: 12px; }
    .flag-row__desc { font-size: 11px; color: var(--fg-faint); }

    /* Segment control */
    .seg-ctrl { display: flex; border: 1px solid var(--line); }
    .seg-ctrl__btn { flex: 1; font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
      text-transform: uppercase; padding: 7px 4px; border: none; background: transparent;
      color: var(--fg-faint); transition: background 160ms, color 160ms; }
    .seg-ctrl__btn.active { background: var(--fg); color: var(--bg); }

    /* Dashboard style selector */
    .dash-style-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .dash-style-btn { border: 1px solid var(--line); padding: 8px 10px; cursor: pointer;
      background: transparent; text-align: left; transition: border-color 160ms, background 160ms; }
    .dash-style-btn:hover { background: var(--accent-soft); border-color: var(--accent); }
    .dash-style-btn.active { border-color: var(--accent); background: var(--accent-soft); }
    .dash-style-btn__swatch { display: flex; gap: 3px; margin-bottom: 4px; }
    .dash-style-btn__dot { width: 10px; height: 10px; border-radius: 50%; }
    .dash-style-btn__name { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-faint); }

    /* Advanced tweaks — toggleable */
    .adv-tweak { border: 1px solid var(--line-soft); margin-bottom: 0; }
    .adv-tweak__head { display: flex; align-items: center; justify-content: space-between;
      padding: 10px 12px; transition: background 160ms; }
    .adv-tweak__title-area { flex: 1; cursor: pointer; }
    .adv-tweak__title { font-size: 12px; }
    .adv-tweak__desc  { font-size: 10px; color: var(--fg-faint); margin-top: 1px; }
    .adv-tweak__controls { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .adv-tweak__arrow { font-size: 10px; color: var(--fg-faint); transition: transform 200ms; cursor: pointer; padding: 2px 4px; }
    .adv-tweak.open .adv-tweak__arrow { transform: rotate(90deg); }
    .adv-tweak__body { display: none; padding: 10px 12px; border-top: 1px solid var(--line-soft); flex-direction: column; gap: 10px; }
    .adv-tweak.open .adv-tweak__body { display: flex; }

    /* ── Product modal ── */
    .modal-overlay { position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
      padding: 24px; opacity: 0; pointer-events: none; transition: opacity 280ms; }
    .modal-overlay.active { opacity: 1; pointer-events: auto; }
    .modal-box { background: var(--bg); border: 1px solid var(--line); width: 100%; max-width: 580px;
      padding: 36px; display: flex; flex-direction: column; gap: 20px;
      max-height: calc(100vh - 48px); overflow-y: auto; }
    .modal-box__head  { display: flex; justify-content: space-between; align-items: baseline; }
    .modal-box__title { font-family: var(--serif); font-size: 26px; letter-spacing: -0.01em; margin: 0; }
    .modal-close { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
      background: none; border: none; color: var(--fg-faint); transition: color 160ms; }
    .modal-close:hover { color: var(--fg); }
    .modal-form { display: flex; flex-direction: column; gap: 14px; }
    .modal-form__actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
    .modal-section { border: 1px solid var(--line-soft); }
    .modal-section__head { display: flex; align-items: center; justify-content: space-between;
      padding: 9px 12px; cursor: pointer; background: var(--line-soft); }
    .modal-section__title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint); }
    .modal-section__body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }

    /* Badge selector */
    .badge-opts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .badge-opt  { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 4px 10px; border: 1px solid var(--line); background: transparent; color: var(--fg-faint);
      cursor: pointer; transition: all 160ms; }
    .badge-opt.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }

    /* Variations */
    .var-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line-soft); }
    .var-row input { flex: 1; padding: 5px 8px; font-size: 12px; }
    .var-row__del { font-family: var(--mono); font-size: 9px; padding: 4px 8px; border: 1px solid var(--line);
      background: transparent; color: var(--fg-faint); transition: color 160ms, border-color 160ms; }
    .var-row__del:hover { color: #b33; border-color: #b33; }

    /* ── Gallery modals (template + style) ── */
    .modal-overlay-lg { position: fixed; inset: 0; z-index: 300;
      background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center;
      padding: 24px; opacity: 0; pointer-events: none; transition: opacity 280ms; }
    .modal-overlay-lg.active { opacity: 1; pointer-events: auto; }
    .modal-panel { background: var(--bg); border: 1px solid var(--line); border-radius: 8px; width: 100%; overflow: hidden; }
    .pp-item { display: flex; align-items: center; gap: 12px; padding: 10px 24px;
      cursor: pointer; transition: background 140ms; }
    .pp-item:hover { background: var(--accent-soft); }
    .pp-item input[type=checkbox] { flex-shrink: 0; accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
    .pp-img { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; flex-shrink: 0; background: var(--line-soft); }
    .pp-img--empty { background: var(--line-soft); }
    .pp-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .pp-name  { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pp-price { font-size: 12px; color: var(--fg-faint); font-family: var(--mono); }
    .pp-oos   { font-size: 10px; color: #b33; font-family: var(--mono); letter-spacing: 0.08em; text-transform: uppercase; }
    .gallery-box { background: var(--bg); border: 1px solid var(--line); width: 100%; max-width: 720px;
      padding: 36px; display: flex; flex-direction: column; gap: 24px;
      max-height: calc(100vh - 48px); overflow-y: auto; }
    .gallery-box__head { display: flex; justify-content: space-between; align-items: baseline; }
    .gallery-box__title { font-family: var(--serif); font-size: 28px; letter-spacing: -0.01em; margin: 0; }
    .gallery-box__sub { font-size: 13px; color: var(--fg-soft); margin: 0; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .gallery-card { border: 1px solid var(--line); padding: 16px; cursor: pointer;
      transition: background 200ms, border-color 200ms; }
    .gallery-card:hover { background: var(--accent-soft); border-color: var(--accent); }
    .gallery-card.active { border-color: var(--accent); background: var(--accent-soft); }
    .gallery-card__icon { font-size: 22px; margin-bottom: 8px; }
    .gallery-card__name { font-family: var(--serif); font-size: 17px; letter-spacing: -0.01em; }
    .gallery-card__desc { font-size: 11px; color: var(--fg-faint); margin-top: 3px; }
    .palette-custom { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line); }
    .palette-custom__label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.13em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 10px; }
    .palette-custom__row { display: flex; gap: 12px; flex-wrap: wrap; }
    /* Style card with color swatches */
    .style-swatches { display: flex; gap: 4px; margin-bottom: 8px; }
    .style-swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,.1); }
    .style-shape-preview { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
    .style-shape-preview__btn { width: 52px; height: 24px; border: 1px solid var(--fg); background: var(--fg); }
    .style-shape-preview__card { width: 52px; height: 42px; border: 1px solid var(--line); background: transparent; }

    @media (max-width: 960px) { :root { --panel-w: 300px; } }
    @media (max-width: 640px) {
      .editor-wrap { flex-direction: column; }
      .editor-left { width: 100%; height: 50vh; border-right: none; border-bottom: 1px solid var(--line); }
      .editor-right { height: 50vh; }
      .d-bar__email { display: none; }
    }
  </style>
</head>
<body>

  <!-- ── Top bar ── -->
  <div class="d-bar" id="d-bar" style="display:none">
    <div class="d-bar__brand">
      <img src="/img/icon.webp" alt="" />
      MaxCyberSolutions
    </div>
    <span class="d-bar__sep" id="d-bar-sep" style="display:none">›</span>
    <span class="d-bar__store" id="d-bar-store"></span>
    <span class="d-bar__dirty"  id="d-bar-dirty"></span>
    <div class="d-bar__history" id="d-bar-history" style="display:none">
      <button class="btn-icon" id="btn-undo" title="Undo (Ctrl+Z)" disabled>↩</button>
      <button class="btn-icon" id="btn-redo" title="Redo (Ctrl+Y)" disabled>↪</button>
    </div>
    <div class="d-bar__actions" id="d-bar-actions" style="display:none">
      <button class="btn-ghost btn-sm" id="btn-discard">Discard</button>
      <button class="btn-ghost btn-sm" id="btn-save-draft">Save Draft</button>
      <button class="btn-ghost btn-sm" id="btn-export">Export ↓</button>
      <button class="btn-ghost btn-sm" id="btn-import">Import ↑</button>
      <input type="file" id="import-file" accept=".json" style="display:none" />
    </div>
    <div class="d-bar__right">
      <button class="btn-push" id="btn-push-live" style="display:none">🚀 Push Live</button>
      <a class="d-bar__admin-link" id="d-admin-link" href="/admin/" style="display:none;font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border:1px solid var(--accent);color:var(--accent);text-decoration:none">Admin Panel ↗</a>
      <span class="d-bar__email" id="d-email"></span>
      <button class="d-bar__logout" id="d-logout">Sign out</button>
    </div>
  </div>

  <!-- ── Onboarding ── -->
  <div class="screen" id="screen-onboard">
    <div class="ob-wrap">
      <div class="ob-card">
        <div id="ob-step-1">
          <h2 class="ob-title">Welcome to MaxCyberSolutions</h2>
          <p class="ob-sub">Let's set up your store in two quick steps.</p>
          <div class="ob-step">
            <div class="form-field">
              <label for="ob-store-name">Store name *</label>
              <input id="ob-store-name" type="text" placeholder="My Brand Store" />
            </div>
            <div class="form-field">
              <label for="ob-slug">Store URL slug *</label>
              <div class="slug-row">
                <input id="ob-slug" type="text" placeholder="my-brand" />
                <button type="button" class="btn-ghost btn-sm" id="btn-check-slug">Check</button>
              </div>
              <div class="slug-status" id="ob-slug-status"></div>
              <div class="slug-hint">Your store: maxcybersolutions.online/store/<span id="ob-slug-preview">my-brand</span></div>
            </div>
            <p class="status-msg" id="ob-msg-1"></p>
            <div class="ob-actions">
              <button class="btn-solid" id="btn-ob-next-1">Next →</button>
            </div>
          </div>
        </div>

        <div id="ob-step-2" style="display:none">
          <h2 class="ob-title">Payment setup</h2>
          <p class="ob-sub">Add your payment details so customers can buy from your store. You can skip and configure these later in Store Settings.</p>
          <div class="ob-step">
            <div class="form-field">
              <label for="ob-cbu">CBU / CVU (for bank transfers)</label>
              <input id="ob-cbu" type="text" placeholder="0000003100098765432100" />
            </div>
            <div class="form-field">
              <label for="ob-bank-name">Bank name</label>
              <input id="ob-bank-name" type="text" placeholder="Banco Galicia" />
            </div>
            <div class="form-field">
              <label for="ob-bank-holder">Account holder</label>
              <input id="ob-bank-holder" type="text" placeholder="Jane Doe" />
            </div>
            <p class="status-msg" id="ob-msg-2"></p>
            <div class="ob-actions">
              <button class="btn-ghost" id="btn-ob-skip-2">Skip for now</button>
              <button class="btn-solid" id="btn-ob-finish">Finish setup →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Paused ── -->
  <div class="screen" id="screen-paused">
    <div class="login-wrap">
      <div class="login-box" style="text-align:center">
        <div style="font-size:48px;margin-bottom:16px">⏸</div>
        <span class="login-box__tag">MaxCyberSolutions</span>
        <h1 class="login-box__title" style="margin-top:8px">Account Paused</h1>
        <p class="login-box__sub" style="margin-top:12px">Your dashboard has been temporarily paused by the administrator. Your website is still visible to visitors. Please contact support to resume access.</p>
        <button class="login-submit" style="margin-top:32px;max-width:260px;align-self:center" onclick="logout()">Sign out</button>
      </div>
    </div>
  </div>

  <!-- ── Login ── -->
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
<!-- #################################################################
          <button class="login-tab" data-tab="register">Register</button>
#################################################################### -->
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

  <!-- ── Stores ── -->
  <div class="screen" id="screen-stores">
    <div class="d-content">
      <div class="sec-head" style="margin-bottom:20px">
        <p class="sec-head__tag">§ Storefronts</p>
        <h2 class="sec-head__title">Your stores.</h2>
      </div>
      <div class="plan-banner" id="plan-banner">
        <div>
          <div class="plan-banner__label">Your plan</div>
          <div class="plan-banner__name" id="plan-name-display">—</div>
        </div>
        <div class="plan-banner__right" id="plan-banner-right"></div>
      </div>
      <div class="stores-grid" id="stores-grid"></div>

      <div class="action-section">
        <div class="action-section__title">Quick actions</div>
        <div class="action-cards">
          <button class="action-card" onclick="actionContact()">
            <div class="action-card__icon">💬</div>
            <div class="action-card__title">Contact support</div>
            <div class="action-card__sub">Get help from the MaxCyberSolutions team</div>
          </button>
          <button class="action-card" onclick="actionRequest('upgrade-plan')">
            <div class="action-card__icon">⬆</div>
            <div class="action-card__title">Upgrade plan</div>
            <div class="action-card__sub">Unlock more features and higher limits</div>
          </button>
          <button class="action-card" onclick="actionRequest('more-storage')">
            <div class="action-card__icon">🗄</div>
            <div class="action-card__title">More storage</div>
            <div class="action-card__sub">Request additional image storage space</div>
          </button>
          <button class="action-card" onclick="actionRequest('slug-change')">
            <div class="action-card__icon">🔗</div>
            <div class="action-card__title">Change URL slug</div>
            <div class="action-card__sub">Request a new URL for one of your stores</div>
          </button>
          <button class="action-card" onclick="actionRequest('website-transfer')">
            <div class="action-card__icon">⇄</div>
            <div class="action-card__title">Transfer website</div>
            <div class="action-card__sub">Move a website to a different account</div>
          </button>
        </div>
      </div>

      <div class="access-panel">
        <div class="access-panel__title">Display &amp; accessibility</div>
        <div class="access-controls">
          <button class="access-btn" id="acc-dark"   onclick="toggleAccess('dark')">Dark mode</button>
          <button class="access-btn" id="acc-large"  onclick="toggleAccess('large')">Large text</button>
          <button class="access-btn" id="acc-contrast" onclick="toggleAccess('contrast')">High contrast</button>
        </div>
      </div>
<!-- ##############################################################
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
################################################################# -->
    </div>
  </div>

  <!-- ── Editor (split pane) ── -->
  <div class="screen" id="screen-editor">
    <div class="editor-wrap">

      <!-- Control Panel top tabs -->
      <div class="cp-tabbar">
        <button class="cp-tab active" data-cp-tab="dashboard">Dashboard</button>
        <button class="cp-tab" data-cp-tab="gallery">Gallery</button>
        <button class="cp-tab" data-cp-tab="wip">(Under Development)</button>
      </div>

      <!-- Dashboard panel (left + right split) -->
      <div class="cp-panel active" id="cp-dashboard">

      <!-- Left panel -->
      <div class="editor-left" id="editor-left">

        <div class="etabs">
          <button class="etab active" data-tab="design">Design</button>
          <button class="etab" data-tab="sections">Sections</button>
          <button class="etab" data-tab="items">Items</button>
          <button class="etab" data-tab="config">Config</button>
          <button class="etab" data-tab="orders">Orders</button>
        </div>

        <!-- Design tab -->
        <div class="etab-pane active" id="etab-design">
          <div class="design-pane">

            <!-- Logo -->
            <div class="pane-section">
              <span class="pane-section__label">Logo</span>
              <div class="logo-field">
                <div id="logo-preview-wrap">
                  <div class="logo-placeholder">☰</div>
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

            <!-- Look & Feel -->
            <div class="pane-section">
              <span class="pane-section__label">Look &amp; Feel</span>
              <button class="btn-ghost btn-sm" id="btn-change-tmpl" style="width:100%">⊞ Change Template</button>
              <button class="btn-ghost btn-sm" id="btn-change-style" style="width:100%">◈ Change Style</button>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="btn-ghost btn-sm" id="btn-change-palette" style="flex:1">⬡ Colour Palette</button>
                <div id="palette-swatches" style="display:flex;gap:4px;flex-shrink:0"></div>
              </div>
            </div>

            <!-- Fonts -->
            <div class="pane-section">
              <span class="pane-section__label">Fonts</span>
              <div class="form-row">
                <div class="form-field">
                  <label for="d-font-title-family">Title</label>
                  <select id="d-font-title-family">
                    <option>System Default</option>
                    <optgroup label="── Serif ──────────">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="── Sans-Serif ──────">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="── Monospace ───────">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="── Display ─────────">
                      <option>Bebas Neue</option>
                      <option>Pacifico</option>
                      <option>Oswald</option>
                      <option>Orbitron</option>
                    </optgroup>
                  </select>
                </div>
                <div class="form-field">
                  <label for="d-font-body-family">Body</label>
                  <select id="d-font-body-family">
                    <option>System Default</option>
                    <optgroup label="── Serif ──────────">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="── Sans-Serif ──────">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="── Monospace ───────">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="── Display ─────────">
                      <option>Bebas Neue</option>
                      <option>Pacifico</option>
                      <option>Oswald</option>
                      <option>Orbitron</option>
                    </optgroup>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label for="d-font-accent-family">Accent</label>
                  <select id="d-font-accent-family">
                    <option>System Default</option>
                    <optgroup label="── Serif ──────────">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="── Sans-Serif ──────">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="── Monospace ───────">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="── Display ─────────">
                      <option>Bebas Neue</option>
                      <option>Pacifico</option>
                      <option>Oswald</option>
                      <option>Orbitron</option>
                    </optgroup>
                  </select>
                </div>
                <div class="form-field">
                  <label for="d-font-slogan-family">Slogan</label>
                  <select id="d-font-slogan-family">
                    <option>System Default</option>
                    <optgroup label="── Serif ──────────">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="── Sans-Serif ──────">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="── Monospace ───────">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="── Display ─────────">
                      <option>Bebas Neue</option>
                      <option>Pacifico</option>
                      <option>Oswald</option>
                      <option>Orbitron</option>
                    </optgroup>
                  </select>
                </div>
              </div>
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
            <div class="float-panel" id="float-panel">
              <div class="float-panel__head">
                <span class="float-panel__label">Floating Buttons</span>
                <div style="display:flex;gap:4px">
                  <button class="btn-ghost btn-sm" id="btn-add-float-btn">+ Button</button>
                  <button class="btn-ghost btn-sm" id="btn-add-social-links">⊕ Social</button>
                </div>
              </div>
              <div class="float-btn-list" id="float-btn-list"></div>
            </div>
          </div>
        </div>

        <!-- Items tab -->
        <div class="etab-pane" id="etab-items">
          <div class="items-pane">
            <div class="items-toolbar">
              <div class="items-toolbar__row">
                <input class="items-search" id="items-search" type="search" placeholder="Search by name or SKU…" />
                <select id="items-sort" style="width:auto;padding:6px 8px;font-size:11px">
                  <option value="date">Date ↓</option>
                  <option value="name">Name A–Z</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
              </div>
              <div class="items-toolbar__row">
                <select id="items-filter-tag" style="flex:1;padding:6px 8px;font-size:11px">
                  <option value="">All tags</option>
                </select>
                <select id="items-filter-stock" style="width:auto;padding:6px 8px;font-size:11px">
                  <option value="all">All stock</option>
                  <option value="in">In stock</option>
                  <option value="out">Out of stock</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div class="items-actions">
              <button class="btn-accent btn-sm" id="btn-new-item">+ New item</button>
              <button class="btn-ghost btn-sm" id="btn-dl-template">Template ↓</button>
              <button class="btn-ghost btn-sm" id="btn-export-csv">CSV ↓</button>
              <button class="btn-ghost btn-sm" id="btn-export-json-items">JSON ↓</button>
              <button class="btn-ghost btn-sm" id="btn-import-items">Import ↑</button>
              <input type="file" id="import-items-file" accept=".csv,.json" style="display:none" />
            </div>

            <div class="bulk-bar" id="bulk-bar">
              <span class="bulk-bar__count" id="bulk-count">0 selected</span>
              <input type="text" id="bulk-tag-input" placeholder="Set tags…" style="flex:1;padding:5px 8px;font-size:11px;width:auto" />
              <input type="number" id="bulk-price-input" placeholder="Price ($)" min="0" step="0.01" />
              <select id="bulk-vis-input" title="Set visibility">
                <option value="">Visibility…</option>
                <option value="1">Visible</option>
                <option value="0">Hidden</option>
              </select>
              <button class="btn-ghost btn-sm" id="btn-bulk-apply">Apply</button>
              <button class="btn-ghost btn-sm" id="btn-bulk-clear">Clear</button>
            </div>

            <div class="item-row item-row--head">
              <input type="checkbox" id="select-all-items" class="item-row__check" />
              <span></span><span>Name</span><span>Price</span><span></span>
            </div>
            <div class="items-list" id="items-list"></div>
            <p class="status-msg" style="padding:0 12px" id="items-msg"></p>

            <div class="troubleshoot">
              <div class="troubleshoot__label">Troubleshoot</div>
              <div class="troubleshoot__row">
                <button class="btn-ghost btn-sm" id="btn-fetch-items">↻ Re-fetch</button>
                <button class="btn-ghost btn-sm" id="btn-check-links">🔗 Check Links</button>
              </div>
              <div class="broken-links-result" id="broken-links-result"></div>
            </div>
          </div>
        </div>

        <!-- Config tab -->
        <div class="etab-pane" id="etab-config">
          <div class="config-pane">

            <div class="config-section">
              <span class="config-section__label">Dashboard</span>
              <div class="form-field">
                <label for="cfg-lang">Language (UI only)</label>
                <select id="cfg-lang">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                </select>
              </div>
              <div class="form-field">
                <label>Panel size</label>
                <div class="seg-ctrl" id="cfg-size">
                  <button class="seg-ctrl__btn" data-size="small">Small</button>
                  <button class="seg-ctrl__btn active" data-size="medium">Medium</button>
                  <button class="seg-ctrl__btn" data-size="large">Large</button>
                </div>
              </div>
              <div class="form-field">
                <label>Preview mode</label>
                <div class="seg-ctrl" id="cfg-preview">
                  <button class="seg-ctrl__btn active" data-preview="desktop">Desktop</button>
                  <button class="seg-ctrl__btn" data-preview="mobile">Mobile</button>
                </div>
              </div>
              <div class="flag-row">
                <div class="flag-row__info">
                  <span class="flag-row__name">Auto-refresh preview</span>
                  <span class="flag-row__desc">Update preview on every change.</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="cfg-auto-refresh" checked />
                  <span class="toggle__track"></span>
                  <span class="toggle__thumb"></span>
                </label>
              </div>
              <div class="flag-row">
                <div class="flag-row__info">
                  <span class="flag-row__name">Skip confirmation prompts</span>
                  <span class="flag-row__desc">Don't ask "Are you sure?" before deleting.</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" id="cfg-skip-confirm" />
                  <span class="toggle__track"></span>
                  <span class="toggle__thumb"></span>
                </label>
              </div>
              <div class="form-field">
                <label>Dashboard Style</label>
                <div class="dash-style-grid" id="dash-style-grid"></div>
              </div>
            </div>

            <div class="config-section">
              <span class="config-section__label">Store Features</span>

              <div class="adv-tweak" id="tweak-newsletter">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area" onclick="this.closest('.adv-tweak').classList.toggle('open')">
                    <div class="adv-tweak__title">Newsletter Popup</div>
                    <div class="adv-tweak__desc">Email signup modal after 3.5s.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <label class="toggle" onclick="event.stopPropagation()">
                      <input type="checkbox" class="tweak-feat" data-feature="hasNewsletterPopup" />
                      <span class="toggle__track"></span><span class="toggle__thumb"></span>
                    </label>
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">›</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <div class="form-field">
                    <label for="nl-title">Popup title</label>
                    <input id="nl-title" type="text" placeholder="Stay in the loop." />
                  </div>
                  <div class="form-field">
                    <label for="nl-text">Popup text</label>
                    <textarea id="nl-text" rows="2" placeholder="New arrivals, exclusive drops…"></textarea>
                  </div>
                  <div class="form-field">
                    <label for="nl-image">Image URL (optional)</label>
                    <input id="nl-image" type="text" placeholder="https://…" />
                  </div>
                </div>
              </div>

              <div class="adv-tweak" id="tweak-inventory">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area">
                    <div class="adv-tweak__title">Inventory Tracking</div>
                    <div class="adv-tweak__desc">Show in-stock / out-of-stock badges on items.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <label class="toggle">
                      <input type="checkbox" class="tweak-feat" data-feature="hasInventoryTracking" />
                      <span class="toggle__track"></span><span class="toggle__thumb"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="adv-tweak" id="tweak-oos">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area" onclick="this.closest('.adv-tweak').classList.toggle('open')">
                    <div class="adv-tweak__title">Out-of-Stock Behavior</div>
                    <div class="adv-tweak__desc">What to show when an item has no stock.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">›</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <div class="form-field">
                    <label for="oos-mode">Behavior</label>
                    <select id="oos-mode">
                      <option value="show">Show anyway</option>
                      <option value="show-warning">Show with warning badge</option>
                      <option value="hide">Hide from catalog</option>
                    </select>
                  </div>
                  <div class="flag-row" style="border:none;padding:0">
                    <div class="flag-row__info">
                      <span class="flag-row__name">Public stock count</span>
                      <span class="flag-row__desc">Show "X in stock" to visitors</span>
                    </div>
                    <label class="toggle">
                      <input type="checkbox" id="stock-public" />
                      <span class="toggle__track"></span><span class="toggle__thumb"></span>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            <div class="config-section">
              <span class="config-section__label">Advanced</span>

              <div class="adv-tweak">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area">
                    <div class="adv-tweak__title">Edit Item IDs</div>
                    <div class="adv-tweak__desc" style="color:#b33">Can break variations &amp; external links.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <label class="toggle">
                      <input type="checkbox" id="tweak-allow-ids" />
                      <span class="toggle__track"></span><span class="toggle__thumb"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="adv-tweak">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area" onclick="this.closest('.adv-tweak').classList.toggle('open')">
                    <div class="adv-tweak__title" style="color:#b33">Start All Over</div>
                    <div class="adv-tweak__desc">Resets store config to zero.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">›</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <p style="font-size:11px;color:#b33;margin:0">Type RESET to confirm. Redirects to template gallery.</p>
                  <div style="display:flex;gap:8px">
                    <input type="text" id="reset-confirm-input" placeholder='Type "RESET"' style="flex:1" />
                    <button class="btn-ghost btn-sm btn-ghost--danger" id="btn-start-over">Reset</button>
                  </div>
                </div>
              </div>

            </div>

            <div class="config-section">
              <span class="config-section__label">Payments &amp; Checkout</span>

              <div class="adv-tweak" id="tweak-mp">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area" onclick="this.closest('.adv-tweak').classList.toggle('open')">
                    <div class="adv-tweak__title">Mercado Pago</div>
                    <div class="adv-tweak__desc">Credit/debit cards and other MP methods.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">›</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <div class="form-field">
                    <label for="cfg-mp-pub">Public Key</label>
                    <input id="cfg-mp-pub" type="text" placeholder="APP_USR-…" />
                  </div>
                  <div class="form-field">
                    <label for="cfg-mp-tok">Access Token</label>
                    <input id="cfg-mp-tok" type="password" placeholder="APP_USR-…" autocomplete="new-password" />
                    <p style="font-size:10px;color:var(--fg-faint);margin-top:3px">Get these from your Mercado Pago developer dashboard.</p>
                  </div>
                </div>
              </div>

              <div class="adv-tweak" id="tweak-bank">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area" onclick="this.closest('.adv-tweak').classList.toggle('open')">
                    <div class="adv-tweak__title">Bank Transfer (CBU / CVU)</div>
                    <div class="adv-tweak__desc">Accept transfers to your Argentine bank account.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">›</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <div class="form-field">
                    <label for="cfg-cbu">CBU / CVU</label>
                    <input id="cfg-cbu" type="text" placeholder="0000003100098765432100" />
                  </div>
                  <div class="form-field">
                    <label for="cfg-bank-name">Bank name</label>
                    <input id="cfg-bank-name" type="text" placeholder="Banco Galicia" />
                  </div>
                  <div class="form-field">
                    <label for="cfg-bank-holder">Account holder</label>
                    <input id="cfg-bank-holder" type="text" placeholder="John Doe" />
                  </div>
                </div>
              </div>

              <div class="adv-tweak" id="tweak-ship-origin">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area" onclick="this.closest('.adv-tweak').classList.toggle('open')">
                    <div class="adv-tweak__title">Store Origin (for shipping quotes)</div>
                    <div class="adv-tweak__desc">Required for MercadoEnvíos &amp; Andreani quotes.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">›</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <div class="form-field">
                    <label for="cfg-s-addr">Street address</label>
                    <input id="cfg-s-addr" type="text" placeholder="Av. Corrientes 1234" />
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <label for="cfg-s-zip">Postal code</label>
                      <input id="cfg-s-zip" type="text" placeholder="C1414" />
                    </div>
                    <div class="form-field">
                      <label for="cfg-s-city">City</label>
                      <input id="cfg-s-city" type="text" placeholder="Buenos Aires" />
                    </div>
                  </div>
                  <div class="form-field">
                    <label for="cfg-s-prov">Province</label>
                    <input id="cfg-s-prov" type="text" placeholder="CABA" />
                  </div>
                </div>
              </div>

              <div class="adv-tweak" id="tweak-whatsapp">
                <div class="adv-tweak__head">
                  <div class="adv-tweak__title-area" onclick="this.closest('.adv-tweak').classList.toggle('open')">
                    <div class="adv-tweak__title">WhatsApp Contact</div>
                    <div class="adv-tweak__desc">Cart button that sends order details via WhatsApp.</div>
                  </div>
                  <div class="adv-tweak__controls">
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">›</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <div class="form-field">
                    <label for="cfg-wa-number">WhatsApp number</label>
                    <input id="cfg-wa-number" type="text" placeholder="5491112345678" />
                    <p style="font-size:10px;color:var(--fg-faint);margin-top:3px">Country code + number, digits only. E.g. 5491112345678 for Argentina.</p>
                  </div>
                  <div class="form-field">
                    <label for="cfg-wa-message">Custom message prefix</label>
                    <textarea id="cfg-wa-message" rows="3" placeholder="Hola! Me gustaría hacer el siguiente pedido:" style="width:100%;resize:vertical;padding:6px 8px;font-size:12px;border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:var(--s-radius)"></textarea>
                    <p style="font-size:10px;color:var(--fg-faint);margin-top:3px">Sent before the cart item list. Leave blank for a default message.</p>
                  </div>
                </div>
              </div>

              <div style="padding:10px 0 4px">
                <button class="btn-ghost btn-sm" id="btn-save-payment">Save payment settings</button>
                <p class="status-msg" id="payment-msg" style="font-size:10px;padding:4px 0"></p>
              </div>

            </div>

          </div>
        </div>

        <!-- Orders tab -->
        <div class="etab-pane" id="etab-orders">
          <div class="orders-pane" id="orders-pane">
            <div class="orders-toolbar">
              <select id="orders-status-filter" style="flex:1;padding:6px 8px;font-size:11px">
                <option value="">All orders</option>
                <option value="pending">Pending</option>
                <option value="awaiting_transfer">Awaiting Transfer</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button class="btn-ghost btn-sm" id="btn-refresh-orders">↻</button>
            </div>
            <div id="orders-list"><p class="status-msg" style="padding:12px">Load an order tab to see orders.</p></div>
          </div>
        </div>

      </div>

      <!-- Right: preview -->
      <div class="editor-right">
        <div class="preview-bar">
          <div class="preview-actions">
            <button class="preview-live-btn active" id="btn-live-preview" title="Toggle live updates">⬤ LIVE</button>
            <button class="preview-icon-btn" id="btn-preview-reload" title="Reload preview">↻</button>
            <button class="preview-icon-btn" id="btn-inspect-toggle" title="Inspect sections">⊹</button>
          </div>
          <div class="preview-actions">
            <button class="preview-mode-btn active" id="btn-preview-desktop">Desktop</button>
            <button class="preview-mode-btn" id="btn-preview-mobile">Mobile</button>
            <a class="btn-ghost btn-sm" id="btn-preview-open" target="_blank" rel="noopener">↗ Open</a>
          </div>
        </div>
        <div class="preview-frame-wrap" id="preview-frame-wrap">
          <iframe class="editor-iframe" id="preview-iframe" src="about:blank" title="Store preview"></iframe>
        </div>
      </div>

      </div><!-- /cp-dashboard -->

      <!-- Gallery panel -->
      <div class="cp-panel" id="cp-gallery">
        <div class="gallery-pane">
          <div class="gallery-pane__toolbar">
            <span class="gallery-pane__title">Image Gallery</span>
            <button class="btn-ghost btn-sm" id="btn-gallery-upload">+ Upload</button>
            <button class="btn-ghost btn-sm" id="btn-gallery-refresh">↻</button>
          </div>
          <div class="gallery-pane__grid" id="gallery-pane-grid">
            <div class="gallery-drop-hint">Drop images here to upload</div>
            <p style="color:var(--fg-faint);font-size:12px;padding:20px">Loading images…</p>
          </div>
        </div>
      </div>

      <!-- Under Development panel -->
      <div class="cp-panel" id="cp-wip">
        <div style="text-align:center;padding:60px 20px;max-width:480px">
          <div style="font-size:48px;margin-bottom:20px">🔬</div>
          <div style="font-family:var(--mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg-faint);margin-bottom:12px">Under Development</div>
          <div style="font-family:var(--serif);font-size:28px;letter-spacing:-0.01em;margin-bottom:16px">Something's brewing.</div>
          <div style="font-size:13px;color:var(--fg-soft);line-height:1.6">New tools for your store are on the way. Stay tuned.</div>
        </div>
      </div>

    </div><!-- /editor-wrap -->
  </div><!-- /screen-editor -->

  <!-- ── Canvas Image Editor ── -->
  <div class="img-editor-overlay" id="img-editor-overlay">
    <div class="img-editor-box">
      <div class="img-editor-head">
        <span class="img-editor-head__title">Edit Image</span>
        <button class="btn-ghost btn-sm" id="img-editor-reset">Reset</button>
        <button class="modal-close" id="img-editor-close">✕</button>
      </div>
      <div class="img-editor-body">
        <div class="img-editor-canvas-wrap">
          <canvas id="img-editor-canvas"></canvas>
          <div class="ie-crop-overlay" id="ie-crop-overlay">
            <div class="ie-crop-rect" id="ie-crop-rect">
              <div class="ie-handle ie-handle--tl" data-handle="tl"></div>
              <div class="ie-handle ie-handle--tm" data-handle="tm"></div>
              <div class="ie-handle ie-handle--tr" data-handle="tr"></div>
              <div class="ie-handle ie-handle--ml" data-handle="ml"></div>
              <div class="ie-handle ie-handle--mr" data-handle="mr"></div>
              <div class="ie-handle ie-handle--bl" data-handle="bl"></div>
              <div class="ie-handle ie-handle--bm" data-handle="bm"></div>
              <div class="ie-handle ie-handle--br" data-handle="br"></div>
            </div>
          </div>
        </div>
        <div class="img-editor-tools">
          <div class="img-editor-tabs">
            <button class="img-editor-tab active" data-etab="filters">Filters</button>
            <button class="img-editor-tab" data-etab="resize">Resize</button>
          </div>
          <!-- Filters panel -->
          <div class="img-editor-panel active" id="iet-filters">
            <div class="img-editor-slider">
              <label>Brightness <span id="ie-brightness-val">100%</span></label>
              <input type="range" id="ie-brightness" min="0" max="200" value="100" />
            </div>
            <div class="img-editor-slider">
              <label>Contrast <span id="ie-contrast-val">100%</span></label>
              <input type="range" id="ie-contrast" min="0" max="200" value="100" />
            </div>
            <div class="img-editor-slider">
              <label>Saturation <span id="ie-saturation-val">100%</span></label>
              <input type="range" id="ie-saturation" min="0" max="200" value="100" />
            </div>
            <div class="img-editor-slider">
              <label>Sepia <span id="ie-sepia-val">0%</span></label>
              <input type="range" id="ie-sepia" min="0" max="100" value="0" />
            </div>
            <div class="img-editor-slider">
              <label>Grayscale <span id="ie-grayscale-val">0%</span></label>
              <input type="range" id="ie-grayscale" min="0" max="100" value="0" />
            </div>
          </div>
          <!-- Resize panel -->
          <div class="img-editor-panel" id="iet-resize">
            <div class="form-field">
              <label for="ie-rw">Width (px)</label>
              <input type="number" id="ie-rw" min="1" max="4000" />
            </div>
            <div class="form-field">
              <label for="ie-rh">Height (px)</label>
              <input type="number" id="ie-rh" min="1" max="4000" />
            </div>
            <label class="toggle" style="flex-direction:row;align-items:center;gap:8px;font-size:12px">
              <input type="checkbox" id="ie-ratio-lock" checked />
              <span class="toggle__track"></span><span class="toggle__thumb"></span>
              Lock ratio
            </label>
            <button class="btn-ghost btn-sm" id="ie-apply-resize">Apply resize</button>
          </div>
        </div>
      </div>
      <div class="img-editor-foot">
        <button class="btn-ghost btn-sm" id="ie-crop-btn">✂ Crop</button>
        <button class="btn-ghost btn-sm" id="ie-apply-crop" style="display:none">✓ Apply</button>
        <button class="btn-ghost btn-sm" id="ie-cancel-crop" style="display:none">✕ Cancel crop</button>
        <div style="flex:1"></div>
        <button class="btn-ghost btn-sm" id="img-editor-cancel">Close</button>
        <button class="btn-solid btn-sm" id="img-editor-save">Save &amp; Upload</button>
      </div>
    </div>
  </div>
  <input type="file" id="gallery-upload-input" accept="image/*" style="display:none" />

  <!-- ── Section editor modal ── -->
  <div class="sec-modal-overlay" id="sec-modal-overlay">
    <div class="sec-modal-box">
      <div class="sec-editor__head">
        <span class="sec-editor__title" id="sec-editor-title"></span>
        <button class="sec-editor__close" id="sec-editor-close">✕ close</button>
      </div>
      <div class="sec-editor__fields" id="sec-editor-fields"></div>
    </div>
  </div>

  <!-- ── Image picker modal ── -->
  <div class="img-picker-overlay" id="img-picker-overlay">
    <div class="img-picker-box">
      <div class="img-picker-head">
        <span class="img-picker-title">Select Image</span>
        <button class="modal-close" id="img-picker-close">✕</button>
      </div>
      <div class="img-picker-toolbar">
        <button class="btn-ghost btn-sm" id="btn-picker-upload">↑ Upload new image</button>
        <input type="file" id="picker-upload-input" accept="image/*" style="display:none" />
      </div>
      <div class="img-picker-grid" id="img-picker-grid"></div>
    </div>
  </div>

  <!-- ── Product / item modal ── -->
  <div class="modal-overlay" id="product-modal">
    <div class="modal-box">
      <div class="modal-box__head">
        <h3 class="modal-box__title" id="pm-title">New item</h3>
        <button class="modal-close" id="pm-close">Close ✕</button>
      </div>
      <form class="modal-form" id="pm-form">
        <div class="form-row">
          <div class="form-field">
            <label for="pm-sku">SKU / ID *</label>
            <input id="pm-sku" type="text" required />
          </div>
          <div class="form-field">
            <label for="pm-name">Name *</label>
            <input id="pm-name" type="text" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label for="pm-tags">Tags (comma-separated)</label>
            <input id="pm-tags" type="text" placeholder="web, design, featured…" />
          </div>
          <div class="form-field" style="justify-content:flex-end;padding-bottom:2px">
            <label>Visible</label>
            <label class="toggle" style="margin-top:8px">
              <input type="checkbox" id="pm-visible" checked />
              <span class="toggle__track"></span><span class="toggle__thumb"></span>
            </label>
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
              <span class="toggle__track"></span><span class="toggle__thumb"></span>
            </label>
          </div>
        </div>

        <!-- Discount & Badges -->
        <div class="modal-section">
          <div class="modal-section__head" onclick="this.parentElement.classList.toggle('open')">
            <span class="modal-section__title">Discount &amp; Badges</span>
            <span style="font-size:11px;color:var(--fg-faint)">▾</span>
          </div>
          <div class="modal-section__body" style="display:none" id="pm-discount-body">
            <div class="form-row">
              <div class="form-field">
                <label for="pm-disc-type">Discount type</label>
                <select id="pm-disc-type">
                  <option value="none">None</option>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed amount ($)</option>
                </select>
              </div>
              <div class="form-field">
                <label for="pm-disc-amount">Amount</label>
                <input id="pm-disc-amount" type="number" min="0" step="0.01" placeholder="0" />
              </div>
            </div>
            <div class="form-field">
              <label>Badge</label>
              <div class="badge-opts" id="badge-opts">
                <button type="button" class="badge-opt active" data-badge="">None</button>
                <button type="button" class="badge-opt" data-badge="-20%">-20%</button>
                <button type="button" class="badge-opt" data-badge="NEW">NEW</button>
                <button type="button" class="badge-opt" data-badge="FLASH SALE">FLASH SALE</button>
                <button type="button" class="badge-opt" data-badge="custom">Custom…</button>
              </div>
              <input id="pm-badge-custom" type="text" placeholder="Custom badge text" style="display:none;margin-top:6px" />
            </div>
          </div>
        </div>

        <!-- Product image -->
        <div class="form-field">
          <label>Product image</label>
          <div class="img-field">
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

        <!-- Variations -->
        <div class="modal-section">
          <div class="modal-section__head" onclick="this.parentElement.classList.toggle('open')">
            <span class="modal-section__title">Variations</span>
            <span style="font-size:11px;color:var(--fg-faint)">▾</span>
          </div>
          <div class="modal-section__body" style="display:none">
            <p style="font-size:11px;color:var(--fg-faint);margin:0">Variations use SKU = base-SKU + V1, V2… Base SKU must not end in V+number.</p>
            <div id="pm-vars-list"></div>
            <button type="button" class="btn-ghost btn-sm" id="btn-add-variation">+ Add variation</button>
          </div>
        </div>

        <!-- Shipping dimensions -->
        <div class="modal-section">
          <div class="modal-section__head" onclick="this.parentElement.classList.toggle('open')">
            <span class="modal-section__title">Shipping dimensions</span>
            <span style="font-size:11px;color:var(--fg-faint)">▾</span>
          </div>
          <div class="modal-section__body" style="display:none">
            <p style="font-size:11px;color:var(--fg-faint);margin:0 0 8px">Used for MercadoEnvíos and Andreani shipping quotes.</p>
            <div class="form-row">
              <div class="form-field">
                <label for="pm-weight">Weight (g)</label>
                <input id="pm-weight" type="number" min="0" placeholder="500" />
              </div>
              <div class="form-field">
                <label for="pm-width">Width (cm)</label>
                <input id="pm-width" type="number" min="0" placeholder="20" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="pm-height">Height (cm)</label>
                <input id="pm-height" type="number" min="0" placeholder="15" />
              </div>
              <div class="form-field">
                <label for="pm-depth">Depth (cm)</label>
                <input id="pm-depth" type="number" min="0" placeholder="10" />
              </div>
            </div>
          </div>
        </div>

        <div class="form-field">
          <label for="pm-meta">Metadata (JSON)</label>
          <textarea id="pm-meta" rows="2" placeholder='{"color":"red","size":"M"}' style="resize:vertical;font-family:var(--mono);font-size:11px"></textarea>
        </div>
        <div class="modal-form__actions">
          <button type="button" class="btn-ghost" id="pm-cancel">Cancel</button>
          <button type="submit" class="btn-solid" id="pm-submit">Save item</button>
        </div>
        <p class="status-msg" id="pm-msg"></p>
      </form>
    </div>
  </div>

  <!-- ── Template gallery ── -->
  <div class="modal-overlay-lg" id="tmpl-overlay">
    <div class="gallery-box">
      <div class="gallery-box__head">
        <h2 class="gallery-box__title">Choose a Template</h2>
        <button class="modal-close" id="tmpl-close">Close ✕</button>
      </div>
      <p class="gallery-box__sub">Selecting a template replaces your current sections. Products and identity are kept.</p>
      <div class="gallery-grid" id="tmpl-grid"></div>
    </div>
  </div>

  <!-- ── Style gallery (shapes/borders/shadows) ── -->
  <div class="modal-overlay-lg" id="style-overlay">
    <div class="gallery-box">
      <div class="gallery-box__head">
        <h2 class="gallery-box__title">Change Style</h2>
        <button class="modal-close" id="style-close">Close ✕</button>
      </div>
      <p class="gallery-box__sub">Style controls the rounding, border thickness, and shadow depth of your storefront — not colours.</p>
      <div class="gallery-grid" id="style-grid"></div>
    </div>
  </div>

  <!-- ── Colour palette gallery ── -->
  <div class="modal-overlay-lg" id="palette-overlay">
    <div class="gallery-box">
      <div class="gallery-box__head">
        <h2 class="gallery-box__title">Colour Palette</h2>
        <button class="modal-close" id="palette-close">Close ✕</button>
      </div>
      <p class="gallery-box__sub">Choose a preset palette or set custom colours below.</p>
      <div class="gallery-grid" id="palette-grid"></div>
      <div class="palette-custom">
        <div class="palette-custom__label">Custom colours</div>
        <div class="palette-custom__row">
          <div class="form-field">
            <label>Background</label>
            <div class="hex-input">
              <input type="color" class="hex-input__swatch" id="pal-bg-sw" />
              <input type="text"  class="hex-input__text"   id="pal-bg" maxlength="9" placeholder="#efeae0" />
            </div>
          </div>
          <div class="form-field">
            <label>Text</label>
            <div class="hex-input">
              <input type="color" class="hex-input__swatch" id="pal-fg-sw" />
              <input type="text"  class="hex-input__text"   id="pal-fg" maxlength="9" placeholder="#1c1a16" />
            </div>
          </div>
          <div class="form-field">
            <label>Accent</label>
            <div class="hex-input">
              <input type="color" class="hex-input__swatch" id="pal-accent-sw" />
              <input type="text"  class="hex-input__text"   id="pal-accent" maxlength="9" placeholder="#e2a14a" />
            </div>
          </div>
        </div>
        <button class="btn-solid btn-sm" id="btn-apply-custom-pal" style="margin-top:10px">Apply Custom Colours</button>
      </div>
    </div>
  </div>

  <!-- Product picker modal -->
  <div class="modal-overlay-lg" id="product-picker-overlay" onclick="if(event.target===this)closeProductPicker()">
    <div class="modal-panel" style="max-width:600px;display:flex;flex-direction:column;max-height:85vh">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid var(--line-soft)">
        <h3 style="margin:0;font-size:16px">Choose Products</h3>
        <button class="btn-ghost btn-sm" onclick="closeProductPicker()">✕</button>
      </div>
      <!-- Bulk controls -->
      <div style="padding:12px 24px;border-bottom:1px solid var(--line-soft);display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <button class="btn-ghost btn-sm" onclick="ppSelectAll()">All</button>
        <button class="btn-ghost btn-sm" onclick="ppSelectNone()">None</button>
        <span style="font-size:11px;color:var(--fg-faint)">|</span>
        <input id="pp-price-val" type="number" min="0" step="0.01" placeholder="Price $" style="width:90px;padding:4px 8px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font-size:12px;border-radius:4px" />
        <button class="btn-ghost btn-sm" onclick="ppFilterUnder()">Under</button>
        <button class="btn-ghost btn-sm" onclick="ppFilterOver()">Over</button>
        <span id="pp-summary" style="margin-left:auto;font-size:11px;color:var(--fg-faint)"></span>
      </div>
      <!-- Product list -->
      <div id="pp-list" style="overflow-y:auto;flex:1;padding:8px 0"></div>
      <!-- Footer -->
      <div style="padding:14px 24px;border-top:1px solid var(--line-soft);display:flex;justify-content:flex-end;gap:8px">
        <button class="btn-ghost btn-sm" onclick="closeProductPicker()">Cancel</button>
        <button class="btn-solid btn-sm" onclick="confirmProductPicker()">Apply selection</button>
      </div>
    </div>
  </div>

  <!-- Product sort modal -->
  <div class="modal-overlay-lg" id="product-sort-overlay" onclick="if(event.target===this)closeProductSort()">
    <div class="modal-panel" style="max-width:480px;display:flex;flex-direction:column;max-height:80vh">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid var(--line-soft)">
        <h3 style="margin:0;font-size:15px">Sort product order</h3>
        <button class="btn-ghost btn-sm" onclick="closeProductSort()">✕</button>
      </div>
      <div id="ps-list" style="overflow-y:auto;flex:1;padding:12px 16px"></div>
      <div style="padding:12px 16px;border-top:1px solid var(--line-soft);display:flex;justify-content:flex-end;gap:8px">
        <button class="btn-ghost btn-sm" onclick="closeProductSort()">Cancel</button>
        <button class="btn-solid btn-sm" onclick="confirmProductSort()">Apply order</button>
      </div>
    </div>
  </div>

  <!-- Hidden file inputs -->
  <input type="file" id="img-upload-input" accept="image/*" style="display:none" />
  <input type="file" id="pm-img-input"     accept="image/*" style="display:none" />

  <script src="/js/dashboard.js?v=20260718e"></script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
