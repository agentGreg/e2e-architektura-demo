// Klient API aplikacji demo. Warstwa "sterowanie": test ani fixture domenowy nie zna
// ścieżek HTTP, zna `shopApi.createProduct(...)`.
export interface Product {
  id: number;
  name: string;
  price_cents: number;
  stock: number;
}
export interface Order {
  id: number;
  number: string;
  user_id: number;
  product_id: number;
  product: string;
  qty: number;
  status: 'new' | 'cancelled';
}
export interface User {
  id: number;
  login: string;
  role: 'user' | 'admin';
}

export const SHOP_URL = process.env.SHOP_URL ?? 'http://localhost:4100';
export const BACKOFFICE_URL = process.env.BACKOFFICE_URL ?? 'http://localhost:4200';

class HttpClient {
  protected token: string | null = null;
  constructor(protected readonly baseURL: string) {}

  protected async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.baseURL + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${data?.error ?? text}`);
    return data as T;
  }

  async login(login: string, password: string): Promise<{ token: string; user: User }> {
    const s = await this.call<{ token: string; user: User }>('POST', '/api/login', { login, password });
    this.token = s.token;
    return s;
  }
  get authToken() {
    return this.token;
  }
}

export class ShopApi extends HttpClient {
  constructor(baseURL = SHOP_URL) {
    super(baseURL);
  }
  me() {
    return this.call<User>('GET', '/api/me');
  }
  products(prefix?: string) {
    return this.call<Product[]>('GET', '/api/products' + (prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''));
  }
  // Idempotentne: ten sam name -> aktualizacja ceny i stanu (ON CONFLICT w aplikacji).
  upsertProduct(p: { name: string; price_cents?: number; stock?: number }) {
    return this.call<Product>('POST', '/api/products', p);
  }
  deleteProducts(prefix: string) {
    return this.call<{ deleted: number }>('DELETE', `/api/products?prefix=${encodeURIComponent(prefix)}`);
  }
  upsertUser(u: { login: string; password?: string; role?: 'user' | 'admin' }) {
    return this.call<User>('POST', '/api/users', u);
  }
  deleteUsers(prefix: string) {
    return this.call<{ deleted: number }>('DELETE', `/api/users?prefix=${encodeURIComponent(prefix)}`);
  }
  cart() {
    return this.call<{ id: number; qty: number; product_id: number; name: string }[]>('GET', '/api/cart');
  }
  addToCart(productId: number, qty = 1) {
    return this.call<{ ok: true }>('POST', '/api/cart', { product_id: productId, qty });
  }
  clearCart() {
    return this.call<{ deleted: number }>('DELETE', '/api/cart');
  }
  placeOrder(o: { product_id?: number; product_name?: string; qty?: number; number?: string }) {
    return this.call<Order>('POST', '/api/orders', o);
  }
  myOrders() {
    return this.call<Order[]>('GET', '/api/orders');
  }
  maintenance() {
    return this.call<{ enabled: boolean }>('GET', '/api/settings/maintenance');
  }
}

export class BackofficeApi extends HttpClient {
  constructor(baseURL = BACKOFFICE_URL) {
    super(baseURL);
  }
  orders(prefix?: string) {
    return this.call<Order[]>('GET', '/api/orders' + (prefix ? `?prefix=${encodeURIComponent(prefix)}` : ''));
  }
  cancelOrder(idOrNumber: number | string) {
    return this.call<Order>('POST', `/api/orders/${encodeURIComponent(String(idOrNumber))}/cancel`);
  }
  deleteOrders(prefix: string) {
    return this.call<{ deleted: number }>('DELETE', `/api/orders?prefix=${encodeURIComponent(prefix)}`);
  }
  maintenance() {
    return this.call<{ enabled: boolean }>('GET', '/api/settings/maintenance');
  }
  setMaintenance(enabled: boolean) {
    return this.call<{ enabled: boolean }>('PUT', '/api/settings/maintenance', { enabled });
  }
}
