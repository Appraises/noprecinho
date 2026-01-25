// Price list panel component
import { formatPrice, formatTimeAgo, formatDistance, getFreshnessBadge, getCategoryIcon } from '../utils/formatters.js';
import { getStoreById, votePrice } from '../data/mockData.js';

let panelElement = null;
let listElement = null;
let isCollapsed = false;

export function initPricePanel() {
    panelElement = document.getElementById('price-panel');
    listElement = document.getElementById('price-list');

    // Toggle button
    const toggleBtn = document.getElementById('panel-toggle');
    toggleBtn?.addEventListener('click', togglePanel);

    // Drag handle for mobile
    const dragHandle = panelElement?.querySelector('.price-panel__drag-handle');
    if (dragHandle) {
        dragHandle.addEventListener('click', togglePanel);
    }
}

function togglePanel() {
    if (!panelElement) return;

    isCollapsed = !isCollapsed;
    panelElement.classList.toggle('price-panel--collapsed', isCollapsed);

    // Update toggle icon
    const toggleBtn = document.getElementById('panel-toggle');
    if (toggleBtn) {
        const svg = toggleBtn.querySelector('svg polyline');
        if (svg) {
            svg.setAttribute('points', isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6');
        }
    }
}

export function updatePriceList(prices, onCardClick) {
    if (!listElement) return;

    if (prices.length === 0) {
        listElement.innerHTML = `
      <div class="text-center text-muted" style="padding: var(--space-8);">
        <p>Nenhum preço encontrado.</p>
        <p class="text-sm">Seja o primeiro a reportar!</p>
      </div>
    `;
        return;
    }

    listElement.innerHTML = prices.map(price => createPriceCard(price)).join('');

    // Add click handlers
    listElement.querySelectorAll('.price-card').forEach(card => {
        card.addEventListener('click', () => {
            const priceId = card.dataset.priceId;
            const priceEntry = prices.find(p => p.id === priceId);
            if (priceEntry && onCardClick) {
                onCardClick(priceEntry);
            }
        });
    });

    // Add vote handlers
    listElement.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const priceId = btn.closest('.price-card').dataset.priceId;
            const isUpvote = btn.classList.contains('vote-btn--up');
            handleVote(priceId, isUpvote, btn);
        });
    });
}

function createPriceCard(price) {
    const store = getStoreById(price.storeId);
    const freshness = getFreshnessBadge(price.timestamp);
    const icon = getCategoryIcon(price.category);

    return `
    <div class="price-card" data-price-id="${price.id}">
      <div class="price-card__logo">${icon}</div>
      <div class="price-card__content">
        <div class="price-card__store">${store?.name || 'Loja'}</div>
        <div class="price-card__product">${price.product}</div>
        <div class="price-card__meta">
          <span class="price-card__price">${formatPrice(price.price)}</span>
          <span class="price-card__unit">/${price.unit}</span>
          <span class="badge ${freshness.class}">${freshness.text}</span>
          ${price.hasPhoto ? '<span class="badge badge--verified">📸</span>' : ''}
        </div>
      </div>
      <div class="price-card__actions">
        <button class="vote-btn vote-btn--up" aria-label="Confirmar preço">
          <svg class="vote-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <span class="text-xs text-muted">${price.votes}</span>
        <button class="vote-btn vote-btn--down" aria-label="Reportar erro">
          <svg class="vote-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function handleVote(priceId, isUpvote, button) {
    // Update vote
    const updatedPrice = votePrice(priceId, isUpvote);

    // Update UI
    button.classList.add('vote-btn--active');

    // Update vote count
    const card = button.closest('.price-card');
    const countEl = card.querySelector('.price-card__actions .text-xs');
    if (countEl && updatedPrice) {
        countEl.textContent = updatedPrice.votes.toString();
    }

    // Disable other vote button
    const otherBtn = button.classList.contains('vote-btn--up')
        ? card.querySelector('.vote-btn--down')
        : card.querySelector('.vote-btn--up');

    if (otherBtn) {
        otherBtn.classList.remove('vote-btn--active');
    }
}

export function expandPanel() {
    if (panelElement && isCollapsed) {
        togglePanel();
    }
}

export function collapsePanel() {
    if (panelElement && !isCollapsed) {
        togglePanel();
    }
}
