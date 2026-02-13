/**
 * Shopping List Panel UI
 * Allows users to create and manage shopping lists
 */

import {
    fetchShoppingLists,
    fetchShoppingList,
    createShoppingList,
    addShoppingListItem,
    updateShoppingListItem,
    deleteShoppingListItem,
    deleteShoppingList,
    fetchCatalogProducts
} from '../api.js';
import { showToast } from './toast.js';
import { showError, createSkeletonCards } from './loadingUI.js';
import { selectStore, showRouteToStore, showMultiStopRoute, updateRouteInfo, getUserLocation, showShoppingIndicators, clearShoppingIndicators } from '../map.js';
import { showStorePreview } from './storePreview.js';

let listPanel = null;
let currentListId = null;
let selectedProduct = null; // Track valid product selected from autocomplete

/**
 * Initialize shopping list panel
 */
export function initShoppingListPanel() {
    listPanel = document.createElement('aside');
    listPanel.id = 'shopping-list-panel';
    listPanel.className = 'shopping-panel';
    listPanel.innerHTML = `
        <div class="shopping-panel__header">
            <h2 class="shopping-panel__title">
                <span>🛒</span> Lista de Compras
            </h2>
            <button class="btn btn--ghost btn--icon shopping-panel__close" id="shopping-close">×</button>
        </div>
        <div class="shopping-panel__content" id="shopping-content">
            <div class="shopping-panel__empty">
                <p>Carregando...</p>
            </div>
        </div>
        <div class="shopping-panel__footer" id="shopping-footer">
            <button class="btn btn--primary btn--block" id="new-list-btn">+ Nova Lista</button>
        </div>
    `;
    document.body.appendChild(listPanel);

    // Event listeners
    listPanel.querySelector('#shopping-close').addEventListener('click', closeShoppingPanel);
    listPanel.querySelector('#new-list-btn').addEventListener('click', handleNewList);

    // Add CSS
    addShoppingPanelStyles();
}

/**
 * Open shopping list panel
 */
export async function openShoppingPanel() {
    if (!listPanel) initShoppingListPanel();

    listPanel.classList.add('shopping-panel--visible');
    await loadLists();
}

/**
 * Close shopping list panel
 */
export function closeShoppingPanel() {
    if (listPanel) {
        listPanel.classList.remove('shopping-panel--visible');
    }
}

/**
 * Toggle shopping panel
 */
export function toggleShoppingPanel() {
    if (listPanel?.classList.contains('shopping-panel--visible')) {
        closeShoppingPanel();
    } else {
        openShoppingPanel();
    }
}

/**
 * Load user's shopping lists
 */
