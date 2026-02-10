/**
 * Authentication Module
 * Handles user sessions with real backend API
 */

const TOKEN_KEY = 'precoja_auth_token';
const USER_KEY = 'precoja_user';

// API base URL - change for production
const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : `http://${window.location.hostname}:3000/api`;

export const auth = {
    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Get current user info
     * @returns {Object|null}
     */
    getUser() {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },

    /**
     * Get auth token for API calls
     * @returns {string|null}
     */
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    /**
     * Get authorization header for fetch requests
     * @returns {Object}
     */
    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },

    /**
     * Login user with email and password
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<boolean>}
     */

    async login(email, password) {
        // Mock login - allow any credentials
        const mockUser = {
            id: 'mock-user-id',
            name: email.split('@')[0],
            email: email
        };
        const mockToken = 'mock-jwt-token';

        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return true;
    },

    /**
     * Signup new user
     * @param {string} name
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<boolean>}
     */
    async signup(name, email, password) {
        // Mock signup - accept any data
        const mockUser = {
            id: 'mock-user-id',
            name: name,
            email: email
        };
        const mockToken = 'mock-jwt-token';

        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        return true;
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/index.html';
    },

    /**
     * Check auth and redirect if not logged in
     * Call this at the start of protected pages
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
        }
    },

    /**
     * Refresh current user data from server
     * @returns {Promise<Object|null>}
     */
    async refreshUser() {
        // Mock refresh - just return stored user
        return this.getUser();
    }
};
