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
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200">
      
      {/* Top Contact & Location Strip */}
      <div className="bg-[#0A192F] text-slate-300 text-[11px] py-1.5 px-3 sm:px-6 lg:px-8 border-b border-[#14284B]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-slate-200">
              <strong className="text-white">Room B13</strong>, Kirinyaga Crescent, opp. Seventies Plaza, Nairobi
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 font-mono text-[11px]">
            <a 
              href={`tel:${PRIMARY_PHONE_TEL}`} 
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
              title="Call Main Hotline"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Call / WhatsApp: {PRIMARY_PHONE_DISPLAY}</span>
            </a>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:flex items-center gap-1 text-slate-300">
              <span>Alt: {SECONDARY_PHONE_1_DISPLAY} / {SECONDARY_PHONE_2_DISPLAY}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar: Clean White with Navy Blue Branding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-2.5 select-none shrink-0">
            <img 
              src="/joydevine-logo.png" 
              alt="JoyDevine Auto Spares" 
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full border border-blue-900/10 shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5 leading-none">
                <span className="font-black text-sm sm:text-lg md:text-xl tracking-tight text-[#0A192F] font-['Chivo']">
                  JOYDIVINE
                </span>
                <span className="font-bold text-sm sm:text-lg md:text-xl tracking-tight text-blue-700 font-['Chivo']">
                  AUTO SPARES
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block mt-0.5">
                Kirinyaga Crescent (opp. Seventies Plaza)
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
                placeholder="Search spare parts by name (e.g. Brake Master, Wheel Cylinder), YB No, OEM, or car model..."
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* WhatsApp Contact */}
            <a 
              href={`https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent('Hello JoyDivine Auto Spares, I am inquiring about spare parts at Kirinyaga Crescent (opp. Seventies Plaza).')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 sm:px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs min-h-[38px]"
              title={`Chat on WhatsApp (${PRIMARY_PHONE_DISPLAY})`}
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
              placeholder="Search by part name (e.g. Brake Master), YB No, OEM..."
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
