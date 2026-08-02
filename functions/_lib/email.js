// Store-facing transactional emails (order confirmations, payment receipts)
const FROM = 'MaxCyberSolutions <no-reply@maxcybersolutions.online>';
// Platform emails from Max directly (account verify, billing, subscription notices)
const FROM_MAX = 'Max <max@maxcybersolutions.online>';

export async function sendEmail(env, { to, subject, html, from }) {
  if (!env.RESEND_API_KEY) return { ok: false };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: from || FROM, to, subject, html }),
  });
  return { ok: res.ok };
}

// Platform emails bypass the per-owner monthly counter — they're system-generated
export async function sendPlatformEmail(env, { to, subject, html }) {
  return sendEmail(env, { to, subject, html, from: FROM_MAX });
}

export async function canSendEmail(env, ownerId) {
  const owner = await env.DB.prepare(
    'SELECT email_monthly_limit, email_monthly_used, email_monthly_reset FROM owners WHERE id = ?'
  ).bind(ownerId).first();
  if (!owner) return false;
  const month = new Date().toISOString().slice(0, 7);
  const used = owner.email_monthly_reset === month ? (owner.email_monthly_used ?? 0) : 0;
  return used < (owner.email_monthly_limit ?? 200);
}

export async function incrementEmailCount(env, ownerId, count = 1) {
  const month = new Date().toISOString().slice(0, 7);
  await env.DB.prepare(`
    UPDATE owners SET
      email_monthly_used  = CASE WHEN email_monthly_reset = ? THEN email_monthly_used + ? ELSE ? END,
      email_monthly_reset = ?
    WHERE id = ?
  `).bind(month, count, count, month, ownerId).run();
}

