/**
 * Product Image Management Service
 * Supports direct local image file compression for Firestore database synchronization,
 * bundled /productsimg/ library references, and formatting for WhatsApp.
 */

export interface ProductImageItem {
  filename: string;
  url: string;
}

export interface ImageProcessingResult {
  url: string;
  filename: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
  isDatabaseReady: boolean;
}

export const PRESET_PRODUCT_IMAGES: ProductImageItem[] = [
  { filename: 'brake-wheel-cylinder.jpg', url: '/productsimg/brake-wheel-cylinder.jpg' },
  { filename: 'brake-master-cylinder.jpg', url: '/productsimg/brake-master-cylinder.jpg' },
  { filename: 'clutch-master-cylinder.jpg', url: '/productsimg/clutch-master-cylinder.jpg' },
  { filename: 'brake-hose-flexible.jpg', url: '/productsimg/brake-hose-flexible.jpg' },
  { filename: 'shock-boot-dust-cover.jpg', url: '/productsimg/shock-boot-dust-cover.jpg' },
  { filename: 'handbrake-cable.jpg', url: '/productsimg/handbrake-cable.jpg' },
  { filename: 'accelerator-cable.jpg', url: '/productsimg/accelerator-cable.jpg' },
  { filename: 'clutch-slave-cylinder.jpg', url: '/productsimg/clutch-slave-cylinder.jpg' },
];

/**
 * Automatically compress and optimize any local image file from the device (phone camera, gallery, PC)
 * into a lightweight Base64 string (< 60KB) that syncs directly into Google Cloud Firestore documents.
 * 
 * Firestore documents have a strict 1MB limit. Raw photos (3MB-10MB) will cause Firestore to reject
 * the write with "Document exceeds maximum size". By compressing locally to 650px at 0.75 quality,
 * the file becomes ~35KB-50KB with pristine clarity for spare parts, enabling direct database storage.
 */
export async function compressLocalImageForDatabase(
  file: File,
  maxDimension = 700,
  quality = 0.78
): Promise<ImageProcessingResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image. Please pick a JPG, PNG, or WebP photo.'));
    }

    const originalSizeKb = Math.round(file.size / 1024);
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Scale proportionally if larger than maximum dimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not initialize image processing canvas.'));
        }

        // Clean white background for transparency handling
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG format
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const compressedSizeKb = Math.round((compressedBase64.length * 3) / 4 / 1024);

        resolve({
          url: compressedBase64,
          filename: file.name,
          originalSizeKb,
          compressedSizeKb,
          width,
          height,
          isDatabaseReady: compressedSizeKb < 300, // Well within Firestore 1024KB limit
        });
      };

      img.onerror = () => reject(new Error('Failed to decode the chosen photo. Please try a different image.'));
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed reading file from your device.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload or process a local device image for direct database synchronization
 */
export async function uploadProductImage(file: File): Promise<{ url: string; filename: string; diagnostic?: ImageProcessingResult }> {
  const processed = await compressLocalImageForDatabase(file);
  return {
    url: processed.url,
    filename: processed.filename,
    diagnostic: processed,
  };
}

/**
 * Determine the storage type of an image
 */
export function getImageSourceType(url: string): 'DIRECT_DATABASE' | 'LOCAL_PRESET' | 'WEB_URL' | 'NONE' {
  if (!url) return 'NONE';
  if (url.startsWith('data:image/')) return 'DIRECT_DATABASE';
  if (url.startsWith('/productsimg/')) return 'LOCAL_PRESET';
  if (url.startsWith('http://') || url.startsWith('https://')) return 'WEB_URL';
  return 'LOCAL_PRESET';
}

/**
 * List available images stored in productsimg
 */
export async function fetchAvailableProductImages(): Promise<ProductImageItem[]> {
  try {
    const res = await fetch('/api/list-product-images');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.images) && data.images.length > 0) {
        return data.images;
      }
    }
  } catch {
    // ignore and return defaults
  }
  return PRESET_PRODUCT_IMAGES;
}

/**
 * Format image URL for WhatsApp link.
 * WhatsApp requires absolute URLs (starting with http/https) to unfurl and display image previews.
 */
export function formatImageUrlForWhatsApp(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('data:')) {
    return 'Direct counter photo attached in catalog';
  }
  try {
    const origin = window.location.origin;
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${origin}${cleanPath}`;
  } catch {
    return imageUrl;
  }
}
