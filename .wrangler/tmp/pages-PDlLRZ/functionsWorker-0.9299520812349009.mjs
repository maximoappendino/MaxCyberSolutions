var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-OJoKp4/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// _lib/helpers.js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(json, "json");
function uuid() {
  return crypto.randomUUID();
}
__name(uuid, "uuid");
function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match2 = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match2 ? decodeURIComponent(match2[1]) : null;
}
__name(getCookie, "getCookie");
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(esc, "esc");
function sessionCookie(id, maxAge = 604800) {
  return `session_id=${encodeURIComponent(id)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}
__name(sessionCookie, "sessionCookie");

// _lib/auth.js
var PBKDF2_ITERATIONS = 1e5;
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return { salt: toHex(salt), hash };
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, saltHex, storedHash) {
  const salt = fromHex(saltHex);
  const hash = await pbkdf2(password, salt);
  return timingSafeEqual(hash, storedHash);
}
__name(verifyPassword, "verifyPassword");
async function pbkdf2(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toHex(new Uint8Array(bits));
}
__name(pbkdf2, "pbkdf2");
function timingSafeEqual(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
function toHex(buf) {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(toHex, "toHex");
function fromHex(hex) {
  return new Uint8Array(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));
}
__name(fromHex, "fromHex");

// api/auth/login.js
var SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { email, password } = body ?? {};
  if (!email || !password)
    return json({ error: "email and password are required" }, 400);
  const owner = await env.DB.prepare("SELECT * FROM owners WHERE email = ?").bind(email.toLowerCase()).first();
  if (!owner) {
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    return json({ error: "Invalid credentials" }, 401);
  }
  const valid = await verifyPassword(password, owner.salt, owner.hash);
  if (!valid)
    return json({ error: "Invalid credentials" }, 401);
  const sessionId = uuid();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1e3).toISOString().replace("T", " ").slice(0, 19);
  await env.DB.prepare(
    "INSERT INTO sessions (id, owner_id, expires_at) VALUES (?, ?, ?)"
  ).bind(sessionId, owner.id, expiresAt).run();
  return new Response(JSON.stringify({ id: owner.id, email: owner.email }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie(sessionId, SESSION_TTL_SECONDS)
    }
  });
}
__name(onRequestPost, "onRequestPost");

// api/auth/logout.js
async function onRequestPost2({ request, env }) {
  const sessionId = getCookie(request, "session_id");
  if (sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookie("", 0)
    }
  });
}
__name(onRequestPost2, "onRequestPost");

// api/auth/register.js
async function onRequestPost3({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { email, password } = body ?? {};
  if (!email || !password)
    return json({ error: "email and password are required" }, 400);
  if (password.length < 8)
    return json({ error: "Password must be at least 8 characters" }, 400);
  if (!/^\S+@\S+\.\S+$/.test(email))
    return json({ error: "Invalid email format" }, 400);
  const exists = await env.DB.prepare("SELECT id FROM owners WHERE email = ?").bind(email.toLowerCase()).first();
  if (exists)
    return json({ error: "Email already registered" }, 409);
  const { salt, hash } = await hashPassword(password);
  const id = uuid();
  await env.DB.prepare(
    "INSERT INTO owners (id, email, salt, hash) VALUES (?, ?, ?, ?)"
  ).bind(id, email.toLowerCase(), salt, hash).run();
  return json({ id, email: email.toLowerCase() }, 201);
}
__name(onRequestPost3, "onRequestPost");

// api/products/[id].js
async function owned(id, ownerId, env) {
  return env.DB.prepare(`
    SELECT p.* FROM products p
    JOIN stores s ON s.id = p.store_id
    WHERE p.id = ? AND s.owner_id = ?
  `).bind(id, ownerId).first();
}
__name(owned, "owned");
async function onRequestGet({ params, data, env }) {
  const product = await owned(params.id, data.owner_id, env);
  if (!product)
    return json({ error: "Not found" }, 404);
  return json(parseMeta(product));
}
__name(onRequestGet, "onRequestGet");
async function onRequestPut({ params, request, data, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const product = await owned(params.id, data.owner_id, env);
  if (!product)
    return json({ error: "Not found" }, 404);
  const { name, description, price_cents, metadata, sku, in_stock } = body ?? {};
  if (price_cents !== void 0 && (!Number.isInteger(price_cents) || price_cents < 0)) {
    return json({ error: "price_cents must be a non-negative integer" }, 400);
  }
  const u = {
    name: name ?? product.name,
    description: description ?? product.description,
    price_cents: price_cents ?? product.price_cents,
    sku: sku ?? product.sku,
    in_stock: in_stock !== void 0 ? in_stock ? 1 : 0 : product.in_stock,
    metadata: JSON.stringify(metadata ?? JSON.parse(product.metadata || "{}"))
  };
  try {
    await env.DB.prepare(`
      UPDATE products
      SET name = ?, description = ?, price_cents = ?, sku = ?, in_stock = ?, metadata = ?
      WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)
    `).bind(
      u.name,
      u.description,
      u.price_cents,
      u.sku,
      u.in_stock,
      u.metadata,
      params.id,
      data.owner_id
    ).run();
  } catch (e) {
    if (e.message?.includes("UNIQUE"))
      return json({ error: "SKU already exists in this store" }, 409);
    throw e;
  }
  return json({ ...u, id: params.id, metadata: JSON.parse(u.metadata), in_stock: !!u.in_stock });
}
__name(onRequestPut, "onRequestPut");
async function onRequestDelete({ params, data, env }) {
  const result = await env.DB.prepare(`
    DELETE FROM products
    WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)
  `).bind(params.id, data.owner_id).run();
  if (!result.meta?.changes)
    return json({ error: "Not found" }, 404);
  return json({ ok: true });
}
__name(onRequestDelete, "onRequestDelete");
function parseMeta(row) {
  try {
    row.metadata = JSON.parse(row.metadata);
  } catch {
    row.metadata = {};
  }
  row.in_stock = !!row.in_stock;
  return row;
}
__name(parseMeta, "parseMeta");

// api/stores/[id].js
async function onRequestGet2({ params, data, env }) {
  const store = await env.DB.prepare(
    "SELECT id, slug, name, config, created_at FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(params.id, data.owner_id).first();
  if (!store)
    return json({ error: "Not found" }, 404);
  try {
    store.config = JSON.parse(store.config);
  } catch {
    store.config = {};
  }
  return json(store);
}
__name(onRequestGet2, "onRequestGet");
async function onRequestPut2({ params, request, data, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const row = await env.DB.prepare(
    "SELECT config FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(params.id, data.owner_id).first();
  if (!row)
    return json({ error: "Not found" }, 404);
  let current;
  try {
    current = JSON.parse(row.config);
  } catch {
    current = {};
  }
  const { name, config } = body ?? {};
  const updated = config ? {
    ...current,
    ...config,
    features: { ...current.features || {}, ...config.features || {} },
    theme: { ...current.theme || {}, ...config.theme || {} },
    seo: { ...current.seo || {}, ...config.seo || {} }
  } : current;
  const updatedName = name ?? (current.name || "");
  if (name)
    updated.name = name;
  await env.DB.prepare(
    "UPDATE stores SET name = ?, config = ? WHERE id = ? AND owner_id = ?"
  ).bind(updatedName, JSON.stringify(updated), params.id, data.owner_id).run();
  return json({ id: params.id, name: updatedName, config: updated });
}
__name(onRequestPut2, "onRequestPut");
async function onRequestDelete2({ params, data, env }) {
  const result = await env.DB.prepare(
    "DELETE FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(params.id, data.owner_id).run();
  if (!result.meta?.changes)
    return json({ error: "Not found" }, 404);
  return json({ ok: true });
}
__name(onRequestDelete2, "onRequestDelete");

// api/me.js
async function onRequestGet3({ data, env }) {
  const owner = await env.DB.prepare("SELECT id, email FROM owners WHERE id = ?").bind(data.owner_id).first();
  if (!owner)
    return json({ error: "Not found" }, 404);
  return json({ id: owner.id, email: owner.email });
}
__name(onRequestGet3, "onRequestGet");

// api/products/index.js
async function onRequestGet4({ request, data, env }) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get("store_id");
  if (!storeId)
    return json({ error: "store_id query parameter is required" }, 400);
  const store = await env.DB.prepare(
    "SELECT id FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(storeId, data.owner_id).first();
  if (!store)
    return json({ error: "Store not found or access denied" }, 404);
  const { results } = await env.DB.prepare(
    "SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC"
  ).bind(storeId).all();
  return json((results || []).map(parseMeta2));
}
__name(onRequestGet4, "onRequestGet");
async function onRequestPost4({ request, data, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { store_id, sku, name, description = "", price_cents, metadata = {}, in_stock = true } = body ?? {};
  if (!store_id || !sku || !name || price_cents === void 0) {
    return json({ error: "store_id, sku, name, and price_cents are required" }, 400);
  }
  if (!Number.isInteger(price_cents) || price_cents < 0) {
    return json({ error: "price_cents must be a non-negative integer" }, 400);
  }
  const store = await env.DB.prepare(
    "SELECT id FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(store_id, data.owner_id).first();
  if (!store)
    return json({ error: "Store not found or access denied" }, 404);
  const id = uuid();
  try {
    await env.DB.prepare(
      "INSERT INTO products (id, store_id, sku, name, description, price_cents, metadata, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, store_id, sku, name, description, price_cents, JSON.stringify(metadata), in_stock ? 1 : 0).run();
  } catch (e) {
    if (e.message?.includes("UNIQUE"))
      return json({ error: "SKU already exists in this store" }, 409);
    throw e;
  }
  return json({ id, store_id, sku, name, description, price_cents, metadata, in_stock: !!in_stock }, 201);
}
__name(onRequestPost4, "onRequestPost");
function parseMeta2(row) {
  try {
    row.metadata = JSON.parse(row.metadata);
  } catch {
    row.metadata = {};
  }
  row.in_stock = !!row.in_stock;
  return row;
}
__name(parseMeta2, "parseMeta");

// api/stores/index.js
async function onRequestGet5({ data, env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, slug, name, config, created_at FROM stores WHERE owner_id = ? ORDER BY created_at DESC"
  ).bind(data.owner_id).all();
  return json((results || []).map(parseConfig));
}
__name(onRequestGet5, "onRequestGet");
async function onRequestPost5({ request, data, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { slug, name, config = {} } = body ?? {};
  if (!slug)
    return json({ error: "slug is required" }, 400);
  if (!/^[a-z0-9-]{2,48}$/.test(slug)) {
    return json({ error: "slug must be 2\u201348 chars: lowercase letters, numbers, hyphens" }, 400);
  }
  const taken = await env.DB.prepare("SELECT id FROM stores WHERE slug = ?").bind(slug).first();
  if (taken)
    return json({ error: "Slug already taken" }, 409);
  const storeName = name || slug;
  const merged = {
    name: storeName,
    theme: { accent: "#e2a14a", dark: false, ...config.theme || {} },
    seo: { title: storeName, description: "", ...config.seo || {} },
    features: {
      hasInventoryTracking: false,
      hasNewsletterPopup: false,
      hasDiscountCountdown: false,
      ...config.features || {}
    },
    ...config.name ? {} : {}
  };
  const id = uuid();
  await env.DB.prepare(
    "INSERT INTO stores (id, slug, owner_id, name, config) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, slug, data.owner_id, storeName, JSON.stringify(merged)).run();
  return json({ id, slug, name: storeName, config: merged }, 201);
}
__name(onRequestPost5, "onRequestPost");
function parseConfig(row) {
  try {
    row.config = JSON.parse(row.config);
  } catch {
    row.config = {};
  }
  return row;
}
__name(parseConfig, "parseConfig");

// store/[slug].js
var CACHE_TTL = 60;
async function onRequestGet6({ params, env, request }) {
  const { slug } = params;
  const cache = caches.default;
  const cacheKey = new Request(`https://store-cache.internal/${slug}`);
  const cached = await cache.match(cacheKey);
  if (cached)
    return cached;
  const store = await env.DB.prepare("SELECT * FROM stores WHERE slug = ?").bind(slug).first();
  if (!store) {
    return new Response("Store not found", {
      status: 404,
      headers: { "Content-Type": "text/plain;charset=UTF-8" }
    });
  }
  let config;
  try {
    config = JSON.parse(store.config || "{}");
  } catch {
    config = {};
  }
  const { results: products } = await env.DB.prepare(
    "SELECT * FROM products WHERE store_id = ? ORDER BY created_at DESC"
  ).bind(store.id).all();
  const html = renderStorefront(store, config, products || []);
  const response = new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": `public, s-maxage=${CACHE_TTL}`
    }
  });
  await cache.put(cacheKey, response.clone());
  return response;
}
__name(onRequestGet6, "onRequestGet");
function renderStorefront(store, config, products) {
  const name = config.name || store.name || store.slug;
  const theme = config.theme || {};
  const seo = config.seo || {};
  const features = config.features || {};
  const accent = theme.accent || "#e2a14a";
  const dark = theme.dark ? "true" : "false";
  return `<!DOCTYPE html>
<html lang="en" data-dark="${dark}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(seo.title || name)}</title>
  <meta name="description" content="${esc(seo.description || "")}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="icon" href="/img/icon.webp" type="image/webp" />
  <style>
    :root {
      --accent:      ${esc(accent)};
      --accent-soft: color-mix(in srgb, ${esc(accent)} 18%, transparent);
      --cream: #efeae0; --ink: #1c1a16;
      --ink-soft: #45403a; --ink-faint: #7a736a;
      --rule: #d4cdbd; --rule-soft: #e2dccd;
      --bg: var(--cream); --fg: var(--ink);
      --fg-soft: var(--ink-soft); --fg-faint: var(--ink-faint);
      --line: var(--rule); --line-soft: var(--rule-soft);
      --serif: "Cormorant Garamond", Georgia, serif;
      --sans:  "DM Sans", sans-serif;
      --mono:  "JetBrains Mono", monospace;
      --pad:   clamp(24px, 6vw, 96px);
    }
    [data-dark="true"] {
      --bg: #0c0a07; --fg: #efeae0;
      --fg-soft: #b9b3a6; --fg-faint: #7a736a;
      --line: #2a2620; --line-soft: #1a1813;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0;
      background: var(--bg); color: var(--fg);
      font-family: var(--sans); font-size: 16px; line-height: 1.5;
      -webkit-font-smoothing: antialiased; }
    body { overflow-x: hidden; }
    a { color: var(--fg); }
    ::selection { background: var(--accent); color: #fff; }

    /* \u2500\u2500 Nav \u2500\u2500 */
    .s-bar {
      position: sticky; top: 0; z-index: 40;
      padding: 16px var(--pad);
      background: color-mix(in srgb, var(--bg) 85%, transparent);
      backdrop-filter: blur(14px) saturate(120%);
      border-bottom: 1px solid var(--line-soft);
      display: flex; justify-content: space-between; align-items: center;
    }
    .s-bar__name {
      font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase;
    }
    .s-bar__back {
      font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none;
      transition: color 160ms ease;
    }
    .s-bar__back:hover { color: var(--accent); }

    /* \u2500\u2500 Countdown \u2500\u2500 */
    .countdown {
      padding: 14px var(--pad);
      background: var(--accent); color: #fff;
      display: flex; align-items: center; gap: 20px;
      font-family: var(--mono);
    }
    .countdown__label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.85; }
    .countdown__time  { font-size: 20px; letter-spacing: 0.06em; }

    /* \u2500\u2500 Hero \u2500\u2500 */
    .s-hero {
      padding: 80px var(--pad) 60px;
      border-bottom: 1px solid var(--line);
    }
    .s-hero__tag  { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 20px; }
    .s-hero__title { font-family: var(--serif);
      font-size: clamp(52px, 9vw, 128px); line-height: 0.93;
      letter-spacing: -0.02em; font-weight: 400; margin: 0 0 24px; }
    .s-hero__desc  { font-family: var(--serif); font-style: italic;
      font-size: clamp(18px, 1.8vw, 26px); color: var(--fg-soft); max-width: 60ch; margin: 0; }

    /* \u2500\u2500 Products \u2500\u2500 */
    .s-products { padding: 64px var(--pad); }
    .s-products__head { margin-bottom: 48px; }
    .s-products__tag  { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .s-products__title { font-family: var(--serif);
      font-size: clamp(36px, 4.5vw, 64px); letter-spacing: -0.02em; margin: 0; }
    .s-products__title em { color: var(--fg-soft); font-style: italic; }

    .s-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      border-top: 1px solid var(--line); border-left: 1px solid var(--line);
    }
    .s-card {
      border-right: 1px solid var(--line); border-bottom: 1px solid var(--line);
      padding: 28px 24px; display: flex; flex-direction: column; gap: 12px;
      background: var(--bg); transition: background 200ms ease;
    }
    .s-card:hover { background: color-mix(in srgb, var(--accent) 5%, var(--bg)); }
    .s-card__sku   { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .s-card__name  { font-family: var(--serif); font-size: 24px;
      letter-spacing: -0.01em; line-height: 1.1; }
    .s-card__desc  { font-family: var(--serif); font-style: italic;
      font-size: 14px; color: var(--fg-soft); flex: 1; }
    .s-card__price { font-family: var(--serif); font-size: 34px;
      letter-spacing: -0.02em; line-height: 1; }
    .s-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .s-card__badge  { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 7px;
      border: 1px solid var(--line); color: var(--fg-faint); }
    .s-card__badge--oos { border-color: #b33; color: #b33; }
    .s-card__cta {
      margin-top: auto; padding: 12px 0;
      border-top: 1px solid var(--line-soft); border-left: none;
      border-right: none; border-bottom: none;
      font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase;
      background: none; color: var(--fg); width: 100%;
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; transition: color 160ms ease;
    }
    .s-card__cta:hover  { color: var(--accent); }
    .s-card__cta::after { content: "\u2192"; }

    /* \u2500\u2500 Empty state \u2500\u2500 */
    .s-empty {
      padding: 80px var(--pad); text-align: center;
      border-top: 1px solid var(--line);
    }
    .s-empty__text { font-family: var(--serif); font-style: italic;
      font-size: 26px; color: var(--fg-soft); }

    /* \u2500\u2500 Footer \u2500\u2500 */
    .s-foot {
      padding: 40px var(--pad); border-top: 1px solid var(--line);
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .s-foot__brand { font-family: var(--serif); font-size: 13px; color: var(--fg-faint); }
    .s-foot__link  { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint);
      text-decoration: none; transition: color 160ms ease; }
    .s-foot__link:hover { color: var(--accent); }

    /* \u2500\u2500 Newsletter modal \u2500\u2500 */
    .nl-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,.55);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity 360ms ease;
    }
    .nl-overlay.active { opacity: 1; pointer-events: auto; }
    .nl-modal {
      background: var(--bg); border: 1px solid var(--line);
      padding: 48px; max-width: 460px; width: calc(100% - 40px);
      display: flex; flex-direction: column; gap: 22px;
    }
    .nl-modal__title { font-family: var(--serif);
      font-size: clamp(28px, 5vw, 52px); letter-spacing: -0.02em; margin: 0; }
    .nl-modal__lede  { font-family: var(--serif); font-style: italic;
      font-size: 17px; color: var(--fg-soft); margin: 0; }
    .nl-form { display: flex; border: 1px solid var(--line); }
    .nl-input {
      flex: 1; background: transparent; border: none; outline: none;
      font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em;
      color: var(--fg); padding: 12px 16px;
    }
    .nl-btn {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 12px 20px;
      background: var(--fg); color: var(--bg); border: none; cursor: pointer;
      transition: opacity 160ms ease;
    }
    .nl-btn:hover { opacity: .85; }
    .nl-close {
      align-self: flex-end; background: none; border: none;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--fg-faint); cursor: pointer;
      transition: color 160ms ease;
    }
    .nl-close:hover { color: var(--fg); }

    @media (max-width: 640px) {
      .s-grid { grid-template-columns: 1fr; }
      .s-foot { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  <nav class="s-bar">
    <span class="s-bar__name">${esc(name)}</span>
    <a href="/" class="s-bar__back">\u2190 MaxCyberSolutions</a>
  </nav>

  ${features.hasDiscountCountdown ? renderCountdown() : ""}

  <header class="s-hero">
    <p class="s-hero__tag">Store &nbsp;/&nbsp; ${esc(store.slug)}</p>
    <h1 class="s-hero__title">${esc(name)}</h1>
    ${seo.description ? `<p class="s-hero__desc">${esc(seo.description)}</p>` : ""}
  </header>

  <section class="s-products">
    <div class="s-products__head">
      <p class="s-products__tag">\xA7 Catalogue</p>
      <h2 class="s-products__title">All <em>products</em>.</h2>
    </div>
    ${products.length ? `<div class="s-grid">${products.map(renderCard).join("")}</div>` : `<div class="s-empty"><p class="s-empty__text">No products yet &mdash; check back soon.</p></div>`}
  </section>

  ${features.hasNewsletterPopup ? renderNewsletterModal() : ""}

  <footer class="s-foot">
    <span class="s-foot__brand">Powered by MaxCyberSolutions</span>
    <a href="/" class="s-foot__link">maxcybersolutions.com \u2197</a>
  </footer>

  ${features.hasDiscountCountdown ? countdownScript() : ""}
  ${features.hasNewsletterPopup ? newsletterScript() : ""}
</body>
</html>`;
}
__name(renderStorefront, "renderStorefront");
function renderCard(p) {
  const dollars = (p.price_cents / 100).toFixed(2);
  let meta = {};
  try {
    meta = JSON.parse(p.metadata || "{}");
  } catch {
  }
  const badges = Object.entries(meta).map(([k, v]) => `<span class="s-card__badge">${esc(k)}: ${esc(String(v))}</span>`).join("");
  return `
  <article class="s-card">
    <div class="s-card__sku">SKU ${esc(p.sku)}</div>
    <h3 class="s-card__name">${esc(p.name)}</h3>
    ${p.description ? `<p class="s-card__desc">${esc(p.description)}</p>` : ""}
    <div class="s-card__price">$${esc(dollars)}</div>
    <div class="s-card__badges">
      ${!p.in_stock ? '<span class="s-card__badge s-card__badge--oos">Out of stock</span>' : ""}
      ${badges}
    </div>
    <button class="s-card__cta">Inquire</button>
  </article>`;
}
__name(renderCard, "renderCard");
function renderCountdown() {
  return `<div class="countdown">
    <span class="countdown__label">Limited offer ends in</span>
    <span class="countdown__time" id="cd-time">--:--:--</span>
  </div>`;
}
__name(renderCountdown, "renderCountdown");
function countdownScript() {
  return `<script>
(function(){
  var end = new Date(); end.setHours(end.getHours() + 24, 0, 0, 0);
  function tick(){
    var d = end - Date.now();
    if(d <= 0){ document.getElementById('cd-time').textContent = '00:00:00'; return; }
    var h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000);
    document.getElementById('cd-time').textContent = [h,m,s].map(function(n){return String(n).padStart(2,'0');}).join(':');
    setTimeout(tick, 1000);
  }
  tick();
})();
<\/script>`;
}
__name(countdownScript, "countdownScript");
function renderNewsletterModal() {
  return `<div class="nl-overlay" id="nl-overlay" role="dialog" aria-modal="true" aria-label="Newsletter signup">
  <div class="nl-modal">
    <button class="nl-close" id="nl-close">Close \u2715</button>
    <h2 class="nl-modal__title">Stay in the loop.</h2>
    <p class="nl-modal__lede">New arrivals, exclusive drops. No noise.</p>
    <form class="nl-form" id="nl-form">
      <input class="nl-input" type="email" placeholder="your@email.com" required aria-label="Email address" />
      <button type="submit" class="nl-btn">Subscribe</button>
    </form>
  </div>
</div>`;
}
__name(renderNewsletterModal, "renderNewsletterModal");
function newsletterScript() {
  return `<script>
(function(){
  var overlay = document.getElementById('nl-overlay');
  var closeBtn = document.getElementById('nl-close');
  var form = document.getElementById('nl-form');
  setTimeout(function(){ overlay.classList.add('active'); }, 3500);
  closeBtn.addEventListener('click', function(){ overlay.classList.remove('active'); });
  overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.classList.remove('active'); });
  form.addEventListener('submit', function(e){ e.preventDefault(); overlay.classList.remove('active'); });
})();
<\/script>`;
}
__name(newsletterScript, "newsletterScript");