async function loadLists() {
    const content = listPanel.querySelector('#shopping-content');
    content.innerHTML = createSkeletonCards(2);

    try {
        const lists = await fetchShoppingLists();

        if (lists.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📝</div>
                    <div class="empty-state__title">Nenhuma lista</div>
                    <div class="empty-state__description">Crie sua primeira lista de compras!</div>
                </div>
            `;
            return;
        }

        content.innerHTML = lists.map(list => `
            <div class="shopping-list-card" data-list-id="${list.id}">
                <div class="shopping-list-card__header">
                    <h3 class="shopping-list-card__name">${list.name}</h3>
                    <span class="shopping-list-card__count">${list._count?.items || list.items?.length || 0} itens</span>
                </div>
                <div class="shopping-list-card__actions">
                    <button class="btn btn--sm btn--secondary view-list-btn">Ver</button>
                    <button class="btn btn--sm btn--ghost delete-list-btn">🗑️</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        content.querySelectorAll('.view-list-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const listId = e.target.closest('.shopping-list-card').dataset.listId;
                loadListDetail(listId);
            });
        });

        content.querySelectorAll('.delete-list-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const listId = e.target.closest('.shopping-list-card').dataset.listId;
                if (confirm('Excluir esta lista?')) {
                    await deleteShoppingList(listId);
                    loadLists();
                    showToast('success', 'Lista excluída', '');
                }
            });
        });

    } catch (error) {
        console.error('Load lists error:', error);
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">❌</div>
                <div class="empty-state__title">Erro ao carregar</div>
                <div class="empty-state__description">${error.message}</div>
            </div>
        `;
    }
}

/**
 * Load and display a specific list with best prices
 */
async function loadListDetail(listId) {
    const content = listPanel.querySelector('#shopping-content');
    const footer = listPanel.querySelector('#shopping-footer');

    currentListId = listId;
    content.innerHTML = createSkeletonCards(3);

    try {
        const list = await fetchShoppingList(listId);

        content.innerHTML = `
            <div class="shopping-detail">
                <button class="btn btn--ghost shopping-back" id="back-to-lists">
                    ← Voltar às listas
                </button>
                <h3>${list.name}</h3>
                
                ${list.stats ? `
                    <div class="shopping-stats">
                        <div class="shopping-stat">
                            <span class="shopping-stat__value">${list.stats.itemCount}</span>
                            <span class="shopping-stat__label">itens</span>
                        </div>
                        <div class="shopping-stat shopping-stat--primary">
                            <span class="shopping-stat__value">R$ ${list.stats.totalEstimate.toFixed(2).replace('.', ',')}</span>
                            <span class="shopping-stat__label">estimado</span>
                        </div>
                    </div>
                ` : ''}
                
                <ul class="shopping-items" id="shopping-items">
                    ${list.items.map(item => renderShoppingItem(item, listId)).join('')}
                </ul>
                
                <div class="shopping-add-item">
                    <div class="autocomplete-container">
                        <input type="text" id="new-item-input" placeholder="Adicionar item..." class="form-input" autocomplete="off">
                        <div id="autocomplete-results" class="autocomplete-results hidden"></div>
                    </div>
                    <button class="btn btn--primary" id="add-item-btn">+</button>
                </div>
                
                ${list.stats?.bestStores?.length ? `
                    <div class="shopping-best-stores">
                        <h4>🏆 Melhores opções para economizar:</h4>
                        
                        ${list.stats.twoStoreSplit ? `
                            <div class="split-card">
                                <div class="split-card__header">
                                    <span class="split-card__badge">MELHOR DIVISÃO</span>
                                    <span class="split-card__savings">Economia de R$ ${(list.stats.totalEstimate - list.stats.twoStoreSplit.total).toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div class="split-card__stores">
                                    <div class="split-store">
                                        <strong>${list.stats.twoStoreSplit.store1.name}</strong>
                                        <small>${list.stats.twoStoreSplit.items1.length} itens</small>
                                    </div>
                                    <div class="split-divider">→</div>
                                    <div class="split-store">
                                        <strong>${list.stats.twoStoreSplit.store2.name}</strong>
                                        <small>${list.stats.twoStoreSplit.items2.length} itens</small>
                                    </div>
                                </div>
                                <div class="split-card__total">
                                    Total: <strong>R$ ${list.stats.twoStoreSplit.total.toFixed(2).replace('.', ',')}</strong>
                                </div>
                                <button class="btn btn--primary btn--block btn--sm trace-multi-route-btn">Traçar Rota Completa</button>
                            </div>
                        ` : ''}

                        <div class="best-stores-list">
                            ${list.stats.bestStores.slice(0, 3).map(s => `
                                <div class="best-store-item" data-store-id="${s.store.id}">
                                    <div class="best-store-info">
                                        <strong>${s.store.name}</strong>
                                        <span>${s.items} itens · R$ ${s.total.toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <button class="btn btn--sm btn--primary trace-route-btn">Traçar Rota</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Event listeners
        content.querySelector('#back-to-lists').addEventListener('click', () => {
            currentListId = null;
            loadLists();
        });

        content.querySelector('#add-item-btn').addEventListener('click', handleAddItem);

        const itemInput = content.querySelector('#new-item-input');
        const resultsEl = content.querySelector('#autocomplete-results');

        itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddItem();
        });

        // Reset selectedProduct when user types manually
        itemInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            selectedProduct = null; // Reset on manual typing

            if (query.length < 2) {
                resultsEl.classList.add('hidden');
                return;
            }

            try {
                const products = await fetchCatalogProducts(query);
                if (products.length > 0) {
                    resultsEl.innerHTML = products.map(p => `
                        <div class="autocomplete-item" data-name="${p.name}">
                            <span class="autocomplete-item__icon">📦</span>
                            <span class="autocomplete-item__name">${p.name}</span>
                        </div>
                    `).join('');
                    resultsEl.classList.remove('hidden');

                    resultsEl.querySelectorAll('.autocomplete-item').forEach(item => {
                        item.addEventListener('click', () => {
                            itemInput.value = item.dataset.name;
                            selectedProduct = item.dataset.name; // Mark as valid selection
                            resultsEl.classList.add('hidden');
                            handleAddItem();
                        });
                    });
                } else {
                    resultsEl.innerHTML = `
                        <div class="autocomplete-empty">
                            <span>❌ Produto não encontrado no catálogo</span>
                        </div>
                    `;
                    resultsEl.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Autocomplete error:', error);
            }
        });

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!itemInput.contains(e.target) && !resultsEl.contains(e.target)) {
                resultsEl.classList.add('hidden');
            }
        });

        // Item checkboxes
        content.querySelectorAll('.shopping-item-check').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const itemId = e.target.dataset.itemId;
                await updateShoppingListItem(listId, itemId, { isChecked: e.target.checked });
            });
        });

        // Delete item buttons
        content.querySelectorAll('.shopping-item-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const itemId = e.target.dataset.itemId;
                await deleteShoppingListItem(listId, itemId);
                loadListDetail(listId);
            });
        });

        // Trace Route buttons
        content.querySelectorAll('.trace-route-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const storeId = e.target.closest('.best-store-item').dataset.storeId;
                const bestStoreData = list.stats.bestStores.find(s => s.store.id === storeId);

                if (bestStoreData && bestStoreData.store) {
                    const store = bestStoreData.store;
                    const userLocation = getUserLocation();

                    // Highlight on map
                    selectStore(store.id);
                    showStorePreview(store);

                    // Show route if location available
                    if (store && userLocation) {
                        // Clear previous indicators
                        clearShoppingIndicators();
                        clearRoute();

                        // Show indicator for this store
                        showShoppingIndicators([{ store, items: list.items || [] }]);

                        selectStore(store.id);
                        const routeInfo = await showRouteToStore(store, userLocation);
                        if (routeInfo) {
                            updateRouteInfo(routeInfo);
                            showToast('success', '🚗 Rota traçada!', `Melhor caminho para ${store.name} encontrado.`);
                        }
                    } else {
                        showToast('info', 'Localização', 'Ative sua localização para traçar a rota.');
                    }

                    // Close panel to see the map
                    closeShoppingPanel();
                }
            });
        });

        // Trace Multi-Stop Route button
        const multiRouteBtn = content.querySelector('.trace-multi-route-btn');
        if (multiRouteBtn) {
            multiRouteBtn.addEventListener('click', async () => {
                const split = list.stats.twoStoreSplit;
                const userLocation = getUserLocation();

                if (split && userLocation) {
                    const stops = [
                        { store: split.store1, items: split.items1 },
                        { store: split.store2, items: split.items2 }
                    ];

                    // Clear previous
                    clearShoppingIndicators();
                    clearRoute();

                    // Show labels
                    showShoppingIndicators(stops);

                    // Show route on map
                    const routeInfo = await showMultiStopRoute([split.store1, split.store2], userLocation);

                    if (routeInfo) {
                        updateRouteInfo(routeInfo);
                        showToast('success', '🗺️ Rota multi-lojas traçada!', `Total: ${routeInfo.distanceText}, ${routeInfo.durationText}`);
                    }

                    // Show message about what to buy where
                    setTimeout(() => {
                        showToast('info', 'O que comprar em cada:',
                            `${split.store1.name}: ${split.items1.length} itens\n${split.store2.name}: ${split.items2.length} itens`);
                    }, 2000);

                    closeShoppingPanel();
                } else if (!userLocation) {
                    showToast('info', 'Localização', 'Ative sua localização para traçar a rota.');
                }
            });
        }

    } catch (error) {
        console.error('Load list detail error:', error);
        showError('Erro ao carregar lista');
    }
}

