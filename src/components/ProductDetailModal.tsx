import React from 'react';
import { 
  XLg as X, 
  Copy, 
  CheckLg as Check, 
  Whatsapp as MessageCircle, 
  Cart3 as ShoppingCart, 
  Building as Warehouse,
  ShieldCheck,
  GeoAltFill as MapPin,
  ExclamationTriangleFill as AlertTriangle,
  CarFrontFill as Car
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { buildWhatsAppPartOrderUrl, PRIMARY_PHONE_DISPLAY } from '../services/whatsappService';

interface ProductDetailModalProps {
  part: AutoPart | null;
  onClose: () => void;
  onAddToCart: (part: AutoPart) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  part,
  onClose,
  onAddToCart,
}) => {
  const [copiedOem, setCopiedOem] = React.useState(false);
  const [added, setAdded] = React.useState(false);

  if (!part) return null;

  const handleCopyOem = () => {
    navigator.clipboard?.writeText(part.oem);
    setCopiedOem(true);
    setTimeout(() => setCopiedOem(false), 2000);
  };

  const handleAdd = () => {
    onAddToCart(part);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const waLink = buildWhatsAppPartOrderUrl(part);

  return (
    <div className="fixed inset-0 z-50 bg-[#0A192F]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden relative border border-slate-200 max-h-[92vh] flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="bg-[#0A192F] text-white px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-white text-[#0A192F] px-2 py-0.5 rounded">
              {part.ybNo}
            </span>
            <span className="text-xs text-blue-200 font-medium truncate max-w-[180px] sm:max-w-none">Auto Spare Specifications</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 overflow-y-auto flex-1">
          
          {/* Left Column: Image & Stock */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="aspect-square bg-white rounded-lg p-3 sm:p-4 border border-slate-200 flex items-center justify-center max-h-64 sm:max-h-none">
                <img
                  src={part.imageUrl}
                  alt={part.itemName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {part.stock <= 0 ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>Kirinyaga Crescent Store Status: Out of Stock</span>
                  </div>
                  <div className="text-[11px] text-rose-800">
                    Currently 0 units at Room B13 counter (opp. Seventies Plaza). Contact us on WhatsApp to reserve incoming stock.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Warehouse className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Kirinyaga Crescent Store Status: In Stock (Room B13)</span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Available physically at Room B13 (opp. Seventies Plaza), ready for immediate counter pickup or delivery.
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 pt-3 flex items-center justify-between border-t border-slate-200">
              <span>Brand: <strong className="text-slate-700">{part.brand}</strong></span>
              <span>Warranty: <strong className="text-slate-700">{part.warrantyMonths || 12} Mos</strong></span>
            </div>
          </div>

          {/* Right Column: Details & Ordering */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 font-mono">
                  {part.category}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#0A192F] leading-snug">
                  {part.itemName}
                </h3>
              </div>

              {/* Identification Grid */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono">YB No:</span>
                  <span className="font-mono font-bold text-slate-900">{part.ybNo}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-mono">OEM Code:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-900">{part.oem}</span>
                    <button
                      onClick={handleCopyOem}
                      className="text-slate-400 hover:text-blue-700 p-0.5 cursor-pointer"
                      title="Copy OEM"
                    >
                      {copiedOem ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-mono">Condition:</span>
                  <span className="font-bold text-blue-900">{part.condition}</span>
                </div>
              </div>

              {/* DES: Detailed Vehicle Compatibility */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-blue-700" />
                  Vehicle Compatibility (DES):
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed font-sans">
                  {part.des}
                </p>
              </div>

              {/* Price Banner */}
              <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-lg flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-600 uppercase font-mono block">Counter Retail Price:</span>
                  <span className="text-2xl font-black text-[#0A192F] font-mono">
                    KES {part.priceKes.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                  Tax Inclusive
                </span>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <button
                onClick={handleAdd}
                className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  added 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-[#0A192F] hover:bg-[#132A4D] text-white border-[#0A192F] shadow-sm'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Counter Order</span>
                  </>
                )}
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm & Order on WhatsApp ({PRIMARY_PHONE_DISPLAY})</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
