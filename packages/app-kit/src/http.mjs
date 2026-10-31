// Mini-router na node:http. Bez zależności: aplikacje mają być tłem dla testów,
// nie przedmiotem szkolenia.
import http from 'node:http';
import crypto from 'node:crypto';
import { all, get, run } from './db.mjs';

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Fikcyjna marka „Namssor”. Styl tylko w CSS: markup stron i selektory testów zostają bez zmian.
// variant: 'shop' (jasny nagłówek) albo 'backoffice' (ciemny nagłówek narzędzia operatora).
const LOGO = `<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="15" fill="var(--accent)"/>
<path d="M9.5 21V9h3.2l4.6 7V9h3.2v12h-3.2l-4.6-7v7z" fill="#fff"/></svg>`;

const CSS = `:root{--brand:#0e7c7b;--brand-dark:#0a5e5d;--brand-soft:#e3f2f1;--accent:#ff6b57;--bg:#f4f7f6;--surface:#fff;
--text:#1d2b2a;--muted:#5f6f6d;--line:#dde5e3;--head-bg:#fff;--head-text:var(--text);--head-link:var(--muted)}
.backoffice{--bg:#f1f4f8;--line:#d9e0e8;--head-bg:#1f2a37;--head-text:#f8fafc;--head-link:#cbd5e1}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 "Segoe UI",system-ui,-apple-system,sans-serif}
header{background:var(--head-bg);color:var(--head-text);border-bottom:1px solid var(--line);box-shadow:0 1px 3px rgba(0,0,0,.04)}
.bar{max-width:980px;margin:0 auto;padding:.7rem 1.25rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:.55rem;text-decoration:none;color:inherit;font-weight:700;font-size:1.25rem;letter-spacing:-.02em}
.brand small{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;background:var(--brand);color:#fff;padding:.15rem .45rem;border-radius:4px}
nav{display:flex;gap:.25rem;flex:1}
nav a{color:var(--head-link);text-decoration:none;font-weight:500;padding:.4rem .75rem;border-radius:999px}
nav a:hover{color:var(--head-text);background:rgba(127,127,127,.12)}
nav a[aria-current="page"]{color:var(--brand-dark);background:var(--brand-soft)}
.backoffice nav a[aria-current="page"]{color:#fff;background:var(--brand)}
.who{display:flex;align-items:center;gap:.75rem;font-size:.85rem;color:var(--head-link)}
.who a{color:var(--brand);font-weight:600}
.who button{background:transparent;color:inherit;border:1px solid currentColor;padding:.3rem .8rem;font-size:.85rem}
.who button:hover{background:rgba(127,127,127,.12)}
main{max-width:980px;margin:1.75rem auto;padding:0 1.25rem}
h1{font-size:1.6rem;letter-spacing:-.02em;margin:0 0 1rem}
a{color:var(--brand)}
form p{margin:.6rem 0}
form p>label:has(input:not([type=checkbox])){display:flex;flex-direction:column;gap:.3rem;max-width:22rem}
form p>label>input:not([type=checkbox]){margin-left:0}
label{font-weight:500}
input:not([type=checkbox]){font:inherit;padding:.45rem .65rem;border:1px solid var(--line);border-radius:8px;background:#fff;margin-left:.35rem;min-width:12rem}
input:focus{outline:2px solid var(--brand);outline-offset:1px;border-color:var(--brand)}
input[type=checkbox]{accent-color:var(--brand);width:1.05rem;height:1.05rem;vertical-align:-2px;margin-right:.35rem}
button{font:inherit;font-weight:600;background:var(--brand);color:#fff;border:0;border-radius:8px;padding:.45rem 1rem;cursor:pointer}
button:hover{background:var(--brand-dark)}
button:disabled{background:#c5cfcd;color:#fff;cursor:not-allowed}
main>form{margin-bottom:1rem}
main>form[action="/"],main>form[action="/orders"][method="get"]{display:flex;align-items:center;gap:.5rem}
table{border-collapse:separate;border-spacing:0;width:100%;background:var(--surface);border:1px solid var(--line);border-radius:12px;overflow:hidden;margin:1rem 0}
th{background:var(--bg);color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
td,th{padding:.65rem .9rem;text-align:left;border-bottom:1px solid var(--line)}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover td{background:#fafcfb}
td form{margin:0}
td button{padding:.35rem .8rem;font-size:.85rem}
[data-testid="product-name"],[data-testid="cart-item-name"]{font-weight:600}
td[data-testid="order-status"]{font-weight:600}
.backoffice td button{background:transparent;color:#b42318;border:1px solid #f1a9a0}
.backoffice td button:hover{background:#fdecea}
.flash,.error{padding:.65rem 1rem;margin-bottom:1rem;border-radius:8px;border:1px solid}
.flash{background:#e6f4ea;border-color:#9fd3b0;color:#14532d}
.error{background:#fdecea;border-color:#f1a9a0;color:#7f1d1d}
footer{max-width:980px;margin:2.5rem auto 1.5rem;padding:0 1.25rem;color:var(--muted);font-size:.8rem}`;

