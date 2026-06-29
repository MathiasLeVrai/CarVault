const { defineConfig, devices } = require('@playwright/test');

// Ne jamais réutiliser backend/.env (Neon prod) en local — uniquement la DB E2E.
const E2E_DATABASE_URL_CI =
  'postgresql://postgres:postgres@127.0.0.1:5432/carvault_e2e';
const E2E_DATABASE_URL_LOCAL =
  `postgresql://${process.env.USER || 'postgres'}@127.0.0.1:5432/carvault_e2e`;

const E2E_API_URL = 'http://127.0.0.1:3001/api';

const backendEnv = {
  DATABASE_URL: process.env.CI
    ? (process.env.DATABASE_URL || E2E_DATABASE_URL_CI)
    : E2E_DATABASE_URL_LOCAL,
  JWT_SECRET: process.env.JWT_SECRET || 'e2e-local-secret',
  NODE_ENV: 'test',
  PORT: '3001',
  CORS_ORIGIN: 'http://127.0.0.1:5173,http://localhost:5173',
};

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  outputDir: 'e2e/test-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/reports/html', open: 'never' }],
    ['junit', { outputFile: 'e2e/reports/junit.xml' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'bash e2e/start-backend.sh',
      url: 'http://127.0.0.1:3001/api/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: backendEnv,
    },
    {
      command: 'cd frontend && npm run dev -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        // Écrase frontend/.env (carvio.fr) pendant les tests locaux / CI.
        VITE_API_URL: E2E_API_URL,
      },
    },
  ],
});
