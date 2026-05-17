# Technical Specification: Multi-Tenant Edge Commerce Platform
**Core Infrastructure:** Cloudflare Pages + D1 (SQLite) + R2 (Object Storage)
**Routing Paradigm:** Dynamic Edge SSR (Server-Side Rendering)

---

## 1. System Architecture
This platform utilizes a **Shared-Code, Shared-Database** multi-tenant architecture. Tenants are logically isolated via foreign key constraints at the database layer rather than physical infrastructure separation.

### Infrastructure Layers:
*   **Compute:** [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/) (V8 Isolates). Executes logic at the edge with 0ms cold starts.
*   **Persistence:** [Cloudflare D1](https://developers.cloudflare.com/d1/). A distributed SQL database (SQLite) providing strong consistency for relational data.
*   **Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/). S3-compatible object storage for immutable assets (product images, brand logos).
*   **Caching:** [Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/). Programmatic control over edge caching to minimize database hits for high-traffic storefronts.

---

## 2. URL Strategy & Routing
Standardized routing ensures clean separation between administrative logic and public-facing storefronts.

| Context | URL Pattern | Responsibility |
| :--- | :--- | :--- |
| **SaaS Landing** | `MaxCyberSolutions.com/` | Marketing, Pricing, and Onboarding. |
| **Public Store** | `MaxCyberSolutions.com/store/[slug]` | Tenant-specific storefront (e.g., `/store/yosoyeva`). |
| **Admin Panel** | `MaxCyberSolutions.com/dashboard/*` | Universal authenticated portal for all tenants. |
| **API Layer** | `MaxCyberSolutions.com/api/*` | Backend endpoints for CRUD operations and integrations. |

---

## 3. Data Modeling (Relational Schema)
Relational integrity is enforced using Foreign Keys. Every tenant's data is scoped to a `store_id`.

### Table: `stores`
Stores the "DNA" of each tenant.
*   `id`: UUID (Primary Key)
*   `slug`: UNIQUE VARCHAR (e.g., "yosoyeva")
*   `owner_id`: UUID (Relation to Auth provider)
*   `config`: JSON (Stores theme colors, typography, SEO metadata)

### Table: `products`
*   `id`: UUID (Primary Key)
*   `store_id`: UUID (Foreign Key -> stores.id)
*   `sku`: VARCHAR (Tenant-defined Stock Keeping Unit)
*   `price_cents`: INTEGER (Stored in cents to avoid floating-point errors)
*   `metadata`: JSON (Dynamic attributes: size, color, material)

---

## 4. Multi-Tenant Isolation Logic (The "Gold Standard")
To prevent **Data Leaks** (Client A seeing Client B's data), we implement **Logical Isolation**:

1.  **Public Storefront:** The `slug` is extracted from the URL and used as the unique identifier for the SQL lookup. 
    *   `SELECT * FROM stores WHERE slug = ?`
2.  **Dashboard CRUD:** Every administrative query MUST be scoped by `owner_id` derived from the session token.
    *   `UPDATE products SET price = ? WHERE id = ? AND store_id IN (SELECT id FROM stores WHERE owner_id = ?)`

---

## 5. Modular Feature Flags (Extensibility)
We avoid branching code for specific clients. Instead, we use **Conditional Feature Injection**.

```typescript
// Define the Client Context
interface TenantConfig {
  features: {
    hasInventoryTracking: boolean;
    hasNewsletterPopup: boolean;
    hasDiscountCountdown: boolean;
  };
}

// Modular Component Rendering
const Storefront = ({ config }: { config: TenantConfig }) => (
  <main>
    <Header />
    {config.features.hasDiscountCountdown && <CountdownTimer />}
    <ProductList />
    {config.features.hasNewsletterPopup && <PopupModal />}
  </main>
);
```

---

## 6. Deployment Workflow (CI/CD)
*   **Code Changes:** Pushing to `main` triggers a global Cloudflare build. This updates the "Template" and "Admin Logic" for all tenants simultaneously.
*   **Data Changes:** Updates to the D1 Database (via the dashboard) are reflected globally in real-time without a redeploy.
*   **Version Control:** Uses `wrangler` for local development and database migrations (`wrangler d1 migrations apply`).

---

## 7. Performance Benchmarks
*   **TTFB (Time to First Byte):** < 100ms globally via Edge Rendering.
*   **Build Usage:** ~1-2 builds/month for feature updates, 0 builds for client content updates.
*   **Cold Starts:** 0ms (Cloudflare Workers runtime).
