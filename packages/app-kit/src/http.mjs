// Mini-router na node:http. Bez zależności: aplikacje mają być tłem dla testów,
// nie przedmiotem szkolenia.
import http from 'node:http';
import crypto from 'node:crypto';
import { all, get, run } from './db.mjs';

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function layout({ title, user, nav = [], body }) {
  const navHtml = nav.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join(' | ');
  const who = user
    ? `<span data-testid="current-user">Zalogowano jako ${escapeHtml(user.login)} (${escapeHtml(user.role)})</span>
       <form method="post" action="/logout" style="display:inline"><button type="submit">Wyloguj</button></form>`
    : `<a href="/login">Zaloguj</a>`;
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:.4rem .6rem;text-align:left}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ddd;padding-bottom:.5rem;margin-bottom:1rem}
.flash{background:#e8f5e9;border:1px solid #a5d6a7;padding:.5rem 1rem;margin-bottom:1rem}
.error{background:#ffebee;border:1px solid #ef9a9a;padding:.5rem 1rem;margin-bottom:1rem}</style></head>
<body><header><nav>${navHtml}</nav><div>${who}</div></header>
<main>${body}</main>
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
