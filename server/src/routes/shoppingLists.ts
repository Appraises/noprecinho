import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Get user's shopping lists
 * GET /api/shopping-lists
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const lists = await prisma.shoppingList.findMany({
            where: { userId: req.userId },
            include: {
                items: {
                    orderBy: { createdAt: 'asc' }
                },
                _count: { select: { items: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return res.json(lists);
    } catch (error) {
        console.error('Get shopping lists error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Create a new shopping list
 * POST /api/shopping-lists
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { name, items } = req.body;

        const list = await prisma.shoppingList.create({
            data: {
                name: (typeof name === 'string' && name.trim()) ? name : 'Minha Lista',
                userId: req.userId!,
                items: items ? {
                    create: items.map((item: any) => ({
                        productName: item.productName || item.name,
                        quantity: item.quantity || 1,
                        unit: item.unit || 'un',
                        notes: item.notes || null
                    }))
                } : undefined
            },
            include: {
                items: true
            }
        });

        return res.status(201).json(list);
    } catch (error) {
        console.error('Create shopping list error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Get a specific shopping list with best prices
 * GET /api/shopping-lists/:id
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const list = await prisma.shoppingList.findFirst({
            where: { id, userId: req.userId },
            include: {
                items: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        // Find best prices for each item
        const itemsWithPrices = await Promise.all(
            list.items.map(async (item) => {
                // Resolve product in catalog
                const catalogProduct = await prisma.product.findFirst({
                    where: {
                        OR: [
                            { name: { equals: item.productName, mode: 'insensitive' } },
                            { name: { contains: item.productName, mode: 'insensitive' } },
                            { aliases: { hasSome: [item.productName.toLowerCase()] } }
                        ]
                    },
                    select: { id: true }
                });

                const priceWhere: any = catalogProduct
                    ? { productId: catalogProduct.id }
                    : { product: { contains: item.productName, mode: 'insensitive' } };

                const bestPrice = await prisma.price.findFirst({
                    where: priceWhere,
                    include: {
                        store: {
                            select: { id: true, name: true, address: true, lat: true, lng: true }
                        }
                    },
                    orderBy: { price: 'asc' }
                });

                return {
                    ...item,
                    bestPrice: bestPrice?.price || null,
                    bestStore: bestPrice?.store || null,
                    priceId: bestPrice?.id || null
                };
            })
        );

        // Calculate total and best store combination
        const storeItemCount = new Map<string, { store: any; items: number; total: number }>();

        for (const item of itemsWithPrices) {
            if (item.bestStore) {
                const existing = storeItemCount.get(item.bestStore.id);
                if (existing) {
                    existing.items++;
                    existing.total += (item.bestPrice || 0) * item.quantity;
                } else {
                    storeItemCount.set(item.bestStore.id, {
                        store: item.bestStore,
                        items: 1,
                        total: (item.bestPrice || 0) * item.quantity
                    });
                }
            }
        }

        const storeRanking = Array.from(storeItemCount.values())
            .sort((a, b) => b.items - a.items)
            .slice(0, 5);

        const totalEstimate = itemsWithPrices.reduce(
            (sum, item) => sum + (item.bestPrice || 0) * item.quantity,
            0
        );

        return res.json({
            ...list,
            items: itemsWithPrices,
            stats: {
                itemCount: list.items.length,
                checkedCount: list.items.filter(i => i.isChecked).length,
                totalEstimate: Math.round(totalEstimate * 100) / 100,
                bestStores: storeRanking
            }
        });

    } catch (error) {
        console.error('Get shopping list error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Add item to shopping list
 * POST /api/shopping-lists/:id/items
 */
router.post('/:id/items', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { productName, quantity, unit, notes } = req.body;

        // Verify list belongs to user
        const list = await prisma.shoppingList.findFirst({
            where: { id, userId: req.userId }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        const item = await prisma.shoppingListItem.create({
            data: {
                listId: id,
                productName: productName.trim(),
                quantity: quantity || 1,
                unit: unit || 'un',
                notes: notes || null
            }
        });

        return res.status(201).json(item);

    } catch (error) {
        console.error('Add list item error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Update shopping list item
 * PATCH /api/shopping-lists/:listId/items/:itemId
 */
router.patch('/:listId/items/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { listId, itemId } = req.params;
        const { isChecked, quantity, notes } = req.body;

        // Verify list belongs to user
        const list = await prisma.shoppingList.findFirst({
            where: { id: listId, userId: req.userId }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        const item = await prisma.shoppingListItem.update({
            where: { id: itemId },
            data: {
                isChecked: isChecked !== undefined ? isChecked : undefined,
                quantity: quantity !== undefined ? quantity : undefined,
                notes: notes !== undefined ? notes : undefined
            }
        });

        return res.json(item);

    } catch (error) {
        console.error('Update list item error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Delete shopping list item
 * DELETE /api/shopping-lists/:listId/items/:itemId
 */
router.delete('/:listId/items/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { listId, itemId } = req.params;

        const list = await prisma.shoppingList.findFirst({
            where: { id: listId, userId: req.userId }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        await prisma.shoppingListItem.delete({
            where: { id: itemId }
        });

        return res.status(204).send();

    } catch (error) {
        console.error('Delete list item error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Delete shopping list
 * DELETE /api/shopping-lists/:id
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const list = await prisma.shoppingList.findFirst({
            where: { id, userId: req.userId }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        await prisma.shoppingList.delete({
            where: { id }
        });

        return res.status(204).send();

    } catch (error) {
        console.error('Delete shopping list error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Optimize shopping list - find best store(s) to minimize total cost + travel
 * POST /api/shopping-lists/:id/optimize
 * 
 * Body:
 * - savingsThreshold: minimum savings % to recommend split (default 0.10)
 * - userLat, userLng: user's current location
 * - travelCostPerKm: estimated cost per km traveled (default R$ 1.50 for fuel)
 * - maxDistanceKm: max acceptable distance to a store (default 10km)
 * 
 * Returns:
 * - Single store options ranked by total cost + travel
 * - Optimal 2-store split considering route distance
 */
router.post('/:id/optimize', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const {
            savingsThreshold = 0.10,
            userLat,
            userLng,
            travelCostPerKm = 1.50, // R$ per km (fuel estimate)
            maxDistanceKm = 10000
        } = req.body;

        // Helper: Calculate distance between two points (Haversine formula)
        function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        // Get the list
        const list = await prisma.shoppingList.findFirst({
            where: { id, userId: req.userId },
            include: { items: true }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        if (list.items.length === 0) {
            return res.json({
                items: [],
                singleStoreOptions: [],
                twoStoreSplit: null,
                recommendation: 'empty'
            });
        }

        const hasUserLocation = userLat && userLng;

        // Step 1: Get ALL prices for each item across ALL stores
        const itemPrices: Map<string, { itemId: string; productName: string; quantity: number; prices: Map<string, { price: number; store: any }> }> = new Map();
        const storeCache: Map<string, any> = new Map();

        for (const item of list.items) {
            // First, find the product in the catalog
            const catalogProduct = await prisma.product.findFirst({
                where: {
                    OR: [
                        { name: { equals: item.productName, mode: 'insensitive' } },
                        { name: { contains: item.productName, mode: 'insensitive' } },
                        { aliases: { hasSome: [item.productName.toLowerCase()] } }
                    ]
                },
                select: { id: true }
            });

            // Search prices: prefer FK match, fallback to text match
            const priceWhere: any = catalogProduct
                ? { productId: catalogProduct.id }
                : { product: { contains: item.productName, mode: 'insensitive' } };

            const prices = await prisma.price.findMany({
                where: priceWhere,
                include: {
                    store: {
                        select: { id: true, name: true, address: true, lat: true, lng: true, category: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const storeMap = new Map<string, { price: number; store: any }>();
            for (const p of prices) {
                if (!storeMap.has(p.storeId)) {
                    storeMap.set(p.storeId, { price: p.price, store: p.store });
                    storeCache.set(p.storeId, p.store);
                }
            }

            itemPrices.set(item.id, {
                itemId: item.id,
                productName: item.productName,
                quantity: item.quantity,
                prices: storeMap
            });
        }

        // Step 2: Calculate single-store totals with distance
        const allStoreIds = new Set<string>();
        for (const item of itemPrices.values()) {
            for (const storeId of item.prices.keys()) {
                allStoreIds.add(storeId);
            }
        }

        const singleStoreResults: Array<{
            store: any;
            total: number;
            travelCost: number;
            effectiveTotal: number; // total + travel cost
            distanceKm: number;
            itemsFound: number;
            itemsMissing: string[];
            items: Array<{ productName: string; price: number; quantity: number }>;
        }> = [];

        for (const storeId of allStoreIds) {
            let total = 0;
            let itemsFound = 0;
            const itemsMissing: string[] = [];
            const itemsInStore: Array<{ productName: string; price: number; quantity: number }> = [];
            const storeInfo = storeCache.get(storeId);

            if (!storeInfo) continue;

            // Calculate distance from user
            let distanceKm = 0;
            if (hasUserLocation && storeInfo.lat && storeInfo.lng) {
                distanceKm = calculateDistance(userLat, userLng, storeInfo.lat, storeInfo.lng);
                // Skip stores that are too far
                if (distanceKm > maxDistanceKm) continue;
            }

            for (const item of itemPrices.values()) {
                const storePrice = item.prices.get(storeId);
                if (storePrice) {
                    total += storePrice.price * item.quantity;
                    itemsFound++;
                    itemsInStore.push({
                        productName: item.productName,
                        price: storePrice.price,
                        quantity: item.quantity
                    });
                } else {
                    itemsMissing.push(item.productName);
                }
            }

            if (itemsFound >= list.items.length / 2) {
                const travelCost = hasUserLocation ? distanceKm * 2 * travelCostPerKm : 0; // Round trip
                singleStoreResults.push({
                    store: storeInfo,
                    total: Math.round(total * 100) / 100,
                    travelCost: Math.round(travelCost * 100) / 100,
                    effectiveTotal: Math.round((total + travelCost) * 100) / 100,
                    distanceKm: Math.round(distanceKm * 10) / 10,
                    itemsFound,
                    itemsMissing,
                    items: itemsInStore
                });
            }
        }

        // Sort by effective total (price + travel)
        singleStoreResults.sort((a, b) => a.effectiveTotal - b.effectiveTotal);
        const topSingleStores = singleStoreResults.slice(0, 5);

        // Step 3: Calculate optimal 2-store split with travel route
        let bestTwoStoreSplit: {
            storeA: any;
            storeB: any;
            storeAItems: Array<{ productName: string; price: number; quantity: number }>;
            storeBItems: Array<{ productName: string; price: number; quantity: number }>;
            storeATotal: number;
            storeBTotal: number;
            combinedTotal: number;
            travelCost: number;
            effectiveTotal: number;
            totalDistanceKm: number;
            routeDescription: string;
            savings: number;
            savingsPercent: number;
            netSavings: number; // Savings after accounting for extra travel
        } | null = null;

        const storeIds = Array.from(allStoreIds).filter(id => {
            const store = storeCache.get(id);
            if (!hasUserLocation || !store?.lat || !store?.lng) return true;
            return calculateDistance(userLat, userLng, store.lat, store.lng) <= maxDistanceKm;
        });

        const bestSingleEffective = topSingleStores[0]?.effectiveTotal || Infinity;
        const bestSingleTotal = topSingleStores[0]?.total || Infinity;
        const hasMissingItems = topSingleStores.length > 0 && topSingleStores[0].itemsMissing && topSingleStores[0].itemsMissing.length > 0;

        // Try all pairs of stores
        for (let i = 0; i < storeIds.length; i++) {
            for (let j = i + 1; j < storeIds.length; j++) {
                const storeAId = storeIds[i];
                const storeBId = storeIds[j];
                const storeAInfo = storeCache.get(storeAId);
                const storeBInfo = storeCache.get(storeBId);

                if (!storeAInfo || !storeBInfo) continue;

                let storeATotal = 0;
                let storeBTotal = 0;
                const storeAItems: Array<{ productName: string; price: number; quantity: number }> = [];
                const storeBItems: Array<{ productName: string; price: number; quantity: number }> = [];
                let allItemsCovered = true;

                for (const item of itemPrices.values()) {
                    const priceA = item.prices.get(storeAId);
                    const priceB = item.prices.get(storeBId);

                    if (priceA && priceB) {
                        if (priceA.price <= priceB.price) {
                            storeATotal += priceA.price * item.quantity;
                            storeAItems.push({ productName: item.productName, price: priceA.price, quantity: item.quantity });
                        } else {
                            storeBTotal += priceB.price * item.quantity;
                            storeBItems.push({ productName: item.productName, price: priceB.price, quantity: item.quantity });
                        }
                    } else if (priceA) {
                        storeATotal += priceA.price * item.quantity;
                        storeAItems.push({ productName: item.productName, price: priceA.price, quantity: item.quantity });
                    } else if (priceB) {
                        storeBTotal += priceB.price * item.quantity;
                        storeBItems.push({ productName: item.productName, price: priceB.price, quantity: item.quantity });
                    } else {
                        allItemsCovered = false;
                    }
                }

                if (!allItemsCovered) continue;

                // Calculate optimal route distance: User → Closest → Furthest → User
                let totalDistanceKm = 0;
                let routeDescription = '';

                if (hasUserLocation && storeAInfo.lat && storeAInfo.lng && storeBInfo.lat && storeBInfo.lng) {
                    const distUserToA = calculateDistance(userLat, userLng, storeAInfo.lat, storeAInfo.lng);
                    const distUserToB = calculateDistance(userLat, userLng, storeBInfo.lat, storeBInfo.lng);
                    const distAtoB = calculateDistance(storeAInfo.lat, storeAInfo.lng, storeBInfo.lat, storeBInfo.lng);

                    // Force order: User -> Closest -> Furthest
                    // If A is closer: User -> A -> B -> User
                    // If B is closer: User -> B -> A -> User

                    // We swap A and B in the result object if B is closer, to ensure the UI shows the path correctly
                    // However, we must preserve the item assignments.

                    // Route 1: User → A → B → User
                    const route1 = distUserToA + distAtoB + distUserToB; // strictly this is User->A->B->? (implicitly back to user for cost, but for display we just want the path)
                    // actually for cost we usually do round trip.

                    // Let's stick to the travel cost logic (round trip usually implies returning home).
                    // But for the "Route Description", we want "You -> First -> Second".

                    if (distUserToA <= distUserToB) {
                        totalDistanceKm = distUserToA + distAtoB + distUserToB; // Loop
                        routeDescription = `Você → ${storeAInfo.name} → ${storeBInfo.name}`;
                    } else {
                        // Swap stores for the split object so Store A is always the first stop
                        // We will handle this swap when assigning to bestTwoStoreSplit below? 
                        // No, bestTwoStoreSplit has storeA and storeB fixed by the loop. 
                        // We should just flag which is first? Or swap them in the result?
                        // Swapping in the result is cleaner for the frontend.

                        totalDistanceKm = distUserToB + distAtoB + distUserToA; // Loop
                        routeDescription = `Você → ${storeBInfo.name} → ${storeAInfo.name}`;

                        // We'll trust the distance calcs, but we need to pass this ordering info or swap them.
                        // Let's swap them in the construction of bestTwoStoreSplit if needed.
                    }
                }

                const combinedTotal = Math.round((storeATotal + storeBTotal) * 100) / 100;
                const travelCost = hasUserLocation ? totalDistanceKm * travelCostPerKm : 0;
                const effectiveTotal = Math.round((combinedTotal + travelCost) * 100) / 100;

                const savings = Math.round((bestSingleTotal - combinedTotal) * 100) / 100;
                const savingsPercent = bestSingleTotal > 0 ? savings / bestSingleTotal : 0;
                const netSavings = Math.round((bestSingleEffective - effectiveTotal) * 100) / 100;

                // Recommendation criteria:
                // We ALWAYS track the best split option if it covers all items.
                // We will decide whether to RECOMMEND it at the end (Step 4).

                if (!bestTwoStoreSplit || effectiveTotal < bestTwoStoreSplit.effectiveTotal) {
                    // Check who is closer for ordering in the result
                    let firstStore = storeAInfo;
                    let secondStore = storeBInfo;
                    let firstItems = storeAItems;
                    let secondItems = storeBItems;
                    let firstTotal = storeATotal;
                    let secondTotal = storeBTotal;

                    if (hasUserLocation && storeAInfo.lat && storeAInfo.lng && storeBInfo.lat && storeBInfo.lng) {
                        const distUserToA = calculateDistance(userLat, userLng, storeAInfo.lat, storeAInfo.lng);
                        const distUserToB = calculateDistance(userLat, userLng, storeBInfo.lat, storeBInfo.lng);
                        if (distUserToB < distUserToA) {
                            firstStore = storeBInfo;
                            secondStore = storeAInfo;
                            firstItems = storeBItems;
                            secondItems = storeAItems;
                            firstTotal = storeBTotal;
                            secondTotal = storeATotal;
                        }
                    }

                    bestTwoStoreSplit = {
                        storeA: firstStore,
                        storeB: secondStore,
                        storeAItems: firstItems,
                        storeBItems: secondItems,
                        storeATotal: Math.round(firstTotal * 100) / 100,
                        storeBTotal: Math.round(secondTotal * 100) / 100,
                        combinedTotal,
                        travelCost: Math.round(travelCost * 100) / 100,
                        effectiveTotal,
                        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
                        routeDescription,
                        savings,
                        savingsPercent: Math.round(savingsPercent * 100),
                        netSavings
                    };
                }
            }
        }

        // Step 4: Build recommendation
        let recommendation: 'single' | 'split' | 'empty' = 'single';

        // Force split if single store is missing items but split is not
        const singleHasMissing = topSingleStores.length > 0 && topSingleStores[0].itemsMissing && topSingleStores[0].itemsMissing.length > 0;

        if (bestTwoStoreSplit) {
            if (singleHasMissing) {
                // If single option is incomplete, ALWAYS prefer split if it exists
                recommendation = 'split';
            } else if (bestTwoStoreSplit.netSavings > 0 && bestTwoStoreSplit.savingsPercent >= savingsThreshold * 100) {
                // Otherwise only if savings are good
                recommendation = 'split';
            }
        }

        // Build items with best prices
        const optimizedItems = list.items.map(item => {
            const itemData = itemPrices.get(item.id);
            let bestPrice: number | null = null;
            let bestStore: any = null;

            if (itemData) {
                for (const [, data] of itemData.prices) {
                    if (bestPrice === null || data.price < bestPrice) {
                        bestPrice = data.price;
                        bestStore = data.store;
                    }
                }
            }

            return {
                ...item,
                bestPrice,
                bestStore,
                storesAvailable: itemData?.prices.size || 0
            };
        });

        return res.json({
            items: optimizedItems,
            singleStoreOptions: topSingleStores,
            twoStoreSplit: bestTwoStoreSplit,
            recommendation,
            totalItems: list.items.length,
            userLocation: hasUserLocation ? { lat: userLat, lng: userLng } : null,
            settings: { travelCostPerKm, maxDistanceKm }
        });

    } catch (error) {
        console.error('Optimize shopping list error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Share list with another user by email
 * POST /api/shopping-lists/:id/share
 */
router.post('/:id/share', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { email, permission = 'edit' } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }

        // Verify list ownership
        const list = await prisma.shoppingList.findFirst({
            where: { id, userId: req.userId }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        // Can't share with yourself
        const owner = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { email: true }
        });

        if (owner?.email === email.toLowerCase()) {
            return res.status(400).json({ error: 'Você não pode compartilhar a lista com você mesmo' });
        }

        // Create or update share
        const share = await prisma.shoppingListShare.upsert({
            where: {
                listId_email: {
                    listId: id,
                    email: email.toLowerCase()
                }
            },
            update: { permission },
            create: {
                listId: id,
                email: email.toLowerCase(),
                permission
            }
        });

        return res.status(201).json(share);
    } catch (error) {
        console.error('Share list error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Get list shares
 * GET /api/shopping-lists/:id/shares
 */
router.get('/:id/shares', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verify ownership or share access
        const list = await prisma.shoppingList.findFirst({
            where: { id, userId: req.userId }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        const shares = await prisma.shoppingListShare.findMany({
            where: { listId: id }
        });

        return res.json(shares);
    } catch (error) {
        console.error('Get shares error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Remove share
 * DELETE /api/shopping-lists/:id/share/:email
 */
router.delete('/:id/share/:email', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id, email } = req.params;

        // Verify list ownership
        const list = await prisma.shoppingList.findFirst({
            where: { id, userId: req.userId }
        });

        if (!list) {
            return res.status(404).json({ error: 'Lista não encontrada' });
        }

        await prisma.shoppingListShare.deleteMany({
            where: {
                listId: id,
                email: email.toLowerCase()
            }
        });

        return res.status(204).send();
    } catch (error) {
        console.error('Remove share error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Get lists shared with me
 * GET /api/shopping-lists/shared
 */
router.get('/shared', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { email: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const shares = await prisma.shoppingListShare.findMany({
            where: { email: user.email },
            include: {
                list: {
                    include: {
                        items: true,
                        user: {
                            select: { name: true, avatar: true }
                        }
                    }
                }
            }
        });

        return res.json(shares.map(s => ({
            ...s.list,
            sharedBy: s.list.user,
            permission: s.permission
        })));
    } catch (error) {
        console.error('Get shared lists error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;


