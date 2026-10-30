import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--disable-warning=ExperimentalWarning'].filter(Boolean).join(' ');
// runId raz, w procesie głównym; workery i shardy dziedziczą go przez process.env (prefiks danych
// e2e_<run>_s<shard>_w<worker>_ od ćwiczenia 2A). Na CI numer buildu, lokalnie znacznik czasu.
process.env.E2E_RUN_ID ??= process.env.BUILD_BUILDID ?? process.env.GITHUB_RUN_ID ?? String(Date.now());

const SHOP_URL = process.env.SHOP_URL ?? 'http://localhost:4100';
const BACKOFFICE_URL = process.env.BACKOFFICE_URL ?? 'http://localhost:4200';
const root = path.resolve(__dirname, '..', '..');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['blob'], ['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BACKOFFICE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      // Materiał do ćwiczenia 3A (scripts/demo-failures.mjs): testy padające z różnych powodów.
      name: 'demo-failures',
      default: false,
      testDir: './demo-failures',
      timeout: 10_000,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Backoffice steruje trybem konserwacji sklepu, więc testy potrzebują obu aplikacji.
  // PW_SKIP_WEBSERVER=1: aplikacje już działają (np. scripts/run-shards.mjs startuje je raz dla wielu shardów).
  webServer: process.env.PW_SKIP_WEBSERVER ? undefined : [
    {
      command: `node "${path.join(root, 'apps', 'backoffice', 'src', 'server.mjs')}"`,
      url: `${BACKOFFICE_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      cwd: root,
    },
    {
      command: `node "${path.join(root, 'apps', 'shop', 'src', 'server.mjs')}"`,
      url: `${SHOP_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      cwd: root,
    },
  ],
});
