/**
 * Compress an image file before upload.
 * Resizes to maxWidth and compresses to target quality.
 * Returns a new File object.
 */
export default function compressImage(file, { maxWidth = 1920, quality = 0.8 } = {}) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Keep small JPEGs as-is, but convert iPhone HEIC/HEIF and other image types to JPEG.
      if (file.type === 'image/jpeg' && img.width <= maxWidth && file.size <= 2 * 1024 * 1024) {
        resolve(file);
        return;
      }

      const ratio = Math.min(1, maxWidth / img.width);
      const width = Math.round(img.width * ratio);
      const height = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const jpegName = file.name.replace(/\.[^.]+$/, '') || 'image';
          const compressed = new File([blob], `${jpegName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
