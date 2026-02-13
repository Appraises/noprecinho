// Map module - Leaflet integration with marker clustering
import L from 'leaflet';
import 'leaflet.markercluster';
import { stores as storeData } from './data/mockData.js';

let mapInstance = null;
let markersLayer = null;
let categoryLayers = {};
let routeLayer = null;
let userMarker = null;
let shoppingIndicatorsLayer = null;
let selectedStoreId = null;
let storeMarkers = {};
let currentTileLayer = null;

// Tile layer URLs for themes
const tileLayers = {
    light: {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    },
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    }
};

// Category icons and colors mapping
const categoryConfig = {
    mercado: { icon: '🛒', color: '#10B981', clusterColor: 'rgba(16, 185, 129, 0.6)' },
    hortifruti: { icon: '🥬', color: '#84CC16', clusterColor: 'rgba(132, 204, 22, 0.6)' },
    farmacia: { icon: '💊', color: '#3B82F6', clusterColor: 'rgba(59, 130, 246, 0.6)' },
    pet: { icon: '🐾', color: '#F59E0B', clusterColor: 'rgba(245, 158, 11, 0.6)' },
    combustivel: { icon: '⛽', color: '#EF4444', clusterColor: 'rgba(239, 68, 68, 0.6)' },
    outros: { icon: '📦', color: '#8B5CF6', clusterColor: 'rgba(139, 92, 246, 0.6)' }
};

// Create custom store marker with category color
function createStoreMarker(store, isSelected = false) {
    const config = categoryConfig[store.category] || categoryConfig.outros;
    const priceLabel = store.lowestPrice
        ? `<div class="price-label">R$ ${store.lowestPrice.toFixed(2).replace('.', ',')}</div>`
        : '';

    const pinColor = isSelected ? '#10B981' : config.color;

    const html = `
    <div class="store-marker ${isSelected ? 'store-marker--selected' : ''}" data-store-id="${store.id}">
      ${priceLabel}
      <div class="store-marker__pin" style="background-color: ${pinColor};">
        <span class="store-marker__pin-inner">${config.icon}</span>
      </div>
    </div>
  `;

    return L.divIcon({
        className: 'store-marker-container',
        html: html,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -50]
    });
}

// Create user location marker
function createUserMarker() {
    return L.divIcon({
        className: 'user-location-marker-container',
        html: '<div class="user-location-marker"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
}

// Create cluster icon with category color
function createCategoryClusterIcon(category) {
    const config = categoryConfig[category] || categoryConfig.outros;

    return function (cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        let dimensions = 30;

        if (count >= 100) {
            size = 'large';
            dimensions = 50;
        } else if (count >= 10) {
            size = 'medium';
            dimensions = 40;
        }

        return L.divIcon({
            html: `<div style="background-color: ${config.clusterColor}; width: ${dimensions}px; height: ${dimensions}px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: ${config.color}; width: ${dimensions - 10}px; height: ${dimensions - 10}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${size === 'large' ? '14px' : '12px'};">
          ${count}
        </div>
      </div>`,
            className: `marker-cluster marker-cluster-${size} marker-cluster-${category}`,
            iconSize: L.point(dimensions, dimensions)
        });
    };
}

// Default cluster icon (mixed categories)
function createClusterIcon(cluster) {
    const count = cluster.getChildCount();
    let size = 'small';

    if (count >= 100) {
        size = 'large';
    } else if (count >= 10) {
        size = 'medium';
    }

    return L.divIcon({
        html: `<div><span>${count}</span></div>`,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: L.point(40, 40)
    });
}

// Get current theme
function getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

// Set map tile layer based on theme
export function setMapTheme(theme) {
    if (!mapInstance) return;

    const layerConfig = tileLayers[theme] || tileLayers.light;

    // Remove current tile layer
    if (currentTileLayer) {
        mapInstance.removeLayer(currentTileLayer);
    }

    // Add new tile layer
    currentTileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: 19
    }).addTo(mapInstance);
}

