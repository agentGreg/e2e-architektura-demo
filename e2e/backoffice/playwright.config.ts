import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { ensureRunId } from '@demo/test-core';

process.env.NODE_OPTIONS = [process.env.NODE_OPTIONS, '--disable-warning=ExperimentalWarning'].filter(Boolean).join(' ');
ensureRunId();

const SHOP_URL = process.env.SHOP_URL ?? 'http://localhost:4100';
const BACKOFFICE_URL = process.env.BACKOFFICE_URL ?? 'http://localhost:4200';
const root = path.resolve(__dirname, '..', '..');
export const OPERATOR_STATE = path.join(__dirname, '.auth', 'operator.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  retryStrategy: 'isolated',
  failOnFlakyTests: !!process.env.CI,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['blob'], ['list']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BACKOFFICE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      grepInvert: /@exclusive|@quarantine/,
    },
    {
      name: 'serial-resources',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      grep: /@exclusive/,
      workers: 1,
    },
  ],
  // Backoffice steruje trybem konserwacji sklepu, więc testy potrzebują obu aplikacji.
  // PW_SKIP_WEBSERVER=1: aplikacje już działają (np. scripts/run-shards.mjs startuje je raz dla wielu shardów).
  webServer: process.env.PW_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: `node ${path.join(root, 'apps', 'backoffice', 'src', 'server.mjs')}`,
          url: `${BACKOFFICE_URL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
          cwd: root,
        },
        {
          command: `node ${path.join(root, 'apps', 'shop', 'src', 'server.mjs')}`,
          url: `${SHOP_URL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
          cwd: root,
        },
      ],
});
