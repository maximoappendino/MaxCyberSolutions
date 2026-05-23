var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-8xSi7Q/strip-cf-connecting-ip-header.js
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
  const { name, description, price_cents, metadata, sku, in_stock, category, visible } = body ?? {};
  if (price_cents !== void 0 && (!Number.isInteger(price_cents) || price_cents < 0)) {
    return json({ error: "price_cents must be a non-negative integer" }, 400);
  }
  const u = {
    name: name ?? product.name,
    description: description ?? product.description,
    price_cents: price_cents ?? product.price_cents,
    sku: sku ?? product.sku,
    in_stock: in_stock !== void 0 ? in_stock ? 1 : 0 : product.in_stock,
    metadata: JSON.stringify(metadata ?? JSON.parse(product.metadata || "{}")),
    category: category !== void 0 ? category : product.category || "",
    visible: visible !== void 0 ? visible ? 1 : 0 : product.visible ?? 1,
    image: body.image !== void 0 ? body.image : product.image || ""
  };
  try {
    await env.DB.prepare(`
      UPDATE products
      SET name = ?, description = ?, price_cents = ?, sku = ?, in_stock = ?, metadata = ?,
          category = ?, visible = ?, image = ?
      WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)
    `).bind(
      u.name,
      u.description,
      u.price_cents,
      u.sku,
      u.in_stock,
      u.metadata,
      u.category,
      u.visible,
      u.image,
      params.id,
      data.owner_id
    ).run();
  } catch (e) {
    if (e.message?.includes("UNIQUE"))
      return json({ error: "SKU already exists in this store" }, 409);
    throw e;
  }
  return json({
    ...u,
    id: params.id,
    metadata: JSON.parse(u.metadata),
    in_stock: !!u.in_stock,
    visible: !!u.visible
  });
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
  row.visible = row.visible !== 0;
  row.category = row.category || "";
  return row;
}
__name(parseMeta, "parseMeta");

