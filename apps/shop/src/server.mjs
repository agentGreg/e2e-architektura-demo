// Sklep demo (system pod testem). Czysty node:http + HTML, bez zależności.
import { openDb, ensureSchema } from '@demo/app-kit/db';
import { createApp, layout, escapeHtml } from '@demo/app-kit/http';

const PORT = Number(process.env.SHOP_PORT ?? 4100);
const db = openDb();
ensureSchema(db);
const app = createApp({ db, name: 'shop' });

const nav = [['/', 'Produkty'], ['/cart', 'Koszyk'], ['/orders', 'Zamówienia'], ['/admin', 'Admin']];
const price = (cents) => (cents / 100).toFixed(2).replace('.', ',') + ' zł';

function maintenanceOn(h) {
  return h.get("SELECT value FROM settings WHERE key = 'maintenance'")?.value === '1';
}

// Tryb konserwacji: ustawiany globalnie w backoffice, blokuje sklep dla nie-adminów.
// To jest "zasób nie do zrównoleglenia" z bloku 2.
function maintenanceGuard(ctx, h) {
  if (!maintenanceOn(h) || ctx.user?.role === 'admin') return false;
  if (ctx.url.pathname.startsWith('/api/')) {
    h.json({ error: 'Tryb konserwacji' }, 503);
  } else {
    h.html(layout({ title: 'Tryb konserwacji', user: ctx.user, nav, body: '<h1>Tryb konserwacji</h1><p>Sklep jest chwilowo niedostępny.</p>' }), 503);
  }
  return true;
}

app.get('/health', (_c, h) => h.json({ ok: true, app: 'shop' }));

// ---------- UI ----------
app.get('/', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  const prefix = ctx.query.prefix;
  const products = prefix
    ? h.all('SELECT * FROM products WHERE name LIKE ? ORDER BY name', [prefix + '%'])
    : h.all('SELECT * FROM products ORDER BY name');
  const flash = ctx.query.added ? `<p class="flash" data-testid="flash">Dodano do koszyka: ${escapeHtml(ctx.query.added)}</p>` : '';
  const rows = products
    .map(
      (p) => `<tr data-testid="product-row" data-product-id="${p.id}">
        <td data-testid="product-name">${escapeHtml(p.name)}</td><td>${price(p.price_cents)}</td>
        <td data-testid="product-stock">${p.stock}</td>
        <td><form method="post" action="/cart/add"><input type="hidden" name="product_id" value="${p.id}">
        <button type="submit" aria-label="Dodaj do koszyka: ${escapeHtml(p.name)}" ${p.stock === 0 ? 'disabled' : ''}>Dodaj do koszyka</button></form></td></tr>`,
    )
    .join('');
  h.html(layout({ title: 'Produkty', user: ctx.user, nav, body: `<h1>Produkty</h1>${flash}
    <form method="get" action="/"><label>Filtr nazwy <input name="prefix" value="${escapeHtml(prefix ?? '')}"></label> <button type="submit">Filtruj</button></form>
    <table><thead><tr><th>Nazwa</th><th>Cena</th><th>Stan</th><th></th></tr></thead><tbody>${rows}</tbody></table>` }));
});

app.get('/login', (ctx, h) => {
  const err = ctx.query.error ? '<p class="error" role="alert">Nieprawidłowy login lub hasło</p>' : '';
  h.html(layout({ title: 'Logowanie', user: ctx.user, nav, body: `<h1>Logowanie</h1>${err}
    <form method="post" action="/login">
      <p><label>Login <input name="login" autocomplete="username"></label></p>
      <p><label>Hasło <input name="password" type="password" autocomplete="current-password"></label></p>
      <button type="submit">Zaloguj</button></form>` }));
});
app.post('/login', (ctx, h) => (h.login(ctx.body.login, ctx.body.password) ? h.redirect('/') : h.redirect('/login?error=1')));
app.post('/logout', (_c, h) => (h.logout(), h.redirect('/')));

app.post('/cart/add', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  if (!ctx.user) return h.redirect('/login');
  const product = h.get('SELECT * FROM products WHERE id = ?', [ctx.body.product_id]);
  if (!product) return h.redirect('/');
  h.run('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, 1) ON CONFLICT(user_id, product_id) DO UPDATE SET qty = qty + 1', [ctx.user.id, product.id]);
  h.redirect('/?added=' + encodeURIComponent(product.name));
});

