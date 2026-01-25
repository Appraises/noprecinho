/**
 * API Client for PreçoJá backend
 */

import { auth } from './auth.js';

const API_BASE = 'http://localhost:3000/api';

/**
 * Make an authenticated API request
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>}
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...auth.getAuthHeaders(),
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
    }

    return data;
}

// ==================== STORES ====================

/**
 * Fetch stores from API
 * @param {Object} filters - Optional filters (category, lat, lng, radius)
 * @returns {Promise<Array>}
 */
export async function fetchStores(filters = {}) {
    const params = new URLSearchParams();

    if (filters.category && filters.category !== 'all') {
        params.set('category', filters.category);
    }
    if (filters.lat) params.set('lat', filters.lat.toString());
    if (filters.lng) params.set('lng', filters.lng.toString());
    if (filters.radius) params.set('radius', filters.radius.toString());
    if (filters.openNow) params.set('openNow', 'true');
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());

    const query = params.toString();
    return apiRequest(`/stores${query ? `?${query}` : ''}`);
}

/**
 * Fetch a single store by ID
 * @param {string} storeId 
 * @returns {Promise<Object>}
 */
export async function fetchStore(storeId) {
    return apiRequest(`/stores/${storeId}`);
}

/**
 * Create a new store
 * @param {Object} storeData 
 * @returns {Promise<Object>}
 */
export async function createStore(storeData) {
    return apiRequest('/stores', {
        method: 'POST',
        body: JSON.stringify(storeData),
    });
}

// ==================== PRICES ====================

/**
 * Fetch prices from API
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export async function fetchPrices(filters = {}) {
    const params = new URLSearchParams();

    if (filters.storeId) params.set('storeId', filters.storeId);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.product) params.set('product', filters.product);
    if (filters.freshOnly) params.set('freshOnly', 'true');
    if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());

    const query = params.toString();
    return apiRequest(`/prices${query ? `?${query}` : ''}`);
}

/**
 * Submit a new price
 * @param {Object} priceData - Price data to submit
 * @returns {Promise<Object>}
 */
export async function submitPrice(priceData) {
    return apiRequest('/prices', {
        method: 'POST',
        body: JSON.stringify(priceData),
    });
}

/**
 * Vote on a price
 * @param {string} priceId 
 * @param {boolean} isUpvote 
 * @returns {Promise<Object>}
 */
