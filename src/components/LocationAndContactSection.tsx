import React from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  MessageCircle, 
  Navigation, 
  Truck, 
  CreditCard,
  Building2,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const LocationAndContactSection: React.FC = () => {
  return (
    <section className="bg-slate-50 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold font-mono">
            <Building2 className="w-3.5 h-3.5 text-blue-700" />
            <span>KIRINYAGA ROAD • NAIROBI CBD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A192F] font-['Chivo'] tracking-tight">
            PHYSICAL STORE & CONTACT INFO
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Visit our counter at Room B13 on Kirinyaga Road, or get parts dispatched directly to your garage anywhere in Kenya.
          </p>
        </div>

        {/* 3 Core Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Physical Shop Address */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A192F] text-white flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-base font-bold text-[#0A192F]">Physical Counter</h3>
                  <span className="text-xs bg-[#0A192F] text-white font-black px-2 py-0.5 rounded font-mono">
                    ROOM B13
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900">Kirinyaga Road</strong>, near Kirinyaga Crescent<br />
                  <span className="text-blue-800 font-semibold">Opposite Seventies Plaza</span><br />
                  Nairobi Central Business District, Kenya
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">Landmarks for Drivers / Walkers:</div>
                <div className="text-slate-600 text-[11px]">
                  Directly opposite Seventies Plaza, just past Kirinyaga Crescent junction. Look for the JoyDevine Room B13 blue signboard.
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href="https://maps.google.com/?q=Kirinyaga+Road+Nairobi"
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A192F] text-white flex items-center justify-center">
                <Phone className="w-6 h-6 text-blue-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0A192F] mb-1">Direct Counter Lines</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Call our sales desk directly to verify vehicle compatibility or hold stock:
                </p>

                <div className="space-y-2 text-xs font-mono">
                  <a
                    href="tel:+254720357361"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors"
                  >
                    <span className="text-slate-500 font-sans text-xs">Primary Hotline:</span>
                    <strong className="font-bold text-blue-800 text-sm">0720 357 361</strong>
                  </a>

                  <a
                    href="tel:+254722604419"
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors"
                  >
                    <span className="text-slate-500 font-sans text-xs">Secondary Hotline:</span>
                    <strong className="font-bold text-blue-800 text-sm">0722 604 419</strong>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href="https://wa.me/254720357361?text=Hello%20JoyDevine%20Auto%20Spares,%20I%20am%20inquiring%20about%20a%20part"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp (0720 357 361)</span>
              </a>
            </div>
          </div>

          {/* Card 3: Working Hours & Dispatch Logistics */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#0A192F] text-white flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>

              <div>
                <h3 className="text-base font-bold text-[#0A192F] mb-1">Operating Hours & Dispatch</h3>
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
                    <span>Sunday & Public Holidays:</span>
                    <span>Closed (WhatsApp orders queue)</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs space-y-1 text-blue-950">
                <div className="flex items-center gap-1.5 font-bold">
                  <Truck className="w-3.5 h-3.5 text-blue-800" />
                  <span>Parcel Dispatch Across Kenya</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Daily parcel booking to Eldoret, Nakuru, Kisumu, Mombasa, Nyeri, Meru, Machakos, and East Africa through reliable couriers & shuttles.
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
