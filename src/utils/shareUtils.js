import domtoimage from 'dom-to-image-more';
import { logger } from './logger';

/**
 * Captura un nodo DOM como PNG Blob (para IG Stories / compartir).
 * @param {HTMLElement} node
 * @param {{ width?: number, height?: number, scale?: number }} opts
 * @returns {Promise<Blob>}
 */
export const captureNodeAsPng = async (node, { width = 1080, height = 1920, scale = 1 } = {}) => {
  if (!node) throw new Error('No node provided for capture');

  try {
    const blob = await domtoimage.toBlob(node.firstElementChild || node, {
      width,
      height,
      style: {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      },
      quality: 0.95,
    });

    return blob;
  } catch (err) {
    // Graceful degradation: if canvas is tainted (CORS) or capture fails,
    // generate a minimal fallback image with just the gradient + text.
    logger.warn('DOM capture failed, generating fallback image', err);
    return generateFallbackBlob(width, height);
  }
};

/**
 * Fallback: renders a branded gradient card when DOM capture fails (e.g. CORS taint).
 * @param {number} w
 * @param {number} h
 * @returns {Promise<Blob>}
 */
const generateFallbackBlob = (w, h) =>
  new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#2C3E50');
    grad.addColorStop(1, '#0f766e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Branding text
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KEEPTRIP', w / 2, h / 2 - 20);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('No se pudo generar la imagen completa', w / 2, h / 2 + 30);

    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });

/**
 * Convierte un Blob a un File (necesario para Web Share API).
 * @param {Blob} blob
 * @param {string} filename
 * @returns {File}
 */
const blobToFile = (blob, filename = 'keeptrip-story.png') =>
  new File([blob], filename, { type: blob.type || 'image/png' });

/**
 * Comparte una imagen usando Web Share API (mobile) o descarga (desktop fallback).
 * @param {Blob} blob - PNG blob
 * @param {{ title?: string, text?: string }} opts
 * @returns {Promise<'shared'|'downloaded'|'dismissed'>}
 */
export const shareImage = async (blob, { title = 'Mi viaje — Keeptrip', text = '' } = {}) => {
  const file = blobToFile(blob);

  // Web Share API con soporte para archivos (mobile Chrome, Safari)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: text || 'Mirá mi viaje en Keeptrip ✈️',
        files: [file],
      });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'dismissed';
      logger.warn('Web Share failed, falling back to download', err);
    }
  }

  // Fallback: descarga directa
  downloadBlob(blob, 'keeptrip-story.png');
  return 'downloaded';
};

/**
 * Descarga un blob como archivo.
 * @param {Blob} blob
 * @param {string} filename
 */
export const downloadBlob = (blob, filename = 'keeptrip-story.png') => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};
