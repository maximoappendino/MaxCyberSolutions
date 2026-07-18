import { esc } from '../_lib/helpers.js';

function notFound() {
  return new Response('Store not found', { status: 404 });
}

export async function onRequest({ params, env }) {
  const slug  = params.slug;
  const store = await env.DB.prepare(`
    SELECT s.id, s.slug, s.name, s.config,
           s.cbu_cvu, s.bank_name, s.bank_holder,
           s.mp_public_key, s.store_zip, s.store_city, s.store_province,
           o.status AS owner_status
    FROM stores s JOIN owners o ON o.id = s.owner_id
    WHERE s.slug = ?
  `).bind(slug).first();

  if (!store) return notFound();
  if (store.owner_status !== 'active') {
    return new Response('Store temporarily unavailable', { status: 503 });
  }

  let cfg = {};
  try { cfg = JSON.parse(store.config || '{}'); } catch {}

  const storeName   = cfg.name || store.name || slug;
  const hasMP       = !!store.mp_public_key;
  const hasBank     = !!store.cbu_cvu;
  const hasCheckout = hasMP || hasBank;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Checkout — ${esc(storeName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --accent: ${esc(cfg.theme?.accent || '#e2a14a')};
      --bg:     ${esc(cfg.theme?.bg     || '#efeae0')};
      --fg:     ${esc(cfg.theme?.fg     || '#1c1a16')};
      --fg-s:   #45403a; --line: #d4cdbd; --line-s: #e2dccd;
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans:  "DM Sans", sans-serif;
      --mono:  "JetBrains Mono", monospace;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: var(--bg); color: var(--fg); font-family: var(--sans); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
    a { color: var(--accent); }
    button { cursor: pointer; font-family: var(--sans); }
    input, select, textarea { font-family: var(--sans); font-size: 13px; color: var(--fg); background: transparent; border: 1px solid var(--line); padding: 9px 12px; outline: none; width: 100%; transition: border-color 150ms; }
    input:focus, select:focus { border-color: var(--accent); }
    label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-s); display: block; margin-bottom: 4px; }

    .co-bar { border-bottom: 1px solid var(--line); padding: 16px 24px; display: flex; align-items: center; gap: 16px; background: color-mix(in srgb, var(--bg) 90%, transparent); }
    .co-bar__back { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-decoration: none; color: var(--fg-s); display: flex; align-items: center; gap: 6px; }
    .co-bar__back:hover { color: var(--fg); }
    .co-bar__title { font-family: var(--serif); font-size: 20px; letter-spacing: -0.01em; }

    .co-wrap { max-width: 960px; margin: 0 auto; padding: 32px 20px 64px; display: grid; grid-template-columns: 1fr 360px; gap: 40px; align-items: start; }
    @media (max-width: 720px) { .co-wrap { grid-template-columns: 1fr; } .co-summary { order: -1; } }

    /* ── Form ── */
    .co-form__section { margin-bottom: 28px; }
    .co-form__title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-s); margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--line-s); }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field-grid--3 { grid-template-columns: 1fr 1fr 1fr; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field--full { grid-column: 1 / -1; }

    .ship-row { display: flex; gap: 8px; align-items: flex-end; }
    .ship-row input { flex: 1; }
    .btn-outline { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 9px 14px; border: 1px solid var(--line); background: transparent; color: var(--fg-s); transition: border-color 150ms, color 150ms; white-space: nowrap; flex-shrink: 0; }
    .btn-outline:hover { border-color: var(--fg); color: var(--fg); }
    .btn-outline:disabled { opacity: 0.4; cursor: wait; }

    .shipping-options { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
    .shipping-opt { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--line); cursor: pointer; transition: border-color 150ms; }
    .shipping-opt:hover { border-color: var(--fg-s); }
    .shipping-opt input[type="radio"] { width: auto; }
    .shipping-opt__label { flex: 1; font-size: 13px; }
    .shipping-opt__price { font-family: var(--mono); font-size: 11px; }

    /* Payment method selection */
    .pay-opts { display: flex; flex-direction: column; gap: 8px; }
    .pay-opt { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border: 1px solid var(--line); cursor: pointer; transition: border-color 150ms, background 150ms; }
    .pay-opt:hover { border-color: var(--fg-s); }
    .pay-opt.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, var(--bg)); }
    .pay-opt input[type="radio"] { width: auto; }
    .pay-opt__icon { font-size: 20px; }
    .pay-opt__info { flex: 1; }
    .pay-opt__name { font-weight: 500; font-size: 14px; }
    .pay-opt__desc { font-size: 11px; color: var(--fg-s); margin-top: 1px; }

    /* Submit button */
    .btn-submit { width: 100%; font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; padding: 16px; background: var(--fg); color: var(--bg); border: none; transition: opacity 150ms; margin-top: 20px; }
    .btn-submit:hover    { opacity: 0.85; }
    .btn-submit:disabled { opacity: 0.4; cursor: wait; }
    .form-err { font-family: var(--mono); font-size: 10px; color: #b33; margin-top: 8px; }

    /* ── Summary ── */
    .co-summary { border: 1px solid var(--line); padding: 24px; position: sticky; top: 24px; }
    .co-summary__title { font-family: var(--mono); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-s); margin-bottom: 14px; }
    .cart-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line-s); }
    .cart-item__img { width: 52px; height: 52px; object-fit: cover; background: var(--line-s); flex-shrink: 0; }
    .cart-item__info { flex: 1; min-width: 0; }
    .cart-item__name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cart-item__qty  { font-family: var(--mono); font-size: 10px; color: var(--fg-s); margin-top: 2px; }
    .cart-item__price { font-family: var(--mono); font-size: 12px; flex-shrink: 0; }
    .co-totals { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
    .co-total-row { display: flex; justify-content: space-between; font-size: 13px; }
    .co-total-row--grand { border-top: 1px solid var(--line); padding-top: 10px; margin-top: 4px; font-weight: 500; font-family: var(--serif); font-size: 18px; }

    /* ── Transfer confirm ── */
    .transfer-box { border: 1px solid var(--accent); padding: 20px 24px; margin-top: 20px; }
    .transfer-box__title { font-family: var(--serif); font-size: 22px; letter-spacing: -0.01em; margin-bottom: 12px; }
    .transfer-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--line-s); font-size: 13px; }
    .transfer-row:last-child { border-bottom: none; }
    .transfer-key { color: var(--fg-s); font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; }
    .transfer-val { font-weight: 500; font-family: var(--mono); font-size: 12px; }

    /* ── Success ── */
    .success-box { text-align: center; padding: 48px 24px; }
    .success-box__icon { font-size: 48px; margin-bottom: 16px; }
    .success-box__title { font-family: var(--serif); font-size: 32px; letter-spacing: -0.02em; margin-bottom: 8px; }
    .success-box__sub { color: var(--fg-s); font-size: 14px; }

    /* ── Empty / No-checkout ── */
    .info-box { text-align: center; padding: 48px 24px; }
    .info-box__title { font-family: var(--serif); font-size: 28px; font-style: italic; margin-bottom: 8px; color: var(--fg-s); }
  </style>
