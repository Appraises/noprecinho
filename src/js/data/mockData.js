// Mock data for stores and prices
// This simulates a backend database for the MVP

// São Paulo area stores
export const stores = [
    {
        id: 'store-1',
        name: 'Supermercado Pão de Açúcar',
        category: 'mercado',
        lat: -23.5489,
        lng: -46.6388,
        address: 'Av. Paulista, 1000',
        trustScore: 92,
        isOpen: true,
        lowestPrice: 12.90,
        priceCount: 45,
        lastUpdate: new Date(Date.now() - 30 * 60 * 1000) // 30 min ago
    },
    {
        id: 'store-2',
        name: 'Carrefour Express',
        category: 'mercado',
        lat: -23.5520,
        lng: -46.6350,
        address: 'Rua Augusta, 500',
        trustScore: 88,
        isOpen: true,
        lowestPrice: 11.50,
        priceCount: 32,
        lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2h ago
    },
    {
        id: 'store-3',
        name: 'Drogaria São Paulo',
        category: 'farmacia',
        lat: -23.5510,
        lng: -46.6410,
        address: 'Rua Consolação, 200',
        trustScore: 95,
        isOpen: true,
        lowestPrice: 8.99,
        priceCount: 28,
        lastUpdate: new Date(Date.now() - 15 * 60 * 1000) // 15 min ago
    },
    {
        id: 'store-4',
        name: 'Pet Center Marginal',
        category: 'pet',
        lat: -23.5465,
        lng: -46.6320,
        address: 'Av. Rebouças, 300',
        trustScore: 85,
        isOpen: true,
        lowestPrice: 45.90,
        priceCount: 18,
        lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4h ago
    },
    {
        id: 'store-5',
        name: 'Feira do Produtor',
        category: 'hortifruti',
        lat: -23.5540,
        lng: -46.6450,
        address: 'Praça da República',
        trustScore: 78,
        isOpen: false,
        lowestPrice: 3.50,
        priceCount: 52,
        lastUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
        id: 'store-6',
        name: 'Posto Ipiranga',
        category: 'combustivel',
        lat: -23.5475,
        lng: -46.6290,
        address: 'Av. Paulista, 1500',
        trustScore: 90,
        isOpen: true,
        lowestPrice: 5.89,
        priceCount: 24,
        lastUpdate: new Date(Date.now() - 45 * 60 * 1000) // 45 min ago
    },
    {
        id: 'store-7',
        name: 'Extra Supermercados',
        category: 'mercado',
        lat: -23.5580,
        lng: -46.6500,
        address: 'Rua da Consolação, 800',
        trustScore: 86,
        isOpen: true,
        lowestPrice: 10.99,
        priceCount: 67,
        lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1h ago
    },
    {
        id: 'store-8',
        name: 'Droga Raia',
        category: 'farmacia',
        lat: -23.5530,
        lng: -46.6380,
        address: 'Alameda Santos, 400',
        trustScore: 93,
        isOpen: true,
        lowestPrice: 7.49,
        priceCount: 35,
        lastUpdate: new Date(Date.now() - 20 * 60 * 1000) // 20 min ago
    },
    {
        id: 'store-9',
        name: 'Cobasi',
        category: 'pet',
        lat: -23.5600,
        lng: -46.6420,
        address: 'Rua Oscar Freire, 200',
        trustScore: 91,
        isOpen: true,
        lowestPrice: 52.90,
        priceCount: 22,
        lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3h ago
    },
    {
        id: 'store-10',
        name: 'Sacolão Municipal',
        category: 'hortifruti',
        lat: -23.5450,
        lng: -46.6350,
        address: 'Rua Haddock Lobo, 150',
        trustScore: 82,
        isOpen: true,
        lowestPrice: 2.99,
        priceCount: 41,
        lastUpdate: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5h ago
    },
    {
        id: 'store-11',
        name: 'Shell Select',
        category: 'combustivel',
        lat: -23.5555,
        lng: -46.6310,
        address: 'Rua Augusta, 800',
        trustScore: 88,
        isOpen: true,
        lowestPrice: 5.79,
        priceCount: 19,
        lastUpdate: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5h ago
    },
    {
        id: 'store-12',
        name: 'Dia Supermercados',
        category: 'mercado',
        lat: -23.5495,
        lng: -46.6440,
        address: 'Av. Brigadeiro, 600',
        trustScore: 79,
        isOpen: true,
        lowestPrice: 9.49,
        priceCount: 53,
        lastUpdate: new Date(Date.now() - 40 * 60 * 1000) // 40 min ago
    },
    {
        id: 'store-13',
        name: 'Ultrafarma',
        category: 'farmacia',
        lat: -23.5615,
        lng: -46.6360,
        address: 'Av. Angélica, 300',
        trustScore: 84,
        isOpen: false,
        lowestPrice: 6.99,
        priceCount: 29,
        lastUpdate: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8h ago
    },
    {
        id: 'store-14',
        name: 'Petz',
        category: 'pet',
        lat: -23.5430,
        lng: -46.6400,
        address: 'Rua Estados Unidos, 500',
        trustScore: 89,
        isOpen: true,
        lowestPrice: 38.90,
        priceCount: 27,
        lastUpdate: new Date(Date.now() - 2.5 * 60 * 60 * 1000) // 2.5h ago
    },
    {
        id: 'store-15',
        name: 'Hortifruti Natural',
        category: 'hortifruti',
        lat: -23.5570,
        lng: -46.6280,
        address: 'Rua Pamplona, 100',
        trustScore: 87,
        isOpen: true,
        lowestPrice: 4.20,
        priceCount: 38,
        lastUpdate: new Date(Date.now() - 50 * 60 * 1000) // 50 min ago
    }
];

