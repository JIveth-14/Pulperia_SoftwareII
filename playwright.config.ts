import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de interfaz (E2E) con navegadores reales.
 *
 * Levantan dos servidores:
 * - `e2e/fake-supabase.mjs`: Supabase falso con datos de prueba en memoria.
 * - La app compilada (`next build && next start`) apuntando a ese Supabase.
 *
 * Nunca se conectan a la base de datos real.
 */
const PUERTO_APP = 3100;
const PUERTO_SUPABASE = 54329;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  // Los tests comparten el Supabase falso y lo reinician: se corren en serie.
  fullyParallel: false,
  workers: 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PUERTO_APP}`,
    locale: 'es-HN',
    timezoneId: 'America/Tegucigalpa',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, grepInvert: /@movil/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grepInvert: /@movil/ },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grepInvert: /@movil/ },
    { name: 'movil', use: { ...devices['iPhone 13'] }, grep: /@movil/ },
  ],
  webServer: [
    {
      command: 'node e2e/fake-supabase.mjs',
      url: `http://localhost:${PUERTO_SUPABASE}/__salud`,
      reuseExistingServer: !CI,
      env: { FAKE_SUPABASE_PORT: String(PUERTO_SUPABASE) },
    },
    {
      command: `npm run build && npx next start -p ${PUERTO_APP}`,
      url: `http://localhost:${PUERTO_APP}/api/health`,
      reuseExistingServer: !CI,
      timeout: 300_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${PUERTO_SUPABASE}`,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'e2e-anon-key',
        CACHE_ENABLED: 'false',
      },
    },
  ],
});
