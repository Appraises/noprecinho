/**
 * Large Database Seed Script (Final Expanded)
 * Generates extensive data for ~150 products per store
 * Includes existing database products in the loop
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Data Arrays
const CATEGORIES = {
    MERCADO: 'mercado',
    FARMACIA: 'farmacia',
    PET: 'pet',
    HORTIFRUTI: 'hortifruti',
    COMBUSTIVEL: 'combustivel',
    OUTROS: 'outros'
};

const STORES_BASE = [
    { name: 'GBarbosa', category: CATEGORIES.MERCADO, trust: 85 },
    { name: 'Assaí Atacadista', category: CATEGORIES.MERCADO, trust: 90 },
    { name: 'Atacadão', category: CATEGORIES.MERCADO, trust: 88 },
    { name: 'Pão de Açúcar', category: CATEGORIES.MERCADO, trust: 92 },
    { name: 'Mercadinho da Esquina', category: CATEGORIES.MERCADO, trust: 60 },
    { name: 'Hortifruti da Terra', category: CATEGORIES.HORTIFRUTI, trust: 85 },
    { name: 'Feira Livre', category: CATEGORIES.HORTIFRUTI, trust: 70 },
    { name: 'Drogasil', category: CATEGORIES.FARMACIA, trust: 95 },
    { name: 'Pague Menos', category: CATEGORIES.FARMACIA, trust: 90 },
    { name: 'Farmácia do Trabalhador', category: CATEGORIES.FARMACIA, trust: 80 },
    { name: 'Petz', category: CATEGORIES.PET, trust: 92 },
    { name: 'Cobasi', category: CATEGORIES.PET, trust: 91 },
    { name: 'Posto Ipiranga', category: CATEGORIES.COMBUSTIVEL, trust: 88 },
    { name: 'Posto Shell', category: CATEGORIES.COMBUSTIVEL, trust: 89 },
    { name: 'Posto BR', category: CATEGORIES.COMBUSTIVEL, trust: 85 },
];

const LOCATIONS = [
    { name: 'Jardins', lat: -10.9472, lng: -37.0731 },
    { name: 'Centro', lat: -10.9110, lng: -37.0500 },
    { name: 'Atalaia', lat: -10.9850, lng: -37.0550 },
    { name: 'Farolândia', lat: -10.9660, lng: -37.0600 },
    { name: 'Siqueira Campos', lat: -10.9250, lng: -37.0800 },
];

// Helper to generate variations
const generateVariations = (baseName, varieties, unit, category, basePrice) => {
    return varieties.map(v => ({
        name: `${baseName} ${v}`,
        unit,
        category,
        basePrice: basePrice * (0.8 + Math.random() * 0.4) // +/- 20% variance
    }));
};

const PRODUCTS_DATA = [
    // --- HORTIFRUTI (Extensive) ---
    ...generateVariations('Maçã', ['Gala', 'Fuji', 'Verde', 'Red Delicious'], 'kg', CATEGORIES.HORTIFRUTI, 10.90),
    ...generateVariations('Banana', ['Prata', 'Nanica', 'da Terra', 'Ouro'], 'kg', CATEGORIES.HORTIFRUTI, 5.50),
    ...generateVariations('Uva', ['Thompson', 'Rubi', 'Itália', 'Niagara', 'Crimson'], '500g', CATEGORIES.HORTIFRUTI, 9.90),
    ...generateVariations('Batata', ['Inglesa', 'Doce', 'Asterix', 'Baroa'], 'kg', CATEGORIES.HORTIFRUTI, 6.00),
    ...generateVariations('Cebola', ['Branca', 'Roxa', 'Echalote'], 'kg', CATEGORIES.HORTIFRUTI, 5.00),
    { name: 'Alface Americana', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    { name: 'Alface Crespa', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 2.50 },
    { name: 'Alface Mimosa', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 3.00 },
    { name: 'Rúcula', unit: 'maço', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    { name: 'Agrião', unit: 'maço', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    { name: 'Espinafre', unit: 'maço', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    ...generateVariations('Tomate', ['Carmen', 'Italiano', 'Débora', 'Holandês'], 'kg', CATEGORIES.HORTIFRUTI, 7.99),
    { name: 'Tomate Cereja', unit: 'cumbuca', category: CATEGORIES.HORTIFRUTI, basePrice: 5.50 },
    { name: 'Cenoura', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.90 },
    { name: 'Beterraba', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.50 },
    { name: 'Pepino Japonês', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.90 },
    { name: 'Abobrinha Italiana', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 6.90 },
    { name: 'Berinjela', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.50 },
    { name: 'Pimentão Verde', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 8.90 },
    { name: 'Pimentão Vermelho', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 12.90 },
    { name: 'Pimentão Amarelo', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 12.90 },
    { name: 'Repolho Verde', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 4.00 },
    { name: 'Repolho Roxo', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 5.00 },
    { name: 'Brócolis Ninja', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 8.00 },
    { name: 'Couve-Flor', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 9.00 },
    { name: 'Alho', unit: '200g', category: CATEGORIES.HORTIFRUTI, basePrice: 4.00 },
    { name: 'Gengibre', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 15.00 },
    { name: 'Limão Taiti', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 3.00 },
    { name: 'Limão Siciliano', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 12.00 },
    { name: 'Laranja Pera', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    { name: 'Laranja Lima', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.50 },
    { name: 'Mexerica Ponkan', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.90 },
    { name: 'Abacaxi Pérola', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 6.00 },
    { name: 'Manga Palmer', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.90 },
    { name: 'Manga Tommy', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.90 },
    { name: 'Mamão Formosa', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.00 },
    { name: 'Mamão Papaya', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 5.50 },
    { name: 'Melão Amarelo', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.90 },
    { name: 'Melancia', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 2.50 },
    { name: 'Morango', unit: '250g', category: CATEGORIES.HORTIFRUTI, basePrice: 7.00 },
    { name: 'Kiwi', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 18.00 },
    { name: 'Pera Williams', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 12.50 },

    // --- MERCADO (Alimentos Básicos & Mercearia) ---
    ...generateVariations('Arroz 5kg', ['Tio João', 'Camil', 'Prato Fino', 'Máximo', 'Emoções', 'Urbano'], 'pacote', CATEGORIES.MERCADO, 26.00),
    ...generateVariations('Feijão Carioca 1kg', ['Kicaldo', 'Camil', 'Tio João', 'Máximo', 'Broto Legal'], 'pacote', CATEGORIES.MERCADO, 8.00),
    ...generateVariations('Feijão Preto 1kg', ['Kicaldo', 'Camil', 'Tio João', 'Pantera'], 'pacote', CATEGORIES.MERCADO, 8.50),
    ...generateVariations('Açúcar 1kg', ['União', 'Nieve', 'Caravelas', 'Guarani', 'Da Barra'], 'pacote', CATEGORIES.MERCADO, 4.50),
    ...generateVariations('Café em Pó 500g', ['Pilão', 'Melitta', '3 Corações', 'Santa Clara', 'Maratá', 'Pimpinela'], 'pacote', CATEGORIES.MERCADO, 18.00),
    ...generateVariations('Macarrão Espaguete 500g', ['Adria', 'Galo', 'Renata', 'Dona Benta', 'Barilla', 'Petybon'], 'pacote', CATEGORIES.MERCADO, 4.50),
    ...generateVariations('Óleo de Soja 900ml', ['Liza', 'Soya', 'Concordia', 'Vila Velha'], 'un', CATEGORIES.MERCADO, 6.90),
    ...generateVariations('Farinha de Trigo 1kg', ['Dona Benta', 'Sol', 'Boa Sorte', 'Rosa Branca'], 'pacote', CATEGORIES.MERCADO, 5.50),
    ...generateVariations('Leite Integral 1L', ['Ninho', 'Italac', 'Piracanjuba', 'Betânia', 'Elegê', 'Parmalat'], 'caixa', CATEGORIES.MERCADO, 5.50),
    ...generateVariations('Leite Desnatado 1L', ['Ninho', 'Italac', 'Piracanjuba', 'Molico'], 'caixa', CATEGORIES.MERCADO, 5.50),
    ...generateVariations('Manteiga 200g', ['Aviação', 'Italac', 'Piracanjuba', 'Batavo', 'President'], 'pote', CATEGORIES.MERCADO, 12.00),
    ...generateVariations('Requeijão 200g', ['Vigor', 'Itambé', 'Poços de Caldas', 'Danone', 'Nestlé'], 'copo', CATEGORIES.MERCADO, 8.90),
    ...generateVariations('Iogurte Natural 170g', ['Nestlé', 'Vigor', 'Batavo', 'Danone'], 'un', CATEGORIES.MERCADO, 3.50),
    { name: 'Pão de Forma Tradicional', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 7.90 },
    { name: 'Pão de Forma Integral', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 9.90 },
    ...generateVariations('Biscoito Recheado', ['Chocolate', 'Morango', 'Baunilha', 'Limão'], 'pacote', CATEGORIES.MERCADO, 3.50),
    ...generateVariations('Biscoito Salgado', ['Cream Cracker', 'Água e Sal', 'Maizena'], 'pacote', CATEGORIES.MERCADO, 4.50),
    { name: 'Molho de Tomate 340g', unit: 'sachê', category: CATEGORIES.MERCADO, basePrice: 2.50 },
    { name: 'Maionese 500g', unit: 'pote', category: CATEGORIES.MERCADO, basePrice: 8.90 },
    { name: 'Ketchup 400g', unit: 'frasco', category: CATEGORIES.MERCADO, basePrice: 7.90 },
    { name: 'Mostarda 200g', unit: 'frasco', category: CATEGORIES.MERCADO, basePrice: 5.90 },
    { name: 'Sal Refinado 1kg', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 2.00 },
    { name: 'Vinagre de Álcool', unit: 'frasco', category: CATEGORIES.MERCADO, basePrice: 2.50 },
    { name: 'Azeite de Oliva Extra Virgem 500ml', unit: 'vidro', category: CATEGORIES.MERCADO, basePrice: 35.00 },

    // --- MERCADO (Limpeza) ---
    ...generateVariations('Detergente Líquido 500ml', ['Ypê', 'Limpol', 'Minuano', 'Veja'], 'un', CATEGORIES.MERCADO, 2.80),
    ...generateVariations('Sabão em Pó 1kg', ['Omo', 'Brilhante', 'Tixan', 'Ariel'], 'caixa', CATEGORIES.MERCADO, 14.00),
    ...generateVariations('Amaciante 2L', ['Comfort', 'Downy', 'Ypê', 'Fofo'], 'frasco', CATEGORIES.MERCADO, 18.00),
    ...generateVariations('Água Sanitária 1L', ['Qboa', 'Brilux', 'Ypê', 'Super Candida'], 'frasco', CATEGORIES.MERCADO, 3.50),
    ...generateVariations('Desinfetante 500ml', ['Pinho Sol', 'Veja', 'Lysoform'], 'frasco', CATEGORIES.MERCADO, 4.50),
    { name: 'Limpa Vidros', unit: 'frasco', category: CATEGORIES.MERCADO, basePrice: 8.90 },
    { name: 'Esponja de Aço', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 2.50 },
    { name: 'Esponja Multiuso', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 4.00 },
    ...generateVariations('Papel Higiênico 12 rolos', ['Neve', 'Personal', 'Scott', 'Mime'], 'pacote', CATEGORIES.MERCADO, 18.90),
    { name: 'Papel Toalha', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 5.90 },

    // --- MERCADO (Padaria) ---
    { name: 'Pão Francês', unit: 'kg', category: CATEGORIES.MERCADO, basePrice: 14.90 },
    { name: 'Pão Doce', unit: 'kg', category: CATEGORIES.MERCADO, basePrice: 16.90 },
    ...generateVariations('Bolo', ['Chocolate', 'Laranja', 'Fubá', 'Cenoura', 'Milho', 'Aipim'], 'un', CATEGORIES.MERCADO, 15.00),
    { name: 'Sonho', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 3.50 },
    { name: 'Brigadeiro', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 2.00 },
    { name: 'Coxinha', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 5.00 },
    { name: 'Pão de Queijo', unit: 'kg', category: CATEGORIES.MERCADO, basePrice: 28.00 },

    // --- FARMACIA (Meds) ---
    ...generateVariations('Dipirona 500mg', ['EMS', 'Medley', 'Neo Química', 'Eurofarma'], 'cx 10', CATEGORIES.FARMACIA, 5.00),
    ...generateVariations('Paracetamol 750mg', ['Tylenol', 'EMS', 'Medley', 'Teuto'], 'cx 20', CATEGORIES.FARMACIA, 10.00),
    ...generateVariations('Ibuprofeno 600mg', ['Advil', 'EMS', 'Medley', 'Bayer'], 'cx 10', CATEGORIES.FARMACIA, 15.00),
    ...generateVariations('Dorflex', ['30 drágeas', '10 drágeas', '50 drágeas'], 'caixa', CATEGORIES.FARMACIA, 18.00),
    { name: 'Neosaldina 30 drágeas', unit: 'caixa', category: CATEGORIES.FARMACIA, basePrice: 26.00 },
    { name: 'Buscopan Composto', unit: 'cx 20', category: CATEGORIES.FARMACIA, basePrice: 16.00 },
    { name: 'Cimegripe', unit: 'cx', category: CATEGORIES.FARMACIA, basePrice: 12.00 },
    { name: 'Benegrip', unit: 'cx', category: CATEGORIES.FARMACIA, basePrice: 14.00 },
    ...generateVariations('Antialérgico', ['Allegra', 'Loratadina', 'Polaramine', 'Desalex'], 'cx', CATEGORIES.FARMACIA, 25.00),
    { name: 'Losartana 50mg', unit: 'cx 30', category: CATEGORIES.FARMACIA, basePrice: 5.00 },
    { name: 'Omeprazol 20mg', unit: 'cx 28', category: CATEGORIES.FARMACIA, basePrice: 20.00 },
    { name: 'Simeticona', unit: 'frasco', category: CATEGORIES.FARMACIA, basePrice: 8.00 },
    { name: 'Eno', unit: 'sachê', category: CATEGORIES.FARMACIA, basePrice: 3.50 },
    { name: 'Epocler', unit: 'flaconete', category: CATEGORIES.FARMACIA, basePrice: 3.00 },
    { name: 'Vitamina C', unit: 'tubo', category: CATEGORIES.FARMACIA, basePrice: 12.00 },
    { name: 'Bepantol Derma', unit: 'bisnaga', category: CATEGORIES.FARMACIA, basePrice: 35.00 },
    { name: 'Hipoglós', unit: 'bisnaga', category: CATEGORIES.FARMACIA, basePrice: 18.00 },

    // --- FARMACIA (Higiene/Cosméticos - also sold in markets) ---
    ...generateVariations('Shampoo', ['Dove', 'Pantene', 'Seda', 'L\'Oreal', 'Eudora', 'Head & Shoulders', 'Clear', 'Tresemmé', 'Garnier'], '400ml', CATEGORIES.FARMACIA, 22.00),
    ...generateVariations('Condicionador', ['Dove', 'Pantene', 'Seda', 'L\'Oreal', 'Tresemmé', 'Garnier'], '200ml', CATEGORIES.FARMACIA, 24.00),
    ...generateVariations('Sabonete', ['Dove', 'Lux', 'Nivea', 'Protex', 'Phebo', 'Granado', 'Palmolive'], 'un', CATEGORIES.FARMACIA, 3.50),
    ...generateVariations('Desodorante Aerosol', ['Rexona', 'Dove', 'Nivea', 'Old Spice', 'Gillette', 'Axe', 'Monange'], 'un', CATEGORIES.FARMACIA, 16.00),
    ...generateVariations('Creme Dental', ['Colgate', 'Sorriso', 'Oral-B', 'Close Up', 'Sensodyne'], '90g', CATEGORIES.FARMACIA, 6.00),
    { name: 'Fio Dental', unit: 'un', category: CATEGORIES.FARMACIA, basePrice: 8.00 },
    { name: 'Enxaguante Bucal Listerine', unit: '500ml', category: CATEGORIES.FARMACIA, basePrice: 22.00 },
    ...generateVariations('Protetor Solar', ['FPS 30', 'FPS 50', 'FPS 70', 'Facial', 'Infantil'], 'un', CATEGORIES.FARMACIA, 50.00),
    { name: 'Hidratante Corporal Nivea', unit: '400ml', category: CATEGORIES.FARMACIA, basePrice: 18.00 },
    { name: 'Acetona', unit: 'frasco', category: CATEGORIES.FARMACIA, basePrice: 4.00 },
    { name: 'Algodão', unit: 'pacote', category: CATEGORIES.FARMACIA, basePrice: 5.00 },
    { name: 'Cotonete', unit: 'caixa', category: CATEGORIES.FARMACIA, basePrice: 4.50 },
    { name: 'Absorvente', unit: 'pacote', category: CATEGORIES.FARMACIA, basePrice: 6.00 },
    ...generateVariations('Fralda', ['Pampers P', 'Pampers M', 'Pampers G', 'Huggies M', 'Huggies G'], 'pacote', CATEGORIES.FARMACIA, 45.00),

    // --- PET ---
    ...generateVariations('Ração Cão Adulto 3kg', ['Pedigree', 'Golden', 'Premier', 'Dog Chow', 'Royal Canin'], 'pacote', CATEGORIES.PET, 55.00),
    ...generateVariations('Ração Gato Adulto 3kg', ['Whiskas', 'Golden', 'Premier', 'Friskies', 'Royal Canin'], 'pacote', CATEGORIES.PET, 58.00),
    ...generateVariations('Sachê Gato', ['Whiskas', 'Friskies', 'Felix', 'Sheba'], 'un', CATEGORIES.PET, 3.00),
    { name: 'Biscoito para Cães', unit: 'pacote', category: CATEGORIES.PET, basePrice: 12.00 },
    { name: 'Shampoo Pet', unit: 'frasco', category: CATEGORIES.PET, basePrice: 18.00 },
    { name: 'Tapete Higiênico', unit: 'pacote 30', category: CATEGORIES.PET, basePrice: 60.00 },
    { name: 'Areia para Gato', unit: '4kg', category: CATEGORIES.PET, basePrice: 15.00 },

    // --- COMBUSTIVEL ---
    { name: 'Gasolina Comum', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 5.89 },
    { name: 'Gasolina Aditivada', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 6.09 },
    { name: 'Etanol', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 4.19 },
    { name: 'Diesel S10', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 5.99 },
    { name: 'Diesel Comum', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 5.89 },
    { name: 'GNV', unit: 'm³', category: CATEGORIES.COMBUSTIVEL, basePrice: 4.59 }
];

async function main() {
    console.log('🌱 Starting Massive Seed...');

    // 1. Create User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const testUser = await prisma.user.upsert({
        where: { email: 'admin@precoja.com' },
        update: {},
        create: {
            email: 'admin@precoja.com',
            name: 'Admin User',
            password: hashedPassword,
            points: 1000,
            avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=6C5CE7&color=fff'
        }
    });

    // 2. Create Stores
    const stores = [];
    console.log('📍 Generating stores...');

    for (const baseStore of STORES_BASE) {
        // Create 3 branches for each base store
        const branchesCount = 3;

        for (let i = 0; i < branchesCount; i++) {
            const loc = LOCATIONS[i % LOCATIONS.length];
            const jitterLat = (Math.random() - 0.5) * 0.03;
            const jitterLng = (Math.random() - 0.5) * 0.03;

            // Check if exists using a "findFirst" heuristic or just create
            // For seed, we just create. If it dupes in name, it's fine for dev.
            const store = await prisma.store.create({
                data: {
                    name: `${baseStore.name} - ${loc.name} ${i + 1}`,
                    category: baseStore.category,
                    lat: loc.lat + jitterLat,
                    lng: loc.lng + jitterLng,
                    address: `Rua Exemplo ${i + 1}, ${loc.name}, Aracaju - SE`,
                    trustScore: baseStore.trust - 5 + Math.floor(Math.random() * 10),
                    source: 'seed_final'
                }
            });
            stores.push(store);
        }
    }
    console.log(`✅ Created ${stores.length} stores.`);

    // 3. Sync Products & Fetch ALL Existing
    console.log('🍎 Syncing products catalogue...');

    // Upsert explicit seed products
    for (const item of PRODUCTS_DATA) {
        await prisma.product.upsert({
            where: { name: item.name },
            update: { category: item.category },
            create: {
                name: item.name,
                category: item.category,
                unit: item.unit,
                imageUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(item.name)}`
            }
        });
    }

    // Now fetch ALL products from DB (seed + existing)
    const allProducts = await prisma.product.findMany();
    console.log(`📦 Total products in catalog: ${allProducts.length}`);

    // Map existing products to "simulated" pricing data if they came from DB but not in seed array
    // We'll infer category/basePrice from the product record or defaults
    const completeProductList = allProducts.map(p => {
        const seedItem = PRODUCTS_DATA.find(pi => pi.name === p.name);
        if (seedItem) return seedItem;

        // Fallback for existing items not in seed list
        return {
            name: p.name,
            unit: p.unit || 'un',
            category: p.category || 'outros',
            basePrice: 10.00 // Generic fallback price
        };
    });

    // 4. Assign prices
    console.log('💰 Generating prices for ALL products...');
    let priceCount = 0;

    for (const store of stores) {
        let itemsAddedToStore = 0;

        for (const item of completeProductList) {
            let shouldAdd = false;

            // Logic to determine if store carries the item
            if (store.category === CATEGORIES.MERCADO) {
                if (item.category !== CATEGORIES.COMBUSTIVEL) shouldAdd = true;
            } else if (store.category === CATEGORIES.FARMACIA) {
                if (item.category === CATEGORIES.FARMACIA ||
                    (item.category === CATEGORIES.MERCADO && (item.name.includes('Leite') || item.name.includes('Fralda')))) {
                    shouldAdd = true;
                }
            } else if (store.category === item.category) {
                shouldAdd = true;
            }

            // High probability of availability (95%)
            if (shouldAdd && Math.random() > 0.05) {
                const variance = (Math.random() * 0.4) - 0.2; // +/- 20%
                const finalPrice = item.basePrice * (1 + variance);

                await prisma.price.create({
                    data: {
                        product: item.name,
                        price: parseFloat(finalPrice.toFixed(2)),
                        unit: item.unit,
                        storeId: store.id,
                        reporterId: testUser.id,
                        hasPhoto: Math.random() > 0.8,
                        votes: Math.floor(Math.random() * 50),
                        // We need to look up ID again or use map, but finding by name is "okay" for seed script speed
                        productId: allProducts.find(p => p.name === item.name)?.id,
                        lastValidatedAt: new Date()
                    }
                });
                priceCount++;
                itemsAddedToStore++;
            }
        }
    }

    console.log(`💰 Generated ${priceCount} prices across ${stores.length} stores.`);
    console.log('🎉 Massive Final Seed Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
