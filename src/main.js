// Main application entry point

// Import Leaflet CSS first
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Import our CSS
import './css/variables.css';
import './css/base.css';
import './css/components.css';
import './css/panels.css';
import './css/map.css';
import './css/loading.css';
import './css/features.css';
import './css/leftSidebar.css';
import './css/searchAutocomplete.css';
import './css/reportModal.css';
import './css/responsive.css';

// Core modules
import { initMap, centerOnUser, addStoreMarkers, selectStore, searchAndPanToStore, searchAddress, showRouteToStore, openDirections, getUserLocation } from './js/map.js';
import { formatDistance, getCategoryIcon, getCategoryLabel } from './js/utils/formatters.js';
import { initFilters, getActiveCategories } from './js/ui/filters.js';
import { initStorePreview, showStorePreview, hideStorePreview } from './js/ui/storePreview.js';
import { initPricePanel, updatePriceList } from './js/ui/priceList.js';
import { initReportModal, openReportModal, setStores } from './js/ui/reportModal.js';
import { initFilterModal, openFilterModal } from './js/ui/filterModal.js';
import { initStoreDetail, openStoreDetail, closeStoreDetail } from './js/ui/storeDetail.js';
import { showToast } from './js/ui/toast.js';
import { initProofViewer, attachProofViewers } from './js/ui/proofViewer.js';
import { initLoadingUI, showError, createSkeletonCards, createEmptyState, isAppOffline } from './js/ui/loadingUI.js';

// Data modules - API with mock fallback
import { api, fetchStores, fetchPrices, submitPrice, isApiAvailable, searchProducts, compareProductPrices } from './js/api.js';
import { stores as mockStores, prices as mockPrices, getFilteredPrices as getMockFilteredPrices, getNearbyStores as getMockNearbyStores } from './js/data/mockData.js';

// New feature modules
import { initComparisonModal, openComparisonModal } from './js/ui/comparisonModal.js';
import { initShoppingListPanel, toggleShoppingPanel } from './js/ui/shoppingListPanel.js';
import { initLeftSidebar, toggleSidebar as toggleLeftSidebar } from './js/ui/leftSidebar.js';
import { initSearchAutocomplete } from './js/ui/searchAutocomplete.js';

import { getUserPoints, addPoints } from './js/utils/gamification.js';
import { auth } from './js/auth.js';
import { initThemeToggle } from './js/ui/themeToggle.js';

// Advanced modules
import { initErrorBoundary } from './js/utils/errorBoundary.js';
import { initDB } from './js/data/db.js';
import { debounce } from './js/utils/helpers.js';
import { compressImage, extractPriceFromImage } from './js/utils/imageUtils.js';
import { validatePrice, analyzePriceTrend } from './js/utils/priceValidation.js';

// App state
const appState = {
  userLocation: null,
  selectedStore: null,
  activeCategories: ['all'],
  filterSettings: {
    radius: 5,
    freshOnly: true,
    verifiedOnly: false,
    openNow: false,
    sortBy: 'price'
  },
  stores: [],        // Current stores data
  prices: [],        // Current prices data
  useApi: false,     // Whether API is available
  isLoading: false,  // Global loading state
  mapInstance: null
};

