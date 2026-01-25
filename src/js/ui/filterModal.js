// Filter modal component

let modalOverlay = null;
let currentSettings = {};
let onApplyCallback = null;

export function initFilterModal(onApply) {
    modalOverlay = document.getElementById('filter-modal');
    onApplyCallback = onApply;

    // Close button
    document.getElementById('filter-modal-close')?.addEventListener('click', closeModal);

    // Overlay click
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Radius slider
    const radiusSlider = document.getElementById('radius-slider');
    const radiusValue = document.getElementById('radius-value');

    radiusSlider?.addEventListener('input', (e) => {
        radiusValue.textContent = e.target.value;
    });

    // Apply button
    document.getElementById('filter-apply')?.addEventListener('click', applyFilters);

    // Reset button
    document.getElementById('filter-reset')?.addEventListener('click', resetFilters);
}

export function openFilterModal(settings) {
    if (!modalOverlay) return;

    currentSettings = { ...settings };

    // Populate form
    document.getElementById('radius-slider').value = settings.radius || 5;
    document.getElementById('radius-value').textContent = settings.radius || 5;
    document.getElementById('filter-fresh').checked = settings.freshOnly !== false;
    document.getElementById('filter-verified').checked = settings.verifiedOnly || false;
    document.getElementById('filter-open').checked = settings.openNow || false;
    document.getElementById('sort-by').value = settings.sortBy || 'price';

    modalOverlay.classList.add('modal-overlay--visible');
}

function closeModal() {
    modalOverlay?.classList.remove('modal-overlay--visible');
}

function applyFilters() {
    const settings = {
        radius: parseInt(document.getElementById('radius-slider').value),
        freshOnly: document.getElementById('filter-fresh').checked,
        verifiedOnly: document.getElementById('filter-verified').checked,
        openNow: document.getElementById('filter-open').checked,
        sortBy: document.getElementById('sort-by').value
    };

    if (onApplyCallback) {
        onApplyCallback(settings);
    }

    closeModal();
}

function resetFilters() {
    document.getElementById('radius-slider').value = 5;
    document.getElementById('radius-value').textContent = '5';
    document.getElementById('filter-fresh').checked = true;
    document.getElementById('filter-verified').checked = false;
    document.getElementById('filter-open').checked = false;
    document.getElementById('sort-by').value = 'price';
}

export function getFilterSettings() {
    return currentSettings;
}
