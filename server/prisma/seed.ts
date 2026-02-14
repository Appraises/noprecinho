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
    { name: 'Jardins', lat: -10.9472, lng: -37.0731 }, // Base
    { name: 'Centro', lat: -10.9110, lng: -37.0500 },
    { name: 'Atalaia', lat: -10.9850, lng: -37.0550 },
    { name: 'Farolândia', lat: -10.9660, lng: -37.0600 },
    { name: 'Siqueira Campos', lat: -10.9250, lng: -37.0800 },
];

const PRODUCTS_DATA = [
    // --- HORTIFRUTI (Verduras, Legumes, Frutas) ---
    { name: 'Alface Americana', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    { name: 'Alface Crespa', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 2.50 },
    { name: 'Tomate Carmen', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 6.99 },
    { name: 'Tomate Cereja', unit: 'cumbuca', category: CATEGORIES.HORTIFRUTI, basePrice: 5.50 },
    { name: 'Cenoura', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.90 },
    { name: 'Batata Inglesa', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.99 },
    { name: 'Batata Doce', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 3.99 },
    { name: 'Cebola Branca', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.50 },
    { name: 'Cebola Roxa', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 6.50 },
    { name: 'Alho', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 2.00 },
    { name: 'Pimentão Verde', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 8.90 },
    { name: 'Pimentão Vermelho', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 12.90 },
    { name: 'Pimentão Amarelo', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 12.90 },
    { name: 'Repolho Verde', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 4.00 },
    { name: 'Couve Manteiga', unit: 'maço', category: CATEGORIES.HORTIFRUTI, basePrice: 2.50 },
    { name: 'Espinafre', unit: 'maço', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    { name: 'Rúcula', unit: 'maço', category: CATEGORIES.HORTIFRUTI, basePrice: 3.00 },
    { name: 'Banana Prata', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.50 },
    { name: 'Banana Nanica', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.50 },
    { name: 'Maçã Gala', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 9.90 },
    { name: 'Maçã Fuji', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 11.90 },
    { name: 'Pera Williams', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 12.50 },
    { name: 'Uva Thompson', unit: '500g', category: CATEGORIES.HORTIFRUTI, basePrice: 8.90 },
    { name: 'Melancia', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 2.50 },
    { name: 'Melão Amarelo', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 4.90 },
    { name: 'Mamão Papaya', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 5.00 },
    { name: 'Laranja Pera', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 3.50 },
    { name: 'Limão Taiti', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 3.00 },
    { name: 'Abacaxi', unit: 'un', category: CATEGORIES.HORTIFRUTI, basePrice: 6.00 },
    { name: 'Manga Palmer', unit: 'kg', category: CATEGORIES.HORTIFRUTI, basePrice: 5.90 },
    { name: 'Morango', unit: '250g', category: CATEGORIES.HORTIFRUTI, basePrice: 7.00 },

    // --- MERCADO / PADARIA ---
    { name: 'Pão Francês', unit: 'kg', category: CATEGORIES.MERCADO, basePrice: 14.90 },
    { name: 'Pão de Leite', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 8.50 },
    { name: 'Pão Integral', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 10.90 },
    { name: 'Bolo de Chocolate', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 15.00 },
    { name: 'Bolo de Cenoura', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 14.00 },
    { name: 'Sonho de Creme', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 3.50 },
    { name: 'Sonho de Doce de Leite', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 3.50 },
    { name: 'Pão de Queijo', unit: 'kg', category: CATEGORIES.MERCADO, basePrice: 28.00 },
    { name: 'Leite Integral', unit: '1L', category: CATEGORIES.MERCADO, basePrice: 5.29 },
    { name: 'Arroz Branco 5kg', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 24.90 },
    { name: 'Feijão Carioca 1kg', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 7.90 },
    { name: 'Café em Pó 500g', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 16.90 },
    { name: 'Açúcar Cristal 1kg', unit: 'pacote', category: CATEGORIES.MERCADO, basePrice: 4.20 },
    { name: 'Óleo de Soja 900ml', unit: 'un', category: CATEGORIES.MERCADO, basePrice: 6.50 },

    // --- FARMACIA (Medicamentos) ---
    { name: 'Dipirona Sódica 500mg', unit: 'cx 10', category: CATEGORIES.FARMACIA, basePrice: 4.50 },
    { name: 'Paracetamol 750mg', unit: 'cx 20', category: CATEGORIES.FARMACIA, basePrice: 8.90 },
    { name: 'Ibuprofeno 600mg', unit: 'cx 10', category: CATEGORIES.FARMACIA, basePrice: 12.00 },
    { name: 'Dorflex', unit: 'cx 30', category: CATEGORIES.FARMACIA, basePrice: 18.90 },
    { name: 'Neosaldina', unit: 'cx 30', category: CATEGORIES.FARMACIA, basePrice: 24.90 },
    { name: 'Buscopan Composto', unit: 'cx 20', category: CATEGORIES.FARMACIA, basePrice: 15.50 },
    { name: 'Tylenol Sinus', unit: 'cx 24', category: CATEGORIES.FARMACIA, basePrice: 28.00 },
    { name: 'Vick Pyrena', unit: 'un', category: CATEGORIES.FARMACIA, basePrice: 2.50 },
    { name: 'Sorine', unit: 'un', category: CATEGORIES.FARMACIA, basePrice: 14.00 },
    { name: 'Omeprazol 20mg', unit: 'cx 28', category: CATEGORIES.FARMACIA, basePrice: 22.00 },
    { name: 'Losartana 50mg', unit: 'cx 30', category: CATEGORIES.FARMACIA, basePrice: 6.00 },
    { name: 'Vitamina C Efervescente', unit: 'tb 10', category: CATEGORIES.FARMACIA, basePrice: 12.90 },
    { name: 'Band-aid', unit: 'cx', category: CATEGORIES.FARMACIA, basePrice: 5.50 },

    // --- HIGIENE PESSOAL ---
    { name: 'Shampoo Dove Reconstrução', unit: '400ml', category: CATEGORIES.FARMACIA, basePrice: 18.90 },
    { name: 'Condicionador Dove Reconstrução', unit: '200ml', category: CATEGORIES.FARMACIA, basePrice: 20.90 },
    { name: 'Shampoo Pantene Liso Extremo', unit: '400ml', category: CATEGORIES.FARMACIA, basePrice: 22.90 },
    { name: 'Condicionador Pantene Liso Extremo', unit: '175ml', category: CATEGORIES.FARMACIA, basePrice: 24.90 },
    { name: 'Shampoo Seda Ceramidas', unit: '325ml', category: CATEGORIES.FARMACIA, basePrice: 9.90 },
    { name: 'Condicionador Seda Ceramidas', unit: '325ml', category: CATEGORIES.FARMACIA, basePrice: 11.90 },
    { name: 'Shampoo L\'Oreal Elseve', unit: '400ml', category: CATEGORIES.FARMACIA, basePrice: 19.90 },
    { name: 'Condicionador L\'Oreal Elseve', unit: '200ml', category: CATEGORIES.FARMACIA, basePrice: 21.90 },
    { name: 'Shampoo Head & Shoulders', unit: '400ml', category: CATEGORIES.FARMACIA, basePrice: 26.90 },
    { name: 'Shampoo Clear Men', unit: '400ml', category: CATEGORIES.FARMACIA, basePrice: 27.90 },
    { name: 'Sabonete Dove Original', unit: 'un', category: CATEGORIES.FARMACIA, basePrice: 3.50 },
    { name: 'Sabonete Lux', unit: 'un', category: CATEGORIES.FARMACIA, basePrice: 2.20 },
    { name: 'Sabonete Nivea', unit: 'un', category: CATEGORIES.FARMACIA, basePrice: 2.80 },
    { name: 'Sabonete Protex', unit: 'un', category: CATEGORIES.FARMACIA, basePrice: 3.90 },
    { name: 'Desodorante Rexona', unit: 'aerosol', category: CATEGORIES.FARMACIA, basePrice: 14.90 },
    { name: 'Desodorante Dove', unit: 'aerosol', category: CATEGORIES.FARMACIA, basePrice: 16.90 },
    { name: 'Creme Dental Colgate Total 12', unit: '90g', category: CATEGORIES.FARMACIA, basePrice: 8.90 },
    { name: 'Creme Dental Sorriso', unit: '90g', category: CATEGORIES.FARMACIA, basePrice: 3.50 },

    // --- COMBUSTIVEL ---
    { name: 'Gasolina Comum', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 5.89 },
    { name: 'Gasolina Aditivada', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 6.09 },
    { name: 'Etanol', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 4.19 },
    { name: 'Diesel S10', unit: 'L', category: CATEGORIES.COMBUSTIVEL, basePrice: 5.99 }
];

async function main() {
    console.log('🌱 Starting Large Seed...');

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
    console.log('👤 User ready:', testUser.email);

    // 2. Create Stores
    const stores = [];
    console.log('📍 Generating stores...');

    for (const baseStore of STORES_BASE) {
        // Create 2-3 branches for each base store name
        const branchesCount = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < branchesCount; i++) {
            const loc = LOCATIONS[i % LOCATIONS.length];
            const jitterLat = (Math.random() - 0.5) * 0.02;
            const jitterLng = (Math.random() - 0.5) * 0.02;

            const store = await prisma.store.create({
                data: {
                    name: `${baseStore.name} - ${loc.name}`,
                    category: baseStore.category,
                    lat: loc.lat + jitterLat,
                    lng: loc.lng + jitterLng,
                    address: `Rua Exemplo ${i + 1}, ${loc.name}, Aracaju - SE`,
                    trustScore: baseStore.trust - 5 + Math.floor(Math.random() * 10),
                    source: 'seed_large'
                }
            });
            stores.push(store);
        }
    }
    console.log(`✅ Created ${stores.length} stores.`);

    // 3. Create Products & Prices
    console.log('🍎 Generating products and prices...');
    let priceCount = 0;

    // Create each product in the catalog first
    for (const item of PRODUCTS_DATA) {
        // Ensure product exists in catalog
        const product = await prisma.product.upsert({
            where: { name: item.name },
            update: {},
            create: {
                name: item.name,
                category: item.category,
                unit: item.unit,
                imageUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(item.name)}`
            }
        });

        // Add prices for this product in relevant stores
        for (const store of stores) {
            // Only add if store category matches product category (roughly)
            // Mercado sells everything except fuel
            // Farmacia sells farmacia items
            // Hortifruti sells hortifruti
            // Combustivel sells fuel

            let shouldAdd = false;

            if (store.category === CATEGORIES.MERCADO) {
                // Mercados sell almost everything except fuel (usually)
                if (item.category !== CATEGORIES.COMBUSTIVEL) shouldAdd = true;
            } else if (store.category === item.category) {
                shouldAdd = true;
            } else if (store.category === CATEGORIES.FARMACIA && item.category === CATEGORIES.FARMACIA) {
                shouldAdd = true;
            }

            // Random chance to NOT have an item (stockout or range difference)
            if (shouldAdd && Math.random() > 0.15) {
                // Variation in price: +/- 15%
                const variance = (Math.random() * 0.3) - 0.15;
                const finalPrice = item.basePrice * (1 + variance);

                await prisma.price.create({
                    data: {
                        product: item.name,
                        price: parseFloat(finalPrice.toFixed(2)),
                        unit: item.unit,
                        storeId: store.id,
                        reporterId: testUser.id,
                        hasPhoto: Math.random() > 0.7,
                        votes: Math.floor(Math.random() * 50),
                        productId: product.id,
                        lastValidatedAt: new Date()
                    }
                });
                priceCount++;
            }
        }
    }

    console.log(`💰 Generated ${priceCount} prices across ${stores.length} stores and ${PRODUCTS_DATA.length} products.`);
    console.log('🎉 Large Seed Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
