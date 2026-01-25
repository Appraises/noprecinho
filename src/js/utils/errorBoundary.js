// Error boundary and error handling utilities

// Global error handler
export function initErrorBoundary() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
        console.error('[Error Boundary] Uncaught error:', event.error);
        handleError(event.error, 'uncaught');
        // Prevent default browser error handling
        // event.preventDefault();
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('[Error Boundary] Unhandled promise rejection:', event.reason);
        handleError(event.reason, 'promise');
        // event.preventDefault();
    });

    console.log('🛡️ Error boundary initialized');
}

// Error types
export const ErrorTypes = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTH: 'auth',
    NOT_FOUND: 'not_found',
    PERMISSION: 'permission',
    STORAGE: 'storage',
    UNKNOWN: 'unknown'
};

// Custom error class
export class AppError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN, details = {}) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

// Handle error based on type
function handleError(error, source = 'unknown') {
    const errorInfo = parseError(error);

    // Log to console
    console.group(`🚨 Error [${source}]`);
    console.error('Type:', errorInfo.type);
    console.error('Message:', errorInfo.message);
    console.error('Stack:', errorInfo.stack);
    console.error('Details:', errorInfo.details);
    console.groupEnd();

    // Store in error log
    storeErrorLog(errorInfo);

    // Show user-friendly message
    showErrorUI(errorInfo);

    // In production, send to error tracking service
    // sendToErrorTracking(errorInfo);
}

// Parse error into structured format
function parseError(error) {
    if (error instanceof AppError) {
        return {
            type: error.type,
            message: error.message,
            details: error.details,
            stack: error.stack,
            timestamp: error.timestamp
        };
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
            type: ErrorTypes.NETWORK,
            message: 'Erro de conexão. Verifique sua internet.',
            details: { original: error.message },
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
    }

    // Storage errors
    if (error.name === 'QuotaExceededError') {
        return {
            type: ErrorTypes.STORAGE,
            message: 'Espaço de armazenamento esgotado.',
            details: {},
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
    }

    // Default
    return {
        type: ErrorTypes.UNKNOWN,
        message: error.message || 'Ocorreu um erro inesperado.',
        details: { name: error.name },
        stack: error.stack,
        timestamp: new Date().toISOString()
    };
}

// Store error in local storage for debugging
function storeErrorLog(errorInfo) {
    try {
        const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
        logs.push({
            ...errorInfo,
            url: window.location.href,
            userAgent: navigator.userAgent
        });

        // Keep only last 50 errors
        if (logs.length > 50) {
            logs.splice(0, logs.length - 50);
        }

        localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
        console.warn('Could not store error log:', e);
    }
}

// Show user-friendly error UI
function showErrorUI(errorInfo) {
    // Import toast dynamically to avoid circular deps
    const container = document.getElementById('toast-container');
    if (!container) return;

    const messages = {
        [ErrorTypes.NETWORK]: {
            title: 'Sem conexão',
            message: 'Verifique sua internet e tente novamente.'
        },
        [ErrorTypes.VALIDATION]: {
            title: 'Dados inválidos',
            message: errorInfo.message
        },
        [ErrorTypes.AUTH]: {
            title: 'Sessão expirada',
            message: 'Por favor, faça login novamente.'
        },
        [ErrorTypes.NOT_FOUND]: {
            title: 'Não encontrado',
            message: 'O recurso solicitado não existe.'
        },
        [ErrorTypes.PERMISSION]: {
            title: 'Acesso negado',
            message: 'Você não tem permissão para esta ação.'
        },
        [ErrorTypes.STORAGE]: {
            title: 'Armazenamento cheio',
            message: 'Limpe o cache do navegador.'
        },
        [ErrorTypes.UNKNOWN]: {
            title: 'Erro',
            message: 'Algo deu errado. Tente novamente.'
        }
    };

    const msg = messages[errorInfo.type] || messages[ErrorTypes.UNKNOWN];

    const toast = document.createElement('div');
    toast.className = 'toast toast--error';
    toast.innerHTML = `
    <svg class="toast__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
    <div class="toast__content">
      <div class="toast__title">${msg.title}</div>
      <div class="toast__message">${msg.message}</div>
    </div>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toast-out 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Try-catch wrapper for async functions
export function withErrorBoundary(fn, fallback = null) {
    return async function (...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            handleError(error, 'wrapped');
            return fallback;
        }
    };
}

// Safe JSON parse
export function safeJSONParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
}

// Safe localStorage access
export const safeStorage = {
    get(key, fallback = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage error:', e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    }
};

// Get stored error logs
export function getErrorLogs() {
    return safeStorage.get('error_logs', []);
}

// Clear error logs
export function clearErrorLogs() {
    return safeStorage.remove('error_logs');
}

// Report error to external service (placeholder)
export async function reportError(errorInfo, context = {}) {
    // In production, send to Sentry, LogRocket, etc.
    console.log('[Error Reporter] Would send to tracking service:', {
        ...errorInfo,
        context
    });
}
