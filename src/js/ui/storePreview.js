// Store preview panel component
import { formatTimeAgo, formatPrice, formatDistance, getCategoryIcon } from '../utils/formatters.js';

let previewElement = null;
let onDetailsClickCallback = null;

export function initStorePreview(onDetailsClick) {
    previewElement = document.getElementById('store-preview');
    onDetailsClickCallback = onDetailsClick;

    // Details button
    const detailsBtn = document.getElementById('preview-details-btn');
    detailsBtn?.addEventListener('click', () => {
        if (onDetailsClickCallback) {
            onDetailsClickCallback();
        }
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

export function hideStorePreview() {
    if (!previewElement) return;
    previewElement.classList.add('store-preview--hidden');
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