app.get('/cart', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  if (!ctx.user) return h.redirect('/login');
  const items = h.all('SELECT c.id, c.qty, p.name, p.price_cents FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.user_id = ? ORDER BY p.name', [ctx.user.id]);
  const rows = items
    .map((i) => `<tr data-testid="cart-item"><td data-testid="cart-item-name">${escapeHtml(i.name)}</td><td data-testid="cart-item-qty">${i.qty}</td><td>${price(i.price_cents * i.qty)}</td>
      <td><form method="post" action="/cart/remove"><input type="hidden" name="item_id" value="${i.id}"><button type="submit" aria-label="Usuń: ${escapeHtml(i.name)}">Usuń</button></form></td></tr>`)
    .join('');
  // SHOP_BUG_TOTAL=1 włącza celowy błąd (suma bez ilości) do demo "analiza nieudanego buildu".
  const total = process.env.SHOP_BUG_TOTAL
    ? items.reduce((s, i) => s + i.price_cents, 0)
    : items.reduce((s, i) => s + i.price_cents * i.qty, 0);
  h.html(layout({ title: 'Koszyk', user: ctx.user, nav, body: `<h1>Koszyk</h1>
    <p>Pozycji: <span data-testid="cart-count">${items.length}</span>, razem: <span data-testid="cart-total">${price(total)}</span></p>
    <table><thead><tr><th>Produkt</th><th>Ilość</th><th>Wartość</th><th></th></tr></thead><tbody>${rows}</tbody></table>
    <form method="post" action="/checkout"><button type="submit" ${items.length === 0 ? 'disabled' : ''}>Złóż zamówienie</button></form>` }));
});

app.post('/cart/remove', (ctx, h) => {
  if (!ctx.user) return h.redirect('/login');
  h.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [ctx.body.item_id, ctx.user.id]);
  h.redirect('/cart');
});

app.post('/checkout', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  if (!ctx.user) return h.redirect('/login');
  const numbers = checkout(h, ctx.user.id);
  h.redirect('/orders?placed=' + numbers.join(','));
});

app.get('/orders', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  if (!ctx.user) return h.redirect('/login');
  const orders = h.all('SELECT o.*, p.name AS product FROM orders o JOIN products p ON p.id = o.product_id WHERE o.user_id = ? ORDER BY o.id DESC', [ctx.user.id]);
  const flash = ctx.query.placed ? `<p class="flash" data-testid="flash">Złożono zamówienie: ${escapeHtml(ctx.query.placed)}</p>` : '';
  const rows = orders.map((o) => `<tr data-testid="order-row"><td>${escapeHtml(o.number)}</td><td>${escapeHtml(o.product)}</td><td>${o.qty}</td><td data-testid="order-status">${o.status === 'new' ? 'Nowe' : 'Anulowane'}</td></tr>`).join('');
  h.html(layout({ title: 'Twoje zamówienia', user: ctx.user, nav, body: `<h1>Twoje zamówienia</h1>${flash}
    <table><thead><tr><th>Numer</th><th>Produkt</th><th>Ilość</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>` }));
});

app.get('/admin', (ctx, h) => {
  if (!ctx.user) return h.redirect('/login');
  if (ctx.user.role !== 'admin') return h.html(layout({ title: 'Brak uprawnień', user: ctx.user, nav, body: '<h1>Brak uprawnień</h1><p>Panel admina wymaga roli admin.</p>' }), 403);
  const products = h.all('SELECT * FROM products ORDER BY name');
  const rows = products.map((p) => `<tr data-testid="admin-product-row"><td>${escapeHtml(p.name)}</td><td>${price(p.price_cents)}</td><td>${p.stock}</td></tr>`).join('');
  const flash = ctx.query.created ? `<p class="flash" data-testid="flash">Dodano produkt: ${escapeHtml(ctx.query.created)}</p>` : '';
  h.html(layout({ title: 'Panel admina', user: ctx.user, nav, body: `<h1>Panel admina</h1>${flash}
    <form method="post" action="/admin/products">
      <p><label>Nazwa <input name="name" required></label></p>
      <p><label>Cena (zł) <input name="price" type="number" step="0.01" min="0" value="9.99"></label></p>
      <p><label>Stan <input name="stock" type="number" min="0" value="10"></label></p>
      <button type="submit">Dodaj produkt</button></form>
    <table><thead><tr><th>Nazwa</th><th>Cena</th><th>Stan</th></tr></thead><tbody>${rows}</tbody></table>` }));
});
app.post('/admin/products', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.redirect('/login');
  upsertProduct(h, ctx.body.name, Math.round(Number(ctx.body.price) * 100), Number(ctx.body.stock));
  h.redirect('/admin?created=' + encodeURIComponent(ctx.body.name));
});

// ---------- API (dla fixtures, seedów i backoffice) ----------
app.post('/api/login', (ctx, h) => {
  const s = h.login(ctx.body.login, ctx.body.password);
  return s ? h.json({ token: s.token, user: s.user }) : h.json({ error: 'Nieprawidłowy login lub hasło' }, 401);
});
app.get('/api/me', (ctx, h) => (ctx.user ? h.json(ctx.user) : h.json({ error: 'Wymagane logowanie' }, 401)));
app.get('/api/settings/maintenance', (_c, h) => h.json({ enabled: maintenanceOn(h) }));

