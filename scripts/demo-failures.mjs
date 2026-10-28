// Generuje materiał do ćwiczenia 3A ("analiza nieudanego buildu"): dwie próby tego samego
// zestawu testów e2e/shop, z trace, raportem HTML, JSON i JUnit.
//   ok/     : 1 worker, bez flagi błędu     -> wszystko zielone
//   failed/ : 4 workery, SHOP_BUG_TOTAL=1   -> kolizje danych, flaky, bug, uprawnienia, środowisko
// Użycie: pnpm demo:failures   (wynik w e2e/shop/demo-runs/{ok,failed}/)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const e2eDir = path.join(root, 'e2e', 'shop');
const runsDir = path.join(e2eDir, 'demo-runs');
const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const baseEnv = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, '--disable-warning=ExperimentalWarning'].filter(Boolean).join(' ') };

function waitFor(url, ms = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => fetch(url).then((r) => (r.ok ? resolve() : retry())).catch(retry);
    const retry = () => (Date.now() - start > ms ? reject(new Error(`Nie wystartował: ${url}`)) : setTimeout(tick, 250));
    tick();
  });
}

async function withShop(env, fn) {
  const server = spawn(process.execPath, [path.join(root, 'apps', 'shop', 'src', 'server.mjs')], { stdio: 'ignore', env: { ...baseEnv, ...env } });
  try {
    await waitFor('http://localhost:4100/health');
    return await fn();
  } finally {
    server.kill();
  }
}

function runPlaywright(outDir, { workers, repeatEach, projects }) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const args = [
    cli, 'test',
    ...projects.flatMap((p) => ['--project', p]),
    `--workers=${workers}`,
    `--repeat-each=${repeatEach}`,
    '--trace=on',
    `--output=${path.join(outDir, 'test-results')}`,
    '--reporter=list,html,json,junit',
  ];
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: e2eDir,
      stdio: 'inherit',
      env: {
        ...baseEnv,
        PW_SKIP_WEBSERVER: '1',
        PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(outDir, 'playwright-report'),
        PLAYWRIGHT_HTML_OPEN: 'never',
        PLAYWRIGHT_JSON_OUTPUT_FILE: path.join(outDir, 'results.json'),
        PLAYWRIGHT_JUNIT_OUTPUT_FILE: path.join(outDir, 'junit.xml'),
      },
    });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function main() {
  console.log('\n== Próba udana (1 worker, bez błędu w aplikacji) ==\n');
  const okCode = await withShop({}, () => runPlaywright(path.join(runsDir, 'ok'), { workers: 1, repeatEach: 1, projects: ['chromium'] }));
  console.log('\n== Próba nieudana (4 workery, SHOP_BUG_TOTAL=1, repeat-each=2) ==\n');
  const failedCode = await withShop({ SHOP_BUG_TOTAL: '1' }, () => runPlaywright(path.join(runsDir, 'failed'), { workers: 4, repeatEach: 2, projects: ['chromium', 'demo-failures'] }));
  console.log(`\nok: kod ${okCode} (oczekiwane 0), failed: kod ${failedCode} (oczekiwane 1)`);
  console.log(`Raporty: ${path.relative(root, runsDir)}/{ok,failed}/playwright-report, results.json, junit.xml, test-results (trace)`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
