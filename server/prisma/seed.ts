/**
 * Database seed script
 * Seeds the database with initial data for development
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const testUser = await prisma.user.upsert({
        where: { email: 'test@precoja.com' },
        update: {},
        create: {
            email: 'test@precoja.com',
            name: 'Usuário Teste',
            password: hashedPassword,
            avatar: 'https://ui-avatars.com/api/?name=Usuario+Teste&background=00C896&color=fff',
            points: 100,
        },
    });

    console.log(`✅ Created test user: ${testUser.email}`);

    // Create some sample stores in Aracaju if none exist
    const storeCount = await prisma.store.count();

    if (storeCount === 0) {
        console.log('📍 Creating sample stores in Aracaju...');

        const sampleStores = [
            {
                name: 'Supermercado GBarbosa',
                category: 'mercado',
                lat: -10.9472,
                lng: -37.0731,
                address: 'Av. Beira Mar, 1000 - Aracaju, SE',
                trustScore: 85,
            },
            {
                name: 'Drogasil Centro',
                category: 'farmacia',
                lat: -10.9110,
                lng: -37.0500,
                address: 'Rua Laranjeiras, 200 - Centro, Aracaju, SE',
                trustScore: 90,
            },
            {
                name: 'Petz Aracaju',
                category: 'pet',
                lat: -10.9380,
                lng: -37.0580,
                address: 'Av. Hermes Fontes, 500 - Aracaju, SE',
                trustScore: 88,
            },
            {
                name: 'Hortifruti Jardins',
                category: 'hortifruti',
                lat: -10.9550,
                lng: -37.0450,
                address: 'Av. Pedro Valadares, 300 - Jardins, Aracaju, SE',
                trustScore: 75,
            },
            {
                name: 'Posto Ipiranga Beira Mar',
                category: 'combustivel',
                lat: -10.9420,
                lng: -37.0650,
                address: 'Av. Beira Mar, 2000 - Aracaju, SE',
                trustScore: 92,
            },
        ];

        for (const store of sampleStores) {
            await prisma.store.create({ data: { ...store, source: 'seed' } });
        }

        console.log(`✅ Created ${sampleStores.length} sample stores`);
    }

    // Create some sample prices
    const priceCount = await prisma.price.count();

    if (priceCount === 0) {
        console.log('💰 Creating sample prices...');

        const stores = await prisma.store.findMany({ take: 5 });

        const samplePrices = [
            { product: 'Arroz Tio João 5kg', price: 24.90, unit: 'pacote' },
            { product: 'Feijão Carioca 1kg', price: 7.49, unit: 'pacote' },
            { product: 'Leite Integral', price: 5.99, unit: 'L' },
            { product: 'Gasolina Comum', price: 5.89, unit: 'L' },
            { product: 'Dipirona 20 comp', price: 8.99, unit: 'caixa' },
        ];

        for (let i = 0; i < stores.length && i < samplePrices.length; i++) {
            await prisma.price.create({
                data: {
                    ...samplePrices[i],
                    storeId: stores[i].id,
                    reporterId: testUser.id,
                    hasPhoto: Math.random() > 0.5,
                    votes: Math.floor(Math.random() * 20),
                },
            });
        }

        console.log(`✅ Created ${Math.min(stores.length, samplePrices.length)} sample prices`);
    }

    console.log('\n🎉 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
