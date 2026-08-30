import { expect, test } from '@playwright/test';
import path from 'node:path';

test('a new user can register and create a project', async ({ page }) => {
  const email = `portfolio-${Date.now()}-${test.info().project.name}@example.test`;
  await page.goto('/auth/register');

  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.getByLabel('Full name').fill('Portfolio Developer');
  await page.getByLabel('Work email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Portfolio!234');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Portfolio/ })).toBeVisible();
  if (test.info().project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
  }
  await page.getByRole('link', { name: 'Projects' }).click();
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByLabel('Project name').fill('Cloud interview lab');
  await page.getByLabel('Description').fill('A browser-tested full-stack portfolio project.');
  await page.getByRole('button', { name: 'Create project' }).click();

  await expect(page.getByRole('heading', { name: 'Cloud interview lab' })).toBeVisible();
});

test('auth navigation and mobile layout stay usable', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  const viewport = test.info().project.name.startsWith('mobile') ? 'mobile' : 'desktop';
  await page.screenshot({
    path: path.join('..', 'docs', 'screenshots', `login-${viewport}.png`),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.locator('.auth-card')).toBeInViewport();
});
