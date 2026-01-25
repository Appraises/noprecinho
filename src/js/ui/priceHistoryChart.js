/**
 * Price History Chart Component
 * Uses Chart.js to display price trends
 */

let chartModal = null;
let chartInstance = null;

/**
 * Initialize price history chart modal
 */
export function initPriceHistoryChart() {
    chartModal = document.createElement('div');
    chartModal.id = 'price-history-modal';
    chartModal.className = 'modal-overlay';
    chartModal.innerHTML = `
        <div class="modal" style="max-width: 700px;">
            <div class="modal__header">
                <h2 class="modal__title" id="chart-title">Histórico de Preços</h2>
                <button class="modal__close" id="chart-close">&times;</button>
            </div>
            <div class="modal__body">
                <div class="chart-container" id="chart-container">
                    <canvas id="price-chart"></canvas>
                </div>
                <div class="chart-summary" id="chart-summary"></div>
                <div class="chart-controls">
                    <button class="chip chip--active" data-days="7">7 dias</button>
                    <button class="chip" data-days="30">30 dias</button>
                    <button class="chip" data-days="90">90 dias</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(chartModal);

    // Event listeners
    chartModal.querySelector('#chart-close').addEventListener('click', closeChart);
    chartModal.addEventListener('click', (e) => {
        if (e.target === chartModal) closeChart();
    });

    // Add chart-specific styles
    addChartStyles();
}

/**
 * Open price history chart for a product
 * @param {string} productName 
 * @param {string} storeId - Optional store filter
 */
export async function openPriceHistoryChart(productName, storeId = null) {
    if (!chartModal) initPriceHistoryChart();

    const title = chartModal.querySelector('#chart-title');
    title.textContent = `📈 ${productName}`;

    chartModal.classList.add('modal-overlay--visible');

    // Load data
    await loadChartData(productName, storeId, 30);

    // Set up period buttons
    chartModal.querySelectorAll('.chart-controls .chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            chartModal.querySelectorAll('.chart-controls .chip').forEach(b => b.classList.remove('chip--active'));
            e.target.classList.add('chip--active');
            loadChartData(productName, storeId, parseInt(e.target.dataset.days));
        });
    });
}

/**
 * Load chart data from API
 */
async function loadChartData(productName, storeId, days) {
    const container = chartModal.querySelector('#chart-container');
    const summary = chartModal.querySelector('#chart-summary');

    try {
        const params = new URLSearchParams({ product: productName, days: days.toString() });
        if (storeId) params.set('storeId', storeId);

        const response = await fetch(`http://localhost:3000/api/price-history?${params}`);
        const data = await response.json();

        if (!data.chartData || data.chartData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">📊</div>
                    <div class="empty-state__title">Sem histórico</div>
                    <div class="empty-state__description">Ainda não há dados suficientes para este produto.</div>
                </div>
            `;
            summary.innerHTML = '';
            return;
        }

        // Render summary
        const trendIcon = data.trend === 'up' ? '📈' : data.trend === 'down' ? '📉' : '➡️';
        const trendClass = data.trend === 'up' ? 'text-danger' : data.trend === 'down' ? 'text-success' : '';

        summary.innerHTML = `
            <div class="chart-stats">
                <div class="chart-stat">
                    <span class="chart-stat__label">Atual</span>
                    <span class="chart-stat__value">R$ ${data.summary.currentAvg.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="chart-stat">
                    <span class="chart-stat__label">Menor</span>
                    <span class="chart-stat__value text-success">R$ ${data.summary.lowestEver.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="chart-stat">
                    <span class="chart-stat__label">Maior</span>
                    <span class="chart-stat__value text-danger">R$ ${data.summary.highestEver.toFixed(2).replace('.', ',')}</span>
                </div>
                <div class="chart-stat">
                    <span class="chart-stat__label">Tendência</span>
                    <span class="chart-stat__value ${trendClass}">${trendIcon}</span>
                </div>
            </div>
        `;

        // Render chart
        renderChart(data.chartData);

    } catch (error) {
        console.error('Load chart error:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">❌</div>
                <div class="empty-state__title">Erro ao carregar</div>
                <div class="empty-state__description">${error.message}</div>
            </div>
        `;
    }
}

/**
 * Render the chart using Canvas 2D (no Chart.js dependency)
 */
function renderChart(chartData) {
    const canvas = document.getElementById('price-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth;
    const height = 200;

    canvas.width = width;
    canvas.height = height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Padding
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Data
    const prices = chartData.map(d => d.avg);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const priceRange = maxPrice - minPrice;

    // Draw grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Price label
        const price = maxPrice - (priceRange / 4) * i;
        ctx.fillStyle = '#64748B';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(`R$ ${price.toFixed(2)}`, padding.left - 5, y + 4);
    }

    // Draw line
    ctx.strokeStyle = '#00C896';
    ctx.lineWidth = 2;
    ctx.beginPath();

    chartData.forEach((point, i) => {
        const x = padding.left + (chartWidth / (chartData.length - 1)) * i;
        const y = padding.top + chartHeight - ((point.avg - minPrice) / priceRange) * chartHeight;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw area under line
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    gradient.addColorStop(0, 'rgba(0, 200, 150, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 200, 150, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw dots
    ctx.fillStyle = '#00C896';
    chartData.forEach((point, i) => {
        const x = padding.left + (chartWidth / (chartData.length - 1)) * i;
        const y = padding.top + chartHeight - ((point.avg - minPrice) / priceRange) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw date labels
    ctx.fillStyle = '#64748B';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';

    const labelInterval = Math.ceil(chartData.length / 5);
    chartData.forEach((point, i) => {
        if (i % labelInterval === 0 || i === chartData.length - 1) {
            const x = padding.left + (chartWidth / (chartData.length - 1)) * i;
            const date = new Date(point.date);
            ctx.fillText(`${date.getDate()}/${date.getMonth() + 1}`, x, height - 5);
        }
    });
}

/**
 * Close chart modal
 */
export function closeChart() {
    if (chartModal) {
        chartModal.classList.remove('modal-overlay--visible');
    }
}

/**
 * Add chart styles
 */
function addChartStyles() {
    if (document.getElementById('chart-styles')) return;

    const style = document.createElement('style');
    style.id = 'chart-styles';
    style.textContent = `
        .chart-container {
            width: 100%;
            height: 220px;
            margin-bottom: 1rem;
        }
        
        .chart-container canvas {
            width: 100% !important;
            height: 100% !important;
        }
        
        .chart-stats {
            display: flex;
            justify-content: space-between;
            padding: 1rem;
            background: var(--color-background);
            border-radius: 12px;
            margin-bottom: 1rem;
        }
        
        .chart-stat {
            text-align: center;
        }
        
        .chart-stat__label {
            display: block;
            font-size: 0.75rem;
            color: var(--color-text-secondary);
            margin-bottom: 0.25rem;
        }
        
        .chart-stat__value {
            font-size: 1rem;
            font-weight: 600;
        }
        
        .chart-controls {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
        }
    `;
    document.head.appendChild(style);
}
