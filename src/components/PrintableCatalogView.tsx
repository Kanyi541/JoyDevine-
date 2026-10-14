import React from 'react';
import { AutoPart } from '../types';
import { getAbsoluteImageUrl, getCategoryDefaultImage } from '../services/productImageService';
import { PRIMARY_PHONE_DISPLAY, SECONDARY_PHONE_1_DISPLAY } from '../services/whatsappService';
import { ShieldCheck, GeoAlt, Telephone } from 'react-bootstrap-icons';

interface PrintableCatalogViewProps {
  parts: AutoPart[];
  category: string;
}

export const PrintableCatalogView: React.FC<PrintableCatalogViewProps> = ({ parts, category }) => {
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div id="print-view-container" className="hidden print:block">
      <style>{`
        @media print {
          body > :not(#print-view-container) { display: none !important; }
          #print-view-container { display: block !important; position: static !important; }
          
          .booklet-cover-page {
            page-break-after: always !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            padding: 20mm !important;
            background: #0A192F !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .booklet-catalog-page {
            page-break-before: always !important;
            padding: 10mm !important;
          }
          .part-card {
            break-inside: avoid !important;
            border: 1px solid #e2e8f0 !important;
            padding: 10px !important;
            margin-bottom: 10px !important;
            display: block !important;
          }
          @page { size: A4 portrait; margin: 0mm; }
        }
      `}</style>

      {/* Cover Page */}
      <div className="booklet-cover-page">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-black uppercase">JoyDivine Auto Spares</h1>
          <p className="text-xl">Official Product Catalogue - {currentDate}</p>
          <div className="mt-20 space-y-4">
             <ShieldCheck className="w-20 h-20 mx-auto text-amber-400" />
             <p className="text-lg">Specialists in Master Cylinders, Wheel Cylinders, Hoses & Cables</p>
          </div>
        </div>
        <div className="text-sm font-mono text-center">
            <p>Room B13, Kirinyaga Crescent, Nairobi</p>
            <p>Hotline: {PRIMARY_PHONE_DISPLAY}</p>
        </div>
      </div>

      {/* Catalog Pages */}
      <div className="booklet-catalog-page">
        <h2 className="text-2xl font-bold mb-6 border-b pb-2">Inventory: {category} ({parts.length} items)</h2>
        <div className="grid grid-cols-2 gap-4">
          {parts.map((part) => (
            <div key={part.id} className="part-card">
              <img 
                src={getAbsoluteImageUrl(part.imageUrl) || getCategoryDefaultImage(part.category)} 
                alt={part.itemName} 
                className="w-full h-32 object-contain"
              />
              <h3 className="font-bold text-sm mt-2">{part.itemName}</h3>
              <p className="text-xs text-slate-600">{part.des}</p>
              <div className="flex justify-between mt-2 text-xs font-mono">
                <span>OEM: {part.oem}</span>
                <span className="font-bold">KES {part.priceKes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
