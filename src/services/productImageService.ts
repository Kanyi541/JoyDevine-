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
 * Upload or process a local device image for Firebase Storage
 */
export async function uploadProductImage(file: File): Promise<{ url: string; filename: string; diagnostic?: ImageProcessingResult }> {
  const processed = await compressLocalImageForDatabase(file);
  
  // Upload to storage
  const storagePath = `parts/${Date.now()}_${file.name}`;
  const publicUrl = await uploadToFirebaseStorage(processed.url, storagePath);
  
  return {
    url: publicUrl,
    filename: file.name,
    diagnostic: processed,
  };
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
 */
export function formatImageUrlForWhatsApp(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Base64 images are no longer used for storage, so this fallback can be simplified
  return '';
}