// api/stores/[id].js
async function onRequestGet2({ params, data, env }) {
  const store = await env.DB.prepare(
    "SELECT id, slug, name, config, preview_config, created_at FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(params.id, data.owner_id).first();
  if (!store)
    return json({ error: "Not found" }, 404);
  try {
    store.config = JSON.parse(store.config);
  } catch {
    store.config = {};
  }
  if (store.preview_config) {
    try {
      store.preview_config = JSON.parse(store.preview_config);
    } catch {
      store.preview_config = null;
    }
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
    "SELECT config, preview_config FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(params.id, data.owner_id).first();
  if (!row)
    return json({ error: "Not found" }, 404);
  const isDraft = body._draft === true;
  const baseStr = isDraft && row.preview_config ? row.preview_config : row.config;
  let current;
  try {
    current = JSON.parse(baseStr || "{}");
  } catch {
    current = {};
  }
  const { name, config } = body ?? {};
  const updated = config ? {
    ...current,
    ...config,
    features: { ...current.features || {}, ...config.features || {} },
    theme: { ...current.theme || {}, ...config.theme || {} },
    seo: { ...current.seo || {}, ...config.seo || {} },
    // sections replaces entirely — no merge
    sections: config.sections !== void 0 ? config.sections : current.sections || []
  } : current;
  if (name)
    updated.name = name;
  if (isDraft) {
    await env.DB.prepare(
      "UPDATE stores SET preview_config = ? WHERE id = ? AND owner_id = ?"
    ).bind(JSON.stringify(updated), params.id, data.owner_id).run();
    return json({ id: params.id, draft: true, config: updated });
  }
  const updatedName = name ?? (current.name || "");
  await env.DB.prepare(
    "UPDATE stores SET name = ?, config = ?, preview_config = NULL WHERE id = ? AND owner_id = ?"
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

// api/assets/[[path]].js
async function onRequestGet3({ params, env }) {
  const key = Array.isArray(params.path) ? params.path.join("/") : String(params.path || "");
  if (!key)
    return new Response("Not found", { status: 404 });
  const obj = await env.ASSETS_BUCKET.get(key);
  if (!obj)
    return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}
__name(onRequestGet3, "onRequestGet");

// api/me.js
async function onRequestGet4({ data, env }) {
  const owner = await env.DB.prepare("SELECT id, email FROM owners WHERE id = ?").bind(data.owner_id).first();
  if (!owner)
    return json({ error: "Not found" }, 404);
  return json({ id: owner.id, email: owner.email });
}
__name(onRequestGet4, "onRequestGet");

// api/products/index.js
async function onRequestGet5({ request, data, env }) {
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
__name(onRequestGet5, "onRequestGet");
async function onRequestPost4({ request, data, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const {
    store_id,
    sku,
    name,
    description = "",
    price_cents,
    metadata = {},
    in_stock = true,
    category = "",
    visible = true
  } = body ?? {};
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
      "INSERT INTO products (id, store_id, sku, name, description, price_cents, metadata, in_stock, category, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      store_id,
      sku,
      name,
      description,
      price_cents,
      JSON.stringify(metadata),
      in_stock ? 1 : 0,
      category,
      visible ? 1 : 0
    ).run();
  } catch (e) {
    if (e.message?.includes("UNIQUE"))
      return json({ error: "SKU already exists in this store" }, 409);
    throw e;
  }
  return json({
    id,
    store_id,
    sku,
    name,
    description,
    price_cents,
    metadata,
    in_stock: !!in_stock,
    category,
    visible: !!visible
  }, 201);
}
__name(onRequestPost4, "onRequestPost");
function parseMeta2(row) {
  try {
    row.metadata = JSON.parse(row.metadata);
  } catch {
    row.metadata = {};
  }
  row.in_stock = !!row.in_stock;
  row.visible = row.visible !== 0;
  row.category = row.category || "";
  return row;
}
__name(parseMeta2, "parseMeta");

// api/stores/index.js
async function onRequestGet6({ data, env }) {
  const { results } = await env.DB.prepare(
    "SELECT id, slug, name, config, created_at FROM stores WHERE owner_id = ? ORDER BY created_at DESC"
  ).bind(data.owner_id).all();
  return json((results || []).map(parseConfig));
}
__name(onRequestGet6, "onRequestGet");
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

// api/upload.js
async function onRequestPost6({ request, env, data }) {
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Expected multipart/form-data" }, 400);
  }
  const file = formData.get("file");
  const storeId = formData.get("store_id");
  if (!file || typeof file.arrayBuffer !== "function")
    return json({ error: "No file provided" }, 400);
  if (!storeId)
    return json({ error: "store_id is required" }, 400);
  const store = await env.DB.prepare(
    "SELECT id FROM stores WHERE id = ? AND owner_id = ?"
  ).bind(storeId, data.owner_id).first();
  if (!store)
    return json({ error: "Store not found" }, 404);
  const rawExt = (file.name || "file").split(".").pop().toLowerCase();
  const ext = /^[a-z0-9]{1,6}$/.test(rawExt) ? rawExt : "bin";
  const key = `stores/${storeId}/${uuid()}.${ext}`;
  await env.ASSETS_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" }
  });
  return json({ url: `/api/assets/${key}` });
}
__name(onRequestPost6, "onRequestPost");

// store/[slug].js
var CACHE_TTL = 60;
async function onRequestGet7({ params, env, request }) {
  const { slug } = params;
  const url = new URL(request.url);
  const isPreview = url.searchParams.get("preview") === "1";
  if (!isPreview) {
    const cache = caches.default;
    const cacheKey = new Request(`https://store-cache.internal/${slug}`);
    const cached = await cache.match(cacheKey);
    if (cached)
      return cached;
  }
  const store = await env.DB.prepare("SELECT * FROM stores WHERE slug = ?").bind(slug).first();
  if (!store) {
    return new Response("Store not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  let config;
  if (isPreview) {
    const sessionId = getCookie(request, "session_id");
    let isOwner = false;
    if (sessionId) {
      const session = await env.DB.prepare(
        "SELECT owner_id FROM sessions WHERE id = ? AND expires_at > datetime('now')"
      ).bind(sessionId).first();
      isOwner = session?.owner_id === store.owner_id;
    }
    const raw = isOwner && store.preview_config ? store.preview_config : store.config;
    try {
      config = JSON.parse(raw || "{}");
    } catch {
      config = {};
    }
  } else {
    try {
      config = JSON.parse(store.config || "{}");
    } catch {
      config = {};
    }
  }
  const { results: products } = await env.DB.prepare(
    "SELECT * FROM products WHERE store_id = ? AND visible = 1 ORDER BY created_at DESC"
  ).bind(store.id).all();
  const html = renderStorefront(store, config, products || [], isPreview);
  const response = new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": isPreview ? "private, no-store" : `public, s-maxage=${CACHE_TTL}`
    }
  });
  if (!isPreview) {
    const cache = caches.default;
    const cacheKey = new Request(`https://store-cache.internal/${slug}`);
    await cache.put(cacheKey, response.clone());
  }
  return response;
}
__name(onRequestGet7, "onRequestGet");
var STYLE_VARS = {
  max: { r: "0px", rb: "0px", bw: "1px", sh: "none", shc: "none" },
  alexis: { r: "0px", rb: "0px", bw: "4px", sh: "4px 4px 0 var(--ink)", shc: "8px 8px 0 var(--ink)" },
  alicia: { r: "6px", rb: "6px", bw: "1px", sh: "0 2px 16px rgba(0,0,0,.45)", shc: "0 4px 28px rgba(0,0,0,.55)" },
  ciro: { r: "12px", rb: "48px", bw: "1px", sh: "0 2px 12px rgba(0,0,0,.06)", shc: "0 4px 20px rgba(0,0,0,.09)" },
  emilse: { r: "10px", rb: "20px", bw: "1px", sh: "0 4px 20px rgba(0,0,0,.08)", shc: "0 6px 28px rgba(0,0,0,.11)" },
  frank: { r: "4px", rb: "4px", bw: "1px", sh: "0 0 0 1px rgba(0,240,255,.12)", shc: "0 0 24px rgba(0,240,255,.08)" },
  gaspar: { r: "20px", rb: "20px", bw: "2px", sh: "none", shc: "none" },
  nani: { r: "0px", rb: "0px", bw: "1px", sh: "0 1px 8px rgba(0,0,0,.04)", shc: "0 2px 16px rgba(0,0,0,.06)" },
  saira: { r: "8px", rb: "8px", bw: "0px", sh: "0 8px 32px rgba(0,0,0,.12)", shc: "0 12px 40px rgba(0,0,0,.15)" },
  vivi: { r: "0px", rb: "2px", bw: "1px", sh: "none", shc: "0 2px 8px rgba(0,0,0,.07)" }
};
function renderStorefront(store, config, products, isPreview = false) {
  const name = config.name || store.name || store.slug;
  const theme = config.theme || {};
  const seo = config.seo || {};
  const features = config.features || {};
  const accent = theme.accent || "#e2a14a";
  const bgColor = theme.bg || "#efeae0";
  const fgColor = theme.fg || "#1c1a16";
  const logo = config.logo || "";
  const fonts = theme.fonts || {};
  const sv = STYLE_VARS[config.style] || STYLE_VARS.max;
  const sections = Array.isArray(config.sections) && config.sections.length ? config.sections : null;
  const hasHeaderSection = sections ? sections.some((s) => s.type === "header") : false;
  const hasFooterSection = sections ? sections.some((s) => s.type === "footer") : false;
  const floaters = sections ? sections.filter((s) => s.type === "floating-cta") : [];
  const customBtns = Array.isArray(config.buttons) ? config.buttons.filter((b) => b.text && b.url) : [];
  const body = sections ? sections.filter((s) => s.type !== "floating-cta").map((s) => renderSection(s, products, config)).join("\n") : renderLegacyBody(store, config, products);
  const fontLinks = [fonts.titleUrl, fonts.bodyUrl, fonts.accentUrl, fonts.sloganUrl].filter(Boolean).map((u) => `<link rel="stylesheet" href="${esc(u)}" />`).join("\n  ");
  const fgSoft = fgColor === "#1c1a16" ? "#45403a" : fgColor + "bb";
  const fgFaint = fgColor === "#1c1a16" ? "#7a736a" : fgColor + "77";
  const ruleSoft = bgColor === "#efeae0" ? "#e2dccd" : bgColor + "44";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(seo.title || name)}</title>
  <meta name="description" content="${esc(seo.description || "")}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  ${fontLinks}
  <link rel="icon" href="/img/icon.webp" type="image/webp" />
  <style>
    :root {
      --accent:      ${esc(accent)};
      --accent-soft: color-mix(in srgb, ${esc(accent)} 18%, transparent);
      --cream: ${esc(bgColor)}; --ink: ${esc(fgColor)};
      --ink-soft: ${esc(fgSoft)}; --ink-faint: ${esc(fgFaint)};
      --rule: #d4cdbd; --rule-soft: ${esc(ruleSoft)};
      --bg: var(--cream); --fg: var(--ink);
      --fg-soft: var(--ink-soft); --fg-faint: var(--ink-faint);
      --line: var(--rule); --line-soft: var(--rule-soft);
      --serif: ${fonts.titleFamily ? `"${esc(fonts.titleFamily)}"  ,` : ""}"Cormorant Garamond", Georgia, serif;
      --sans:  ${fonts.bodyFamily ? `"${esc(fonts.bodyFamily)}"   ,` : ""}"DM Sans", sans-serif;
      --mono:  ${fonts.accentFamily ? `"${esc(fonts.accentFamily)}" ,` : ""}"JetBrains Mono", monospace;
      --slogan:${fonts.sloganFamily ? `"${esc(fonts.sloganFamily)}" ,` : ""}"Cormorant Garamond", Georgia, serif;
      --pad:   clamp(24px, 6vw, 96px);
      --s-radius: ${sv.r}; --s-radius-btn: ${sv.rb};
      --s-border-w: ${sv.bw}; --s-shadow: ${sv.sh}; --s-shadow-card: ${sv.shc};
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0;
      background: var(--bg); color: var(--fg);
      font-family: var(--sans); font-size: 16px; line-height: 1.5;
      -webkit-font-smoothing: antialiased; }
    body { overflow-x: hidden; }
    h1,h2,h3,h4,p,span,a { overflow-wrap: break-word; word-break: break-word; }
    a { color: var(--fg); }
    ::selection { background: var(--accent); color: #fff; }

    /* \u2500\u2500 Nav \u2500\u2500 */
    .s-bar {
      position: sticky; top: 0; z-index: 40;
      padding: 14px var(--pad);
      background: color-mix(in srgb, var(--bg) 88%, transparent);
      backdrop-filter: blur(14px) saturate(120%);
      border-bottom: 1px solid var(--line-soft);
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
    }
    .s-bar__logo { height: 32px; width: auto; object-fit: contain; }
    .s-bar__name { font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.18em; text-transform: uppercase; }
    .s-bar__back { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none; transition: color 160ms ease; }
    .s-bar__back:hover { color: var(--accent); }

    /* \u2500\u2500 Countdown \u2500\u2500 */
    .countdown {
      padding: 12px var(--pad); background: var(--accent); color: #fff;
      display: flex; align-items: center; gap: 20px; font-family: var(--mono);
    }
    .countdown__label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.85; }
    .countdown__time  { font-size: 20px; letter-spacing: 0.06em; }

    /* \u2500\u2500 Hero (base) \u2500\u2500 */
    .s-hero { border-bottom: 1px solid var(--line); }
    .s-hero__inner { padding: 80px var(--pad) 60px; }
    .s-hero__tag   { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 20px; }
    .s-hero__title { font-family: var(--serif);
      font-size: clamp(52px, 9vw, 128px); line-height: 0.93;
      letter-spacing: -0.02em; font-weight: 400; margin: 0 0 24px; }
    .s-hero__desc  { font-family: var(--serif); font-style: italic;
      font-size: clamp(18px, 1.8vw, 26px); color: var(--fg-soft); max-width: 60ch; margin: 0; }
    .s-hero__cta   {
      display: inline-block; margin-top: 32px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 14px 32px;
      background: var(--fg); color: var(--bg); text-decoration: none;
      border-radius: var(--s-radius-btn); border: var(--s-border-w) solid var(--fg);
      box-shadow: var(--s-shadow);
      transition: opacity 160ms ease;
    }
    .s-hero__cta:hover { opacity: 0.8; }

    /* \u2500\u2500 Hero with image \u2500\u2500 */
    .s-hero--img { position: relative; overflow: hidden; min-height: 60vh; display: flex; align-items: center; }
    .s-hero__bg  { position: absolute; inset: 0; background-size: cover; background-position: center; }
    .s-hero__overlay { position: absolute; inset: 0; background: rgba(0,0,0,.48); }
    .s-hero--img .s-hero__inner { position: relative; z-index: 1; width: 100%; }
    .s-hero--img .s-hero__tag,
    .s-hero--img .s-hero__title,
    .s-hero--img .s-hero__desc { color: #fff; }
    .s-hero--img .s-hero__cta  { background: #fff; color: #1c1a16; }

    /* \u2500\u2500 Alignment \u2500\u2500 */
    .s-hero--center .s-hero__inner { text-align: center; }
    .s-hero--center .s-hero__desc  { margin-left: auto; margin-right: auto; }
    .s-hero--right  .s-hero__inner { text-align: right; }
    .s-hero--right  .s-hero__desc  { margin-left: auto; }

    /* \u2500\u2500 Text banner \u2500\u2500 */
    .s-banner { padding: 14px var(--pad); font-family: var(--mono); }
    .s-banner--center { text-align: center; }
    .s-banner--right  { text-align: right; }
    .s-banner__text   { font-size: 12px; letter-spacing: 0.12em; }
    .s-banner__sub    { font-size: 11px; opacity: .75; display: block; margin-top: 3px; }
    .s-banner__cta    { display: inline-block; margin-left: 16px; font-size: 10px;
      letter-spacing: 0.13em; text-transform: uppercase; padding: 5px 14px;
      border: 1px solid currentColor; color: inherit; text-decoration: none; border-radius: var(--s-radius-btn); }
    .s-banner--sticky { position: sticky; top: 0; z-index: 30; }
    .s-banner--dismiss-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: inherit; cursor: pointer; font-size: 14px; opacity: .6; }
    .s-banner--relative { position: relative; }
    .s-banner--marquee { overflow: hidden; padding-top: 12px; padding-bottom: 12px; }
    .s-banner__marquee { display: flex; gap: 80px; animation: s-marquee 22s linear infinite; width: max-content; }
    .s-banner__marquee span { white-space: nowrap; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; }
    @keyframes s-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

    /* \u2500\u2500 Products \u2500\u2500 */
    .s-products { padding: 64px var(--pad); }
    .s-products__head { margin-bottom: 48px; }
    .s-products__tag  { font-family: var(--mono); font-size: 10px;
      letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg-faint); margin-bottom: 12px; }
    .s-products__title { font-family: var(--serif);
      font-size: clamp(36px, 4.5vw, 64px); letter-spacing: -0.02em; margin: 0; }
    .s-products__title em { color: var(--fg-soft); font-style: italic; }

    /* \u2500\u2500 Filter / Sort toolbar \u2500\u2500 */
    .s-grid-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 16px 0; border-top: 1px solid var(--line-soft); margin-bottom: 0; }
    .s-grid-filters { display: flex; gap: 6px; flex-wrap: wrap; }
    .s-filter-btn { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; padding: 6px 14px; background: transparent;
      border: 1px solid var(--line); color: var(--fg-faint); cursor: pointer;
      border-radius: var(--s-radius-btn); transition: all 160ms ease; }
    .s-filter-btn:hover        { color: var(--fg); border-color: var(--fg); }
    .s-filter-btn--active      { background: var(--fg); color: var(--bg); border-color: var(--fg); }
    .s-filter-btn--tag.s-filter-btn--active { background: var(--accent); border-color: var(--accent); color: #fff; }
    .s-sort-select { margin-left: auto; font-family: var(--mono); font-size: 11px;
      letter-spacing: 0.08em; padding: 6px 12px; background: var(--bg); color: var(--fg);
      border: 1px solid var(--line); border-radius: var(--s-radius-btn); cursor: pointer; }

    /* Grid base */
    .s-grid { display: grid; border-top: 1px solid var(--line); border-left: 1px solid var(--line); }

    /* Grid layout: list */
    .s-grid--list { grid-template-columns: 1fr !important; }
    .s-grid--list .s-card { flex-direction: row; min-height: 200px; }
    .s-grid--list .s-card__img { width: 260px; min-width: 260px; aspect-ratio: unset; flex-shrink: 0; }

    /* Grid layout: featured (first item spans 2 cols) */
    .s-grid--featured .s-card:first-child { grid-column: span 2; }
    .s-grid--featured .s-card:first-child .s-card__img { aspect-ratio: 16/9; }
    .s-grid--featured .s-card:first-child .s-card__name { font-size: clamp(28px, 3vw, 42px); }

    /* Grid layout: minimal (2 cols, generous spacing) */
    .s-grid--minimal .s-card__body { padding: 32px 36px 44px; gap: 18px; }
    .s-grid--minimal .s-card__name { font-size: 28px; }
    .s-grid--minimal .s-card__price { font-size: 40px; }

    .s-card {
      border-right: var(--s-border-w) solid var(--line); border-bottom: var(--s-border-w) solid var(--line);
      border-radius: var(--s-radius); box-shadow: var(--s-shadow-card);
      display: flex; flex-direction: column; gap: 12px;
      background: var(--bg); transition: background 200ms ease; overflow: hidden; position: relative;
    }
    .s-card:hover { background: color-mix(in srgb, var(--accent) 5%, var(--bg)); }
    .s-card__img  {
      width: 100%; aspect-ratio: 4/3;
      background-size: cover; background-position: center;
      background-color: var(--line-soft); transition: transform 300ms ease, opacity 300ms ease;
    }
    /* Hover effects */
    .s-card--zoom:hover .s-card__img    { transform: scale(1.06); }
    .s-card--fade:hover .s-card__img    { opacity: 0.78; }
    .s-card--overlay::after { content: ''; position: absolute; inset: 0; background: transparent; transition: background 300ms ease; pointer-events: none; }
    .s-card--overlay:hover::after { background: rgba(0,0,0,.18); }

    .s-card__body { padding: 0 24px 28px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
    .s-card--noimg .s-card__body { padding-top: 28px; }
    .s-card__sku   { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--fg-faint); }
    .s-card__name  { font-family: var(--serif); font-size: 24px;
      letter-spacing: -0.01em; line-height: 1.1; }
    .s-card__cat   { font-family: var(--mono); font-size: 9px; letter-spacing: 0.15em;
      text-transform: uppercase; color: var(--fg-faint); }
    .s-card__desc  { font-family: var(--serif); font-style: italic;
      font-size: 14px; color: var(--fg-soft); flex: 1; }
    .s-card__price { font-family: var(--serif); font-size: 34px; letter-spacing: -0.02em; line-height: 1; }
    .s-card__rating { font-family: var(--mono); font-size: 11px; color: var(--accent); letter-spacing: 0.05em; }
    .s-card__badges { display: flex; flex-wrap: wrap; gap: 6px; }
    .s-card__badge  { font-family: var(--mono); font-size: 9px;
      letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 7px;
      border: var(--s-border-w) solid var(--line); border-radius: var(--s-radius-sm); color: var(--fg-faint); }
    .s-card__badge--oos { border-color: #b33; color: #b33; }
    .s-card__cta {
      margin-top: auto; padding: 12px 0;
      border-top: 1px solid var(--line-soft); border-left: none; border-right: none; border-bottom: none;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
      background: none; color: var(--fg); width: 100%;
      display: flex; justify-content: space-between; align-items: center;
      cursor: pointer; transition: color 160ms ease;
    }
    .s-card__cta:hover  { color: var(--accent); }
    .s-card__cta::after { content: "\u2192"; }

    /* \u2500\u2500 Image gallery \u2500\u2500 */
    .s-gallery { padding: 64px var(--pad); }
    .s-gallery__title { font-family: var(--serif);
      font-size: clamp(32px, 4.5vw, 56px); letter-spacing: -0.02em; margin: 0 0 40px; }
    .s-gallery__grid { display: grid; gap: 12px; }
    .s-gallery__item { position: relative; overflow: hidden; }
    .s-gallery__item img { width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform 300ms ease, opacity 300ms ease; }
    .s-gallery__item--zoom:hover img   { transform: scale(1.06); }
    .s-gallery__item--fade:hover img   { opacity: 0.78; }
    .s-gallery__item--overlay::after { content: ''; position: absolute; inset: 0; background: transparent; transition: background 300ms ease; }
    .s-gallery__item--overlay:hover::after { background: rgba(0,0,0,.2); }
    .s-gallery__caption {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 8px 12px; background: rgba(0,0,0,.55); color: #fff;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em;
    }
    /* Gallery: strip layout (horizontal scroll) */
    .s-gallery--strip .s-gallery__grid { display: flex; overflow-x: auto; flex-wrap: nowrap; gap: 12px;
      scrollbar-width: thin; padding-bottom: 8px; }
    .s-gallery--strip .s-gallery__item { flex-shrink: 0; width: 300px; }
    /* Gallery: featured (first image larger) */
    .s-gallery--featured .s-gallery__item:first-child { grid-column: span 2; grid-row: span 2; }
    /* Gallery: minimal (2 cols, more gap) */
    .s-gallery--minimal .s-gallery__grid { gap: 20px; }

    /* \u2500\u2500 Rich text / Text Block \u2500\u2500 */
    .s-rich { padding: 64px var(--pad); }
    .s-rich--sm  { padding: 32px var(--pad); }
    .s-rich--lg  { padding: 96px var(--pad); }
    .s-rich--center { text-align: center; }
    .s-rich--center .s-rich__body { margin-left: auto; margin-right: auto; }
    .s-rich__inner { margin: 0 auto; }
    .s-rich--narrow .s-rich__inner { max-width: 60ch; }
    .s-rich--normal .s-rich__inner { max-width: 80ch; }
    .s-rich--wide   .s-rich__inner { max-width: 100%; }
    .s-rich__heading    { font-family: var(--serif); font-size: clamp(32px,4vw,56px);
      letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 16px; }
    .s-rich__subheading { font-family: var(--serif); font-style: italic;
      font-size: clamp(17px,1.8vw,22px); color: var(--fg-soft); margin: 0 0 28px; }
    .s-rich__body { font-family: var(--serif); font-size: 18px; color: var(--fg-soft);
      line-height: 1.75; max-width: 72ch; white-space: pre-wrap; }
    .s-rich__cta  { display: inline-block; margin-top: 28px; font-family: var(--mono);
      font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; padding: 12px 28px;
      border-radius: var(--s-radius-btn); border: var(--s-border-w) solid var(--fg);
      background: var(--fg); color: var(--bg); text-decoration: none; transition: opacity 160ms ease; }
    .s-rich__cta:hover { opacity: 0.82; }
    .s-rich__cta--outline { background: transparent; color: var(--fg); }
    .s-rich__cta--ghost   { background: transparent; border-color: transparent; }
    .s-rich p  { font-family: var(--serif); font-size: 18px; color: var(--fg-soft); line-height: 1.75; }
    .s-rich h2 { font-family: var(--serif); font-size: clamp(28px,3vw,44px); letter-spacing: -0.02em; }

    /* \u2500\u2500 Floating CTAs \u2500\u2500 */
    .s-floats { position: fixed; inset: 0; z-index: 50; pointer-events: none; }
    .s-float {
      position: absolute; pointer-events: auto;
      display: flex; align-items: center; gap: 8px; padding: 12px 18px;
      font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
      text-decoration: none; color: #fff; border-radius: var(--s-radius-btn);
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .s-float:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,.32); }
    .s-float--bottom-right { bottom: 28px; right: 28px; }
    .s-float--bottom-left  { bottom: 28px; left:  28px; }
    .s-float--top-right    { top: 88px;    right: 28px; }
    .s-float--top-left     { top: 88px;    left:  28px; }
    .s-float__icon { font-size: 16px; line-height: 1; }

    /* \u2500\u2500 Carousel \u2500\u2500 */
    .s-hero--carousel { position: relative; overflow: hidden; }
    .s-carousel__track { position: absolute; inset: 0; }
    .s-carousel__slide { position: absolute; inset: 0; background-size: cover; background-position: center;
      opacity: 0; transition: opacity 900ms ease; }
    .s-carousel__slide.active { opacity: 1; }
    .s-carousel__btn {
      position: absolute; top: 50%; transform: translateY(-50%); z-index: 2;
      background: rgba(255,255,255,.18); border: none; color: #fff;
      font-size: 28px; line-height: 1; padding: 10px 16px; cursor: pointer;
      backdrop-filter: blur(4px); transition: background 160ms ease;
    }
    .s-carousel__btn:hover { background: rgba(255,255,255,.35); }
    .s-carousel__btn--prev { left: 16px; }
    .s-carousel__btn--next { right: 16px; }

    /* \u2500\u2500 Empty \u2500\u2500 */
    .s-empty { padding: 80px var(--pad); text-align: center; border-top: 1px solid var(--line); }
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

    /* \u2500\u2500 Header section \u2500\u2500 */
    .s-announce {
      padding: 0 var(--pad); display: flex; align-items: center; justify-content: center;
      gap: 16px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; position: relative;
    }
    .s-announce--sticky { position: sticky; top: 0; z-index: 50; }
    .s-announce__dismiss {
      position: absolute; right: var(--pad); background: none; border: none; cursor: pointer;
      font-family: var(--mono); font-size: 14px; opacity: 0.6; color: inherit; line-height: 1;
      transition: opacity 160ms; padding: 4px;
    }
    .s-announce__dismiss:hover { opacity: 1; }
    .s-announce__label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.85; }
    .s-announce__time  { font-size: 18px; letter-spacing: 0.06em; }
    .s-header {
      padding: 14px var(--pad);
      display: flex; align-items: center;
    }
    .s-header--sticky-always,
    .s-header--sticky-smart,
    .s-header--sticky-shrinking { position: sticky; top: 0; z-index: 40; }
    .s-header--sticky-partial   { position: sticky; top: 0; z-index: 40; }
    .s-header--sticky-floating  { position: fixed; top: 0; left: 0; right: 0; z-index: 40; }
    .s-header__inner {
      width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    }
    .s-header--centered-logo .s-header__inner { justify-content: center; gap: 24px; }
    .s-header__brand { display: flex; align-items: center; gap: 12px; }
    .s-header__actions { display: flex; align-items: center; gap: 14px; }
    .s-header__action {
      background: none; border: none; cursor: pointer; font-size: 18px; color: inherit;
      padding: 4px; transition: opacity 160ms; line-height: 1;
    }
    .s-header__action:hover { opacity: 0.65; }
    .s-header__lang {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    }

    /* \u2500\u2500 Footer section \u2500\u2500 */
    .s-section-foot { border-top: 1px solid var(--line); }
    .s-section-foot__newsletter {
      padding: 48px var(--pad); border-bottom: 1px solid var(--line-soft);
      display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center;
    }
    .s-section-foot__nl-title {
      font-family: var(--serif); font-size: clamp(24px,3vw,40px); letter-spacing: -0.02em; margin: 0;
    }
    .s-section-foot__nl-text {
      font-family: var(--serif); font-style: italic; font-size: 15px; color: var(--fg-soft); margin: 0;
    }
    .s-section-foot__bottom {
      padding: 20px var(--pad); display: flex; flex-wrap: wrap; align-items: center;
      justify-content: space-between; gap: 16px;
    }
    .s-section-foot__copyright {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint);
    }
    .s-section-foot__socials { display: flex; gap: 16px; align-items: center; }
    .s-section-foot__social {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none; transition: color 160ms;
    }
    .s-section-foot__social:hover { color: var(--accent); }
    .s-section-foot__legal { display: flex; gap: 16px; align-items: center; }
    .s-section-foot__legal a {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--fg-faint); text-decoration: none; transition: color 160ms;
    }
    .s-section-foot__legal a:hover { color: var(--fg); }
    .s-section-foot__pay {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-faint);
    }

    /* \u2500\u2500 Newsletter modal \u2500\u2500 */
    .nl-overlay { position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; transition: opacity 360ms ease; }
    .nl-overlay.active { opacity: 1; pointer-events: auto; }
    .nl-modal { background: var(--bg); border: var(--s-border-w) solid var(--line);
      border-radius: var(--s-radius); box-shadow: var(--s-shadow-card);
      padding: 48px; max-width: 460px; width: calc(100% - 40px);
      display: flex; flex-direction: column; gap: 22px; }
    .nl-modal__title { font-family: var(--serif);
      font-size: clamp(28px, 5vw, 52px); letter-spacing: -0.02em; margin: 0; }
    .nl-modal__lede  { font-family: var(--serif); font-style: italic;
      font-size: 17px; color: var(--fg-soft); margin: 0; }
    .nl-form  { display: flex; border: var(--s-border-w) solid var(--line); border-radius: var(--s-radius-btn); overflow: hidden; }
    .nl-input { flex: 1; background: transparent; border: none; outline: none;
      font-family: var(--mono); font-size: 12px; letter-spacing: 0.1em;
      color: var(--fg); padding: 12px 16px; }
    .nl-btn   { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
      text-transform: uppercase; padding: 12px 20px;
      background: var(--fg); color: var(--bg); border: none; cursor: pointer; }
    .nl-close { align-self: flex-end; background: none; border: none;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      text-transform: uppercase; color: var(--fg-faint); cursor: pointer; }

    @media (max-width: 700px) {
      .s-grid { grid-template-columns: 1fr !important; }
      .s-gallery__grid--3, .s-gallery__grid--4 { grid-template-columns: repeat(2, 1fr); }
      .s-foot { flex-direction: column; text-align: center; }
    }
  </style>
