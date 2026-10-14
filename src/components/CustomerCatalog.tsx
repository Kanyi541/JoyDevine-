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
import { getSafeImageUrl } from '../services/productImageService';

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

  // Dynamic categories based on items present in the database
  const availableCategories = React.useMemo(() => [
    'All Parts',
    ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean))),
  ], [parts]);

  // Popular vehicle makes commonly requested at Kirinyaga Road counter
  const popularVehicleMakes = ['Toyota', 'Isuzu', 'Nissan', 'Mitsubishi', 'Mazda', 'Subaru'];

  // Enhanced speed-optimized search with multi-token matching
  const filteredParts = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];

    return parts.filter((part) => {
      const matchesCategory = selectedCategory === 'All Parts' || part.category === selectedCategory;
      if (!matchesCategory) return false;
      if (terms.length === 0) return true;

      const searchableText = `${part.itemName} ${part.oem} ${part.des} ${part.category} ${part.brand || ''}`.toLowerCase();
      return terms.every((term) => searchableText.includes(term));
    });
  }, [parts, selectedCategory, searchQuery]);

  return (
    <section className="py-4 sm:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-5">
      
      {/* Category Navigation Bar & Vehicle Chips */}
      <div className="space-y-3 border-b border-slate-200/80 pb-4">
        
        {/* Scrollable Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
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
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Vehicle Make Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Popular Vehicle Makes:</span>
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {make}
                </button>
              );
            })}
          </div>

          {/* Search status & reset */}
          {searchQuery && (
            <div className="flex items-center gap-2 text-xs text-slate-700 shrink-0 bg-blue-50/70 border border-blue-200 px-3 py-1 rounded-lg">
              <span>
                Search: <strong className="text-slate-900 font-bold">"{searchQuery}"</strong> ({filteredParts.length} parts found)
              </span>
              <button
                type="button"
                onClick={() => onSearchChange?.('')}
                className="text-slate-400 hover:text-slate-800 p-0.5 cursor-pointer ml-1"
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
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-xs max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">No Matching Parts Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery ? `No spare parts matching "${searchQuery}" in ${selectedCategory}` : 'No spare parts registered in this category'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All Parts');
              onSearchChange?.('');
            }}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            View All Parts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredParts.map((part) => {
            const isAdded = addedItemNotice === part.id;
            const waLink = buildWhatsAppPartOrderUrl(part);
            const isOutOfStock = part.stock <= 0;
            const safeImage = getSafeImageUrl(part.imageUrl, part.category);

            return (
              <div
                key={part.id}
                onClick={() => onQuickView(part)}
                itemScope
                itemType="https://schema.org/Product"
                className={`bg-white rounded-2xl overflow-hidden border transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
                  isOutOfStock
                    ? 'border-slate-200 opacity-85'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Part Image Area */}
                  <div className="relative aspect-[4/3] bg-slate-50/70 overflow-hidden border-b border-slate-100 flex items-center justify-center p-3">
                    <img
                      src={safeImage}
                      alt={part.itemName}
                      itemProp="image"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-250"
                      loading="lazy"
                    />

                    {/* Stock Status Badge (Top Right) */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white shadow-2xs flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Out of Stock</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shadow-2xs flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>In Stock ({part.stock})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-3.5 space-y-2">
                    
                    {/* OEM Part Number Chip */}
                    <div className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded-lg border border-slate-200/80 font-mono">
                      <span className="text-slate-500 font-sans text-[11px] font-semibold">OEM Part:</span>
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-slate-900 font-black truncate" itemProp="mpn">{part.oem}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyOem(e, part.oem)}
                          title="Copy OEM code"
                          className="text-slate-400 hover:text-blue-700 p-0.5 transition-colors cursor-pointer"
                        >
                          {copiedOem === part.oem ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Item Name */}
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors" itemProp="name">
                      {part.itemName}
                    </h3>

                    {/* Vehicle Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed" itemProp="description">
                      {part.des}
                    </p>

                  </div>
                </div>

                {/* Footer: Price & Actions */}
                <div className="p-3.5 pt-0 space-y-2">
                  <div 
                    className="pt-2 border-t border-slate-100 flex items-center justify-between"
                    itemProp="offers" 
                    itemScope 
                    itemType="https://schema.org/Offer"
                  >
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-mono block font-bold">Cash / M-Pesa</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-mono font-bold text-slate-500">KES</span>
                        <span className="text-base font-black text-[#0F172A] font-mono leading-none">
                          {part.priceKes.toLocaleString()}
                        </span>
                      </div>
                      <meta itemProp="priceCurrency" content="KES" />
                      <meta itemProp="price" content={part.priceKes.toString()} />
                      <meta itemProp="availability" content={part.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleAdd(e, part)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isAdded
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-[#0F172A] hover:bg-slate-800 text-white border-[#0F172A] shadow-xs'
                      }`}
                      title="Add to shopping cart"
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

                  {/* Direct WhatsApp Ordering */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Inquire / Order on WhatsApp</span>
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
