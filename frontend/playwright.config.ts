import { defineConfig, devices } from '@playwright/test';

const e2eSqlConnection =
  process.env['CLOUDTRACK_E2E_SQLSERVER'] ??
  'Server=(localdb)\\MSSQLLocalDB;Initial Catalog=CloudTrack.E2E;Integrated Security=True;Encrypt=False;TrustServerCertificate=True;MultipleActiveResultSets=True';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // E2E projects share one disposable SQL Server database, including mutable role assignments.
  // Keep browser projects serial so a database write in one viewport cannot delay another one.
  workers: 1,
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
      command:
        'dotnet run --project src/CloudTrack.Api --configuration Release --urls http://localhost:5080',
      cwd: '../backend',
      url: 'http://localhost:5080/health',
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
      env: {
        Jwt__SigningKey: 'playwright-only-signing-key-with-32-characters',
        ASPNETCORE_ENVIRONMENT: 'Development',
        RateLimiting__AuthPermitLimit: '100',
        Seed__AdminEmail: 'admin@playwright.test',
        Seed__AdminPassword: 'PlaywrightAdmin!234',
        ConnectionStrings__DefaultConnection: e2eSqlConnection,
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
