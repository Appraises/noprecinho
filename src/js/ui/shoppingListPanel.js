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
    deleteShoppingList
} from '../api.js';
import { showToast } from './toast.js';
import { showError, createSkeletonCards } from './loadingUI.js';

let listPanel = null;
let currentListId = null;

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
                    <input type="text" id="new-item-input" placeholder="Adicionar item..." class="form-input">
                    <button class="btn btn--primary" id="add-item-btn">+</button>
                </div>
                
                ${list.stats?.bestStores?.length ? `
                    <div class="shopping-best-stores">
                        <h4>🏆 Melhores lojas para esta lista:</h4>
                        ${list.stats.bestStores.slice(0, 3).map(s => `
                            <div class="best-store-item">
                                <strong>${s.store.name}</strong>
                                <span>${s.items} itens · R$ ${s.total.toFixed(2).replace('.', ',')}</span>
                            </div>
                        `).join('')}
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
        content.querySelector('#new-item-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddItem();
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

    try {
        await addShoppingListItem(currentListId, { productName });
        input.value = '';
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
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid var(--color-border);
        }
        
        .best-store-item:last-child {
            border-bottom: none;
        }
        
        .shopping-back {
            margin-bottom: 1rem;
        }
    `;
    document.head.appendChild(style);
}
