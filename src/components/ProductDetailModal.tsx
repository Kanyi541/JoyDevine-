import React, { useState } from 'react';
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
import { LoadingImage } from './LoadingImage';

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
  const [copiedOem, setCopiedOem] = useState(false);
  const [added, setAdded] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200/80 max-h-[92vh] flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="bg-[#0F172A] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              {part.category || 'Automotive Component'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">OEM {part.oem}</span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 overflow-y-auto flex-1">
          
          {/* Left Column: Image & Stock */}
          <div className="p-5 bg-slate-50/70 border-b sm:border-b-0 sm:border-r border-slate-200/80 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="aspect-square bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-center max-h-64 sm:max-h-none">
                <LoadingImage
                  src={part.imageUrl}
                  alt={part.itemName}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {part.stock <= 0 ? (
                <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Kirinyaga Counter: Stock Reservation Needed</span>
                  </div>
                  <div className="text-[11px] text-rose-700">
                    Currently 0 units at Room B13 desk. Reach out on WhatsApp to reserve immediate batch restocking.
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>In Stock at Room B13, Kirinyaga Crescent</span>
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    Direct counter pickup opposite Seventies Plaza, or same-day countrywide parcel dispatch.
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 pt-3 flex items-center justify-between border-t border-slate-200">
              <span>Brand: <strong className="text-slate-800 font-semibold">{part.brand || 'Genuine OEM Spec'}</strong></span>
              <span>Fitment Standard: <strong className="text-slate-800 font-semibold">100% Tested</strong></span>
            </div>
          </div>

          {/* Right Column: Details & Ordering */}
          <div className="p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              
              <div>
                <span className="text-[11px] font-bold text-blue-700 font-mono tracking-wide uppercase">
                  {part.condition || 'Brand New'}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mt-0.5">
                  {part.itemName}
                </h3>
              </div>

              {/* Identification Grid */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-mono">OEM Code:</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{part.oem}</span>
                    <button
                      onClick={handleCopyOem}
                      className="text-slate-400 hover:text-blue-700 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
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

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 font-mono">Category:</span>
                  <span className="font-semibold text-slate-800">{part.category}</span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-slate-500 font-mono">Location:</span>
                  <span className="font-medium text-slate-700">Room B13, Kirinyaga Crescent</span>
                </div>
              </div>

              {/* Vehicle Compatibility */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  <span>Vehicle Application & Fitment</span>
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-sans">
                  {part.des}
                </p>
              </div>

              {/* Price Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-3.5 rounded-xl flex items-baseline justify-between shadow-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Counter Retail Price</span>
                  <span className="text-2xl font-black font-mono tracking-tight text-white">
                    KES {part.priceKes.toLocaleString()}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Genuine Quality
                </span>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <button
                onClick={handleAdd}
                className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                  added 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-[#0F172A] hover:bg-slate-800 text-white border-slate-900 shadow-md hover:shadow-lg'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added to Order</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Order</span>
                  </>
                )}
              </button>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Confirm Fitment on WhatsApp ({PRIMARY_PHONE_DISPLAY})</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
