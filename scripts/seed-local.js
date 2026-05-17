#!/usr/bin/env node
/**
 * Seed the local Miniflare D1 database with a demo owner, the "e-commerce"
 * store, and a set of example products.
 *
 * Usage (dev server must already be running in another terminal):
 *   node scripts/seed-local.js
 */

const BASE  = 'http://localhost:8788';
const EMAIL = 'admin@maxcybersolutions.com';
const PASS  = 'demo1234';

async function api(method, path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function seed() {
  console.log('MaxCyberSolutions — local seed\n');

  // ── 1. Register owner (idempotent) ────────────────────────────────────────
  const regRes = await api('POST', '/api/auth/register', { email: EMAIL, password: PASS });
  if (!regRes.ok && regRes.status !== 409) {
    console.error('Register failed:', await regRes.json()); process.exit(1);
  }
  console.log(regRes.status === 409 ? '· Owner already exists' : '✓ Owner registered');

  // ── 2. Login ──────────────────────────────────────────────────────────────
  const loginRes = await api('POST', '/api/auth/login', { email: EMAIL, password: PASS });
  if (!loginRes.ok) { console.error('Login failed'); process.exit(1); }
  const rawCookie = loginRes.headers.get('set-cookie') || '';
  const cookie    = rawCookie.match(/session_id=[^;]+/)?.[0] || '';
  if (!cookie) { console.error('No session cookie returned'); process.exit(1); }
  console.log('✓ Logged in as', EMAIL);

  // ── 3. Create store (idempotent) ──────────────────────────────────────────
  const storeBody = {
    slug: 'e-commerce',
    name: 'E-Commerce',
    config: {
      name: 'E-Commerce',
      seo: {
        title:       'E-Commerce — Digital Goods & Creative Services',
        description: 'A curated selection of digital goods, design work, and creative services.',
      },
      theme:    { accent: '#e2a14a', dark: false },
      features: {
        hasDiscountCountdown: true,
        hasNewsletterPopup:   true,
        hasInventoryTracking: true,
      },
    },
  };

  let store;
  const createRes = await api('POST', '/api/stores', storeBody, cookie);
  if (createRes.ok) {
    store = await createRes.json();
    console.log('✓ Store "e-commerce" created');
  } else if (createRes.status === 409) {
    console.log('· Store "e-commerce" already exists — fetching...');
    const listRes = await api('GET', '/api/stores', null, cookie);
    const stores  = await listRes.json();
    store         = stores.find(s => s.slug === 'e-commerce');
    if (!store) { console.error('Could not find existing store'); process.exit(1); }
  } else {
    console.error('Store creation failed:', await createRes.json()); process.exit(1);
  }

  // ── 4. Add products (idempotent — skips existing SKUs) ───────────────────
  const products = [
    {
      sku: 'WEB-01', name: 'Landing Page',
      description: 'One-page site with custom typography, motion, and mobile-first layout.',
      price_cents: 90000, in_stock: true,
      metadata: { pages: '1', delivery: '2 weeks', revisions: '2 rounds' },
    },
    {
      sku: 'WEB-02', name: 'Full Site',
      description: 'Up to 8 pages, CMS integration, custom front-end, and an SEO pass.',
      price_cents: 280000, in_stock: true,
      metadata: { pages: 'up to 8', delivery: '4 weeks', revisions: '4 rounds' },
    },
    {
      sku: 'WEB-03', name: 'Platform',
      description: 'Full-stack: auth, payments, admin, custom APIs, and a direct line during build.',
      price_cents: 650000, in_stock: true,
      metadata: { delivery: '8 weeks', type: 'Custom quote' },
    },
    {
      sku: 'ILL-01', name: 'Spot Illustration',
      description: 'One key illustration, print-ready and web exports, source files included.',
      price_cents: 22000, in_stock: true,
      metadata: { format: 'PNG + SVG', delivery: '1 week', revisions: '2 rounds' },
    },
    {
      sku: 'ILL-02', name: 'Illustration Series',
      description: 'Coordinated set of 6–10 pieces sharing a single visual language.',
      price_cents: 140000, in_stock: true,
      metadata: { pieces: '6–10', delivery: '3 weeks', revisions: '3 rounds' },
    },
    {
      sku: 'BRAND-01', name: 'Visual Identity System',
      description: 'Logo, wordmark, pattern, iconography, motion, and a full brand guide PDF.',
      price_cents: 380000, in_stock: true,
      metadata: { format: 'PDF + master files', delivery: '6 weeks', updates: '1 year' },
    },
    {
      sku: '3D-01', name: '3D Asset',
      description: 'Single prop or character bust — low or high-poly with PBR textures.',
      price_cents: 28000, in_stock: true,
      metadata: { format: 'FBX / GLB', delivery: '2 weeks', revisions: '2 rounds' },
    },
    {
      sku: '3D-02', name: '3D Asset Pack',
      description: 'Up to 12 coherent assets with a shared material library.',
      price_cents: 180000, in_stock: false,
      metadata: { assets: 'up to 12', format: 'FBX / GLB', delivery: '4 weeks' },
    },
    {
      sku: 'SFX-01', name: 'Voice Session',
      description: 'Studio-quality WAV recording, up to 1 hour, with light post-processing.',
      price_cents: 18000, in_stock: true,
      metadata: { duration: '1 hour', format: 'WAV', turnaround: '48 hours' },
    },
    {
      sku: 'SFX-02', name: 'Full Soundtrack',
      description: 'Original composed score, adaptive game layers, full sound design, stems delivered.',
      price_cents: 340000, in_stock: true,
      metadata: { delivery: '6 weeks', format: 'Stems + Master' },
    },
  ];

  let added = 0, skipped = 0;
  for (const p of products) {
    const res  = await api('POST', '/api/products', { ...p, store_id: store.id }, cookie);
    const body = await res.json();
    if (res.ok) {
      added++;
    } else if (body.error?.includes('SKU already exists')) {
      skipped++;
    } else {
      console.error(`  ✗ Failed to add ${p.sku}:`, body.error);
    }
  }
  console.log(`✓ Products: ${added} added, ${skipped} already existed`);

  console.log('\n─────────────────────────────────────────');
  console.log('Done! Open these URLs in your browser:\n');
  console.log('  Store     →  http://localhost:8788/store/e-commerce');
  console.log('  Dashboard →  http://localhost:8788/dashboard/');
  console.log(`\n  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASS}`);
  console.log('─────────────────────────────────────────\n');
}

seed().catch(err => { console.error(err); process.exit(1); });
