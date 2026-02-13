// Report price modal - Receipt-first with auto-extract
import { api } from '../api.js';
import { addPrice } from '../data/mockData.js';
import { stores as mockStores } from '../data/mockData.js';
import { formatPrice, getCategoryIcon, getCategoryLabel } from '../utils/formatters.js';
import { extractPriceFromImage, compressImage, blurSensitiveAreas } from '../utils/imageUtils.js';

let stores = [...mockStores]; // Initialize with mock, but allow override
let modalOverlay = null;
let modalBody = null;
let modalFooter = null;
let currentMode = 'choose'; // 'choose', 'receipt', 'manual'
let currentStep = 1;
let receiptData = {
  image: null,
  store: null,
  items: [],
  selectedItems: []
};
let manualData = {
  storeId: null,
  product: '',
  productId: null,
  unit: 'un',
  price: 0,
  hasPhoto: false,
  photoFile: null
};
let onSubmitCallback = null;

export function setStores(newStores) {
  stores = newStores;
}

// Filter stores by location and sort by distance
function filterStoresByLocation(lat, lon) {
  // Calculate distance for each store
  const storesWithDistance = stores.map(store => {
    const distance = calculateDistance(lat, lon, store.lat, store.lng);
    return { ...store, distance };
  });

  // Sort by distance and filter to nearby (within 10km)
  const nearbyStores = storesWithDistance
    .filter(s => s.distance <= 10000)
    .sort((a, b) => a.distance - b.distance);

  // Update the store list in the DOM
  const storeList = document.getElementById('store-list');
  if (storeList) {
    if (nearbyStores.length > 0) {
      storeList.innerHTML = nearbyStores.slice(0, 15).map(store => `
        <div class="price-card ${store.id === manualData.storeId ? 'selected' : ''}" data-store-id="${store.id}">
          <div class="price-card__image">${getCategoryIcon(store.category)}</div>
          <div class="flex-1 min-w-0">
            <div class="price-card__product truncate">${store.name}</div>
            <div class="price-card__store truncate">${store.address}</div>
            <div class="text-xs text-muted">${formatDistance(store.distance)}</div>
          </div>
          ${store.id === manualData.storeId ? '<div class="check-icon">✓</div>' : ''}
        </div>
      `).join('');
    } else {
      storeList.innerHTML = `
        <div class="text-center py-6 text-muted">
          <div class="text-2xl mb-2">🏪</div>
          <p>Nenhuma loja encontrada nesta área.</p>
        </div>
      `;
    }

    // Re-attach click handlers
    storeList.querySelectorAll('.price-card').forEach(card => {
      card.addEventListener('click', () => {
        manualData.storeId = card.dataset.storeId;
        storeList.querySelectorAll('.price-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        setTimeout(() => handleNext(), 200);
      });
    });
  }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function initReportModal(onSubmit) {
  modalOverlay = document.getElementById('report-modal');
  modalBody = document.getElementById('modal-body');
  modalFooter = document.getElementById('modal-footer');
  onSubmitCallback = onSubmit;

  document.getElementById('modal-close')?.addEventListener('click', closeModal);

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

export function openReportModal(preselectedStore = null) {
  if (!modalOverlay) return;

  // Reset state
  currentMode = preselectedStore ? 'manual' : 'choose';
  // Skip store selection if store is pre-selected
  currentStep = preselectedStore ? 2 : 1;
  receiptData = { image: null, store: null, items: [], selectedItems: [] };
  manualData = {
    storeId: preselectedStore?.id || null,
    product: '',
    productId: null,
    unit: 'un',
    price: 0,
    hasPhoto: false,
    photoFile: null
  };

  render();
  modalOverlay.classList.add('modal-overlay--visible');
}

function closeModal() {
  modalOverlay?.classList.remove('modal-overlay--visible');
}

function render() {
  document.querySelector('.modal__title').textContent = getTitle();
  modalBody.innerHTML = getContent();
  modalFooter.innerHTML = getFooter();
  attachHandlers();
}

function getTitle() {
  if (currentMode === 'choose') return 'Reportar preços';
  if (currentMode === 'receipt') return 'Nota fiscal';
  return 'Adicionar produto';
}

function getContent() {
  if (currentMode === 'choose') return renderChooseMode();
  if (currentMode === 'receipt') return renderReceiptMode();
  return renderManualMode();
}

function getFooter() {
  if (currentMode === 'choose') return '';

  if (currentMode === 'receipt') {
    if (currentStep === 1) {
      return `<button class="btn btn--secondary" id="btn-back">Voltar</button>`;
    } else if (currentStep === 2) {
      return `
        <button class="btn btn--secondary" id="btn-back">Voltar</button>
        <button class="btn btn--primary" id="btn-submit">
          Confirmar ${receiptData.selectedItems.length} ${receiptData.selectedItems.length === 1 ? 'item' : 'itens'}
        </button>
      `;
    }
  }

  if (currentMode === 'manual') {
    if (currentStep === 1) {
      return `<button class="btn btn--secondary" id="btn-back">Voltar</button>`;
    } else if (currentStep === 2) {
      return `
        <button class="btn btn--secondary" id="btn-back">Voltar</button>
        <button class="btn btn--primary" id="btn-next">Próximo</button>
      `;
    } else if (currentStep === 3) {
      return `
        <button class="btn btn--secondary" id="btn-back">Voltar</button>
        <button class="btn btn--primary btn--accent" id="btn-submit">Confirmar</button>
      `;
    }
  }

  return '';
}

// ========== CHOOSE MODE ==========
function renderChooseMode() {
  return `
    <div class="report-header">
      <h3 class="report-title">Adicionar Preço</h3>
      <p class="report-subtitle">Ajude a comunidade a economizar! 🤝</p>
    </div>
    
    <div class="report-options">
      <button class="report-card group" id="choose-receipt">
        <div class="report-card__icon-wrapper bg-icon-primary">
          <span class="report-card__icon">📸</span>
        </div>
        <div class="report-card__content">
          <div class="report-card__header">
            <span class="report-card__title">Escanear Nota Fiscal</span>
            <span class="badge badge--fresh">Rápido</span>
          </div>
          <div class="report-card__description">
            Extraímos os produtos e preços automaticamente da foto
          </div>
        </div>
      </button>
      
      <button class="report-card group" id="choose-manual">
        <div class="report-card__icon-wrapper bg-icon-secondary">
          <span class="report-card__icon">✏️</span>
        </div>
        <div class="report-card__content">
          <div class="report-card__header">
            <span class="report-card__title">Digitar Manualmente</span>
          </div>
          <div class="report-card__description">
            Adicione um produto específico que você viu
          </div>
        </div>
      </button>
    </div>

    <div class="report-footer-note">
      Você ganha pontos por cada preço validado! ⭐
    </div>
  `;
}

// ========== RECEIPT MODE ==========
function renderReceiptMode() {
  if (currentStep === 1) {
    return renderReceiptUpload();
  }
  return renderReceiptReview();
}

function renderReceiptUpload() {
  if (receiptData.image) {
    return `
      <div class="flex flex-col items-center justify-center h-64 relative rounded-xl overflow-hidden bg-surface-elevated mb-6">
        <img src="${receiptData.image}" class="h-full w-full object-contain opacity-50" alt="Nota fiscal"/>
        
        <div class="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
            <div class="spinner spinner--large mb-4"></div>
            <h3 class="font-bold text-lg mb-2">Lendo sua notinha...</h3>
            <p class="text-sm text-secondary mb-4">Isso leva apenas alguns segundos 🤖</p>
            
            <div class="w-full max-w-xs bg-surface/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <div class="bg-primary h-full transition-all duration-300" id="ocr-bar" style="width: 0%"></div>
            </div>
            <div class="text-xs text-secondary mt-2" id="ocr-percent">0%</div>
        </div>
      </div>
      
      <p class="text-center text-sm text-muted">
        Estamos procurando por produtos e preços...
      </p>
    `;
  }

  return `
    <div class="text-center mb-6">
      <h3 class="font-bold text-lg">Foto do Cupom Fiscal</h3>
      <p class="text-sm text-secondary">Tire uma foto clara e bem iluminada 💡</p>
    </div>

    <div class="upload-area photo-upload-container group" id="receipt-upload">
      <div class="report-card__icon-wrapper bg-surface shadow-sm mb-4 group-hover:scale-110 transition-transform">
        <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </div>
      <p class="font-medium mb-1">Tirar foto ou escolher arquivo</p>
      <p class="text-xs text-secondary">JPG, PNG</p>
      <input type="file" id="receipt-input" accept="image/*" capture="environment" class="hidden"/>
    </div>
  `;
}

function renderReceiptReview() {
  const store = receiptData.store;
  const items = receiptData.items;

  return `
    <div class="mb-4">
      <label class="text-sm font-bold text-secondary uppercase tracking-wider mb-2 block">Loja Identificada</label>
      ${store ? `
        <div class="card p-3 flex items-center gap-3 bg-primary/5 border border-primary/20">
          <div class="text-2xl">${getCategoryIcon(store.category)}</div>
          <div class="flex-1">
             <div class="font-bold text-primary-dark">${store.name}</div>
             <div class="text-xs text-secondary">${store.address}</div>
          </div>
          <div class="text-success text-xl">✓</div>
        </div>
      ` : `
        <div class="form-group mb-0">
          <select class="form-select w-full" id="store-select">
            <option value="">🏪 Selecione a loja...</option>
            ${stores.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
      `}
    </div>
    
    <div class="flex justify-between items-end mb-3">
      <div>
        <label class="text-sm font-bold text-secondary uppercase tracking-wider block">Itens Encontrados</label>
        <span class="text-xs text-muted">${items.length} itens detectados</span>
      </div>
      <button class="text-primary text-sm font-medium hover:underline" id="select-all">
        ${receiptData.selectedItems.length === items.length ? 'Desmarcar todos' : 'Selecionar todos'}
      </button>
    </div>
    
    <div class="receipt-items space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
      ${items.length > 0 ? items.map((item, i) => `
        <div class="receipt-item p-3 rounded-lg border border-border flex items-center gap-3 cursor-pointer hover:bg-surface-elevated transition-colors ${receiptData.selectedItems.includes(i) ? 'receipt-item--checked ring-2 ring-primary ring-inset bg-primary/5 border-primary' : ''}" data-index="${i}">
           <div class="w-5 h-5 rounded border-2 border-muted flex items-center justify-center transition-colors ${receiptData.selectedItems.includes(i) ? 'bg-primary border-primary text-white' : ''}">
             ${receiptData.selectedItems.includes(i) ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
           </div>
           <div class="flex-1 min-w-0">
             <div class="font-medium truncate" title="${item.product}">${item.product}</div>
             ${item.quantity ? `<div class="text-xs text-muted">${item.quantity} ${item.unit || ''}</div>` : ''}
           </div>
           <div class="font-bold text-lg whitespace-nowrap">${formatPrice(item.price)}</div>
        </div>
      `).join('') : `
        <div class="text-center py-8 text-muted border border-dashed border-border rounded-xl">
          <div class="text-2xl mb-2">🤔</div>
          <p>Não conseguimos ler os itens.</p>
          <button class="btn btn--link mt-2" id="retry-upload">Tentar outra foto</button>
        </div>
      `}
    </div>
  `;
}

// ========== MANUAL MODE ==========
function renderManualMode() {
  if (currentStep === 1) return renderManualStore();
  return renderManualProduct(); // Combined product + confirm in step 2 for simplicity
}

function renderManualStore() {
  const nearbyStores = stores.slice(0, 10); // Show more stores
  const userCity = window.userCity || '';

  return `
    <div class="report-section-header">
        <h3 class="report-section-title">Qual é a loja?</h3>
        <p class="report-section-subtitle">Selecione onde você viu o preço</p>
        ${userCity ? `<div class="city-badge">📍 ${userCity}</div>` : ''}
    </div>

    <div class="form-group store-search-container">
      <span class="search-icon">🔍</span>
      <input type="text" class="form-input search-input" id="store-search" placeholder="Buscar loja por nome..."/>
    </div>
    
    <div class="form-group store-search-container">
      <span class="search-icon">📍</span>
      <input type="text" class="form-input search-input" id="address-search" placeholder="Buscar por endereço (rua, bairro)..."/>
      <div id="address-suggestions" class="search-suggestions hidden"></div>
    </div>
    
    <div id="store-list" class="store-list custom-scrollbar">
      ${nearbyStores.length > 0 ? nearbyStores.map(store => `
        <div class="price-card ${store.id === manualData.storeId ? 'selected' : ''}" data-store-id="${store.id}">
          <div class="price-card__image">${getCategoryIcon(store.category)}</div>
          <div class="flex-1 min-w-0">
            <div class="price-card__product truncate">${store.name}</div>
            <div class="price-card__store truncate">${store.address}</div>
            ${store.distance ? `<div class="text-xs text-muted">${formatDistance(store.distance)}</div>` : ''}
          </div>
          ${store.id === manualData.storeId ? '<div class="check-icon">✓</div>' : ''}
        </div>
      `).join('') : `
        <div class="text-center py-6 text-muted">
          <div class="text-2xl mb-2">🏪</div>
          <p>Nenhuma loja encontrada na sua cidade.</p>
          <p class="text-xs mt-1">Tente buscar por endereço acima.</p>
        </div>
      `}
    </div>
    <p class="form-error hidden text-center" id="store-error">Por favor, selecione uma loja para continuar</p>
  `;
}

// Helper to format distance
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

function renderManualProduct() {
  const store = stores.find(s => s.id === manualData.storeId);

  return `
    <div class="selected-store-badge">
       <span>📍</span>
       <span class="font-semibold">${store?.name}</span>
       <button class="btn-link-small" id="change-store">(Alterar)</button>
    </div>

    <div class="form-group mb-6">
      <label class="form-label">Qual é o produto?</label>
      <input type="text" class="form-input form-input--large" id="product-name" 
             placeholder="Ex: Leite Integral CCGL 1L" value="${manualData.product}" autocomplete="off" autofocus/>
      <div id="product-suggestions" class="hidden"></div>
    </div>
    
    <div class="form-group mb-8">
      <label class="form-label">Quanto custa?</label>
      <div class="price-input-wrapper">
        <span class="currency-symbol">R$</span>
        <input type="number" class="form-input price-input-large" id="price-input" 
               placeholder="0,00" step="0.01" min="0" value="${manualData.price || ''}"/>
      </div>
    </div>
    
    <div class="photo-section-card">
       <div class="photo-toggle-header" id="photo-toggle">
         <span class="photo-toggle-label">📸 Adicionar foto (opcional)</span>
         <span class="photo-toggle-icon" id="photo-arrow">${manualData.hasPhoto ? '▼' : '+'}</span>
       </div>
       
       <div class="${manualData.hasPhoto ? '' : 'hidden'} photo-upload-container mt-4" id="photo-section">
         <div class="upload-area photo-upload-area" id="photo-upload">
           ${manualData.hasPhoto ? `
             <div class="photo-preview-wrapper">
               <img src="${manualData.photoFile}" class="photo-preview"/>
               <button class="btn-remove-photo" id="remove-photo">×</button>
             </div>
           ` : `
             <span class="text-2xl block mb-1">📷</span>
             <span class="text-xs text-muted">Clique para fotografar</span>
           `}
           <input type="file" id="photo-input" accept="image/*" capture="environment" class="hidden"/>
         </div>
       </div>
    </div>
    
    <p class="form-error hidden text-center" id="product-error">Preencha o nome e o preço do produto</p>
  `;
}

function renderManualConfirm() {
  // Deprecated step, moved into renderManualProduct for simpler flow
  return '';
}


function attachHandlers() {
  // Use event delegation for dynamic elements or attach directly if they exist

  // New buttons in simplified UI
  document.getElementById('change-store')?.addEventListener('click', () => {
    currentStep = 1;
    render();
  });

  document.getElementById('photo-toggle')?.addEventListener('click', () => {
    const section = document.getElementById('photo-section');
    const arrow = document.getElementById('photo-arrow');
    if (section && arrow) {
      const isHidden = section.classList.contains('hidden');
      if (isHidden) {
        section.classList.remove('hidden');
        arrow.textContent = '▼';
      } else {
        section.classList.add('hidden');
        arrow.textContent = '+';
      }
    }
  });

  document.getElementById('remove-photo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    manualData.hasPhoto = false;
    manualData.photoFile = null;
    render();
  });

  // Choose mode
  document.getElementById('choose-receipt')?.addEventListener('click', () => {
    currentMode = 'receipt';
    currentStep = 1;
    render();
  });

  document.getElementById('choose-manual')?.addEventListener('click', () => {
    currentMode = 'manual';
    currentStep = 1;
    render();
  });

  // Back button
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      render();
    } else {
      currentMode = 'choose';
      render();
    }
  });

  // Next button - validation and flow logic
  document.getElementById('btn-next')?.addEventListener('click', () => {
    // In manual mode, Step 2 is the last step (Product + Confirm combined)
    if (currentMode === 'manual' && currentStep === 2) {
      handleSubmit();
    } else {
      handleNext();
    }
  });

  // Submit button
  document.getElementById('btn-submit')?.addEventListener('click', handleSubmit);

  // Receipt upload
  const receiptUpload = document.getElementById('receipt-upload');
  const receiptInput = document.getElementById('receipt-input');

  receiptUpload?.addEventListener('click', () => receiptInput?.click());
  receiptUpload?.addEventListener('dragover', (e) => {
    e.preventDefault();
    receiptUpload.classList.add('upload-area--dragover');
  });
  receiptUpload?.addEventListener('dragleave', () => {
    receiptUpload.classList.remove('upload-area--dragover');
  });
  receiptUpload?.addEventListener('drop', (e) => {
    e.preventDefault();
    receiptUpload.classList.remove('upload-area--dragover');
    if (e.dataTransfer.files.length) handleReceiptUpload(e.dataTransfer.files[0]);
  });
  receiptInput?.addEventListener('change', (e) => {
    if (e.target.files.length) handleReceiptUpload(e.target.files[0]);
  });

  document.getElementById('retry-upload')?.addEventListener('click', () => {
    receiptData = { image: null, store: null, items: [], selectedItems: [] };
    currentStep = 1;
    render();
  });

  // Receipt items selection
  document.querySelectorAll('.receipt-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      const pos = receiptData.selectedItems.indexOf(index);
      if (pos >= 0) {
        receiptData.selectedItems.splice(pos, 1);
      } else {
        receiptData.selectedItems.push(index);
      }
      render();
    });
  });

  document.getElementById('select-all')?.addEventListener('click', () => {
    if (receiptData.selectedItems.length === receiptData.items.length) {
      receiptData.selectedItems = [];
    } else {
      receiptData.selectedItems = receiptData.items.map((_, i) => i);
    }
    render();
  });

  // Store selection
  document.querySelectorAll('#store-list .price-card').forEach(card => {
    card.addEventListener('click', () => {
      manualData.storeId = card.dataset.storeId;
      document.querySelectorAll('#store-list .price-card').forEach(c => {
        c.classList.remove('ring-2', 'ring-primary', 'bg-primary/5');
        const check = c.querySelector('.text-primary.font-bold');
        if (check) check.remove();
      });
      card.classList.add('ring-2', 'ring-primary', 'bg-primary/5');

      // Auto advance to next step for smoother UX
      setTimeout(() => {
        handleNext();
      }, 200);
    });
  });

  // Store search (by name)
  document.getElementById('store-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#store-list .price-card').forEach(card => {
      const store = stores.find(s => s.id === card.dataset.storeId);
      const matches = store && (store.name.toLowerCase().includes(q) || store.address.toLowerCase().includes(q));
      card.style.display = matches || !q ? '' : 'none';
    });
  });

  // Address search (geocoding)
  let addressSearchTimeout = null;
  document.getElementById('address-search')?.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    const suggestionsDiv = document.getElementById('address-suggestions');

    // Clear previous timeout
    if (addressSearchTimeout) clearTimeout(addressSearchTimeout);

    if (q.length < 3) {
      if (suggestionsDiv) suggestionsDiv.classList.add('hidden');
      return;
    }

    // Debounce the search
    addressSearchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=br&limit=5`
        );
        const results = await response.json();

        if (results.length > 0 && suggestionsDiv) {
          suggestionsDiv.innerHTML = results.map(r => `
            <div class="search-suggestion" data-lat="${r.lat}" data-lon="${r.lon}">
              <span class="search-suggestion__icon">📍</span>
              <span class="search-suggestion__text">${r.display_name.substring(0, 60)}${r.display_name.length > 60 ? '...' : ''}</span>
            </div>
          `).join('');
          suggestionsDiv.classList.remove('hidden');

          // Add click handlers to suggestions
          suggestionsDiv.querySelectorAll('.search-suggestion').forEach(sug => {
            sug.addEventListener('click', () => {
              const lat = parseFloat(sug.dataset.lat);
              const lon = parseFloat(sug.dataset.lon);
              filterStoresByLocation(lat, lon);
              suggestionsDiv.classList.add('hidden');
              e.target.value = sug.querySelector('.search-suggestion__text')?.textContent || q;
            });
          });
        } else if (suggestionsDiv) {
          suggestionsDiv.classList.add('hidden');
        }
      } catch (error) {
        console.error('Address search error:', error);
      }
    }, 400);
  });

  // Product input with autocomplete from Product catalog
  let productSearchTimeout = null;
  const productInput = document.getElementById('product-name');
  const suggestionsDiv = document.getElementById('product-suggestions');

  productInput?.addEventListener('input', (e) => {
    manualData.product = e.target.value;
    manualData.productId = null; // Reset on manual typing
    const query = e.target.value.trim();

    if (productSearchTimeout) clearTimeout(productSearchTimeout);

    if (query.length < 1) {
      if (suggestionsDiv) {
        suggestionsDiv.classList.add('hidden');
        suggestionsDiv.innerHTML = '';
      }
      return;
    }

    productSearchTimeout = setTimeout(async () => {
      try {
        const products = await api.fetchCatalogProducts(query);

        if (products && products.length > 0 && suggestionsDiv) {
          suggestionsDiv.innerHTML = products.map(p => `
            <div class="search-suggestion" data-name="${p.name}" data-id="${p.id}">
              <span class="search-suggestion__icon">${getCategoryIcon(p.category || 'outros')}</span>
              <div class="search-suggestion__content">
                <span class="search-suggestion__text">${p.name}</span>
                ${p.brand ? `<span class="search-suggestion__meta">${p.brand}</span>` : ''}
                ${p.size ? `<span class="search-suggestion__meta">${p.size}</span>` : ''}
              </div>
            </div>
          `).join('');
          suggestionsDiv.classList.remove('hidden');

          // Click handlers for suggestions
          suggestionsDiv.querySelectorAll('.search-suggestion').forEach(sug => {
            sug.addEventListener('click', () => {
              const name = sug.dataset.name;
              const id = sug.dataset.id;
              manualData.product = name;
              manualData.productId = id;
              productInput.value = name;
              suggestionsDiv.classList.add('hidden');
              // Focus on price input after selecting product
              document.getElementById('price-input')?.focus();
            });
          });
        } else if (suggestionsDiv) {
          suggestionsDiv.innerHTML = `
            <div class="search-suggestion" style="cursor: default; opacity: 0.6;">
              <span class="search-suggestion__icon">❌</span>
              <span class="search-suggestion__text">Produto não encontrado no catálogo</span>
            </div>
          `;
          suggestionsDiv.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Product catalog search error:', error);
      }
    }, 300);
  });

  document.getElementById('price-input')?.addEventListener('input', (e) => {
    manualData.price = parseFloat(e.target.value) || 0;
  });

  // Photo upload
  const photoUpload = document.getElementById('photo-upload');
  const photoInput = document.getElementById('photo-input');

  photoUpload?.addEventListener('click', () => photoInput?.click());
  photoInput?.addEventListener('change', async (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
      const reader = new FileReader();
      reader.onload = (ev) => {
        manualData.hasPhoto = true;
        manualData.photoFile = ev.target.result;
        render();
      };
      reader.readAsDataURL(compressed);
    }
  });

  document.getElementById('store-select')?.addEventListener('change', (e) => {
    receiptData.store = stores.find(s => s.id === e.target.value);
    render();
  });
}

async function handleReceiptUpload(file) {
  // Show preview
  const reader = new FileReader();
  reader.onload = async (e) => {
    receiptData.image = e.target.result;
    render();

    // Run OCR
    try {
      const compressed = await compressImage(file, { maxWidth: 1500, quality: 0.85 });
      const result = await extractPriceFromImage(compressed, (progress) => {
        const percent = Math.round(progress * 100);
        const bar = document.getElementById('ocr-bar');
        const text = document.getElementById('ocr-percent');
        if (bar) bar.style.width = `${percent}%`;
        if (text) text.textContent = `${percent}%`;
      });

      if (result.success) {
        // Find store by CNPJ or name
        if (result.extracted.store?.name) {
          receiptData.store = stores.find(s =>
            s.name.toLowerCase().includes(result.extracted.store.name.toLowerCase().substring(0, 10))
          ) || null;
        }


        // Map extracted data to items (using new robust structure)
        if (result.extracted.items && result.extracted.items.length > 0) {
          receiptData.items = result.extracted.items.map(item => ({
            product: item.product,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            confidence: item.confidence
          }));
        } else {
          // Fallback for empty results
          receiptData.items = [];
        }

        // Auto-select high confidence items (loose threshold for better UX)
        receiptData.selectedItems = receiptData.items
          .map((item, i) => item.confidence > 0.6 ? i : -1)
          .filter(i => i >= 0);

        currentStep = 2;
        render();
      } else {
        currentStep = 2;
        render();
      }
    } catch (error) {
      console.error('OCR error:', error);
      currentStep = 2;
      render();
    }
  };
  reader.readAsDataURL(file);
}

function handleNext() {
  if (currentMode === 'manual') {
    if (currentStep === 1) {
      if (!manualData.storeId) {
        document.getElementById('store-error')?.classList.remove('hidden');
        return;
      }
      currentStep = 2;
      render();
    } else if (currentStep === 2) {
      if (!manualData.productId) {
        const errEl = document.getElementById('product-error');
        if (errEl) {
          errEl.textContent = 'Selecione um produto da lista de sugestões';
          errEl.classList.remove('hidden');
        }
        return;
      }
      if (manualData.price <= 0) {
        const errEl = document.getElementById('product-error');
        if (errEl) {
          errEl.textContent = 'Informe o preço do produto';
          errEl.classList.remove('hidden');
        }
        return;
      }
      // Submit immediately on step 2 (simplified flow)
      handleSubmit();
    }
  }
}

function handleSubmit() {
  if (currentMode === 'receipt') {
    // Submit all selected items
    receiptData.selectedItems.forEach(i => {
      const item = receiptData.items[i];
      addPrice({
        storeId: receiptData.store?.id,
        product: item.product,
        price: item.price,
        unit: 'un',
        hasPhoto: true,
        photoUrl: receiptData.image,
        reporter: 'Você',
        category: receiptData.store?.category || 'outros'
      });
    });

    if (onSubmitCallback) {
      onSubmitCallback({
        type: 'receipt',
        store: receiptData.store,
        items: receiptData.selectedItems.map(i => receiptData.items[i])
      });
    }
  } else if (currentMode === 'manual') {
    const store = stores.find(s => s.id === manualData.storeId);

    addPrice({
      storeId: manualData.storeId,
      product: manualData.product,
      productId: manualData.productId,
      price: manualData.price,
      unit: manualData.unit,
      hasPhoto: manualData.hasPhoto,
      photoUrl: manualData.photoFile,
      reporter: 'Você',
      category: store?.category || 'outros'
    });

    if (onSubmitCallback) {
      onSubmitCallback(manualData);
    }
  }

  closeModal();
}

export function getReportData() {
  return currentMode === 'receipt' ? receiptData : manualData;
}
