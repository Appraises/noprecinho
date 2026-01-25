// Price validation and analytics

// Statistical price validation
export function validatePrice(price, productName, category, historicalPrices = []) {
    const result = {
        isValid: true,
        confidence: 1.0,
        warnings: [],
        suggestions: []
    };

    // Basic validation
    if (price <= 0) {
        result.isValid = false;
        result.warnings.push('Preço deve ser maior que zero');
        return result;
    }

    if (price > 100000) {
        result.isValid = false;
        result.warnings.push('Preço muito alto para um produto');
        return result;
    }

    // Category-based validation
    const categoryRanges = {
        mercado: { min: 0.50, max: 500, typical: { min: 2, max: 100 } },
        hortifruti: { min: 0.50, max: 50, typical: { min: 1, max: 20 } },
        farmacia: { min: 1, max: 1000, typical: { min: 5, max: 100 } },
        pet: { min: 5, max: 2000, typical: { min: 20, max: 300 } },
        combustivel: { min: 3, max: 10, typical: { min: 4, max: 8 } },
        outros: { min: 0.50, max: 5000, typical: { min: 5, max: 200 } }
    };

    const range = categoryRanges[category] || categoryRanges.outros;

    if (price < range.min || price > range.max) {
        result.warnings.push(`Preço fora do esperado para ${category}`);
        result.confidence *= 0.5;
    }

    if (price < range.typical.min || price > range.typical.max) {
        result.confidence *= 0.8;
    }

    // Historical comparison
    if (historicalPrices.length >= 3) {
        const stats = calculatePriceStats(historicalPrices);

        // Z-score analysis
        const zScore = (price - stats.mean) / stats.stdDev;

        if (Math.abs(zScore) > 3) {
            result.warnings.push('Preço muito diferente do histórico (possível erro)');
            result.confidence *= 0.3;
            result.isValid = false;
        } else if (Math.abs(zScore) > 2) {
            result.warnings.push('Preço significativamente diferente do histórico');
            result.confidence *= 0.6;
        } else if (Math.abs(zScore) > 1.5) {
            result.warnings.push('Preço um pouco acima/abaixo do normal');
            result.confidence *= 0.8;
        }

        // Price drop/spike detection
        const recentAvg = stats.recentAverage;
        const percentChange = ((price - recentAvg) / recentAvg) * 100;

        if (percentChange < -30) {
            result.suggestions.push(`Queda de ${Math.abs(percentChange).toFixed(0)}% - boa oferta!`);
        } else if (percentChange > 30) {
            result.warnings.push(`Aumento de ${percentChange.toFixed(0)}% em relação à média recente`);
        }
    }

    // Pattern-based fraud detection
    const fraudPatterns = detectFraudPatterns(price, productName);
    result.warnings.push(...fraudPatterns.warnings);
    result.confidence *= fraudPatterns.confidenceMultiplier;

    // Final confidence adjustment
    result.confidence = Math.max(0, Math.min(1, result.confidence));
    result.isValid = result.isValid && result.confidence > 0.3;

    return result;
}

// Calculate price statistics
function calculatePriceStats(prices) {
    const values = prices.map(p => p.price || p);
    const n = values.length;

    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const sorted = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

    // Recent average (last 5 entries)
    const recent = values.slice(-5);
    const recentAverage = recent.reduce((a, b) => a + b, 0) / recent.length;

    return {
        mean,
        median,
        stdDev,
        min: Math.min(...values),
        max: Math.max(...values),
        recentAverage,
        count: n
    };
}

// Detect fraud patterns
function detectFraudPatterns(price, productName) {
    const result = {
        warnings: [],
        confidenceMultiplier: 1.0
    };

    // Round number detection (suspicious if always round)
    if (price === Math.round(price) && price > 10) {
        result.warnings.push('Preço redondo (pode ser estimativa)');
        result.confidenceMultiplier *= 0.9;
    }

    // Common typo patterns
    const priceStr = price.toString();
    if (priceStr.includes('99') && price < 1) {
        result.warnings.push('Possível erro de digitação');
        result.confidenceMultiplier *= 0.5;
    }

    return result;
}