// dashboard/[[path]].js
var DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dashboard \u2014 MaxCyberSolutions</title>
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

    /* \u2500\u2500 Layout \u2500\u2500 */
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

    /* \u2500\u2500 Screens \u2500\u2500 */
    .screen { display: none; }
    .screen.active { display: block; }

    /* \u2500\u2500 Login \u2500\u2500 */
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

    /* \u2500\u2500 Section head \u2500\u2500 */
    .sec-head { margin-bottom: 40px; }
    .sec-head__tag { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .sec-head__title { font-family: var(--serif);
      font-size: clamp(36px, 5vw, 60px); letter-spacing: -0.02em; margin: 0; }

    /* \u2500\u2500 Stores list \u2500\u2500 */
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

    /* \u2500\u2500 New store form \u2500\u2500 */
    .new-store-form {
      border: 1px solid var(--line); padding: 32px;
      display: flex; flex-direction: column; gap: 20px;
      max-width: 520px;
    }
    .new-store-form__title { font-family: var(--serif); font-size: 26px;
      letter-spacing: -0.01em; margin: 0; }
    .form-row { display: flex; gap: 12px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }

    /* \u2500\u2500 Store detail \u2500\u2500 */
    .store-detail__back {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--fg-faint);
      background: none; border: none; padding: 0; margin-bottom: 32px;
      display: inline-flex; align-items: center; gap: 8px;
      transition: color 160ms ease;
    }
    .store-detail__back:hover { color: var(--fg); }
    .store-detail__back::before { content: "\u2190"; }
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

    /* \u2500\u2500 Feature flags \u2500\u2500 */
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

    /* \u2500\u2500 Config panel \u2500\u2500 */
    .config-panel { border: 1px solid var(--line); padding: 28px;
      display: flex; flex-direction: column; gap: 20px; max-width: 520px; margin-bottom: 48px; }
    .config-panel__title { font-family: var(--serif); font-size: 22px;
      letter-spacing: -0.01em; margin: 0; }

    /* \u2500\u2500 Products table \u2500\u2500 */
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

    /* \u2500\u2500 Product form modal \u2500\u2500 */
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

    /* \u2500\u2500 Empty \u2500\u2500 */
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
  <!-- \u2500\u2500 Auth bar (hidden until logged in) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
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

  <!-- \u2500\u2500 Login screen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
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
          <button type="submit" class="login-submit" id="login-submit">Sign in \u2192</button>
          <p class="login-msg" id="login-msg"></p>
        </form>
      </div>
    </div>
  </div>

  <!-- \u2500\u2500 Stores screen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
  <div class="screen" id="screen-stores">
    <div class="d-content">
      <div class="sec-head">
        <p class="sec-head__tag">\xA7 Stores</p>
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
          <button class="btn-solid" id="ns-submit">Create store \u2192</button>
          <p class="status-msg" id="ns-msg"></p>
        </div>
      </div>
    </div>
  </div>

  <!-- \u2500\u2500 Store detail screen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
  <div class="screen" id="screen-detail">
    <div class="d-content">
      <button class="store-detail__back" id="detail-back">Stores</button>
      <div class="store-detail__header">
        <div>
          <h2 class="store-detail__title" id="detail-name"></h2>
          <p class="store-detail__slug" id="detail-slug-label"></p>
        </div>
        <a class="store-detail__preview" id="detail-preview" target="_blank" rel="noopener">Preview store \u2197</a>
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

  <!-- \u2500\u2500 Product form modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
  <div class="modal-overlay" id="product-modal">
    <div class="modal-box">
      <div class="modal-box__head">
        <h3 class="modal-box__title" id="pm-title">New product</h3>
        <button class="modal-close" id="pm-close">Close \u2715</button>
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

  <script src="/js/dashboard.js"><\/script>