// Initialize the application
async function init() {
  console.log('🚀 Initializing PreçoJá...');

  // Check Authentication
  auth.requireAuth();

  // Initialize Loading UI first
  initLoadingUI();

  // Initialize Theme
  initThemeToggle();

  // Update User UI
  const user = auth.getUser();
  if (user) {
    const avatarBtn = document.getElementById('user-avatar');
    if (avatarBtn) {
      avatarBtn.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width: 100%; height: 100%; border-radius: 50%;">`;
      avatarBtn.title = user.name;

      // Add logout option on click (simple implementation)
      avatarBtn.addEventListener('click', () => {
        if (confirm(`Log out as ${user.name}?`)) {
          auth.logout();
        }
      });
    }
  }

  // Initialize error boundary
  initErrorBoundary();

  // Initialize IndexedDB for offline support
  try {
    await initDB();
  } catch (error) {
    console.warn('IndexedDB initialization failed:', error);
  }

  // Check API availability
  try {
    appState.useApi = await isApiAvailable();
    console.log(appState.useApi ? '🌐 API available' : '📦 Using mock data');
  } catch {
    appState.useApi = false;
    console.log('📦 Using mock data (API check failed)');
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('📱 Service Worker registered');
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }

  // Initialize map - Default to Aracaju
  const map = initMap('map', {
    center: [-10.9472, -37.0731], // Aracaju default
    zoom: 14
  });
  appState.mapInstance = map;

  // Request user location
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        appState.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        centerOnUser(map, appState.userLocation);
        refreshData();
      },
      (error) => {
        console.warn('Geolocation denied:', error);
        showToast('info', 'Localização', 'Usando localização padrão (Aracaju)');
        refreshData();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    refreshData();
  }

  // Initialize UI components
  initFilters(handleCategoryChange);

  // Initialize store preview with detail click handler
  initStorePreview(() => {
    if (appState.selectedStore) {
      openStoreDetail(appState.selectedStore);
    }
  });

  initPricePanel();
  initReportModal(handlePriceReport);
  initFilterModal(handleFilterApply);
  initStoreDetail((store) => {
    closeStoreDetail();
    openReportModal(store);
  });

  // Initialize left sidebar with store highlight and location callbacks
  initLeftSidebar({
    onHighlightStores: (storeIds) => {
      // Highlight stores on map
      if (storeIds && storeIds.length > 0) {
        const store = appState.stores.find(s => storeIds.includes(s.id));
        if (store) {
          selectStore(store.id);
          appState.mapInstance.setView([store.lat, store.lng], 15);
        }
      }
    },
    getUserLocation: () => appState.userLocation
  });

  // Initialize search autocomplete
  initSearchAutocomplete('#search-input', {
    onSelect: async (item) => {
      if (item.type === 'store') {
        // Navigate to store on map
        const store = appState.stores.find(s => s.id === item.id);
        if (store) {
          selectStore(store.id);
          appState.mapInstance.setView([store.lat, store.lng], 16);
          showStorePreview(store);
        }
      } else if (item.type === 'product' || item.type === 'recent') {
        // Search for product prices and filter map
        await searchForProduct(item.name);
      }
    },
    minChars: 2,
    debounceMs: 300
  });

  // Add Enter key search on search input
  document.getElementById('search-input')?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query.length >= 2) {
        await searchForProduct(query);
      }
    }
  });

  // Set up event listeners
  setupEventListeners(map);

  // Update points display
  updatePointsDisplay();

  console.log('✅ PreçoJá initialized successfully');
}

// Search for a product and filter map to show stores with that product
async function searchForProduct(productName) {
  const priceListEl = document.getElementById('price-list');

  // Show loading state
  if (priceListEl) {
    priceListEl.innerHTML = createSkeletonCards(3);
  }
  showToast('info', `Buscando "${productName}"...`);

  try {
    // Fetch prices for this product
    const pricesResponse = await fetchPrices({ product: productName });
    const prices = pricesResponse.data || pricesResponse;

    if (!prices || prices.length === 0) {
      // No results found
      showToast('warning', 'Produto não encontrado', `Nenhuma loja reportou preços para "${productName}"`);

      // Show empty state in price list
      if (priceListEl) {
        priceListEl.innerHTML = createEmptyState(
          '🔍',
          'Produto não encontrado',
          `Nenhuma loja reportou preços para "${productName}". Seja o primeiro a reportar!`
        );
      }
      return;
    }

    // Get unique store IDs from prices
    const storeIdsWithProduct = [...new Set(prices.map(p => p.store?.id || p.storeId).filter(Boolean))];

    // Filter stores to only those with this product
    const storesWithProduct = appState.stores.filter(s => storeIdsWithProduct.includes(s.id));

    // Update map to highlight only stores with this product
    if (storesWithProduct.length > 0) {
      // Add markers for filtered stores with price info
      addStoreMarkers(appState.mapInstance, storesWithProduct, handleStoreClick);

      // Zoom to fit all stores with this product
      if (storesWithProduct.length === 1) {
        appState.mapInstance.setView([storesWithProduct[0].lat, storesWithProduct[0].lng], 15);
      } else {
        const bounds = storesWithProduct.map(s => [s.lat, s.lng]);
        appState.mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }

      showToast('success', 'Resultados encontrados', `${prices.length} preço(s) em ${storesWithProduct.length} loja(s)`);
    }

    // Update price list with search results
    updatePriceList(prices, handlePriceCardClick);

    // Store current search
    appState.currentSearch = productName;

  } catch (error) {
    console.error('Search error:', error);
    showToast('error', 'Erro ao buscar produto');
  }
}

