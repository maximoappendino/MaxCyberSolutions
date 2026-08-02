// Verify a MercadoPago webhook signature (v1 HMAC-SHA256).
// Returns true when the signature is valid, or when MP_WEBHOOK_SECRET is not set
// (graceful degradation — configure the secret to enable enforcement).
export async function verifyMpSignature(request, dataId, env) {
  const secret = env.MP_WEBHOOK_SECRET;
  if (!secret) return true;

  const sigHeader = request.headers.get('x-signature') || '';
  const parts = {};
  sigHeader.split(',').forEach(part => {
    const eq = part.indexOf('=');
    if (eq > 0) parts[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  });

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // MP template: "id:{paymentId};request-date:{ts};"
  const template = `id:${dataId};request-date:${ts};`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig      = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(template));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === v1;
}
