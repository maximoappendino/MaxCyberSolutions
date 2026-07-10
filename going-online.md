What's already built

  - Auth (login/register/logout with PBKDF2 + D1 sessions)
  - Dashboard SPA at /dashboard
  - Storefront renderer at /{slug}
  - Product/store CRUD API
  - Image upload to R2
  - D1 schema (3 migrations ready)
  - wrangler.toml configured for Cloudflare Pages
  - Landing page at /en/, /es/, /it/

  ---
  Steps to go live

  1. Log in to Cloudflare

  npx wrangler login

  2. Create the D1 database

  npm run db:create
  Copy the database_id it prints → paste it into wrangler.toml replacing
  PASTE_DATABASE_ID_HERE.

  3. Create the R2 bucket

  npx wrangler r2 bucket create maxcybersolutions-assets

  4. Apply migrations to the remote DB

  npm run db:migrate

  5. Deploy

  npm run deploy
  Cloudflare gives you a *.pages.dev URL instantly.

  6. Custom domain

  In the Cloudflare Pages dashboard → Settings → Custom domains → add maxcybersolutions.com.
  Point your DNS there (or it auto-configures if your domain is already on Cloudflare).

  7. Fix the domain in the landing page

  All the maxcybersolutions.com references in en/index.html, es/, it/ are already there — once
  DNS is live they'll just work.

  ---
  How clients get their store

  Flow: Client hires you → you create their account at /dashboard/register → they log in →
  they build their store → their store lives at yourdomain.com/{their-slug}.

  OR you could share the register link and let clients self-onboard. Registration is currently
  open.

  ---
  Two things to decide before going live
  
  1. Open or invite-only registration? Right now anyone who finds /dashboard/register can sign
  up. You may want to lock that down so only your clients get in.
  2. Image uploads — R2 serves files but they need a public URL. Do you want uploaded images
  served from a Cloudflare R2 public domain (free) or your own subdomain like
  assets.maxcybersolutions.com?

  Want to start with step 1 (wrangler login) right now?
