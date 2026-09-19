/**
 * Product Image Management Service
 * Handles uploading images directly to /public/productsimg/ and formatting URLs for WhatsApp
 */

export interface ProductImageItem {
  filename: string;
  url: string;
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
 * Upload an image file to /public/productsimg/
 */
export async function uploadProductImage(file: File): Promise<{ url: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        const response = await fetch('/api/upload-product-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            base64Data,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          resolve({
            url: result.url,
            filename: result.filename,
          });
          return;
        }

        // Fallback to base64 if server endpoint is unavailable
        resolve({
          url: base64Data,
          filename: file.name,
        });
      } catch (err) {
        // Fallback for purely client-side environment
        resolve({
          url: base64Data,
          filename: file.name,
        });
      }
    };

    reader.onerror = () => reject(new Error('Failed reading image file'));
    reader.readAsDataURL(file);
  });
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
    // Data URLs cannot be unfurled by WhatsApp crawler, but let's provide note or URL
    return 'Direct image attached in catalog';
  }
  // If relative path like /productsimg/...
  try {
    const origin = window.location.origin;
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${origin}${cleanPath}`;
  } catch {
    return imageUrl;
  }
}
