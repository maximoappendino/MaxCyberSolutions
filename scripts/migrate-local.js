#!/usr/bin/env node
/**
 * Apply all SQL migrations in migrations/ to every SQLite file that
 * wrangler/miniflare has created under .wrangler/state/v3/d1/.
 *
 * Wrangler and wrangler pages dev use different hash algorithms to derive the
 * SQLite filename, so `wrangler d1 migrations apply --local` and the dev
 * server often target different files. This script hits every file it finds,
 * keeping each one in sync.
 *
 * Usage:
 *   node scripts/migrate-local.js
 *
 * Requires Node 22+ (uses node:sqlite, an experimental built-in).
 * Run with:   node --experimental-sqlite scripts/migrate-local.js
 * Or add the flag to the npm script (see package.json).
 */

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT     = resolve(import.meta.dirname, '..');
const MIGS_DIR = join(ROOT, 'migrations');
const D1_ROOT  = join(ROOT, '.wrangler', 'state', 'v3', 'd1');

// ── Collect migration files, sorted by filename ────────────────────────────
const migFiles = readdirSync(MIGS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (!migFiles.length) {
  console.log('No migration files found in migrations/');
  process.exit(0);
}

// ── Find all SQLite files wrangler created ─────────────────────────────────
function findSqliteFiles(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSqliteFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.sqlite')) {
      results.push(full);
    }
  }
  return results;
}

const sqliteFiles = findSqliteFiles(D1_ROOT);

if (!sqliteFiles.length) {
  console.log('No SQLite files found under', D1_ROOT);
  console.log('Start the dev server first (`npm run dev`) so miniflare creates the DB files, then run this script.');
  process.exit(1);
}

console.log(`Found ${sqliteFiles.length} SQLite file(s) and ${migFiles.length} migration(s).\n`);

// ── Apply migrations to each DB file ──────────────────────────────────────
for (const dbPath of sqliteFiles) {
  console.log('DB:', dbPath);
  const db = new DatabaseSync(dbPath);

  // Bootstrap the migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS d1_migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT name FROM d1_migrations').all().map(r => r.name)
  );

  let count = 0;
  for (const filename of migFiles) {
    if (applied.has(filename)) {
      console.log(`  · skip  ${filename} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(MIGS_DIR, filename), 'utf8');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO d1_migrations (name) VALUES (?)').run(filename);
      console.log(`  ✓ apply ${filename}`);
      count++;
    } catch (err) {
      console.error(`  ✗ FAILED ${filename}:`, err.message);
      db.close();
      process.exit(1);
    }
  }

  if (!count) console.log('  · nothing new to apply');
  db.close();
  console.log();
}

console.log('Done. Restart the dev server for the changes to take effect.');
