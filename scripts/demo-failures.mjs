// Generuje materiał do ćwiczenia 3A ("analiza nieudanego buildu") dla obu projektów e2e:
// dwie próby tego samego zestawu testów, z trace, raportem HTML, JSON i JUnit.
//   ok/     : 1 worker, bez flagi błędu, bez testów zawsze czerwonych (@demo-red) -> zielone
//   failed/ : 4 workery, --repeat-each=3, --retries=1, SHOP_BUG_TOTAL=1
//             -> kolizje danych, flaky (status `flaky` po retry), bug, uprawnienia, środowisko
// Użycie: pnpm demo:failures [shop|backoffice]   (wynik w e2e/<app>/demo-runs/{ok,failed}/)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const baseEnv = { ...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, '--disable-warning=ExperimentalWarning'].filter(Boolean).join(' ') };
const only = process.argv[2];
const apps = only ? [only] : ['shop', 'backoffice'];

function waitFor(url, ms = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => fetch(url).then((r) => (r.ok ? resolve() : retry())).catch(retry);
    const retry = () => (Date.now() - start > ms ? reject(new Error(`Nie wystartował: ${url}`)) : setTimeout(tick, 250));
    tick();
  });
}

// Aplikacje startują raz na próbę (PW_SKIP_WEBSERVER=1 dla Playwrighta), żeby podać flagę błędu.
async function withApps(names, env, fn) {
  const servers = names.map((name) => spawn(process.execPath, [path.join(root, 'apps', name, 'src', 'server.mjs')], { stdio: 'ignore', env: { ...baseEnv, ...env } }));
  try {
    for (const name of names) await waitFor(name === 'shop' ? 'http://localhost:4100/health' : 'http://localhost:4200/health');
    return await fn();
  } finally {
    for (const s of servers) s.kill();
  }
}

function runPlaywright(app, outDir, { workers, repeatEach, retries, projects, extraArgs = [] }) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const args = [
    cli, 'test',
    ...projects.flatMap((p) => ['--project', p]),
    `--workers=${workers}`,
    `--repeat-each=${repeatEach}`,
    `--retries=${retries}`,
    '--trace=on',
    `--output=${path.join(outDir, 'test-results')}`,
    '--reporter=list,html,json,junit',
    ...extraArgs,
  ];
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: path.join(root, 'e2e', app),
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

async function generate(app) {
  const runsDir = path.join(root, 'e2e', app, 'demo-runs');
  const appNames = app === 'backoffice' ? ['backoffice', 'shop'] : ['shop'];
  const projects = ['chromium', 'demo-failures'];

  console.log(`\n== ${app}: próba udana (1 worker, bez błędu w aplikacji, bez @demo-red) ==\n`);
  const okCode = await withApps(appNames, {}, () =>
    runPlaywright(app, path.join(runsDir, 'ok'), { workers: 1, repeatEach: 1, retries: 0, projects, extraArgs: ['--grep-invert', '@demo-red'] }),
  );
  console.log(`\n== ${app}: próba nieudana (4 workery, repeat-each=3, retries=1, SHOP_BUG_TOTAL=1) ==\n`);
  const failedCode = await withApps(appNames, { SHOP_BUG_TOTAL: '1' }, () =>
    runPlaywright(app, path.join(runsDir, 'failed'), { workers: 4, repeatEach: 3, retries: 1, projects }),
  );
  console.log(`\n${app}: ok kod ${okCode} (oczekiwane 0), failed kod ${failedCode} (oczekiwane 1)`);
  console.log(`Raporty: ${path.relative(root, runsDir)}/{ok,failed}/playwright-report, results.json, junit.xml, test-results (trace)`);
  return { okCode, failedCode };
}

async function main() {
  const results = {};
  for (const app of apps) results[app] = await generate(app);
  console.log('\nPodsumowanie:', JSON.stringify(results));
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
