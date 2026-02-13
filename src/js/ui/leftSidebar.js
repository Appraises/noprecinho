/**
 * Left Sidebar Panel Component
 * Contains shopping list optimizer and other tools
 */

import { api } from '../api.js';
import { auth } from '../auth.js';

let sidebarElement = null;
let currentListId = null;
let isOpen = false;
let optimizationData = null;
let userLocation = null; // { lat, lng }

// Event callbacks
let onHighlightStores = null;
let getUserLocationFn = null;

/**
 * Initialize left sidebar
 * @param {Object} options
 * @param {Function} options.onHighlightStores - Callback to highlight stores on map
 */
export function initLeftSidebar(options = {}) {
    onHighlightStores = options.onHighlightStores;
    getUserLocationFn = options.getUserLocation;
    createSidebar();
    bindEvents();
}

/**
 * Create sidebar DOM structure
 */
function createSidebar() {
    sidebarElement = document.createElement('aside');
    sidebarElement.id = 'left-sidebar';
    sidebarElement.className = 'left-sidebar';
    sidebarElement.innerHTML = `
        <div class="left-sidebar__header">
            <h2 class="left-sidebar__title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61H19a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Lista de Compras
            </h2>
            <button class="left-sidebar__close" id="sidebar-close" aria-label="Fechar">&times;</button>
        </div>
        
        <div class="left-sidebar__content">
            <!-- Quick Add -->
            <div class="quick-add">
                <div class="autocomplete-container">
                    <input type="text" id="quick-add-input" class="quick-add__input" placeholder="Adicionar item..." autocomplete="off">
                    <div id="quick-add-autocomplete" class="autocomplete-results hidden"></div>
                </div>
                <button class="quick-add__btn" id="quick-add-btn">+</button>
            </div>
            
            <!-- Items List -->
            <div class="items-section">
                <div class="items-section__header">
                    <span class="items-section__title">Itens</span>
                    <span class="items-section__count" id="items-count">0</span>
                </div>
                <ul class="items-list" id="items-list">
                    <li class="items-list__empty">Adicione itens à sua lista</li>
                </ul>
            </div>
            
            <!-- Optimization Results -->
            <div class="optimization-section" id="optimization-section" hidden>
                <div class="optimization-section__header">
                    <span class="optimization-section__title">📊 Otimização</span>
                    <button class="btn btn--sm btn--ghost" id="refresh-optimization">↻</button>
                </div>
                
                <div class="optimization-results" id="optimization-results">
                    <!-- Results loaded dynamically -->
                </div>
            </div>
        </div>
        
        <div class="left-sidebar__footer">
            <button class="btn btn--primary btn--block" id="optimize-btn" disabled>
                🔍 Encontrar Melhores Preços
            </button>
        </div>
    `;

    document.body.appendChild(sidebarElement);
}

/**
 * Bind event handlers
 */
function bindEvents() {
    // Close button
    document.getElementById('sidebar-close').addEventListener('click', closeSidebar);

    // Quick add
    const quickAddInput = document.getElementById('quick-add-input');
    const quickAddBtn = document.getElementById('quick-add-btn');

    quickAddBtn.addEventListener('click', () => addItem(quickAddInput.value));
    quickAddInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem(quickAddInput.value);
    });

    // Autocomplete for quick add
    const autocompleteEl = document.getElementById('quick-add-autocomplete');
    quickAddInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            autocompleteEl.classList.add('hidden');
            return;
        }

        try {
            const products = await api.fetchCatalogProducts(query);
            if (products && products.length > 0) {
                autocompleteEl.innerHTML = products.map(p => `
                    <div class="autocomplete-item" data-name="${p.name}">
                        <span class="autocomplete-item__name">${p.name}</span>
                    </div>
                `).join('');
                autocompleteEl.classList.remove('hidden');

                autocompleteEl.querySelectorAll('.autocomplete-item').forEach(item => {
                    item.addEventListener('click', () => {
                        quickAddInput.value = item.dataset.name;
                        autocompleteEl.classList.add('hidden');
                        addItem(quickAddInput.value);
                    });
                });
            } else {
                autocompleteEl.classList.add('hidden');
            }
        } catch (error) {
            console.error('Quick add autocomplete error:', error);
        }
    });

    // Close autocomplete on click outside
    document.addEventListener('click', (e) => {
        if (!quickAddInput.contains(e.target) && !autocompleteEl.contains(e.target)) {
            autocompleteEl.classList.add('hidden');
        }
    });

    // Optimize button
    document.getElementById('optimize-btn').addEventListener('click', runOptimization);
    document.getElementById('refresh-optimization').addEventListener('click', runOptimization);

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            toggleSidebar();
        }
        if (e.key === 'Escape' && isOpen) {
            closeSidebar();
        }
    });
}

