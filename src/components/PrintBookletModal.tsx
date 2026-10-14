import React, { useState, useMemo, useEffect } from 'react';
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
  Telephone,
  CheckCircleFill as CheckCircle2
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { getAbsoluteImageUrl, getCategoryDefaultImage } from '../services/productImageService';
import { PRIMARY_PHONE_DISPLAY, SECONDARY_PHONE_1_DISPLAY, SECONDARY_PHONE_2_DISPLAY } from '../services/whatsappService';
import { fetchDirectlyFromFirebase } from '../services/inventoryStorage';

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
  const [allParts, setAllParts] = useState<AutoPart[]>(parts);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'3-col' | '2-col' | 'list'>('3-col');
  const [showPrices, setShowPrices] = useState<boolean>(true);
  const [showStock, setShowStock] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchDirectlyFromFirebase().then(setAllParts);
    }
  }, [isOpen]);

  // Available unique categories from parts
  const categories = useMemo(() => {
    const set = new Set<string>();
    allParts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All Categories', ...Array.from(set).sort()];
  }, [allParts]);

  // Category item counts for cover page summary
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    allParts.forEach((p) => {
      const cat = p.category || 'Uncategorized';
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [allParts]);

  // Filtered parts based on category and search query
  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allParts.filter((part) => {
      const matchCat = selectedCategory === 'All Categories' || part.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;

      const searchable = `${part.itemName} ${part.ybNo} ${part.oem} ${part.des} ${part.category} ${part.brand || ''}`.toLowerCase();
      return searchable.includes(q);
    });
  }, [allParts, selectedCategory, searchQuery]);

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
    <div className="fixed inset-0 z-50 bg-[#0A192F]/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Scoped Print Styles: Customer Booklet Presentation */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-booklet-content, #print-booklet-content * {
            visibility: visible !important;
          }
          #print-booklet-content {
            position: static !important;
            width: 100% !important;
            overflow: visible !important;
          }
          .booklet-no-print {
            display: none !important;
          }
          .booklet-cover-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 250mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 20mm 15mm !important;
            background: #0A192F !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .booklet-catalog-page {
            page-break-before: always !important;
            break-before: page !important;
            padding: 12mm 10mm !important;
          }
          .booklet-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            border: 1px solid #cbd5e1 !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
        }
      `}</style>

      {/* Main Modal Card */}
      <div id="print-booklet-container" className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Top Control Bar (Screen only, hidden on print) */}
        <div className="booklet-no-print bg-[#0A192F] text-white p-4 border-b border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-['Chivo'] tracking-tight flex items-center gap-2">
                <span>Customer Product Catalogue Booklet</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/20">
                  {parts.length} total parts ready for customers
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Professional customer-handout layout: Cover page followed by all database parts, OEM numbers, photos, and descriptions.
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
              <span>Print Customer Booklet (PDF)</span>
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
                <span>Show Prices</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
                <input
                  type="checkbox"
                  checked={showStock}
                  onChange={(e) => setShowStock(e.target.checked)}
                  className="rounded text-blue-700"
                />
                <span>Show Stock Qty</span>
              </label>
            </div>

          </div>

        </div>

        {/* Scrollable Printable Booklet Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-36 bg-slate-100 flex justify-center">
          
          {/* Printable Booklet Wrapper */}
          <div 
            id="print-booklet-content"
            className="w-full max-w-[850px] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
          >
            
            {/* ========================================= */}
            {/* PAGE 1: LUXURY CUSTOMER COVER PAGE        */}
            {/* ========================================= */}
            <div className="booklet-cover-page bg-gradient-to-br from-[#0A192F] via-[#132A4D] to-[#1E3A6B] text-white p-8 sm:p-12 flex flex-col justify-between min-h-[980px]">
              
              {/* Cover Header */}
              <div className="flex items-center justify-between border-b border-blue-500/30 pb-6">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-amber-400 shadow-xl flex items-center justify-center">
                    <img 
                      src="/joydevine-logo.png" 
                      alt="JoyDivine Logo" 
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                      OFFICIAL CUSTOMER CATALOGUE
                    </span>
                    <h2 className="text-xl font-black tracking-tight font-['Chivo'] uppercase text-white">
                      JoyDivine Auto Spares
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3.5 py-1.5 bg-amber-500 text-slate-900 font-mono font-black text-xs rounded-full uppercase shadow">
                    EDITION {currentDate}
                  </span>
                </div>
              </div>

              {/* Cover Main Hero */}
              <div className="my-auto py-10 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Genuine Brake, Clutch & Hydraulic Specialists for Garages & Motorists</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-['Chivo'] tracking-tight uppercase leading-none text-white drop-shadow-lg">
                  Customer Parts <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
                    Product Catalogue
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed font-light">
                  Hand-crafted product booklet prepared for our valued customers and partner garages. Featuring complete stock for <strong className="text-amber-300">Master Cylinders, Wheel Cylinders, Brake & Clutch Cables, Linkages, and Hoses</strong>.
                </p>

                {/* Cover Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-4">
                  <div className="bg-white/15 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-amber-400 font-mono">{parts.length}</div>
                    <div className="text-[11px] text-slate-200 uppercase tracking-wider font-semibold">Active Parts</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-blue-300 font-mono">{Object.keys(categoryCounts).length}</div>
                    <div className="text-[11px] text-slate-200 uppercase tracking-wider font-semibold">Categories</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-emerald-400 font-mono">OEM</div>
                    <div className="text-[11px] text-slate-200 uppercase tracking-wider font-semibold">Quality Standard</div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-xs border border-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-black text-purple-300 font-mono">Nairobi</div>
                    <div className="text-[11px] text-slate-200 uppercase tracking-wider font-semibold">Kirinyaga Cres</div>
                  </div>
                </div>

                {/* Category Breakdown Table of Contents */}
                <div className="bg-black/35 border border-white/15 rounded-2xl p-5 max-w-xl mx-auto text-left space-y-2.5 shadow-xl">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>Catalog Product Categories:</span>
                    <span className="text-[10px] text-slate-300">All Included Below</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {Object.entries(categoryCounts).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5">
                        <span className="truncate text-slate-100 font-medium">{cat}</span>
                        <span className="font-mono font-bold text-amber-300 ml-1">({count})</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Cover Footer */}
              <div className="border-t border-blue-500/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-200">
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
            {/* PAGES 2+: CUSTOMER PRODUCT CATALOGUE      */}
            {/* ========================================= */}
            <div className="booklet-catalog-page p-6 sm:p-10 space-y-6">
              
              {/* Running Header for Catalog Pages */}
              <div className="border-b-2 border-[#0A192F] pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img 
                    src="/joydevine-logo.png" 
                    alt="JoyDivine Logo" 
                    className="w-12 h-12 object-contain rounded-full border border-slate-200 p-0.5 bg-white shadow-xs"
                  />
                  <div>
                    <h3 className="text-base font-black font-['Chivo'] tracking-tight text-[#0A192F] uppercase">
                      JoyDivine Auto Spares • Customer Catalogue
                    </h3>
                    <p className="text-xs text-slate-600">
                      Room B13, Kirinyaga Crescent, Nairobi • Hotline: {PRIMARY_PHONE_DISPLAY} / {SECONDARY_PHONE_1_DISPLAY}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 bg-[#0A192F] text-white font-mono font-bold text-xs rounded tracking-wider uppercase shadow-2xs">
                    CUSTOMER EDITION
                  </span>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    Displaying: {selectedCategory} ({filteredParts.length} parts)
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
                            <div className="text-right shrink-0 pl-3 border-l border-slate-100">
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
                        className="booklet-card border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-white shadow-2xs hover:shadow-sm transition-shadow"
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
                            <span className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-[#0A192F] text-white px-2 py-0.5 rounded shadow-2xs">
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
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                            JoyDivine Genuine
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
            <span>Customer Booklet Mode • Professional Cover + Complete Product Database</span>
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
