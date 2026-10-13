import React, { useState, useMemo } from 'react';
import { 
  XLg as X, 
  PrinterFill as Printer, 
  Search, 
  Filter, 
  Check2Square, 
  Square, 
  Grid3x3Gap as Grid3, 
  Grid1x2 as Grid2, 
  ListUl as ListIcon,
  BoxSeam,
  Tags
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { getAbsoluteImageUrl, getCategoryDefaultImage } from '../services/productImageService';
import { PRIMARY_PHONE_DISPLAY } from '../services/whatsappService';

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
  const [showBrand, setShowBrand] = useState<boolean>(true);

  // Available unique categories from parts
  const categories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All Categories', ...Array.from(set).sort()];
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
      
      {/* Scoped Print Styles: Isolates the booklet content when printing */}
      <style>{`
        @media print {
          /* Hide all surrounding page elements */
          body * {
            visibility: hidden !important;
          }
          /* Make only the booklet container visible and positioned at top-left */
          #print-booklet-content, #print-booklet-content * {
            visibility: visible !important;
          }
          #print-booklet-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Hide non-print controls */
          .booklet-no-print {
            display: none !important;
          }
          /* Prevent cards from being split across page breaks */
          .booklet-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
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
                <span>Print Catalog Booklet</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-400/20">
                  {filteredParts.length} parts selected
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Well-arranged product photos, OEM numbers, and vehicle compatibility descriptions.
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
              <span>Print Booklet / Save as PDF</span>
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
                  <option key={c} value={c}>{c}</option>
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
                title="3 Items per row (Standard Booklet)"
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
                title="2 Items per row (Large Photos)"
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
                title="Detailed Rows (Compact List)"
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          
          {/* Printable Booklet Page Content */}
          <div 
            id="print-booklet-content"
            className="w-full max-w-[850px] bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6"
          >
            
            {/* Header: JoyDivine Branding Banner */}
            <div className="border-b-2 border-[#0A192F] pb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/joydevine-logo.png" 
                  alt="JoyDivine Logo" 
                  className="w-14 h-14 object-contain rounded-full border border-slate-200 p-0.5 bg-white"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-['Chivo'] tracking-tight text-[#0A192F] uppercase">
                    JoyDivine Auto Spares
                  </h1>
                  <p className="text-xs text-slate-700 font-medium">
                    Room B13, Kirinyaga Crescent, Opp. Seventies Plaza, Nairobi
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Hotline: <strong>{PRIMARY_PHONE_DISPLAY}</strong> • Genuine Hydraulic & Brake Parts
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block px-2.5 py-1 bg-[#0A192F] text-white font-mono font-bold text-xs rounded tracking-wider uppercase">
                  PARTS BOOKLET
                </span>
                <p className="text-[11px] font-mono text-slate-500 mt-1">
                  Date: {currentDate}
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  Total Items: {filteredParts.length}
                </p>
              </div>
            </div>

            {/* Sub-Header: Category / Filter Description */}
            <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2 text-slate-600">
              <div className="font-bold text-[#0A192F] uppercase tracking-wider font-mono">
                Category: {selectedCategory}
              </div>
              <div className="text-[11px] text-slate-500 italic">
                {searchQuery ? `Filtered by "${searchQuery}" • ` : ''} Counter Reference Catalog
              </div>
            </div>

            {/* Empty State */}
            {filteredParts.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <BoxSeam className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-sm">No spare parts match your filter.</p>
                <p className="text-xs">Try selecting a different category or clearing the search box.</p>
              </div>
            ) : (
              /* Product Grid Layout */
              <div 
                className={`grid gap-3.5 ${
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
                        className="booklet-card border border-slate-200 rounded-lg p-2.5 flex items-center gap-3 bg-white hover:border-slate-300 transition-colors"
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded flex items-center justify-center p-1 shrink-0 overflow-hidden">
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                              YB: {part.ybNo}
                            </span>
                            <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                              OEM: {part.oem}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              {part.category}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 mt-1 truncate">
                            {part.itemName}
                          </h4>
                          <p className="text-[11px] text-slate-600 line-clamp-1">
                            {part.des}
                          </p>
                        </div>

                        {/* Price & Stock */}
                        {(showPrices || showStock) && (
                          <div className="text-right shrink-0">
                            {showPrices && (
                              <div className="font-bold text-xs text-emerald-800">
                                KES {part.priceKes?.toLocaleString()}
                              </div>
                            )}
                            {showStock && (
                              <div className="text-[10px] font-mono text-slate-500">
                                Stock: {part.stock} pcs
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
                      className="booklet-card border border-slate-200 rounded-xl p-3 flex flex-col justify-between bg-white shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div>
                        {/* Top Product Photo */}
                        <div className="w-full aspect-[4/3] bg-slate-50 rounded-lg border border-slate-200 p-2 flex items-center justify-center mb-2.5 overflow-hidden">
                          <img 
                            src={imageSrc} 
                            alt={part.itemName} 
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/productsimg/placeholder.svg';
                            }}
                          />
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
                        <p className="text-[11px] text-slate-600 mt-1 leading-snug line-clamp-3">
                          {part.des}
                        </p>
                      </div>

                      {/* Card Footer: Category, Price, Brand */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">
                          {part.category}
                        </span>

                        <div className="text-right">
                          {showPrices && (
                            <span className="font-black text-xs text-[#0A192F]">
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

            {/* Booklet Footer for Printed Pages */}
            <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>JoyDivine Auto Spares • Room B13 Kirinyaga Crescent, Nairobi</span>
              <span>Hotline: {PRIMARY_PHONE_DISPLAY}</span>
            </div>

          </div>

        </div>

        {/* Modal Bottom Footer (Screen only, hidden on print) */}
        <div className="booklet-no-print bg-white border-t border-slate-200 p-3 px-6 flex items-center justify-between shrink-0 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Formatted for standard A4 paper / PDF export</span>
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
