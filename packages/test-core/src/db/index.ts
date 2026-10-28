// Adapter bazy: jeden interfejs dla testów, silnik za nim jest wymienny.
// Testy i fixtures mówią `db.query(...)`, nie `new DatabaseSync(...)`, więc zamiana
// SQLite na MS SQL (albo node:sqlite na better-sqlite3) to zmiana w jednym pliku.
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): T[];
  one<T = Record<string, unknown>>(sql: string, params?: unknown[]): T | undefined;
  exec(sql: string, params?: unknown[]): { changes: number };
  transaction<T>(fn: () => T): T;
  close(): void;
}

export { openDb, dbPath } from './sqlite';
