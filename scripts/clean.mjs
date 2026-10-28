// Czyści artefakty testów (zamiast `rm -rf`, żeby działało tak samo na Windows i macOS).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const targets = [
  'blob-report',
  'all-blob-reports',
  'playwright-report',
  'e2e/shop/test-results',
  'e2e/shop/playwright-report',
  'e2e/shop/blob-report',
  'e2e/backoffice/test-results',
  'e2e/backoffice/playwright-report',
  'e2e/backoffice/blob-report',
];
for (const t of targets) {
  const p = path.join(root, t);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log('usunięto', t);
  }
}
