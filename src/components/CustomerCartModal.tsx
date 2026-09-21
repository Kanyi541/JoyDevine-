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
  ArrowRight
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { 
  PRIMARY_WHATSAPP_PHONE, 
  PRIMARY_PHONE_DISPLAY,
  getPublicImageUrlForWhatsApp 
} from '../services/whatsappService';

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
  const [reservationCode, setReservationCode] = useState<string | null>(null);

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
      text += `   - YB No: ${item.part.ybNo} | OEM: ${item.part.oem}\n`;
      text += `   - Qty: ${item.quantity} x KES ${item.part.priceKes.toLocaleString()} = KES ${(item.part.priceKes * item.quantity).toLocaleString()}\n`;
      if (itemPhoto) {
        text += `   - Photo: ${itemPhoto}\n`;
      }
    });

    text += `\n*Items Subtotal:* KES ${itemsSubtotalKes.toLocaleString()}\n`;
    if (deliveryFeeKes > 0) {
      text += `*Delivery Fee:* KES ${deliveryFeeKes.toLocaleString()}\n`;
    }
    text += `*GRAND TOTAL:* KES ${grandTotalKes.toLocaleString()}\n\n`;
    text += `Hello JoyDivine Auto Spares, please confirm stock availability and provide M-Pesa payment details. Thank you!`;

    const code = `JD-${Math.floor(1000 + Math.random() * 9000)}`;
    setReservationCode(code);

    const waUrl = `https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F]/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Header: Deep Navy */}
        <div className="p-4 sm:p-5 bg-[#0A192F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-lg font-['Chivo'] tracking-tight">MY PARTS CART</h2>
            <span className="text-xs bg-white text-[#0A192F] font-bold px-2 py-0.5 rounded font-mono">
              {cartItems.length} item{cartItems.length === 1 ? '' : 's'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Your Cart is Empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Browse our Kirinyaga Crescent catalog and click "Add to Cart" or order directly on WhatsApp.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-[#0A192F] text-white text-xs font-bold rounded-lg hover:bg-[#132A4D]"
              >
                Browse Auto Spares
              </button>
            </div>
          ) : (
            <>
              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <span>Selected Parts</span>
                  <button
                    onClick={onClearCart}
                    className="text-rose-600 hover:text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Cart
                  </button>
                </div>

                {cartItems.map(({ part, quantity }) => (
                  <div
                    key={part.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div className="w-12 h-12 bg-white rounded border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={part.imageUrl}
                        alt={part.itemName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-[#0A192F] text-white px-1.5 py-0.2 rounded">
                          {part.ybNo}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono truncate">
                          OEM: {part.oem}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                        {part.itemName}
                      </h4>
                      <span className="text-xs font-mono font-bold text-blue-900 block mt-0.5">
                        KES {(part.priceKes * quantity).toLocaleString()}
                      </span>
                    </div>

                    {/* Quantity Selector & Remove */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-slate-300 rounded bg-white">
                        <button
                          onClick={() => onUpdateQty(part.id, -1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-slate-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQty(part.id, 1)}
                          className="px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(part.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery / Fulfillment Method */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Collection / Delivery Method:
                </span>
                
                <div className="space-y-1.5">
                  <label 
                    onClick={() => setDeliveryMethod('PICKUP')}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      deliveryMethod === 'PICKUP'
                        ? 'bg-blue-50/60 border-blue-600 text-blue-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-blue-700" />
                      <div>
                        <div className="font-bold">Counter Pickup (Room B13)</div>
                        <div className="text-[11px] text-slate-500">Kirinyaga Crescent, opposite Seventies Plaza, Nairobi</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-700">FREE</span>
                  </label>

                  <label 
                    onClick={() => setDeliveryMethod('CBD_RIDER')}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      deliveryMethod === 'CBD_RIDER'
                        ? 'bg-blue-50/60 border-blue-600 text-blue-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-700" />
                      <div>
                        <div className="font-bold">Nairobi CBD & Environs Rider</div>
                        <div className="text-[11px] text-slate-500">Same-day motorcycle delivery to your garage</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">+KES 300</span>
                  </label>

                  <label 
                    onClick={() => setDeliveryMethod('UPCOUNTRY_COURIER')}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      deliveryMethod === 'UPCOUNTRY_COURIER'
                        ? 'bg-blue-50/60 border-blue-600 text-blue-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-700" />
                      <div>
                        <div className="font-bold">Upcountry Courier Dispatch</div>
                        <div className="text-[11px] text-slate-500">Fargo, Matatu Shuttles across Kenya & East Africa</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">+KES 500</span>
                  </label>
                </div>
              </div>

              {/* Customer Contact Details (Optional for WhatsApp message) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-900 block">
                  Your Details (For Invoice / Counter Receipt):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name / Garage"
                    className="p-2 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-blue-700"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone No (e.g. 07...)"
                    className="p-2 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:border-blue-700 font-mono"
                  />
                </div>
              </div>
            </>
          )}

        </div>

        {/* Bottom Total & Checkout Actions */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3">
            
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
              <div className="flex justify-between text-sm font-black text-[#0A192F] pt-1.5 border-t border-slate-200">
                <span>Total Payable:</span>
                <span className="font-mono text-base text-blue-900">
                  KES {grandTotalKes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Direct WhatsApp Order CTA */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send Order to WhatsApp ({PRIMARY_PHONE_DISPLAY})</span>
            </button>

            <p className="text-[11px] text-center text-slate-500 pt-1">
              Orders are confirmed immediately at Room B13, Kirinyaga Crescent, opposite Seventies Plaza. M-Pesa Buy Goods & Cash supported.
            </p>

          </div>
        )}

      </div>
    </div>
  );
};