/**
 * Render a shopping item
 */
function renderShoppingItem(item, listId) {
    return `
        <li class="shopping-item ${item.isChecked ? 'shopping-item--checked' : ''}">
            <input type="checkbox" class="shopping-item-check" 
                   data-item-id="${item.id}" 
                   ${item.isChecked ? 'checked' : ''}>
            <div class="shopping-item__info">
                <span class="shopping-item__name">${item.productName}</span>
                ${item.bestPrice ? `
                    <span class="shopping-item__price">R$ ${item.bestPrice.toFixed(2).replace('.', ',')}${item.bestStore ? ` · ${item.bestStore.name}` : ''}</span>
                ` : '<span class="shopping-item__price text-muted">Sem preço</span>'}
            </div>
            <span class="shopping-item__qty">${item.quantity} ${item.unit}</span>
            <button class="shopping-item-delete" data-item-id="${item.id}">×</button>
        </li>
    `;
}

/**
 * Handle creating new list
 */
async function handleNewList() {
    const name = prompt('Nome da nova lista:', 'Minha Lista');
    if (!name) return;

    try {
        await createShoppingList(name);
        showToast('success', 'Lista criada!', '');
        loadLists();
    } catch (error) {
        showError('Erro ao criar lista');
    }
}

/**
 * Handle adding item to list
 */
