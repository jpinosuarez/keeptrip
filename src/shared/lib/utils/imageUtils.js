import imageCompression from 'browser-image-compression';

/** Hard limit: reject files over 15 MB to prevent mobile memory crashes. */
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });

/**
 * Compress an image off the main thread via browser-image-compression (Web Worker).
 * Returns { blob, dataUrl, size }.
 *
 * @param {File|Blob} file      — source image
 * @param {number}    maxWidth  — max width in px (default 1920)
 * @param {number}    quality   — initial JPEG quality 0–1 (default 0.8)
 * @param {function}  onProgress — optional callback (0–100)
 */
export const compressImage = async (file, maxWidth = 1920, quality = 0.8, onProgress) => {
  if (!(file instanceof File || file instanceof Blob)) {
    throw new Error('El archivo de imagen no es valido.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo supera el límite de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.`);
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: maxWidth,
    initialQuality: quality,
    useWebWorker: true,
    fileType: 'image/jpeg',
    onProgress,
  });

  const dataUrl = await readFileAsDataURL(compressed);

  return {
    blob: compressed,
    dataUrl,
    size: compressed.size,
  };
};

