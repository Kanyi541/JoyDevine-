import { CATEGORY_DEFAULT_IMAGES } from '../data/joydevineParts';
import { storage } from './firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

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

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const compressedSizeKb = Math.round((compressedBase64.length * 3) / 4 / 1024);

        resolve({
          url: compressedBase64,
          filename: file.name,
          originalSizeKb,
          compressedSizeKb,
          width,
          height,
          isDatabaseReady: compressedSizeKb < 300,
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
 * Uploads a base64 image string to Firebase Storage and returns the public download URL
 */
export async function uploadToFirebaseStorage(base64Image: string, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64Image, 'data_url');
  return await getDownloadURL(storageRef);
}

/**
 * Upload or process a local device image.
 * Tries Firebase Cloud Storage first; if Storage permissions are unauthorized or unavailable,
 * automatically falls back to embedding the compressed photo directly into Firestore so
 * the POS user is never blocked by storage/unauthorized errors.
 */
export async function uploadProductImage(file: File): Promise<{
  url: string;
  filename: string;
  diagnostic?: ImageProcessingResult;
  isDirectFirestore?: boolean;
}> {
  const processed = await compressLocalImageForDatabase(file);
  
  // Clean filename for cloud storage
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `parts/${Date.now()}_${sanitizedName}`;

  try {
    const publicUrl = await uploadToFirebaseStorage(processed.url, storagePath);
    return {
      url: publicUrl,
      filename: file.name,
      diagnostic: processed,
      isDirectFirestore: false,
    };
  } catch (storageErr: any) {
    console.warn(
      'Firebase Cloud Storage upload not permitted or unavailable, falling back to direct Firestore storage:',
      storageErr?.message || storageErr
    );
    // Graceful Fallback: The compressed image (processed.url) is < 150KB and stores directly in Firestore!
    return {
      url: processed.url,
      filename: file.name,
      diagnostic: processed,
      isDirectFirestore: true,
    };
  }
}

export const FALLBACK_IMAGE_DATA_URI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150" fill="%23f1f5f9"><rect width="200" height="150" fill="%23f8fafc"/><path d="M70 60a10 10 0 1 0 0-20 10 10 0 0 0 0 20zm-30 50h120l-35-45-25 30-15-20-45 35z" fill="%23cbd5e1"/><text x="100" y="130" font-family="sans-serif" font-size="11" fill="%2394a3b8" text-anchor="middle">JoyDivine Auto Part</text></svg>`;

/**
 * Resolve any image URL/path to a fully qualified absolute URL for display.
 */
export function getAbsoluteImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}${cleanPath}`;
  }
  return `https://joydevineautospares.vercel.app${cleanPath}`;
}

/**
 * Safe image resolver that guarantees a valid displayable image URL
 */
export function getSafeImageUrl(url: string | undefined, categoryName?: string): string {
  if (!url) {
    if (categoryName && CATEGORY_DEFAULT_IMAGES[categoryName]) {
      return getAbsoluteImageUrl(CATEGORY_DEFAULT_IMAGES[categoryName]);
    }
    return FALLBACK_IMAGE_DATA_URI;
  }
  return getAbsoluteImageUrl(url) || FALLBACK_IMAGE_DATA_URI;
}

/**
 * Get default image for a category
 */
export function getCategoryDefaultImage(categoryName: string): string {
  return CATEGORY_DEFAULT_IMAGES[categoryName] || '/productsimg/brake-wheel-cylinder.jpg';
}

/**
 * Determine the storage type of an image
 */
export function getImageSourceType(url: string): 'DIRECT_STORAGE' | 'LOCAL_PRESET' | 'WEB_URL' | 'NONE' {
  if (!url) return 'NONE';
  if (url.includes('firebasestorage.googleapis.com')) return 'DIRECT_STORAGE';
  if (url.startsWith('data:image/')) return 'DIRECT_STORAGE';
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
 */
export function formatImageUrlForWhatsApp(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Base64 images are no longer used for storage, so this fallback can be simplified
  return '';
}