async function handleAddItem() {
    if (!currentListId) return;

    const input = document.getElementById('new-item-input');
    const productName = input.value.trim();

    if (!productName) return;

    // Validate: only allow products selected from autocomplete
    if (!selectedProduct || selectedProduct !== productName) {
        showToast('warning', 'Produto não encontrado', 'Selecione um produto da lista de sugestões.');
        return;
    }

    try {
        await addShoppingListItem(currentListId, { productName });
        input.value = '';
        selectedProduct = null;
        loadListDetail(currentListId);
    } catch (error) {
        showError('Erro ao adicionar item');
    }
}

/**
 * Add shopping panel styles
 */
function addShoppingPanelStyles() {
    if (document.getElementById('shopping-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'shopping-panel-styles';
    style.textContent = `
        .shopping-panel {
            position: fixed;
            top: 0;
            right: 0;
            width: 360px;
            max-width: 100%;
            height: 100vh;
            background: var(--color-surface);
            border-left: 1px solid var(--color-border);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
        }
        
        .shopping-panel--visible {
            transform: translateX(0);
        }
        
        .shopping-panel__header {
            padding: 1rem;
            border-bottom: 1px solid var(--color-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .shopping-panel__title {
            font-size: 1.125rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .shopping-panel__content {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        
        .shopping-panel__footer {
            padding: 1rem;
            border-top: 1px solid var(--color-border);
        }
        
        .shopping-list-card {
            background: var(--color-background);
            border: 1px solid var(--color-border);
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 0.75rem;
        }
        
        .shopping-list-card__header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
        }
        
        .shopping-list-card__name {
            font-size: 1rem;
            font-weight: 600;
        }
        
        .shopping-list-card__count {
            color: var(--color-text-secondary);
            font-size: 0.875rem;
        }
        
        .shopping-list-card__actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .shopping-stats {
            display: flex;
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .shopping-stat {
            text-align: center;
        }
        
        .shopping-stat__value {
            display: block;
            font-size: 1.25rem;
            font-weight: 700;
        }
        
        .shopping-stat__label {
            font-size: 0.75rem;
            color: var(--color-text-secondary);
        }
        
        .shopping-stat--primary .shopping-stat__value {
            color: var(--color-primary);
        }
        
        .shopping-items {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .shopping-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--color-border);
        }
        
        .shopping-item--checked .shopping-item__name {
            text-decoration: line-through;
            opacity: 0.5;
        }
        
        .shopping-item__info {
            flex: 1;
        }
        
        .shopping-item__name {
            display: block;
            font-weight: 500;
        }
        
        .shopping-item__price {
            font-size: 0.75rem;
            color: var(--color-primary);
        }
        
        .shopping-item__qty {
            font-size: 0.75rem;
            color: var(--color-text-secondary);
        }
        
        .shopping-item-delete {
            background: none;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            font-size: 1.25rem;
            padding: 0.25rem;
        }
        
        .shopping-add-item {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .shopping-add-item .form-input {
            flex: 1;
        }
        
        .shopping-best-stores {
            margin-top: 1.5rem;
            padding: 1rem;
            background: var(--color-background);
            border-radius: 12px;
        }
        
        .shopping-best-stores h4 {
            font-size: 0.875rem;
            margin-bottom: 0.75rem;
        }
        
        .best-store-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--color-border);
            gap: 1rem;
        }
        
        .best-store-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .best-store-info strong {
            font-size: 0.9375rem;
            color: var(--color-text);
        }

        .best-store-info span {
            font-size: 0.8125rem;
            color: var(--color-text-secondary);
        }

        .trace-route-btn {
            white-space: nowrap;
        }
        
        .best-store-item:last-child {
            border-bottom: none;
        }
        
        .shopping-back {
            margin-bottom: 1rem;
        }

        .autocomplete-container {
            position: relative;
            flex: 1;
        }

        .autocomplete-results {
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1002;
            margin-bottom: 0.5rem;
        }

        .autocomplete-item {
            padding: 0.75rem 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: background 0.2s;
        }

        .autocomplete-item:hover {
            background: var(--color-surface-hover);
        }

        .autocomplete-item__icon {
            font-size: 1rem;
        }

        .autocomplete-item__name {
            font-size: 0.875rem;
            font-weight: 500;
        }

        .autocomplete-empty {
            padding: 0.75rem 1rem;
            font-size: 0.8125rem;
            color: var(--color-text-secondary);
            text-align: center;
        }

        .split-card {
            background: var(--color-surface-elevated);
            border: 1px solid var(--color-primary);
            border-radius: var(--radius-lg);
            padding: 1rem;
            margin-bottom: 1.5rem;
            box-shadow: var(--shadow-md);
        }

        .split-card__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }

        .split-card__badge {
            background: var(--color-primary);
            color: white;
            font-size: 0.625rem;
            font-weight: 700;
            padding: 0.125rem 0.5rem;
            border-radius: var(--radius-full);
            text-transform: uppercase;
        }

        .split-card__savings {
            font-size: 0.75rem;
            color: var(--color-success);
            font-weight: 600;
        }

        .split-card__stores {
            display: flex;
            align-items: center;
            justify-content: space-around;
            margin-bottom: 1rem;
            text-align: center;
        }

        .split-store {
            flex: 1;
        }

        .split-store strong {
            display: block;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
        }

        .split-store small {
            font-size: 0.75rem;
            color: var(--color-text-secondary);
        }

        .split-divider {
            color: var(--color-primary);
            font-weight: 700;
            padding: 0 0.5rem;
        }

        .split-card__total {
            text-align: center;
            font-size: 0.875rem;
            margin-bottom: 1rem;
            padding-top: 0.5rem;
            border-top: 1px solid var(--color-border);
        }

        .best-stores-list {
            display: flex;
            flex-direction: column;
        }
    `;
    document.head.appendChild(style);
}