// Clear search and show all stores
function clearProductSearch() {
  appState.currentSearch = null;
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  refreshData();
}

// Refresh data based on current filters
async function refreshData() {
  const priceListEl = document.getElementById('price-list');

  // Show loading state
  if (priceListEl) {
    priceListEl.innerHTML = createSkeletonCards(5);
  }
  appState.isLoading = true;

  try {
    if (appState.useApi && !isAppOffline()) {
      // Fetch from API
      // Join categories with comma if multiple are selected, or undefined if 'all' is selected
      const categoryFilter = appState.activeCategories.includes('all')
        ? undefined
        : appState.activeCategories.join(',');

      const [storesResponse, pricesResponse] = await Promise.all([
        fetchStores({ category: categoryFilter }),
        fetchPrices({
          category: categoryFilter,
          freshOnly: appState.filterSettings.freshOnly,
          verifiedOnly: appState.filterSettings.verifiedOnly,
          sortBy: appState.filterSettings.sortBy
        })
      ]);

      // Extract data arrays from paginated response
      const stores = storesResponse.data || storesResponse;
      const prices = pricesResponse.data || pricesResponse;

      appState.stores = stores;
      appState.prices = prices;
      if (appState.stores) setStores(appState.stores);

      // Update map markers
      addStoreMarkers(appState.mapInstance, stores, handleStoreClick);

      // Update price list
      updatePriceList(prices, handlePriceCardClick);

    } else {
      // Use mock data
      const location = appState.userLocation || { lat: -10.9472, lng: -37.0731 };
      const nearbyStores = getMockNearbyStores(location, appState.filterSettings.radius);

      const filteredPrices = getMockFilteredPrices({
        categories: appState.activeCategories,
        ...appState.filterSettings
      });

      appState.stores = nearbyStores;
      appState.prices = filteredPrices;
      if (appState.stores) setStores(appState.stores);

      // Update map markers
      addStoreMarkers(appState.mapInstance, mockStores, handleStoreClick);

      // Update price list
      updatePriceList(filteredPrices, handlePriceCardClick);
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
    showError('Erro ao carregar dados. Usando dados locais.');

    // Fallback to mock data
    const filteredPrices = getMockFilteredPrices({
      categories: appState.activeCategories,
      ...appState.filterSettings
    });

    appState.stores = mockStores;
    appState.prices = filteredPrices;

    addStoreMarkers(appState.mapInstance, mockStores, handleStoreClick);
    updatePriceList(filteredPrices, handlePriceCardClick);
  } finally {
    appState.isLoading = false;
  }
}

// Event handlers
function handleCategoryChange(categories) {
  appState.activeCategories = categories;
  refreshData();
}

function handleStoreClick(store) {
  appState.selectedStore = store;
  selectStore(store.id);
  showStorePreview(store);
}

function handleStoreDetailsClick() {
  if (appState.selectedStore) {
    openStoreDetail(appState.selectedStore);
  }
}

function handlePriceCardClick(priceEntry) {
  const store = appState.stores.find(s => s.id === priceEntry.storeId)
    || mockStores.find(s => s.id === priceEntry.storeId);
  if (store) {
    handleStoreClick(store);
  }
}

async function handlePriceReport(reportData) {
  console.log('New price reported:', reportData);

  try {
    if (appState.useApi) { // Check API mode
      // Submit to API
      console.log('Submitting to API...');

      const payload = {
        storeId: reportData.storeId,
        product: reportData.product,
        price: reportData.price,
        unit: reportData.unit || 'un',
        hasPhoto: reportData.hasPhoto,
        photoUrl: reportData.photoFile // Send the base64 string
      };

      await submitPrice(payload);

      showToast('success', '+15 pontos!', 'Preço enviado com sucesso');
    } else {
      // Local only
      addPoints(5);
      showToast('success', '+5 pontos!', 'Preço salvo localmente');
    }
  } catch (error) {
    console.error('Error submitting price detailed:', error);
    // Show specific error if available
    const msg = error.message || 'Erro ao enviar preço. Salvo localmente.';
    showError(msg);
    if (!appState.useApi) addPoints(5);
  }

  updatePointsDisplay();
  refreshData();
}

function handleFilterApply(settings) {
  appState.filterSettings = { ...appState.filterSettings, ...settings };
  refreshData();
}

function updatePointsDisplay() {
  const pointsCount = document.getElementById('points-count');
  if (pointsCount) {
    const points = getUserPoints() || 0;
    pointsCount.textContent = points.toString();
  }
}

// Set up global event listeners
function setupEventListeners(map) {
  // Report button
  document.getElementById('report-btn')?.addEventListener('click', () => {
    openReportModal(appState.selectedStore);
  });

  // Filter button
  document.getElementById('filter-btn')?.addEventListener('click', () => {
    openFilterModal(appState.filterSettings);
  });

  // Location button
  document.getElementById('location-btn')?.addEventListener('click', () => {
    if (appState.userLocation) {
      centerOnUser(map, appState.userLocation);
    } else {
      showToast('info', 'Localização', 'Localização não disponível');
    }
  });

  // Shopping list button (floating)
  document.getElementById('shopping-list-btn')?.addEventListener('click', () => {
    toggleShoppingPanel();
  });

  // Left sidebar toggle (header button)
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    toggleLeftSidebar();
  });

  // Search input
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleSearch(e.target.value);
    }, 300);
  });

  // Close preview when clicking on map
  map.on('click', () => {
    if (appState.selectedStore) {
      appState.selectedStore = null;
      selectStore(null);
      hideStorePreview();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close any open modals
      document.querySelectorAll('.modal-overlay--visible').forEach(modal => {
        modal.classList.remove('modal-overlay--visible');
      });
      hideStorePreview();
    }
  });
}

