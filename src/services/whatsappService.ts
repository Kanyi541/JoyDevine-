import { AutoPart } from '../types';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

export const PRIMARY_WHATSAPP_PHONE = '254111871428';
export const PRIMARY_PHONE_DISPLAY = '0111 871 428';
export const PRIMARY_PHONE_TEL = '+254111871428';

export const SECONDARY_PHONE_1_DISPLAY = '0720 357 361';
export const SECONDARY_PHONE_1_TEL = '+254720357361';

export const SECONDARY_PHONE_2_DISPLAY = '0722 604 419';
export const SECONDARY_PHONE_2_TEL = '+254722604419';

export const STORE_LOCATION_TEXT = 'Room B13, Kirinyaga Crescent, opposite Seventies Plaza, Nairobi';

/**
 * Get a public, crawler-accessible image URL for WhatsApp link unfurling.
 * WhatsApp requires a publicly accessible HTTP/HTTPS URL at the start of the message
 * to render the rich visual image preview card above the message.
 */
/**
 * Get a public, crawler-accessible image URL for WhatsApp link unfurling.
 */
export function getPublicImageUrlForWhatsApp(imageUrl?: string, category?: string, ybNo?: string): string {
  const trimmedImageUrl = imageUrl?.trim();
  // 1. If it's already an absolute URL (e.g. from Firebase), return it.
  if (trimmedImageUrl && (trimmedImageUrl.startsWith('http://') || trimmedImageUrl.startsWith('https://'))) {
    // Generate a short slug
    const slug = Math.random().toString(36).substring(7);
    setDoc(doc(db, 'urlRedirects', slug), { longUrl: trimmedImageUrl, createdAt: new Date().toISOString() }).catch(console.error);
    return `https://joydevineautospares.vercel.app/i/${slug}`;
  }
  
  // 2. Otherwise, construct it as an absolute URL on our domain.
  // If no imageUrl, fallback to category image.
  const categoryFallbackMap: Record<string, string> = {
    'Wheel Cylinders & Calipers': '/productimg/brake-wheel-cylinder.jpg',
    'Master Cylinders': '/productimg/brake-master-cylinder.jpg',
    'Hoses & Hydraulic Lines': '/productimg/brake-hose-flexible.jpg',
    'Shock Boots & Gaiters': '/productimg/shock-boot-dust-cover.jpg',
    'Cables & Linkages': ybNo?.includes('78180')
      ? '/productimg/accelerator-cable.jpg'
      : '/productimg/handbrake-cable.jpg',
  };

  let path = trimmedImageUrl || categoryFallbackMap[category || ''] || '';
  if (!path) return '';

  // Clean the path to ensure it starts with /productimg/
  // Remove any existing /productsimg/ or /productimg/ to avoid double-prefixing
  path = path.replace(/^\/(productsimg|productimg)\//, '');
  return `https://joydevineautospares.vercel.app/productimg/${path.startsWith('/') ? path.substring(1) : path}`;
}

/**
 * Construct WhatsApp Order Link for a single auto part.
 * Places the product photo URL on line 1 so WhatsApp crawler immediately unfurls
 * the product image preview card, followed by the complete order inquiry.
 */
export function buildWhatsAppPartOrderUrl(part: AutoPart): string {
  const photoUrl = getPublicImageUrlForWhatsApp(part.imageUrl, part.category, part.ybNo);

  const lines = [
    // 1. Photo URL first so WhatsApp unfurls image preview
    photoUrl,
    '',
    `*ORDER INQUIRY - JOYDIVINE AUTO SPARES*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `• *Item:* ${part.itemName}`,
    `• *YB Number:* ${part.ybNo}`,
    `• *Part Number:* ${part.oem}`,
    `• *Price:* KES ${part.priceKes.toLocaleString()}`,
    part.des ? `• *Application:* ${part.des}` : '',
    `• *Condition:* ${part.condition || 'Brand New'}`,
    `• *Location:* Kirinyaga Crescent, opposite Seventies Plaza (Room B13), Nairobi`,
    `• *Photo:* ${photoUrl}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Hello JoyDivine Auto Spares, I would like to order this spare part. Please confirm stock availability and M-Pesa till / dispatch details.`
  ].filter(Boolean);

  const messageText = lines.join('\n');
  return `https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Construct WhatsApp Order Link for customer shopping cart.
 * Places the primary item's photo on line 1 so WhatsApp unfurls the product preview.
 */
export function buildWhatsAppCartOrderUrl(
  items: { part: AutoPart; quantity: number }[],
  options: {
    reservationCode: string;
    fulfillment: 'pickup' | 'delivery-cbd' | 'delivery-upcountry';
    itemsSubtotalKes: number;
    deliveryFeeKes: number;
    grandTotalKes: number;
  }
): string {
  if (items.length === 0) {
    return `https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent(
      'Hello JoyDivine Auto Spares, I would like to inquire about spare parts availability at Kirinyaga Crescent, opposite Seventies Plaza.'
    )}`;
  }

  // Primary item image at top for WhatsApp preview
  const firstPhotoUrl = getPublicImageUrlForWhatsApp(
    items[0].part.imageUrl,
    items[0].part.category,
    items[0].part.ybNo
  );

  const fulfillmentTitle =
    options.fulfillment === 'pickup'
      ? 'Counter Pickup (Room B13, Kirinyaga Crescent, opposite Seventies Plaza)'
      : options.fulfillment === 'delivery-cbd'
      ? 'Nairobi CBD Boda / Rider Dispatch (+KES 300)'
      : 'Countrywide Parcel Dispatch (+KES 500)';

  const lines: string[] = [
    firstPhotoUrl,
    '',
    `*NEW ORDER RESERVATION - JOYDIVINE AUTO SPARES*`,
    `*Order Ref:* ${options.reservationCode}`,
    `*Fulfillment:* ${fulfillmentTitle}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*ORDERED ITEMS:*`
  ];

  items.forEach((item, index) => {
    const itemPhoto = getPublicImageUrlForWhatsApp(item.part.imageUrl, item.part.category, item.part.ybNo);
    lines.push(
      `${index + 1}. *${item.part.itemName}*`,
      `   • YB No: ${item.part.ybNo} | Part Number: ${item.part.oem}`,
      `   • Qty: ${item.quantity} x KES ${item.part.priceKes.toLocaleString()} = KES ${(
        item.part.priceKes * item.quantity
      ).toLocaleString()}`,
      `   • Photo: ${itemPhoto}`
    );
  });

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*Items Subtotal:* KES ${options.itemsSubtotalKes.toLocaleString()}`
  );

  if (options.deliveryFeeKes > 0) {
    lines.push(`*Delivery Fee:* KES ${options.deliveryFeeKes.toLocaleString()}`);
  }

  lines.push(
    `*GRAND TOTAL:* KES ${options.grandTotalKes.toLocaleString()}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Hello JoyDivine Auto Spares, please verify stock at Room B13, Kirinyaga Crescent (opposite Seventies Plaza) and provide M-Pesa payment till for this order.`
  );

  return `https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`;
}
