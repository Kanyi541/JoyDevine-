import React from 'react';
import { 
  TelephoneFill as Phone, 
  Whatsapp as MessageCircle, 
  Cart3 as ShoppingCart, 
  Camera,
  GeoAltFill as MapPin
} from 'react-bootstrap-icons';
import { 
  PRIMARY_PHONE_DISPLAY, 
  PRIMARY_PHONE_TEL, 
  PRIMARY_WHATSAPP_PHONE 
} from '../services/whatsappService';

interface MobileCustomerActionBarProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const MobileCustomerActionBar: React.FC<MobileCustomerActionBarProps> = ({
  cartCount,
  onOpenCart,
}) => {
  const photoInquiryWaUrl = `https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent(
    'Hello JoyDivine Auto Spares (Room B13 Kirinyaga Crescent). I need to check part availability / price. I am sending a photo.'
  )}`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A192F] text-white border-t border-slate-700 px-3 py-2 shadow-2xl flex items-center justify-between gap-2 safe-bottom">
      
      {/* 1. Quick Call */}
      <a
        href={`tel:${PRIMARY_PHONE_TEL}`}
        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors min-h-[44px] border border-slate-600"
        title="Call Counter Hotline"
      >
        <Phone className="w-3.5 h-3.5 text-emerald-400" />
        <span>Call Desk</span>
      </a>

      {/* 2. Photo WhatsApp */}
      <a
        href={photoInquiryWaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-[1.4] py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-black transition-colors min-h-[44px] shadow-sm"
        title="WhatsApp Part Sample Photo"
      >
        <Camera className="w-3.5 h-3.5" />
        <span>Photo Quote</span>
      </a>

      {/* 3. Cart Trigger */}
      <button
        type="button"
        onClick={onOpenCart}
        className="relative flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
        title="View Shopping Cart"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>Cart</span>
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0A192F]">
            {cartCount}
          </span>
        )}
      </button>

    </div>
  );
};