</head>
<body>
  ${!hasHeaderSection ? `<nav class="s-bar">
    <div style="display:flex;align-items:center;gap:12px">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" class="s-bar__logo" />` : ""}
      <span class="s-bar__name">${esc(name)}</span>
    </div>
    <a href="/" class="s-bar__back">\u2190 MaxCyberSolutions</a>
  </nav>` : ""}

  ${features.hasDiscountCountdown && !hasHeaderSection ? renderCountdown() : ""}

  ${body}

  ${features.hasNewsletterPopup && !isPreview ? renderNewsletterModal() : ""}

  ${floaters.length || customBtns.length ? `<div class="s-floats">
    ${floaters.map(renderFloatingCta).join("\n")}
    ${customBtns.map((b, i) => renderCustomBtn(b, i)).join("\n")}
  </div>` : ""}

  ${!hasFooterSection ? `<footer class="s-foot">
    <span class="s-foot__brand">Powered by MaxCyberSolutions</span>
    <a href="/" class="s-foot__link">maxcybersolutions.com \u2197</a>
  </footer>` : ""}

  ${features.hasDiscountCountdown && !hasHeaderSection ? countdownScript() : ""}
  ${features.hasNewsletterPopup && !isPreview ? newsletterScript() : ""}
</body>
</html>`;
}
__name(renderStorefront, "renderStorefront");
function renderSection(section, products, config) {
  if (section.hidden)
    return "";
  switch (section.type) {
    case "header":
      return renderHeader(section, config);
    case "hero":
      return renderHero(section, config);
    case "product-grid":
      return renderProductGrid(section, products);
    case "text-banner":
      return renderBanner(section);
    case "image-gallery":
      return renderGallery(section);
    case "rich-text":
      return renderRichText(section);
    case "footer":
      return renderFooter(section, config);
    default:
      return "";
  }
}
__name(renderSection, "renderSection");
function renderHeader(s, config) {
  const theme = config.theme || {};
  const logo = config.logo || "";
  const name = config.name || "";
  const c = s.colors || {};
  const bg = c.bg || theme.bg || "#efeae0";
  const fg = c.fg || theme.fg || "#1c1a16";
  const accent = c.accent || theme.accent || "#e2a14a";
  const annBg = s.announcementBg || "#1c1a16";
  const annColor = s.announcementColor || "#e2a14a";
  const annH = s.announcementHeight || 40;
  let announceBar = "";
  if (s.announcementEnabled) {
    const dismissBtn = s.announcementDismissible ? `<button class="s-announce__dismiss" onclick="this.closest('.s-announce').remove()" aria-label="Dismiss">\u2715</button>` : "";
    const stickyClass = s.announcementSticky ? " s-announce--sticky" : "";
    if (s.countdownEnabled && s.countdownEnd) {
      announceBar = `<div class="s-announce${stickyClass}" id="s-announce"
        style="background:${esc(annBg)};color:${esc(annColor)};min-height:${annH}px">
        <span class="s-announce__label">Limited offer ends in</span>
        <span class="s-announce__time" id="cd-time">--:--:--</span>
        ${dismissBtn}
      </div>`;
    } else {
      announceBar = `<div class="s-announce${stickyClass}" id="s-announce"
        style="background:${esc(annBg)};color:${esc(annColor)};min-height:${annH}px">
        <span>${esc(s.announcementText || "")}</span>
        ${dismissBtn}
      </div>`;
    }
  }
  const sticky = s.sticky || "smart";
  const stickyStyle = s.stickyStyle || "solid";
  const layout = s.layout || "left-aligned";
  let headerBg = esc(bg);
  let extraStyle = `border-bottom:1px solid var(--line-soft);`;
  if (stickyStyle === "transparent") {
    headerBg = "transparent";
  } else if (stickyStyle === "blur") {
    headerBg = `color-mix(in srgb, ${esc(bg)} 88%, transparent)`;
    extraStyle += "backdrop-filter:blur(14px) saturate(120%);";
  }
  const actions = [];
  if (s.showSearch !== false)
    actions.push('<button class="s-header__action" title="Search" aria-label="Search">\u2315</button>');
  if (s.showAccount !== false)
    actions.push('<button class="s-header__action" title="Account" aria-label="Account">\u25CE</button>');
  if (s.showWishlist)
    actions.push('<button class="s-header__action" title="Wishlist" aria-label="Wishlist">\u2661</button>');
  if (s.showCart !== false)
    actions.push('<button class="s-header__action" title="Cart" aria-label="Cart">\u229E</button>');
  if (s.showLanguage !== false)
    actions.push('<span class="s-header__lang">EN</span>');
  if (s.showCurrency)
    actions.push('<span class="s-header__lang">USD</span>');
  const countdownJs = s.countdownEnabled && s.countdownEnd ? `<script>(function(){
  var end=new Date(${JSON.stringify(s.countdownEnd)});
  function tick(){
    var d=end-Date.now();if(d<=0){document.getElementById('cd-time').textContent='00:00:00';return;}
    var h=Math.floor(d/3600000),m=Math.floor(d%3600000/60000),sec=Math.floor(d%60000/1000);
    document.getElementById('cd-time').textContent=[h,m,sec].map(function(n){return String(n).padStart(2,'0');}).join(':');
    setTimeout(tick,1000);
  }tick();
})();<\/script>` : "";
  return `${announceBar}
<header class="s-header s-header--${esc(layout)} s-header--sticky-${esc(sticky)}"
  style="background:${headerBg};color:${esc(fg)};${extraStyle}">
  <div class="s-header__inner">
    <div class="s-header__brand">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}" class="s-bar__logo" />` : ""}
      <span class="s-bar__name">${esc(name)}</span>
    </div>
    <div class="s-header__actions">
      ${actions.join("\n      ")}
    </div>
  </div>
