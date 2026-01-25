/**
 * Aracaju-SE Establishment Scraper
 * Uses OpenStreetMap Overpass API to fetch establishments
 * This is legal and free - uses public OSM data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Aracaju-SE bounding box
const ARACAJU_BOUNDS = {
    south: -11.1000,
    north: -10.8500,
    west: -37.1500,
    east: -36.9500,
};

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
        'addr:postcode'?: string;
        brand?: string;
        opening_hours?: string;
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

function buildOverpassQuery(osmTags: string[]): string {
    const { south, north, west, east } = ARACAJU_BOUNDS;
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

function formatAddress(tags: OSMElement['tags']): string {
    if (!tags) return 'Aracaju, SE';

    const parts: string[] = [];

    if (tags['addr:street']) {
        let street = tags['addr:street'];
        if (tags['addr:housenumber']) {
            street += `, ${tags['addr:housenumber']}`;
        }
        parts.push(street);
    }

    if (tags['addr:city']) {
        parts.push(tags['addr:city']);
    } else {
        parts.push('Aracaju');
    }

    parts.push('SE');

    return parts.join(' - ') || 'Aracaju, SE';
}

async function scrapeCategory(categoryName: string, osmQueries: string[]): Promise<number> {
    console.log(`\n📍 Scraping category: ${categoryName}`);

    const query = buildOverpassQuery(osmQueries);
    const elements = await queryOverpass(query);

    console.log(`  Found ${elements.length} elements`);

    let insertedCount = 0;

    for (const element of elements) {
        // Get coordinates
        const lat = element.lat ?? element.center?.lat;
        const lon = element.lon ?? element.center?.lon;

        if (!lat || !lon) continue;

        // Get name (required)
        const name = element.tags?.name || element.tags?.brand;
        if (!name) continue;

        // Build OSM place ID
        const placeId = `osm:${element.type}:${element.id}`;

        try {
            await prisma.store.upsert({
                where: { placeId },
                create: {
                    name,
                    category: categoryName,
                    lat,
                    lng: lon,
                    address: formatAddress(element.tags),
                    placeId,
                    source: 'osm',
                    trustScore: 60,
                    isOpen: true,
                },
                update: {
                    name,
                    address: formatAddress(element.tags),
                },
            });
            insertedCount++;
        } catch (error) {
            console.error(`  Error inserting ${name}:`, error);
        }
    }

    console.log(`  Inserted/updated ${insertedCount} stores`);
    return insertedCount;
}

async function main() {
    console.log('🚀 Starting Aracaju-SE establishment scraper');
    console.log(`📦 Bounding box: ${JSON.stringify(ARACAJU_BOUNDS)}`);

    let totalInserted = 0;

    for (const { category, osmQueries } of CATEGORY_MAPPINGS) {
        const count = await scrapeCategory(category, osmQueries);
        totalInserted += count;

        // Be nice to the Overpass API - wait between requests
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ Done! Total stores inserted/updated: ${totalInserted}`);

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
