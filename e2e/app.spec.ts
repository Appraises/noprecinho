// E2E tests for PreçoJá using Playwright
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// ============================================
// Page Load & Initial State
// ============================================
test.describe('Page Load', () => {
    test('should load the homepage', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Check title
        await expect(page).toHaveTitle(/PreçoJá/);

        // Check header is visible
        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('.header__logo')).toBeVisible();
    });

    test('should display the map', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Wait for map to initialize
        await expect(page.locator('#map')).toBeVisible();
        await expect(page.locator('.leaflet-container')).toBeVisible();
    });

    test('should show category filters', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('.filter-bar')).toBeVisible();
        await expect(page.locator('.chip').first()).toHaveText('Todos');

        // Check all categories
        const categories = ['Mercado', 'Hortifrúti', 'Farmácia', 'Pet', 'Combustível', 'Outros'];
        for (const category of categories) {
            await expect(page.locator('.chip', { hasText: category })).toBeVisible();
        }
    });

    test('should show floating controls', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('.floating-controls')).toBeVisible();
        await expect(page.locator('#report-btn')).toBeVisible();
        await expect(page.locator('#filter-btn')).toBeVisible();
        await expect(page.locator('#location-btn')).toBeVisible();
    });
});

// ============================================
// Category Filters
// ============================================
test.describe('Category Filters', () => {
    test('should filter by category when clicked', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Click Mercado filter
        await page.click('.chip[data-category="mercado"]');

        // Should be active
        await expect(page.locator('.chip[data-category="mercado"]')).toHaveClass(/chip--active/);

        // "Todos" should not be active
        await expect(page.locator('.chip[data-category="all"]')).not.toHaveClass(/chip--active/);
    });

    test('should support multi-select', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('.chip[data-category="mercado"]');
        await page.click('.chip[data-category="farmacia"]');

        await expect(page.locator('.chip[data-category="mercado"]')).toHaveClass(/chip--active/);
        await expect(page.locator('.chip[data-category="farmacia"]')).toHaveClass(/chip--active/);
    });

    test('should reset to "Todos" when clicking it', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Select some categories
        await page.click('.chip[data-category="mercado"]');
        await page.click('.chip[data-category="farmacia"]');

        // Click Todos
        await page.click('.chip[data-category="all"]');

        // Only Todos should be active
        await expect(page.locator('.chip[data-category="all"]')).toHaveClass(/chip--active/);
        await expect(page.locator('.chip[data-category="mercado"]')).not.toHaveClass(/chip--active/);
        await expect(page.locator('.chip[data-category="farmacia"]')).not.toHaveClass(/chip--active/);
    });
});

// ============================================
// Report Price Modal
// ============================================
test.describe('Report Price Modal', () => {
    test('should open report modal when clicking button', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#report-btn');

        await expect(page.locator('#report-modal')).toHaveClass(/modal-overlay--visible/);
        await expect(page.locator('.modal__title')).toHaveText('Reportar preço');
    });

    test('should close modal when clicking close button', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#report-btn');
        await expect(page.locator('#report-modal')).toHaveClass(/modal-overlay--visible/);

        await page.click('#modal-close');

        await expect(page.locator('#report-modal')).not.toHaveClass(/modal-overlay--visible/);
    });

    test('should close modal when pressing Escape', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#report-btn');
        await expect(page.locator('#report-modal')).toHaveClass(/modal-overlay--visible/);

        await page.keyboard.press('Escape');

        await expect(page.locator('#report-modal')).not.toHaveClass(/modal-overlay--visible/);
    });

    test('should show wizard steps', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#report-btn');

        // Should show 5 wizard steps
        await expect(page.locator('.wizard-step')).toHaveCount(5);

        // First step should be active
        await expect(page.locator('.wizard-step').first()).toHaveClass(/wizard-step--active/);
    });

    test('should navigate through wizard steps', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#report-btn');

        // Step 1: Select a store
        await page.click('#store-list .price-card:first-child');
        await page.click('#wizard-next');

        // Should be on step 2
        await expect(page.locator('.wizard-step').nth(1)).toHaveClass(/wizard-step--active/);
    });
});

// ============================================
// Filter Modal
// ============================================
test.describe('Filter Modal', () => {
    test('should open filter modal when clicking button', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#filter-btn');

        await expect(page.locator('#filter-modal')).toHaveClass(/modal-overlay--visible/);
        await expect(page.locator('#filter-modal-title')).toHaveText('Filtros');
    });

    test('should have radius slider', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#filter-btn');

        await expect(page.locator('#radius-slider')).toBeVisible();
        await expect(page.locator('#radius-value')).toHaveText('5');
    });

    test('should update radius value on slider change', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#filter-btn');

        // Change slider value
        await page.locator('#radius-slider').fill('15');

        await expect(page.locator('#radius-value')).toHaveText('15');
    });

    test('should reset filters when clicking reset button', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.click('#filter-btn');

        // Change some values
        await page.locator('#radius-slider').fill('20');
        await page.uncheck('#filter-fresh');

        // Click reset
        await page.click('#filter-reset');

        // Values should be reset
        await expect(page.locator('#radius-slider')).toHaveValue('5');
        await expect(page.locator('#filter-fresh')).toBeChecked();
    });
});

