/**
 * Brazil Establishment Scraper
 * Scrapes major cities from all Brazilian states using OpenStreetMap Overpass API
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Major cities from all Brazilian states with bounding boxes
const BRAZIL_CITIES = [
    // ============ NORTE ============
    { name: 'Manaus', state: 'AM', bounds: { south: -3.15, north: -2.95, west: -60.10, east: -59.85 } },
    { name: 'Belém', state: 'PA', bounds: { south: -1.50, north: -1.35, west: -48.55, east: -48.40 } },
    { name: 'Porto Velho', state: 'RO', bounds: { south: -8.85, north: -8.70, west: -63.95, east: -63.80 } },
    { name: 'Macapá', state: 'AP', bounds: { south: 0.00, north: 0.10, west: -51.10, east: -51.00 } },
    { name: 'Rio Branco', state: 'AC', bounds: { south: -10.00, north: -9.90, west: -67.85, east: -67.75 } },
    { name: 'Boa Vista', state: 'RR', bounds: { south: 2.78, north: 2.88, west: -60.72, east: -60.62 } },
    { name: 'Palmas', state: 'TO', bounds: { south: -10.25, north: -10.15, west: -48.40, east: -48.30 } },

    // ============ NORDESTE ============
    { name: 'Salvador', state: 'BA', bounds: { south: -13.05, north: -12.85, west: -38.55, east: -38.35 } },
    { name: 'Fortaleza', state: 'CE', bounds: { south: -3.85, north: -3.68, west: -38.65, east: -38.45 } },
    { name: 'Recife', state: 'PE', bounds: { south: -8.15, north: -7.95, west: -35.00, east: -34.85 } },
    { name: 'São Luís', state: 'MA', bounds: { south: -2.60, north: -2.45, west: -44.35, east: -44.20 } },
    { name: 'Maceió', state: 'AL', bounds: { south: -9.70, north: -9.55, west: -35.80, east: -35.65 } },
    { name: 'Natal', state: 'RN', bounds: { south: -5.90, north: -5.75, west: -35.30, east: -35.15 } },
    { name: 'João Pessoa', state: 'PB', bounds: { south: -7.20, north: -7.05, west: -34.95, east: -34.80 } },
    { name: 'Teresina', state: 'PI', bounds: { south: -5.15, north: -5.00, west: -42.85, east: -42.70 } },
    // Sergipe já foi feito anteriormente

    // ============ CENTRO-OESTE ============
    { name: 'Brasília', state: 'DF', bounds: { south: -15.90, north: -15.70, west: -48.00, east: -47.80 } },
    { name: 'Goiânia', state: 'GO', bounds: { south: -16.75, north: -16.60, west: -49.35, east: -49.20 } },
    { name: 'Cuiabá', state: 'MT', bounds: { south: -15.65, north: -15.55, west: -56.15, east: -56.00 } },
    { name: 'Campo Grande', state: 'MS', bounds: { south: -20.55, north: -20.40, west: -54.70, east: -54.55 } },

    // ============ SUDESTE ============
    { name: 'São Paulo', state: 'SP', bounds: { south: -23.70, north: -23.45, west: -46.80, east: -46.55 } },
    { name: 'Rio de Janeiro', state: 'RJ', bounds: { south: -23.05, north: -22.85, west: -43.35, east: -43.10 } },
    { name: 'Belo Horizonte', state: 'MG', bounds: { south: -20.00, north: -19.80, west: -44.05, east: -43.85 } },
    { name: 'Vitória', state: 'ES', bounds: { south: -20.35, north: -20.25, west: -40.35, east: -40.25 } },
    { name: 'Campinas', state: 'SP', bounds: { south: -22.95, north: -22.85, west: -47.10, east: -47.00 } },
    { name: 'Guarulhos', state: 'SP', bounds: { south: -23.50, north: -23.40, west: -46.55, east: -46.45 } },
    { name: 'Santos', state: 'SP', bounds: { south: -23.98, north: -23.92, west: -46.35, east: -46.28 } },
    { name: 'Niterói', state: 'RJ', bounds: { south: -22.95, north: -22.85, west: -43.15, east: -43.05 } },
    { name: 'Ribeirão Preto', state: 'SP', bounds: { south: -21.22, north: -21.12, west: -47.85, east: -47.75 } },

    // ============ SUL ============
    { name: 'Curitiba', state: 'PR', bounds: { south: -25.55, north: -25.35, west: -49.35, east: -49.20 } },
    { name: 'Porto Alegre', state: 'RS', bounds: { south: -30.15, north: -29.95, west: -51.25, east: -51.10 } },
    { name: 'Florianópolis', state: 'SC', bounds: { south: -27.65, north: -27.55, west: -48.55, east: -48.45 } },
    { name: 'Londrina', state: 'PR', bounds: { south: -23.35, north: -23.25, west: -51.20, east: -51.10 } },
    { name: 'Joinville', state: 'SC', bounds: { south: -26.35, north: -26.25, west: -48.90, east: -48.80 } },
    { name: 'Caxias do Sul', state: 'RS', bounds: { south: -29.20, north: -29.10, west: -51.20, east: -51.10 } },
];

const CATEGORY_MAPPINGS = [
    { category: 'mercado', osmQueries: ['shop=supermarket', 'shop=convenience', 'shop=grocery'] },
    { category: 'farmacia', osmQueries: ['amenity=pharmacy', 'shop=chemist'] },
    { category: 'pet', osmQueries: ['shop=pet', 'shop=pet_grooming'] },
    { category: 'hortifruti', osmQueries: ['shop=greengrocer', 'shop=farm', 'amenity=marketplace'] },
    { category: 'combustivel', osmQueries: ['amenity=fuel'] },
];

interface OSMElement {
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: { name?: string; 'addr:street'?: string; 'addr:housenumber'?: string; 'addr:city'?: string; brand?: string;[key: string]: string | undefined };
}

async function queryOverpass(query: string, retries = 3): Promise<OSMElement[]> {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(overpassUrl, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            if (response.status === 429 || response.status === 504) {
                console.log(`    ⚠️ API ${response.status}, waiting 15s (attempt ${attempt}/${retries})...`);
                await new Promise((resolve) => setTimeout(resolve, 15000));
                continue;
            }

            if (!response.ok) {
                throw new Error(`Overpass API error: ${response.status}`);
            }

            const data = await response.json();
            return data.elements || [];
        } catch (error) {
            if (attempt === retries) {
                console.error(`    ❌ Failed after ${retries} attempts`);
                return [];
            }
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }
    return [];
}

function buildOverpassQuery(osmTags: string[], bounds: { south: number; north: number; west: number; east: number }): string {
    const { south, north, west, east } = bounds;
    const bbox = `${south},${west},${north},${east}`;
    const nodeQueries = osmTags.map((tag) => { const [key, value] = tag.split('='); return `node["${key}"="${value}"](${bbox});`; }).join('');
    const wayQueries = osmTags.map((tag) => { const [key, value] = tag.split('='); return `way["${key}"="${value}"](${bbox});`; }).join('');
    return `[out:json][timeout:90];(${nodeQueries}${wayQueries});out center;`;
}

function formatAddress(tags: OSMElement['tags'], cityName: string, state: string): string {
    if (!tags) return `${cityName}, ${state}`;
    const parts: string[] = [];
    if (tags['addr:street']) {
        let street = tags['addr:street'];
        if (tags['addr:housenumber']) street += `, ${tags['addr:housenumber']}`;
        parts.push(street);
    }
    parts.push(tags['addr:city'] || cityName);
    parts.push(state);
    return parts.join(' - ') || `${cityName}, ${state}`;
}

async function scrapeCity(cityName: string, state: string, bounds: { south: number; north: number; west: number; east: number }): Promise<number> {
    console.log(`\n🏙️ ${cityName} - ${state}`);
    let totalInserted = 0;

    for (const { category, osmQueries } of CATEGORY_MAPPINGS) {
        const query = buildOverpassQuery(osmQueries, bounds);
        const elements = await queryOverpass(query);

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
                    create: { name, category, lat, lng: lon, address: formatAddress(element.tags, cityName, state), placeId, source: 'osm', trustScore: 60, isOpen: true },
                    update: { name, address: formatAddress(element.tags, cityName, state) },
                });
                insertedCount++;
            } catch (error) { /* skip */ }
        }

        console.log(`  ${category}: ${elements.length} found, ${insertedCount} inserted`);
        totalInserted += insertedCount;

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return totalInserted;
}

async function main() {
    console.log('🇧🇷 Starting Brazil-wide establishment scraper');
    console.log(`📦 Covering ${BRAZIL_CITIES.length} major cities\n`);

    let grandTotal = 0;

    for (let i = 0; i < BRAZIL_CITIES.length; i++) {
        const city = BRAZIL_CITIES[i];
        console.log(`\n[${i + 1}/${BRAZIL_CITIES.length}]`);

        const count = await scrapeCity(city.name, city.state, city.bounds);
        grandTotal += count;

        // Longer delay between cities
        console.log(`  ⏳ Waiting 5s before next city...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log(`\n✅ Done! Grand total stores: ${grandTotal}`);

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