export function layout({ title, user, nav = [], body, variant = 'shop' }) {
  // Aktywna zakładka: etykieta zawarta w tytule strony („Twoje zamówienia” → „Zamówienia”).
  const current = (label) => String(title).toLowerCase().includes(label.toLowerCase().slice(0, 5));
  const navHtml = nav
    .map(([href, label]) => `<a href="${href}"${current(label) ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`)
    .join('');
  const who = user
    ? `<span data-testid="current-user">Zalogowano jako ${escapeHtml(user.login)} (${escapeHtml(user.role)})</span>
       <form method="post" action="/logout" style="display:inline"><button type="submit">Wyloguj</button></form>`
    : `<a href="/login">Zaloguj</a>`;
  const badge = variant === 'backoffice' ? ' <small>Backoffice</small>' : '';
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} · Namssor</title>
<style>${CSS}</style></head>
<body class="${variant}"><header><div class="bar"><a class="brand" href="/">${LOGO}namssor${badge}</a>
<nav>${navHtml}</nav><div class="who">${who}</div></div></header>
<main>${body}</main>
<footer>Namssor to fikcyjna drogeria do ćwiczeń z automatyzacji testów. Dane są przykładowe.</footer>
<script>
// Komunikat (flash) znika po 1–2 s, z losowym opóźnieniem: realistyczne źródło testów zależnych od czasu.
const flash=document.querySelector('[data-testid="flash"]');if(flash)setTimeout(()=>flash.remove(),1000+Math.random()*1000);
</script></body></html>`;
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(v.join('='));
  }
  return out;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  const type = req.headers['content-type'] ?? '';
  if (type.includes('application/json')) return raw ? JSON.parse(raw) : {};
  if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
  return raw;
}

export function createApp({ db, name }) {
  const routes = [];
  const app = {
    route(method, pattern, handler) {
      const keys = [];
      const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
      routes.push({ method, re, keys, handler });
    },
    get: (p, h) => app.route('GET', p, h),
    post: (p, h) => app.route('POST', p, h),
    put: (p, h) => app.route('PUT', p, h),
    delete: (p, h) => app.route('DELETE', p, h),
    listen(port) {
      const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const ctx = { req, res, url, db, query: Object.fromEntries(url.searchParams), params: {}, body: null, user: null };
        ctx.user = currentUser(ctx);
        try {
          for (const r of routes) {
            if (r.method !== req.method) continue;
            const m = url.pathname.match(r.re);
            if (!m) continue;
            r.keys.forEach((k, i) => (ctx.params[k] = decodeURIComponent(m[i + 1])));
            if (req.method !== 'GET') ctx.body = await readBody(req);
            return await r.handler(ctx, helpers(ctx));
          }
          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
        } catch (e) {
          console.error(`[${name}]`, e);
          res.writeHead(500, { 'content-type': 'application/json' }).end(JSON.stringify({ error: String(e.message ?? e) }));
        }
      });
      server.listen(port, () => console.log(`[${name}] http://localhost:${port}`));
      return server;
    },
  };
  return app;
}

function currentUser(ctx) {
  const auth = ctx.req.headers.authorization ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : parseCookies(ctx.req).sid;
  if (!token) return null;
  return get(ctx.db, 'SELECT u.id, u.login, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?', [token]) ?? null;
}

function helpers(ctx) {
  const { res, db } = ctx;
  return {
    html(body, status = 200) {
      res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' }).end(body);
    },
    json(data, status = 200) {
      res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }).end(JSON.stringify(data));
    },
    redirect(to) {
      res.writeHead(303, { location: to }).end();
    },
    login(login, password) {
      const user = get(db, 'SELECT id, login, role FROM users WHERE login = ? AND password = ?', [login, password]);
      if (!user) return null;
      const token = crypto.randomBytes(16).toString('hex');
      run(db, 'INSERT INTO sessions (token, user_id) VALUES (?, ?)', [token, user.id]);
      res.setHeader('set-cookie', `sid=${token}; Path=/; HttpOnly; SameSite=Lax`);
      return { user, token };
    },
    logout() {
      const token = parseCookies(ctx.req).sid;
      if (token) run(db, 'DELETE FROM sessions WHERE token = ?', [token]);
      res.setHeader('set-cookie', 'sid=; Path=/; Max-Age=0');
    },
    requireRole(role) {
      if (!ctx.user) return { status: 401, error: 'Wymagane logowanie' };
      if (role && ctx.user.role !== role) return { status: 403, error: 'Brak uprawnień' };
      return null;
    },
    all: (sql, params) => all(db, sql, params),
    get: (sql, params) => get(db, sql, params),
    run: (sql, params) => run(db, sql, params),
  };
}
