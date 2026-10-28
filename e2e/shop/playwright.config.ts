import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

// node:sqlite na Node 22/24 wypisuje ExperimentalWarning przy imporcie; wyciszamy tylko to.
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--disable-warning=ExperimentalWarning'].filter(Boolean).join(' ');

const SHOP_URL = process.env.SHOP_URL ?? 'http://localhost:4100';
const root = path.resolve(__dirname, '..', '..');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries tylko na CI; lokalnie 0, żeby nie maskować kolizji.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['blob'], ['list']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: SHOP_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Trzy warianty jednego testu (blok 1). Nie biegną domyślnie (testProject.default, 1.64):
      // `playwright test --project=examples`.
      name: 'examples',
      default: false,
      testDir: './examples',
      workers: 1,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Materiał do ćwiczenia 3A: testy padające z różnych powodów (scripts/demo-failures.mjs).
      name: 'demo-failures',
      default: false,
      testDir: './demo-failures',
      timeout: 10_000,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // PW_SKIP_WEBSERVER=1: aplikacje już działają (np. scripts/run-shards.mjs startuje je raz dla wielu shardów).
  webServer: process.env.PW_SKIP_WEBSERVER ? undefined : {
    command: `node ${path.join(root, 'apps', 'shop', 'src', 'server.mjs')}`,
    url: `${SHOP_URL}/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    cwd: root,
  },
});
