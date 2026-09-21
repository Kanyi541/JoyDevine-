import React, { useEffect } from 'react';
import { AutoPart } from '../types';
import { PRIMARY_PHONE_TEL, PRIMARY_PHONE_DISPLAY } from '../services/whatsappService';

interface SeoStructuredDataProps {
  parts: AutoPart[];
  selectedCategory?: string;
  searchQuery?: string;
}

/**
 * Injects dynamic Schema.org JSON-LD structured data for Google, Bing, 
 * and AI search engines (Perplexity, ChatGPT Search, Gemini, Claude, Copilot).
 * Incorporates all database spare parts into structured ItemList and Product entities.
 */
export const SeoStructuredData: React.FC<SeoStructuredDataProps> = ({
  parts,
  selectedCategory = 'All Parts',
  searchQuery = '',
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Dynamic Page Title & Meta Description based on inventory
    const totalCount = parts.length;
    const categoryText = selectedCategory !== 'All Parts' ? ` - ${selectedCategory}` : '';
    
    if (searchQuery) {
      document.title = `Search: "${searchQuery}" | JoyDivine Auto Spares Kirinyaga Crescent Nairobi`;
    } else if (selectedCategory !== 'All Parts') {
      document.title = `${selectedCategory} in Nairobi | JoyDivine Auto Spares (Room B13)`;
    } else {
      document.title = `JoyDivine Auto Spares | Kirinyaga Crescent, Nairobi | Genuine Parts (${totalCount}+ Items In Stock)`;
    }

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const sampleCategories = Array.from(new Set(parts.map(p => p.category))).slice(0, 4).join(', ');
    metaDesc.setAttribute(
      'content',
      `JoyDivine Auto Spares (Room B13, Kirinyaga Crescent, opp. Seventies Plaza, Nairobi). ${totalCount}+ genuine auto parts in stock including ${sampleCategories}. Call ${PRIMARY_PHONE_DISPLAY} for counter pickup or countrywide garage delivery.`
    );

    // 2. Build Schema.org ItemList with every Product in the database
    const productItems = parts.slice(0, 150).map((part, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `https://joydivineautospares.co.ke/parts#${part.id}`,
        name: part.itemName,
        sku: part.ybNo,
        mpn: part.oem,
        image: part.imageUrl || undefined,
        description: `${part.itemName} (${part.des}). Part Number: ${part.ybNo}, OEM Code: ${part.oem}. Genuine auto spare part available at JoyDivine Auto Spares, Kirinyaga Crescent, Nairobi.`,
        category: part.category,
        brand: {
          '@type': 'Brand',
          name: part.brand || 'JoyDivine Genuine Parts',
        },
        offers: {
          '@type': 'Offer',
          url: `https://joydivineautospares.co.ke/?part=${encodeURIComponent(part.ybNo)}`,
          priceCurrency: 'KES',
          price: part.priceKes,
          priceValidUntil: '2027-12-31',
          availability: part.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'AutoPartsStore',
            name: 'JoyDivine Auto Spares',
            telephone: PRIMARY_PHONE_TEL,
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Room B13, Kirinyaga Crescent, opposite Seventies Plaza',
              addressLocality: 'Nairobi',
              addressRegion: 'Nairobi County',
              addressCountry: 'KE',
            },
          },
        },
      },
    }));

    const catalogSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'JoyDivine Auto Spares - Live Kirinyaga Road Parts Inventory',
      description: 'Complete stock catalog of genuine brake wheel cylinders, master cylinders, clutch kits, and automotive hydraulic parts at Room B13 Kirinyaga Crescent, Nairobi.',
      numberOfItems: parts.length,
      itemListElement: productItems,
    };

    // Inject or update catalog script
    let catalogScript = document.getElementById('schema-dynamic-catalog') as HTMLScriptElement | null;
    if (!catalogScript) {
      catalogScript = document.createElement('script');
      catalogScript.id = 'schema-dynamic-catalog';
      catalogScript.type = 'application/ld+json';
      document.head.appendChild(catalogScript);
    }
    catalogScript.textContent = JSON.stringify(catalogSchema);

    // 3. Google BreadcrumbList Schema
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://joydivineautospares.co.ke/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Auto Spares Nairobi',
          item: 'https://joydivineautospares.co.ke/#catalog',
        },
        ...(selectedCategory !== 'All Parts'
          ? [
              {
                '@type': 'ListItem',
                position: 3,
                name: selectedCategory,
                item: `https://joydivineautospares.co.ke/?category=${encodeURIComponent(selectedCategory)}`,
              },
            ]
          : []),
      ],
    };

    let breadcrumbScript = document.getElementById('schema-dynamic-breadcrumbs') as HTMLScriptElement | null;
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'schema-dynamic-breadcrumbs';
      breadcrumbScript.type = 'application/ld+json';
      document.head.appendChild(breadcrumbScript);
    }
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);

    // 4. Schema.org FAQPage for Google & AI Search Assistants
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Where is JoyDivine Auto Spares located in Nairobi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'JoyDivine Auto Spares is located in Room B13, Kirinyaga Crescent, directly opposite Seventies Plaza in the Kirinyaga Road auto spares district, Nairobi CBD, Kenya.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I check if a spare part fits my car or verify OEM numbers?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can verify fitment by searching your OEM part code or YB number on our website, or by sending your vehicle model, chassis number, or sample part photo on WhatsApp to 0111 871 428 (+254 111 871 428). Our counter technicians verify fitment within 5 minutes.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do you deliver spare parts outside Nairobi?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! We provide same-day courier and bus parcel dispatch to garages across Kenya via 2NK, Easy Coach, North Rift, Modern Coast, Mash, and courier riders to towns including Mombasa, Nakuru, Kisumu, Eldoret, Thika, Nyeri, and Meru.',
          },
        },
        {
          '@type': 'Question',
          name: 'What types of auto spares does JoyDivine specialize in?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'JoyDivine Auto Spares specializes in brake wheel cylinders, brake master cylinders, clutch master and slave cylinders, hydraulic brake hoses, shock absorber boots/bellows, and automotive control cables for Toyota, Nissan, Isuzu, Mazda, Mitsubishi, and Subaru vehicles.',
          },
        },
        {
          '@type': 'Question',
          name: 'What payment methods do you accept at the counter and for delivery?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We accept M-Pesa (Buy Goods Till / Paybill) and Cash at our Room B13 counter. For parcel dispatches, customers pay securely via M-Pesa upon parcel booking.',
          },
        },
      ],
    };

    let faqScript = document.getElementById('schema-dynamic-faq') as HTMLScriptElement | null;
    if (!faqScript) {
      faqScript = document.createElement('script');
      faqScript.id = 'schema-dynamic-faq';
      faqScript.type = 'application/ld+json';
      document.head.appendChild(faqScript);
    }
    faqScript.textContent = JSON.stringify(faqSchema);

    // 5. Update Canonical Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = window.location.origin + window.location.pathname;

  }, [parts, selectedCategory, searchQuery]);

  return null;
};