</header>
${countdownJs}`;
}
__name(renderHeader, "renderHeader");
function renderFooter(s, config) {
  const theme = config.theme || {};
  const c = s.colors || {};
  const bg = c.bg || theme.bg || "#efeae0";
  const fg = c.fg || theme.fg || "#1c1a16";
  const accent = c.accent || theme.accent || "#e2a14a";
  const name = config.name || "";
  const nlHtml = s.newsletterEnabled !== false ? `
  <div class="s-section-foot__newsletter" style="background:${esc(bg)};color:${esc(fg)}">
    <h3 class="s-section-foot__nl-title">${esc(s.newsletterTitle || "Stay in the loop.")}</h3>
    ${s.newsletterText ? `<p class="s-section-foot__nl-text">${esc(s.newsletterText)}</p>` : ""}
    <form class="nl-form" onsubmit="event.preventDefault()">
      <input class="nl-input" type="email" placeholder="your@email.com" required />
      <button type="submit" class="nl-btn" style="background:${esc(fg)};color:${esc(bg)}">Subscribe</button>
    </form>
  </div>` : "";
  const socials = [
    s.socialInstagram ? `<a href="${esc(s.socialInstagram)}" class="s-section-foot__social" target="_blank" rel="noopener">Instagram</a>` : "",
    s.socialTiktok ? `<a href="${esc(s.socialTiktok)}"   class="s-section-foot__social" target="_blank" rel="noopener">TikTok</a>` : "",
    s.socialYoutube ? `<a href="${esc(s.socialYoutube)}"  class="s-section-foot__social" target="_blank" rel="noopener">YouTube</a>` : "",
    s.socialFacebook ? `<a href="${esc(s.socialFacebook)}" class="s-section-foot__social" target="_blank" rel="noopener">Facebook</a>` : ""
  ].filter(Boolean);
  const legalLinks = [
    s.privacyUrl ? `<a href="${esc(s.privacyUrl)}">Privacy</a>` : "",
    s.termsUrl ? `<a href="${esc(s.termsUrl)}">Terms</a>` : ""
  ].filter(Boolean);
  const payHtml = s.showPaymentIcons !== false ? `<span class="s-section-foot__pay">VISA &nbsp; MC &nbsp; AMEX &nbsp; PAYPAL</span>` : "";
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const copyright = s.copyrightText || `\xA9 ${year} ${name || "MaxCyberSolutions"}`;
  return `<footer class="s-section-foot" style="background:${esc(bg)};color:${esc(fg)}">
  ${nlHtml}
  <div class="s-section-foot__bottom">
    <span class="s-section-foot__copyright">${esc(copyright)}</span>
    ${socials.length ? `<div class="s-section-foot__socials">${socials.join("")}</div>` : ""}
    ${legalLinks.length ? `<div class="s-section-foot__legal">${legalLinks.join("")}</div>` : ""}
    ${payHtml}
  </div>
