/**
 * Photo Upload with OCR Component
 * Handles receipt/price tag photo uploads with text extraction
 */

import { api } from '../api.js';

// Tesseract.js CDN
const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

let tesseractWorker = null;

/**
 * Load Tesseract.js dynamically
 */
async function loadTesseract() {
    if (window.Tesseract) return window.Tesseract;

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = TESSERACT_CDN;
        script.onload = () => resolve(window.Tesseract);
        script.onerror = () => reject(new Error('Failed to load Tesseract'));
        document.head.appendChild(script);
    });
}

/**
 * Create photo upload component
 * @param {string} containerId - Container element ID
 * @param {Function} onUploadComplete - Callback with upload result
 */
export function createPhotoUpload(containerId, onUploadComplete) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="photo-upload">
            <input type="file" id="photo-input" accept="image/*" capture="environment" hidden>
            <button type="button" class="photo-upload__button" id="photo-trigger">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                </svg>
                <span>Adicionar Foto</span>
            </button>
            <div class="photo-upload__preview" id="photo-preview" hidden>
                <img id="preview-image" alt="Preview">
                <button type="button" class="photo-upload__remove" id="photo-remove">&times;</button>
            </div>
            <div class="photo-upload__status" id="upload-status"></div>
        </div>
    `;

    const input = container.querySelector('#photo-input');
    const trigger = container.querySelector('#photo-trigger');
    const preview = container.querySelector('#photo-preview');
    const previewImg = container.querySelector('#preview-image');
    const removeBtn = container.querySelector('#photo-remove');
    const status = container.querySelector('#upload-status');

    let currentFile = null;
    let uploadResult = null;

    trigger.onclick = () => input.click();

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        currentFile = file;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            preview.hidden = false;
            trigger.hidden = true;
        };
        reader.readAsDataURL(file);

        // Upload and OCR
        status.innerHTML = '<span class="spinner"></span> Enviando...';

        try {
            // Convert to base64
            const base64 = await fileToBase64(file);

            // Upload to server
            const upload = await api.uploadFile({
                filename: file.name,
                mimeType: file.type,
                data: base64
            });

            uploadResult = upload;
            status.textContent = '✅ Foto enviada';

            // Run OCR
            status.innerHTML = '<span class="spinner"></span> Extraindo texto...';
            const ocrResult = await runOCR(previewImg.src);

            // Save OCR result
            await api.saveOCRResult(upload.id, ocrResult);

            status.textContent = `✅ ${ocrResult.prices.length} preço(s) encontrado(s)`;

            if (onUploadComplete) {
                onUploadComplete({
                    upload: uploadResult,
                    ocr: ocrResult
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            status.textContent = '❌ Erro no upload';
        }
    };

    removeBtn.onclick = () => {
        currentFile = null;
        uploadResult = null;
        input.value = '';
        preview.hidden = true;
        trigger.hidden = false;
        status.textContent = '';
    };

    addPhotoUploadStyles();
}

/**
 * Run OCR on image
 * @param {string} imageSrc - Image source (data URL or URL)
 */
async function runOCR(imageSrc) {
    const Tesseract = await loadTesseract();

    const result = await Tesseract.recognize(imageSrc, 'por', {
        logger: m => console.log('OCR:', m.status, m.progress)
    });

    const text = result.data.text;

    // Extract prices using regex
    const pricePattern = /R?\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/gi;
    const matches = [...text.matchAll(pricePattern)];

    const prices = matches.map(match => {
        const priceStr = match[1].replace(/\./g, '').replace(',', '.');
        return parseFloat(priceStr);
    }).filter(p => p > 0 && p < 10000);

    return {
        text,
        prices: [...new Set(prices)].sort((a, b) => a - b)
    };
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Add photo upload styles
 */
function addPhotoUploadStyles() {
    if (document.getElementById('photo-upload-styles')) return;

    const style = document.createElement('style');
    style.id = 'photo-upload-styles';
    style.textContent = `
        .photo-upload {
            margin: 1rem 0;
        }
        
        .photo-upload__button {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            padding: 2rem;
            border: 2px dashed var(--color-border);
            border-radius: 12px;
            background: var(--color-background);
            color: var(--color-text-secondary);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .photo-upload__button:hover {
            border-color: var(--color-primary);
            color: var(--color-primary);
        }
        
        .photo-upload__preview {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
        }
        
        .photo-upload__preview img {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 12px;
        }
        
        .photo-upload__remove {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(0,0,0,0.6);
            color: white;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .photo-upload__status {
            margin-top: 0.75rem;
            font-size: 0.875rem;
            color: var(--color-text-secondary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    `;
    document.head.appendChild(style);
}
