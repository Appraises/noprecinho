/**
 * Push Notifications Client
 * Handles subscription, alerts, and notification display
 */

import { api } from './api.js';

let vapidPublicKey = null;
let pushSubscription = null;

/**
 * Initialize push notifications
 */
export async function initPushNotifications() {
    // Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported');
        return false;
    }

    try {
        // Get VAPID key from server
        const response = await api.getPushVapidKey();
        vapidPublicKey = response.publicKey;

        // Check current subscription
        const registration = await navigator.serviceWorker.ready;
        pushSubscription = await registration.pushManager.getSubscription();

        return true;
    } catch (error) {
        console.error('Push init error:', error);
        return false;
    }
}

/**
 * Check if user is subscribed to push notifications
 */
export function isSubscribed() {
    return pushSubscription !== null;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush() {
    if (!vapidPublicKey) {
        throw new Error('VAPID key not available');
    }

    try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Notificações não permitidas');
        }

        // Subscribe to push
        const registration = await navigator.serviceWorker.ready;
        pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Send subscription to server
        const keys = pushSubscription.toJSON().keys;
        await api.subscribeToPush({
            endpoint: pushSubscription.endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth
        });

        console.log('✅ Push subscription created');
        return true;
    } catch (error) {
        console.error('Push subscribe error:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
    if (!pushSubscription) return;

    try {
        await api.unsubscribeFromPush(pushSubscription.endpoint);
        await pushSubscription.unsubscribe();
        pushSubscription = null;
        console.log('✅ Push subscription removed');
        return true;
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        throw error;
    }
}

/**
 * Create a price alert
 * @param {string} productName 
 * @param {number} targetPrice 
 * @param {string} storeId - Optional
 */
export async function createPriceAlert(productName, targetPrice, storeId = null) {
    if (!isSubscribed()) {
        await subscribeToPush();
    }

    return api.createPriceAlert({
        productName,
        targetPrice,
        storeId
    });
}

/**
 * Get user's price alerts
 */
export async function getPriceAlerts() {
    return api.getPriceAlerts();
}

/**
 * Delete a price alert
 * @param {string} alertId 
 */
export async function deletePriceAlert(alertId) {
    return api.deletePriceAlert(alertId);
}

/**
 * Show notification permission prompt
 */
export function showNotificationPrompt() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-overlay--visible';
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal__header">
                <h2 class="modal__title">🔔 Notificações</h2>
                <button class="modal__close" id="notif-close">&times;</button>
            </div>
            <div class="modal__body">
                <p style="margin-bottom: 1rem;">Receba alertas quando os preços dos produtos que você acompanha baixarem!</p>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn--primary" id="notif-allow" style="flex:1">Permitir</button>
                    <button class="btn btn--secondary" id="notif-deny" style="flex:1">Agora não</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    return new Promise((resolve) => {
        modal.querySelector('#notif-close').onclick = () => {
            modal.remove();
            resolve(false);
        };
        modal.querySelector('#notif-deny').onclick = () => {
            modal.remove();
            resolve(false);
        };
        modal.querySelector('#notif-allow').onclick = async () => {
            modal.remove();
            try {
                await subscribeToPush();
                resolve(true);
            } catch (e) {
                resolve(false);
            }
        };
    });
}

/**
 * Convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
