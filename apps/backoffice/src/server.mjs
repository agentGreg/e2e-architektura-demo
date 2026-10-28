// Backoffice demo (system pod testem): zamówienia, anulowanie, tryb konserwacji sklepu.
// Operatorem jest użytkownik z rolą admin (ta sama baza co sklep).
import { openDb, ensureSchema } from '@demo/app-kit/db';
import { createApp, layout, escapeHtml } from '@demo/app-kit/http';

const PORT = Number(process.env.BACKOFFICE_PORT ?? 4200);
const db = openDb();
ensureSchema(db);
const app = createApp({ db, name: 'backoffice' });

const nav = [['/orders', 'Zamówienia'], ['/settings', 'Ustawienia']];
const statusLabel = (s) => (s === 'new' ? 'Nowe' : 'Anulowane');

app.get('/health', (_c, h) => h.json({ ok: true, app: 'backoffice' }));
app.get('/', (_c, h) => h.redirect('/orders'));

app.get('/login', (ctx, h) => {
  const err = ctx.query.error ? '<p class="error" role="alert">Nieprawidłowy login, hasło albo brak roli operatora</p>' : '';
  h.html(layout({ title: 'Backoffice: logowanie', user: ctx.user, nav, body: `<h1>Logowanie operatora</h1>${err}
    <form method="post" action="/login">
      <p><label>Login <input name="login" autocomplete="username"></label></p>
      <p><label>Hasło <input name="password" type="password" autocomplete="current-password"></label></p>
      <button type="submit">Zaloguj</button></form>` }));
});
app.post('/login', (ctx, h) => {
  const s = h.login(ctx.body.login, ctx.body.password);
  if (!s || s.user.role !== 'admin') {
    if (s) h.logout();
    return h.redirect('/login?error=1');
  }
  h.redirect('/orders');
});
app.post('/logout', (_c, h) => (h.logout(), h.redirect('/login')));

function requireOperator(ctx, h) {
  if (ctx.user?.role === 'admin') return true;
  h.redirect('/login');
  return false;
}

app.get('/orders', (ctx, h) => {
  if (!requireOperator(ctx, h)) return;
  const q = ctx.query.q ?? '';
  const orders = h.all(
    `SELECT o.*, p.name AS product, u.login FROM orders o JOIN products p ON p.id = o.product_id JOIN users u ON u.id = o.user_id
     WHERE o.number LIKE ? OR p.name LIKE ? OR u.login LIKE ? ORDER BY o.id DESC LIMIT 200`,
    [`%${q}%`, `%${q}%`, `%${q}%`],
  );
  const flash = ctx.query.cancelled ? `<p class="flash" data-testid="flash">Anulowano zamówienie ${escapeHtml(ctx.query.cancelled)}</p>` : '';
  const rows = orders
    .map(
      (o) => `<tr data-testid="order-row" data-order-number="${escapeHtml(o.number)}">
      <td data-testid="order-number">${escapeHtml(o.number)}</td><td>${escapeHtml(o.login)}</td><td>${escapeHtml(o.product)}</td><td>${o.qty}</td>
      <td data-testid="order-status">${statusLabel(o.status)}</td>
      <td>${o.status === 'new' ? `<form method="post" action="/orders/${o.id}/cancel"><button type="submit" aria-label="Anuluj: ${escapeHtml(o.number)}">Anuluj</button></form>` : ''}</td></tr>`,
    )
    .join('');
  h.html(layout({ title: 'Zamówienia', user: ctx.user, nav, body: `<h1>Zamówienia</h1>${flash}
    <form method="get" action="/orders"><label>Szukaj <input name="q" value="${escapeHtml(q)}"></label> <button type="submit">Szukaj</button></form>
    <table><thead><tr><th>Numer</th><th>Klient</th><th>Produkt</th><th>Ilość</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>` }));
});

app.post('/orders/:id/cancel', (ctx, h) => {
  if (!requireOperator(ctx, h)) return;
  const order = cancelOrder(h, ctx.params.id);
  h.redirect(order ? '/orders?cancelled=' + encodeURIComponent(order.number) : '/orders');
});

app.get('/settings', (ctx, h) => {
  if (!requireOperator(ctx, h)) return;
  const on = h.get("SELECT value FROM settings WHERE key = 'maintenance'")?.value === '1';
  const flash = ctx.query.saved ? '<p class="flash" data-testid="flash">Zapisano ustawienia</p>' : '';
  h.html(layout({ title: 'Ustawienia', user: ctx.user, nav, body: `<h1>Ustawienia</h1>${flash}
    <form method="post" action="/settings">
      <p><label><input type="checkbox" name="maintenance" value="1" ${on ? 'checked' : ''}> Tryb konserwacji sklepu</label></p>
      <p data-testid="maintenance-state">Stan: ${on ? 'włączony' : 'wyłączony'}</p>
      <button type="submit">Zapisz</button></form>` }));
});
app.post('/settings', (ctx, h) => {
  if (!requireOperator(ctx, h)) return;
  setMaintenance(h, ctx.body.maintenance === '1');
  h.redirect('/settings?saved=1');
});

// ---------- API ----------
app.post('/api/login', (ctx, h) => {
  const s = h.login(ctx.body.login, ctx.body.password);
  if (!s || s.user.role !== 'admin') return h.json({ error: 'Wymagana rola operatora' }, 401);
  h.json({ token: s.token, user: s.user });
});
app.get('/api/orders', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  const prefix = ctx.query.prefix ?? '';
  h.json(h.all('SELECT o.*, p.name AS product, u.login FROM orders o JOIN products p ON p.id = o.product_id JOIN users u ON u.id = o.user_id WHERE o.number LIKE ? ORDER BY o.id DESC', [prefix + '%']));
});
app.post('/api/orders/:id/cancel', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  const order = cancelOrder(h, ctx.params.id);
  return order ? h.json(order) : h.json({ error: 'Nie ma takiego zamówienia albo już anulowane' }, 404);
});
app.delete('/api/orders', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  if (!ctx.query.prefix) return h.json({ error: 'Wymagany parametr prefix' }, 400);
  const r = h.run('DELETE FROM orders WHERE number LIKE ?', [ctx.query.prefix + '%']);
  h.json({ deleted: r.changes });
});
app.get('/api/settings/maintenance', (_c, h) => h.json({ enabled: h.get("SELECT value FROM settings WHERE key = 'maintenance'")?.value === '1' }));
app.put('/api/settings/maintenance', (ctx, h) => {
  const denied = h.requireRole('admin');
  if (denied) return h.json({ error: denied.error }, denied.status);
  setMaintenance(h, Boolean(ctx.body.enabled));
  h.json({ enabled: Boolean(ctx.body.enabled) });
});

function setMaintenance(h, enabled) {
  h.run("INSERT INTO settings (key, value) VALUES ('maintenance', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [enabled ? '1' : '0']);
}

function cancelOrder(h, idOrNumber) {
  const order = h.get("SELECT * FROM orders WHERE (id = ? OR number = ?) AND status = 'new'", [idOrNumber, idOrNumber]);
  if (!order) return null;
  h.run("UPDATE orders SET status = 'cancelled' WHERE id = ?", [order.id]);
  h.run('UPDATE products SET stock = stock + ? WHERE id = ?', [order.qty, order.product_id]);
  return h.get('SELECT o.*, p.name AS product FROM orders o JOIN products p ON p.id = o.product_id WHERE o.id = ?', [order.id]);
}

app.listen(PORT);
