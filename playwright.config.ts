import { defineConfig, devices } from '@playwright/test';

const basePath = process.env.GITHUB_ACTIONS === 'true' ? '/eveningstar-wesbite/' : '/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:4173${basePath}`,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'pnpm preview --host 127.0.0.1 --port 4173',
    url: `http://127.0.0.1:4173${basePath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 412, height: 915 } }
    }
  ]
});