</head>
<body>
<header class="co-bar">
  <a class="co-bar__back" href="/store/${esc(slug)}">← ${esc(storeName)}</a>
  <span class="co-bar__title">Checkout</span>
</header>

<div class="co-wrap">
  <div id="co-main">
    ${!hasCheckout ? `
    <div class="info-box">
      <div class="info-box__title">Checkout not yet configured.</div>
      <p>The store owner has not set up a payment method yet.</p>
    </div>
    ` : `
    <form id="co-form">

      <div class="co-form__section">
        <div class="co-form__title">Contact</div>
        <div class="field-grid">
          <div class="field field--full"><label>Full name *</label><input id="f-name" required placeholder="Jane Doe" /></div>
          <div class="field"><label>Email *</label><input id="f-email" type="email" required placeholder="jane@example.com" /></div>
          <div class="field"><label>Phone</label><input id="f-phone" type="tel" placeholder="+54 11 1234 5678" /></div>
        </div>
      </div>

      <div class="co-form__section">
        <div class="co-form__title">Shipping address</div>
        <div class="field-grid">
          <div class="field field--full"><label>Street and number *</label><input id="f-addr" required placeholder="Av. Corrientes 1234" /></div>
          <div class="field"><label>City *</label><input id="f-city" required placeholder="Buenos Aires" /></div>
          <div class="field"><label>Province</label><input id="f-province" placeholder="CABA" /></div>
          <div class="field">
            <label>Postal code *</label>
            <div class="ship-row">
              <input id="f-zip" required placeholder="C1414" />
              ${store.store_zip ? '<button type="button" class="btn-outline" id="btn-get-shipping">Cotizar →</button>' : ''}
            </div>
          </div>
        </div>
        <div id="shipping-opts-wrap" style="display:none">
          <div class="co-form__title" style="margin-top:16px">Shipping method</div>
          <div class="shipping-options" id="shipping-opts"></div>
        </div>
      </div>

      <div class="co-form__section">
        <div class="co-form__title">Payment</div>
        <div class="pay-opts">
          ${hasMP ? `
          <label class="pay-opt selected" id="pay-opt-mp">
            <input type="radio" name="payment" value="mp" checked />
            <span class="pay-opt__icon">💳</span>
            <span class="pay-opt__info">
              <span class="pay-opt__name">Mercado Pago</span>
              <span class="pay-opt__desc">Tarjeta de crédito, débito, efectivo, Mercado Crédito</span>
            </span>
          </label>` : ''}
          ${hasBank ? `
          <label class="pay-opt${!hasMP ? ' selected' : ''}" id="pay-opt-bank">
            <input type="radio" name="payment" value="bank"${!hasMP ? ' checked' : ''} />
            <span class="pay-opt__icon">🏦</span>
            <span class="pay-opt__info">
              <span class="pay-opt__name">Transferencia bancaria</span>
              <span class="pay-opt__desc">CBU / CVU — ${esc(store.bank_name || 'Cuenta bancaria')}</span>
            </span>
          </label>` : ''}
        </div>
      </div>

      <p class="form-err" id="co-err" style="display:none"></p>
      <button class="btn-submit" type="submit" id="btn-submit">Confirmar pedido</button>
    </form>
    <div id="co-result" style="display:none"></div>
    `}
  </div>

  <aside class="co-summary">
    <div class="co-summary__title">Tu pedido</div>
    <div id="cart-summary"></div>
    <div class="co-totals" id="co-totals"></div>
  </aside>