const fmtARS = cents => '$' + (cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function baseLayout(content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background:#f5f4f0;font-family:DM Sans,sans-serif;font-size:14px;color:#1c1a16">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #d4cdbd">
<tr><td style="padding:28px 32px 0;border-bottom:2px solid #e2a14a">
  <p style="margin:0 0 16px;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#8a8070">MaxCyberSolutions</p>
</td></tr>
<tr><td style="padding:28px 32px">${content}</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #e8e2d8;background:#faf9f6">
  <p style="margin:0;font-size:11px;color:#8a8070">Este es un mensaje automático. No responder a este correo.</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
}

function itemsTable(items) {
  if (!items || !items.length) return '';
  const rows = items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:13px">${String(i.name ?? '').replace(/</g,'&lt;')}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:13px;text-align:center;color:#8a8070">×${i.quantity || 1}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ece4;font-size:13px;text-align:right;font-family:monospace">${fmtARS((i.price_cents || 0) * (i.quantity || 1))}</td>
    </tr>`).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0">${rows}</table>`;
}

export function emailNewOrder({ order, items, storeName, dashboardUrl }) {
  const ref = (order.id || '').slice(0, 8).toUpperCase();
  const addr = [order.shipping_address, order.shipping_city, order.shipping_province, order.shipping_zip].filter(Boolean).join(', ');
  return baseLayout(`
    <h2 style="margin:0 0 4px;font-size:22px;letter-spacing:-.01em">Nuevo pedido recibido</h2>
    <p style="margin:0 0 20px;color:#8a8070;font-size:13px">#${ref} · ${storeName}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr><td style="padding:6px 0;font-size:12px;color:#8a8070;width:120px">Cliente</td><td style="font-size:13px;font-weight:500">${String(order.customer_name || '').replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#8a8070">Email</td><td style="font-size:13px">${String(order.customer_email || '').replace(/</g,'&lt;')}</td></tr>
      ${order.customer_phone ? `<tr><td style="padding:6px 0;font-size:12px;color:#8a8070">Teléfono</td><td style="font-size:13px">${String(order.customer_phone).replace(/</g,'&lt;')}</td></tr>` : ''}
      ${addr ? `<tr><td style="padding:6px 0;font-size:12px;color:#8a8070">Dirección</td><td style="font-size:13px">${String(addr).replace(/</g,'&lt;')}</td></tr>` : ''}
      <tr><td style="padding:6px 0;font-size:12px;color:#8a8070">Pago</td><td style="font-size:13px">${order.payment_method === 'mp' ? 'Mercado Pago' : 'Transferencia'}</td></tr>
    </table>
    ${itemsTable(items)}
    <p style="font-size:16px;font-weight:500;text-align:right;margin:8px 0 24px">Total: ${fmtARS(order.total_cents || 0)}</p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#1c1a16;color:#fff;padding:12px 24px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none">Ver en el Dashboard →</a>
  `);
}

export function emailOrderConfirmCustomer({ order, items, storeName, storeSlug, transfer }) {
  const ref = (order.id || '').slice(0, 8).toUpperCase();
  const transferBlock = transfer ? `
    <div style="border:1px solid #e2a14a;padding:16px 20px;margin:20px 0;background:#fdf8ef">
      <p style="margin:0 0 10px;font-weight:500;font-size:14px">Datos para la transferencia</p>
      ${transfer.bank_holder ? `<p style="margin:4px 0;font-size:13px"><span style="color:#8a8070">Titular:</span> ${String(transfer.bank_holder).replace(/</g,'&lt;')}</p>` : ''}
      ${transfer.bank_name ? `<p style="margin:4px 0;font-size:13px"><span style="color:#8a8070">Banco:</span> ${String(transfer.bank_name).replace(/</g,'&lt;')}</p>` : ''}
      ${transfer.cbu_cvu ? `<p style="margin:4px 0;font-size:13px"><span style="color:#8a8070">CBU/CVU:</span> <strong style="font-family:monospace">${String(transfer.cbu_cvu).replace(/</g,'&lt;')}</strong></p>` : ''}
      <p style="margin:4px 0;font-size:13px"><span style="color:#8a8070">Monto:</span> <strong>${fmtARS(order.total_cents || 0)}</strong></p>
      <p style="margin:4px 0;font-size:13px"><span style="color:#8a8070">Referencia:</span> <strong style="font-family:monospace">${ref}</strong></p>
    </div>
  ` : `<p style="font-size:13px;color:#8a8070;margin:12px 0">Serás redirigido a Mercado Pago para completar el pago.</p>`;

  return baseLayout(`
    <h2 style="margin:0 0 4px;font-size:22px;letter-spacing:-.01em">¡Gracias por tu pedido!</h2>
    <p style="margin:0 0 20px;color:#8a8070;font-size:13px">#${ref} · ${String(storeName).replace(/</g,'&lt;')}</p>
    <p style="font-size:14px;margin:0 0 16px">Hemos recibido tu pedido y te contactaremos a la brevedad.</p>
    ${itemsTable(items)}
    <p style="font-size:16px;font-weight:500;text-align:right;margin:8px 0 16px">Total: ${fmtARS(order.total_cents || 0)}</p>
    ${transferBlock}
  `);
}

export function emailPaymentConfirmedOwner({ order, storeName, dashboardUrl }) {
  const ref = (order.id || '').slice(0, 8).toUpperCase();
  return baseLayout(`
    <h2 style="margin:0 0 4px;font-size:22px;letter-spacing:-.01em">Pago confirmado ✓</h2>
    <p style="margin:0 0 20px;color:#8a8070;font-size:13px">#${ref} · ${String(storeName).replace(/</g,'&lt;')}</p>
    <p style="font-size:14px;margin:0 0 20px">El pago del pedido de <strong>${String(order.customer_name || '').replace(/</g,'&lt;')}</strong> fue confirmado por ${fmtARS(order.total_cents || 0)}.</p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#1c1a16;color:#fff;padding:12px 24px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none">Ver pedido →</a>
  `);
}

// ── Platform email templates ──────────────────────────────────────────────────

export function emailVerify({ verifyUrl }) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;letter-spacing:-.01em">Verify your email</h2>
    <p style="font-size:14px;margin:0 0 24px;color:#45403a">Click the button below to confirm your address and activate your MaxCyberSolutions account. This link expires in 24 hours.</p>
    <a href="${verifyUrl}" style="display:inline-block;background:#1c1a16;color:#fff;padding:13px 28px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none">Verify email →</a>
    <p style="font-size:12px;color:#8a8070;margin-top:20px">If you didn't create this account, you can safely ignore this email.</p>
    <p style="font-size:12px;color:#8a8070;word-break:break-all;margin-top:8px">Or copy this link: ${verifyUrl}</p>
  `);
}

export function emailWelcomeOwner({ email, planName, dashboardUrl }) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;letter-spacing:-.01em">Welcome — you're all set.</h2>
    <p style="font-size:14px;margin:0 0 16px;color:#45403a">Your <strong>${String(planName).replace(/</g,'&lt;')}</strong> subscription is active. Your store dashboard is ready.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
      <tr><td style="padding:6px 0;font-size:12px;color:#8a8070;width:100px">Account</td><td style="font-size:13px">${String(email).replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#8a8070">Plan</td><td style="font-size:13px">${String(planName).replace(/</g,'&lt;')}</td></tr>
      <tr><td style="padding:6px 0;font-size:12px;color:#8a8070">Billing</td><td style="font-size:13px">Monthly — cancel anytime from your dashboard</td></tr>
    </table>
    <a href="${dashboardUrl}" style="display:inline-block;background:#1c1a16;color:#fff;padding:13px 28px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none">Open Dashboard →</a>
    <p style="font-size:12px;color:#8a8070;margin-top:20px">Questions? Reply to this email — I'm Max and I'll get back to you personally.</p>
  `);
}

export function emailSubscriptionPastDue({ planName, dashboardUrl }) {
  return baseLayout(`
    <h2 style="margin:0 0 8px;font-size:22px;letter-spacing:-.01em">Payment failed</h2>
    <p style="font-size:14px;margin:0 0 16px;color:#45403a">We couldn't process the renewal charge for your <strong>${String(planName).replace(/</g,'&lt;')}</strong> plan. Your store is temporarily unavailable until payment is resolved.</p>
    <p style="font-size:13px;color:#45403a;margin:0 0 24px">To reactivate your store, update your payment method or re-subscribe from your dashboard.</p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#c44;color:#fff;padding:13px 28px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;text-decoration:none">Update payment →</a>
    <p style="font-size:12px;color:#8a8070;margin-top:20px">If you believe this is an error, reply to this email.</p>
  `);
}

export function emailPaymentConfirmedCustomer({ order, storeName }) {
  const ref = (order.id || '').slice(0, 8).toUpperCase();
  return baseLayout(`
    <h2 style="margin:0 0 4px;font-size:22px;letter-spacing:-.01em">¡Pago confirmado!</h2>
    <p style="margin:0 0 20px;color:#8a8070;font-size:13px">#${ref} · ${String(storeName).replace(/</g,'&lt;')}</p>
    <p style="font-size:14px;margin:0 0 16px">Tu pago de <strong>${fmtARS(order.total_cents || 0)}</strong> ha sido confirmado. ¡Gracias!</p>
    <p style="font-size:13px;color:#8a8070">Nos pondremos en contacto pronto para coordinar el envío.</p>
  `);
}
