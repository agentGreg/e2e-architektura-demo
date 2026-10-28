// Scala bloby z `all-blob-reports/` w jeden raport HTML (`playwright-report/`) i JUnit.
// To samo, co robi zadanie scalające w pipeline po macierzy shardów.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(import.meta.dirname, '..');
const blobs = path.join(root, 'all-blob-reports');
if (!fs.existsSync(blobs) || fs.readdirSync(blobs).length === 0) {
  console.error('Brak blobów w all-blob-reports/. Najpierw: pnpm test:shard');
  process.exit(1);
}
const cli = path.join(root, 'node_modules', '@playwright', 'test', 'cli.js');
const r = spawnSync(process.execPath, [cli, 'merge-reports', '--reporter', 'html,junit', blobs], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_JUNIT_OUTPUT_FILE: path.join(root, 'playwright-report', 'junit.xml') },
});
if (r.status === 0) console.log('\nRaport: playwright-report/index.html (pnpm exec playwright show-report)');
process.exit(r.status ?? 1);