</div>

<script>
(function(){
  const SLUG    = '${esc(slug)}';
  const CART_KEY = 'cart_' + SLUG;
  const HAS_MP   = ${hasMP ? 'true' : 'false'};
  const HAS_BANK = ${hasBank ? 'true' : 'false'};
  const HAS_CHECKOUT = ${hasCheckout ? 'true' : 'false'};

  const fmtARS = c => '$​' + (c / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Check for success redirect from MP ────────────────────────────────────
  const sp = new URLSearchParams(location.search);
  const orderParam = sp.get('order');
  const statusParam = sp.get('status');
  const paymentId  = sp.get('payment_id') || sp.get('collection_id');

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch {}

  // If MP returned with approved status, verify and show success
  if (orderParam && statusParam === 'approved' && paymentId) {
    showLoading();
    verifyPayment(orderParam, paymentId);
    return;
  }

  // If no cart and no success redirect, go back to store
  if (!cart.length && !orderParam) {
    window.location.replace('/store/' + SLUG);
    return;
  }

  if (!HAS_CHECKOUT) {
    renderSummary(cart);
    return;
  }

  renderSummary(cart);
  setupForm();

  // ── Render cart summary ────────────────────────────────────────────────────
  let shippingCents = 0;
  let selectedShipping = null;

  function renderSummary(items) {
    const wrap = document.getElementById('cart-summary');
    if (!wrap) return;
    wrap.innerHTML = items.map(i => {
      const total = i.price_cents * i.quantity;
      return \`<div class="cart-item">
        \${i.image ? \`<img class="cart-item__img" src="\${esc(i.image)}" alt=""/>\` : '<div class="cart-item__img"></div>'}
        <div class="cart-item__info">
          <div class="cart-item__name">\${esc(i.name)}</div>
          <div class="cart-item__qty">× \${i.quantity}</div>
        </div>
        <div class="cart-item__price">\${fmtARS(total)}</div>
      </div>\`;
    }).join('');
    updateTotals(items);
  }

  function updateTotals(items) {
    const sub   = items.reduce((s, i) => s + (i.price_cents * i.quantity), 0);
    const total = sub + shippingCents;
    const el    = document.getElementById('co-totals');
    if (!el) return;
    el.innerHTML = \`
      <div class="co-total-row"><span>Subtotal</span><span>\${fmtARS(sub)}</span></div>
      <div class="co-total-row"><span>Envío</span><span>\${shippingCents > 0 ? fmtARS(shippingCents) : 'A calcular'}</span></div>
      <div class="co-total-row co-total-row--grand"><span>Total</span><span>\${fmtARS(total)}</span></div>
    \`;
  }

  // ── Setup form ─────────────────────────────────────────────────────────────
  function setupForm() {
    // Payment option highlighting
    document.querySelectorAll('.pay-opt').forEach(opt => {
      opt.addEventListener('change', () => {
        document.querySelectorAll('.pay-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    // Shipping quote button
    const btnShip = document.getElementById('btn-get-shipping');
    if (btnShip) {
      btnShip.addEventListener('click', async () => {
        const zip = document.getElementById('f-zip').value.trim();
        if (!zip) return;
        btnShip.disabled = true;
        btnShip.textContent = '…';

        const totalWeight = cart.reduce((s, i) => s + ((i.weight_grams || 100) * i.quantity), 0);
        const maxWidth    = Math.max(...cart.map(i => i.width_cm  || 10));
        const maxHeight   = Math.max(...cart.map(i => i.height_cm || 10));
        const maxDepth    = Math.max(...cart.map(i => i.depth_cm  || 10));
        const subtotal    = cart.reduce((s, i) => s + (i.price_cents * i.quantity), 0);

        const qs = new URLSearchParams({ zip, weight: totalWeight, width: maxWidth, height: maxHeight, depth: maxDepth, value: subtotal / 100 });
        const res = await fetch(\`/api/public/stores/\${SLUG}/shipping?\${qs}\`).catch(() => null);
        const data = res?.ok ? await res.json() : null;

        btnShip.disabled = false;
        btnShip.textContent = 'Cotizar →';

        const optsEl = document.getElementById('shipping-opts');
        const wrap   = document.getElementById('shipping-opts-wrap');
        const quotes = data?.quotes || [];

        if (!quotes.length) {
          optsEl.innerHTML = '<p style="font-size:12px;color:#b33">No se encontraron opciones de envío para ese código postal.</p>';
          if (HAS_MP) {
            optsEl.innerHTML += '<p style="font-size:11px;color:var(--fg-s)">Podés elegir MercadoEnvíos al pagar con Mercado Pago.</p>';
          }
          wrap.style.display = '';
          return;
        }

        optsEl.innerHTML = \`
          <label class="shipping-opt">
            <input type="radio" name="shipping" value="me" data-cost="0"/>
            <span class="shipping-opt__label">MercadoEnvíos (calculado en MP)</span>
            <span class="shipping-opt__price">—</span>
          </label>
          \${quotes.map(q => \`
          <label class="shipping-opt">
            <input type="radio" name="shipping" value="\${esc(q.id)}" data-cost="\${q.price_cents}"/>
            <span class="shipping-opt__label">\${esc(q.label)}\${q.estimated_days ? \` · \${q.estimated_days} días hábiles\` : ''}</span>
            <span class="shipping-opt__price">\${fmtARS(q.price_cents)}</span>
          </label>\`).join('')}
        \`;
        wrap.style.display = '';

        optsEl.querySelectorAll('input[name="shipping"]').forEach(r => {
          r.addEventListener('change', () => {
            shippingCents   = parseInt(r.dataset.cost || '0', 10);
            selectedShipping = r.value;
            updateTotals(cart);
          });
        });
      });
    }

    // Form submit
    document.getElementById('co-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      const err = document.getElementById('co-err');
      err.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Procesando…';

      const payMethod = document.querySelector('input[name="payment"]:checked')?.value || 'mp';
      const payload = {
        customer_name:     document.getElementById('f-name').value.trim(),
        customer_email:    document.getElementById('f-email').value.trim(),
        customer_phone:    document.getElementById('f-phone').value.trim(),
        shipping_address:  document.getElementById('f-addr').value.trim(),
        shipping_city:     document.getElementById('f-city').value.trim(),
        shipping_province: document.getElementById('f-province').value.trim(),
        shipping_zip:      document.getElementById('f-zip').value.trim(),
        shipping_method:   selectedShipping || '',
        shipping_cost_cents: shippingCents,
        payment_method:    payMethod,
        items: cart,
      };

      const res  = await fetch(\`/api/public/stores/\${SLUG}/orders\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => null);

      if (!res) {
        showErr('Error de red. Intente nuevamente.');
        btn.disabled = false; btn.textContent = 'Confirmar pedido';
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showErr(data.error || 'Error al crear el pedido.');
        btn.disabled = false; btn.textContent = 'Confirmar pedido';
        return;
      }

      if (payMethod === 'mp' && data.mp_init_point) {
        window.location.href = data.mp_init_point;
        return;
      }

      // Bank transfer
      localStorage.removeItem(CART_KEY);
      showBankConfirm(data);
    });
  }

  function showErr(msg) {
    const el = document.getElementById('co-err');
    if (el) { el.textContent = msg; el.style.display = ''; }
  }

  function showBankConfirm(data) {
    const t = data.transfer || {};
    document.getElementById('co-form').style.display = 'none';
    document.getElementById('co-result').style.display = '';
    document.getElementById('co-result').innerHTML = \`
      <div class="transfer-box">
        <div class="transfer-box__title">¡Pedido recibido!</div>
        <p style="font-size:13px;color:var(--fg-s);margin-bottom:16px">Realizá la transferencia con los siguientes datos y tu pedido será procesado al acreditarse.</p>
        \${t.bank_holder ? \`<div class="transfer-row"><span class="transfer-key">Titular</span><span class="transfer-val">\${esc(t.bank_holder)}</span></div>\` : ''}
        \${t.bank_name   ? \`<div class="transfer-row"><span class="transfer-key">Banco</span><span class="transfer-val">\${esc(t.bank_name)}</span></div>\` : ''}
        \${t.cbu_cvu     ? \`<div class="transfer-row"><span class="transfer-key">CBU / CVU</span><span class="transfer-val">\${esc(t.cbu_cvu)}</span></div>\` : ''}
        <div class="transfer-row"><span class="transfer-key">Monto</span><span class="transfer-val">$ \${esc(t.amount)}</span></div>
        <div class="transfer-row"><span class="transfer-key">Referencia / Nro pedido</span><span class="transfer-val">\${esc(t.reference)}</span></div>
      </div>
    \`;
  }

  function showLoading() {
    const m = document.getElementById('co-main');
    if (m) m.innerHTML = '<div class="info-box"><div class="info-box__title">Verificando pago…</div></div>';
  }

  async function verifyPayment(orderId, paymentId) {
    const res  = await fetch(\`/api/public/orders/\${orderId}/verify\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: paymentId }),
    }).catch(() => null);

    const data = res?.ok ? await res.json().catch(() => ({})) : {};
    localStorage.removeItem(CART_KEY);
    const m = document.getElementById('co-main');
    if (!m) return;
    m.innerHTML = \`
      <div class="success-box">
        <div class="success-box__icon">\${data.status === 'paid' ? '✅' : '🕐'}</div>
        <div class="success-box__title">\${data.status === 'paid' ? '¡Pago confirmado!' : 'Pago en proceso'}</div>
        <p class="success-box__sub">\${data.status === 'paid'
          ? 'Tu pedido fue recibido y pagado. Te contactaremos pronto.'
          : 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.'}</p>
        <a href="/store/\${SLUG}" style="display:inline-block;margin-top:24px;font-family:var(--mono);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent)">← Volver a la tienda</a>
      </div>
    \`;
  }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
