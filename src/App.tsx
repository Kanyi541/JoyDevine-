import React, { useState, useEffect } from 'react';
import { JoyDevineHeader } from './components/JoyDevineHeader';
import { CustomerCatalog } from './components/CustomerCatalog';
import { CustomerAiDirectorySection } from './components/CustomerAiDirectorySection';
import { MobileCustomerActionBar } from './components/MobileCustomerActionBar';
import { SeoStructuredData } from './components/SeoStructuredData';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CustomerCartModal, CartItem } from './components/CustomerCartModal';
import { LocationAndContactSection } from './components/LocationAndContactSection';
import { POSView } from './components/POSView';
import { AutoPart } from './types';
import { 
  PRIMARY_PHONE_DISPLAY, 
  PRIMARY_PHONE_TEL, 
  SECONDARY_PHONE_1_DISPLAY, 
  SECONDARY_PHONE_1_TEL, 
  SECONDARY_PHONE_2_DISPLAY, 
  SECONDARY_PHONE_2_TEL 
} from './services/whatsappService';
import { 
  getStoredParts, 
  subscribeToPartsCatalog, 
  subscribeToDatabaseStatus,
  fetchDirectlyFromFirebase 
} from './services/inventoryStorage';

export const App: React.FC = () => {
  // Check if URL was requested as /pos, #pos, /#/pos, or ?pos
  const checkIsPOSRoute = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path === '/pos' ||
      path === '/pos/' ||
      path.startsWith('/pos/') ||
      path.endsWith('/pos') ||
      path.includes('pos') ||
      path === '/admin' ||
      hash.includes('pos') ||
      search.includes('pos')
    );
  };

  const [isPOSView, setIsPOSView] = useState<boolean>(checkIsPOSRoute());
  const [parts, setParts] = useState<AutoPart[]>(getStoredParts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartForModal, setSelectedPartForModal] = useState<AutoPart | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);

  // Cart State (Persisted in LocalStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem('joydevine_customer_cart_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('joydevine_customer_cart_v1', JSON.stringify(cartItems));
  }, [cartItems]);

  // Sync route on popstate, hashchange, or manual URL navigation and listen to Firestore
  useEffect(() => {
    // Start real-time Firestore database sync
    const unsubscribeParts = subscribeToPartsCatalog((firestoreParts) => {
      setParts(firestoreParts);
    });

    const unsubscribeStatus = subscribeToDatabaseStatus((status) => {
      setIsFirebaseConnected(status.isConnected);
    });

    const handleLocationChange = () => {
      setIsPOSView(checkIsPOSRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    
    // Regular check in case history is updated externally without triggering popstate
    const interval = setInterval(() => {
      const isRoutePOS = checkIsPOSRoute();
      setIsPOSView((current) => (current !== isRoutePOS ? isRoutePOS : current));
    }, 500);

    return () => {
      unsubscribeParts();
      unsubscribeStatus();
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      clearInterval(interval);
    };
  }, []);

  const handleBackToShop = () => {
    setIsPOSView(false);
    window.history.pushState(null, '', '/');
  };

  const handleOpenPOS = () => {
    setIsPOSView(true);
    window.history.pushState(null, '', '/pos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefreshCatalog = () => {
    fetchDirectlyFromFirebase().catch(() => {
      setParts(getStoredParts());
    });
  };

  const handleAddToCart = (part: AutoPart) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      if (existing) {
        return prev.map((item) =>
          item.part.id === part.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { part, quantity: 1 }];
    });
  };

  const handleUpdateCartQty = (partId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.part.id === partId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (partId: string) => {
    setCartItems((prev) => prev.filter((item) => item.part.id !== partId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartTotalKes = cartItems.reduce(
    (sum, item) => sum + item.part.priceKes * item.quantity,
    0
  );

  const cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // If URL route is /pos, show POS View exclusively with its own management header
  if (isPOSView) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 font-['Plus_Jakarta_Sans']">
        <POSView
          onBackToShop={handleBackToShop}
          onCatalogUpdated={handleRefreshCatalog}
        />
      </div>
    );
  }

  // Otherwise, render the customer storefront
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-[#0A192F] selection:text-white">
      
      {/* Dynamic SEO, OpenGraph & AI Search Engine Structured Data Injection */}
      <SeoStructuredData parts={parts} searchQuery={searchQuery} />

      {/* Universal Header with Navigation, WhatsApp, Cart, and Live Search */}
      <JoyDevineHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartItemsCount}
        cartTotalKes={cartTotalKes}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPOS={handleOpenPOS}
      />

      {/* Storefront Main Content */}
      <main className="flex-1">
        {/* Spare parts catalog with photos and descriptions directly from database */}
        <CustomerCatalog
          parts={parts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={handleAddToCart}
          onQuickView={(part) => setSelectedPartForModal(part)}
        />

        {/* Customer Trust, WhatsApp Photo Quote & AI Crawlable Directory Section */}
        <CustomerAiDirectorySection
          parts={parts}
          onSelectPart={(part) => setSelectedPartForModal(part)}
          onFilterCategory={(cat) => setSearchQuery(cat === 'All Parts' ? '' : cat)}
        />

        {/* Kirinyaga Road Location, Map, and Contacts */}
        <LocationAndContactSection />
      </main>

      {/* Mobile Sticky Quick Action Dock (Call, Photo Quote, Cart) */}
      <MobileCustomerActionBar
        cartCount={cartItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Technical Specs Modal */}
      <ProductDetailModal
        part={selectedPartForModal}
        onClose={() => setSelectedPartForModal(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Shopping Cart Drawer */}
      <CustomerCartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Footer: Deep Navy Blue & White */}
      <footer className="bg-[#0A192F] text-slate-300 border-t border-[#14284B] py-10 pb-24 md:pb-10 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: Brand & Physical Room */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <img 
                  src="/joydevine-logo.png" 
                  alt="JoyDivine Auto Spares Logo" 
                  className="w-10 h-10 object-contain rounded-full border border-blue-400/30 shadow-xs shrink-0 bg-white"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-white font-['Chivo'] tracking-tight">
                      JOYDIVINE AUTO SPARES
                    </span>
                    <span className="text-[10px] bg-white text-[#0A192F] px-1.5 py-0.5 rounded font-mono font-black">
                      ROOM B13
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Direct importer and counter retailer of genuine brake wheel cylinders, hydraulic master cylinders, heavy-duty shock boots, brake hoses, and control cables in Nairobi Central Business District.
              </p>
              <div className="text-slate-400 text-[11px] font-medium">
                Kirinyaga Crescent, opposite Seventies Plaza (Room B13), Nairobi, Kenya.
              </div>
            </div>

            {/* Col 2: Core Product Lines */}
            <div className="space-y-2">
              <h4 className="text-white font-bold font-mono uppercase text-xs">Featured Lines</h4>
              <ul className="space-y-1.5 text-slate-400 text-xs">
                <li>Wheel Cylinders & Calipers</li>
                <li>Brake Master Cylinders</li>
                <li>Clutch Master & Slave Cylinders</li>
                <li>Hydraulic Brake & Clutch Lines</li>
                <li>Shock Boots & Bellows</li>
                <li>Accelerator & Handbrake Cables</li>
              </ul>
            </div>

            {/* Col 3: Counter Hotlines */}
            <div className="space-y-3">
              <h4 className="text-white font-bold font-mono uppercase text-xs">Counter Contacts</h4>
              <div className="space-y-1.5 text-xs">
                <a 
                  href={`tel:${PRIMARY_PHONE_TEL}`} 
                  className="block text-emerald-400 hover:text-emerald-300 font-mono font-bold"
                  title="Call Main Hotline"
                >
                  Primary Hotline: {PRIMARY_PHONE_DISPLAY}
                </a>
                <a 
                  href={`tel:${SECONDARY_PHONE_1_TEL}`} 
                  className="block text-slate-300 hover:text-white font-mono"
                  title="Call Secondary Counter Line"
                >
                  Secondary Line: {SECONDARY_PHONE_1_DISPLAY}
                </a>
                <a 
                  href={`tel:${SECONDARY_PHONE_2_TEL}`} 
                  className="block text-slate-300 hover:text-white font-mono"
                  title="Call Sales Desk"
                >
                  Counter Desk: {SECONDARY_PHONE_2_DISPLAY}
                </a>
                <div className="text-slate-400 text-[11px] pt-1">
                  Hours: Mon - Sat 7:30 AM - 6:30 PM
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Area */}
          <div className="pt-6 border-t border-[#14284B] flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <div>
              © {new Date().getFullYear()} JoyDivine Auto Spares. All rights reserved. Kirinyaga Crescent, opposite Seventies Plaza, Nairobi.
            </div>
            <div className="flex items-center gap-3">
              <span>Genuine Auto Spares Nairobi</span>
              <span>•</span>
              <span>Room B13 Kirinyaga Crescent</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default App;