// Sample prices data
export const prices = [
    // Mercado prices
    { id: 'p1', storeId: 'store-1', product: 'Arroz Tio João 5kg', price: 24.90, unit: 'pacote', reporter: 'João M.', timestamp: new Date(Date.now() - 30 * 60 * 1000), hasPhoto: true, votes: 12, category: 'mercado' },
    { id: 'p2', storeId: 'store-1', product: 'Feijão Carioca 1kg', price: 7.49, unit: 'pacote', reporter: 'Maria S.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), hasPhoto: false, votes: 8, category: 'mercado' },
    { id: 'p3', storeId: 'store-2', product: 'Leite Integral Parmalat', price: 5.99, unit: 'L', reporter: 'Pedro L.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), hasPhoto: true, votes: 15, category: 'mercado' },
    { id: 'p4', storeId: 'store-2', product: 'Óleo de Soja Liza', price: 8.49, unit: '900ml', reporter: 'Ana C.', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), hasPhoto: false, votes: 5, category: 'mercado' },
    { id: 'p5', storeId: 'store-7', product: 'Açúcar Cristal União', price: 4.29, unit: 'kg', reporter: 'Carlos R.', timestamp: new Date(Date.now() - 45 * 60 * 1000), hasPhoto: true, votes: 22, category: 'mercado' },
    { id: 'p6', storeId: 'store-12', product: 'Macarrão Barilla', price: 6.99, unit: '500g', reporter: 'Lucia F.', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), hasPhoto: false, votes: 7, category: 'mercado' },

    // Farmacia prices
    { id: 'p7', storeId: 'store-3', product: 'Dipirona Genérico', price: 8.99, unit: '20 comp', reporter: 'Roberto A.', timestamp: new Date(Date.now() - 15 * 60 * 1000), hasPhoto: true, votes: 18, category: 'farmacia' },
    { id: 'p8', storeId: 'store-3', product: 'Vitamina C Efervescente', price: 12.50, unit: '10 comp', reporter: 'Sandra M.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), hasPhoto: false, votes: 9, category: 'farmacia' },
    { id: 'p9', storeId: 'store-8', product: 'Ibuprofeno 400mg', price: 7.49, unit: '20 comp', reporter: 'Felipe G.', timestamp: new Date(Date.now() - 20 * 60 * 1000), hasPhoto: true, votes: 14, category: 'farmacia' },
    { id: 'p10', storeId: 'store-13', product: 'Paracetamol 750mg', price: 6.99, unit: '20 comp', reporter: 'Claudia B.', timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), hasPhoto: false, votes: 11, category: 'farmacia' },

    // Pet prices
    { id: 'p11', storeId: 'store-4', product: 'Ração Golden Premium', price: 89.90, unit: '15kg', reporter: 'Marcos V.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), hasPhoto: true, votes: 25, category: 'pet' },
    { id: 'p12', storeId: 'store-9', product: 'Areia Higiênica Pipicat', price: 24.90, unit: '4kg', reporter: 'Juliana P.', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), hasPhoto: false, votes: 16, category: 'pet' },
    { id: 'p13', storeId: 'store-14', product: 'Petisco Pedigree Dentastix', price: 32.90, unit: '7 un', reporter: 'André L.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), hasPhoto: true, votes: 13, category: 'pet' },

    // Hortifruti prices
    { id: 'p14', storeId: 'store-5', product: 'Tomate Italiano', price: 8.99, unit: 'kg', reporter: 'Teresa A.', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), hasPhoto: false, votes: 19, category: 'hortifruti' },
    { id: 'p15', storeId: 'store-10', product: 'Banana Prata', price: 5.49, unit: 'kg', reporter: 'Paulo H.', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), hasPhoto: true, votes: 21, category: 'hortifruti' },
    { id: 'p16', storeId: 'store-15', product: 'Alface Americana', price: 4.99, unit: 'un', reporter: 'Renata S.', timestamp: new Date(Date.now() - 50 * 60 * 1000), hasPhoto: false, votes: 8, category: 'hortifruti' },

    // Combustivel prices
    { id: 'p17', storeId: 'store-6', product: 'Gasolina Comum', price: 5.89, unit: 'L', reporter: 'Ricardo M.', timestamp: new Date(Date.now() - 45 * 60 * 1000), hasPhoto: true, votes: 32, category: 'combustivel' },
    { id: 'p18', storeId: 'store-6', product: 'Etanol', price: 3.99, unit: 'L', reporter: 'Fernanda C.', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), hasPhoto: true, votes: 28, category: 'combustivel' },
    { id: 'p19', storeId: 'store-11', product: 'Gasolina Comum', price: 5.79, unit: 'L', reporter: 'Bruno T.', timestamp: new Date(Date.now() - 90 * 60 * 1000), hasPhoto: false, votes: 24, category: 'combustivel' },
    { id: 'p20', storeId: 'store-11', product: 'Diesel S10', price: 6.29, unit: 'L', reporter: 'Gustavo N.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), hasPhoto: true, votes: 17, category: 'combustivel' }
];

