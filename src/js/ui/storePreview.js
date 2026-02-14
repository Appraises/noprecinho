// Store preview panel component
import { formatTimeAgo, formatPrice, formatDistance, getCategoryIcon } from '../utils/formatters.js';

let previewElement = null;
let onDetailsClickCallback = null;
let onReportClickCallback = null;
let onCloseCallback = null;

export function initStorePreview(onDetailsClick, onReportClick, onClose) {
    previewElement = document.getElementById('store-preview');
    onDetailsClickCallback = onDetailsClick;
    onReportClickCallback = onReportClick;
    onCloseCallback = onClose;

    // Details button
    const detailsBtn = document.getElementById('preview-details-btn');
    detailsBtn?.addEventListener('click', () => {
        if (onDetailsClickCallback) {
            onDetailsClickCallback();
        }
    });

    // Report button
    const reportBtn = document.getElementById('preview-report-btn');
    reportBtn?.addEventListener('click', () => {
        if (onReportClickCallback) {
            onReportClickCallback();
        }
    });

    // Close button
    const closeBtn = document.getElementById('preview-close');
    closeBtn?.addEventListener('click', () => {
        hideStorePreview();
    });


    // Drag handle for mobile
    const dragHandle = previewElement?.querySelector('.store-preview__drag-handle');
    if (dragHandle) {
        let startY = 0;
        let startTransform = 0;

        dragHandle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            previewElement.style.transition = 'none';
        });

        dragHandle.addEventListener('touchmove', (e) => {
            const deltaY = e.touches[0].clientY - startY;
            if (deltaY > 0) {
                previewElement.style.transform = `translateY(${deltaY}px)`;
            }
        });

        dragHandle.addEventListener('touchend', (e) => {
            previewElement.style.transition = '';
            const currentY = parseInt(previewElement.style.transform.replace(/[^-\d]/g, '') || '0');

            if (currentY > 100) {
                hideStorePreview();
            } else {
                previewElement.style.transform = '';
            }
        });
    }
}

export function showStorePreview(store) {
    if (!previewElement || !store) return;

    // Show panel
    previewElement.classList.remove('store-preview--hidden');
    previewElement.classList.add('store-preview--visible');

    // Hide route info by default when switching stores
    const routeEl = document.getElementById('preview-route-info');
    if (routeEl) routeEl.classList.add('hidden');

    try {
        const setContent = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setContent('preview-icon', getCategoryIcon(store.category));
        setContent('preview-name', store.name || 'Loja');

        const categoryLabel = getCategoryLabel(store.category);
        const distanceText = formatDistance(store.distance || 0);
        setContent('preview-category', `${categoryLabel} • ${distanceText}`);

        setContent('preview-price', formatPrice(store.lowestPrice));
        setContent('preview-count', (store.priceCount || 0).toString());
        setContent('preview-updated', formatTimeAgo(store.lastUpdate));

        // Announce for screen readers
        previewElement.setAttribute('aria-live', 'polite');
    } catch (error) {
        console.error('Error updating store preview:', error);
    }
}

export function updateRouteInfo(routeInfo) {
    const routeEl = document.getElementById('preview-route-info');
    const durationEl = document.getElementById('preview-duration');
    const distanceEl = document.getElementById('preview-route-dist');

    if (!routeEl || !routeInfo) return;

    if (durationEl) durationEl.textContent = routeInfo.durationText;
    if (distanceEl) distanceEl.textContent = routeInfo.distanceText;

    routeEl.classList.remove('hidden');
}

export function hideStorePreview() {
    if (!previewElement) return;
    previewElement.classList.remove('store-preview--visible');
    previewElement.classList.add('store-preview--hidden');
    
    // Trigger onClose callback to clean up (e.g. clear routes)
    if (onCloseCallback) {
        onCloseCallback();
    }
}

export function isPreviewVisible() {
    return previewElement && !previewElement.classList.contains('store-preview--hidden');
}

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
