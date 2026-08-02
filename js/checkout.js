/* MaxCyberSolutions — checkout.js
   Two-step signup modal: account info → Card Payment Brick.
   Loaded on landing pages (en/es/it/index.html).               */
(function () {
  'use strict';

  let selectedPlan  = null;
  let selectedName  = '';
  let selectedPrice = '';
  let brickController = null;

  // ── Modal open / close ──────────────────────────────────────────────────────
  function openModal(planId, planName, planPrice) {
    selectedPlan  = planId;
    selectedName  = planName;
    selectedPrice = planPrice;

    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    modal.querySelector('#co-plan-name').textContent  = planName;
    modal.querySelector('#co-plan-price').textContent = planPrice;

    // Reset form
    modal.querySelector('#co-email').value    = '';
    modal.querySelector('#co-password').value = '';
    modal.querySelector('#co-brand').value    = '';
    modal.querySelector('#co-pw-toggle').textContent = '👁';
    modal.querySelector('#co-password').type  = 'password';

    hideMsg();
    showStep('info');
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.querySelector('#co-email')?.focus());
  }

  function closeModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    destroyBrick();
    showStep('info');
  }

  function destroyBrick() {
    if (brickController) {
      try { brickController.unmount(); } catch (_) {}
      brickController = null;
    }
  }

  // ── Step visibility ─────────────────────────────────────────────────────────
  function showStep(step) {
    ['info', 'card', 'success'].forEach(s => {
      const el = document.getElementById('co-step-' + s);
      if (el) el.hidden = (s !== step);
    });
  }

  function showMsg(msg, isError) {
    const el = document.getElementById('co-msg');
    if (!el) return;
    el.textContent = msg;
    el.className   = 'co-msg' + (isError ? ' co-msg--error' : '');
    el.hidden      = false;
  }

  function hideMsg() {
    const el = document.getElementById('co-msg');
    if (el) el.hidden = true;
  }

  // ── Validate info step ──────────────────────────────────────────────────────
  function validateInfo() {
    const email    = document.getElementById('co-email')?.value.trim()    || '';
    const password = document.getElementById('co-password')?.value         || '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMsg(CO_STRINGS.errEmail, true);
      document.getElementById('co-email')?.focus();
      return false;
    }
    if (password.length < 8) {
      showMsg(CO_STRINGS.errPassword, true);
      document.getElementById('co-password')?.focus();
      return false;
    }
    return true;
  }

  // ── MP SDK loader ───────────────────────────────────────────────────────────
  function loadMpSdk() {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) { resolve(); return; }
      const s   = document.createElement('script');
      s.src     = 'https://sdk.mercadopago.com/js/v2';
      s.onload  = resolve;
      s.onerror = () => reject(new Error('Failed to load MercadoPago SDK'));
      document.head.appendChild(s);
    });
  }

  // ── Brick init ──────────────────────────────────────────────────────────────
  async function initBrick() {
    destroyBrick();

    // Fetch public key
    let mpKey;
    try {
      const r = await fetch('/api/public/config');
      const d = await r.json();
      mpKey   = d.mp_public_key;
    } catch (_) {
      showStep('info');
      showMsg(CO_STRINGS.errConfig, true);
      return;
    }

    if (!mpKey) {
      showStep('info');
      showMsg(CO_STRINGS.errUnavailable, true);
      return;
    }

    try { await loadMpSdk(); } catch (_) {
      showStep('info');
      showMsg(CO_STRINGS.errSdk, true);
      return;
    }

    // Display amount = plan price in ARS (minor units ÷ 100 for display)
    const AMOUNTS = { basic: 15, plus: 20, pro: 30, ultra: 50 };
    const amount  = AMOUNTS[selectedPlan] || 15;
    const email   = document.getElementById('co-email')?.value.trim() || '';

    const mp = new window.MercadoPago(mpKey, { locale: CO_STRINGS.locale || 'es-AR' });

    try {
      brickController = await mp.bricks().create('cardPayment', 'cardPayment-container', {
        initialization: {
          amount,
          payer: { email },
        },
        customization: {
          paymentMethods: { minInstallments: 1, maxInstallments: 1 },
          visual:         { hideFormTitle: true },
        },
        callbacks: {
          onReady: () => {},

          onSubmit: async (formData) => {
            const email     = document.getElementById('co-email')?.value.trim()    || '';
            const password  = document.getElementById('co-password')?.value         || '';
            const brandName = document.getElementById('co-brand')?.value.trim()    || '';

            const res = await fetch('/api/public/subscribe', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                plan:            selectedPlan,
                email,
                password,
                brandName,
                cardToken:       formData.token,
                paymentMethodId: formData.payment_method_id,
                issuerId:        formData.issuer_id,
              }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              throw new Error(data.error || CO_STRINGS.errPayment);
            }

            // 3DS challenge
            if (data.init_point) {
              window.location.href = data.init_point;
              return;
            }

            // Approved — session cookie was set by the server, go straight to dashboard
            showStep('success');
            setTimeout(() => { window.location.href = '/dashboard/?subscribed=1'; }, 1500);
          },

          onError: (err) => console.error('[MP Brick]', err),
        },
      });
    } catch (e) {
      showStep('info');
      showMsg(CO_STRINGS.errBrick, true);
      console.error('[Brick init]', e);
    }
  }

  // ── Localized strings (set per-page before this script loads) ───────────────
  // Each index.html sets window.CO_STRINGS before <script src="checkout.js">
  const CO_STRINGS = window.CO_STRINGS || {
    locale:       'es-AR',
    errEmail:     'Please enter a valid email address.',
    errPassword:  'Password must be at least 8 characters.',
    errConfig:    'Configuration error. Please try again.',
    errUnavailable: 'Online payment is not available right now.',
    errSdk:       'Could not load the payment form. Please try again.',
    errBrick:     'Could not initialize payment. Please try again.',
    errPayment:   'Subscription error. Please try again.',
  };

  // ── Boot ────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {

    // Open modal when a plan CTA is clicked
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-checkout-plan]');
      if (!btn) return;
      e.preventDefault();
      openModal(
        btn.dataset.checkoutPlan,
        btn.dataset.checkoutName  || btn.dataset.checkoutPlan,
        btn.dataset.checkoutPrice || ''
      );
    });

    // Close
    document.getElementById('co-close')?.addEventListener('click', closeModal);
    document.querySelector('.co-modal__backdrop')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Password visibility toggle
    document.getElementById('co-pw-toggle')?.addEventListener('click', () => {
      const inp = document.getElementById('co-password');
      const btn = document.getElementById('co-pw-toggle');
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    });

    // Info step → card step
    document.getElementById('co-next')?.addEventListener('click', async () => {
      hideMsg();
      if (!validateInfo()) return;
      showStep('card');
      await initBrick();
    });

    // Allow Enter on email/password to advance
    ['co-email', 'co-password', 'co-brand'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('co-next')?.click();
      });
    });

    // Clear validation feedback on input
    ['co-email', 'co-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', hideMsg);
    });

  });
})();
