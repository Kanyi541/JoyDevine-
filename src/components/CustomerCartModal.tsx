import React, { useState } from 'react';
import { 
  XLg as X, 
  Trash3 as Trash2, 
  Whatsapp as MessageCircle, 
  GeoAltFill as MapPin, 
  Truck, 
  Shop as Store, 
  CheckCircleFill as CheckCircle2, 
  ShieldCheck,
  ArrowRight,
  BagCheckFill
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { 
  PRIMARY_WHATSAPP_PHONE, 
  PRIMARY_PHONE_DISPLAY,
  getPublicImageUrlForWhatsApp 
} from '../services/whatsappService';
import { LoadingImage } from './LoadingImage';

export interface CartItem {
  part: AutoPart;
  quantity: number;
}

interface CustomerCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (partId: string, delta: number) => void;
  onRemoveItem: (partId: string) => void;
  onClearCart: () => void;
}

export const CustomerCartModal: React.FC<CustomerCartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<'PICKUP' | 'CBD_RIDER' | 'UPCOUNTRY_COURIER'>('PICKUP');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  if (!isOpen) return null;

  const itemsSubtotalKes = cartItems.reduce(
    (sum, item) => sum + item.part.priceKes * item.quantity, 
    0
  );

  const deliveryFeeKes = 
    deliveryMethod === 'PICKUP' ? 0 : 
    deliveryMethod === 'CBD_RIDER' ? 300 : 500;

  const grandTotalKes = itemsSubtotalKes + deliveryFeeKes;

  const handleWhatsAppOrder = () => {
    if (cartItems.length === 0) return;

    const firstItemPhoto = getPublicImageUrlForWhatsApp(
      cartItems[0].part.imageUrl,
      cartItems[0].part.category,
      cartItems[0].part.ybNo
    );

    // Image URL first on Line 1 so WhatsApp unfurls the image preview card
    let text = `${firstItemPhoto}\n\n`;
    text += `*JOYDIVINE AUTO SPARES - ORDER REQUEST*\n`;
    text += `*Location:* Room B13, Kirinyaga Crescent, opposite Seventies Plaza, Nairobi\n\n`;
    
    if (customerName) text += `*Customer:* ${customerName}\n`;
    if (customerPhone) text += `*Phone:* ${customerPhone}\n`;
    
    text += `*Fulfillment:* ${
      deliveryMethod === 'PICKUP' 
        ? 'Counter Collection at Room B13, Kirinyaga Crescent (opp. Seventies Plaza)' 
        : deliveryMethod === 'CBD_RIDER' 
        ? 'Nairobi CBD Boda/Rider Dispatch (+KES 300)' 
        : 'Countrywide Parcel Dispatch (+KES 500)'
    }\n\n`;

    text += `*ORDER ITEMS:*\n`;
    cartItems.forEach((item, index) => {
      const itemPhoto = getPublicImageUrlForWhatsApp(item.part.imageUrl, item.part.category, item.part.ybNo);
      text += `${index + 1}. *${item.part.itemName}*\n`;
      text += `   - OEM: ${item.part.oem}\n`;
      text += `   - Qty: ${item.quantity} x KES ${item.part.priceKes.toLocaleString()} = KES ${(item.part.priceKes * item.quantity).toLocaleString()}\n`;
      if (itemPhoto) {
        text += `   - Photo: ${itemPhoto}\n`;
      }
    });

    text += `\n*Items Subtotal:* KES ${itemsSubtotalKes.toLocaleString()}\n`;
    if (deliveryFeeKes > 0) {
      text += `*Delivery Fee:* KES ${deliveryFeeKes.toLocaleString()}\n`;
    }
    text += `*Grand Total:* KES ${grandTotalKes.toLocaleString()}\n\n`;
    text += `Please confirm stock availability and send payment / dispatch instructions. Thank you!`;

    const waUrl = `https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        
        {/* Top Header */}
        <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <BagCheckFill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white font-['Chivo']">
                Counter Order Summary
              </h2>
              <p className="text-[11px] text-slate-400">
                {cartItems.length} item{cartItems.length === 1 ? '' : 's'} selected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {cartItems.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Your Order is Empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Select parts from our Kirinyaga Crescent stock to create an order or request instant WhatsApp counter quotes.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Browse Inventory Catalog
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Selected Auto Spares</span>
                  <button
                    onClick={onClearCart}
                    className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>

                {cartItems.map(({ part, quantity }) => (
                  <div
                    key={part.id}
                    className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="w-14 h-14 bg-white rounded-lg border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0">
                      <LoadingImage
                        src={part.imageUrl}
                        alt={part.itemName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-white text-blue-900 border border-slate-200 px-1.5 py-0.5 rounded">
                          OEM: {part.oem}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {part.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate mt-1">
                        {part.itemName}
                      </h4>
                      <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                        KES {(part.priceKes * quantity).toLocaleString()}
                      </span>
                    </div>

                    {/* Quantity Selector & Remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-2xs">
                        <button
                          onClick={() => onUpdateQty(part.id, -1)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 font-bold rounded-l-lg transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-slate-900 min-w-[20px] text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQty(part.id, 1)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 font-bold rounded-r-lg transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(part.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery / Fulfillment Method */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/80">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Collection / Delivery Method
                </span>
                
                <div className="space-y-2">
                  <label 
                    onClick={() => setDeliveryMethod('PICKUP')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      deliveryMethod === 'PICKUP'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className={`w-4 h-4 ${deliveryMethod === 'PICKUP' ? 'text-emerald-400' : 'text-blue-600'}`} />
                      <div>
                        <div className="font-bold">Counter Pickup (Room B13)</div>
                        <div className={`text-[11px] ${deliveryMethod === 'PICKUP' ? 'text-slate-300' : 'text-slate-500'}`}>
                          Kirinyaga Crescent, opp. Seventies Plaza, Nairobi
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-full ${deliveryMethod === 'PICKUP' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
                      FREE
                    </span>
                  </label>

                  <label 
                    onClick={() => setDeliveryMethod('CBD_RIDER')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      deliveryMethod === 'CBD_RIDER'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className={`w-4 h-4 ${deliveryMethod === 'CBD_RIDER' ? 'text-emerald-400' : 'text-blue-600'}`} />
                      <div>
                        <div className="font-bold">Nairobi CBD & Environs Rider</div>
                        <div className={`text-[11px] ${deliveryMethod === 'CBD_RIDER' ? 'text-slate-300' : 'text-slate-500'}`}>
                          Same-day motorcycle delivery directly to your garage
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-xs ${deliveryMethod === 'CBD_RIDER' ? 'text-white' : 'text-slate-900'}`}>
                      +KES 300
                    </span>
                  </label>

                  <label 
                    onClick={() => setDeliveryMethod('UPCOUNTRY_COURIER')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      deliveryMethod === 'UPCOUNTRY_COURIER'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Truck className={`w-4 h-4 ${deliveryMethod === 'UPCOUNTRY_COURIER' ? 'text-emerald-400' : 'text-blue-600'}`} />
                      <div>
                        <div className="font-bold">Countrywide Courier Dispatch</div>
                        <div className={`text-[11px] ${deliveryMethod === 'UPCOUNTRY_COURIER' ? 'text-slate-300' : 'text-slate-500'}`}>
                          2NK, Easy Coach, North Rift, Modern Coast to any town
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-xs ${deliveryMethod === 'UPCOUNTRY_COURIER' ? 'text-white' : 'text-slate-900'}`}>
                      +KES 500
                    </span>
                  </label>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <span className="text-xs font-bold text-slate-900 block">
                  Your Details (For Order Ticket)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name / Garage"
                    className="p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-slate-800 transition-colors"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone No (e.g. 07...)"
                    className="p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-slate-800 font-mono transition-colors"
                  />
                </div>
              </div>
            </>
          )}

        </div>

        {/* Bottom Total & Checkout Actions */}
        {cartItems.length > 0 && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3.5">
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  KES {itemsSubtotalKes.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfillment ({deliveryMethod}):</span>
                <span className="font-mono font-bold text-slate-900">
                  {deliveryFeeKes === 0 ? 'FREE (Counter Pickup)' : `KES ${deliveryFeeKes.toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Payable:</span>
                <span className="font-mono text-base font-black text-slate-900">
                  KES {grandTotalKes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Direct WhatsApp Order CTA */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Send Order to WhatsApp ({PRIMARY_PHONE_DISPLAY})</span>
            </button>

            <p className="text-[11px] text-center text-slate-500">
              Orders confirmed live at Room B13, Kirinyaga Crescent, opp. Seventies Plaza. M-Pesa Till & Cash accepted.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};
