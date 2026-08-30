import { expect, test } from '@playwright/test';
import path from 'node:path';

test('a new user can register and create a project', async ({ page }) => {
  const email = `portfolio-${Date.now()}-${test.info().project.name}@example.test`;
  await page.goto('/auth/register');

  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  await page.getByLabel('Full name').fill('Portfolio Developer');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Portfolio!234');
  await page.getByRole('textbox', { name: 'Confirm password' }).fill('Different!234');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Passwords do not match')).toBeVisible();
  await page.getByRole('textbox', { name: 'Confirm password' }).fill('Portfolio!234');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Portfolio/ }),
  ).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole('heading', { name: /Good (morning|afternoon|evening), Portfolio/ }),
  ).toBeVisible();
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
  await expect(page.getByText('PERSONAL PROJECT', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'A simple place to keep my projects moving.' }),
  ).toBeVisible();
  await expect(page.locator('.story-copy p')).toContainText(
    /I built CloudTrack to keep ideas, tasks,\s*and progress organized in one place\./,
  );
  await expect(page.locator('.proof-card')).toContainText('Built for personal projects');
  await expect(page.locator('.avatar-stack')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByText('Sign in to pick up where you left off.')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveCSS('font-family', /Roboto/);
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCSS('font-family', /Roboto/);
  await expect(page.locator('body')).not.toContainText(
    /team|company|organization|workspace|collaboration/i,
  );
  const viewport = test.info().project.name.startsWith('mobile') ? 'mobile' : 'desktop';
  await page.screenshot({
    path: path.join('..', 'docs', 'screenshots', `login-${viewport}.png`),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.locator('.auth-card')).toBeInViewport();
});

test('portfolio demo reset link completes password recovery', async ({ page }) => {
  const email = `reset-${Date.now()}-${test.info().project.name}@example.test`;
  const originalPassword = 'Portfolio!234';
  const updatedPassword = 'Updated!567';

  await page.goto('/auth/register');
  await page.getByLabel('Full name').fill('Reset Demo');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(originalPassword);
  await page.getByRole('textbox', { name: 'Confirm password' }).fill(originalPassword);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.context().clearCookies();
  await page.goto('/auth/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send reset instructions' }).click();
  await expect(page.getByText('Portfolio demo mode')).toBeVisible();
  await page.getByRole('link', { name: 'Continue to reset password' }).click();
  await page.getByLabel('New password').fill(updatedPassword);
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText('Password updated. You can now sign in.')).toBeVisible();

  await page.getByRole('link', { name: 'Back to sign in' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(updatedPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
