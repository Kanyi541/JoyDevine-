import React, { useState } from 'react';
import { 
  Cart3 as ShoppingCart, 
  Whatsapp as MessageCircle, 
  Copy, 
  CheckLg as Check, 
  Search, 
  XLg as X,
  CheckCircleFill as CheckCircle2,
  ExclamationTriangleFill as AlertTriangle,
  BoxSeam as Package
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { buildWhatsAppPartOrderUrl } from '../services/whatsappService';
import { getAbsoluteImageUrl } from '../services/productImageService';

interface CustomerCatalogProps {
  parts: AutoPart[];
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  onAddToCart: (part: AutoPart) => void;
  onQuickView: (part: AutoPart) => void;
}

export const CustomerCatalog: React.FC<CustomerCatalogProps> = ({
  parts,
  searchQuery,
  onSearchChange,
  onAddToCart,
  onQuickView,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Parts');
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

  // Dynamic categories based on items present in the database (declared before any early returns)
  const availableCategories = React.useMemo(() => [
    'All Parts',
    ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean))),
  ], [parts]);

  // Popular vehicle makes commonly requested at Kirinyaga Road counter
  const popularVehicleMakes = ['Toyota', 'Nissan', 'Mazda', 'Isuzu', 'Mitsubishi', 'Subaru'];

  // Enhanced speed-optimized search with multi-token matching (declared before any early returns)
  const filteredParts = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];

    return parts.filter((part) => {
      const matchesCategory = selectedCategory === 'All Parts' || part.category === selectedCategory;
      if (!matchesCategory) return false;
      if (terms.length === 0) return true;

      const searchableText = `${part.itemName} ${part.ybNo} ${part.oem} ${part.des} ${part.category} ${part.brand || ''}`.toLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
  }, [parts, selectedCategory, searchQuery]);

  // If there are no items in the database at all
  if (parts.length === 0) {
    return (
      <section className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <div className="bg-white rounded-lg overflow-hidden border border-slate-200 flex flex-col justify-between min-h-[260px] animate-pulse">
            <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center p-3">
              <Package className="w-6 h-6 stroke-[1.5] text-slate-300" />
            </div>
            <div className="p-3 flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
      
      {/* Category Navigation Bar & Vehicle Chips */}
      <div className="space-y-2.5 border-b border-slate-200 pb-3">
        
        {/* Scrollable Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {availableCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = cat === 'All Parts' 
              ? parts.length 
              : parts.filter((p) => p.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 shrink-0 min-h-[38px] ${
                  isSelected
                    ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Vehicle Make Filters for Fast Customer Search */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Popular Makes:</span>
            {popularVehicleMakes.map((make) => {
              const isActive = searchQuery.toLowerCase().includes(make.toLowerCase());
              return (
                <button
                  key={make}
                  type="button"
                  onClick={() => {
                    if (isActive) {
                      onSearchChange?.('');
                    } else {
                      onSearchChange?.(make);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {make}
                </button>
              );
            })}
          </div>

          {/* Search status & reset (when query active) */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-xs text-slate-600 shrink-0 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
              <span>
                Search: <strong className="text-slate-900 font-bold">"{searchQuery}"</strong> ({filteredParts.length} parts)
              </span>
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer ml-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Parts Grid */}
      {filteredParts.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200 shadow-xs max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">No Matching Spare Parts Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? `No items matching "${searchQuery}" in ${selectedCategory}` : 'No spare parts registered in this category'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All Parts');
              onSearchChange?.('');
            }}
            className="px-4 py-1.5 bg-[#0A192F] hover:bg-[#132A4D] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Show All Parts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
          {filteredParts.map((part) => {
            const isAdded = addedItemNotice === part.id;
            const waLink = buildWhatsAppPartOrderUrl(part);
            const isOutOfStock = part.stock <= 0;
            const isBrokenImg = brokenImages.has(part.id) || !part.imageUrl;

            return (
              <div
                key={part.id}
                onClick={() => onQuickView(part)}
                itemScope
                itemType="https://schema.org/Product"
                className={`bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer border ${
                  isOutOfStock
                    ? 'border-slate-200 opacity-80'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <div>
                  {/* Part Image Area */}
                  <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center p-2 sm:p-2.5">
                    {isBrokenImg ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100/70 rounded p-1">
                        <Package className="w-6 h-6 stroke-[1.5] text-slate-300" />
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">{part.ybNo}</span>
                      </div>
                    ) : (
                      <img
                        src={getAbsoluteImageUrl(part.imageUrl)}
                        alt={`${part.itemName} - YB ${part.ybNo}`}
                        itemProp="image"
                        onError={() => handleImageError(part.id)}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    {/* YB No Badge (Top Left) */}
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0A192F] text-white shadow-xs" itemProp="sku">
                        {part.ybNo}
                      </span>
                    </div>

                    {/* Stock Status Badge (Top Right) */}
                    <div className="absolute top-1.5 right-1.5 z-10">
                      {isOutOfStock ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-xs flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Out</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-xs flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span className="hidden sm:inline">In Stock</span>
                          <span className="sm:hidden">Stock</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-2 sm:p-2.5 space-y-1.5">
                    
                    {/* Item Name */}
                    <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-900 transition-colors" itemProp="name">
                      {part.itemName}
                    </h3>

                    {/* OEM Row */}
                    <div className="flex items-center justify-between text-[10px] py-0.5 px-1.5 bg-slate-50 rounded border border-slate-200 font-mono">
                      <span className="text-slate-500 font-sans font-semibold">Part Number:</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-slate-900 font-bold truncate max-w-[80px] sm:max-w-[110px]" itemProp="mpn">{part.oem}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyOem(e, part.oem)}
                          title="Copy OEM"
                          className="text-slate-400 hover:text-blue-700 p-0.5 transition-colors cursor-pointer min-w-[20px] min-h-[20px] flex items-center justify-center"
                        >
                          {copiedOem === part.oem ? (
                            <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Description (DES) */}
                    <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 sm:line-clamp-2 leading-tight" itemProp="description">
                      {part.des}
                    </p>

                  </div>
                </div>

                {/* Footer Pricing & Actions */}
                <div className="p-2 sm:p-2.5 pt-0 space-y-1.5">
                  <div 
                    className="pt-1.5 border-t border-slate-100 flex items-center justify-between"
                    itemProp="offers" 
                    itemScope 
                    itemType="https://schema.org/Offer"
                  >
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-mono">KES</span>
                      <span className="text-xs sm:text-sm font-black text-[#0A192F] font-mono leading-none">
                        {part.priceKes.toLocaleString()}
                      </span>
                      <meta itemProp="priceCurrency" content="KES" />
                      <meta itemProp="price" content={part.priceKes.toString()} />
                      <meta itemProp="availability" content={part.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, part)}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border min-h-[32px] ${
                        isAdded
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[#0A192F] hover:bg-[#132A4D] text-white border-[#0A192F] shadow-2xs'
                      }`}
                      title="Add to shopping cart"
                    >
                      {isAdded ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <ShoppingCart className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline">{isAdded ? 'Added' : 'Add'}</span>
                    </button>
                  </div>

                  {/* Direct WhatsApp Ordering */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded flex items-center justify-center gap-1 transition-colors shadow-2xs min-h-[34px]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Order</span>
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
