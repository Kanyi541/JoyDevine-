import React from 'react';
import { 
  GeoAltFill as MapPin, 
  TelephoneFill as Phone, 
  Clock, 
  Whatsapp as MessageCircle, 
  Compass as Navigation, 
  Truck, 
  CreditCard,
  Building as Building2,
  CheckCircleFill as CheckCircle2,
  BoxArrowUpRight as ExternalLink
} from 'react-bootstrap-icons';
import { 
  PRIMARY_WHATSAPP_PHONE, 
  PRIMARY_PHONE_DISPLAY, 
  PRIMARY_PHONE_TEL,
  SECONDARY_PHONE_1_DISPLAY,
  SECONDARY_PHONE_1_TEL,
  SECONDARY_PHONE_2_DISPLAY,
  SECONDARY_PHONE_2_TEL
} from '../services/whatsappService';

export const LocationAndContactSection: React.FC = () => {
  return (
    <section className="bg-slate-50 border-t border-slate-200 py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Section Header */}
        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono font-bold text-blue-800 uppercase tracking-wider">
                Kirinyaga Road Spare Parts District • Nairobi
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0A192F] font-['Chivo'] mt-0.5">
                Physical Counter & Order Dispatches
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Walk in to Room B13 opposite Seventies Plaza or book courier parcel dispatch to your garage anywhere in Kenya.
            </p>
          </div>
        </div>

        {/* 3 Core Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Card 1: Physical Shop Address */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-xs bg-[#0A192F] text-white font-black px-2 py-0.5 rounded font-mono">
                  ROOM B13
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0A192F]">Store Address</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  <strong className="text-slate-900">Kirinyaga Crescent</strong><br />
                  Opposite Seventies Plaza<br />
                  Nairobi CBD, Kenya
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-800 text-[11px]">Finding Us:</div>
                <div className="text-slate-600 text-[11px] leading-snug">
                  Located in Kirinyaga Crescent, directly opposite Seventies Plaza. Look for Room B13 JoyDivine Auto Spares sign.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href="https://maps.google.com/?q=Kirinyaga+Crescent+Nairobi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-950 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Card 2: Phone & WhatsApp Contacts */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0A192F]">Direct Sales Lines</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Call or WhatsApp our counter desk to confirm vehicle fitment or reserve parts:
                </p>

                <div className="space-y-2 text-xs font-mono mt-3">
                  <a
                    href={`tel:${PRIMARY_PHONE_TEL}`}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-slate-900 border border-emerald-200 transition-colors group"
                    title={`Call Primary Hotline ${PRIMARY_PHONE_DISPLAY}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Phone className="w-3 h-3" />
                      </div>
                      <span className="text-slate-700 font-sans text-xs font-medium">Main Line:</span>
                    </div>
                    <div className="text-right">
                      <strong className="font-bold text-emerald-900 text-xs block">{PRIMARY_PHONE_DISPLAY}</strong>
                      <span className="text-[10px] text-emerald-700 font-sans group-hover:underline">Call Desk</span>
                    </div>
                  </a>

                  <a
                    href={`tel:${SECONDARY_PHONE_1_TEL}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors group"
                    title={`Call Secondary Line ${SECONDARY_PHONE_1_DISPLAY}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-sans text-xs">Line 2:</span>
                    </div>
                    <div className="text-right">
                      <strong className="font-bold text-slate-800 text-xs block">{SECONDARY_PHONE_1_DISPLAY}</strong>
                    </div>
                  </a>

                  <a
                    href={`tel:${SECONDARY_PHONE_2_TEL}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors group"
                    title={`Call Sales Desk ${SECONDARY_PHONE_2_DISPLAY}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-sans text-xs">Sales Desk:</span>
                    </div>
                    <div className="text-right">
                      <strong className="font-bold text-slate-800 text-xs block">{SECONDARY_PHONE_2_DISPLAY}</strong>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href={`https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent('Hello JoyDivine Auto Spares, I am inquiring about spare parts at Kirinyaga Crescent (opp. Seventies Plaza).')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp ({PRIMARY_PHONE_DISPLAY})</span>
              </a>
            </div>
          </div>

          {/* Card 3: Working Hours & Dispatch Logistics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#0A192F]">Operating Hours</h3>
                <div className="space-y-2 text-xs text-slate-700 mt-2">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">Monday - Friday:</span>
                    <strong className="font-mono text-slate-900">7:30 AM - 6:30 PM</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-medium text-slate-600">Saturday:</span>
                    <strong className="font-mono text-slate-900">7:30 AM - 6:30 PM</strong>
                  </div>
                  <div className="flex justify-between py-1 text-slate-400">
                    <span>Sunday:</span>
                    <span>Closed (Orders queued)</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-blue-700" />
                  <span>Countrywide Parcel Delivery</span>
                </div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  Daily dispatch via Easy Coach, 2NK, Modern Coast, North Rift, Mash, and couriers to garages across Kenya.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Payments: M-Pesa Buy Goods & Cash at Counter</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