app.get('/api/products', (ctx, h) => {
  const prefix = ctx.query.prefix;
  h.json(prefix ? h.all('SELECT * FROM products WHERE name LIKE ? ORDER BY name', [prefix + '%']) : h.all('SELECT * FROM products ORDER BY name'));
});
app.post('/api/products', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  const p = upsertProduct(h, ctx.body.name, Number(ctx.body.price_cents ?? 999), Number(ctx.body.stock ?? 10));
  h.json(p, 201);
});
app.delete('/api/products', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  if (!ctx.query.prefix) return h.json({ error: 'Wymagany parametr prefix' }, 400);
  const r = h.run('DELETE FROM products WHERE name LIKE ?', [ctx.query.prefix + '%']);
  h.json({ deleted: r.changes });
});

app.post('/api/users', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  const { login, password = 'test123', role = 'user' } = ctx.body;
  h.run('INSERT INTO users (login, password, role) VALUES (?, ?, ?) ON CONFLICT(login) DO UPDATE SET password = excluded.password, role = excluded.role', [login, password, role]);
  h.json(h.get('SELECT id, login, role FROM users WHERE login = ?', [login]), 201);
});
app.delete('/api/users', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  if (!ctx.query.prefix) return h.json({ error: 'Wymagany parametr prefix' }, 400);
  const r = h.run("DELETE FROM users WHERE login LIKE ? AND role <> 'admin' OR (login LIKE ? AND login <> 'admin')", [ctx.query.prefix + '%', ctx.query.prefix + '%']);
  h.json({ deleted: r.changes });
});

app.get('/api/cart', (ctx, h) => {
  const denied = h.requireRole();
  if (denied) return h.json({ error: denied.error }, denied.status);
  h.json(h.all('SELECT c.id, c.qty, p.id AS product_id, p.name FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.user_id = ?', [ctx.user.id]));
});
app.post('/api/cart', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  const denied = h.requireRole();
  if (denied) return h.json({ error: denied.error }, denied.status);
  h.run('INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?) ON CONFLICT(user_id, product_id) DO UPDATE SET qty = qty + excluded.qty', [ctx.user.id, ctx.body.product_id, Number(ctx.body.qty ?? 1)]);
  h.json({ ok: true }, 201);
});
app.delete('/api/cart', (ctx, h) => {
  const denied = h.requireRole();
  if (denied) return h.json({ error: denied.error }, denied.status);
  const r = h.run('DELETE FROM cart_items WHERE user_id = ?', [ctx.user.id]);
  h.json({ deleted: r.changes });
});

app.get('/api/orders', (ctx, h) => {
  const denied = h.requireRole();
  if (denied) return h.json({ error: denied.error }, denied.status);
  h.json(h.all('SELECT o.*, p.name AS product FROM orders o JOIN products p ON p.id = o.product_id WHERE o.user_id = ? ORDER BY o.id DESC', [ctx.user.id]));
});
app.post('/api/orders', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  const denied = h.requireRole();
  if (denied) return h.json({ error: denied.error }, denied.status);
  const product = h.get('SELECT * FROM products WHERE id = ? OR name = ?', [ctx.body.product_id ?? -1, ctx.body.product_name ?? '']);
  if (!product) return h.json({ error: 'Nie ma takiego produktu' }, 404);
  const qty = Number(ctx.body.qty ?? 1);
  const order = placeOrder(h, ctx.user.id, product, qty, ctx.body.number);
  if (!order) return h.json({ error: 'Brak towaru' }, 409);
  h.json(order, 201);
});
app.post('/api/checkout', (ctx, h) => {
  if (maintenanceGuard(ctx, h)) return;
  const denied = h.requireRole();
  if (denied) return h.json({ error: denied.error }, denied.status);
  h.json({ numbers: checkout(h, ctx.user.id) }, 201);
});

function upsertProduct(h, name, priceCents, stock) {
  h.run('INSERT INTO products (name, price_cents, stock) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET price_cents = excluded.price_cents, stock = excluded.stock', [name, priceCents, stock]);
  return h.get('SELECT * FROM products WHERE name = ?', [name]);
}

function nextNumber(h) {
  const row = h.get('SELECT COALESCE(MAX(id), 0) + 1 AS n FROM orders');
  return `ORD-${String(row.n).padStart(5, '0')}`;
}

function placeOrder(h, userId, product, qty, number) {
  const r = h.run('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?', [qty, product.id, qty]);
  if (r.changes === 0) return null;
  const num = number ?? nextNumber(h);
  h.run('INSERT INTO orders (number, user_id, product_id, qty) VALUES (?, ?, ?, ?)', [num, userId, product.id, qty]);
  return h.get('SELECT o.*, p.name AS product FROM orders o JOIN products p ON p.id = o.product_id WHERE o.number = ?', [num]);
}

function checkout(h, userId) {
  const items = h.all('SELECT c.qty, p.* FROM cart_items c JOIN products p ON p.id = c.product_id WHERE c.user_id = ?', [userId]);
  const numbers = [];
  for (const item of items) {
    const order = placeOrder(h, userId, item, item.qty);
    if (order) numbers.push(order.number);
  }
  h.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);
  return numbers;
}

app.listen(PORT);