/**
 * Open sidebar
 */
export function openSidebar() {
    sidebarElement.classList.add('left-sidebar--open');
    isOpen = true;
    loadCurrentList();
}

/**
 * Close sidebar
 */
export function closeSidebar() {
    sidebarElement.classList.remove('left-sidebar--open');
    isOpen = false;
}

/**
 * Toggle sidebar
 */
export function toggleSidebar() {
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

/**
 * Load current shopping list or create one
 */
async function loadCurrentList() {
    try {
        const lists = await api.fetchShoppingLists();

        if (lists && lists.length > 0) {
            // Use the most recent active list
            const activeList = lists.find(l => l.isActive) || lists[0];
            currentListId = activeList.id;
            renderItems(activeList.items || []);
        } else {
            // Create a new list
            const newList = await api.createShoppingList({ name: 'Minha Lista' });
            currentListId = newList.id;
            renderItems([]);
        }
    } catch (error) {
        console.error('Load list error:', error);
        // Use local storage fallback
        const localItems = JSON.parse(localStorage.getItem('precoja_shopping_list') || '[]');
        renderItems(localItems);
    }
}

/**
 * Render items list
 */
function renderItems(items) {
    const listEl = document.getElementById('items-list');
    const countEl = document.getElementById('items-count');
    const optimizeBtn = document.getElementById('optimize-btn');

    countEl.textContent = items.length;
    optimizeBtn.disabled = items.length === 0;

    if (items.length === 0) {
        listEl.innerHTML = '<li class="items-list__empty">Adicione itens à sua lista</li>';
        return;
    }

    listEl.innerHTML = items.map(item => `
        <li class="items-list__item" data-id="${item.id || item.productName}">
            <input type="checkbox" class="items-list__checkbox" ${item.isChecked ? 'checked' : ''}>
            <span class="items-list__name">${item.productName}</span>
            <span class="items-list__qty">${item.quantity > 1 ? `x${item.quantity}` : ''}</span>
            ${item.bestPrice ? `<span class="items-list__price">R$ ${item.bestPrice.toFixed(2).replace('.', ',')}</span>` : ''}
            <button class="items-list__delete" data-name="${item.productName}">&times;</button>
        </li>
    `).join('');

    // Bind delete handlers
    listEl.querySelectorAll('.items-list__delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeItem(btn.dataset.name);
        });
    });

    // Bind checkbox handlers
    listEl.querySelectorAll('.items-list__checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const li = e.target.closest('.items-list__item');
            if (e.target.checked) {
                li.classList.add('items-list__item--checked');
            } else {
                li.classList.remove('items-list__item--checked');
            }
        });
    });
}

/**
 * Add item to list
 */
async function addItem(name) {
    if (!name || !name.trim()) return;

    const input = document.getElementById('quick-add-input');
    input.value = '';

    try {
        if (currentListId) {
            await api.addShoppingListItem(currentListId, {
                productName: name.trim(),
                quantity: 1
            });
            await loadCurrentList();
        } else {
            // Local fallback
            const items = JSON.parse(localStorage.getItem('precoja_shopping_list') || '[]');
            items.push({ productName: name.trim(), quantity: 1 });
            localStorage.setItem('precoja_shopping_list', JSON.stringify(items));
            renderItems(items);
        }

        // Clear optimization results
        document.getElementById('optimization-section').hidden = true;
    } catch (error) {
        console.error('Add item error:', error);
    }
}

/**
 * Remove item from list
 */
async function removeItem(name) {
    try {
        // For now, use local fallback
        const items = JSON.parse(localStorage.getItem('precoja_shopping_list') || '[]');
        const filtered = items.filter(i => i.productName !== name);
        localStorage.setItem('precoja_shopping_list', JSON.stringify(filtered));
        renderItems(filtered);

        // Clear optimization results
        document.getElementById('optimization-section').hidden = true;
    } catch (error) {
        console.error('Remove item error:', error);
    }
}

/**
 * Run optimization
 */