</footer>`;
}
__name(renderFooter, "renderFooter");
function renderHero(s, config) {
  const align = s.align || "left";
  const layout = s.layout || "static";
  const cta = s.cta || {};
  const c = s.colors || {};
  const theme = config.theme || {};
  const sectionBg = c.bg || "";
  const titleColor = c.title || "";
  const bodyColor = c.body || "";
  const accentColor = c.accent || theme.accent || "";
  const ctaStyle = accentColor ? `style="background:${esc(accentColor)};border-color:${esc(accentColor)}"` : "";
  const ctaHtml = cta.label && cta.url ? `<a href="${esc(cta.url)}" class="s-hero__cta" ${ctaStyle}>${esc(cta.label)}</a>` : "";
  const overlayVal = typeof s.overlay === "number" ? s.overlay : s.overlay ? 0.48 : 0;
  const sectionStyle = sectionBg ? `style="background:${esc(sectionBg)}"` : "";
  const inner = `
    <p class="s-hero__tag"${bodyColor ? ` style="color:${esc(bodyColor)}"` : ""}>Store &nbsp;/&nbsp; ${esc(config.name || "")}</p>
    <h1 class="s-hero__title"${titleColor ? ` style="color:${esc(titleColor)}"` : ""}>${esc(s.headline || "")}</h1>
    ${s.subline ? `<p class="s-hero__desc"${bodyColor ? ` style="color:${esc(bodyColor)}"` : ""}>${esc(s.subline)}</p>` : ""}
    ${ctaHtml}`;
  const images = Array.isArray(s.images) && s.images.length ? s.images : s.image ? [s.image] : [];
  if (layout === "carousel" && images.length > 1) {
    const slides = images.map(
      (img, i) => `<div class="s-carousel__slide${i === 0 ? " active" : ""}" style="background-image:url('${esc(img)}')"></div>`
    ).join("");
    return `<header class="s-hero s-hero--img s-hero--${esc(align)} s-hero--carousel" id="s-hero" ${sectionStyle}>
  <div class="s-carousel__track">${slides}</div>
  ${overlayVal ? `<div class="s-hero__overlay" style="background:rgba(0,0,0,${overlayVal})"></div>` : ""}
  <div class="s-hero__inner" style="position:relative;z-index:1">${inner}</div>
  ${images.length > 1 ? `<button class="s-carousel__btn s-carousel__btn--prev" onclick="carouselStep(-1)">\u2039</button>
  <button class="s-carousel__btn s-carousel__btn--next" onclick="carouselStep(1)">\u203A</button>` : ""}
</header>
<script>(function(){
  var slides=document.querySelectorAll('.s-carousel__slide'),cur=0;
  window.carouselStep=function(d){slides[cur].classList.remove('active');cur=(cur+d+slides.length)%slides.length;slides[cur].classList.add('active');};
  setInterval(function(){carouselStep(1);},5000);
})();<\/script>`;
  }
  const bgImg = images[0] || "";
  if (bgImg) {
    return `<header class="s-hero s-hero--img s-hero--${esc(align)}" ${sectionStyle}>
  <div class="s-hero__bg" style="background-image:url('${esc(bgImg)}')"></div>
  ${overlayVal ? `<div class="s-hero__overlay" style="background:rgba(0,0,0,${overlayVal})"></div>` : ""}
  <div class="s-hero__inner">${inner}</div>
</header>`;
  }
  return `<header class="s-hero s-hero--${esc(align)}" ${sectionStyle}>
  <div class="s-hero__inner">${inner}</div>
