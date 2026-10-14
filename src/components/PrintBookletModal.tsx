import React, { useState, useMemo } from 'react';
import { 
  XLg as X, 
  PrinterFill as Printer, 
  Search, 
  Filter, 
  Grid3x3Gap as Grid3, 
  Grid1x2 as Grid2, 
  ListUl as ListIcon,
  BoxSeam,
  ShieldCheck,
  GeoAlt,
  Telephone
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { getAbsoluteImageUrl, getCategoryDefaultImage } from '../services/productImageService';
import { PRIMARY_PHONE_DISPLAY, SECONDARY_PHONE_1_DISPLAY, SECONDARY_PHONE_2_DISPLAY } from '../services/whatsappService';

interface PrintBookletModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: AutoPart[];
}

export const PrintBookletModal: React.FC<PrintBookletModalProps> = ({
  isOpen,
  onClose,
  parts
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'3-col' | '2-col' | 'list'>('3-col');
  const [showPrices, setShowPrices] = useState<boolean>(true);
  const [showStock, setShowStock] = useState<boolean>(false);

  // Available unique categories from parts
  const categories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All Categories', ...Array.from(set).sort()];
  }, [parts]);

  // Category item counts for cover page summary
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    parts.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [parts]);

  // Filtered parts based on category and search query
  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return parts.filter((part) => {
      const matchCat = selectedCategory === 'All Categories' || part.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;

      const searchable = `${part.itemName} ${part.ybNo} ${part.oem} ${part.des} ${part.category} ${part.brand || ''}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [parts, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F]/80 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Scoped Print Styles: Professional multi-page layout with cover page */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-booklet-content, #print-booklet-content * {
            visibility: visible !important;
          }
          #print-booklet-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .booklet-no-print {
            display: none !important;
          }
          .booklet-cover-page {
            page-break-after: always !important;
            break-after: page !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 20mm 15mm !important;
            box-sizing: border-box !important;
            background: linear-gradient(135deg, #0A192F 0%, #132A4D 100%) !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .booklet-catalog-page {
            page-break-before: always !important;
            break-before: page !important;
            padding: 10mm 10mm !important;
          }
          .booklet-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
        }
      `}</style>

      {/* Main Modal Card */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Top Control Bar (Screen only, hidden on print) */}
        <div className="booklet-no-print bg-[#0A192F] text-white p-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Chivo'] tracking-tight flex items-center gap-2">
                <span>JoyDivine Master Parts Booklet</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/20">
                  {parts.length} total items in database
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Includes professional cover page, category breakdown, photos, OEM numbers, and vehicle compatibility.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Complete Booklet (PDF)</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Booklet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* Filter & Options Toolbar (Screen only, hidden on print) */}
        <div className="booklet-no-print bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          
          {/* Left: Category & Search */}
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All Categories' ? `All Categories (${parts.length} parts)` : `${c} (${categoryCounts[c] || 0})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by vehicle make, OEM, or YB..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* Right: Layout Modes & Display Toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* Layout Switcher */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setLayoutMode('3-col')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  layoutMode === '3-col' ? 'bg-[#0A192F] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="3 Items per row"
              >
                <Grid3 className="w-3.5 h-3.5" />
                <span>3 Columns</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('2-col')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  layoutMode === '2-col' ? 'bg-[#0A192F] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="2 Items per row"
              >
                <Grid2 className="w-3.5 h-3.5" />
                <span>2 Columns</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  layoutMode === 'list' ? 'bg-[#0A192F] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Detailed Rows List"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            {/* Checkbox Toggles */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={showPrices}
                  onChange={(e) => setShowPrices(e.target.checked)}
                  className="rounded text-blue-700"
                />
                <span>Include Prices</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={showStock}
                  onChange={(e) => setShowStock(e.target.checked)}
                  className="rounded text-blue-700"
                />
                <span>Include Stock Qty</span>
              </label>
            </div>

          </div>

        </div>

        {/* Scrollable Printable Booklet Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32 bg-slate-100 flex justify-center">
          
          {/* Printable Booklet Wrapper */}
          <div 
            id="print-booklet-content"
            className="w-full max-w-[850px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
          >
            
            {/* ========================================= */}
            {/* PAGE 1: PROFESSIONAL COVER PAGE           */}
            {/* ========================================= */}
            <div className="booklet-cover-page bg-gradient-to-br from-[#0A192F] via-[#132A4D] to-[#1E3A6B] text-white p-8 sm:p-12 flex flex-col justify-between min-h-[980px] rounded-t-xl">
              
              {/* Cover Top Header */}
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-amber-400 shadow-lg flex items-center justify-center">
                    <img 
                      src="/joydevine-logo.png" 
                      alt="JoyDivine Logo" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                      OFFICIAL PRODUCT CATALOGUE
                    </span>
                    <h2 className="text-lg font-black tracking-tight font-['Chivo'] uppercase text-white">
                      JoyDivine Auto Spares
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 bg-amber-500 text-slate-900 font-mono font-black text-xs rounded-full uppercase shadow">
                    EDITION {currentDate}
                  </span>
                </div>
              </div>

              {/* Cover Center Main Title & Branding */}
              <div className="my-auto py-12 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Nairobi's Premier Hydraulic & Brake Specialists</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-['Chivo'] tracking-tight uppercase leading-none text-white drop-shadow-md">
                  Master Parts <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                    Booklet & Reference
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-light">
                  Comprehensive stock inventory covering <strong className="text-white">Master Cylinders, Wheel Cylinders, Brake & Clutch Cables, Linkages, Hoses</strong> and precision hydraulic components for Japanese, European, and African commercial and private vehicles.
                </p>

                {/* Cover Stats Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
                  <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-amber-400 font-mono">{parts.length}</div>
                    <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Total Parts</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-blue-300 font-mono">{Object.keys(categoryCounts).length}</div>
                    <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Categories</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
                    <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Genuine OEM</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-purple-300 font-mono">24/7</div>
                    <div className="text-[11px] text-slate-300 uppercase tracking-wider font-medium">Customer Support</div>
                  </div>
                </div>

                {/* Category Summary List */}
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 max-w-xl mx-auto text-left space-y-2">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                    Catalog Table of Contents:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(categoryCounts).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between bg-white/5 px-2.5 py-1 rounded border border-white/5">
                        <span className="truncate text-slate-200">{cat}</span>
                        <span className="font-mono font-bold text-amber-300 ml-1">({count})</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Cover Bottom Footer: Location & Contact */}
              <div className="border-t border-blue-500/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <GeoAlt className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Room B13, Kirinyaga Crescent, Opp. Seventies Plaza, Nairobi</span>
                </div>
                <div className="flex items-center gap-3 font-mono font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <Telephone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{PRIMARY_PHONE_DISPLAY}</span>
                  </span>
                  <span>•</span>
                  <span>{SECONDARY_PHONE_1_DISPLAY}</span>
                </div>
              </div>

            </div>


            {/* ========================================= */}
            {/* PAGE 2+: CATALOG PAGES (All Parts & Categories) */}
            {/* ========================================= */}
            <div className="booklet-catalog-page p-6 sm:p-10 space-y-6">
              
              {/* Header for Catalog Pages */}
              <div className="border-b-2 border-[#0A192F] pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="/joydevine-logo.png" 
                    alt="JoyDivine Logo" 
                    className="w-12 h-12 object-contain rounded-full border border-slate-200 p-0.5 bg-white"
                  />
                  <div>
                    <h3 className="text-lg font-black font-['Chivo'] tracking-tight text-[#0A192F] uppercase">
                      JoyDivine Auto Spares • Inventory Catalog
                    </h3>
                    <p className="text-xs text-slate-600">
                      Room B13, Kirinyaga Crescent, Nairobi • Hotline: {PRIMARY_PHONE_DISPLAY}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 bg-[#0A192F] text-white font-mono font-bold text-xs rounded tracking-wider uppercase">
                    REFERENCE LIST
                  </span>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    Showing: {selectedCategory} ({filteredParts.length} items)
                  </p>
                </div>
              </div>

              {/* Empty State */}
              {filteredParts.length === 0 ? (
                <div className="py-20 text-center text-slate-500 space-y-2">
                  <BoxSeam className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="font-bold text-base">No spare parts match your filter.</p>
                  <p className="text-xs">Try selecting "All Categories" or clearing your search.</p>
                </div>
              ) : (
                /* Product Grid Layout */
                <div 
                  className={`grid gap-4 ${
                    layoutMode === '3-col' 
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' 
                      : layoutMode === '2-col' 
                      ? 'grid-cols-1 sm:grid-cols-2' 
                      : 'grid-cols-1'
                  }`}
                >
                  {filteredParts.map((part) => {
                    const imageSrc = getAbsoluteImageUrl(part.imageUrl) || getCategoryDefaultImage(part.category);

                    if (layoutMode === 'list') {
                      // List Row Mode
                      return (
                        <div 
                          key={part.id} 
                          className="booklet-card border border-slate-200 rounded-xl p-3 flex items-center gap-3.5 bg-white shadow-2xs"
                        >
                          {/* Thumbnail */}
                          <div className="w-18 h-18 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                            <img 
                              src={imageSrc} 
                              alt={part.itemName} 
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/productsimg/placeholder.svg';
                              }}
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                YB: {part.ybNo}
                              </span>
                              <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
                                OEM: {part.oem}
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                {part.category}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 leading-snug">
                              {part.itemName}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {part.des}
                            </p>
                          </div>

                          {/* Price & Stock */}
                          {(showPrices || showStock) && (
                            <div className="text-right shrink-0 pl-2 border-l border-slate-100">
                              {showPrices && (
                                <div className="font-black text-sm text-emerald-800 font-mono">
                                  KES {part.priceKes?.toLocaleString()}
                                </div>
                              )}
                              {showStock && (
                                <div className="text-[11px] font-mono text-slate-500 mt-1">
                                  In Stock: <strong>{part.stock}</strong>
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
                        className="booklet-card border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between bg-white shadow-2xs hover:shadow-sm transition-shadow"
                      >
                        <div>
                          {/* Top Product Photo */}
                          <div className="w-full aspect-[4/3] bg-slate-50 rounded-lg border border-slate-200 p-2.5 flex items-center justify-center mb-3 overflow-hidden relative group">
                            <img 
                              src={imageSrc} 
                              alt={part.itemName} 
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/productsimg/placeholder.svg';
                              }}
                            />
                            <span className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-slate-900/80 text-white px-1.5 py-0.5 rounded">
                              {part.category}
                            </span>
                          </div>

                          {/* Badges: OEM & YB Number */}
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            <span className="font-mono font-black text-[11px] text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              YB: {part.ybNo}
                            </span>
                            <span className="font-mono font-black text-[11px] text-slate-900 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                              OEM: {part.oem}
                            </span>
                          </div>

                          {/* Part Name */}
                          <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                            {part.itemName}
                          </h4>

                          {/* Description & Compatibility */}
                          <p className="text-[11px] text-slate-600 mt-1.5 leading-snug line-clamp-3">
                            {part.des}
                          </p>
                        </div>

                        {/* Card Footer: Price & Stock */}
                        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                            JoyDivine Part
                          </span>

                          <div className="text-right">
                            {showPrices && (
                              <span className="font-black text-xs text-[#0A192F] font-mono">
                                KES {part.priceKes?.toLocaleString()}
                              </span>
                            )}
                            {showStock && (
                              <span className="text-[10px] font-mono text-slate-500 block">
                                Qty: {part.stock}
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

              {/* Catalog Footer */}
              <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>JoyDivine Auto Spares • Room B13 Kirinyaga Crescent, Nairobi</span>
                <span>Hotline: {PRIMARY_PHONE_DISPLAY}</span>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Bottom Footer (Screen only, hidden on print) */}
        <div className="booklet-no-print bg-white border-t border-slate-200 p-3 px-6 flex items-center justify-between shrink-0 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Cover page included automatically • Formatted for standard A4 printing / PDF export</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              type="button"
              className="px-5 py-1.5 bg-[#0A192F] hover:bg-[#132A4D] text-white rounded-lg font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Booklet Now</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
