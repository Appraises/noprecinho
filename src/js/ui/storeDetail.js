// Store detail modal/page component
import { formatPrice, formatTimeAgo, getFreshnessBadge, getTrustScoreClass, getCategoryIcon, getCategoryLabel } from '../utils/formatters.js';
import { getStorePrices, votePrice } from '../data/mockData.js';

import { openProofModal } from './proofViewer.js';

let modalOverlay = null;
let headerElement = null;
let bodyElement = null;
let currentStore = null;
let activeTab = 'prices';

export function initStoreDetail() {
  modalOverlay = document.getElementById('store-detail-modal');
  headerElement = document.getElementById('store-detail-header');
  bodyElement = document.getElementById('store-detail-body');

  // Close on overlay click
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('modal-overlay--visible')) {
      closeModal();
    }
  });
}

export function openStoreDetail(store) {
  if (!modalOverlay || !store) return;

  currentStore = store;
  activeTab = 'prices';

  renderHeader();
  renderBody();

  modalOverlay.classList.add('modal-overlay--visible');
}

function closeModal() {
  modalOverlay?.classList.remove('modal-overlay--visible');
}

function renderHeader() {
  if (!headerElement || !currentStore) return;

  const trustClass = getTrustScoreClass(currentStore.trustScore);

  headerElement.innerHTML = `
    <div style="display: flex; align-items: center; gap: var(--space-3); flex: 1;">
      <div class="price-card__logo" style="font-size: var(--font-size-2xl);">${getCategoryIcon(currentStore.category)}</div>
      <div>
        <h2 class="modal__title">${currentStore.name}</h2>
        <div style="display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-1);">
          <span class="text-sm text-muted">${getCategoryLabel(currentStore.category)}</span>
          <span class="trust-score ${trustClass}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            ${currentStore.trustScore}
          </span>
          <span class="badge ${currentStore.isOpen ? 'badge--fresh' : 'badge--outdated'}">
            ${currentStore.isOpen ? 'Aberto' : 'Fechado'}
          </span>
        </div>
      </div>
    </div>
    <button class="modal__close" onclick="document.getElementById('store-detail-modal').classList.remove('modal-overlay--visible')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;
}

function renderBody() {
  if (!bodyElement || !currentStore) return;

  const prices = getStorePrices(currentStore.id);

  bodyElement.innerHTML = `
    <div style="margin-bottom: var(--space-4);">
      <p class="text-sm text-muted" style="display: flex; align-items: center; gap: var(--space-2);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        ${currentStore.address}
      </p>
    </div>
    
    <div class="tabs">
      <button class="tab ${activeTab === 'prices' ? 'tab--active' : ''}" data-tab="prices">
        📋 Preços (${prices.length})
      </button>
      <button class="tab ${activeTab === 'history' ? 'tab--active' : ''}" data-tab="history">
        📈 Histórico
      </button>
    </div>
    
    <div id="tab-content">
      ${activeTab === 'prices' ? renderPricesTab(prices) : renderHistoryTab()}
    </div>
    
    <div style="margin-top: var(--space-4); display: flex; gap: var(--space-2);">
      <button class="btn btn--secondary" style="flex: 1;" onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(currentStore.address)}', '_blank')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        Abrir no Maps
      </button>
      <button class="btn btn--primary" style="flex: 1;" id="report-from-detail">
        + Reportar preço
      </button>
    </div>
  `;

  // Tab click handlers
  bodyElement.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      renderBody();
    });
  });

  // Vote handlers
  bodyElement.querySelectorAll('.vote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const priceId = btn.dataset.priceId;
      const isUpvote = btn.classList.contains('vote-btn--up');
      handleVote(priceId, isUpvote, btn);
    });
  });

  // Proof handlers
  bodyElement.querySelectorAll('.proof-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const priceId = btn.dataset.priceId;
      const price = prices.find(p => p.id === priceId);
      if (price) {
        openProofModal(price);
      }
    });
  });
}

function renderPricesTab(prices) {
  if (prices.length === 0) {
    return `
      <div class="text-center text-muted" style="padding: var(--space-8);">
        <p>Nenhum preço reportado ainda.</p>
        <p class="text-sm">Seja o primeiro a contribuir!</p>
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: var(--space-3);">
      ${prices.map(price => {
    const freshness = getFreshnessBadge(price.timestamp);
    return `
          <div class="price-card" data-price-id="${price.id}">
            <div class="price-card__content" style="flex: 1;">
              <div class="price-card__store">${price.product}</div>
              <div class="price-card__meta" style="margin-top: var(--space-2);">
                <span class="price-card__price">${formatPrice(price.price)}</span>
                <span class="price-card__unit">/${price.unit}</span>
                <span class="badge ${freshness.class}">${freshness.text}</span>
                ${price.hasPhoto ? `
                  <span class="badge badge--verified cursor-pointer proof-trigger" 
                        data-price-id="${price.id}"
                        title="Ver prova">
                    📸
                  </span>
                ` : ''}
              </div>
              <div class="text-xs text-muted" style="margin-top: var(--space-1);">
                por ${price.reporter} • ${formatTimeAgo(price.timestamp)}
              </div>
            </div>
            <div class="price-card__actions">
              <button class="vote-btn vote-btn--up" data-price-id="${price.id}" aria-label="Confirmar">
                <svg class="vote-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
              </button>
              <span class="text-xs text-muted">${price.votes}</span>
              <button class="vote-btn vote-btn--down" data-price-id="${price.id}" aria-label="Contestar">
                <svg class="vote-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                </svg>
              </button>
              <button class="vote-btn" aria-label="Denunciar" style="margin-top: var(--space-2);">
                <svg class="vote-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
              </button>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderHistoryTab() {
  // Simple price history visualization
  return `
    <div style="padding: var(--space-4);">
      <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-4);">
        <button class="chip chip--active" data-period="30">30 dias</button>
        <button class="chip" data-period="90">90 dias</button>
      </div>
      
      <div style="background: var(--color-background); border-radius: var(--radius-lg); padding: var(--space-4); text-align: center;">
        <svg viewBox="0 0 400 150" style="width: 100%; height: 150px;">
          <!-- Simple chart visualization -->
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:var(--color-primary);stop-opacity:0.3"/>
              <stop offset="100%" style="stop-color:var(--color-primary);stop-opacity:0"/>
            </linearGradient>
          </defs>
          
          <!-- Grid lines -->
          <line x1="40" y1="20" x2="380" y2="20" stroke="var(--color-border)" stroke-dasharray="4"/>
          <line x1="40" y1="60" x2="380" y2="60" stroke="var(--color-border)" stroke-dasharray="4"/>
          <line x1="40" y1="100" x2="380" y2="100" stroke="var(--color-border)" stroke-dasharray="4"/>
          
          <!-- Chart area -->
          <path d="M40,100 L80,80 L120,85 L160,70 L200,75 L240,60 L280,65 L320,50 L360,55 L380,45 L380,140 L40,140 Z" fill="url(#chartGradient)"/>
          
          <!-- Chart line -->
          <path d="M40,100 L80,80 L120,85 L160,70 L200,75 L240,60 L280,65 L320,50 L360,55 L380,45" fill="none" stroke="var(--color-primary)" stroke-width="2"/>
          
          <!-- Data points -->
          <circle cx="40" cy="100" r="4" fill="var(--color-primary)"/>
          <circle cx="120" cy="85" r="4" fill="var(--color-primary)"/>
          <circle cx="200" cy="75" r="4" fill="var(--color-primary)"/>
          <circle cx="280" cy="65" r="4" fill="var(--color-primary)"/>
          <circle cx="380" cy="45" r="4" fill="var(--color-primary)"/>
          
          <!-- Y-axis labels -->
          <text x="35" y="25" text-anchor="end" fill="var(--color-text-muted)" font-size="10">R$15</text>
          <text x="35" y="65" text-anchor="end" fill="var(--color-text-muted)" font-size="10">R$12</text>
          <text x="35" y="105" text-anchor="end" fill="var(--color-text-muted)" font-size="10">R$9</text>
        </svg>
        
        <div style="display: flex; justify-content: space-between; margin-top: var(--space-2); padding: 0 var(--space-4);">
          <span class="text-xs text-muted">30 dias atrás</span>
          <span class="text-xs text-muted">Hoje</span>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); margin-top: var(--space-4);">
        <div class="text-center">
          <div class="text-lg font-bold text-success">-8%</div>
          <div class="text-xs text-muted">vs. média</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold">${formatPrice(currentStore.lowestPrice)}</div>
          <div class="text-xs text-muted">menor preço</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold">${currentStore.priceCount}</div>
          <div class="text-xs text-muted">reportes</div>
        </div>
      </div>
    </div>
  `;
}

function handleVote(priceId, isUpvote, button) {
  const updatedPrice = votePrice(priceId, isUpvote);

  button.classList.add('vote-btn--active');

  // Update count
  const card = button.closest('.price-card');
  const countEl = card.querySelector('.price-card__actions .text-xs');
  if (countEl && updatedPrice) {
    countEl.textContent = updatedPrice.votes.toString();
  }
}
