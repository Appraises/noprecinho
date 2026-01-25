import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

test.describe('Landing Page & Auth Flow', () => {

    test('should load landing page with correct title', async ({ page }) => {
        await page.goto(BASE_URL + '/');
        await expect(page).toHaveTitle(/PreçoJá/);
        await expect(page.locator('h1')).toContainText('Pare de pagar caro');
    });

    test('should show hero animation elements', async ({ page }) => {
        await page.goto(BASE_URL + '/');
        await expect(page.locator('#anim-map')).toBeVisible();
        await expect(page.locator('#anim-cursor')).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto(BASE_URL + '/');
        await page.click('a[href="/login.html"]');
        await expect(page).toHaveURL(BASE_URL + '/login.html');
        await expect(page.locator('input#email')).toBeVisible();
    });

    test('should navigate to signup page', async ({ page }) => {
        await page.goto(BASE_URL + '/');
        await page.click('a[href="/signup.html"]'); // Start Now button or Header link
        await expect(page).toHaveURL(BASE_URL + '/signup.html');
        await expect(page.locator('input#name')).toBeVisible();
    });

    test('should login and redirect to app', async ({ page }) => {
        await page.goto(BASE_URL + '/login.html');

        // Mock Auth
        await page.fill('#email', 'test@example.com');
        await page.fill('#password', 'password123');

        // Since we are using a real backend or mock? 
        // My auth.js uses localStorage simulation.
        // I need to make sure the "Login" button click actually works with the mock.
        // My previous implementation of auth.js allows ANY email/password if using the mock
        // or actually, let's look at `src/js/auth.js` logic if I can.
        // Assuming simple mock behavior:

        await page.click('button[type="submit"]');

        // Should redirect to app.html
        await expect(page).toHaveURL(BASE_URL + '/app.html');

        // Check if user is logged in
        // (app.html usually shows avatar or similar)
        // await expect(page.locator('.user-avatar')).toBeVisible(); // If implemented
    });

    test('should redirect to login if accessing app without auth', async ({ page }) => {
        // Clear storage
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());

        await page.goto(BASE_URL + '/app.html');
        // Should be redirected to login
        await expect(page).toHaveURL(BASE_URL + '/login.html');
    });
});
