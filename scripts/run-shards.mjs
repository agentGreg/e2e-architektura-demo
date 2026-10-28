// Demo shardingu bez CI: uruchamia N shardów jednego projektu e2e, każdy z reporterem blob
// do osobnego katalogu, potem zbiera bloby do `all-blob-reports/` i scala do HTML.
// Użycie: node scripts/run-shards.mjs --total 2 --app shop [--sequential] [-- dodatkowe argumenty playwright]
// Domyślnie shardy biegną równolegle (jak zadania w pipeline), aplikacje startują raz z tego skryptu.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const total = Number(opt('--total', 2));
const app = opt('--app', 'shop');
const sequential = args.includes('--sequential');
const extra = args.includes('--') ? args.slice(args.indexOf('--') + 1) : [];

const e2eDir = path.join(root, 'e2e', app);
const blobRoot = path.join(root, 'blob-report');
const mergedDir = path.join(root, 'all-blob-reports');
fs.rmSync(blobRoot, { recursive: true, force: true });
fs.rmSync(mergedDir, { recursive: true, force: true });

const playwrightCli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const env = { ...process.env, CI: '1', NODE_OPTIONS: [process.env.NODE_OPTIONS, '--disable-warning=ExperimentalWarning'].filter(Boolean).join(' ') };

function waitFor(url, ms = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () =>
      fetch(url)
        .then((r) => (r.ok ? resolve() : retry()))
        .catch(retry);
    const retry = () => (Date.now() - start > ms ? reject(new Error(`Nie wystartował: ${url}`)) : setTimeout(tick, 250));
    tick();
  });
}

// Z CI=1 Playwright nie reużywa serwera, więc startujemy aplikacje tu i dajemy shardom gotowe URL-e
// (reuseExistingServer: !CI). Robimy to przez SHOP_URL/BACKOFFICE_URL i PW_SKIP_WEBSERVER.
const servers = [];
async function startApps() {
  const apps = app === 'backoffice' ? ['backoffice', 'shop'] : ['shop'];
  for (const name of apps) {
    const child = spawn(process.execPath, [path.join(root, 'apps', name, 'src', 'server.mjs')], { stdio: 'ignore', env });
    servers.push(child);
  }
  await waitFor('http://localhost:4100/health');
  if (apps.includes('backoffice')) await waitFor('http://localhost:4200/health');
}

function runShard(i) {
  const outDir = path.join(blobRoot, `shard-${i}`);
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [playwrightCli, 'test', `--shard=${i}/${total}`, '--reporter=blob,line', ...extra],
      { cwd: e2eDir, stdio: 'inherit', env: { ...env, PW_SKIP_WEBSERVER: '1', PLAYWRIGHT_BLOB_OUTPUT_DIR: outDir } },
    );
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function main() {
  await startApps();
  console.log(`\n== ${total} shardów, projekt e2e/${app}, ${sequential ? 'po kolei' : 'równolegle'} ==\n`);
  let codes;
  if (sequential) {
    codes = [];
    for (let i = 1; i <= total; i++) codes.push(await runShard(i));
  } else {
    codes = await Promise.all(Array.from({ length: total }, (_, k) => runShard(k + 1)));
  }
  for (const s of servers) s.kill();

  fs.mkdirSync(mergedDir, { recursive: true });
  for (let i = 1; i <= total; i++) {
    const dir = path.join(blobRoot, `shard-${i}`);
    for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) fs.copyFileSync(path.join(dir, f), path.join(mergedDir, f));
  }
  console.log(`\nBloby zebrane w ${path.relative(root, mergedDir)}:`, fs.readdirSync(mergedDir).join(', '));
  console.log('Scalanie: pnpm report:merge');
  process.exit(codes.some((c) => c !== 0) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  for (const s of servers) s.kill();
  process.exit(1);
});
