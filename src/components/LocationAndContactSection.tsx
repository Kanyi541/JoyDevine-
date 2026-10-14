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
    <section className="bg-white border-t border-slate-200 py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Section Header */}
        <div className="border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono font-bold text-blue-700 uppercase tracking-wider">
                Kirinyaga Road Spare Parts District • Nairobi CBD
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Chivo'] mt-1">
                Store Location & Counter Desk
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Visit Room B13 opposite Seventies Plaza for instant counter collection or request daily courier dispatch to your workshop.
            </p>
          </div>
        </div>

        {/* 3 Core Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Card 1: Physical Shop Address */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs bg-slate-900 text-white font-mono font-bold px-2.5 py-1 rounded-lg">
                  ROOM B13
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">Physical Store Address</h3>
                <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                  <strong className="text-slate-900">Kirinyaga Crescent</strong><br />
                  Opposite Seventies Plaza<br />
                  Nairobi CBD, Kenya
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1 shadow-2xs">
                <div className="font-bold text-slate-900 text-[11px]">Finding Us:</div>
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  Located in Kirinyaga Crescent, directly opposite Seventies Plaza. Look for the JoyDivine Auto Spares sign at Room B13.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60">
              <a
                href="https://maps.google.com/?q=Kirinyaga+Crescent+Nairobi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Card 2: Phone & WhatsApp Contacts */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Phone className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Sales Lines</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Call or WhatsApp our counter desk to confirm vehicle fitment or reserve parts:
                </p>

                <div className="space-y-2 text-xs font-mono mt-3">
                  <a
                    href={`tel:${PRIMARY_PHONE_TEL}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-slate-900 border border-emerald-200 transition-colors group"
                    title={`Call Primary Hotline ${PRIMARY_PHONE_DISPLAY}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Phone className="w-3 h-3" />
                      </div>
                      <span className="text-slate-700 font-sans text-xs font-medium">Main Line:</span>
                    </div>
                    <div className="text-right">
                      <strong className="font-bold text-emerald-950 text-xs block">{PRIMARY_PHONE_DISPLAY}</strong>
                      <span className="text-[10px] text-emerald-700 font-sans group-hover:underline">Call Desk</span>
                    </div>
                  </a>

                  <a
                    href={`tel:${SECONDARY_PHONE_1_TEL}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/80 transition-colors group"
                    title={`Call Secondary Line ${SECONDARY_PHONE_1_DISPLAY}`}
                  >
                    <span className="text-slate-600 font-sans text-xs">Line 2:</span>
                    <strong className="font-bold text-slate-800 text-xs">{SECONDARY_PHONE_1_DISPLAY}</strong>
                  </a>

                  <a
                    href={`tel:${SECONDARY_PHONE_2_TEL}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/80 transition-colors group"
                    title={`Call Sales Desk ${SECONDARY_PHONE_2_DISPLAY}`}
                  >
                    <span className="text-slate-600 font-sans text-xs">Sales Desk:</span>
                    <strong className="font-bold text-slate-800 text-xs">{SECONDARY_PHONE_2_DISPLAY}</strong>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60">
              <a
                href={`https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent('Hello JoyDivine Auto Spares, I am inquiring about spare parts at Kirinyaga Crescent (opp. Seventies Plaza).')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp ({PRIMARY_PHONE_DISPLAY})</span>
              </a>
            </div>
          </div>

          {/* Card 3: Working Hours & Dispatch Logistics */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">Operating Hours</h3>
                <div className="space-y-2 text-xs text-slate-700 mt-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                    <span className="font-medium text-slate-600">Monday - Friday:</span>
                    <strong className="font-mono text-slate-900">7:30 AM - 6:30 PM</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200/60">
                    <span className="font-medium text-slate-600">Saturday:</span>
                    <strong className="font-mono text-slate-900">7:30 AM - 6:30 PM</strong>
                  </div>
                  <div className="flex justify-between py-1.5 text-slate-400">
                    <span>Sunday:</span>
                    <span>Closed (Orders Queued)</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Countrywide Parcel Logistics</span>
                </div>
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  Daily parcel booking via Easy Coach, 2NK, Modern Coast, North Rift, Mash, and regional couriers.
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Payment: M-Pesa Buy Goods & Cash at Counter</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
