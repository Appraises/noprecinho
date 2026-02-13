/**
 * Data migration: Link existing Price records to Product catalog
 * 
 * Run after the schema migration:
 *   npx ts-node prisma/link_prices_to_products.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔗 Linking existing prices to products...');

    // Get all prices without a productId
    const unlinkedPrices = await prisma.price.findMany({
        where: { productId: null },
        select: { id: true, product: true }
    });

    console.log(`Found ${unlinkedPrices.length} unlinked prices`);

    let linked = 0;
    let created = 0;
    let failed = 0;

    for (const price of unlinkedPrices) {
        try {
            // Try exact match first
            let catalogProduct = await prisma.product.findFirst({
                where: { name: { equals: price.product, mode: 'insensitive' } },
                select: { id: true }
            });

            // Try contains match
            if (!catalogProduct) {
                catalogProduct = await prisma.product.findFirst({
                    where: { name: { contains: price.product, mode: 'insensitive' } },
                    select: { id: true }
                });
            }

            // Try reverse contains (price.product contains product.name)
            if (!catalogProduct) {
                const allProducts = await prisma.product.findMany({
                    select: { id: true, name: true }
                });
                catalogProduct = allProducts.find(p =>
                    price.product.toLowerCase().includes(p.name.toLowerCase())
                ) || null;
            }

            // If still no match, create a new Product entry
            if (!catalogProduct) {
                const newProduct = await prisma.product.create({
                    data: {
                        name: price.product,
                        category: 'outros',
                        unit: 'un'
                    }
                });
                catalogProduct = { id: newProduct.id };
                created++;
                console.log(`  ➕ Created product: "${price.product}"`);
            }

            // Link the price to the product
            await prisma.price.update({
                where: { id: price.id },
                data: { productId: catalogProduct.id }
            });
            linked++;

        } catch (error) {
            console.error(`  ❌ Failed to link price "${price.product}":`, error);
            failed++;
        }
    }

    console.log(`\n✅ Done!`);
    console.log(`  Linked: ${linked}`);
    console.log(`  New products created: ${created}`);
    console.log(`  Failed: ${failed}`);
}

main()
    .catch((e) => {
        console.error('Migration error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