async function runOptimization() {
    const optimizeBtn = document.getElementById('optimize-btn');
    const section = document.getElementById('optimization-section');
    const results = document.getElementById('optimization-results');

    optimizeBtn.disabled = true;
    optimizeBtn.innerHTML = '<span class="spinner"></span> Calculando...';
    section.hidden = false;
    results.innerHTML = '<div class="optimization-loading">Buscando sua localização...</div>';

    // Get user location if available
    try {
        if (getUserLocationFn) {
            userLocation = getUserLocationFn();
        } else if ('geolocation' in navigator) {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        }
    } catch (e) {
        console.log('Location not available, using price-only optimization');
        userLocation = null;
    }

    results.innerHTML = '<div class="optimization-loading">Buscando melhores preços...</div>';

    try {
        if (!auth.isAuthenticated()) {
            throw new Error('Você precisa estar logado para otimizar sua lista.');
        }

        if (!currentListId) {
            console.log('No current list ID, attempting to load...');
            await loadCurrentList();
        }

        if (!currentListId) {
            console.log('Still no list ID, creating default list with local items...');
            try {
                // Get local items to migrate
                const localItems = JSON.parse(localStorage.getItem('precoja_shopping_list') || '[]');
                const itemsToCreate = localItems.map(i => ({
                    productName: i.productName,
                    quantity: i.quantity || 1,
                    unit: 'un'
                }));

                const newList = await api.createShoppingList({
                    name: 'Minha Lista',
                    items: itemsToCreate
                });
                currentListId = newList.id;

                // Clear local storage as we migrated to server
                localStorage.removeItem('precoja_shopping_list');
            } catch (e) {
                console.error('Failed to auto-create list:', e);
                const msg = e.message || 'Erro ao criar lista de compras';
                throw new Error(`${msg}. Tente novamente.`);
            }
        }

        if (!currentListId) {
            throw new Error('Erro ao identificar sua lista de compras.');
        }

        optimizationData = await api.optimizeShoppingList(currentListId, {
            userLat: userLocation?.lat,
            userLng: userLocation?.lng,
            travelCostPerKm: 1.50,
            maxDistanceKm: 10
        });

        renderOptimizationResults(optimizationData);

        // Automatically show the best option on the map
        if (onHighlightStores && optimizationData) {
            if (optimizationData.recommendation === 'split' && optimizationData.twoStoreSplit) {
                const split = optimizationData.twoStoreSplit;
                onHighlightStores({
                    stops: [
                        { store: split.storeA, items: split.storeAItems },
                        { store: split.storeB, items: split.storeBItems }
                    ]
                });
            } else if (optimizationData.recommendation === 'single' && optimizationData.singleStoreOptions?.length > 0) {
                const best = optimizationData.singleStoreOptions[0];
                onHighlightStores({
                    stops: [{ store: best.store, items: best.missingItems ? 0 : 1 }] // 1 implies found
                });
            }
        }
    } catch (error) {
        console.error('Optimization error:', error);
        results.innerHTML = `
            <div class="optimization-error">
                <span>❌</span> ${error.message || 'Não foi possível otimizar. Tente novamente.'}
            </div>
        `;
    } finally {
        optimizeBtn.disabled = false;
        optimizeBtn.innerHTML = '🔍 Encontrar Melhores Preços';
    }
}

/**
 * Render optimization results
 */