// Initialize the map
export function initMap(elementId, options = {}) {
    // Default to Aracaju, SE coordinates
    const { center = [-10.9472, -37.0731], zoom = 14 } = options;

    // Create map instance
    mapInstance = L.map(elementId, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        attributionControl: true
    });

    // Detect current theme and add appropriate tiles
    const currentTheme = getCurrentTheme();
    const layerConfig = tileLayers[currentTheme] || tileLayers.light;

    currentTileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: 19
    }).addTo(mapInstance);

    // Create main marker cluster group
    markersLayer = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: createClusterIcon,
        maxClusterRadius: 60,
        disableClusteringAtZoom: 17
    });

    mapInstance.addLayer(markersLayer);



    // Create separate cluster groups for each category
    Object.keys(categoryConfig).forEach(category => {
        categoryLayers[category] = L.markerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: createCategoryClusterIcon(category),
            maxClusterRadius: 50,
            disableClusteringAtZoom: 17
        });
    });

    // Handle zoom to show/hide price labels
    mapInstance.on('zoomend', () => {
        const currentZoom = mapInstance.getZoom();
        const priceLabels = document.querySelectorAll('.price-label');

        priceLabels.forEach(label => {
            if (currentZoom < 13) {
                label.classList.add('price-label--hidden');
            } else {
                label.classList.remove('price-label--hidden');
            }
        });
    });

    // Move zoom control to bottom right on mobile
    if (window.innerWidth < 768) {
        mapInstance.zoomControl.setPosition('bottomleft');
    }

    return mapInstance;
}

// Center map on user location
export function centerOnUser(map, location) {
    if (!map || !location) return;

    map.setView([location.lat, location.lng], 15, {
        animate: true,
        duration: 0.5
    });

    // Add or update user marker
    if (userMarker) {
        userMarker.setLatLng([location.lat, location.lng]);
    } else {
        userMarker = L.marker([location.lat, location.lng], {
            icon: createUserMarker(),
            zIndexOffset: 1000
        }).addTo(map);
    }
}

// Pan to specific location (for search)
export function panToLocation(lat, lng, zoom = 16) {
    if (!mapInstance) return;

    mapInstance.setView([lat, lng], zoom, {
        animate: true,
        duration: 0.8
    });
}

// Search and pan to store by name
export function searchAndPanToStore(storeName) {
    const store = storeData.find(s =>
        s.name.toLowerCase().includes(storeName.toLowerCase())
    );

    if (store) {
        panToLocation(store.lat, store.lng, 17);
        selectStore(store.id);
        return store;
    }

    return null;
}

