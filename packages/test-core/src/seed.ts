// Seed w stanie "przed" (ćwiczenie 2A). Wstawia dane o STAŁYCH nazwach do istniejącej
// bazy. Działa przy jednym workerze. Przy czterech workerach dwa procesy resetują
// i modyfikują te same rekordy ("Szampon", "ORD-E2E-1"), więc testy padają.
import type { Db } from './db';

export const FIXED_PRODUCTS = ['Szampon', 'Mydło', 'Pasta do zębów'] as const;
export const FIXED_STOCK = 10;
export const FIXED_USER = { login: 'user', password: 'user123' } as const;
export const FIXED_ADMIN = { login: 'admin', password: 'admin123' } as const;

/** Przywraca produkty bazowe do stanu wyjściowego i czyści koszyk użytkownika testowego. */
export function seedShop(db: Db): void {
  db.transaction(() => {
    for (const name of FIXED_PRODUCTS) {
      db.exec(
        'INSERT INTO products (name, price_cents, stock) VALUES (?, 999, ?) ON CONFLICT(name) DO UPDATE SET stock = excluded.stock',
        [name, FIXED_STOCK],
      );
    }
    db.exec('DELETE FROM cart_items WHERE user_id = (SELECT id FROM users WHERE login = ?)', [FIXED_USER.login]);
  });
}

/** Wstawia dwa zamówienia o stałych numerach dla testów backoffice. */
export function seedOrders(db: Db): void {
  db.transaction(() => {
    db.exec("DELETE FROM orders WHERE number LIKE 'ORD-E2E-%'");
    const user = db.one<{ id: number }>('SELECT id FROM users WHERE login = ?', [FIXED_USER.login])!;
    const product = db.one<{ id: number }>('SELECT id FROM products WHERE name = ?', [FIXED_PRODUCTS[0]])!;
    db.exec("INSERT INTO orders (number, user_id, product_id, qty, status) VALUES ('ORD-E2E-1', ?, ?, 1, 'new')", [user.id, product.id]);
    db.exec("INSERT INTO orders (number, user_id, product_id, qty, status) VALUES ('ORD-E2E-2', ?, ?, 2, 'new')", [user.id, product.id]);
  });
}
