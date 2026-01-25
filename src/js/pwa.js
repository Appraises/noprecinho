/**
 * PWA Install Prompt Handler
 * Manages the "Add to Home Screen" functionality
 */

let deferredPrompt = null;
let installButton = null;

/**
 * Initialize PWA install prompt
 */
export function initPWAInstall() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show install button
        showInstallButton();
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallButton();
        console.log('📱 PreçoJá instalado com sucesso!');
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App rodando em modo PWA');
    }
}

/**
 * Show install button in UI
 */
function showInstallButton() {
    // Check if button already exists
    if (document.getElementById('pwa-install-btn')) return;

    installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-install-btn';
    installButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>Instalar App</span>
    `;

    installButton.addEventListener('click', handleInstallClick);

    // Add to DOM
    document.body.appendChild(installButton);

    // Add styles
    addInstallButtonStyles();

    // Animate in
    setTimeout(() => installButton.classList.add('pwa-install-btn--visible'), 100);
}

/**
 * Hide install button
 */
function hideInstallButton() {
    if (installButton) {
        installButton.classList.remove('pwa-install-btn--visible');
        setTimeout(() => installButton?.remove(), 300);
        installButton = null;
    }
}

/**
 * Handle install button click
 */
async function handleInstallClick() {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`PWA install: ${outcome}`);

    // Clear the deferredPrompt
    deferredPrompt = null;
    hideInstallButton();
}

/**
 * Manually trigger install prompt (for menu button)
 */
export function triggerInstallPrompt() {
    if (deferredPrompt) {
        handleInstallClick();
    } else {
        // Show instructions based on platform
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isIOS) {
            alert('Para instalar:\n1. Toque no botão Compartilhar\n2. Selecione "Adicionar à Tela Inicial"');
        } else {
            alert('Para instalar, acesse pelo Chrome e clique no menu ⋮ → "Instalar aplicativo"');
        }
    }
}

/**
 * Check if app can be installed
 */
export function canInstall() {
    return deferredPrompt !== null;
}

/**
 * Check if running as installed PWA
 */
export function isInstalledPWA() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

/**
 * Add install button styles
 */
function addInstallButtonStyles() {
    if (document.getElementById('pwa-install-styles')) return;

    const style = document.createElement('style');
    style.id = 'pwa-install-styles';
    style.textContent = `
        .pwa-install-btn {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: linear-gradient(135deg, #00C896 0%, #00A87A 100%);
            color: white;
            border: none;
            padding: 0.875rem 1.5rem;
            border-radius: 50px;
            font-size: 0.9375rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 200, 150, 0.4);
            z-index: 1000;
            transition: transform 0.3s ease, box-shadow 0.2s;
        }
        
        .pwa-install-btn--visible {
            transform: translateX(-50%) translateY(0);
        }
        
        .pwa-install-btn:hover {
            box-shadow: 0 6px 24px rgba(0, 200, 150, 0.5);
        }
        
        .pwa-install-btn:active {
            transform: translateX(-50%) translateY(0) scale(0.98);
        }
        
        @media (max-width: 480px) {
            .pwa-install-btn {
                bottom: 100px;
            }
        }
    `;
    document.head.appendChild(style);
}