// Price trend analysis
export function analyzePriceTrend(priceHistory) {
    if (priceHistory.length < 2) {
        return { trend: 'insufficient_data', confidence: 0 };
    }

    // Sort by date
    const sorted = [...priceHistory].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Calculate trend using linear regression
    const n = sorted.length;
    const xMean = (n - 1) / 2;
    const yMean = sorted.reduce((sum, p) => sum + p.price, 0) / n;

    let numerator = 0;
    let denominator = 0;

    sorted.forEach((p, i) => {
        numerator += (i - xMean) * (p.price - yMean);
        denominator += Math.pow(i - xMean, 2);
    });

    const slope = numerator / denominator;
    const percentChange = (slope / yMean) * 100;

    // Determine trend
    let trend;
    if (percentChange > 5) {
        trend = 'rising';
    } else if (percentChange < -5) {
        trend = 'falling';
    } else {
        trend = 'stable';
    }

    // Calculate R-squared for confidence
    const predictions = sorted.map((_, i) => yMean + slope * (i - xMean));
    const ssRes = sorted.reduce((sum, p, i) => sum + Math.pow(p.price - predictions[i], 2), 0);
    const ssTot = sorted.reduce((sum, p) => sum + Math.pow(p.price - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);

    return {
        trend,
        slope,
        percentChange,
        confidence: Math.max(0, rSquared),
        prediction: {
            nextWeek: yMean + slope * (n + 7),
            nextMonth: yMean + slope * (n + 30)
        }
    };
}

// Best time to buy analysis
export function findBestTimeToBuy(priceHistory) {
    if (priceHistory.length < 10) {
        return {
            recommendation: null,
            message: 'Dados insuficientes para análise'
        };
    }

    // Group by day of week
    const byDayOfWeek = {};
    priceHistory.forEach(p => {
        const day = new Date(p.timestamp).getDay();
        if (!byDayOfWeek[day]) byDayOfWeek[day] = [];
        byDayOfWeek[day].push(p.price);
    });

    // Calculate average by day
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const averages = Object.entries(byDayOfWeek).map(([day, prices]) => ({
        day: parseInt(day),
        dayName: dayNames[day],
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        sampleSize: prices.length
    }));

    // Find best and worst days
    const sorted = [...averages].sort((a, b) => a.average - b.average);
    const bestDay = sorted[0];
    const worstDay = sorted[sorted.length - 1];

    const savingsPercent = ((worstDay.average - bestDay.average) / worstDay.average * 100).toFixed(1);

    return {
        recommendation: bestDay.dayName,
        bestDay,
        worstDay,
        savingsPercent,
        message: `Compre na ${bestDay.dayName} e economize até ${savingsPercent}%`,
        allDays: averages
    };
}

// Seasonal price analysis
export function analyzeSeasonality(priceHistory, months = 12) {
    // Group by month
    const byMonth = {};
    priceHistory.forEach(p => {
        const month = new Date(p.timestamp).getMonth();
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(p.price);
    });

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const seasonal = Object.entries(byMonth).map(([month, prices]) => ({
        month: parseInt(month),
        monthName: monthNames[month],
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
        min: Math.min(...prices),
        max: Math.max(...prices),
        sampleSize: prices.length
    }));

    return seasonal.sort((a, b) => a.month - b.month);
}

// Compare prices across stores
export function compareStores(pricesByStore) {
    const comparison = Object.entries(pricesByStore).map(([storeId, prices]) => {
        const recent = prices
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        const avgPrice = recent.reduce((sum, p) => sum + p.price, 0) / recent.length;

        return {
            storeId,
            averagePrice: avgPrice,
            lowestRecent: Math.min(...recent.map(p => p.price)),
            lastUpdate: recent[0]?.timestamp,
            sampleSize: recent.length
        };
    });

    return comparison.sort((a, b) => a.averagePrice - b.averagePrice);
}
