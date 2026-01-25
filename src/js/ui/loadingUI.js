/**
 * Loading and Error UI Module
 * Provides loading spinners, error banners, and offline indicators
 */

let errorBanner = null;
let offlineBanner = null;
let isOffline = false;

/**
 * Initialize loading UI elements
 */
export function initLoadingUI() {
    // Create error banner
    errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    errorBanner.innerHTML = `
        <span class="error-banner__icon">⚠️</span>
        <span class="error-banner__message"></span>
        <button class="error-banner__close" aria-label="Fechar">×</button>
    `;
    document.body.prepend(errorBanner);

    errorBanner.querySelector('.error-banner__close').addEventListener('click', hideError);

    // Create offline banner
    offlineBanner = document.createElement('div');
    offlineBanner.className = 'offline-banner';
    offlineBanner.innerHTML = `
        <span>📡</span>
        <span>Modo offline - usando dados locais</span>
    `;
    document.body.appendChild(offlineBanner);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
        handleOffline();
    }
}

/**
 * Show error banner
 * @param {string} message - Error message to display
 * @param {number} duration - Auto-hide duration in ms (0 = manual close)
 */
export function showError(message, duration = 5000) {
    if (!errorBanner) return;

    errorBanner.querySelector('.error-banner__message').textContent = message;
    errorBanner.classList.add('visible');

    if (duration > 0) {
        setTimeout(hideError, duration);
    }
}

/**
 * Hide error banner
 */
export function hideError() {
    if (errorBanner) {
        errorBanner.classList.remove('visible');
    }
}

/**
 * Handle going online
 */
function handleOnline() {
    isOffline = false;
    offlineBanner?.classList.remove('visible');
}

/**
 * Handle going offline
 */
function handleOffline() {
    isOffline = true;
    offlineBanner?.classList.add('visible');
}

/**
 * Check if currently offline
 * @returns {boolean}
 */
export function isAppOffline() {
    return isOffline || !navigator.onLine;
}

/**
 * Show loading overlay on an element
 * @param {HTMLElement} element - Element to show overlay on
 * @returns {HTMLElement} - The overlay element
 */
export function showLoading(element) {
    let overlay = element.querySelector('.loading-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="spinner"></div>';
        element.style.position = 'relative';
        element.appendChild(overlay);
    }

    overlay.classList.add('visible');
    return overlay;
}

/**
 * Hide loading overlay on an element
 * @param {HTMLElement} element - Element to hide overlay from
 */
export function hideLoading(element) {
    const overlay = element.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('visible');
    }
}

/**
 * Create skeleton loading cards
 * @param {number} count - Number of skeleton cards
 * @returns {string} - HTML string
 */
export function createSkeletonCards(count = 3) {
    return Array(count).fill(`
        <div class="skeleton-card">
            <div class="skeleton skeleton-text--lg"></div>
            <div class="skeleton skeleton-text" style="width: 80%;"></div>
            <div class="skeleton skeleton-text--sm"></div>
        </div>
    `).join('');
}

/**
 * Create empty state HTML
 * @param {string} icon - Emoji icon
 * @param {string} title - Title text
 * @param {string} description - Description text
 * @returns {string} - HTML string
 */
export function createEmptyState(icon, title, description) {
    return `
        <div class="empty-state">
            <div class="empty-state__icon">${icon}</div>
            <div class="empty-state__title">${title}</div>
            <div class="empty-state__description">${description}</div>
        </div>
    `;
}

/**
 * Set button to loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} loading - Whether to show loading state
 */
export function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('btn--loading');
        button.disabled = true;
    } else {
        button.classList.remove('btn--loading');
        button.disabled = false;
    }
}
