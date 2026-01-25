/**
 * Price Comparison Modal
 * Shows all stores with prices for a specific product
 */

import { compareProductPrices } from '../api.js';
import { showError } from './loadingUI.js';
import { formatDistance } from '../utils/formatters.js';

let comparisonModal = null;

/**
 * Initialize comparison modal
 */
export function initComparisonModal() {
    comparisonModal = document.createElement('div');
    comparisonModal.id = 'comparison-modal';
    comparisonModal.className = 'modal-overlay';
    comparisonModal.setAttribute('role', 'dialog');
    comparisonModal.setAttribute('aria-modal', 'true');
    comparisonModal.innerHTML = `
        <div class="modal" style="max-width: 700px; max-height: 80vh; display: flex; flex-direction: column;">
            <div class="modal__header">
                <h2 class="modal__title" id="comparison-title">Comparar Preços</h2>
                <button class="modal__close" id="comparison-close">&times;</button>
            </div>
            <div class="modal__body" id="comparison-body" style="overflow-y: auto; flex: 1;">
                <div class="loading-overlay visible">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(comparisonModal);

    // Close handlers
    comparisonModal.querySelector('#comparison-close').addEventListener('click', closeComparisonModal);
    comparisonModal.addEventListener('click', (e) => {
        if (e.target === comparisonModal) closeComparisonModal();
    });
}

/**
 * Open comparison modal for a product
 * @param {string} productName 
 */
export async function openComparisonModal(productName) {
    if (!comparisonModal) initComparisonModal();

    const title = comparisonModal.querySelector('#comparison-title');
    const body = comparisonModal.querySelector('#comparison-body');

    title.textContent = `Comparar: ${productName}`;
    body.innerHTML = `
        <div class="loading-overlay visible" style="position: relative; min-height: 200px;">
            <div class="spinner"></div>
        </div>
    `;
    comparisonModal.classList.add('modal-overlay--visible');

    try {
        const result = await compareProductPrices(productName);
        renderComparison(body, result);
    } catch (error) {
        console.error('Comparison error:', error);
        body.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">❌</div>
                <div class="empty-state__title">Erro ao carregar</div>
                <div class="empty-state__description">${error.message}</div>
            </div>
        `;
    }
}

/**
 * Render comparison results
 */
function renderComparison(container, result) {
    const { product, comparison, stats } = result;

    if (!comparison || comparison.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">🔍</div>
                <div class="empty-state__title">Nenhum preço encontrado</div>
                <div class="empty-state__description">Seja o primeiro a reportar o preço deste produto!</div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="comparison-stats">
            <div class="comparison-stat">
                <span class="comparison-stat__value">${stats.storeCount}</span>
                <span class="comparison-stat__label">lojas</span>
            </div>
            <div class="comparison-stat comparison-stat--highlight">
                <span class="comparison-stat__value">R$ ${stats.minPrice.toFixed(2).replace('.', ',')}</span>
                <span class="comparison-stat__label">menor preço</span>
            </div>
            <div class="comparison-stat">
                <span class="comparison-stat__value">${stats.savingsPercent}%</span>
                <span class="comparison-stat__label">economia máx.</span>
            </div>
        </div>

        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Loja</th>
                    <th>Preço</th>
                    <th>Diferença</th>
                    <th>Atualizado</th>
                </tr>
            </thead>
            <tbody>
                ${comparison.map((item, index) => {
        const isBest = index === 0;
        const diff = item.price - stats.minPrice;
        const diffPercent = ((diff / stats.minPrice) * 100).toFixed(0);
        const timeSince = getTimeSince(item.createdAt);

        return `
                        <tr class="${isBest ? 'comparison-row--best' : ''}">
                            <td>
                                <div class="comparison-store">
                                    ${isBest ? '<span class="comparison-badge">🏆 Melhor</span>' : ''}
                                    <strong>${item.store.name}</strong>
                                    <small>${item.store.address || ''}</small>
                                </div>
                            </td>
                            <td class="comparison-price ${isBest ? 'comparison-price--best' : ''}">
                                R$ ${item.price.toFixed(2).replace('.', ',')}
                            </td>
                            <td class="${diff > 0 ? 'text-danger' : 'text-success'}">
                                ${diff > 0 ? `+${diffPercent}%` : '-'}
                            </td>
                            <td class="text-muted">${timeSince}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

/**
 * Get time since a date
 */
function getTimeSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d atrás`;
    if (diffHours > 0) return `${diffHours}h atrás`;
    if (diffMins > 0) return `${diffMins}min atrás`;
    return 'agora';
}

/**
 * Close comparison modal
 */
export function closeComparisonModal() {
    if (comparisonModal) {
        comparisonModal.classList.remove('modal-overlay--visible');
    }
}