function handleSearch(query) {
  const suggestionsEl = document.getElementById('search-suggestions');
  if (!query.trim()) {
    suggestionsEl.classList.remove('visible');
    suggestionsEl.innerHTML = '';
    return;
  }

  // Search from current stores (API or mock)
  const stores = appState.stores.length > 0 ? appState.stores : mockStores;

  const storeResults = stores.filter(store =>
    store.name.toLowerCase().includes(query.toLowerCase()) ||
    store.category.toLowerCase().includes(query.toLowerCase())
  );

  // Render results
  if (storeResults.length > 0) {
    suggestionsEl.innerHTML = storeResults.slice(0, 8).map(store => `
      <div class="search-item" data-store-id="${store.id}">
        <div class="search-item__icon">${getCategoryIcon(store.category)}</div>
        <div class="search-item__info">
          <div class="search-item__name">${store.name}</div>
          <div class="search-item__meta">${getCategoryLabel(store.category)} • ${formatDistance(store.distance || 0)}</div>
        </div>
      </div>
    `).join('');

    suggestionsEl.classList.add('visible');

    // Add click handlers
    suggestionsEl.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        const storeId = item.dataset.storeId;
        const store = stores.find(s => s.id === storeId);
        if (store) {
          handleStoreClick(store);
          suggestionsEl.classList.remove('visible');
          document.getElementById('search-input').value = store.name;
        }
      });
    });
  } else {
    suggestionsEl.innerHTML = `
      <div class="search-item" style="cursor: default;">
        <div class="search-item__info">
          <div class="search-item__name text-muted">Nenhum resultado encontrado</div>
        </div>
      </div>
    `;
    suggestionsEl.classList.add('visible');
  }
}

// Close search when clicking outside
document.addEventListener('click', (e) => {
  const searchContainer = document.querySelector('.header__search');
  if (searchContainer && !searchContainer.contains(e.target)) {
    document.getElementById('search-suggestions')?.classList.remove('visible');
  }
});

// Start the app
document.addEventListener('DOMContentLoaded', init);
