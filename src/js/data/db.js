// IndexedDB caching layer for offline support
const DB_NAME = 'precoja_db';
const DB_VERSION = 1;

let db = null;

// Store definitions
const STORES = {
    stores: { keyPath: 'id', indexes: ['category', 'name'] },
    prices: { keyPath: 'id', indexes: ['storeId', 'product', 'timestamp'] },
    userReports: { keyPath: 'id', indexes: ['timestamp'] },
    cache: { keyPath: 'key' }
};

// Initialize database
export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            console.log('📦 IndexedDB initialized');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Create object stores
            Object.entries(STORES).forEach(([storeName, config]) => {
                if (!database.objectStoreNames.contains(storeName)) {
                    const store = database.createObjectStore(storeName, { keyPath: config.keyPath });

                    // Create indexes
                    config.indexes?.forEach(indexName => {
                        store.createIndex(indexName, indexName, { unique: false });
                    });
                }
            });
        };
    });
}

// Get database instance
function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call initDB() first.');
    }
    return db;
}

// Generic CRUD operations
export async function put(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = getDB().transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function get(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = getDB().transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function getAll(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = getDB().transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function remove(storeName, key) {
    return new Promise((resolve, reject) => {
        const transaction = getDB().transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function clear(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = getDB().transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Query by index
export async function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
        const transaction = getDB().transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Bulk operations
export async function putMany(storeName, items) {
    return new Promise((resolve, reject) => {
        const transaction = getDB().transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        let completed = 0;
        const errors = [];

        items.forEach(item => {
            const request = store.put(item);
            request.onsuccess = () => {
                completed++;
                if (completed === items.length) {
                    resolve(completed);
                }
            };
            request.onerror = () => {
                errors.push(request.error);
                completed++;
                if (completed === items.length) {
                    if (errors.length > 0) {
                        reject(errors);
                    } else {
                        resolve(completed);
                    }
                }
            };
        });
    });
}

// Cache with expiration
export async function setCache(key, data, ttlMs = 3600000) { // 1 hour default
    const cacheEntry = {
        key,
        data,
        expiresAt: Date.now() + ttlMs,
        createdAt: Date.now()
    };
    return put('cache', cacheEntry);
}

export async function getCache(key) {
    const entry = await get('cache', key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
        await remove('cache', key);
        return null;
    }

    return entry.data;
}

// Sync status tracking
export async function markForSync(storeName, id) {
    const syncQueue = await getCache('syncQueue') || [];
    syncQueue.push({ storeName, id, timestamp: Date.now() });
    await setCache('syncQueue', syncQueue, Infinity);
}

export async function getSyncQueue() {
    return await getCache('syncQueue') || [];
}

export async function clearSyncQueue() {
    await remove('cache', 'syncQueue');
}

// Check if online
export function isOnline() {
    return navigator.onLine;
}

// Export for debugging
export function getDBStats() {
    return {
        name: DB_NAME,
        version: DB_VERSION,
        stores: Object.keys(STORES)
    };
}
