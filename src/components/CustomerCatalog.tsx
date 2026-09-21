import React, { useState } from 'react';
import { 
  Cart3 as ShoppingCart, 
  Whatsapp as MessageCircle, 
  Copy, 
  CheckLg as Check, 
  Search, 
  Eye, 
  CheckCircleFill as CheckCircle2,
  ExclamationTriangleFill as AlertTriangle,
  CarFrontFill as Car,
  BoxSeam as Package
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { buildWhatsAppPartOrderUrl } from '../services/whatsappService';

interface CustomerCatalogProps {
  parts: AutoPart[];
  searchQuery: string;
  onAddToCart: (part: AutoPart) => void;
  onQuickView: (part: AutoPart) => void;
}

export const CustomerCatalog: React.FC<CustomerCatalogProps> = ({
  parts,
  searchQuery,
  onAddToCart,
  onQuickView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Parts');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);
  const [copiedOem, setCopiedOem] = useState<string | null>(null);
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const handleCopyOem = (e: React.MouseEvent, oem: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(oem);
    setCopiedOem(oem);
    setTimeout(() => setCopiedOem(null), 2000);
  };

  const handleAdd = (e: React.MouseEvent, part: AutoPart) => {
    e.stopPropagation();
    onAddToCart(part);
    setAddedItemNotice(part.id);
    setTimeout(() => setAddedItemNotice(null), 1500);
  };

  const handleImageError = (partId: string) => {
    setBrokenImages((prev) => new Set(prev).add(partId));
  };

  // If there are no items in the Firebase database at all, show nothing just an empty card
  if (parts.length === 0) {
    return (
      <section className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          <div className="bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200 flex flex-col justify-between min-h-[380px]">
            {/* Empty Image Header */}
            <div className="relative aspect-4/3 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                <Package className="w-6 h-6 stroke-[1.5]" />
              </div>
            </div>

            {/* Empty Body */}
            <div className="p-3.5 sm:p-4 flex-1"></div>

            {/* Empty Footer */}
            <div className="p-3.5 sm:p-4 pt-0">
              <div className="w-full h-10 bg-slate-50 border border-slate-200/80 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Dynamic categories based on items present in the database
  const availableCategories = [
    'All Parts',
    ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean))),
  ];

  const lowStockCount = parts.filter((p) => p.stock < 5).length;

  const filteredParts = parts.filter((part) => {
    const matchesCategory = selectedCategory === 'All Parts' || part.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || part.stock < 5;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory && matchesLowStock;
    const matchesSearch = 
      part.itemName.toLowerCase().includes(q) ||
      part.ybNo.toLowerCase().includes(q) ||
      part.oem.toLowerCase().includes(q) ||
      part.des.toLowerCase().includes(q);
    return matchesCategory && matchesLowStock && matchesSearch;
  });

  return (
    <section className="py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Category Filter Pills & Low Stock Quick Filter */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 flex-1">
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border min-h-[40px] flex items-center shrink-0 ${
                  isSelected
                    ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Low Stock Filter Button */}
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border min-h-[40px] flex items-center gap-1.5 shrink-0 ${
            showLowStockOnly
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
          }`}
          title="Filter to items with quantity below 5"
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${showLowStockOnly ? 'text-white' : 'text-amber-700'}`} />
          <span>Low Stock (&lt; 5)</span>
          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
            showLowStockOnly ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-900'
          }`}>
            {lowStockCount}
          </span>
        </button>
      </div>

      {/* Parts Grid */}
      {filteredParts.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          <div className="bg-white rounded-xl overflow-hidden shadow-xs border border-slate-200 flex flex-col justify-between min-h-[380px]">
            <div className="relative aspect-4/3 bg-slate-50 border-b border-slate-100 flex flex-col items-center justify-center p-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-1">
                <Search className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[11px] font-mono text-slate-400">No match</span>
            </div>

            <div className="p-3.5 sm:p-4 space-y-2 flex-1 flex flex-col justify-center text-center">
              <h3 className="font-bold text-xs sm:text-sm text-slate-700">
                No Matching Parts
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {searchQuery ? `No results for "${searchQuery}"` : 'No items match current filters'}
              </p>
            </div>

            <div className="p-3.5 sm:p-4 pt-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All Parts');
                  setShowLowStockOnly(false);
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold text-center cursor-pointer transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5">
          {filteredParts.map((part) => {
            const isAdded = addedItemNotice === part.id;
            const waLink = buildWhatsAppPartOrderUrl(part);

            const isLowStock = part.stock < 5;
            const isOutOfStock = part.stock <= 0;
            const isBrokenImg = brokenImages.has(part.id) || !part.imageUrl;

            return (
              <div
                key={part.id}
                onClick={() => onQuickView(part)}
                className={`bg-white rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer border ${
                  isOutOfStock
                    ? 'border-rose-400 ring-1 ring-rose-300'
                    : isLowStock
                    ? 'border-amber-400 hover:border-amber-500 ring-1 ring-amber-200'
                    : 'border-slate-200 hover:border-blue-600'
                }`}
              >
                <div>
                  {/* Part Image Area */}
                  <div className="relative aspect-4/3 bg-slate-50 overflow-hidden border-b border-slate-200 flex items-center justify-center p-3 sm:p-4">
                    {isBrokenImg ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/70 rounded-lg p-2">
                        <Package className="w-10 h-10 stroke-[1.5] text-slate-300 mb-1" />
                        <span className="text-[11px] font-mono text-slate-500 font-semibold">{part.ybNo}</span>
                      </div>
                    ) : (
                      <img
                        src={part.imageUrl}
                        alt={part.itemName}
                        onError={() => handleImageError(part.id)}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    )}

                    {/* YB No Badge (Top Left) */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="text-[11px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0A192F] text-white shadow-xs">
                        {part.ybNo}
                      </span>
                    </div>

                    {/* Stock Tag (Top Right) */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Out of Stock</span>
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white shadow-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Low Stock: {part.stock} left</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{part.stock} in stock</span>
                        </span>
                      )}
                    </div>

                    {/* Quick Specs overlay on hover (desktop) */}
                    <div className="absolute inset-0 bg-[#0A192F]/20 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-white text-[#0A192F] text-xs font-bold rounded shadow-xs flex items-center gap-1.5 border border-slate-200 font-mono">
                        <Eye className="w-3.5 h-3.5 text-blue-700" /> View Specs
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3.5 sm:p-4 space-y-2.5">
                    
                    {/* Item Name */}
                    <h3 className="font-bold text-xs sm:text-sm text-[#0A192F] line-clamp-2 leading-snug group-hover:text-blue-800 transition-colors">
                      {part.itemName}
                    </h3>

                    {/* OEM Code with 1-click Copy */}
                    <div className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 rounded border border-slate-200 font-mono">
                      <span className="text-slate-500 text-[11px] font-sans font-semibold">OEM:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-bold truncate max-w-[140px] sm:max-w-[160px]">{part.oem}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyOem(e, part.oem)}
                          title="Copy OEM"
                          className="text-slate-400 hover:text-blue-700 p-1 transition-colors cursor-pointer min-w-[24px] min-h-[24px] flex items-center justify-center"
                        >
                          {copiedOem === part.oem ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Product Description & Vehicle Compatibility (DES) */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 space-y-1">
                      <span className="text-[10px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1">
                        <Car className="w-3 h-3 text-blue-700 shrink-0" />
                        <span>Description (DES):</span>
                      </span>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {part.des}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Footer Pricing & Actions */}
                <div className="p-3.5 sm:p-4 pt-0 space-y-2.5">
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Retail Price:</span>
                      <span className="text-base sm:text-lg font-black text-[#0A192F] font-mono">
                        KES {part.priceKes.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, part)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border min-h-[38px] ${
                        isAdded
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[#0A192F] hover:bg-[#132A4D] text-white border-[#0A192F] shadow-xs'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Instant WhatsApp Order Button */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs min-h-[40px]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Order via WhatsApp</span>
                  </a>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};

