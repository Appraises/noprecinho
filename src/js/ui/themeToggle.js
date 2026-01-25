import { setMapTheme } from '../map.js';

const THEME_KEY = 'precoja_theme';

/**
 * Initialize theme toggle functionality
 */
export function initThemeToggle() {
    // 1. Check saved preference or system preference
    const savedTheme = localStorage.getItem(THEME_KEY);
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Default to LIGHT if no preference (as requested "standard it stays on light mode")
    // If saved is 'dark', use dark.
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';

    setTheme(initialTheme);

    // 2. Attach click handler to toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
}

/**
 * Set the application theme
 * @param {string} theme 'light' or 'dark'
 */
function setTheme(theme) {
    // UI Theme
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Update Icon
    updateToggleIcon(theme);

    // Map Theme (Tile Layer)
    setMapTheme(theme);
}

function updateToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Sun icon (for switching TO light, or showing we are in dark? Usually show "Target" or "Current"?)
    // Usually: If Dark, show Sun (to switch to light). If Light, show Moon (to switch to dark).

    if (theme === 'dark') {
        // Show Sun
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
        `;
        btn.setAttribute('aria-label', 'Mudar para modo claro');
    } else {
        // Show Moon
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        `;
        btn.setAttribute('aria-label', 'Mudar para modo escuro');
    }
}