</header>`;
}
__name(renderHero, "renderHero");
function renderProductGrid(s, products) {
  const layout = s.layout || "classic";
  const cols = Math.max(1, parseInt(s.columns) || 3);
  const colsMob = Math.max(1, parseInt(s.colsMobile) || 1);
  const maxProd = parseInt(s.maxProducts) || 0;
  const c = s.colors || {};
  const secStyle = [
    c.bg ? `background:${esc(c.bg)}` : "",
    c.fg ? `color:${esc(c.fg)}` : ""
  ].filter(Boolean).join(";");
  const titleStyle = c.title ? ` style="color:${esc(c.title)}"` : "";
  const tagStyle = c.body ? ` style="color:${esc(c.body)}"` : "";
  let filtered = s.showOutOfStock === false ? products.filter((p) => p.in_stock) : products;
  if (Array.isArray(s.selectedProducts) && s.selectedProducts.length > 0) {
    const ids = new Set(s.selectedProducts.map(String));
    filtered = filtered.filter((p) => ids.has(String(p.id)));
  }
  const cardOpts = {
    showImage: s.cardShowImage !== false,
    showBadge: s.cardShowBadge !== false,
    showTitle: s.cardShowTitle !== false,
    showDescription: s.cardShowDescription !== false,
    showCategory: s.cardShowCategory === true,
    showPrice: s.cardShowPrice !== false,
    showRating: s.cardShowRating === true,
    showCTA: s.cardShowCTA !== false,
    imgRatio: (s.imgRatio || "4/3").replace(":", "/"),
    hoverEffect: s.hoverEffect || "none"
  };
  const gridCols = layout === "list" ? "1fr" : `repeat(${cols}, 1fr)`;
  const showFilters = !!s.showFilters;
  const showSort = !!s.showSort;
  const gridId = `sg-${Math.random().toString(36).slice(2, 7)}`;
  const allTags = showFilters ? [...new Set(filtered.flatMap((p) => (p.category || "").split(",").map((t) => t.trim()).filter(Boolean)))] : [];
  const toolbar = showFilters || showSort ? `
  <div class="s-grid-toolbar" id="${gridId}-tb">
    ${showFilters ? `<div class="s-grid-filters">
      <button class="s-filter-btn s-filter-btn--active" data-filter="all" onclick="sgStockFilter('${gridId}','all',this)">All</button>
      <button class="s-filter-btn" data-filter="instock" onclick="sgStockFilter('${gridId}','instock',this)">In stock</button>
      ${allTags.map((tag) => `<button class="s-filter-btn s-filter-btn--tag" data-tag="${esc(tag)}" onclick="sgTagToggle('${gridId}',${JSON.stringify(tag)},this)">${esc(tag)}</button>`).join("")}
    </div>` : ""}
    ${showSort ? `<select class="s-sort-select" onchange="sgSort('${gridId}',this.value)">
      <option value="">Sort by\u2026</option>
      <option value="price-asc">Price: Low \u2192 High</option>
      <option value="price-desc">Price: High \u2192 Low</option>
      <option value="name-asc">Name: A \u2192 Z</option>
      <option value="name-desc">Name: Z \u2192 A</option>
    </select>` : ""}
  </div>` : "";
  const gridScript = showFilters || showSort ? `<script>
(function(){
  var _stock='all', _tags=new Set();
  function _apply(id){
    document.querySelectorAll('#'+id+' article.s-card').forEach(function(c){
      var stockOk = _stock==='all' || (_stock==='instock' && c.dataset.instock==='1');
      var cardTags = c.dataset.tags ? c.dataset.tags.split(',').map(function(t){return t.trim();}) : [];
      var tagOk = _tags.size===0 || cardTags.some(function(t){return _tags.has(t);});
      c.style.display = (stockOk && tagOk) ? '' : 'none';
    });
  }
  function sgStockFilter(id,f,btn){
    _stock=f;
    document.querySelectorAll('#'+id+' .s-filter-btn:not(.s-filter-btn--tag)').forEach(function(b){b.classList.remove('s-filter-btn--active');});
    btn.classList.add('s-filter-btn--active');
    _apply(id);
  }
  function sgTagToggle(id,tag,btn){
    if(_tags.has(tag)){_tags.delete(tag);btn.classList.remove('s-filter-btn--active');}
    else{_tags.add(tag);btn.classList.add('s-filter-btn--active');}
    _apply(id);
  }
  function sgSort(id,val){
    var grid=document.querySelector('#'+id+' .s-grid');
    if(!grid||!val)return;
    var cards=[].slice.call(grid.querySelectorAll('article.s-card'));
    cards.sort(function(a,b){
      if(val==='price-asc')  return parseFloat(a.dataset.price)-parseFloat(b.dataset.price);
      if(val==='price-desc') return parseFloat(b.dataset.price)-parseFloat(a.dataset.price);
      if(val==='name-asc')   return a.dataset.name.localeCompare(b.dataset.name);
      if(val==='name-desc')  return b.dataset.name.localeCompare(a.dataset.name);
      return 0;
    });
    cards.forEach(function(c){grid.appendChild(c);});
  }
  window.sgStockFilter=sgStockFilter; window.sgTagToggle=sgTagToggle; window.sgSort=sgSort;
})();
<\/script>` : "";
  return `<section class="s-products" id="${gridId}"${secStyle ? ` style="${secStyle}"` : ""}>
  <a name="products" style="display:block;height:0;overflow:hidden"></a>
  <div class="s-products__head">
    ${s.tag ? `<p class="s-products__tag"${tagStyle}>${esc(s.tag)}</p>` : ""}
    ${s.title ? `<h2 class="s-products__title"${titleStyle}>${esc(s.title)}</h2>` : ""}
  </div>
  ${toolbar}
  ${filtered.length ? `<div class="s-grid s-grid--${esc(layout)}" style="grid-template-columns:${gridCols}">
        ${filtered.map((p) => renderCard(p, cardOpts)).join("")}
       </div>` : `<div class="s-empty"><p class="s-empty__text">No products yet &mdash; check back soon.</p></div>`}
  ${gridScript}
</section>`;
}
__name(renderProductGrid, "renderProductGrid");
function renderBanner(s) {
  const c = s.colors || {};
  const bg = c.bg || s.bg || "#1c1a16";
  const color = c.fg || s.color || "#e2a14a";
  const align = s.align || "center";
  const layout = s.layout || "single";
  const stickyClass = s.sticky ? " s-banner--sticky" : " s-banner--relative";
  const dismissBtn = s.dismissible ? `<button class="s-banner--dismiss-btn" onclick="this.closest('.s-banner').remove()" aria-label="Dismiss">\u2715</button>` : "";
  const ctaHtml = s.ctaLabel && s.ctaUrl ? `<a href="${esc(s.ctaUrl)}" class="s-banner__cta">${esc(s.ctaLabel)}</a>` : "";
  if (layout === "marquee") {
    const txt = esc(s.text || "");
    const repeated = Array(8).fill(`<span>${txt}</span>`).join("");
    return `<div class="s-banner s-banner--marquee${stickyClass}" style="background:${esc(bg)};color:${esc(color)};position:relative">
  <div class="s-banner__marquee">${repeated}${repeated}</div>
  ${dismissBtn}
</div>`;
  }
  return `<div class="s-banner s-banner--${esc(align)}${stickyClass}" style="background:${esc(bg)};color:${esc(color)};position:relative">
  <span class="s-banner__text">${esc(s.text || "")}</span>
  ${s.subtitle ? `<span class="s-banner__sub">${esc(s.subtitle)}</span>` : ""}
  ${ctaHtml}
  ${dismissBtn}
</div>`;
}
__name(renderBanner, "renderBanner");
function renderGallery(s) {
  const images = Array.isArray(s.images) ? s.images : [];
  const layout = s.layout || "classic";
  const cols = Math.max(1, parseInt(s.columns) || 3);
  const ratio = (s.ratio || "1/1").replace(":", "/");
  const hoverEffect = s.hoverEffect || "none";
  const c = s.colors || {};
  const bg = c.bg || s.bg || "";
  const fg = c.fg || s.color || "";
  const secStyle = [
    bg ? `background:${esc(bg)}` : "",
    fg ? `color:${esc(fg)}` : ""
  ].filter(Boolean).join(";");
  const hoverClass = hoverEffect && hoverEffect !== "none" ? ` s-gallery__item--${esc(hoverEffect)}` : "";
  const gridCols = layout === "list" ? "1fr" : `repeat(${cols}, 1fr)`;
  return `<section class="s-gallery s-gallery--${esc(layout)}"${secStyle ? ` style="${secStyle}"` : ""}>
  ${s.title ? `<h2 class="s-gallery__title">${esc(s.title)}</h2>` : ""}
  <div class="s-gallery__grid" style="grid-template-columns:${gridCols}">
    ${images.map((img) => {
    const url = typeof img === "string" ? img : img.url || "";
    const caption = typeof img === "object" ? img.caption || "" : "";
    return `<div class="s-gallery__item${hoverClass}">
      <img src="${esc(url)}" alt="${esc(caption)}" loading="lazy" style="aspect-ratio:${esc(ratio)};object-fit:cover;width:100%;display:block" />
      ${caption ? `<span class="s-gallery__caption">${esc(caption)}</span>` : ""}
    </div>`;
  }).join("")}
  </div>
</section>`;
}
__name(renderGallery, "renderGallery");
function renderRichText(s) {
  const align = s.align || "left";
  const maxWidth = s.maxWidth || "normal";
  const padding = s.padding || "normal";
  const c = s.colors || {};
  const bg = c.bg || s.bgColor || "";
  const fg = c.fg || "";
  const secStyle = [
    bg ? `background:${esc(bg)}` : "",
    fg ? `color:${esc(fg)}` : ""
  ].filter(Boolean).join(";");
  const ctaHtml = s.ctaLabel && s.ctaUrl ? `<a href="${esc(s.ctaUrl)}" class="s-rich__cta">${esc(s.ctaLabel)}</a>` : "";
  const paddingClass = padding === "sm" ? " s-rich--sm" : padding === "lg" ? " s-rich--lg" : "";
  const hasStructured = s.heading || s.subheading || s.body;
  const inner = hasStructured ? `${s.heading ? `<h2 class="s-rich__heading">${esc(s.heading)}</h2>` : ""}
    ${s.subheading ? `<p class="s-rich__subheading">${esc(s.subheading)}</p>` : ""}
    ${s.body ? `<p class="s-rich__body">${esc(s.body)}</p>` : ""}
    ${ctaHtml}` : s.content || "";
  return `<section class="s-rich s-rich--${esc(align)} s-rich--${esc(maxWidth)}${paddingClass}"${secStyle ? ` style="${secStyle}"` : ""}>
  <div class="s-rich__inner">${inner}</div>
