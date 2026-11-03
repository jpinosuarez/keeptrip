let imageCompressionLoader;

const getImageCompression = async () => {
  imageCompressionLoader ||= import('browser-image-compression').then((mod) => mod.default);
  return imageCompressionLoader;
};

/** Hard limit: reject files over 15 MB to prevent mobile memory crashes. */
export const MAX_FILE_SIZE = 15 * 1024 * 1024;

/** Strict upper bound for image compression; after this we fall back to the original file. */
export const IMAGE_COMPRESSION_TIMEOUT_MS = 8000;

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });

/**
 * Resolves with `fallbackValue` if `promise` does not settle within `ms`.
 * Prevents the "Optimizando..." UI from hanging forever.
 */
const withTimeout = (promise, ms, fallbackValue) => {
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(fallbackValue), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

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

  // Fallback target: never let a hung/failed compression block the upload.
  let target = file;

  try {
    const imageCompression = await getImageCompression();
    const compressed = await withTimeout(
      imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: maxWidth,
        initialQuality: quality,
        useWebWorker: true,
        fileType: 'image/jpeg',
        onProgress,
      }),
      IMAGE_COMPRESSION_TIMEOUT_MS,
      null
    );

    if (compressed instanceof Blob) {
      target = compressed;
    }
  } catch {
    // Compression threw (worker crash, unsupported codec, etc.) → use original.
    target = file;
  }

  const dataUrl = await readFileAsDataURL(target);

  return {
    blob: target,
    dataUrl,
    size: target.size,
  };
};

