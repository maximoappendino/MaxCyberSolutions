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

    /* ── Screens ── */
    .screen { display: none; padding-top: var(--bar-h); }
    .screen.active { display: block; }
    #screen-editor { padding-top: 0; }

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
    .editor-wrap { display: flex; height: 100vh; padding-top: var(--bar-h); overflow: hidden; }

    /* Left panel */
    .editor-left { width: var(--panel-w); flex-shrink: 0; border-right: 1px solid var(--line);
      display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }

    /* Store at a Glance */
    .glance { display: flex; gap: 0; flex-shrink: 0; border-bottom: 1px solid var(--line); }
    .glance__stat { flex: 1; padding: 10px 12px; text-align: center; border-right: 1px solid var(--line-soft); }
    .glance__stat:last-child { border-right: none; }
    .glance__val { font-family: var(--serif); font-size: 22px; letter-spacing: -0.02em; line-height: 1; }
    .glance__lbl { font-family: var(--mono); font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--fg-faint); margin-top: 2px; }

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

    /* Section editor */
    .sec-editor { border-top: 2px solid var(--accent); background: var(--bg); display: flex; flex-direction: column; overflow: hidden; max-height: 55%; }
    .sec-editor__head { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .sec-editor__title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
    .sec-editor__close { font-family: var(--mono); font-size: 10px; background: none; border: none; color: var(--fg-faint); padding: 2px 6px; }
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
    .preview-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: #888; }
    .preview-actions { display: flex; align-items: center; gap: 8px; }
    .preview-actions .btn-ghost { border-color: #444; color: #aaa; }
    .preview-actions .btn-ghost:hover { border-color: #888; color: #eee; }
    .preview-mode-btn { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
      padding: 5px 10px; border: 1px solid #555; background: transparent; color: #888; transition: color 160ms, border-color 160ms; }
    .preview-mode-btn.active { color: var(--accent); border-color: var(--accent); }
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
      <span class="d-bar__email" id="d-email"></span>
      <button class="d-bar__logout" id="d-logout">Sign out</button>
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
      <div class="sec-head">
        <p class="sec-head__tag">§ Stores</p>
        <h2 class="sec-head__title">Your storefronts.</h2>
      </div>
      <div class="stores-grid" id="stores-grid"></div>
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

      <!-- Left panel -->
      <div class="editor-left" id="editor-left">

        <div class="glance" id="glance"></div>

        <div class="etabs">
          <button class="etab active" data-tab="design">Design</button>
          <button class="etab" data-tab="sections">Sections</button>
          <button class="etab" data-tab="items">Items</button>
          <button class="etab" data-tab="config">Config</button>
        </div>

        <!-- Design tab -->
        <div class="etab-pane active" id="etab-design">
          <div class="design-pane">

            <!-- Templates & Style (top) -->
            <div class="pane-section">
              <span class="pane-section__label">Look &amp; Feel</span>
              <button class="btn-ghost btn-sm" id="btn-change-tmpl" style="width:100%">⊞ Change Template</button>
              <button class="btn-ghost btn-sm" id="btn-change-style" style="width:100%">◈ Change Style</button>
              <button class="btn-ghost btn-sm" id="btn-change-palette" style="width:100%">⬡ Colour Palette</button>
            </div>

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

            <!-- Custom buttons -->
            <div class="pane-section">
              <span class="pane-section__label">Custom Buttons (up to 3)</span>
              <div id="custom-btns-list"></div>
              <button class="btn-ghost btn-sm" id="btn-add-custom-btn" style="margin-top:4px">+ Add button</button>
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
          </div>
        </div>
      </div>

      <!-- Right: preview -->
      <div class="editor-right">
        <div class="preview-bar">
          <span class="preview-label" id="preview-label">Live Preview</span>
          <div class="preview-actions">
            <button class="preview-mode-btn active" id="btn-preview-desktop">Desktop</button>
            <button class="preview-mode-btn" id="btn-preview-mobile">Mobile</button>
            <button class="btn-ghost btn-sm" id="btn-preview-refresh">↻ Refresh</button>
            <a class="btn-ghost btn-sm" id="btn-preview-open" target="_blank" rel="noopener">↗ Open</a>
          </div>
        </div>
        <div class="preview-frame-wrap" id="preview-frame-wrap">
          <iframe class="editor-iframe" id="preview-iframe" src="about:blank" title="Store preview"></iframe>
        </div>
      </div>
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

  <!-- Hidden file inputs -->
  <input type="file" id="img-upload-input" accept="image/*" style="display:none" />
  <input type="file" id="pm-img-input"     accept="image/*" style="display:none" />

  <script src="/js/dashboard.js"></script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