</section>`;
}
__name(renderRichText, "renderRichText");
function renderFloatingCta(s) {
  const ICONS = { whatsapp: "\u{1F4AC}", phone: "\u{1F4DE}", email: "\u2709\uFE0F", link: "\u2197" };
  const icon = ICONS[s.icon] || "\u2197";
  const pos = s.position || "bottom-right";
  const color = s.color || "#25D366";
  return `<a href="${esc(s.url || "#")}" class="s-float s-float--${esc(pos)}"
  style="background:${esc(color)}" target="_blank" rel="noopener noreferrer">
  <span class="s-float__icon">${icon}</span>
  ${s.label ? `<span>${esc(s.label)}</span>` : ""}
</a>`;
}
__name(renderFloatingCta, "renderFloatingCta");
function renderCustomBtn(b, i) {
  const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];
  const pos = POSITIONS[i % POSITIONS.length];
  const style = b.sticky ? "position:fixed" : "";
  const color = b.color || "var(--accent)";
  return `<a href="${esc(b.url)}" class="s-float s-float--${esc(pos)}"
  style="background:${esc(color)};${style}" target="_blank" rel="noopener noreferrer">
  ${b.image ? `<img src="${esc(b.image)}" style="width:20px;height:20px;object-fit:contain" alt="" />` : ""}
  ${b.text ? `<span>${esc(b.text)}</span>` : ""}
</a>`;
}
__name(renderCustomBtn, "renderCustomBtn");
function renderCard(p, opts = {}) {
  const {
    showImage = true,
    showBadge = true,
    showTitle = true,
    showDescription = true,
    showCategory = false,
    showPrice = true,
    showRating = false,
    showCTA = true,
    imgRatio = "4/3",
    hoverEffect = "none"
  } = opts;
  const dollars = (p.price_cents / 100).toFixed(2);
  let meta = {};
  try {
    meta = JSON.parse(p.metadata || "{}");
  } catch {
  }
  const badges = Object.entries(meta).map(([k, v]) => `<span class="s-card__badge">${esc(k)}: ${esc(String(v))}</span>`).join("");
  const hasImg = !!p.image && showImage;
  const hoverClass = hoverEffect && hoverEffect !== "none" ? ` s-card--${esc(hoverEffect)}` : "";
  return `<article class="s-card${hasImg ? "" : " s-card--noimg"}${hoverClass}"
  data-price="${p.price_cents / 100}" data-name="${esc(p.name)}" data-instock="${p.in_stock ? 1 : 0}" data-tags="${esc(p.category || "")}">
  ${hasImg ? `<div class="s-card__img" style="background-image:url('${esc(p.image)}');aspect-ratio:${esc(imgRatio)}"></div>` : ""}
  <div class="s-card__body">
    <div class="s-card__sku">SKU ${esc(p.sku)}</div>
    ${showCategory && p.category ? `<div class="s-card__cat">${esc(p.category)}</div>` : ""}
    ${showTitle ? `<h3 class="s-card__name">${esc(p.name)}</h3>` : ""}
    ${showDescription && p.description ? `<p class="s-card__desc">${esc(p.description)}</p>` : ""}
    ${showPrice ? `<div class="s-card__price">$${esc(dollars)}</div>` : ""}
    ${showRating ? `<div class="s-card__rating">\u2605\u2605\u2605\u2605\u2606</div>` : ""}
    ${showBadge ? `<div class="s-card__badges">
      ${!p.in_stock ? '<span class="s-card__badge s-card__badge--oos">Out of stock</span>' : ""}
      ${badges}
    </div>` : ""}
    ${showCTA ? `<button class="s-card__cta">Inquire</button>` : ""}
  </div>
</article>`;
}
__name(renderCard, "renderCard");
function renderLegacyBody(store, config, products) {
  const name = config.name || store.name || store.slug;
  const seo = config.seo || {};
  return `
<header class="s-hero">
  <div class="s-hero__inner">
    <p class="s-hero__tag">Store &nbsp;/&nbsp; ${esc(store.slug)}</p>
    <h1 class="s-hero__title">${esc(name)}</h1>
    ${seo.description ? `<p class="s-hero__desc">${esc(seo.description)}</p>` : ""}
  </div>
</header>
<section class="s-products" id="products">
  <div class="s-products__head">
    <p class="s-products__tag">\xA7 Catalogue</p>
    <h2 class="s-products__title">All <em>products</em>.</h2>
  </div>
  ${products.length ? `<div class="s-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
        ${products.map(renderCard).join("")}
       </div>` : `<div class="s-empty"><p class="s-empty__text">No products yet &mdash; check back soon.</p></div>`}
</section>`;
}
__name(renderLegacyBody, "renderLegacyBody");
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
  var end=new Date(); end.setHours(end.getHours()+24,0,0,0);
  function tick(){
    var d=end-Date.now(); if(d<=0){document.getElementById('cd-time').textContent='00:00:00';return;}
    var h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000);
    document.getElementById('cd-time').textContent=[h,m,s].map(function(n){return String(n).padStart(2,'0');}).join(':');
    setTimeout(tick,1000);
  } tick();
})();
<\/script>`;
}
__name(countdownScript, "countdownScript");
function renderNewsletterModal() {
  return `<div class="nl-overlay" id="nl-overlay" role="dialog" aria-modal="true">
  <div class="nl-modal">
    <button class="nl-close" id="nl-close">Close \u2715</button>
    <h2 class="nl-modal__title">Stay in the loop.</h2>
    <p class="nl-modal__lede">New arrivals, exclusive drops. No noise.</p>
    <form class="nl-form" id="nl-form">
      <input class="nl-input" type="email" placeholder="your@email.com" required />
      <button type="submit" class="nl-btn">Subscribe</button>
    </form>
  </div>
</div>`;
}
__name(renderNewsletterModal, "renderNewsletterModal");
function newsletterScript() {
  return `<script>
(function(){
  var o=document.getElementById('nl-overlay'),c=document.getElementById('nl-close'),f=document.getElementById('nl-form');
  setTimeout(function(){o.classList.add('active');},3500);
  c.addEventListener('click',function(){o.classList.remove('active');});
  o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('active');});
  f.addEventListener('submit',function(e){e.preventDefault();o.classList.remove('active');});
})();
<\/script>`;
}
__name(newsletterScript, "newsletterScript");

