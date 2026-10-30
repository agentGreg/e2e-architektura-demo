// Seed z izolacją (rozwiązanie 2A). Dane per worker z prefiksem `e2e_<run>_s<shard>_w<workerIndex>_`,
// idempotentne (upsert po nazwie), sprzątane po prefiksie. Ten sam wzorzec działa na
// dowolnym silniku: INSERT ... ON CONFLICT po stronie aplikacji, DELETE ... WHERE name LIKE 'e2e_<run>_%'.
import crypto from 'node:crypto';
import type { ShopApi, Product, User } from './api-client';

// Konta bazowe istnieją "od zawsze" w bazie testowej. Używamy ich tylko do operacji
// administracyjnych (tworzenie danych) i w testach logowania; testy biznesowe dostają
// własnego użytkownika per worker.
export const FIXED_USER = { login: 'user', password: 'user123' } as const;
export const FIXED_ADMIN = { login: 'admin', password: 'admin123' } as const;
export const FIXED_PRODUCTS = ['Szampon', 'Mydło', 'Pasta do zębów'] as const;
export const FIXED_STOCK = 10;

export interface WorkerUser extends User {
  password: string;
}

/** Tworzy (albo odtwarza) użytkownika workera. Wołane raz na worker. */
export async function seedWorkerUser(adminApi: ShopApi, prefix: string): Promise<WorkerUser> {
  const password = 'e2e-' + crypto.randomBytes(6).toString('hex');
  const user = await adminApi.upsertUser({ login: `${prefix}user`, password, role: 'user' });
  return { ...user, password };
}

/** Produkt z unikalną nazwą w obrębie prefiksu; wołane per test. */
export async function seedProduct(adminApi: ShopApi, prefix: string, overrides: Partial<Pick<Product, 'price_cents' | 'stock'>> = {}): Promise<Product> {
  const name = `${prefix}p_${crypto.randomBytes(3).toString('hex')}`;
  return adminApi.upsertProduct({ name, price_cents: overrides.price_cents ?? 999, stock: overrides.stock ?? FIXED_STOCK });
}

/** Sprząta wszystko z prefiksem: produkty, użytkownika (zamówienia, koszyk i sesje kasują się kaskadowo). */
export async function cleanupPrefix(adminApi: ShopApi, prefix: string): Promise<void> {
  await adminApi.deleteProducts(prefix);
  await adminApi.deleteUsers(prefix);
}