function renderOptimizationResults(data) {
    const results = document.getElementById('optimization-results');

    if (!data || !data.singleStoreOptions || data.singleStoreOptions.length === 0) {
        results.innerHTML = `
            <div class="optimization-empty">
                Não encontramos preços para os itens da sua lista.
            </div>
        `;
        return;
    }

    let html = '';

    // Single store options
    html += '<div class="store-options">';
    html += '<div class="store-options__title">Uma loja:</div>';

    data.singleStoreOptions.slice(0, 3).forEach((opt, i) => {
        const isFirst = i === 0;
        const hasDistance = opt.distanceKm !== undefined && opt.distanceKm > 0;
        const itemsHtml = (opt.items || []).map(item => `
            <div class="store-option__item">
                <span class="store-option__item-name">${item.productName}</span>
                <span class="store-option__item-price">R$ ${item.price.toFixed(2).replace('.', ',')}${item.quantity > 1 ? ` x${item.quantity}` : ''}</span>
            </div>
        `).join('');
        html += `
            <div class="store-option ${isFirst ? 'store-option--best' : ''}" data-store-id="${opt.store.id}">
                <div class="store-option__header">
                    <div class="store-option__main">
                        <span class="store-option__name">${opt.store.name}</span>
                        ${hasDistance ? `<span class="store-option__distance">📍 ${opt.distanceKm} km</span>` : ''}
                    </div>
                    <div class="store-option__prices">
                        <span class="store-option__total">R$ ${opt.total.toFixed(2).replace('.', ',')}</span>
                        ${hasDistance && opt.travelCost > 0 ? `<span class="store-option__travel">+ R$ ${opt.travelCost.toFixed(2).replace('.', ',')} combustível</span>` : ''}
                    </div>
                </div>
                ${opt.itemsMissing?.length ? `<span class="store-option__missing">(faltam ${opt.itemsMissing.length}: ${opt.itemsMissing.join(', ')})</span>` : ''}
                ${itemsHtml ? `<div class="store-option__items">${itemsHtml}</div>` : ''}
            </div>
        `;
    });
    html += '</div>';

    // Two store split (if recommended)
    if (data.twoStoreSplit && data.recommendation === 'split') {
        const split = data.twoStoreSplit;
        const storeA = split.store1 || split.storeA;
        const storeB = split.store2 || split.storeB;
        const itemsA = split.items1 || split.storeAItems || [];
        const itemsB = split.items2 || split.storeBItems || [];
        const totalA = split.total1 || split.storeATotal || 0;
        const totalB = split.total2 || split.storeBTotal || 0;

        const hasRoute = split.routeDescription && split.totalDistanceKm > 0;
        html += `
            <div class="split-recommendation">
                <div class="split-recommendation__header">
                    <span>⭐ Melhor opção (2 lojas)</span>
                    <span class="split-recommendation__badge">Economize ${split.savingsPercent || 0}%</span>
                </div>
                ${hasRoute ? `<div class="split-route">🚗 ${split.routeDescription} (${split.totalDistanceKm} km)</div>` : ''}
                <div class="split-recommendation__stores">
                    <div class="split-store" data-store-id="${storeA.id}">
                        <div class="split-store__name">${storeA.name}</div>
                        <div class="split-store__items">${itemsA.map(i => `<div class="split-item"><span>${i.productName || i.name}</span><span class="split-item__price">R$ ${(i.price || 0).toFixed(2).replace('.', ',')}</span></div>`).join('')}</div>
                        <div class="split-store__total">R$ ${totalA.toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div class="split-divider">+</div>
                    <div class="split-store" data-store-id="${storeB.id}">
                        <div class="split-store__name">${storeB.name}</div>
                        <div class="split-store__items">${itemsB.map(i => `<div class="split-item"><span>${i.productName || i.name}</span><span class="split-item__price">R$ ${(i.price || 0).toFixed(2).replace('.', ',')}</span></div>`).join('')}</div>
                        <div class="split-store__total">R$ ${totalB.toFixed(2).replace('.', ',')}</div>
                    </div>
                </div>
                <div class="split-recommendation__footer">
                    <div class="split-total">
                        <span>Total:</span>
                        <span class="split-total__value">R$ ${(split.combinedTotal || split.total || 0).toFixed(2).replace('.', ',')}</span>
                        ${(split.travelCost || 0) > 0 ? `<span class="split-total__travel">+ R$ ${split.travelCost.toFixed(2).replace('.', ',')} combustível</span>` : ''}
                    </div>
                    <div class="split-savings">
                        Economia líquida: <strong>R$ ${(split.netSavings || split.savings || 0).toFixed(2).replace('.', ',')}</strong>
                    </div>
                </div>
                <button class="btn btn--secondary btn--block" id="show-on-map-btn">
                    🗺️ Ver rota no mapa
                </button>
            </div>
        `;
    }

    results.innerHTML = html;

    // Bind map button
    const mapBtn = document.getElementById('show-on-map-btn');
    if (mapBtn && onHighlightStores) {
        mapBtn.addEventListener('click', () => {
            const split = data.twoStoreSplit;
            if (split) {
                const storeA = split.store1 || split.storeA;
                const storeB = split.store2 || split.storeB;
                const itemsA = split.items1 || split.storeAItems || [];
                const itemsB = split.items2 || split.storeBItems || [];

                onHighlightStores({
                    stops: [
                        { store: storeA, items: itemsA },
                        { store: storeB, items: itemsB }
                    ]
                });
            }
            closeSidebar();
        });
    }

    // Bind store clicks
    results.querySelectorAll('.store-option').forEach(el => {
        el.addEventListener('click', () => {
            const storeId = el.dataset.storeId;
            const opt = data.singleStoreOptions.find(o => o.store.id === storeId);
            if (opt && onHighlightStores) {
                onHighlightStores({
                    stops: [{ store: opt.store, items: opt.items || [] }]
                });
            }
        });
    });

    results.querySelectorAll('.split-store').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const storeId = el.dataset.storeId;
            const split = data.twoStoreSplit;
            if (split && onHighlightStores) {
                const storeA = split.store1 || split.storeA;
                const storeB = split.store2 || split.storeB;
                const itemsA = split.items1 || split.storeAItems || [];
                const itemsB = split.items2 || split.storeBItems || [];

                const store = storeA.id === storeId ? storeA : storeB;
                const items = storeA.id === storeId ? itemsA : itemsB;
                onHighlightStores({
                    stops: [{ store, items }]
                });
            }
        });
    });
}

/**
 * Check if sidebar is open
 */
export function isSidebarOpen() {
    return isOpen;
}