// Sample products for autocomplete
export const products = [
    { name: 'Arroz Tio João 5kg', aliases: ['arroz', 'tio joao'], category: 'mercado' },
    { name: 'Feijão Carioca 1kg', aliases: ['feijao', 'feijão'], category: 'mercado' },
    { name: 'Leite Integral', aliases: ['leite'], category: 'mercado' },
    { name: 'Óleo de Soja', aliases: ['oleo', 'óleo'], category: 'mercado' },
    { name: 'Açúcar Cristal', aliases: ['açucar', 'acucar'], category: 'mercado' },
    { name: 'Dipirona', aliases: ['dipirona', 'dor de cabeça'], category: 'farmacia' },
    { name: 'Ibuprofeno', aliases: ['ibuprofeno', 'advil'], category: 'farmacia' },
    { name: 'Ração Golden', aliases: ['ração', 'racao', 'golden'], category: 'pet' },
    { name: 'Areia Higiênica', aliases: ['areia', 'gato'], category: 'pet' },
    { name: 'Gasolina Comum', aliases: ['gasolina'], category: 'combustivel' },
    { name: 'Etanol', aliases: ['alcool', 'álcool', 'etanol'], category: 'combustivel' },
    { name: 'Tomate', aliases: ['tomate'], category: 'hortifruti' },
    { name: 'Banana', aliases: ['banana'], category: 'hortifruti' },
    { name: 'Alface', aliases: ['alface', 'salada'], category: 'hortifruti' }
];

// Get store by ID
export function getStoreById(id) {
    return stores.find(s => s.id === id);
}

// Get prices for a store
export function getStorePrices(storeId) {
    return prices.filter(p => p.storeId === storeId);
}

// Get nearby stores within radius (km)
export function getNearbyStores(location, radiusKm = 5) {
    return stores.filter(store => {
        const distance = calculateDistance(location.lat, location.lng, store.lat, store.lng);
        return distance <= radiusKm;
    }).map(store => ({
        ...store,
        distance: calculateDistance(location.lat, location.lng, store.lat, store.lng)
    })).sort((a, b) => a.distance - b.distance);
}

// Get filtered prices
export function getFilteredPrices(filters = {}) {
    const { categories = ['all'], freshOnly = false, verifiedOnly = false, sortBy = 'price' } = filters;

    let filtered = [...prices];

    // Filter by category
    if (!categories.includes('all')) {
        filtered = filtered.filter(p => categories.includes(p.category));
    }

    // Filter by freshness (48h)
    if (freshOnly) {
        const cutoff = Date.now() - 48 * 60 * 60 * 1000;
        filtered = filtered.filter(p => p.timestamp.getTime() > cutoff);
    }

    // Filter by verified (has photo)
    if (verifiedOnly) {
        filtered = filtered.filter(p => p.hasPhoto);
    }

    // Sort
    switch (sortBy) {
        case 'price':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'recency':
            filtered.sort((a, b) => b.timestamp - a.timestamp);
            break;
        case 'trust':
            filtered.sort((a, b) => b.votes - a.votes);
            break;
        case 'distance':
            // Would need location - skip for now
            break;
    }

    return filtered;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

// Search products
export function searchProducts(query) {
    const q = query.toLowerCase();
    return products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.aliases.some(a => a.includes(q))
    );
}

// Add new price (mock - stores in memory)
export function addPrice(priceData) {
    const newPrice = {
        id: `p${Date.now()}`,
        ...priceData,
        timestamp: new Date(),
        votes: 0
    };
    prices.unshift(newPrice);

    // Update store's lowest price if needed
    const store = stores.find(s => s.id === priceData.storeId);
    if (store && priceData.price < store.lowestPrice) {
        store.lowestPrice = priceData.price;
    }
    if (store) {
        store.priceCount++;
        store.lastUpdate = new Date();
    }

    return newPrice;
}

// Vote on a price
export function votePrice(priceId, isUpvote) {
    const price = prices.find(p => p.id === priceId);
    if (price) {
        price.votes += isUpvote ? 1 : -1;
    }
    return price;
}
