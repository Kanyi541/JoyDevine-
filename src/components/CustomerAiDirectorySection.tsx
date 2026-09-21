import React, { useState } from 'react';
import { 
  Camera, 
  Whatsapp as MessageCircle, 
  TelephoneFill as Phone, 
  ShieldCheck, 
  Truck, 
  GeoAltFill as MapPin, 
  Search, 
  CheckCircleFill as CheckCircle2,
  QuestionCircleFill as HelpCircle,
  ChevronDown,
  ChevronUp,
  BoxSeam as Package,
  CarFrontFill as Car
} from 'react-bootstrap-icons';
import { AutoPart } from '../types';
import { 
  PRIMARY_WHATSAPP_PHONE, 
  PRIMARY_PHONE_DISPLAY, 
  PRIMARY_PHONE_TEL,
  SECONDARY_PHONE_1_DISPLAY,
  SECONDARY_PHONE_1_TEL,
  buildWhatsAppPartOrderUrl
} from '../services/whatsappService';

interface CustomerAiDirectorySectionProps {
  parts: AutoPart[];
  onSelectPart?: (part: AutoPart) => void;
  onFilterCategory?: (cat: string) => void;
}

export const CustomerAiDirectorySection: React.FC<CustomerAiDirectorySectionProps> = ({
  parts,
  onSelectPart,
  onFilterCategory,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState('');

  const photoInquiryWaUrl = `https://wa.me/${PRIMARY_WHATSAPP_PHONE}?text=${encodeURIComponent(
    'Hello JoyDivine Auto Spares Kirinyaga Crescent! I need a spare part. I am sending a photo of my sample part / chassis number for fitment verification.'
  )}`;

  const categories = Array.from(new Set(parts.map((p) => p.category).filter(Boolean)));

  const filteredDirectoryParts = parts.filter((p) => {
    if (!directoryFilter) return true;
    const q = directoryFilter.toLowerCase();
    return (
      p.itemName.toLowerCase().includes(q) ||
      p.ybNo.toLowerCase().includes(q) ||
      p.oem.toLowerCase().includes(q) ||
      p.des.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const faqs = [
    {
      q: 'Where is JoyDivine Auto Spares located in Nairobi CBD?',
      a: 'We are located at Room B13, Kirinyaga Crescent, directly opposite Seventies Plaza in the Kirinyaga Road auto spares commercial district, Nairobi. You can walk in during counter hours (Monday to Saturday 7:30 AM - 6:30 PM).'
    },
    {
      q: 'How can I confirm if a part fits my car or cross-reference my OEM code?',
      a: 'You can check our online search using your OEM number or vehicle model, or simply snap a clear photo of your old part or vehicle chassis number and send it to our WhatsApp hotline (0111 871 428). Our Kirinyaga desk counter staff will verify exact fitment in under 5 minutes.'
    },
    {
      q: 'Do you offer countrywide parcel delivery to garages across Kenya?',
      a: 'Yes, we send daily parcel dispatches via 2NK, Easy Coach, North Rift, Modern Coast, Mash, and courier services to Mombasa, Nakuru, Kisumu, Eldoret, Thika, Meru, Nyeri, Kitale, and all major garaging hubs across Kenya.'
    },
    {
      q: 'What payment methods do you accept at the counter and online?',
      a: 'We accept M-Pesa Buy Goods Till, M-Pesa Send Money, and cash at our counter in Room B13. For parcel dispatches, customers pay securely via M-Pesa upon parcel booking confirmation with our counter staff.'
    },
    {
      q: 'What is your guarantee on spare parts authenticity and fitment?',
      a: 'All our wheel cylinders, master cylinders, brake hoses, and cables are brand new, genuine quality parts. In the rare case of fitment incompatibility, we offer an immediate replacement at our Kirinyaga Crescent counter.'
    }
  ];

  return (
    <section className="bg-white border-t border-slate-200 py-10 px-3 sm:px-6 lg:px-8 space-y-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HERO CONVERSION BANNER: "Can't Find Your Part? Send Photo on WhatsApp" */}
        <div className="bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#0A192F] text-white rounded-2xl p-5 sm:p-8 shadow-xl border border-slate-700 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
            
            <div className="space-y-3 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                <Camera className="w-3.5 h-3.5" />
                <span>Instant Photo Fitment Verification</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-['Chivo'] tracking-tight leading-tight">
                Can't find your exact part or OEM code?
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Snap a photo of your old part, sample, or vehicle chassis number and send it to our Kirinyaga Crescent counter desk. We'll cross-reference our stock and quote you in <strong className="text-white font-bold">under 5 minutes</strong>.
              </p>
              
              {/* Trust highlights */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Room B13 Counter Staff Standing By</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>100% Fitment Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Countrywide Garage Delivery</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0">
              <a
                href={photoInquiryWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer min-h-[46px]"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp Sample Photo</span>
              </a>

              <a
                href={`tel:${PRIMARY_PHONE_TEL}`}
                className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[46px]"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call {PRIMARY_PHONE_DISPLAY}</span>
              </a>
            </div>

          </div>
        </div>

        {/* 4 CORE CUSTOMER TRUST PILLARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-[#0A192F]">100% Fitment Guarantee</h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                Every cylinder and hydraulic line matches genuine OEM specs. Immediate exchange if parts do not fit your vehicle.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-[#0A192F]">Countrywide Dispatch</h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                Daily parcel dispatch via Easy Coach, 2NK, North Rift, Modern Coast to mechanics and garages in any Kenyan town.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-[#0A192F]">CBD Counter Pickup</h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                Walk into Room B13, Kirinyaga Crescent (opposite Seventies Plaza). Pick up your parts immediately in Nairobi CBD.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#0A192F] text-white flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-[#0A192F]">Direct Sales Desk</h3>
              <p className="text-[11px] text-slate-600 leading-snug">
                Dedicated counter hotlines: <span className="font-mono font-bold text-slate-900">{PRIMARY_PHONE_DISPLAY}</span> / <span className="font-mono font-bold text-slate-900">{SECONDARY_PHONE_1_DISPLAY}</span>.
              </p>
            </div>
          </div>
        </div>

        {/* QUICK OEM CROSS-REFERENCE TABLE FOR MECHANICS & WORKSHOPS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-mono font-bold text-blue-800 uppercase tracking-wider">
                Kirinyaga Road Counter Stock • Nairobi
              </span>
              <h2 className="text-xl font-black text-[#0A192F] font-['Chivo'] mt-0.5">
                Quick OEM Cross-Reference Table
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                Fast reference list of stocked spare parts at Room B13, Kirinyaga Crescent. Cross-reference by OEM code, YB number, or vehicle model.
              </p>
            </div>

            {/* Quick filter input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={directoryFilter}
                onChange={(e) => setDirectoryFilter(e.target.value)}
                placeholder="Filter by OEM or car (e.g. Canter, 47201)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* Clean Table with Microdata */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-mono text-[11px] border-b border-slate-200 uppercase">
                  <th className="py-2.5 px-3 font-bold">Part & Description</th>
                  <th className="py-2.5 px-3 font-bold">YB Number</th>
                  <th className="py-2.5 px-3 font-bold">OEM Code</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold text-right">Counter Price</th>
                  <th className="py-2.5 px-3 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDirectoryParts.slice(0, 30).map((part) => {
                  const waUrl = buildWhatsAppPartOrderUrl(part);
                  return (
                    <tr 
                      key={part.id}
                      itemScope 
                      itemType="https://schema.org/Product"
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectPart?.(part)}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 group-hover:text-blue-900 leading-snug" itemProp="name">
                          {part.itemName}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1" itemProp="description">
                          {part.des}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-950 whitespace-nowrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200" itemProp="sku">
                          {part.ybNo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap" itemProp="mpn">
                        {part.oem}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap" itemProp="category">
                        {part.category}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right whitespace-nowrap" itemProp="offers" itemScope itemType="https://schema.org/Offer">
                        <meta itemProp="priceCurrency" content="KES" />
                        <meta itemProp="price" content={part.priceKes.toString()} />
                        <meta itemProp="availability" content={part.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"} />
                        KES {part.priceKes.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors"
                          title="WhatsApp inquiry for this part"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredDirectoryParts.length > 30 && (
            <div className="text-center pt-2 text-xs text-slate-500">
              Showing top 30 parts of {filteredDirectoryParts.length} in this view. Use search above to find any item in stock.
            </div>
          )}
        </div>

        {/* CUSTOMER & MECHANIC FAQ ACCORDION (AI SEARCH OPTIMIZED) */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-7 space-y-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-blue-800 uppercase tracking-wider">
              Customer Help & Garage Inquiries
            </span>
            <h2 className="text-xl font-black text-[#0A192F] font-['Chivo'] mt-0.5">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Common questions from drivers, mechanics, and fleet managers in Nairobi and across Kenya.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-[#0A192F] hover:text-blue-900 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
