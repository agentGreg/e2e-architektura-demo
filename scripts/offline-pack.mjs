// Buduje paczkę offline na pendrive: repo (z gita) + node_modules + przeglądarki Playwright
// (PLAYWRIGHT_BROWSERS_PATH wewnątrz paczki). Używa `tar` (jest w Windows 10+ i macOS), nie `zip`.
//
// Użycie:   node scripts/offline-pack.mjs [--out offline] [--browsers-only]
// Wynik:    offline/e2e-architektura-demo-offline.zip  oraz  offline/START.md z instrukcją
//
// Na Windows rozpakuj do C:\e2e (nie do OneDrive) i uruchom instrukcje ze START.md.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const outDir = path.resolve(root, args.includes('--out') ? args[args.indexOf('--out') + 1] : 'offline');
const stage = path.join(outDir, 'stage');
const repoDir = path.join(stage, 'e2e-architektura-demo');
const browsersDir = path.join(stage, 'ms-playwright');

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { stdio: 'inherit', ...opts });
  if (r.status !== 0) {
    console.error(`Polecenie nie powiodło się: ${cmd} ${cmdArgs.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(repoDir, { recursive: true });

// 1. Repo z gita (bez artefaktów), wszystkie gałęzie.
run('git', ['clone', '--quiet', root, repoDir]);
run('git', ['-C', repoDir, 'fetch', '--quiet', 'origin', '+refs/heads/*:refs/remotes/origin/*']);

// 2. node_modules: instalacja offline-ready w klonie (pnpm store jest lokalny, kopiujemy katalog).
run('pnpm', ['install', '--frozen-lockfile'], { cwd: repoDir, shell: process.platform === 'win32' });

// 3. Przeglądarki do katalogu w paczce.
run('pnpm', ['exec', 'playwright', 'install', 'chromium'], {
  cwd: repoDir,
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersDir },
  shell: process.platform === 'win32',
});

fs.writeFileSync(
  path.join(stage, 'START.md'),
  `# Paczka offline: szkolenie 2.11.2026

1. Rozpakuj do katalogu lokalnego poza OneDrive, np. \`C:\\e2e\\\`.
2. W PowerShell (w katalogu \`e2e-architektura-demo\`):

\`\`\`powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "C:\\e2e\\ms-playwright"
corepack enable
pnpm test:smoke
\`\`\`

3. Jeśli Node jest starszy niż 22.13: użyj przenośnego Node 24 z katalogu \`node\\\` (jeśli jest w paczce):
   \`$env:PATH = "C:\\e2e\\node;" + $env:PATH\`.
`,
);

// 4. Archiwum (tar z auto-kompresją po rozszerzeniu .zip, działa w bsdtar na Windows i macOS).
fs.mkdirSync(outDir, { recursive: true });
const zip = path.join(outDir, 'e2e-architektura-demo-offline.zip');
fs.rmSync(zip, { force: true });
run('tar', ['-a', '-cf', zip, '-C', stage, '.']);
console.log(`\nPaczka: ${zip}\nPrzenośny Node 24 (zip z nodejs.org) dołóż ręcznie do katalogu stage/node przed spakowaniem, jeśli potrzebny.`);
