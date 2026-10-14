import React from 'react';
import { AutoPart } from '../types';
import { getSafeImageUrl } from '../services/productImageService';
import { PRIMARY_PHONE_DISPLAY, SECONDARY_PHONE_1_DISPLAY } from '../services/whatsappService';
import { ShieldCheck, GeoAlt, Telephone, BoxSeam } from 'react-bootstrap-icons';

export interface PrintableCatalogViewProps {
  parts: AutoPart[];
  allPartsCount: number;
  categoryCounts: Record<string, number>;
  selectedCategory: string;
  layoutMode: '3-col' | '2-col' | 'list';
  showPrices: boolean;
  showStock: boolean;
  groupByCategory?: boolean;
}

export const PrintableCatalogView: React.FC<PrintableCatalogViewProps> = ({
  parts,
  selectedCategory,
  layoutMode,
  showPrices,
  showStock,
  groupByCategory = true,
}) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Group parts by category if requested or if All Categories is active
  const groupedParts = React.useMemo(() => {
    if (!groupByCategory && selectedCategory !== 'All Categories') {
      return { [selectedCategory]: parts };
    }
    const map: Record<string, AutoPart[]> = {};
    parts.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [parts, groupByCategory, selectedCategory]);

  return (
    <div id="print-view-container" aria-hidden="true">
      <style>{`
        /* Screen View: Completely invisible */
        @media screen {
          #print-view-container {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }
        }

        /* Print Media Styles: Clean, full multi-page flow without clipping */
        @media print {
          /* 1. Page Geometry */
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm;
          }

          /* 2. Hide Screen-only Root Application */
          #root {
            display: none !important;
            visibility: hidden !important;
          }

          body > :not(#print-view-container) {
            display: none !important;
          }

          /* 3. Reset Body & HTML to allow infinite natural pagination */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 4. Display Print Root */
          #print-view-container {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /* 5. COVER PAGE (Page 1) */
          .booklet-cover-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 272mm !important;
            height: 272mm !important;
            max-height: 275mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 16mm 14mm !important;
            background: #0A192F !important;
            color: #ffffff !important;
            border-radius: 6px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 6. CATALOG PAGES (Pages 2+) */
          .booklet-catalog-page {
            page-break-before: always !important;
            break-before: page !important;
            padding-top: 4mm !important;
            box-sizing: border-box !important;
          }

          .booklet-running-header {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .booklet-running-footer {
            break-before: avoid !important;
            page-break-before: avoid !important;
          }

          .booklet-category-section {
            break-inside: auto !important;
            page-break-inside: auto !important;
          }

          .booklet-category-header {
            break-after: avoid !important;
            page-break-after: avoid !important;
            margin-top: 14px !important;
            margin-bottom: 8px !important;
            background: #0A192F !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 7. PRODUCT CARDS (Never split across page boundaries) */
          .booklet-card, .part-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Badges retain color in print */
          .print-badge-dark {
            background-color: #f1f5f9 !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* ========================================================= */}
      {/* PAGE 1: AUTHENTIC, ELEGANT COMMERCIAL COVER PAGE           */}
      {/* ========================================================= */}
      <div className="booklet-cover-page">
        {/* Cover Header Bar */}
        <div className="flex items-center justify-between border-b border-amber-400/40 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border-2 border-amber-400 flex items-center justify-center shadow-lg shrink-0">
              <img 
                src="/joydevine-logo.png" 
                alt="JoyDivine Auto Spares" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black block">
                GENUINE AUTOMOTIVE SPARE PARTS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-['Chivo'] uppercase tracking-tight text-white leading-tight">
                JoyDivine Auto Spares
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Kirinyaga Crescent, Nairobi • Specialists in Brake, Clutch & Hydraulics
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="px-3.5 py-1.5 bg-amber-400 text-[#0A192F] font-mono font-black text-xs rounded-lg uppercase tracking-wider shadow-xs">
              CATALOGUE {currentDate}
            </div>
            <span className="text-[10px] font-mono text-slate-300 block mt-1">Official Trade Edition</span>
          </div>
        </div>

        {/* Cover Hero Section */}
        <div className="my-auto py-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-mono font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>OEM Specification & Premium Replacement Parts</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-black font-['Chivo'] tracking-tight uppercase text-white leading-tight">
              Parts & Fitment <br />
              <span className="text-amber-400">
                Product Directory
              </span>
            </h2>

            <p className="text-sm text-slate-200 max-w-xl leading-relaxed font-light">
              Official customer and garage supply reference guide. High-durability hydraulic assemblies, cylinders, brake lines, cables, and suspension components for Japanese, European, and commercial vehicles.
            </p>
          </div>

          {/* Core Specialization Pillars (Authentic, clean catalog design) */}
          <div className="grid grid-cols-2 gap-3.5 max-w-2xl text-left">
            <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-bold font-['Chivo'] text-amber-300 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Master Cylinders</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Brake & clutch master cylinder assemblies with fluid reservoir tanks, sensors & pushrods.
              </p>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-bold font-['Chivo'] text-amber-300 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Wheel Cylinders & Calipers</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Rear brake wheel cylinders with bleeder screws, rubber cups, and front brake calipers.
              </p>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-bold font-['Chivo'] text-amber-300 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Hydraulic Hoses & Lines</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Reinforced high-pressure brake & clutch flexible hoses with precision banjo unions.
              </p>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-xl p-3.5 space-y-1">
              <div className="text-xs font-bold font-['Chivo'] text-amber-300 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Control Cables & Boots</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Handbrake, accelerator & clutch cables, shock dust boots, bellows & suspension gaiters.
              </p>
            </div>
          </div>

          {/* Genuine Supplier Guarantee Badges */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Direct Warehouse Stock
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> Garage Delivery & Dispatch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-bold">✓</span> 100% Guaranteed Fitment
            </span>
          </div>
        </div>

        {/* Cover Footer Contact Information */}
        <div className="border-t border-amber-400/30 pt-5 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <GeoAlt className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px]">Room B13, Kirinyaga Crescent, Opp. Seventies Plaza, Nairobi</span>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold text-white text-[11px]">
            <span className="flex items-center gap-1.5">
              <Telephone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{PRIMARY_PHONE_DISPLAY}</span>
            </span>
            <span>•</span>
            <span>{SECONDARY_PHONE_1_DISPLAY}</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PAGES 2+: CUSTOMER PRODUCT CATALOG PAGES                  */}
      {/* ========================================================= */}
      <div className="booklet-catalog-page">
        {/* Running Header */}
        <div className="booklet-running-header border-b-2 border-[#0A192F] pb-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/joydevine-logo.png" 
              alt="JoyDivine Logo" 
              className="w-10 h-10 object-contain rounded-full border border-slate-200 p-0.5 bg-white"
            />
            <div>
              <h2 className="text-sm font-black font-['Chivo'] tracking-tight text-[#0A192F] uppercase">
                JoyDivine Auto Spares • Official Customer Product Catalogue
              </h2>
              <p className="text-[10px] text-slate-600">
                Room B13, Kirinyaga Crescent, Nairobi • Hotline: {PRIMARY_PHONE_DISPLAY} / {SECONDARY_PHONE_1_DISPLAY}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-2.5 py-0.5 bg-[#0A192F] text-white font-mono font-bold text-[10px] rounded tracking-wider uppercase">
              CUSTOMER EDITION
            </span>
            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
              Displaying: {selectedCategory} ({parts.length} parts)
            </p>
          </div>
        </div>

        {/* If no parts match */}
        {parts.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <BoxSeam className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-bold text-base">No spare parts match this filter.</p>
          </div>
        ) : (
          /* Render by Category Groups */
          Object.entries(groupedParts).map(([categoryName, groupList]) => {
            if (!groupList || groupList.length === 0) return null;

            return (
              <div key={categoryName} className="booklet-category-section mb-6">
                {/* Category Section Banner */}
                <div className="booklet-category-header bg-[#0A192F] text-white px-3.5 py-2 rounded-lg flex items-center justify-between text-xs font-bold font-['Chivo'] tracking-wide">
                  <span className="uppercase text-amber-300 flex items-center gap-2">
                    <span>{categoryName}</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-200 font-semibold">
                    {groupList.length} {groupList.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>

                {/* Items Grid for this Category */}
                <div 
                  className={`mt-3 ${
                    layoutMode === '3-col'
                      ? 'grid grid-cols-3 gap-3'
                      : layoutMode === '2-col'
                      ? 'grid grid-cols-2 gap-3.5'
                      : 'space-y-2.5'
                  }`}
                >
                  {groupList.map((part) => {
                    const safeImage = getSafeImageUrl(part.imageUrl, part.category);

                    if (layoutMode === 'list') {
                      // Detailed List Row
                      return (
                        <div 
                          key={part.id} 
                          className="booklet-card border border-slate-200 rounded-lg p-2.5 flex items-center gap-3 bg-white"
                        >
                          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            <img 
                              src={safeImage} 
                              alt={part.itemName} 
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="print-badge-dark font-mono font-black text-[10px] px-1.5 py-0.2 rounded">
                                OEM: {part.oem}
                              </span>
                              {part.brand && (
                                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                                  {part.brand}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                              {part.itemName}
                            </h4>
                            <p className="text-[10px] text-slate-600 line-clamp-2 leading-tight">
                              {part.des}
                            </p>
                          </div>

                          {(showPrices || showStock) && (
                            <div className="text-right shrink-0 pl-3 border-l border-slate-100">
                              {showPrices && (
                                <div className="font-black text-xs text-slate-900 font-mono">
                                  KES {part.priceKes?.toLocaleString()}
                                </div>
                              )}
                              {showStock && (
                                <div className="text-[10px] font-mono text-slate-500">
                                  Stock: {part.stock}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 2-Col or 3-Col Card Layout
                    return (
                      <div 
                        key={part.id} 
                        className="booklet-card border border-slate-200 rounded-lg p-3 flex flex-col justify-between bg-white"
                      >
                        <div>
                          {/* Image Thumbnail (Clean, no category overlay) */}
                          <div className="w-full aspect-[4/3] bg-slate-50 rounded-md border border-slate-200 p-2 flex items-center justify-center mb-2 overflow-hidden">
                            <img 
                              src={safeImage} 
                              alt={part.itemName} 
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>

                          {/* Identification Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="print-badge-dark font-mono font-black text-[10px] px-1.5 py-0.2 rounded">
                              OEM: {part.oem}
                            </span>
                            {part.brand && (
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                                {part.brand}
                              </span>
                            )}
                          </div>

                          {/* Part Name */}
                          <h4 className="font-bold text-[11px] text-slate-900 leading-snug line-clamp-2">
                            {part.itemName}
                          </h4>

                          {/* Description & Vehicle Fitment */}
                          <p className="text-[10px] text-slate-600 mt-1 leading-snug line-clamp-3">
                            {part.des}
                          </p>
                        </div>

                        {/* Card Footer: Brand, Price & Stock */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-semibold truncate max-w-[80px]">
                            {part.brand || 'JoyDivine Genuine'}
                          </span>

                          <div className="text-right">
                            {showPrices && (
                              <span className="font-black text-[11px] text-[#0A192F] font-mono block">
                                KES {part.priceKes?.toLocaleString()}
                              </span>
                            )}
                            {showStock && (
                              <span className="text-[9px] font-mono text-slate-500 block">
                                Qty: {part.stock}
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {/* Running Footer */}
        <div className="booklet-running-footer border-t border-slate-300 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>JoyDivine Auto Spares • Room B13 Kirinyaga Crescent, Nairobi</span>
          <span>Hotline: {PRIMARY_PHONE_DISPLAY} • Fast Dispatch & Garage Delivery</span>
        </div>
      </div>
    </div>
  );
};
