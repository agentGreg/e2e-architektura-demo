// Baza aplikacji demo: SQLite przez wbudowany moduł node:sqlite (Node >= 22.13).
// Jeden plik, wiele procesów (dwie aplikacje + workery Playwright): tryb WAL
// i busy_timeout przez PRAGMA, bo opcja `timeout` konstruktora wymaga Node 22.16.
import * as sqlite from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

// Na Node 22/24 klasa nazywa się DatabaseSync, na 26 Database (DEP0210).
const Database = sqlite.Database ?? sqlite.DatabaseSync;

export const DEFAULT_DB_PATH = path.resolve(import.meta.dirname, '..', '..', '..', 'data', 'shop.db');

export function dbPath() {
  return process.env.E2E_DB_PATH ? path.resolve(process.env.E2E_DB_PATH) : DEFAULT_DB_PATH;
}

export function openDb(file = dbPath()) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  // Najpierw busy_timeout: zmiana journal_mode wymaga wyłącznej blokady, a dwie aplikacje
  // (albo workery) otwierają ten sam plik równocześnie.
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

export function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      login TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'admin'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      price_cents INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      qty INTEGER NOT NULL DEFAULT 1,
      UNIQUE (user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY,
      number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      qty INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  // Dane bazowe: istnieją "od zawsze", jak w realnej bazie testowej.
  db.exec(`
    INSERT OR IGNORE INTO users (login, password, role) VALUES
      ('admin', 'admin123', 'admin'),
      ('user', 'user123', 'user');
    INSERT OR IGNORE INTO products (name, price_cents, stock) VALUES
      ('Szampon', 1299, 10),
      ('Mydło', 499, 10),
      ('Pasta do zębów', 899, 10);
    INSERT OR IGNORE INTO settings (key, value) VALUES ('maintenance', '0');
  `);
}

export function all(db, sql, params = []) {
  return db.prepare(sql).all(...params);
}
export function get(db, sql, params = []) {
  return db.prepare(sql).get(...params);
}
export function run(db, sql, params = []) {
  return db.prepare(sql).run(...params);
}
