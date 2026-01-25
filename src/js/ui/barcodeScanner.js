/**
 * Barcode Scanner Component
 * Uses QuaggaJS for barcode detection
 */

let scannerModal = null;
let isScanning = false;
let onScanCallback = null;

// QuaggaJS CDN URL
const QUAGGA_CDN = 'https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js';

/**
 * Load QuaggaJS library dynamically
 */
async function loadQuagga() {
    if (window.Quagga) return window.Quagga;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = QUAGGA_CDN;
        script.onload = () => resolve(window.Quagga);
        script.onerror = () => reject(new Error('Failed to load QuaggaJS'));
        document.head.appendChild(script);
    });
}

/**
 * Initialize barcode scanner modal
 */
function initScannerModal() {
    if (scannerModal) return;

    scannerModal = document.createElement('div');
    scannerModal.id = 'barcode-scanner-modal';
    scannerModal.className = 'modal-overlay';
    scannerModal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal__header">
                <h2 class="modal__title">📷 Escanear Código</h2>
                <button class="modal__close" id="scanner-close">&times;</button>
            </div>
            <div class="modal__body">
                <div id="scanner-viewport" class="scanner-viewport">
                    <div class="scanner-overlay">
                        <div class="scanner-line"></div>
                    </div>
                </div>
                <div class="scanner-result" id="scanner-result"></div>
                <div class="scanner-controls">
                    <input type="text" id="manual-barcode" class="form-input" placeholder="Ou digite o código manualmente">
                    <button class="btn btn--primary" id="manual-submit">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(scannerModal);

    // Event listeners
    scannerModal.querySelector('#scanner-close').addEventListener('click', closeScanner);
    scannerModal.addEventListener('click', (e) => {
        if (e.target === scannerModal) closeScanner();
    });

    scannerModal.querySelector('#manual-submit').addEventListener('click', () => {
        const barcode = scannerModal.querySelector('#manual-barcode').value.trim();
        if (barcode && onScanCallback) {
            onScanCallback(barcode);
            closeScanner();
        }
    });

    // Add styles
    addScannerStyles();
}

/**
 * Open barcode scanner
 * @param {Function} callback - Called with scanned barcode
 */
export async function openBarcodeScanner(callback) {
    initScannerModal();
    onScanCallback = callback;

    scannerModal.classList.add('modal-overlay--visible');
    scannerModal.querySelector('#scanner-result').textContent = '';
    scannerModal.querySelector('#manual-barcode').value = '';

    try {
        const Quagga = await loadQuagga();
        startScanning(Quagga);
    } catch (error) {
        console.error('Failed to load scanner:', error);
        scannerModal.querySelector('#scanner-result').textContent =
            'Câmera não disponível. Use o campo manual.';
    }
}

/**
 * Start camera scanning
 */
function startScanning(Quagga) {
    const viewport = document.getElementById('scanner-viewport');

    Quagga.init({
        inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: viewport,
            constraints: {
                width: { min: 280 },
                height: { min: 200 },
                facingMode: 'environment'
            }
        },
        decoder: {
            readers: [
                'ean_reader',
                'ean_8_reader',
                'code_128_reader',
                'code_39_reader',
                'upc_reader',
                'upc_e_reader'
            ]
        },
        locate: true,
        locator: {
            patchSize: 'medium',
            halfSample: true
        }
    }, (err) => {
        if (err) {
            console.error('Quagga init error:', err);
            document.getElementById('scanner-result').textContent =
                'Erro ao acessar câmera. Use o campo manual.';
            return;
        }
        Quagga.start();
        isScanning = true;
    });

    Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        if (code && onScanCallback) {
            // Vibrate on success
            if (navigator.vibrate) navigator.vibrate(100);

            document.getElementById('scanner-result').innerHTML = `
                <div class="scanner-success">
                    <span class="scanner-success__icon">✅</span>
                    <span class="scanner-success__code">${code}</span>
                </div>
            `;

            // Small delay before closing
            setTimeout(() => {
                onScanCallback(code);
                closeScanner();
            }, 500);
        }
    });
}

/**
 * Close scanner modal
 */
export function closeScanner() {
    if (isScanning && window.Quagga) {
        window.Quagga.stop();
        isScanning = false;
    }
    if (scannerModal) {
        scannerModal.classList.remove('modal-overlay--visible');
    }
    onScanCallback = null;
}

/**
 * Add scanner styles
 */
function addScannerStyles() {
    if (document.getElementById('scanner-styles')) return;

    const style = document.createElement('style');
    style.id = 'scanner-styles';
    style.textContent = `
        .scanner-viewport {
            position: relative;
            width: 100%;
            height: 200px;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 1rem;
        }
        
        .scanner-viewport video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .scanner-viewport canvas {
            position: absolute;
            top: 0;
            left: 0;
        }
        
        .scanner-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid rgba(0, 200, 150, 0.5);
            border-radius: 8px;
            pointer-events: none;
        }
        
        .scanner-line {
            position: absolute;
            left: 10%;
            right: 10%;
            height: 2px;
            background: #00C896;
            box-shadow: 0 0 10px #00C896;
            animation: scanLine 2s linear infinite;
        }
        
        @keyframes scanLine {
            0%, 100% { top: 20%; }
            50% { top: 80%; }
        }
        
        .scanner-result {
            text-align: center;
            min-height: 40px;
            margin-bottom: 1rem;
        }
        
        .scanner-success {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            color: #00C896;
            font-weight: 600;
        }
        
        .scanner-success__icon {
            font-size: 1.5rem;
        }
        
        .scanner-success__code {
            font-family: monospace;
            font-size: 1.25rem;
        }
        
        .scanner-controls {
            display: flex;
            gap: 0.5rem;
        }
        
        .scanner-controls .form-input {
            flex: 1;
        }
    `;
    document.head.appendChild(style);
}
