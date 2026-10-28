// Sprawdza, czy po testach w bazie nie zostały dane testowe z prefiksem `e2e_`
// (użytkownicy, produkty, zamówienia). Kryterium "gotowe" nr 3 ćwiczenia 2A.
// Użycie: pnpm seed:check [prefix]   (domyślnie `e2e_`)
import { openDb, ensureSchema, all } from '@demo/app-kit/db';

const prefix = process.argv[2] ?? 'e2e_';
const db = openDb();
ensureSchema(db);
const like = prefix + '%';
const leftovers = {
  users: all(db, 'SELECT login AS name FROM users WHERE login LIKE ?', [like]),
  products: all(db, 'SELECT name FROM products WHERE name LIKE ?', [like]),
  orders: all(db, 'SELECT number AS name FROM orders WHERE number LIKE ?', [like]),
};
db.close();

let total = 0;
for (const [table, rows] of Object.entries(leftovers)) {
  total += rows.length;
  if (rows.length) console.log(`${table}: ${rows.length} rekordów z prefiksem "${prefix}"`, rows.slice(0, 5).map((r) => r.name).join(', '), rows.length > 5 ? '...' : '');
}
if (total === 0) {
  console.log(`OK: brak rekordów z prefiksem "${prefix}".`);
} else {
  console.error(`BŁĄD: ${total} rekordów testowych zostało w bazie. Sprzątanie w teardown nie zadziałało.`);
  process.exit(1);
}
