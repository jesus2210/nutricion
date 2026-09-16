// LAYER: Interface
// Utilidad para compresión automática de fotos en el navegador antes de subida a Supabase

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatioPct: number;
}

export async function compressProgressPhoto(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1600,
  quality: number = 0.82
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('No se pudo crear contexto de canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Exportar como WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al comprimir la imagen'));
              return;
            }

            const compressedFile = new File([blob], `${file.name.replace(/\.[^/.]+$/, '')}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            const originalSizeBytes = file.size;
            const compressedSizeBytes = compressedFile.size;
            const savings = Math.max(0, Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100));

            resolve({
              file: compressedFile,
              previewUrl: URL.createObjectURL(blob),
              originalSizeBytes,
              compressedSizeBytes,
              compressionRatioPct: savings,
            });
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
