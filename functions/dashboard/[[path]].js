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
    /* Notification bell */
    .d-bar__notif { position: relative; background: none; border: none; padding: 6px 8px; color: var(--fg-faint); font-size: 16px; line-height: 1; transition: color 120ms ease; }
    .d-bar__notif:hover { color: var(--fg); }
    .d-bar__notif-badge {
      position: absolute; top: 2px; right: 2px;
      background: var(--accent); color: #fff;
      font-family: var(--mono); font-size: 8px; font-weight: 600;
      min-width: 14px; height: 14px; border-radius: 7px;
      display: flex; align-items: center; justify-content: center; padding: 0 3px;
      pointer-events: none;
    }
    .d-notif-panel {
      position: fixed; top: var(--bar-h); right: 60px;
      width: 340px; background: var(--bg); border: 1px solid var(--line);
      box-shadow: 0 8px 24px rgba(0,0,0,.12); z-index: 200;
      flex-direction: column; max-height: 480px; display: none;
    }
    .d-notif-panel:not([hidden]) { display: flex; }
    .d-notif-panel__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--line-soft); }
    .d-notif-panel__title { font-family: var(--mono); font-size: 10px; letter-spacing: .13em; text-transform: uppercase; }
    .d-notif-panel__mark-all { font-family: var(--mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; background: none; border: none; color: var(--accent); cursor: pointer; }
    .d-notif-list { overflow-y: auto; flex: 1; }
    .d-notif-item { padding: 12px 16px; border-bottom: 1px solid var(--line-soft); cursor: pointer; transition: background 120ms ease; }
    .d-notif-item:hover { background: var(--accent-soft); }
    .d-notif-item--unread { background: color-mix(in srgb, var(--accent) 4%, var(--bg)); }
    .d-notif-item__title { font-size: 13px; font-weight: 500; margin-bottom: 3px; }
    .d-notif-item__body  { font-size: 12px; color: var(--fg-faint); line-height: 1.4; }
    .d-notif-item__time  { font-family: var(--mono); font-size: 9px; letter-spacing: .08em; color: var(--fg-faint); margin-top: 4px; }
    .d-notif-empty { padding: 28px; text-align: center; font-family: var(--mono); font-size: 10px; letter-spacing: .1em; color: var(--fg-faint); }
    /* Verification banner */
    .d-verify-banner {
      background: color-mix(in srgb, var(--accent) 10%, var(--bg));
      border-bottom: 1px solid var(--accent);
      padding: 10px 20px; align-items: center; gap: 12px;
      font-family: var(--mono); font-size: 10px; letter-spacing: .1em;
      display: none;
    }
    .d-verify-banner:not([hidden]) { display: flex; }
    .d-verify-banner a { color: var(--accent); text-decoration: underline; cursor: pointer; }
    /* Checkout modal (for plan upsell in dashboard) */
    .co-modal { position: fixed; inset: 0; z-index: 900; display: flex; align-items: center; justify-content: center; }
    .co-modal[hidden] { display: none; }
    .co-modal__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); }
    .co-modal__box { position: relative; z-index: 1; background: var(--bg); border: 1px solid var(--line); width: min(520px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); overflow-y: auto; padding: 36px 36px 40px; display: flex; flex-direction: column; gap: 24px; }
    .co-modal__close { position: absolute; top: 14px; right: 18px; background: none; border: none; cursor: pointer; font-size: 22px; line-height: 1; padding: 4px 8px; color: var(--fg-faint); transition: color 120ms ease; }
    .co-modal__close:hover { color: var(--fg); }
    .co-modal__head { display: flex; flex-direction: column; gap: 6px; border-bottom: 1px solid var(--line-soft); padding-bottom: 20px; }
    .co-modal__plan { font-family: var(--serif); font-size: 22px; }
    .co-modal__price { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; color: var(--fg-faint); }
    .co-step { display: flex; flex-direction: column; gap: 14px; }
    .co-group { display: flex; flex-direction: column; gap: 5px; }
    .co-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint); display: block; }
    .co-required { color: var(--accent); letter-spacing: 0; }
    .co-optional { font-style: italic; text-transform: none; letter-spacing: 0; font-size: 9px; opacity: 0.75; }
    .co-pw-wrap { position: relative; display: flex; }
    .co-input--pw { flex: 1; padding-right: 48px; }
    .co-pw-toggle { position: absolute; right: 0; top: 0; bottom: 0; width: 44px; background: none; border: none; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; color: var(--fg-faint); }
    .co-pw-toggle:hover { color: var(--fg); }
    .co-input { font-family: var(--sans); font-size: 14px; color: var(--fg); background: transparent; border: 1px solid var(--line); padding: 11px 14px; outline: none; width: 100%; transition: border-color 160ms ease; }
    .co-input:focus { border-color: var(--accent); }
    .co-input::placeholder { color: var(--fg-faint); font-size: 13px; }
    .co-btn { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; padding: 14px 28px; background: var(--fg); color: var(--bg); border: 1px solid var(--fg); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: opacity 160ms ease; width: 100%; }
    .co-btn:hover { opacity: 0.85; }
    .co-note { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; color: var(--fg-faint); margin: 0; text-align: center; }
    .co-msg { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; color: var(--fg-faint); margin: 0; }
    .co-msg--error { color: #c44; }
    .co-success { font-family: var(--serif); font-size: 18px; text-align: center; padding: 24px 0; line-height: 1.5; }
    /* Upsell tier mini-cards */
    .upsell-tiers { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; width: 100%; max-width: 880px; }
    .upsell-tier { border: 1px solid var(--line); padding: 22px 18px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: border-color 180ms ease; }
    .upsell-tier:hover { border-color: var(--fg); }
    .upsell-tier--featured { border-color: var(--accent); }
    .upsell-tier__name { font-family: var(--mono); font-size: 10px; letter-spacing: .13em; text-transform: uppercase; color: var(--fg-faint); }
    .upsell-tier--featured .upsell-tier__name { color: var(--accent); }
    .upsell-tier__price { font-family: var(--serif); font-size: 28px; line-height: 1; }
    .upsell-tier__price small { font-size: 12px; color: var(--fg-faint); font-family: var(--sans); }
    .upsell-tier__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--fg-soft); flex: 1; }
    .upsell-tier__cta { font-family: var(--mono); font-size: 10px; letter-spacing: .13em; text-transform: uppercase; padding: 9px 14px; border: 1px solid var(--line); background: transparent; color: var(--fg-soft); cursor: pointer; transition: color 160ms ease, border-color 160ms ease; margin-top: 4px; }
    .upsell-tier__cta:hover { color: var(--fg); border-color: var(--fg); }
    .upsell-tier--featured .upsell-tier__cta { background: var(--accent); color: #fff; border-color: var(--accent); }
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
    .cp-tabbar { display: flex; align-items: center; border-bottom: 1px solid var(--line); flex-shrink: 0; background: var(--bg); overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .cp-tab { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; padding: 9px 16px; border: none; background: transparent; color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 160ms; cursor: pointer; flex-shrink: 0; white-space: nowrap; }
    .cp-tab:hover { color: var(--fg); }
    .cp-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .cp-panel { display: none; flex: 1; overflow: hidden; }
    .cp-panel.active { display: flex; }
    #cp-dashboard     { flex-direction: row; }
    #cp-gallery       { flex-direction: column; align-items: stretch; }
    #cp-orders        { flex-direction: column; align-items: stretch; }
    #cp-reservations  { flex-direction: row; }
    #cp-wip           { align-items: center; justify-content: center; }

    /* ── Reservations tab ── */
    .rv-wrap { display: flex; flex: 1; overflow: hidden; }
    .rv-cal { flex-shrink: 0; width: 280px; border-right: 1px solid var(--line); display: flex; flex-direction: column; overflow-y: auto; }
    .rv-cal__nav { display: flex; align-items: center; justify-content: space-between; padding: 9px 10px; border-bottom: 1px solid var(--line-soft); flex-shrink: 0; }
    .rv-cal__navtitle { font-family: var(--mono); font-size: 9px; letter-spacing: .12em; font-weight: 600; text-transform: uppercase; }
    .rv-cal__navbtn { background: none; border: none; cursor: pointer; font-size: 18px; color: var(--fg-faint); padding: 0 5px; line-height: 1; }
    .rv-cal__navbtn:hover { color: var(--fg); }
    .rv-cal__body { flex-shrink: 0; padding: 8px 6px; }
    .rv-cal__wdays { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 2px; }
    .rv-cal__wday { font-family: var(--mono); font-size: 8px; text-align: center; padding: 3px 0; color: var(--fg-faint); }
    .rv-cal__days { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
    .rv-cal__day { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 4px; font-size: 11px; position: relative; border: 1px solid transparent; transition: background 120ms; }
    .rv-cal__day:hover:not(.empty) { background: var(--line-soft); }
    .rv-cal__day.today { font-weight: 700; color: var(--accent); }
    .rv-cal__day.selected { background: var(--accent) !important; color: #fff !important; border-color: var(--accent); }
    .rv-cal__day.has-rv::after { content:''; position:absolute; bottom:2px; width:4px; height:4px; border-radius:50%; background:var(--accent); }
    .rv-cal__day.selected.has-rv::after { background:rgba(255,255,255,.65); }
    .rv-cal__day.empty { pointer-events: none; }
    .rv-cal__day.drop-ok { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--bg)); }
    .rv-day { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
    .rv-day__hdr { padding: 9px 12px; border-bottom: 1px solid var(--line-soft); display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .rv-day__title { font-family: var(--mono); font-size: 9px; letter-spacing: .08em; font-weight: 600; flex: 1; text-transform: uppercase; }
    .rv-day__count { font-family: var(--mono); font-size: 9px; color: var(--fg-faint); }
    .rv-day__list  { flex: 1; overflow-y: auto; padding: 8px 10px; }
    .rv-day__empty { font-size: 12px; color: var(--fg-faint); padding: 28px 6px; text-align: center; }
    .rv-item { background: var(--line-soft); border: 1px solid var(--line); border-radius: 6px; padding: 10px 12px; margin-bottom: 6px; cursor: grab; transition: box-shadow 150ms; }
    .rv-item:active { cursor: grabbing; box-shadow: 0 4px 12px rgba(0,0,0,.14); }
    .rv-item.dragging { opacity: 0.4; }
    .rv-item__time { font-family: var(--mono); font-size: 10px; color: var(--accent); margin-bottom: 3px; }
    .rv-item__name { font-size: 13px; font-weight: 500; }
    .rv-item__sub  { font-size: 11px; color: var(--fg-faint); margin-top: 2px; }
    .rv-item__badges { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 6px; }
    .rv-item__badge { font-family: var(--mono); font-size: 8px; letter-spacing: .08em; text-transform: uppercase; padding: 1px 5px; border: 1px solid; }
    .rv-item__badge--confirmed { color: #1a6b3a; border-color: #1a6b3a; }
    .rv-item__badge--pending   { color: #9a6200; border-color: #9a6200; }
    .rv-item__badge--cancelled { color: var(--fg-faint); border-color: var(--fg-faint); }
    .rv-item__actions { display: flex; gap: 5px; margin-top: 8px; }
    .rv-edit-form { border-top: 1px solid var(--line); margin-top: 8px; padding-top: 8px; }
    .rv-notes-area { flex-shrink: 0; border-top: 1px solid var(--line-soft); padding: 10px 12px; }
    .rv-notes-label { font-family: var(--mono); font-size: 8px; letter-spacing: .12em; text-transform: uppercase; color: var(--fg-faint); display: block; margin-bottom: 5px; }
    .rv-notes-area textarea { width: 100%; box-sizing: border-box; resize: none; font-family: var(--mono); font-size: 11px; background: var(--line-soft); border: 1px solid var(--line); border-radius: 4px; padding: 6px 8px; color: var(--fg); }
    /* Reservations — booking settings */
    .rv-link { font-family: var(--mono); font-size: 8px; letter-spacing: .06em; color: var(--fg-faint); word-break: break-all; margin-top: 4px; }

    /* Gallery upload progress */
    .gallery-upload-bar { height: 28px; background: var(--line-soft); display: flex; align-items: center; gap: 10px; padding: 0 14px; border-bottom: 1px solid var(--line); position: relative; overflow: hidden; flex-shrink: 0; }
    .gallery-upload-bar__fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--accent); opacity: 0.22; transition: width 80ms linear; width: 0%; }
    .gallery-upload-bar__pct { font-family: var(--mono); font-size: 9px; letter-spacing: .1em; position: relative; z-index: 1; color: var(--fg); }
    /* Global thin upload bar (for section-image uploads) */
    .global-upload-bar { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 9000; background: transparent; pointer-events: none; }
    .global-upload-bar__fill { height: 100%; background: var(--accent); transition: width 80ms linear; width: 0%; }

    /* Gallery panel */
    .gallery-pane { display: flex; flex-direction: column; width: 100%; flex: 1; min-height: 0; }
    .gallery-pane__toolbar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; flex-wrap: wrap; }
    .gallery-pane__title { font-family: var(--mono); font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: var(--fg-faint); flex: 1; }
    .gallery-sort-btns { display: flex; gap: 3px; }
    .gallery-sort-btn { font-family: var(--mono); font-size: 8px; letter-spacing: .06em; padding: 3px 7px; border: 1px solid var(--line); background: none; color: var(--fg-faint); cursor: pointer; text-transform: uppercase; }
    .gallery-sort-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .gallery-pane__grid { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px,1fr)); gap: 12px; align-content: start; }
    .gallery-item { position: relative; border: 1px solid var(--line); overflow: hidden; }
    .gallery-item__img { width: 100%; aspect-ratio: 1; object-fit: contain; display: block; background: var(--line-soft); padding: 4px; }
    .gallery-item__actions { position: absolute; inset: 0; background: rgba(0,0,0,.55); display: none; align-items: center; justify-content: center; gap: 8px; }
    .gallery-item:hover .gallery-item__actions { display: flex; }
    .gallery-item__btn { font-family: var(--mono); font-size: 10px; padding: 5px 10px; border: 1px solid rgba(255,255,255,.4); background: rgba(0,0,0,.4); color: #fff; cursor: pointer; transition: background 150ms; }
    .gallery-item__btn:hover { background: rgba(0,0,0,.7); }
    .gallery-item__meta { font-family: var(--mono); font-size: 8px; letter-spacing: .06em; color: var(--fg-faint); padding: 4px 6px 5px; display: flex; flex-direction: column; gap: 1px; }
    .gallery-item__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .gallery-load-more { grid-column: 1/-1; font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; padding: 10px; border: 1px solid var(--line); background: none; color: var(--fg-faint); cursor: pointer; }
    .gallery-load-more:hover { background: var(--line-soft); color: var(--fg); }
    .gallery-empty { grid-column: 1/-1; color: var(--fg-faint); font-size: 13px; text-align: center; padding: 40px; }
    .gallery-pane__grid.drag-over { outline: 2px dashed var(--accent); outline-offset: -6px; background: color-mix(in srgb, var(--accent) 8%, var(--bg)); }
    .gallery-drop-hint { grid-column: 1/-1; text-align: center; padding: 24px; font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--fg-faint); border: 2px dashed var(--line); }

    /* Image picker modal */
    .img-picker-overlay { position: fixed; inset: 0; z-index: 500; background: rgba(0,0,0,.65); display: none; align-items: center; justify-content: center; }
    .img-picker-overlay.active { display: flex; }
    .icon-picker-overlay { position: fixed; inset: 0; z-index: 510; background: rgba(0,0,0,.65); display: none; align-items: center; justify-content: center; }
    .icon-picker-overlay.active { display: flex; }
    .icon-picker-box { background: var(--bg); width: min(600px,96vw); max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); border-radius: 4px; }
    .icon-picker-head { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .icon-picker-title { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; flex: 1; }
    .icon-picker-grid { flex: 1; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(80px,1fr)); gap: 10px; align-content: start; }
    .icon-picker-item { border: 2px solid transparent; border-radius: 6px; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; background: var(--line-soft); }
    .icon-picker-item:hover { border-color: var(--accent); }
    .icon-picker-item img { width: 40px; height: 40px; object-fit: contain; display: block; }
    .img-picker-box { background: var(--bg); width: min(780px, 96vw); max-height: 88vh; display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--line); }
    .img-picker-head { display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .img-picker-title { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; flex: 1; }
    .img-picker-toolbar { display: flex; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
    .img-picker-grid { flex: 1; overflow-y: auto; padding: 16px; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px,1fr)); gap: 12px; align-content: start; }
    .picker-item { position: relative; border: 2px solid transparent; overflow: hidden; cursor: pointer; }
    .picker-item img { width: 100%; aspect-ratio: 1; object-fit: contain; display: block; background: var(--line-soft); padding: 4px; }
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
    .etabs { display: flex; border-bottom: 1px solid var(--line); flex-shrink: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .etab  { flex-shrink: 0; font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 10px 14px; border: none; background: transparent;
      color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 160ms; white-space: nowrap; }
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
    .pp-order-item { display:flex; align-items:center; gap:8px; padding:5px 24px; }
    .pp-order-num { font-family:var(--mono); font-size:9px; letter-spacing:.05em; color:var(--fg-faint); min-width:16px; text-align:right; }
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

    /* ══════════════════════ FINANCE ══════════════════════ */
    #cp-finance { flex-direction: column; align-items: stretch; overflow: hidden; }
    .fin-wrap { display: flex; flex-direction: column; width: 100%; height: 100%; overflow: hidden; }
    .fin-tabbar { display: flex; border-bottom: 1px solid var(--line); flex-shrink: 0; background: var(--bg); overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .fin-tab { font-family: var(--mono); font-size: 9px; letter-spacing: 0.13em; text-transform: uppercase; padding: 9px 18px; border: none; background: transparent; color: var(--fg-faint); border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer; white-space: nowrap; transition: color 160ms; flex-shrink: 0; }
    .fin-tab:hover  { color: var(--fg); }
    .fin-tab.active { color: var(--accent); border-bottom-color: var(--accent); }
    .fin-pane { display: none; flex: 1; overflow-y: auto; padding: 24px; }
    .fin-pane.active { display: block; }
    .fin-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 18px; }
    .fin-toolbar input, .fin-toolbar select { flex: none; width: auto; padding: 6px 10px; font-size: 12px; }
    .fin-toolbar-spacer { flex: 1; }

    /* Stat cards */
    .fin-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .fin-card { border: 1px solid var(--line); padding: 18px 16px; }
    .fin-card__label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 6px; }
    .fin-card__value { font-family: var(--serif); font-size: 26px; letter-spacing: -0.02em; line-height: 1; }
    .fin-card__delta { font-family: var(--mono); font-size: 10px; margin-top: 6px; color: var(--fg-faint); }
    .fin-card__delta--up   { color: #22c55e; }
    .fin-card__delta--down { color: #ef4444; }
    .fin-card--income  .fin-card__value { color: #22c55e; }
    .fin-card--expense .fin-card__value { color: #ef4444; }

    /* Charts */
    .fin-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .fin-chart-box { border: 1px solid var(--line); padding: 16px; }
    .fin-chart-box__label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .fin-bar-list { display: flex; flex-direction: column; gap: 8px; }
    .fin-bar-item { display: flex; align-items: center; gap: 10px; }
    .fin-bar-item__label { font-size: 12px; width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
    .fin-bar-item__track { flex: 1; height: 6px; background: var(--line-soft); }
    .fin-bar-item__fill  { height: 100%; transition: width 400ms; }
    .fin-bar-item__amt   { font-family: var(--mono); font-size: 10px; color: var(--fg-faint); width: 72px; text-align: right; flex-shrink: 0; }

    /* Contacts top list */
    .fin-top-list { display: flex; flex-direction: column; gap: 6px; }
    .fin-top-row  { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 6px 0; border-bottom: 1px solid var(--line-soft); }
    .fin-top-row__name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fin-top-row__amt  { font-family: var(--mono); font-size: 11px; flex-shrink: 0; }

    /* Transactions table */
    .fin-table-wrap { overflow-x: auto; }
    .fin-table { width: 100%; border-collapse: collapse; min-width: 640px; }
    .fin-table th { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-faint); text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line); background: var(--bg); position: sticky; top: 0; }
    .fin-table td { padding: 9px 10px; border-bottom: 1px solid var(--line-soft); font-size: 13px; vertical-align: middle; }
    .fin-table tr.fin-voided td { opacity: 0.38; text-decoration: line-through; }
    .fin-table tr.fin-voided td:last-child { text-decoration: none; }
    .fin-cat-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; vertical-align: middle; }
    .fin-type-pill { font-family: var(--mono); font-size: 9px; padding: 2px 7px; border: 1px solid; text-transform: uppercase; letter-spacing: 0.08em; }
    .fin-type-pill--income  { color: #22c55e; border-color: #22c55e; }
    .fin-type-pill--expense { color: #ef4444; border-color: #ef4444; }
    .fin-amount--income  { font-family: var(--mono); color: #22c55e; }
    .fin-amount--expense { font-family: var(--mono); color: #ef4444; }
    .fin-tx-actions { display: flex; gap: 6px; align-items: center; }
    .fin-pager { display: flex; gap: 8px; align-items: center; margin-top: 16px; font-family: var(--mono); font-size: 11px; color: var(--fg-faint); }

    /* Contacts */
    .fin-toggle { display: flex; }
    .fin-toggle-btn { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; padding: 7px 16px; border: 1px solid var(--line); background: transparent; color: var(--fg-faint); cursor: pointer; transition: all 120ms; }
    .fin-toggle-btn:first-child { border-right: none; }
    .fin-toggle-btn.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
    .fin-contacts-table { width: 100%; border-collapse: collapse; }
    .fin-contacts-table th { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-faint); text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--line); }
    .fin-contacts-table td { padding: 10px; border-bottom: 1px solid var(--line-soft); font-size: 13px; vertical-align: middle; }
    .fin-contacts-table tr:hover td { background: var(--accent-soft); cursor: pointer; }

    /* Reports */
    .fin-pl-section { margin-bottom: 24px; }
    .fin-pl-title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 10px; }
    .fin-pl-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .fin-pl-table td { padding: 7px 8px; border-bottom: 1px solid var(--line-soft); font-size: 13px; }
    .fin-pl-table td:last-child { text-align: right; font-family: var(--mono); }
    .fin-pl-total { font-family: var(--serif); font-size: 15px; font-weight: 500; border-top: 1px solid var(--line) !important; }
    .fin-net-row  { font-family: var(--serif); font-size: 18px; padding: 14px 8px; display: flex; justify-content: space-between; border-top: 2px solid var(--fg); margin-top: 4px; }

    /* SVG trend chart */
    .fin-svg-chart { width: 100%; overflow: visible; }

    /* Modal */
    .fin-modal-overlay { position: fixed; inset: 0; z-index: 600; background: rgba(0,0,0,.5); display: none; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto; }
    .fin-modal-overlay.active { display: flex; }
    .fin-modal { background: var(--bg); color: var(--fg); width: min(580px, 100%); padding: 28px 24px; position: relative; }
    .fin-modal__title { font-family: var(--serif); font-size: 22px; letter-spacing: -0.01em; margin: 0 0 20px; }
    .fin-modal__close { position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 18px; color: var(--fg-faint); cursor: pointer; padding: 4px 8px; }
    .fin-modal__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fin-modal__field { display: flex; flex-direction: column; gap: 4px; }
    .fin-modal__field--full { grid-column: 1/-1; }
    .fin-type-toggle { display: flex; gap: 0; }
    .fin-type-btn { flex: 1; font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 9px; border: 1px solid var(--line); background: transparent; color: var(--fg-faint); cursor: pointer; transition: all 120ms; }
    .fin-type-btn:first-child { border-right: none; }
    .fin-type-btn.active[data-t="income"]  { background: #22c55e; color: #fff; border-color: #22c55e; }
    .fin-type-btn.active[data-t="expense"] { background: #ef4444; color: #fff; border-color: #ef4444; }
    .fin-modal__actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

    @media (max-width: 700px) {
      .fin-cards { grid-template-columns: 1fr; }
      .fin-charts-row { grid-template-columns: 1fr; }
      .fin-modal__grid { grid-template-columns: 1fr; }
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
      <button class="d-bar__notif" id="d-notif-btn" aria-label="Notifications" title="Notifications">
        🔔<span class="d-bar__notif-badge" id="d-notif-badge" hidden>0</span>
      </button>
      <button class="d-bar__logout" id="d-logout">Sign out</button>
    </div>
  </div>

  <!-- Notification panel (positioned absolute relative to bar) -->
  <div class="d-notif-panel" id="d-notif-panel" hidden>
    <div class="d-notif-panel__head">
      <span class="d-notif-panel__title">Notifications</span>
      <button class="d-notif-panel__mark-all" id="d-notif-mark-all">Mark all read</button>
    </div>
    <div class="d-notif-list" id="d-notif-list">
      <p class="d-notif-empty">No notifications</p>
    </div>
  </div>

  <!-- Email verification banner (shown when email_verified=false) -->
  <div class="d-verify-banner" id="d-verify-banner" hidden>
    ✉ Please verify your email address to unlock store creation.
    &nbsp;<a id="d-resend-link">Resend verification email</a>
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

  <!-- ── Paused (admin or subscription lapse) ── -->
  <div class="screen" id="screen-paused">
    <div class="login-wrap">
      <div class="login-box" style="text-align:center">
        <div style="font-size:48px;margin-bottom:16px">⏸</div>
        <span class="login-box__tag">MaxCyberSolutions</span>
        <h1 class="login-box__title" style="margin-top:8px" id="paused-title">Account Paused</h1>
        <p class="login-box__sub" style="margin-top:12px" id="paused-body">Your dashboard has been temporarily paused. Please contact support to resume access.</p>
        <a href="https://maxcybersolutions.online/#pricing" class="login-submit" id="paused-resubscribe" style="display:none;margin-top:20px;max-width:260px;align-self:center;text-decoration:none">Re-subscribe →</a>
        <button class="login-submit" style="margin-top:16px;max-width:260px;align-self:center" onclick="logout()">Sign out</button>
      </div>
    </div>
  </div>

  <!-- ── Client upsell (role=client, no subscription) ── -->
  <div class="screen" id="screen-upsell">
    <div class="ob-wrap" style="flex-direction:column;gap:36px;padding-top:48px">
      <div style="text-align:center">
        <span class="login-box__tag">MaxCyberSolutions</span>
        <h1 class="login-box__title" style="margin-top:8px">Choose a plan</h1>
        <p class="login-box__sub" style="margin-top:10px">Subscribe to create and manage your online store.</p>
      </div>
      <div class="upsell-tiers">
        <div class="upsell-tier" data-checkout-plan="basic" data-checkout-name="Basic" data-checkout-price="$15/mo">
          <div class="upsell-tier__name">Basic</div>
          <div class="upsell-tier__price">$15<small>/mo</small></div>
          <ul class="upsell-tier__list"><li>50 MB Storage</li><li>1 update / day</li><li>1 website</li><li>Dashboard</li></ul>
          <button type="button" class="upsell-tier__cta" data-checkout-plan="basic" data-checkout-name="Basic" data-checkout-price="$15/mo">Subscribe</button>
        </div>
        <div class="upsell-tier" data-checkout-plan="plus" data-checkout-name="Plus" data-checkout-price="$20/mo">
          <div class="upsell-tier__name">Plus</div>
          <div class="upsell-tier__price">$20<small>/mo</small></div>
          <ul class="upsell-tier__list"><li>100 MB Storage</li><li>3 updates / day</li><li>MercadoPago</li><li>MercadoEnvíos</li></ul>
          <button type="button" class="upsell-tier__cta" data-checkout-plan="plus" data-checkout-name="Plus" data-checkout-price="$20/mo">Subscribe</button>
        </div>
        <div class="upsell-tier upsell-tier--featured" data-checkout-plan="pro" data-checkout-name="Pro" data-checkout-price="$30/mo">
          <div class="upsell-tier__name">Pro — Most Popular</div>
          <div class="upsell-tier__price">$30<small>/mo</small></div>
          <ul class="upsell-tier__list"><li>500 MB Storage</li><li>10 updates / day</li><li>2 websites</li><li>Customer Management</li></ul>
          <button type="button" class="upsell-tier__cta" data-checkout-plan="pro" data-checkout-name="Pro" data-checkout-price="$30/mo">Subscribe</button>
        </div>
        <div class="upsell-tier" data-checkout-plan="ultra" data-checkout-name="Ultra" data-checkout-price="$50/mo">
          <div class="upsell-tier__name">Ultra</div>
          <div class="upsell-tier__price">$50<small>/mo</small></div>
          <ul class="upsell-tier__list"><li>2 GB Storage</li><li>30 updates / day</li><li>5 websites</li><li>Analytics</li></ul>
          <button type="button" class="upsell-tier__cta" data-checkout-plan="ultra" data-checkout-name="Ultra" data-checkout-price="$50/mo">Subscribe</button>
        </div>
      </div>
      <button class="btn-ghost btn-sm" onclick="logout()" style="align-self:center">Sign out</button>
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
          <button class="login-tab" data-tab="register">Create account</button>
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
        <button class="cp-tab" id="btn-back-stores" onclick="showScreen('stores')" style="color:var(--fg-faint);padding-right:18px;border-right:1px solid var(--line);margin-right:4px">← Stores</button>
        <button class="cp-tab active" data-cp-tab="dashboard">Dashboard</button>
        <button class="cp-tab" data-cp-tab="gallery">Gallery</button>
        <button class="cp-tab" data-cp-tab="orders">Orders</button>
        <button class="cp-tab" data-cp-tab="reservations">Reservations</button>
        <button class="cp-tab" data-cp-tab="finance">Finance</button>
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
          <button class="etab" data-tab="management">Mgmt</button>
          <button class="etab" data-tab="analytics">Analytics</button>
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

        <!-- Management tab -->
        <div class="etab-pane" id="etab-management">
          <div style="padding:12px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              <span style="font-family:var(--mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg-faint)">Customers</span>
              <button class="btn-ghost btn-sm" id="btn-refresh-customers">↻</button>
            </div>
            <div style="display:flex;gap:6px;margin-bottom:10px">
              <input id="cust-search" type="search" placeholder="Search by name or email…" style="flex:1;padding:6px 8px;font-size:11px"/>
              <button class="btn-ghost btn-sm" onclick="openAddCustomerForm()" style="white-space:nowrap">+ Add</button>
            </div>
            <div id="add-customer-form" style="display:none;border:1px solid var(--line);padding:10px;margin-bottom:10px;background:var(--bg)">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
                <div><label style="font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-faint)">Email *</label><input id="c-email" type="email" style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--line)"/></div>
                <div><label style="font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-faint)">Name</label><input id="c-name" style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--line)"/></div>
                <div><label style="font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-faint)">Phone</label><input id="c-phone" style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--line)"/></div>
                <div><label style="font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-faint)">City</label><input id="c-city" style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--line)"/></div>
                <div><label style="font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-faint)">Group</label><input id="c-group" placeholder="VIP, Wholesale…" style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--line)"/></div>
                <div><label style="font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--fg-faint)">Discount %</label><input id="c-discount" type="number" min="0" max="100" value="0" style="width:100%;padding:6px 8px;font-size:12px;border:1px solid var(--line)"/></div>
              </div>
              <div style="display:flex;gap:6px">
                <button class="btn-ghost btn-sm" onclick="saveCustomer()">Save</button>
                <button class="btn-ghost btn-sm" onclick="document.getElementById('add-customer-form').style.display='none'">Cancel</button>
              </div>
              <p id="cust-form-msg" style="font-family:var(--mono);font-size:10px;margin-top:6px;display:none"></p>
            </div>
            <div id="customers-list"><p class="status-msg" style="padding:12px">Click the tab to load customers.</p></div>
          </div>
        </div>

        <!-- Analytics tab -->
        <div class="etab-pane" id="etab-analytics">
          <div style="padding:12px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
              <span style="font-family:var(--mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg-faint)">Analytics</span>
              <button class="btn-ghost btn-sm" id="btn-refresh-analytics">↻</button>
            </div>
            <div id="analytics-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px"></div>
            <div style="font-family:var(--mono);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg-faint);margin-bottom:8px">Inventory</div>
            <div id="analytics-inventory"><p class="status-msg" style="padding:12px">Click the tab to load analytics.</p></div>
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

      <!-- Global upload progress indicator -->
      <div id="global-upload-bar" class="global-upload-bar" hidden>
        <div id="global-upload-bar-fill" class="global-upload-bar__fill"></div>
      </div>

      <!-- Gallery panel -->
      <div class="cp-panel" id="cp-gallery">
        <div class="gallery-pane">
          <div class="gallery-pane__toolbar">
            <span class="gallery-pane__title">Image Gallery</span>
            <div class="gallery-sort-btns">
              <button class="gallery-sort-btn active" id="gsort-date-desc" onclick="setGallerySort('date-desc')">Date ↓</button>
              <button class="gallery-sort-btn" id="gsort-date-asc" onclick="setGallerySort('date-asc')">Date ↑</button>
              <button class="gallery-sort-btn" id="gsort-name-asc" onclick="setGallerySort('name-asc')">A–Z</button>
              <button class="gallery-sort-btn" id="gsort-name-desc" onclick="setGallerySort('name-desc')">Z–A</button>
            </div>
            <button class="btn-ghost btn-sm" id="btn-gallery-upload">+ Upload</button>
            <button class="btn-ghost btn-sm" id="btn-gallery-refresh">↻</button>
          </div>
          <div id="gallery-upload-bar" class="gallery-upload-bar" hidden>
            <div class="gallery-upload-bar__fill" id="gallery-upload-bar-fill"></div>
            <span class="gallery-upload-bar__pct" id="gallery-upload-bar-pct">0%</span>
          </div>
          <div class="gallery-pane__grid" id="gallery-pane-grid">
            <div class="gallery-drop-hint">Drop images here to upload</div>
            <p style="color:var(--fg-faint);font-size:12px;padding:20px">Loading images…</p>
          </div>
        </div>
      </div>

      <!-- Orders panel -->
      <div class="cp-panel" id="cp-orders">
        <div class="orders-pane">
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
          <div id="orders-list"><p class="status-msg" style="padding:12px">Select the Orders tab to load orders.</p></div>
        </div>
      </div>

      <!-- Reservations panel -->
      <div class="cp-panel" id="cp-reservations">
        <div class="rv-wrap">
          <div class="rv-cal">
            <div class="rv-cal__nav">
              <button class="rv-cal__navbtn" id="rv-cal-prev">&#8249;</button>
              <span class="rv-cal__navtitle" id="rv-cal-title"></span>
              <button class="rv-cal__navbtn" id="rv-cal-next">&#8250;</button>
            </div>
            <div class="rv-cal__body">
              <div class="rv-cal__wdays">
                <div class="rv-cal__wday">Su</div>
                <div class="rv-cal__wday">Mo</div>
                <div class="rv-cal__wday">Tu</div>
                <div class="rv-cal__wday">We</div>
                <div class="rv-cal__wday">Th</div>
                <div class="rv-cal__wday">Fr</div>
                <div class="rv-cal__wday">Sa</div>
              </div>
              <div class="rv-cal__days" id="rv-cal-days"></div>
            </div>
          </div>
          <div class="rv-day">
            <div class="rv-day__hdr">
              <span class="rv-day__title" id="rv-day-title">Select a date</span>
              <span class="rv-day__count" id="rv-day-count"></span>
            </div>
            <div class="rv-day__list" id="rv-day-list">
              <p class="rv-day__empty">Select a date to view reservations.</p>
            </div>
            <div class="rv-notes-area">
              <label class="rv-notes-label">Notes &amp; Reminders</label>
              <textarea id="rv-notes-ta" rows="3" placeholder="Reminders for the selected day…"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Finance panel -->
      <div class="cp-panel" id="cp-finance">
        <div class="fin-wrap">

          <!-- Finance sub-tab bar -->
          <div class="fin-tabbar">
            <button class="fin-tab active" data-fin-tab="overview">Overview</button>
            <button class="fin-tab" data-fin-tab="transactions">Transactions</button>
            <button class="fin-tab" data-fin-tab="contacts">Contacts</button>
            <button class="fin-tab" data-fin-tab="reports">Reports</button>
          </div>

          <!-- Overview -->
          <div class="fin-pane active" id="fin-overview">
            <div class="fin-cards" id="fin-cards">
              <div class="fin-card"><div class="fin-card__label">This month — income</div><div class="fin-card__value" id="fin-ov-income">—</div><div class="fin-card__delta" id="fin-ov-income-d"></div></div>
              <div class="fin-card fin-card--expense"><div class="fin-card__label">This month — expenses</div><div class="fin-card__value" id="fin-ov-expense">—</div><div class="fin-card__delta" id="fin-ov-expense-d"></div></div>
              <div class="fin-card"><div class="fin-card__label">This month — net profit</div><div class="fin-card__value" id="fin-ov-profit">—</div><div class="fin-card__delta" id="fin-ov-profit-d"></div></div>
            </div>
            <div class="fin-charts-row">
              <div class="fin-chart-box">
                <div class="fin-chart-box__label">6-month trend</div>
                <svg class="fin-svg-chart" id="fin-trend-svg" height="100" viewBox="0 0 400 100" preserveAspectRatio="none"></svg>
              </div>
              <div class="fin-chart-box">
                <div class="fin-chart-box__label">This month by category</div>
                <div class="fin-bar-list" id="fin-cat-bars"></div>
              </div>
            </div>
            <div class="fin-charts-row">
              <div class="fin-chart-box">
                <div class="fin-chart-box__label">Top clients</div>
                <div class="fin-top-list" id="fin-top-clients"></div>
              </div>
              <div class="fin-chart-box">
                <div class="fin-chart-box__label">Top providers</div>
                <div class="fin-top-list" id="fin-top-providers"></div>
              </div>
            </div>
          </div>

          <!-- Transactions -->
          <div class="fin-pane" id="fin-transactions">
            <div class="fin-toolbar">
              <input type="date" id="fin-tx-from" title="From date" />
              <input type="date" id="fin-tx-to" title="To date" />
              <select id="fin-tx-type" style="min-width:100px">
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select id="fin-tx-cat" style="min-width:130px"><option value="">All categories</option></select>
              <div class="fin-toolbar-spacer"></div>
              <button class="btn-ghost btn-sm" id="btn-fin-tx-filter">Filter</button>
              <button class="btn-accent btn-sm" onclick="openFinTxModal()">+ Add</button>
            </div>
            <div class="fin-table-wrap">
              <table class="fin-table">
                <thead><tr>
                  <th>Date</th><th>Type</th><th>Category</th>
                  <th>Contact</th><th>Method</th><th>Amount</th>
                  <th>Notes</th><th></th>
                </tr></thead>
                <tbody id="fin-tx-body"></tbody>
              </table>
            </div>
            <div class="fin-pager" id="fin-tx-pager"></div>
          </div>

          <!-- Contacts -->
          <div class="fin-pane" id="fin-contacts-pane">
            <div class="fin-toolbar">
              <div class="fin-toggle">
                <button class="fin-toggle-btn active" data-ctype="client" onclick="setFinContactType('client',this)">Clients</button>
                <button class="fin-toggle-btn" data-ctype="provider" onclick="setFinContactType('provider',this)">Providers</button>
              </div>
              <div class="fin-toolbar-spacer"></div>
              <button class="btn-accent btn-sm" onclick="openFinContactModal()">+ Add</button>
            </div>
            <table class="fin-contacts-table">
              <thead><tr>
                <th>Name</th><th>Contact</th>
                <th style="text-align:right">Total income</th>
                <th style="text-align:right">Total expense</th>
                <th style="text-align:right">Balance</th>
                <th>Last tx</th>
              </tr></thead>
              <tbody id="fin-contacts-body"></tbody>
            </table>
          </div>

          <!-- Reports -->
          <div class="fin-pane" id="fin-reports-pane">
            <div class="fin-toolbar">
              <input type="date" id="fin-rpt-from" />
              <input type="date" id="fin-rpt-to" />
              <button class="btn-ghost btn-sm" onclick="loadFinReports()">Generate</button>
              <div class="fin-toolbar-spacer"></div>
              <button class="btn-ghost btn-sm" onclick="exportFinCsv()">CSV Export</button>
              <button class="btn-ghost btn-sm" onclick="window.print()">Print / PDF</button>
            </div>
            <div id="fin-rpt-output"></div>
          </div>

        </div><!-- /fin-wrap -->

        <!-- Add Transaction Modal -->
        <div class="fin-modal-overlay" id="fin-tx-modal" onclick="if(event.target===this)closeFinTxModal()">
          <div class="fin-modal">
            <button class="fin-modal__close" onclick="closeFinTxModal()">✕</button>
            <h3 class="fin-modal__title">Add transaction</h3>
            <div class="fin-type-toggle" style="margin-bottom:16px">
              <button class="fin-type-btn active" data-t="income" onclick="setFinTxType('income',this)">Income</button>
              <button class="fin-type-btn" data-t="expense" onclick="setFinTxType('expense',this)">Expense</button>
            </div>
            <div class="fin-modal__grid">
              <div class="fin-modal__field">
                <label for="fin-tx-amount">Amount ($)</label>
                <input type="number" id="fin-tx-amount" min="0.01" step="0.01" placeholder="0.00" />
              </div>
              <div class="fin-modal__field">
                <label for="fin-tx-date">Date</label>
                <input type="date" id="fin-tx-date" />
              </div>
              <div class="fin-modal__field">
                <label for="fin-tx-cat-sel">Category</label>
                <select id="fin-tx-cat-sel"></select>
              </div>
              <div class="fin-modal__field">
                <label for="fin-tx-contact-sel">Contact (optional)</label>
                <select id="fin-tx-contact-sel"><option value="">— none —</option></select>
              </div>
              <div class="fin-modal__field">
                <label for="fin-tx-method">Payment method</label>
                <select id="fin-tx-method">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="mercadopago" selected>MercadoPago</option>
                  <option value="card">Card</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="fin-modal__field">
                <label for="fin-tx-receipt">Receipt (optional)</label>
                <input type="file" id="fin-tx-receipt" accept="image/*,.pdf" style="font-size:12px;padding:5px" />
              </div>
              <div class="fin-modal__field fin-modal__field--full">
                <label for="fin-tx-notes">Notes</label>
                <textarea id="fin-tx-notes" rows="2" style="resize:vertical"></textarea>
              </div>
            </div>
            <div class="fin-modal__actions">
              <button class="btn-ghost" onclick="closeFinTxModal()">Cancel</button>
              <button class="btn-solid" id="btn-fin-tx-submit" onclick="submitFinTx()">Add transaction</button>
            </div>
            <p class="status-msg" id="fin-tx-msg" style="text-align:right;margin-top:8px"></p>
          </div>
        </div>

        <!-- Add Contact Modal -->
        <div class="fin-modal-overlay" id="fin-contact-modal" onclick="if(event.target===this)closeFinContactModal()">
          <div class="fin-modal">
            <button class="fin-modal__close" onclick="closeFinContactModal()">✕</button>
            <h3 class="fin-modal__title" id="fin-contact-modal-title">Add contact</h3>
            <div class="fin-modal__grid">
              <div class="fin-modal__field fin-modal__field--full">
                <label for="fin-con-name">Name *</label>
                <input type="text" id="fin-con-name" />
              </div>
              <div class="fin-modal__field fin-modal__field--full">
                <label for="fin-con-info">Phone / Email</label>
                <input type="text" id="fin-con-info" />
              </div>
              <div class="fin-modal__field fin-modal__field--full">
                <label for="fin-con-notes">Notes</label>
                <textarea id="fin-con-notes" rows="2" style="resize:vertical"></textarea>
              </div>
            </div>
            <div class="fin-modal__actions">
              <button class="btn-ghost" onclick="closeFinContactModal()">Cancel</button>
              <button class="btn-solid" id="btn-fin-con-submit" onclick="submitFinContact()">Save</button>
            </div>
            <p class="status-msg" id="fin-con-msg" style="text-align:right;margin-top:8px"></p>
          </div>
        </div>

        <!-- Contact Detail Modal -->
        <div class="fin-modal-overlay" id="fin-contact-detail" onclick="if(event.target===this)document.getElementById('fin-contact-detail').classList.remove('active')">
          <div class="fin-modal" style="width:min(700px,100%)">
            <button class="fin-modal__close" onclick="document.getElementById('fin-contact-detail').classList.remove('active')">✕</button>
            <h3 class="fin-modal__title" id="fin-cd-name">Contact</h3>
            <div style="display:flex;gap:24px;margin-bottom:16px">
              <div><div class="fin-card__label">Balance</div><div id="fin-cd-balance" style="font-family:var(--serif);font-size:22px"></div></div>
              <div><div class="fin-card__label">Total income</div><div id="fin-cd-income" style="font-family:var(--mono);font-size:14px;color:#22c55e"></div></div>
              <div><div class="fin-card__label">Total expense</div><div id="fin-cd-expense" style="font-family:var(--mono);font-size:14px;color:#ef4444"></div></div>
            </div>
            <div class="fin-table-wrap" style="max-height:340px;overflow-y:auto">
              <table class="fin-table" style="min-width:auto">
                <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Notes</th></tr></thead>
                <tbody id="fin-cd-body"></tbody>
              </table>
            </div>
          </div>
        </div>

      </div><!-- /cp-finance -->

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
      <!-- Sort order -->
      <div id="pp-order-section" style="display:none;max-height:220px;overflow-y:auto;border-bottom:1px solid var(--line-soft)"></div>
      <!-- Footer -->
      <div style="padding:14px 24px;border-top:1px solid var(--line-soft);display:flex;justify-content:flex-end;gap:8px">
        <button class="btn-ghost btn-sm" onclick="closeProductPicker()">Cancel</button>
        <button class="btn-solid btn-sm" onclick="confirmProductPicker()">Apply selection</button>
      </div>
    </div>
  </div>

  <!-- Icon picker modal -->
  <div class="icon-picker-overlay" id="icon-picker-overlay" onclick="if(event.target.id==='icon-picker-overlay')this.classList.remove('active')">
    <div class="icon-picker-box">
      <div class="icon-picker-head">
        <span class="icon-picker-title">Select an icon</span>
        <button class="btn-ghost btn-sm" onclick="document.getElementById('icon-picker-overlay').classList.remove('active')">✕</button>
      </div>
      <div class="icon-picker-grid" id="icon-picker-grid"></div>
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

  <!-- Checkout modal (used from upsell screen) -->
  <div id="checkout-modal" class="co-modal" hidden aria-modal="true" role="dialog" aria-labelledby="co-plan-name">
    <div class="co-modal__backdrop"></div>
    <div class="co-modal__box">
      <button class="co-modal__close" id="co-close" aria-label="Close">&times;</button>
      <div class="co-modal__head">
        <div class="co-modal__plan" id="co-plan-name"></div>
        <div class="co-modal__price" id="co-plan-price"></div>
      </div>
      <div class="co-step" id="co-step-info">
        <div class="co-group">
          <label class="co-label" for="co-email">Email <span class="co-required">*</span></label>
          <input class="co-input" id="co-email" type="email" autocomplete="email" placeholder="you@example.com" />
        </div>
        <div class="co-group">
          <label class="co-label" for="co-password">Password <span class="co-required">*</span></label>
          <div class="co-pw-wrap">
            <input class="co-input co-input--pw" id="co-password" type="password" autocomplete="new-password" placeholder="Min. 8 characters" />
            <button type="button" class="co-pw-toggle" id="co-pw-toggle" aria-label="Show/hide password">&#128065;</button>
          </div>
        </div>
        <div class="co-group">
          <label class="co-label" for="co-brand">Business / Brand <span class="co-optional">(optional)</span></label>
          <input class="co-input" id="co-brand" type="text" autocomplete="organization" placeholder="Your brand name" />
        </div>
        <p class="co-msg" id="co-msg" hidden></p>
        <button class="co-btn" id="co-next">Continue &rarr;</button>
        <p class="co-note">Monthly subscription &middot; Cancel anytime</p>
      </div>
      <div class="co-step" id="co-step-card" hidden>
        <div id="cardPayment-container"></div>
      </div>
      <div class="co-step" id="co-step-success" hidden>
        <p class="co-success">Payment approved &mdash; activating your account&hellip;</p>
      </div>
    </div>
  </div>

  <script>
    window.CO_STRINGS = {
      locale:         'es-AR',
      errEmail:       'Please enter a valid email address.',
      errPassword:    'Password must be at least 8 characters.',
      errConfig:      'Configuration error. Please try again.',
      errUnavailable: 'Online payment is not available right now.',
      errSdk:         'Could not load the payment form. Please try again.',
      errBrick:       'Could not initialize payment. Please try again.',
      errPayment:     'Subscription error. Please try again.',
    };
  </script>
  <script src="/js/dashboard.js?v=20260802i"></script>
  <script src="/js/checkout.js?v=20260802a"></script>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