export async function votePrice(priceId, isUpvote) {
    return apiRequest(`/prices/${priceId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ isUpvote }),
    });
}

// ==================== VALIDATION ====================

/**
 * Validate/confirm a price
 * @param {string} priceId 
 * @param {boolean} isCorrect - true = confirm, false = dispute
 * @param {string} comment - Optional comment
 * @returns {Promise<Object>}
 */
export async function validatePrice(priceId, isCorrect, comment = null) {
    return apiRequest(`/validation/${priceId}`, {
        method: 'POST',
        body: JSON.stringify({ isCorrect, comment }),
    });
}

/**
 * Get validations for a price
 * @param {string} priceId 
 * @returns {Promise<Object>} - { validations, stats }
 */
export async function fetchPriceValidations(priceId) {
    return apiRequest(`/validation/${priceId}`);
}

// ==================== PRODUCTS & SEARCH ====================

/**
 * Search products across all stores
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>}
 */
export async function searchProducts(query, filters = {}) {
    const params = new URLSearchParams({ q: query });
    if (filters.category) params.set('category', filters.category);
    if (filters.limit) params.set('limit', filters.limit.toString());

    return apiRequest(`/products/search?${params.toString()}`);
}

/**
 * Get price comparison for a product
 * @param {string} productName 
 * @returns {Promise<Object>} - { product, comparison, stats }
 */
export async function compareProductPrices(productName) {
    const params = new URLSearchParams({ product: productName });
    return apiRequest(`/products/compare?${params.toString()}`);
}

/**
 * Create or get product in catalog
 * @param {Object} productData 
 * @returns {Promise<Object>}
 */
export async function createProduct(productData) {
    return apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
    });
}

// ==================== SHOPPING LISTS ====================

/**
 * Fetch user's shopping lists
 * @returns {Promise<Array>}
 */
export async function fetchShoppingLists() {
    return apiRequest('/shopping-lists');
}

/**
 * Fetch a single shopping list with best prices
 * @param {string} listId 
 * @returns {Promise<Object>}
 */
export async function fetchShoppingList(listId) {
    return apiRequest(`/shopping-lists/${listId}`);
}

/**
 * Create a new shopping list
 * @param {string} name 
 * @param {Array} items - Optional initial items
 * @returns {Promise<Object>}
 */
export async function createShoppingList(name, items = []) {
    return apiRequest('/shopping-lists', {
        method: 'POST',
        body: JSON.stringify({ name, items }),
    });
}

/**
 * Add item to shopping list
 * @param {string} listId 
 * @param {Object} item - { productName, quantity, unit, notes }
 * @returns {Promise<Object>}
 */
export async function addShoppingListItem(listId, item) {
    return apiRequest(`/shopping-lists/${listId}/items`, {
        method: 'POST',
        body: JSON.stringify(item),
    });
}

/**
 * Update shopping list item
 * @param {string} listId 
 * @param {string} itemId 
 * @param {Object} updates - { isChecked, quantity, notes }
 * @returns {Promise<Object>}
 */
export async function updateShoppingListItem(listId, itemId, updates) {
    return apiRequest(`/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

/**
 * Delete shopping list item
 * @param {string} listId 
 * @param {string} itemId 
 * @returns {Promise<void>}
 */
export async function deleteShoppingListItem(listId, itemId) {
    return apiRequest(`/shopping-lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
    });
}

/**
 * Delete shopping list
 * @param {string} listId 
 * @returns {Promise<void>}
 */
export async function deleteShoppingList(listId) {
    return apiRequest(`/shopping-lists/${listId}`, {
        method: 'DELETE',
    });
}

/**
 * Optimize shopping list - find best store(s)
 * @param {string} listId 
 * @param {Object} options - { savingsThreshold }
 * @returns {Promise<Object>} - { items, singleStoreOptions, twoStoreSplit, recommendation }
 */
export async function optimizeShoppingList(listId, options = {}) {
    return apiRequest(`/shopping-lists/${listId}/optimize`, {
        method: 'POST',
        body: JSON.stringify(options),
    });
}

// ==================== USER ====================

/**
 * Get current user's submitted prices
 * @returns {Promise<Array>}
 */
export async function fetchUserPrices() {
    return apiRequest('/auth/me/prices');
}

/**
 * Get current user profile with stats
 * @returns {Promise<Object>}
 */
export async function fetchUserProfile() {
    return apiRequest('/auth/me');
}

// ==================== UTILITY ====================

/**
 * Check if API is available
 * @returns {Promise<boolean>}
 */
export async function isApiAvailable() {
    try {
        const response = await fetch(`${API_BASE.replace('/api', '')}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

// ==================== FAVORITES ====================

/**
 * Get user's favorite stores
 * @returns {Promise<Array>}
 */
export async function getFavorites() {
    return apiRequest('/favorites');
}

/**
 * Add store to favorites
 * @param {string} storeId 
 * @returns {Promise<Object>}
 */
export async function addFavorite(storeId) {
    return apiRequest(`/favorites/${storeId}`, { method: 'POST' });
}

/**
 * Remove store from favorites
 * @param {string} storeId 
 * @returns {Promise<void>}
 */
export async function removeFavorite(storeId) {
    return apiRequest(`/favorites/${storeId}`, { method: 'DELETE' });
}

/**
 * Check if store is favorited
 * @param {string} storeId 
 * @returns {Promise<{isFavorite: boolean}>}
 */
export async function checkFavorite(storeId) {
    return apiRequest(`/favorites/${storeId}/check`);
}

// ==================== SEARCH ====================

/**
 * Get search suggestions (autocomplete)
 * @param {string} query 
 * @returns {Promise<{products: Array, stores: Array, recent: Array}>}
 */
export async function getSearchSuggestions(query) {
    return apiRequest(`/search/suggestions?q=${encodeURIComponent(query)}`);
}

/**
 * Full search with prices
 * @param {string} query 
 * @param {Object} options 
 * @returns {Promise<{results: Array, total: number}>}
 */
export async function search(query, options = {}) {
    const params = new URLSearchParams({ q: query });
    if (options.category) params.set('category', options.category);
    if (options.page) params.set('page', options.page.toString());
    if (options.limit) params.set('limit', options.limit.toString());
    return apiRequest(`/search?${params.toString()}`);
}

// ==================== LIST SHARING ====================

/**
 * Share shopping list with another user
 * @param {string} listId 
 * @param {string} email 
 * @param {string} permission - 'view' or 'edit'
 * @returns {Promise<Object>}
 */
export async function shareShoppingList(listId, email, permission = 'edit') {
    return apiRequest(`/shopping-lists/${listId}/share`, {
        method: 'POST',
        body: JSON.stringify({ email, permission })
    });
}

/**
 * Get list shares
 * @param {string} listId 
 * @returns {Promise<Array>}
 */
export async function getListShares(listId) {
    return apiRequest(`/shopping-lists/${listId}/shares`);
}

/**
 * Remove list share
 * @param {string} listId 
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function removeListShare(listId, email) {
    return apiRequest(`/shopping-lists/${listId}/share/${encodeURIComponent(email)}`, {
        method: 'DELETE'
    });
}

/**
 * Get lists shared with me
 * @returns {Promise<Array>}
 */
export async function getSharedLists() {
    return apiRequest('/shopping-lists/shared');
}

export const api = {
    // Stores
    fetchStores,
    fetchStore,
    createStore,
    // Prices
    fetchPrices,
    submitPrice,
    votePrice,
    // Validation
    validatePrice,
    fetchPriceValidations,
    // Products & Search
    searchProducts,
    compareProductPrices,
    createProduct,
    getSearchSuggestions,
    search,
    // Shopping Lists
    fetchShoppingLists,
    fetchShoppingList,
    createShoppingList,
    addShoppingListItem,
    updateShoppingListItem,
    deleteShoppingListItem,
    deleteShoppingList,
    optimizeShoppingList,
    shareShoppingList,
    getListShares,
    removeListShare,
    getSharedLists,
    // Favorites
    getFavorites,
    addFavorite,
    removeFavorite,
    checkFavorite,
    // User
    fetchUserPrices,
    fetchUserProfile,
    // Utility
    isApiAvailable,
};

