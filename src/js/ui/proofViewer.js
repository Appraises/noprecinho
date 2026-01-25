// Proof viewer modal - View evidence for price reports
import { formatPrice, formatTimeAgo } from '../utils/formatters.js';

let proofModal = null;
let currentProof = null;

export function initProofViewer() {
    // Create proof modal if it doesn't exist
    if (!document.getElementById('proof-modal')) {
        const modal = document.createElement('div');
        modal.id = 'proof-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
      <div class="modal proof-modal">
        <div class="modal__header">
          <h2 class="modal__title">Prova do preço</h2>
          <button class="modal__close" id="proof-close">&times;</button>
        </div>
        <div class="modal__body" id="proof-body">
        </div>
      </div>
    `;
        document.body.appendChild(modal);

        proofModal = modal;

        document.getElementById('proof-close')?.addEventListener('click', closeProofModal);
        proofModal.addEventListener('click', (e) => {
            if (e.target === proofModal) closeProofModal();
        });
    } else {
        proofModal = document.getElementById('proof-modal');
    }
}

export function openProofModal(price) {
    if (!proofModal) initProofViewer();

    currentProof = price;

    const body = document.getElementById('proof-body');
    body.innerHTML = renderProofContent(price);

    proofModal.classList.add('modal-overlay--visible');

    // Add zoom functionality to image
    const img = body.querySelector('.proof-modal__image');
    if (img) {
        img.addEventListener('click', () => {
            img.classList.toggle('proof-modal__image--zoomed');
        });
    }
}

function closeProofModal() {
    proofModal?.classList.remove('modal-overlay--visible');
    currentProof = null;
}

function renderProofContent(price) {
    const hasPhoto = price.hasPhoto || price.photoUrl;
    const confidence = price.confidence || (hasPhoto ? 0.9 : 0.5);
    const upvotes = price.upvotes || 0;
    const downvotes = price.downvotes || 0;
    const trustScore = upvotes - downvotes;

    return `
    ${hasPhoto ? `
      <div class="relative mb-4">
        <img src="${price.photoUrl || '/placeholder-receipt.png'}" 
             alt="Prova do preço" 
             class="proof-modal__image w-full rounded-xl cursor-pointer"
             title="Clique para ampliar"/>
        <div class="absolute top-2 right-2">
          <span class="badge badge--verified">📸 Verificado</span>
        </div>
      </div>
    ` : `
      <div class="p-8 rounded-xl text-center mb-4" style="background: var(--color-surface-elevated);">
        <span class="text-4xl mb-3 block">📝</span>
        <p class="text-muted">Sem foto anexada</p>
        <p class="text-sm text-muted mt-1">Reportado manualmente</p>
      </div>
    `}
    
    <div class="card card--bordered mb-4">
      <div class="card__content">
        <div class="flex items-baseline justify-between mb-3">
          <span class="text-2xl font-bold text-primary">${formatPrice(price.price)}</span>
          <span class="text-muted">/ ${price.unit || 'un'}</span>
        </div>
        
        <div class="font-semibold mb-1">${price.product}</div>
        <div class="text-sm text-muted">${price.storeName || 'Loja'}</div>
      </div>
    </div>
    
    <div class="proof-modal__info mb-4">
      <div class="proof-modal__item">
        <div class="proof-modal__label">Reportado por</div>
        <div class="proof-modal__value">${price.reporter || 'Anônimo'}</div>
      </div>
      
      <div class="proof-modal__item">
        <div class="proof-modal__label">Quando</div>
        <div class="proof-modal__value">${formatTimeAgo(price.timestamp || new Date())}</div>
      </div>
      
      <div class="proof-modal__item">
        <div class="proof-modal__label">Confiança</div>
        <div class="proof-modal__value">
          <div class="trust-score trust-score--${confidence >= 0.7 ? 'high' : confidence >= 0.4 ? 'medium' : 'low'}">
            ${getConfidenceStars(confidence)}
            ${Math.round(confidence * 100)}%
          </div>
        </div>
      </div>
      
      <div class="proof-modal__item">
        <div class="proof-modal__label">Votos</div>
        <div class="proof-modal__value">
          <span class="text-success">+${upvotes}</span> / 
          <span class="text-error">-${downvotes}</span>
        </div>
      </div>
    </div>
    
    <div class="flex gap-3">
      <button class="btn btn--secondary flex-1" id="proof-downvote">
        👎 Incorreto
      </button>
      <button class="btn btn--primary flex-1" id="proof-upvote">
        👍 Confirmar
      </button>
    </div>
    
    ${hasPhoto ? `
      <p class="text-xs text-muted text-center mt-4">
        💡 Clique na imagem para ampliar
      </p>
    ` : ''}
  `;
}

function getConfidenceStars(confidence) {
    const stars = Math.round(confidence * 5);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

// Export for use in price cards
export function attachProofViewers() {
    document.querySelectorAll('[data-proof]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            const priceData = JSON.parse(el.dataset.proof);
            openProofModal(priceData);
        });
    });
}

// Add proof thumbnails to price cards
export function renderProofThumbnails(prices) {
    return prices
        .filter(p => p.hasPhoto || p.photoUrl)
        .slice(0, 3)
        .map(p => `
      <img src="${p.photoUrl}" 
           class="proof-thumb" 
           alt="Prova"
           data-proof='${JSON.stringify(p).replace(/'/g, '&#39;')}'/>
    `).join('');
}