// dashboard/[[path]].js
var HTML = `<!DOCTYPE html>
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

    /* \u2500\u2500 Buttons \u2500\u2500 */
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

    /* \u2500\u2500 Top bar \u2500\u2500 */
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

    /* \u2500\u2500 Screens \u2500\u2500 */
    .screen { display: none; padding-top: var(--bar-h); }
    .screen.active { display: block; }
    #screen-editor { padding-top: 0; }

    /* \u2500\u2500 Login \u2500\u2500 */
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

    /* \u2500\u2500 Stores screen \u2500\u2500 */
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

    /* \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 EDITOR LAYOUT \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 */
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

    /* \u2500\u2500 Items tab \u2500\u2500 */
    .items-pane { padding: 0; display: flex; flex-direction: column; gap: 0; }
    .items-toolbar { padding: 8px 12px; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
    .items-toolbar__row { display: flex; gap: 6px; align-items: center; }
    .items-search { flex: 1; padding: 6px 10px; font-size: 12px; }
    .items-actions { padding: 8px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; display: flex; flex-wrap: wrap; gap: 6px; }
    .items-list { flex: 1; overflow-y: auto; }

    /* Item rows \u2014 bigger buttons */
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

    /* Right panel \u2014 preview */
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

    /* \u2500\u2500 Config tab \u2500\u2500 */
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

    /* Advanced tweaks \u2014 toggleable */
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

    /* \u2500\u2500 Product modal \u2500\u2500 */
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

    /* \u2500\u2500 Gallery modals (template + style) \u2500\u2500 */
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

  <!-- \u2500\u2500 Top bar \u2500\u2500 -->
  <div class="d-bar" id="d-bar" style="display:none">
    <div class="d-bar__brand">
      <img src="/img/icon.webp" alt="" />
      MaxCyberSolutions
    </div>
    <span class="d-bar__sep" id="d-bar-sep" style="display:none">\u203A</span>
    <span class="d-bar__store" id="d-bar-store"></span>
    <span class="d-bar__dirty"  id="d-bar-dirty"></span>
    <div class="d-bar__history" id="d-bar-history" style="display:none">
      <button class="btn-icon" id="btn-undo" title="Undo (Ctrl+Z)" disabled>\u21A9</button>
      <button class="btn-icon" id="btn-redo" title="Redo (Ctrl+Y)" disabled>\u21AA</button>
    </div>
    <div class="d-bar__actions" id="d-bar-actions" style="display:none">
      <button class="btn-ghost btn-sm" id="btn-discard">Discard</button>
      <button class="btn-ghost btn-sm" id="btn-save-draft">Save Draft</button>
      <button class="btn-ghost btn-sm" id="btn-export">Export \u2193</button>
      <button class="btn-ghost btn-sm" id="btn-import">Import \u2191</button>
      <input type="file" id="import-file" accept=".json" style="display:none" />
    </div>
    <div class="d-bar__right">
      <button class="btn-push" id="btn-push-live" style="display:none">\u{1F680} Push Live</button>
      <span class="d-bar__email" id="d-email"></span>
      <button class="d-bar__logout" id="d-logout">Sign out</button>
    </div>
  </div>

  <!-- \u2500\u2500 Login \u2500\u2500 -->
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
          <button type="submit" class="login-submit" id="login-submit">Sign in \u2192</button>
          <p class="login-msg" id="login-msg"></p>
        </form>
      </div>
    </div>
  </div>

  <!-- \u2500\u2500 Stores \u2500\u2500 -->
  <div class="screen" id="screen-stores">
    <div class="d-content">
      <div class="sec-head">
        <p class="sec-head__tag">\xA7 Stores</p>
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
          <button class="btn-solid" id="ns-submit">Create store \u2192</button>
          <p class="status-msg" id="ns-msg"></p>
        </div>
      </div>
    </div>
  </div>

  <!-- \u2500\u2500 Editor (split pane) \u2500\u2500 -->
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
              <button class="btn-ghost btn-sm" id="btn-change-tmpl" style="width:100%">\u229E Change Template</button>
              <button class="btn-ghost btn-sm" id="btn-change-style" style="width:100%">\u25C8 Change Style</button>
              <button class="btn-ghost btn-sm" id="btn-change-palette" style="width:100%">\u2B21 Colour Palette</button>
            </div>

            <!-- Logo -->
            <div class="pane-section">
              <span class="pane-section__label">Logo</span>
              <div class="logo-field">
                <div id="logo-preview-wrap">
                  <div class="logo-placeholder">\u2630</div>
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
                    <optgroup label="\u2500\u2500 Serif \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Sans-Serif \u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Monospace \u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Display \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
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
                    <optgroup label="\u2500\u2500 Serif \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Sans-Serif \u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Monospace \u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Display \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
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
                    <optgroup label="\u2500\u2500 Serif \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Sans-Serif \u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Monospace \u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Display \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
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
                    <optgroup label="\u2500\u2500 Serif \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>Cormorant Garamond</option>
                      <option>Playfair Display</option>
                      <option>EB Garamond</option>
                      <option>Libre Baskerville</option>
                      <option>Merriweather</option>
                      <option>Lora</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Sans-Serif \u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>DM Sans</option>
                      <option>Inter</option>
                      <option>Nunito</option>
                      <option>Poppins</option>
                      <option>Raleway</option>
                      <option>Outfit</option>
                      <option>Barlow</option>
                      <option>Josefin Sans</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Monospace \u2500\u2500\u2500\u2500\u2500\u2500\u2500">
                      <option>JetBrains Mono</option>
                      <option>IBM Plex Mono</option>
                      <option>Space Mono</option>
                    </optgroup>
                    <optgroup label="\u2500\u2500 Display \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500">
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
              <button class="btn-solid btn-sm" id="sec-add-trigger" style="width:100%">+ Add Section \u25BE</button>
              <div class="sec-add-menu" id="sec-add-menu" style="display:none"></div>
            </div>
            <div class="sec-editor" id="sec-editor" style="display:none">
              <div class="sec-editor__head">
                <span class="sec-editor__title" id="sec-editor-title"></span>
                <button class="sec-editor__close" id="sec-editor-close">\u2715 close</button>
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
                <input class="items-search" id="items-search" type="search" placeholder="Search by name or SKU\u2026" />
                <select id="items-sort" style="width:auto;padding:6px 8px;font-size:11px">
                  <option value="date">Date \u2193</option>
                  <option value="name">Name A\u2013Z</option>
                  <option value="price-asc">Price \u2191</option>
                  <option value="price-desc">Price \u2193</option>
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
              <button class="btn-ghost btn-sm" id="btn-dl-template">Template \u2193</button>
              <button class="btn-ghost btn-sm" id="btn-export-csv">CSV \u2193</button>
              <button class="btn-ghost btn-sm" id="btn-export-json-items">JSON \u2193</button>
              <button class="btn-ghost btn-sm" id="btn-import-items">Import \u2191</button>
              <input type="file" id="import-items-file" accept=".csv,.json" style="display:none" />
            </div>

            <div class="bulk-bar" id="bulk-bar">
              <span class="bulk-bar__count" id="bulk-count">0 selected</span>
              <input type="text" id="bulk-tag-input" placeholder="Set tags\u2026" style="flex:1;padding:5px 8px;font-size:11px;width:auto" />
              <input type="number" id="bulk-price-input" placeholder="Price ($)" min="0" step="0.01" />
              <select id="bulk-vis-input" title="Set visibility">
                <option value="">Visibility\u2026</option>
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
                <button class="btn-ghost btn-sm" id="btn-fetch-items">\u21BB Re-fetch</button>
                <button class="btn-ghost btn-sm" id="btn-check-links">\u{1F517} Check Links</button>
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
                  <option value="es">Espa\xF1ol</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Portugu\xEAs</option>
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
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">\u203A</span>
                  </div>
                </div>
                <div class="adv-tweak__body">
                  <div class="form-field">
                    <label for="nl-title">Popup title</label>
                    <input id="nl-title" type="text" placeholder="Stay in the loop." />
                  </div>
                  <div class="form-field">
                    <label for="nl-text">Popup text</label>
                    <textarea id="nl-text" rows="2" placeholder="New arrivals, exclusive drops\u2026"></textarea>
                  </div>
                  <div class="form-field">
                    <label for="nl-image">Image URL (optional)</label>
                    <input id="nl-image" type="text" placeholder="https://\u2026" />
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
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">\u203A</span>
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
                    <span class="adv-tweak__arrow" onclick="this.closest('.adv-tweak').classList.toggle('open')">\u203A</span>
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
            <button class="btn-ghost btn-sm" id="btn-preview-refresh">\u21BB Refresh</button>
            <a class="btn-ghost btn-sm" id="btn-preview-open" target="_blank" rel="noopener">\u2197 Open</a>
          </div>
        </div>
        <div class="preview-frame-wrap" id="preview-frame-wrap">
          <iframe class="editor-iframe" id="preview-iframe" src="about:blank" title="Store preview"></iframe>
        </div>
      </div>
    </div>
  </div>

  <!-- \u2500\u2500 Product / item modal \u2500\u2500 -->
  <div class="modal-overlay" id="product-modal">
    <div class="modal-box">
      <div class="modal-box__head">
        <h3 class="modal-box__title" id="pm-title">New item</h3>
        <button class="modal-close" id="pm-close">Close \u2715</button>
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
            <input id="pm-tags" type="text" placeholder="web, design, featured\u2026" />
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
            <span style="font-size:11px;color:var(--fg-faint)">\u25BE</span>
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
                <button type="button" class="badge-opt" data-badge="custom">Custom\u2026</button>
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
              <div class="img-placeholder" id="pm-img-placeholder">\u{1F5BC}</div>
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
            <span style="font-size:11px;color:var(--fg-faint)">\u25BE</span>
          </div>
          <div class="modal-section__body" style="display:none">
            <p style="font-size:11px;color:var(--fg-faint);margin:0">Variations use SKU = base-SKU + V1, V2\u2026 Base SKU must not end in V+number.</p>
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

  <!-- \u2500\u2500 Template gallery \u2500\u2500 -->
  <div class="modal-overlay-lg" id="tmpl-overlay">
    <div class="gallery-box">
      <div class="gallery-box__head">
        <h2 class="gallery-box__title">Choose a Template</h2>
        <button class="modal-close" id="tmpl-close">Close \u2715</button>
      </div>
      <p class="gallery-box__sub">Selecting a template replaces your current sections. Products and identity are kept.</p>
      <div class="gallery-grid" id="tmpl-grid"></div>
    </div>
  </div>

  <!-- \u2500\u2500 Style gallery (shapes/borders/shadows) \u2500\u2500 -->
  <div class="modal-overlay-lg" id="style-overlay">
    <div class="gallery-box">
      <div class="gallery-box__head">
        <h2 class="gallery-box__title">Change Style</h2>
        <button class="modal-close" id="style-close">Close \u2715</button>
      </div>
      <p class="gallery-box__sub">Style controls the rounding, border thickness, and shadow depth of your storefront \u2014 not colours.</p>
      <div class="gallery-grid" id="style-grid"></div>
    </div>
  </div>

  <!-- \u2500\u2500 Colour palette gallery \u2500\u2500 -->
  <div class="modal-overlay-lg" id="palette-overlay">
    <div class="gallery-box">
      <div class="gallery-box__head">
        <h2 class="gallery-box__title">Colour Palette</h2>
        <button class="modal-close" id="palette-close">Close \u2715</button>
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
        <button class="btn-ghost btn-sm" onclick="closeProductPicker()">\u2715</button>
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

  <script src="/js/dashboard.js"><\/script>
</body>
</html>`;
async function onRequestGet8() {
  return new Response(HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
}
__name(onRequestGet8, "onRequestGet");

// dashboard.js
async function onRequestGet9() {
  return Response.redirect("/dashboard/", 301);
}
__name(onRequestGet9, "onRequestGet");

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

// ../.wrangler/tmp/pages-jchQPs/functionsRoutes-0.38103867356730103.mjs
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
    routePath: "/api/assets/:path*",
    mountPath: "/api/assets",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/me",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/products",
    mountPath: "/api/products",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
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
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/stores",
    mountPath: "/api/stores",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/upload",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/store/:slug",
    mountPath: "/store",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/dashboard/:path*",
    mountPath: "/dashboard",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/dashboard",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
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

// ../.wrangler/tmp/bundle-8xSi7Q/middleware-insertion-facade.js
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

// ../.wrangler/tmp/bundle-8xSi7Q/middleware-loader.entry.ts
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
//# sourceMappingURL=functionsWorker-0.11009938421599075.mjs.map
