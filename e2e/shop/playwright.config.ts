import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { ensureRunId } from '@demo/test-core';

// node:sqlite na Node 22/24 wypisuje ExperimentalWarning przy imporcie; wyciszamy tylko to.
process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--disable-warning=ExperimentalWarning'].filter(Boolean).join(' ');
// runId raz, w procesie głównym; workery dziedziczą przez process.env.
ensureRunId();

const SHOP_URL = process.env.SHOP_URL ?? 'http://localhost:4100';
const root = path.resolve(__dirname, '..', '..');
export const ADMIN_STATE = path.join(__dirname, '.auth', 'admin.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries tylko na CI; lokalnie 0, żeby nie maskować kolizji. 'isolated' (1.62): retry na końcu,
  // pojedynczo w jednym workerze, więc odróżnia kolizję od prawdziwego błędu.
  retries: process.env.CI ? 2 : 0,
  retryStrategy: 'isolated',
  failOnFlakyTests: !!process.env.CI,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['blob'], ['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: SHOP_URL,
    trace: 'on-first-retry',
  },
  projects: [
    // Projekt setup: storageState per rola (tu: admin). Zamiast globalSetup: ma fixtures, trace i wpis w raporcie.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      grepInvert: /@exclusive|@quarantine/,
    },
    {
      // Zasób jest jeden i test długi: osobny projekt z workers: 1, poza główną macierzą.
      name: 'serial-resources',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      grep: /@exclusive/,
      workers: 1,
    },
    {
      // Kwarantanna: biegnie osobno, nie wpływa na status; wyjście = 10 zielonych --repeat-each.
      name: 'quarantine',
      default: false,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      grep: /@quarantine/,
    },
    {
      // Trzy warianty jednego testu (blok 1). `playwright test --project=examples`.
      name: 'examples',
      default: false,
      testDir: './examples',
      workers: 1,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },
    {
      // Materiał do ćwiczenia 3A: testy padające z różnych powodów (scripts/demo-failures.mjs).
      name: 'demo-failures',
      default: false,
      testDir: './demo-failures',
      timeout: 10_000,
      use: { ...devices['Desktop Chrome'], storageState: { cookies: [], origins: [] } },
    },
  ],
  // PW_SKIP_WEBSERVER=1: aplikacje już działają (np. scripts/run-shards.mjs startuje je raz dla wielu shardów).
  webServer: process.env.PW_SKIP_WEBSERVER
    ? undefined
    : {
        command: `node "${path.join(root, 'apps', 'shop', 'src', 'server.mjs')}"`,
        url: `${SHOP_URL}/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        cwd: root,
      },
});
