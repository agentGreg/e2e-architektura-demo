// Implementacja adaptera na wbudowanym node:sqlite (Node >= 22.13, bez zależności natywnych).
// Busy timeout przez PRAGMA, nie przez opcję `timeout` konstruktora (ta wymaga Node 22.16,
// a uczestnicy mają 22.14/22.15). WAL: wiele procesów (workerów) na jednym pliku,
// jeden pisarz naraz, pisarz czeka do 5 s zamiast dostać SQLITE_BUSY.
import type * as SqliteTypes from 'node:sqlite';
import path from 'node:path';
import type { Db } from './index';

// Ładujemy moduł przez require, żeby na Node 22/24 wyciszyć jednorazowy ExperimentalWarning
// ("SQLite is an experimental feature") także w procesie głównym Playwrighta.
const sqlite = loadSqliteQuietly();
function loadSqliteQuietly(): typeof SqliteTypes {
  const original = process.emitWarning;
  process.emitWarning = ((warning: unknown, ...rest: unknown[]) => {
    const isSqliteExperimental = String(warning).includes('SQLite') && (rest[0] === 'ExperimentalWarning' || (warning as { name?: string })?.name === 'ExperimentalWarning');
    if (!isSqliteExperimental) (original as Function).call(process, warning, ...rest);
  }) as typeof process.emitWarning;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('node:sqlite');
  } finally {
    process.emitWarning = original;
  }
}

type DatabaseCtor = typeof SqliteTypes.DatabaseSync;
// Node 22/24: DatabaseSync; Node 26: Database (DatabaseSync zostaje jako alias, DEP0210).
const Database: DatabaseCtor = (sqlite as unknown as { Database?: DatabaseCtor }).Database ?? sqlite.DatabaseSync;

export function dbPath(): string {
  return process.env.E2E_DB_PATH
    ? path.resolve(process.env.E2E_DB_PATH)
    : path.resolve(__dirname, '..', '..', '..', '..', 'data', 'shop.db');
}

export function openDb(file = dbPath()): Db {
  const raw = new Database(file);
  raw.exec('PRAGMA journal_mode = WAL');
  raw.exec('PRAGMA busy_timeout = 5000');
  raw.exec('PRAGMA foreign_keys = ON');
  const params = (p: unknown[]) => p as Parameters<SqliteTypes.StatementSync['all']>;
  return {
    query<T>(sql: string, p: unknown[] = []) {
      return raw.prepare(sql).all(...params(p)) as T[];
    },
    one<T>(sql: string, p: unknown[] = []) {
      return raw.prepare(sql).get(...params(p)) as T | undefined;
    },
    exec(sql: string, p: unknown[] = []) {
      const r = raw.prepare(sql).run(...params(p));
      return { changes: Number(r.changes) };
    },
    transaction<T>(fn: () => T): T {
      raw.exec('BEGIN IMMEDIATE');
      try {
        const result = fn();
        raw.exec('COMMIT');
        return result;
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
    close() {
      raw.close();
    },
  };
}
