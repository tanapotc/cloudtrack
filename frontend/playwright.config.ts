import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: process.platform === 'win32' ? 'chrome' : undefined,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'dotnet run --project src/CloudTrack.Api --configuration Release --urls http://localhost:5080',
      cwd: '../backend',
      url: 'http://localhost:5080/health',
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
      env: {
        Jwt__SigningKey: 'playwright-only-signing-key-with-32-characters',
        ASPNETCORE_ENVIRONMENT: 'Development',
        RateLimiting__AuthPermitLimit: '100',
      },
    },
    {
      command: 'npm start -- --host localhost --port 4200',
      url: 'http://localhost:4200/auth/login',
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
