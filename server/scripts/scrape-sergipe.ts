/**
 * Sergipe State Establishment Scraper
 * Uses OpenStreetMap Overpass API to fetch establishments from all major cities
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Major cities in Sergipe with their bounding boxes
const SERGIPE_CITIES = [
    {
        name: 'Aracaju',
        bounds: { south: -11.10, north: -10.85, west: -37.15, east: -36.95 },
    },
    {
        name: 'Nossa Senhora do Socorro',
        bounds: { south: -10.92, north: -10.80, west: -37.18, east: -37.02 },
    },
    {
        name: 'Lagarto',
        bounds: { south: -10.95, north: -10.85, west: -37.70, east: -37.60 },
    },
    {
        name: 'Itabaiana',
        bounds: { south: -10.72, north: -10.62, west: -37.48, east: -37.38 },
    },
    {
        name: 'São Cristóvão',
        bounds: { south: -11.02, north: -10.90, west: -37.25, east: -37.15 },
    },
    {
        name: 'Estância',
        bounds: { south: -11.30, north: -11.20, west: -37.48, east: -37.38 },
    },
    {
        name: 'Tobias Barreto',
        bounds: { south: -11.20, north: -11.12, west: -38.05, east: -37.95 },
    },
    {
        name: 'Propriá',
        bounds: { south: -10.25, north: -10.18, west: -36.88, east: -36.78 },
    },
    {
        name: 'Simão Dias',
        bounds: { south: -10.78, north: -10.70, west: -37.85, east: -37.75 },
    },
    {
        name: 'Capela',
        bounds: { south: -10.55, north: -10.45, west: -37.10, east: -37.00 },
    },
];

// Category mapping from OSM tags to our categories
const CATEGORY_MAPPINGS = [
    {
        category: 'mercado',
        osmQueries: [
            'shop=supermarket',
            'shop=convenience',
            'shop=grocery',
        ],
    },
    {
        category: 'farmacia',
        osmQueries: [
            'amenity=pharmacy',
            'shop=chemist',
        ],
    },
    {
        category: 'pet',
        osmQueries: [
            'shop=pet',
            'shop=pet_grooming',
        ],
    },
    {
        category: 'hortifruti',
        osmQueries: [
            'shop=greengrocer',
            'shop=farm',
            'amenity=marketplace',
        ],
    },
    {
        category: 'combustivel',
        osmQueries: [
            'amenity=fuel',
        ],
    },
];

interface OSMElement {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: {
        name?: string;
        'addr:street'?: string;
        'addr:housenumber'?: string;
        'addr:city'?: string;
        brand?: string;
        [key: string]: string | undefined;
    };
}

async function queryOverpass(query: string): Promise<OSMElement[]> {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';

    try {
        const response = await fetch(overpassUrl, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`);
        }

        const data = await response.json();
        return data.elements || [];
    } catch (error) {
        console.error('Overpass query error:', error);
        return [];
    }
}

function buildOverpassQuery(osmTags: string[], bounds: { south: number; north: number; west: number; east: number }): string {
    const { south, north, west, east } = bounds;
    const bbox = `${south},${west},${north},${east}`;

    const nodeQueries = osmTags
        .map((tag) => {
            const [key, value] = tag.split('=');
            return `node["${key}"="${value}"](${bbox});`;
        })
        .join('\n  ');

    const wayQueries = osmTags
        .map((tag) => {
            const [key, value] = tag.split('=');
            return `way["${key}"="${value}"](${bbox});`;
        })
        .join('\n  ');

    return `
[out:json][timeout:60];
(
  ${nodeQueries}
  ${wayQueries}
);
out center;
  `.trim();
}

function formatAddress(tags: OSMElement['tags'], cityName: string): string {
    if (!tags) return `${cityName}, SE`;

    const parts: string[] = [];

    if (tags['addr:street']) {
        let street = tags['addr:street'];
        if (tags['addr:housenumber']) {
            street += `, ${tags['addr:housenumber']}`;
        }
        parts.push(street);
    }

    parts.push(tags['addr:city'] || cityName);
    parts.push('SE');

    return parts.join(' - ') || `${cityName}, SE`;
}

async function scrapeCity(cityName: string, bounds: { south: number; north: number; west: number; east: number }): Promise<number> {
    console.log(`\n🏙️ Scraping city: ${cityName}`);

    let totalInserted = 0;

    for (const { category, osmQueries } of CATEGORY_MAPPINGS) {
        console.log(`  📍 Category: ${category}`);

        const query = buildOverpassQuery(osmQueries, bounds);
        const elements = await queryOverpass(query);

        console.log(`    Found ${elements.length} elements`);

        let insertedCount = 0;

        for (const element of elements) {
            const lat = element.lat ?? element.center?.lat;
            const lon = element.lon ?? element.center?.lon;

            if (!lat || !lon) continue;

            const name = element.tags?.name || element.tags?.brand;
            if (!name) continue;

            const placeId = `osm:${element.type}:${element.id}`;

            try {
                await prisma.store.upsert({
                    where: { placeId },
                    create: {
                        name,
                        category,
                        lat,
                        lng: lon,
                        address: formatAddress(element.tags, cityName),
                        placeId,
                        source: 'osm',
                        trustScore: 60,
                        isOpen: true,
                    },
                    update: {
                        name,
                        address: formatAddress(element.tags, cityName),
                    },
                });
                insertedCount++;
            } catch (error) {
                // Skip duplicate errors silently
            }
        }

        console.log(`    Inserted/updated ${insertedCount} stores`);
        totalInserted += insertedCount;

        // Be nice to the Overpass API
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    return totalInserted;
}

async function main() {
    console.log('🚀 Starting Sergipe State establishment scraper');
    console.log(`📦 Covering ${SERGIPE_CITIES.length} cities\n`);

    let grandTotal = 0;

    for (const city of SERGIPE_CITIES) {
        const count = await scrapeCity(city.name, city.bounds);
        grandTotal += count;

        // Wait between cities
        await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    console.log(`\n✅ Done! Grand total stores inserted/updated: ${grandTotal}`);

    // Show summary
    const storeCounts = await prisma.store.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { source: 'osm' },
    });

    console.log('\n📊 Store counts by category:');
    for (const { category, _count } of storeCounts) {
        console.log(`  ${category}: ${_count.id}`);
    }

    await prisma.$disconnect();
}

main().catch((error) => {
    console.error('Scraper error:', error);
    prisma.$disconnect();
    process.exit(1);
});
