import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  /* Jalankan test secara paralel */
  fullyParallel: true,
  /* Gagal jika ada 'config.push' di kode */
  forbidOnly: !!process.env.CI,
  /* Ulangi jika gagal */
  retries: process.env.CI ? 2 : 0,
  /* Jumlah worker */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter yang digunakan */
  reporter: 'html',
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL untuk pengetesan */
    baseURL: 'http://localhost:5173',

    /* Ambil trace saat gagal */
    trace: 'on-first-retry',
    
    /* Ganti video/screenshot sesuai kebutuhan */
    screenshot: 'only-on-failure',
    video: 'on',
  },

  /* Browser yang akan dites */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Jalankan server lokal sebelum test dimulai */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