</body>
</html>`;
async function onRequestGet7() {
  return new Response(DASHBOARD_HTML, {
    headers: { "Content-Type": "text/html;charset=UTF-8" }
  });
}
__name(onRequestGet7, "onRequestGet");

// dashboard.js
async function onRequestGet8() {
  return Response.redirect("/dashboard/", 301);
}
__name(onRequestGet8, "onRequestGet");

// api/_middleware.js
async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/auth/")) {
    return next();
  }
  const sessionId = getCookie(request, "session_id");
  if (!sessionId)
    return json({ error: "Unauthorized" }, 401);
  const session = await env.DB.prepare(
    "SELECT owner_id FROM sessions WHERE id = ? AND expires_at > datetime('now')"
  ).bind(sessionId).first();
  if (!session)
    return json({ error: "Unauthorized" }, 401);
  context.data.owner_id = session.owner_id;
  return next();
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-PDlLRZ/functionsRoutes-0.17572135821828216.mjs
var routes = [
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/auth/register",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/products/:id",
    mountPath: "/api/products",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/products/:id",
    mountPath: "/api/products",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/products/:id",
    mountPath: "/api/products",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut]
  },
  {
    routePath: "/api/stores/:id",
    mountPath: "/api/stores",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete2]
  },
  {
    routePath: "/api/stores/:id",
    mountPath: "/api/stores",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/stores/:id",
    mountPath: "/api/stores",
    method: "PUT",
    middlewares: [],
    modules: [onRequestPut2]
  },
  {
    routePath: "/api/me",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/products",
    mountPath: "/api/products",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/products",
    mountPath: "/api/products",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/stores",
    mountPath: "/api/stores",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/stores",
    mountPath: "/api/stores",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/store/:slug",
    mountPath: "/store",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/dashboard/:path*",
    mountPath: "/dashboard",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/dashboard",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api",
    mountPath: "/api",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-OJoKp4/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-OJoKp4/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.9299520812349009.mjs.map