// Geocode address and pan to it (using Nominatim)
export async function searchAddress(query) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5`
        );
        const results = await response.json();

        if (results.length > 0) {
            const first = results[0];
            panToLocation(parseFloat(first.lat), parseFloat(first.lon));
            return results;
        }

        return [];
    } catch (error) {
        console.error('Geocoding error:', error);
        return [];
    }
}

// Add store markers to the map
export function addStoreMarkers(map, stores, onStoreClick) {
    console.log('addStoreMarkers called with:', {
        map: !!map,
        markersLayer: !!markersLayer,
        storesCount: stores ? stores.length : 'null'
    });

    if (!map || !markersLayer) {
        console.warn('Map or markersLayer not initialized');
        return;
    }

    if (!stores || !Array.isArray(stores)) {
        console.warn('Invalid stores data:', stores);
        return;
    }

    // Clear existing markers
    try {
        markersLayer.clearLayers();
        storeMarkers = {};
    } catch (e) {
        console.error('Error clearing layers:', e);
    }

    stores.forEach(store => {
        try {
            if (!store.lat || !store.lng) {
                console.warn('Store missing coordinates:', store);
                return;
            }

            const marker = L.marker([store.lat, store.lng], {
                icon: createStoreMarker(store, store.id === selectedStoreId)
            });

            // Add tooltip
            marker.bindTooltip(`
        <div class="store-tooltip">
            <div class="store-tooltip__name">${store.name}</div>
            <div class="store-tooltip__category">${getCategoryLabel(store.category)}</div>
            ${store.lowestPrice ? `
            <div class="store-tooltip__price">
                <span class="store-tooltip__price-value">R$ ${store.lowestPrice.toFixed(2).replace('.', ',')}</span>
                <span class="store-tooltip__price-label">menor preço</span>
            </div>
            ` : ''}
        </div>
        `, {
                direction: 'top',
                offset: [0, -50],
                className: 'store-marker-tooltip'
            });

            // Click handler
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                if (onStoreClick) {
                    onStoreClick(store);
                }
            });

            storeMarkers[store.id] = marker;
            markersLayer.addLayer(marker);
        } catch (err) {
            console.error('Error adding marker for store:', store, err);
        }
    });

    console.log(`Added ${Object.keys(storeMarkers).length} markers to map`);
}

// Add markers grouped by category (for category-colored clusters)
export function addStoreMarkersByCategory(map, stores, onStoreClick) {
    if (!map) return;

    // Clear all category layers
    Object.values(categoryLayers).forEach(layer => {
        map.removeLayer(layer);
        layer.clearLayers();
    });
    storeMarkers = {};

    // Group stores by category
    const storesByCategory = {};
    stores.forEach(store => {
        if (!storesByCategory[store.category]) {
            storesByCategory[store.category] = [];
        }
        storesByCategory[store.category].push(store);
    });

    // Add to respective category layers
    Object.entries(storesByCategory).forEach(([category, categoryStores]) => {
        const layer = categoryLayers[category];
        if (!layer) return;

        categoryStores.forEach(store => {
            const marker = L.marker([store.lat, store.lng], {
                icon: createStoreMarker(store, store.id === selectedStoreId)
            });

            marker.bindTooltip(`
        <div class="store-tooltip">
          <div class="store-tooltip__name">${store.name}</div>
          <div class="store-tooltip__category">${getCategoryLabel(store.category)}</div>
          ${store.lowestPrice ? `
            <div class="store-tooltip__price">
              <span class="store-tooltip__price-value">R$ ${store.lowestPrice.toFixed(2).replace('.', ',')}</span>
              <span class="store-tooltip__price-label">menor preço</span>
            </div>
          ` : ''}
        </div>
      `, {
                direction: 'top',
                offset: [0, -50],
                className: 'store-marker-tooltip'
            });

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                if (onStoreClick) {
                    onStoreClick(store);
                }
            });

            storeMarkers[store.id] = marker;
            layer.addLayer(marker);
        });

        map.addLayer(layer);
    });
}

// Select a store (update marker appearance)
export function selectStore(storeId) {
    // Update previous selection
    if (selectedStoreId && storeMarkers[selectedStoreId]) {
        const prevStore = getStoreById(selectedStoreId);
        if (prevStore) {
            storeMarkers[selectedStoreId].setIcon(createStoreMarker(prevStore, false));
        }
    }

    // Update new selection
    selectedStoreId = storeId;
    if (storeId && storeMarkers[storeId]) {
        const store = getStoreById(storeId);
        if (store) {
            storeMarkers[storeId].setIcon(createStoreMarker(store, true));

            // Pan to store if not visible
            const bounds = mapInstance.getBounds();
            if (!bounds.contains([store.lat, store.lng])) {
                mapInstance.panTo([store.lat, store.lng], { animate: true });
            }
        }
    }
}

// Show route to store using OSRM
export async function showRouteToStore(store, userLocation) {
    if (!mapInstance || !store || !userLocation) return null;

    // Remove existing route
    if (routeLayer) {
        mapInstance.removeLayer(routeLayer);
    }

    try {
        // Use OSRM for routing
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${store.lng},${store.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            // Draw route on map
            routeLayer = L.geoJSON(route.geometry, {
                style: {
                    color: '#3B82F6',
                    weight: 5,
                    opacity: 0.8
                }
            }).addTo(mapInstance);

            // Fit map to show entire route
            mapInstance.fitBounds(routeLayer.getBounds(), {
                padding: [50, 50]
            });

            return {
                distance: route.distance, // meters
                duration: route.duration, // seconds
                distanceText: formatDistance(route.distance),
                durationText: formatDuration(route.duration)
            };
        }

        return null;
    } catch (error) {
        console.error('Routing error:', error);
        return null;
    }
}

// Show shopping list items above stores on map
// Show shopping list items above stores on map
export function showShoppingIndicators(stops) {
    if (!mapInstance) return;

    // Lazy init
    if (!shoppingIndicatorsLayer) {
        shoppingIndicatorsLayer = L.layerGroup().addTo(mapInstance);
    }

    // Clear existing indicators
    shoppingIndicatorsLayer.clearLayers();

    stops.forEach(stop => {
        const store = stop.store || stop;
        const rawItems = stop.items || stop.storeAItems || stop.storeBItems;
        const items = Array.isArray(rawItems) ? rawItems : [];

        if (!store.lat || !store.lng) return;

        // Create a custom label icon
        const itemsHtml = items.map(i => `• ${i.productName || i.name}`).join('<br>'); // Defensive map check already handled by empty array default
        const labelHtml = `
            <div class="shopping-label">
                <div class="shopping-label__title">${store.name}</div>
                <div class="shopping-label__items">${itemsHtml}</div>
            </div>
        `;

        const labelIcon = L.divIcon({
            className: 'shopping-label-container',
            html: labelHtml,
            iconSize: [120, 'auto'],
            iconAnchor: [60, 0] // Anchor at top middle
        });

        L.marker([store.lat, store.lng], {
            icon: labelIcon,
            interactive: false,
            zIndexOffset: 1000
        }).addTo(shoppingIndicatorsLayer);
    });
}

// Clear shopping indicators
export function clearShoppingIndicators() {
    if (shoppingIndicatorsLayer) {
        shoppingIndicatorsLayer.clearLayers();
    }
}

// Show route with multiple stops
export async function showMultiStopRoute(stops, userLocation) {
    if (!mapInstance || !stops || stops.length === 0 || !userLocation) return null;

    // Remove existing route
    if (routeLayer) {
        mapInstance.removeLayer(routeLayer);
    }

    try {
        // Construct coordinates: user -> stop1 -> stop2...
        const coords = [
            `${userLocation.lng},${userLocation.lat}`,
            ...stops.map(s => `${s.lng},${s.lat}`)
        ].join(';');

        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];

            // Draw route on map
            routeLayer = L.geoJSON(route.geometry, {
                style: {
                    color: '#6C5CE7', // Different color for multi-stop
                    weight: 6,
                    opacity: 0.8,
                    dashArray: '10, 10' // Dashed line to indicate multiple stops
                }
            }).addTo(mapInstance);

            // Fit map to show entire route
            mapInstance.fitBounds(routeLayer.getBounds(), {
                padding: [50, 50]
            });

            return {
                distance: route.distance,
                duration: route.duration,
                distanceText: formatDistance(route.distance),
                durationText: formatDuration(route.duration)
            };
        }

        return null;
    } catch (error) {
        console.error('Multi-stop routing error:', error);
        return null;
    }
}

// Clear route from map
export function clearRoute() {
    if (routeLayer) {
        mapInstance.removeLayer(routeLayer);
        routeLayer = null;
    }
}

// Open directions in external map app
export function openDirections(store, userLocation, mode = 'driving') {
    const origin = userLocation
        ? `${userLocation.lat},${userLocation.lng}`
        : '';
    const destination = `${store.lat},${store.lng}`;

    // Try Google Maps first, fallback to OpenStreetMap
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${mode}`;
    const osmUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin}%3B${destination}`;

    // Open Google Maps in new tab
    window.open(googleMapsUrl, '_blank');
}

// Helper to format distance
function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

// Helper to format duration
function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
}

// Helper to get store by ID
function getStoreById(id) {
    return storeData.find(s => s.id === id) || null;
}

// Get category label
function getCategoryLabel(category) {
    const labels = {
        mercado: 'Mercado',
        hortifruti: 'Hortifrúti',
        farmacia: 'Farmácia',
        pet: 'Pet Shop',
        combustivel: 'Posto',
        outros: 'Outros'
    };
    return labels[category] || category;
}

// Export map instance getter
export function getMap() {
    return mapInstance;
}

// Get user marker position
export function getUserLocation() {
    if (userMarker) {
        const latlng = userMarker.getLatLng();
        return { lat: latlng.lat, lng: latlng.lng };
    }
    return null;
}

// Fit bounds to show all markers
export function fitToMarkers() {
    if (mapInstance && markersLayer.getLayers().length > 0) {
        mapInstance.fitBounds(markersLayer.getBounds(), {
            padding: [50, 50],
            maxZoom: 15
        });
    }
}

// Add a temporary marker (for new store creation)
export function addTemporaryMarker(lat, lng) {
    return L.marker([lat, lng], {
        draggable: true
    }).addTo(mapInstance);
}

// Remove temporary marker
export function removeTemporaryMarker(marker) {
    if (marker) {
        mapInstance.removeLayer(marker);
    }
}

// Export category config for use elsewhere
export function getCategoryConfig() {
    return categoryConfig;
}

// Internal styles for map markers/labels
const style = document.createElement('style');
style.innerHTML = `
    .shopping-label-container {
        background: none;
        border: none;
    }
    .shopping-label {
        background: white;
        border: 2px solid var(--color-primary, #6C5CE7);
        border-radius: 8px;
        padding: 6px 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: inherit;
        pointer-events: none;
        position: relative;
        bottom: 80px; /* Position above marker */
        transform: translateX(-50%);
        min-width: 140px;
        z-index: 1000;
    }
    .shopping-label::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid var(--color-primary, #6C5CE7);
    }
    .shopping-label__title {
        font-weight: 700;
        font-size: 11px;
        color: var(--color-primary, #6C5CE7);
        margin-bottom: 4px;
        text-transform: uppercase;
        border-bottom: 1px solid #eee;
        padding-bottom: 2px;
    }
    .shopping-label__items {
        font-size: 12px;
        color: #333;
        line-height: 1.4;
    }
`;
document.head.appendChild(style);
