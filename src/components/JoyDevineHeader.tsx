import React from 'react';
import { 
  Search, 
  Cart3 as ShoppingCart, 
  Whatsapp as MessageCircle, 
  XLg as X,
  Shop as Store,
  TelephoneFill as Phone,
  GeoAltFill as MapPin
} from 'react-bootstrap-icons';
import { 
  PRIMARY_WHATSAPP_PHONE, 
  PRIMARY_PHONE_DISPLAY, 
  PRIMARY_PHONE_TEL,
  SECONDARY_PHONE_1_DISPLAY,
  SECONDARY_PHONE_2_DISPLAY
} from '../services/whatsappService';

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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      
      {/* Top Location & Hotline Bar */}
      <div className="bg-[#0F172A] text-slate-300 text-[11px] py-1.5 px-3 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-200">
              <strong className="text-white font-semibold">Room B13</strong>, Kirinyaga Crescent, Opp. Seventies Plaza, Nairobi
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px]">
            <a 
              href={`tel:${PRIMARY_PHONE_TEL}`} 
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
              title="Call Counter Hotline"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>{PRIMARY_PHONE_DISPLAY}</span>
            </a>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:flex items-center gap-1 text-slate-300">
              <span>{SECONDARY_PHONE_1_DISPLAY} / {SECONDARY_PHONE_2_DISPLAY}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 select-none shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white p-0.5 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              <img 
                src="/joydevine-logo.png" 
                alt="JoyDivine Auto Spares" 
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-black text-base sm:text-xl tracking-tight text-[#0F172A] font-['Chivo'] uppercase">
                  JoyDivine
                </span>
                <span className="font-bold text-base sm:text-xl tracking-tight text-blue-600 font-['Chivo'] uppercase">
                  Auto Spares
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                Brake, Clutch & Hydraulic Specialists • Kirinyaga Crescent
              </span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-2">
            <div className="relative w-full group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by part name, OEM number, car model..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 transition-all shadow-2xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* WhatsApp Quick Order */}
            <a 
              href={`https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent('Hello JoyDivine Auto Spares Kirinyaga Crescent, I am inquiring about spare parts fitment and pricing.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm cursor-pointer"
              title={`Direct WhatsApp Desk (${PRIMARY_PHONE_DISPLAY})`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              type="button"
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-slate-200/80"
              title="View Cart"
            >
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#0F172A] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full font-mono">
                  {cartCount}
                </span>
              )}
            </button>

            {/* POS Counter Terminal */}
            {onOpenPOS && (
              <button
                onClick={onOpenPOS}
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer border border-slate-800"
                title="Counter POS Terminal"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Counter POS</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 md:hidden">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search parts by name, OEM, car model..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
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
