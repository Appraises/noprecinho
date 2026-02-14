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
import { initMap, centerOnUser, addStoreMarkers, selectStore, searchAndPanToStore, searchAddress, showRouteToStore, showMultiStopRoute, clearRoute, openDirections, getUserLocation, showShoppingIndicators, clearShoppingIndicators, hideNonRouteMarkers, showAllMarkers } from './js/map.js';
import { formatDistance, getCategoryIcon, getCategoryLabel } from './js/utils/formatters.js';
import { initFilters, getActiveCategories } from './js/ui/filters.js';
import { initStorePreview, showStorePreview, hideStorePreview, updateRouteInfo } from './js/ui/storePreview.js';
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
    radius: 10000,
    freshOnly: true,
    verifiedOnly: false,
    openNow: false,
    sortBy: 'price'
  },
  stores: [],        // Current stores data
  prices: [],        // Current prices data
  useApi: false,     // Whether API is available
  isLoading: false,  // Global loading state
  mapInstance: null,
  // Current product search state
  currentSearch: {
    product: null,         // Product name being searched
    prices: [],            // Prices for this product
    stores: []             // Stores that have this product
  }
};

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Initialize the application
async function init() {
  console.log('🚀 Initializing NoPrecinho...');

  // Check Authentication
  auth.requireAuth();

  // Initialize Loading UI first
  initLoadingUI();

  // Initialize Theme
  initThemeToggle();

  // Initialize error boundary
  initErrorBoundary();

  // Initialize background tasks in parallel
  const initPromises = [
    initDB().catch(err => console.warn('IndexedDB failed:', err)),
    isApiAvailable(3000).then(available => {
      appState.useApi = available;
      console.log(available ? '🌐 API available' : '📦 Using mock data');
    }).catch(() => {
      appState.useApi = false;
      console.log('📦 Using mock data (check failed)');
    })
  ];

  function updateUserUI(userData) {
    const avatarBtn = document.getElementById('user-avatar');
    if (avatarBtn) {
      if (userData.avatar) {
        avatarBtn.innerHTML = `<img src="${userData.avatar}" alt="${userData.name}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
      } else {
        const initial = (userData.name || userData.email || 'U').charAt(0).toUpperCase();
        avatarBtn.innerHTML = `<span>${initial}</span>`;
      }
      avatarBtn.title = userData.name;

      avatarBtn.onclick = () => {
        if (confirm(`Log out as ${userData.name}?`)) {
          auth.logout();
        }
      };
    }

    // Update trust score display
    const trustScoreRaw = userData.trustScore ?? 0.5;
    const trustPercent = Math.round(trustScoreRaw * 100);
    const trustLevel = trustPercent >= 70 ? 'high' : trustPercent >= 40 ? 'medium' : 'low';

    const trustValueEl = document.getElementById('trust-score-value');
    const trustFillEl = document.getElementById('trust-score-fill');
    const trustBadgeEl = document.getElementById('trust-score-badge');

    if (trustValueEl) trustValueEl.textContent = trustPercent.toString();
    if (trustFillEl) {
      trustFillEl.style.width = `${trustPercent}%`;
      // Dynamic color: red (0°) → yellow (40°) → green (120°)
      const hue = Math.round((trustPercent / 100) * 120);
      trustFillEl.style.setProperty('--bar-color', `hsl(${hue}, 70%, 50%)`);
    }
    if (trustBadgeEl) {
      trustBadgeEl.title = `Reputação: ${trustPercent}% (Trust Score)`;
      trustBadgeEl.setAttribute('data-level', trustLevel);
    }

    // Update points display from server data
    if (userData.points !== undefined) {
      const pointsCount = document.getElementById('points-count');
      if (pointsCount) pointsCount.textContent = userData.points.toString();
    }
  }

  // Validate session and update User UI
  let user = auth.getUser();
  if (user) {
    updateUserUI(user);
    initPromises.push(
      auth.refreshUser().then(refreshedUser => {
        if (refreshedUser) updateUserUI(refreshedUser);
      })
    );
  }

  // Wait for critical background tasks (API check, DB init) before proceeding
  await Promise.all(initPromises);

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

  // Initialize store preview with detail and report click handlers
  initStorePreview(
    // On details click
    () => {
      if (appState.selectedStore) {
        openStoreDetail(appState.selectedStore);
      }
    },
    // On report click
    () => {
      if (appState.selectedStore) {
        openReportModal(appState.selectedStore);
      }
    },
    // On close/dismiss
    () => {
      clearRoute();
      if (appState.selectedStore) {
        appState.selectedStore = null;
        selectStore(null);
      }
    }
  );

  initPricePanel();
  initReportModal(handlePriceReport);
  initFilterModal(handleFilterApply);
  initStoreDetail((store) => {
    closeStoreDetail();
    openReportModal(store);
  });

  // Initialize left sidebar with store highlight and location callbacks
  initLeftSidebar({
    onHighlightStores: async (options) => {
      // Clear previous labels and routes
      clearShoppingIndicators();
      clearRoute();
      showAllMarkers(); // Restore all markers first

      if (options.stops && options.stops.length > 0) {
        // Show labels above stores
        showShoppingIndicators(options.stops);

        // Hide markers not part of the route
        const routeStoreIds = options.stops.map(s => (s.store || s).id);
        hideNonRouteMarkers(routeStoreIds);

        // Trace route
        if (options.stops.length === 1) {
          const store = options.stops[0].store || options.stops[0];
          selectStore(store.id);
          if (appState.userLocation) {
            const routeInfo = await showRouteToStore(store, appState.userLocation);
            if (routeInfo) updateRouteInfo(routeInfo);
          }
        } else {
          // Multi-stop route
          if (appState.userLocation) {
            const stops = options.stops.map(s => s.store || s);
            const routeInfo = await showMultiStopRoute(stops, appState.userLocation);
            if (routeInfo) updateRouteInfo(routeInfo);
          }
        }

        // Fit map to show all indicators and route
        appState.mapInstance.invalidateSize();
      } else if (options.storeIds) {
        // Legacy highlight by IDs
        const store = appState.stores.find(s => options.storeIds.includes(s.id));
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

  console.log('✅ NoPrecinho initialized successfully');
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
    // Fetch prices for this product, sorted by price ascending
    const pricesResponse = await fetchPrices({ product: productName, sortBy: 'price' });
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

    // Sort prices by value to find the cheapest
    const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
    const cheapestPrice = sortedPrices[0];
    const cheapestStoreId = cheapestPrice.store?.id || cheapestPrice.storeId;

    // Get unique store IDs from prices
    const storeIdsWithProduct = [...new Set(prices.map(p => p.store?.id || p.storeId).filter(Boolean))];

    // Filter stores to only those with this product
    const storesWithProduct = appState.stores.filter(s => storeIdsWithProduct.includes(s.id));

    // Find the cheapest store
    const cheapestStore = storesWithProduct.find(s => s.id === cheapestStoreId)
      || (cheapestPrice.store ? { ...cheapestPrice.store, lat: cheapestPrice.store.lat, lng: cheapestPrice.store.lng } : null);

    // Update map to highlight only stores with this product
    if (storesWithProduct.length > 0) {
      // Add markers for filtered stores with price info
      addStoreMarkers(appState.mapInstance, storesWithProduct, handleStoreClick);

      // Navigate to the cheapest store
      if (cheapestStore && cheapestStore.lat && cheapestStore.lng) {
        appState.mapInstance.setView([cheapestStore.lat, cheapestStore.lng], 16);

        // Select and show the cheapest store
        appState.selectedStore = cheapestStore;
        selectStore(cheapestStore.id);
        showStorePreview(cheapestStore);

        // Open store details to show all products
        openStoreDetail(cheapestStore);

        // Show route to cheapest store if user location is available
        if (appState.userLocation) {
          const routeInfo = await showRouteToStore(cheapestStore, appState.userLocation);
          if (routeInfo) {
            updateRouteInfo(routeInfo);
            showToast('success', '💰 Menor preço encontrado!',
              `R$ ${cheapestPrice.price.toFixed(2).replace('.', ',')} em ${cheapestStore.name} — ${routeInfo.distanceText}, ${routeInfo.durationText}`);
          } else {
            showToast('success', '💰 Menor preço encontrado!',
              `R$ ${cheapestPrice.price.toFixed(2).replace('.', ',')} em ${cheapestStore.name}`);
          }
        } else {
          showToast('success', '💰 Menor preço encontrado!',
            `R$ ${cheapestPrice.price.toFixed(2).replace('.', ',')} em ${cheapestStore.name}`);
        }
      } else {
        showToast('success', 'Resultados encontrados', `${prices.length} preço(s) em ${storesWithProduct.length} loja(s)`);
      }
    }

    // Update price list with search results (sorted by price)
    updatePriceList(sortedPrices, handlePriceCardClick);

    // Store current search state for filter re-application
    appState.currentSearch = {
      product: productName,
      prices: sortedPrices,
      stores: storesWithProduct
    };

    // Update search input to show selected product
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = productName;
    }

    // Show clear button
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) clearBtn.classList.remove('hidden');

  } catch (error) {
    console.error('Search error:', error);
    showToast('error', 'Erro ao buscar produto');
  }
}


// Clear search and show all stores
function clearProductSearch() {
  appState.currentSearch = {
    product: null,
    prices: [],
    stores: []
  };
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  // Hide clear button
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.classList.add('hidden');

  // Remove route from map
  clearRoute();

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

async function handleStoreClick(store) {
  appState.selectedStore = store;
  selectStore(store.id);
  showStorePreview(store);

  // Show route to store if user location is available
  if (appState.userLocation) {
    const routeInfo = await showRouteToStore(store, appState.userLocation);
    if (routeInfo) {
      updateRouteInfo(routeInfo);
    }
  }
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

      // Refresh user profile to get updated trustScore and points
      const refreshedUser = await auth.refreshUser();
      if (refreshedUser) {
        // Update trust score badge
        const ts = Math.round((refreshedUser.trustScore ?? 0.5) * 100);
        const level = ts >= 70 ? 'high' : ts >= 40 ? 'medium' : 'low';
        const tsVal = document.getElementById('trust-score-value');
        const tsFill = document.getElementById('trust-score-fill');
        const tsBadge = document.getElementById('trust-score-badge');
        if (tsVal) tsVal.textContent = ts.toString();
        if (tsFill) {
          tsFill.style.width = `${ts}%`;
          const hue = Math.round((ts / 100) * 120);
          tsFill.style.setProperty('--bar-color', `hsl(${hue}, 70%, 50%)`);
        }
        if (tsBadge) { tsBadge.title = `Reputação: ${ts}% (Trust Score)`; tsBadge.setAttribute('data-level', level); }
        // Update points
        const ptsEl = document.getElementById('points-count');
        if (ptsEl && refreshedUser.points !== undefined) ptsEl.textContent = refreshedUser.points.toString();
      }

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

  // If there's an active product search, re-apply filters to those results
  if (appState.currentSearch.product && appState.currentSearch.prices.length > 0) {
    let filteredPrices = [...appState.currentSearch.prices];
    let filteredStores = [...appState.currentSearch.stores];

    // Apply distance filter if user location is available
    if (appState.userLocation && settings.radius) {
      filteredStores = filteredStores.filter(store => {
        if (!store.lat || !store.lng) return true;
        const distance = calculateDistance(
          appState.userLocation.lat, appState.userLocation.lng,
          store.lat, store.lng
        );
        return distance <= settings.radius;
      });

      // Filter prices to only include stores within radius
      const storeIds = filteredStores.map(s => s.id);
      filteredPrices = filteredPrices.filter(p => {
        const storeId = p.store?.id || p.storeId;
        return storeIds.includes(storeId);
      });
    }

    // Sort based on user selection
    if (settings.sortBy === 'distance' && appState.userLocation) {
      filteredPrices.sort((a, b) => {
        const storeA = filteredStores.find(s => s.id === (a.store?.id || a.storeId));
        const storeB = filteredStores.find(s => s.id === (b.store?.id || b.storeId));
        if (!storeA || !storeB) return 0;
        const distA = calculateDistance(appState.userLocation.lat, appState.userLocation.lng, storeA.lat, storeA.lng);
        const distB = calculateDistance(appState.userLocation.lat, appState.userLocation.lng, storeB.lat, storeB.lng);
        return distA - distB;
      });
    } else {
      // Default: sort by price
      filteredPrices.sort((a, b) => a.price - b.price);
    }

    // Update map with filtered stores
    if (filteredStores.length > 0) {
      addStoreMarkers(appState.mapInstance, filteredStores, handleStoreClick);

      // Navigate to the best result (first after sorting)
      const bestPrice = filteredPrices[0];
      const bestStoreId = bestPrice?.store?.id || bestPrice?.storeId;
      const bestStore = filteredStores.find(s => s.id === bestStoreId);

      if (bestStore && bestStore.lat && bestStore.lng) {
        appState.mapInstance.setView([bestStore.lat, bestStore.lng], 14);
        appState.selectedStore = bestStore;
        selectStore(bestStore.id);
        showStorePreview(bestStore);

        showToast('success', 'Filtros aplicados',
          `${filteredPrices.length} resultado(s) em ${filteredStores.length} loja(s)`);
      }
    } else {
      showToast('warning', 'Nenhum resultado', 'Nenhuma loja encontrada com os filtros selecionados');
    }

    // Update price list
    updatePriceList(filteredPrices, handlePriceCardClick);
  } else {
    // No active search, refresh all data
    refreshData();
  }
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

  // Search clear button
  document.getElementById('search-clear')?.addEventListener('click', () => {
    clearProductSearch();
  });

  // Location button
  document.getElementById('location-btn')?.addEventListener('click', () => {
    if (appState.userLocation) {
      centerOnUser(map, appState.userLocation);
    } else {
      showToast('info', 'Localização', 'Localização não disponível');
    }
  });

  // Shopping list button (floating) - opens left sidebar (same as CTRL+L)
  document.getElementById('shopping-list-btn')?.addEventListener('click', () => {
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
