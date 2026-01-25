// Utility formatters

// Format price in Brazilian Real
export function formatPrice(value) {
    if (value === null || value === undefined) return '—';
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

// Format time ago
export function formatTimeAgo(date) {
    if (!date) return '—';

    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days === 1) return '1 dia';
    if (days < 7) return `${days} dias`;
    if (days < 30) return `${Math.floor(days / 7)} sem`;
    return `${Math.floor(days / 30)} mês`;
}

// Format distance
export function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1).replace('.', ',')} km`;
}

// Get category icon
export function getCategoryIcon(category) {
    const icons = {
        mercado: '🛒',
        hortifruti: '🥬',
        farmacia: '💊',
        pet: '🐾',
        combustivel: '⛽',
        outros: '📦'
    };
    return icons[category] || '🏪';
}

// Get category label
export function getCategoryLabel(category) {
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

// Get freshness badge class
export function getFreshnessBadge(date) {
    if (!date) return { class: 'badge--outdated', text: 'desatualizado' };

    const now = new Date();
    const diff = now - new Date(date);
    const hours = diff / 3600000;

    if (hours < 2) return { class: 'badge--fresh', text: 'agora' };
    if (hours < 24) return { class: 'badge--fresh', text: formatTimeAgo(date) };
    if (hours < 48) return { class: 'badge--stale', text: formatTimeAgo(date) };
    return { class: 'badge--outdated', text: formatTimeAgo(date) };
}

// Get trust score class
export function getTrustScoreClass(score) {
    if (score >= 80) return 'trust-score--high';
    if (score >= 50) return 'trust-score--medium';
    return 'trust-score--low';
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format unit display
export function formatUnit(unit) {
    const unitLabels = {
        'kg': 'kg',
        'g': 'g',
        'L': 'L',
        'ml': 'ml',
        'un': 'un.',
        'dz': 'dz.',
        'pacote': 'pct',
        'caixa': 'cx'
    };
    return unitLabels[unit] || unit;
}
