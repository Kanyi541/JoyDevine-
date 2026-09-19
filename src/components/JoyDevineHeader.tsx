import React from 'react';
import { 
  Wrench, 
  Search, 
  ShoppingCart, 
  MessageCircle, 
  X,
  Store
} from 'lucide-react';

interface JoyDevineHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  cartTotalKes: number;
  onOpenCart: () => void;
  onOpenPOS?: () => void;
}

export const JoyDevineHeader: React.FC<JoyDevineHeaderProps> = ({
  searchQuery,
  onSearchChange,
  cartCount,
  onOpenCart,
  onOpenPOS,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200">
      
      {/* Main Header Bar: Clean White with Navy Blue Branding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-2.5 select-none shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0A192F] flex items-center justify-center text-white shadow-xs shrink-0">
              <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
                <span className="font-black text-sm sm:text-lg md:text-xl tracking-tight text-[#0A192F] font-['Chivo']">
                  JOYDEVINE
                </span>
                <span className="font-bold text-sm sm:text-lg md:text-xl tracking-tight text-blue-700 font-['Chivo']">
                  AUTO SPARES
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block mt-0.5">
                Kirinyaga Road, Nairobi
              </span>
            </div>
          </div>

          {/* Search Bar (YB No, OEM, Description, Model) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by part name, YB No, OEM, or description..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-700 rounded-lg text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-700/10 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* WhatsApp Contact */}
            <a 
              href="https://wa.me/254720357361?text=Hello%20JoyDevine%20Auto%20Spares,%20I%20am%20inquiring%20about%20spare%20parts"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 sm:px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs min-h-[38px]"
              title="Chat on WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition-colors cursor-pointer border border-slate-200 min-h-[38px]"
              title="View cart"
            >
              <ShoppingCart className="w-4 h-4 text-[#0A192F]" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#0A192F] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Counter Staff / POS Button */}
            {onOpenPOS && (
              <button
                onClick={onOpenPOS}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-[#0A192F] hover:bg-[#152e55] text-white rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-xs min-h-[38px]"
                title="Counter POS / Staff Access"
              >
                <Store className="w-4 h-4 text-blue-400" />
                <span className="hidden lg:inline">Counter POS</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Search Bar (Visible only on small mobile devices) */}
        <div className="mt-2.5 md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by YB No, OEM, or part name..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>

    </header>
  );
};
