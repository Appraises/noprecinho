/**
 * Search Autocomplete Component
 * Provides dropdown suggestions as user types
 */

import { api } from '../api.js';

let searchInput = null;
let dropdownElement = null;
let debounceTimer = null;
let isDropdownOpen = false;
let selectedIndex = -1;
let suggestions = [];

/**
 * Initialize search autocomplete
 * @param {string} inputSelector - CSS selector for search input
 * @param {Object} options - Configuration options
 */
export function initSearchAutocomplete(inputSelector, options = {}) {
    searchInput = document.querySelector(inputSelector);
    if (!searchInput) {
        console.warn('Search input not found:', inputSelector);
        return;
    }

    const {
        onSelect = () => { },
        minChars = 2,
        debounceMs = 300
    } = options;

    // Create dropdown
    createDropdown();

    // Bind events
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < minChars) {
            hideDropdown();
            return;
        }

        debounceTimer = setTimeout(() => fetchSuggestions(query), debounceMs);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (!isDropdownOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                navigateSuggestions(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                navigateSuggestions(-1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    selectSuggestion(suggestions[selectedIndex], onSelect);
                }
                break;
            case 'Escape':
                hideDropdown();
                break;
        }
    });

    searchInput.addEventListener('focus', () => {
        if (suggestions.length > 0) {
            showDropdown();
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdownElement.contains(e.target)) {
            hideDropdown();
        }
    });

    // Store callback
    searchInput._onSelect = onSelect;
}

/**
 * Create dropdown element
 */
function createDropdown() {
    dropdownElement = document.createElement('div');
    dropdownElement.className = 'search-autocomplete';
    dropdownElement.innerHTML = `
        <div class="search-autocomplete__content"></div>
    `;

    // Position relative to input
    const parent = searchInput.parentElement;
    parent.style.position = 'relative';
    parent.appendChild(dropdownElement);
}

/**
 * Fetch suggestions from API
 */
async function fetchSuggestions(query) {
    try {
        const data = await api.getSearchSuggestions(query);
        suggestions = [];

        // Combine all suggestions with type
        if (data.products?.length) {
            data.products.forEach(p => suggestions.push({ ...p, type: 'product' }));
        }
        if (data.stores?.length) {
            data.stores.forEach(s => suggestions.push({ ...s, type: 'store' }));
        }
        if (data.recent?.length) {
            data.recent.forEach(r => suggestions.push({ ...r, type: 'recent' }));
        }

        if (suggestions.length > 0) {
            renderSuggestions();
            showDropdown();
        } else {
            hideDropdown();
        }
    } catch (error) {
        console.error('Search suggestions error:', error);
        hideDropdown();
    }
}

/**
 * Render suggestions in dropdown
 */
function renderSuggestions() {
    const content = dropdownElement.querySelector('.search-autocomplete__content');

    let html = '';
    let currentType = '';

    suggestions.forEach((item, index) => {
        // Add section header if type changes
        if (item.type !== currentType) {
            currentType = item.type;
            const labels = {
                product: '🛒 Produtos',
                store: '🏪 Lojas',
                recent: '🕐 Buscas recentes'
            };
            html += `<div class="search-autocomplete__section">${labels[currentType] || currentType}</div>`;
        }

        html += renderSuggestionItem(item, index);
    });

    content.innerHTML = html;

    // Bind click events
    content.querySelectorAll('.search-autocomplete__item').forEach((el, idx) => {
        el.addEventListener('click', () => {
            selectSuggestion(suggestions[idx], searchInput._onSelect);
        });
        el.addEventListener('mouseenter', () => {
            selectedIndex = idx;
            updateSelectedState();
        });
    });
}

/**
 * Render individual suggestion item
 */
function renderSuggestionItem(item, index) {
    const isSelected = index === selectedIndex;

    if (item.type === 'product') {
        return `
            <div class="search-autocomplete__item ${isSelected ? 'search-autocomplete__item--selected' : ''}" data-index="${index}">
                <div class="search-autocomplete__icon">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="">` : '📦'}
                </div>
                <div class="search-autocomplete__info">
                    <div class="search-autocomplete__name">${highlightMatch(item.name)}</div>
                    ${item.brand ? `<div class="search-autocomplete__meta">${item.brand}</div>` : ''}
                </div>
                <div class="search-autocomplete__category">${item.category || ''}</div>
            </div>
        `;
    }

    if (item.type === 'store') {
        return `
            <div class="search-autocomplete__item ${isSelected ? 'search-autocomplete__item--selected' : ''}" data-index="${index}">
                <div class="search-autocomplete__icon">🏪</div>
                <div class="search-autocomplete__info">
                    <div class="search-autocomplete__name">${highlightMatch(item.name)}</div>
                    <div class="search-autocomplete__meta">${item.address || ''}</div>
                </div>
            </div>
        `;
    }

    // Recent search
    return `
        <div class="search-autocomplete__item ${isSelected ? 'search-autocomplete__item--selected' : ''}" data-index="${index}">
            <div class="search-autocomplete__icon">🔍</div>
            <div class="search-autocomplete__info">
                <div class="search-autocomplete__name">${highlightMatch(item.name)}</div>
            </div>
        </div>
    `;
}

/**
 * Highlight matching text
 */
function highlightMatch(text) {
    const query = searchInput.value.trim();
    if (!query) return text;

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Navigate suggestions with arrow keys
 */
function navigateSuggestions(direction) {
    selectedIndex += direction;

    if (selectedIndex < 0) selectedIndex = suggestions.length - 1;
    if (selectedIndex >= suggestions.length) selectedIndex = 0;

    updateSelectedState();
}

/**
 * Update visual selection state
 */
function updateSelectedState() {
    const items = dropdownElement.querySelectorAll('.search-autocomplete__item');
    items.forEach((item, idx) => {
        item.classList.toggle('search-autocomplete__item--selected', idx === selectedIndex);
    });

    // Scroll into view
    const selected = items[selectedIndex];
    if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
    }
}

/**
 * Select a suggestion
 */
function selectSuggestion(item, callback) {
    if (item.type === 'product' || item.type === 'recent') {
        searchInput.value = item.name;
    } else if (item.type === 'store') {
        searchInput.value = item.name;
    }

    hideDropdown();
    callback(item);
}

/**
 * Show dropdown
 */
function showDropdown() {
    dropdownElement.classList.add('search-autocomplete--open');
    isDropdownOpen = true;
}

/**
 * Hide dropdown
 */
function hideDropdown() {
    dropdownElement.classList.remove('search-autocomplete--open');
    isDropdownOpen = false;
    selectedIndex = -1;
}

/**
 * Clear suggestions
 */
export function clearSuggestions() {
    suggestions = [];
    hideDropdown();
}