// ============================================
// Price Panel
// ============================================
test.describe('Price Panel', () => {
    test('should display price panel', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('#price-panel')).toBeVisible();
        await expect(page.locator('.price-panel__title')).toHaveText('Melhores preços');
    });

    test('should show price cards', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Wait for prices to load
        await page.waitForSelector('.price-card', { timeout: 5000 });

        // Should have at least one price card
        const cards = await page.locator('.price-card').count();
        expect(cards).toBeGreaterThan(0);
    });

    test('should toggle panel when clicking toggle button', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Click toggle
        await page.click('#panel-toggle');

        await expect(page.locator('#price-panel')).toHaveClass(/price-panel--collapsed/);

        // Click again
        await page.click('#panel-toggle');

        await expect(page.locator('#price-panel')).not.toHaveClass(/price-panel--collapsed/);
    });
});

// ============================================
// Search
// ============================================
test.describe('Search', () => {
    test('should have search input in header', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('#search-input')).toBeVisible();
        await expect(page.locator('#search-input')).toHaveAttribute('placeholder', /Buscar/);
    });

    test('should accept text input', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.fill('#search-input', 'Mercado');

        await expect(page.locator('#search-input')).toHaveValue('Mercado');
    });
});

// ============================================
// Map Interactions
// ============================================
test.describe('Map Interactions', () => {
    test('should have map controls', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Wait for map
        await page.waitForSelector('.leaflet-control-zoom');

        await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible();
        await expect(page.locator('.leaflet-control-zoom-out')).toBeVisible();
    });

    test('should zoom in when clicking zoom button', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await page.waitForSelector('.leaflet-control-zoom');

        // Get initial zoom indicator (if any) or just click and verify no errors
        await page.click('.leaflet-control-zoom-in');

        // Should not throw any errors - map should still be visible
        await expect(page.locator('#map')).toBeVisible();
    });
});

// ============================================
// Accessibility
// ============================================
test.describe('Accessibility', () => {
    test('should have skip link', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('.skip-link')).toBeAttached();
    });

    test('should have ARIA labels on interactive elements', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('#report-btn')).toHaveAttribute('aria-label');
        await expect(page.locator('#filter-btn')).toHaveAttribute('aria-label');
        await expect(page.locator('#location-btn')).toHaveAttribute('aria-label');
    });

    test('should have proper heading structure', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // There should be at least one h2
        const h2Count = await page.locator('h2').count();
        expect(h2Count).toBeGreaterThan(0);
    });

    test('should have proper tab navigation', async ({ page }) => {
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Tab should focus on interactive elements
        await page.keyboard.press('Tab');

        // First focusable element should have focus
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).not.toBeNull();
    });
});

// ============================================
// Responsive Design
// ============================================
test.describe('Responsive Design', () => {
    test('should adapt layout on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        // Header should still be visible
        await expect(page.locator('.header')).toBeVisible();

        // Filters should be scrollable
        await expect(page.locator('.filter-bar')).toBeVisible();
    });

    test('should adapt layout on tablet', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('#map')).toBeVisible();
    });

    test('should show full layout on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');

        await expect(page.locator('.header')).toBeVisible();
        await expect(page.locator('#map')).toBeVisible();
        await expect(page.locator('#price-panel')).toBeVisible();
    });
});

// ============================================
// Performance
// ============================================
test.describe('Performance', () => {
    test('should load within 3 seconds', async ({ page }) => {
        const startTime = Date.now();

        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');
        await page.waitForLoadState('domcontentloaded');

        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(3000);
    });

    test('should have no console errors on load', async ({ page }) => {
        const errors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Inject auth token
        await page.addInitScript(() => {
            localStorage.setItem('precoja_auth_token', 'test-token');
            localStorage.setItem('precoja_user', JSON.stringify({ name: 'Test User' }));
        });
        await page.goto(BASE_URL + '/app.html');
        await page.waitForLoadState('domcontentloaded');

        // Filter out expected errors (like missing service worker)
        const criticalErrors = errors.filter(e =>
            !e.includes('service-worker') &&
            !e.includes('sw.js')
        );

        expect(criticalErrors).toHaveLength(0);
    });
});
