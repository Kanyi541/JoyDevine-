import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Plus, 
  Package, 
  ShoppingCart, 
  FileText, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Search, 
  Sparkles, 
  Image as ImageIcon, 
  Printer, 
  AlertTriangle, 
  RefreshCw, 
  Key, 
  DollarSign, 
  LogOut,
  X,
  Layers,
  ArrowRight,
  Store,
  CreditCard,
  Warehouse,
  Upload,
  Folder,
  Cloud,
  Database,
  FolderCheck
} from 'lucide-react';
import { AutoPart, POSSaleItem, POSSaleRecord } from '../types';
import { 
  getStoredParts, 
  savePart, 
  deletePart, 
  updateStockLevel, 
  recordPOSSale, 
  getSalesHistory, 
  findSavedImageForPart, 
  getStoredImages, 
  checkAdminAuth, 
  setAdminAuth, 
  verifyAdminPassword, 
  updateAdminPassword,
  subscribeToPartsCatalog,
  subscribeToDatabaseStatus,
  fetchDirectlyFromFirebase,
  seedFirestoreParts,
  DatabaseStatus
} from '../services/inventoryStorage';
import { 
  uploadProductImage, 
  fetchAvailableProductImages, 
  ProductImageItem 
} from '../services/productImageService';
import { JOYDEVINE_CATEGORIES } from '../data/joydevineParts';

interface POSViewProps {
  onBackToShop: () => void;
  onCatalogUpdated: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ onBackToShop, onCatalogUpdated }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(checkAdminAuth());
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'cashier' | 'register' | 'history'>('cashier');

  // Inventory / Stock Registration Form State
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [ybNo, setYbNo] = useState('');
  const [oem, setOem] = useState('');
  const [des, setDes] = useState('');
  const [category, setCategory] = useState(JOYDEVINE_CATEGORIES[1]);
  const [priceKes, setPriceKes] = useState<number | ''>(2800);
  const [buyingPriceKes, setBuyingPriceKes] = useState<number | ''>(1800);
  const [stock, setStock] = useState<number | ''>(10);
  const [imageUrl, setImageUrl] = useState('');
  const [condition, setCondition] = useState<'Brand New' | 'OEM Replacement' | 'Heavy Duty'>('Brand New');
  const [imageAutoDetected, setImageAutoDetected] = useState(false);
  const [showImageLibraryModal, setShowImageLibraryModal] = useState(false);

  // Live Parts & Search
  const [parts, setParts] = useState<AutoPart[]>(getStoredParts());
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilterLowStock, setInventoryFilterLowStock] = useState(false);

  // Firebase Database Sync State
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    isLive: true,
    isConnected: true,
    isSyncing: false,
    lastSyncTime: null,
    partCount: parts.length,
    salesCount: 0,
    source: 'Firebase Firestore',
    error: null,
  });
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Image Upload to productsimg State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [availableImages, setAvailableImages] = useState<ProductImageItem[]>([]);

  // Subscribe to live Firestore changes and load available images
  useEffect(() => {
    const unsubParts = subscribeToPartsCatalog((updated) => {
      setParts(updated);
    });
    const unsubStatus = subscribeToDatabaseStatus((st) => {
      setDbStatus(st);
    });
    fetchAvailableProductImages().then(setAvailableImages);

    return () => {
      unsubParts();
      unsubStatus();
    };
  }, []);

  // Explicit sync from Firebase Firestore
  const handleSyncFromFirebase = async () => {
    setIsSyncingFirebase(true);
    setSyncFeedback(null);
    try {
      const fetched = await fetchDirectlyFromFirebase();
      setParts(fetched);
      onCatalogUpdated();
      setSyncFeedback(`✅ Direct fetch verified: ${fetched.length} parts loaded from Google Cloud Firestore!`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback(`⚠️ Fetch notice: ${err.message || 'Error connecting to Firestore'}`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Sync / Migrate all catalog parts to productsimg paths in Firestore
  const handleSeedWithProductsImg = async () => {
    if (!window.confirm('Update all catalog records in Firestore to source images directly from the /productsimg/ folder?')) return;
    setIsSyncingFirebase(true);
    try {
      await seedFirestoreParts(true);
      const fetched = await fetchDirectlyFromFirebase();
      setParts(fetched);
      onCatalogUpdated();
      setSyncFeedback('✅ Successfully updated Firestore database with productsimg folder references!');
      setTimeout(() => setSyncFeedback(null), 6000);
    } catch (err: any) {
      setSyncFeedback(`⚠️ Update error: ${err.message}`);
      setTimeout(() => setSyncFeedback(null), 5000);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Upload image to public/productsimg/
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setUploadSuccessMsg(null);
    try {
      const res = await uploadProductImage(file);
      setImageUrl(res.url);
      setImageAutoDetected(false);
      setUploadSuccessMsg(`Saved to productsimg: ${res.filename}`);
      const refreshed = await fetchAvailableProductImages();
      setAvailableImages(refreshed);
      setTimeout(() => setUploadSuccessMsg(null), 5000);
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // POS Cashier Ticket State
  const [cashierSearch, setCashierSearch] = useState('');
  const [ticketItems, setTicketItems] = useState<POSSaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'M-PESA' | 'CASH' | 'CARD' | 'CREDIT/INVOICE'>('M-PESA');
  const [mpesaRef, setMpesaRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [completedSale, setCompletedSale] = useState<POSSaleRecord | null>(null);

  // Password Management
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMessage, setPassMessage] = useState({ text: '', isError: false });

  // Refresh parts
  const refreshPartsList = () => {
    const updated = getStoredParts();
    setParts(updated);
    onCatalogUpdated();
  };

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(passwordInput)) {
      setAdminAuth(true);
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
    } else {
      setAuthError('Incorrect counter password. Default password is joydevine2026');
    }
  };

  const handleLogout = () => {
    setAdminAuth(false);
    setIsAuthenticated(false);
  };

  // Automatic Image Reflection when typing YB No or OEM or Item Name
  const checkAndReflectImage = (query: { ybNo?: string; oem?: string; itemName?: string }) => {
    const foundImage = findSavedImageForPart(query);
    if (foundImage) {
      setImageUrl(foundImage);
      setImageAutoDetected(true);
    }
  };

  const handleYbNoChange = (val: string) => {
    setYbNo(val);
    if (val.trim().length >= 3) {
      checkAndReflectImage({ ybNo: val.trim() });
    }
  };

  const handleOemChange = (val: string) => {
    setOem(val);
    if (val.trim().length >= 3) {
      checkAndReflectImage({ oem: val.trim() });
    }
  };

  const handleItemNameChange = (val: string) => {
    setItemName(val);
    if (val.trim().length >= 4) {
      checkAndReflectImage({ itemName: val.trim() });
    }
  };

  // Populate form for editing
  const handleEditPart = (part: AutoPart) => {
    setEditingPartId(part.id);
    setItemName(part.itemName);
    setYbNo(part.ybNo);
    setOem(part.oem);
    setDes(part.des);
    setCategory(part.category);
    setPriceKes(part.priceKes);
    setBuyingPriceKes(part.buyingPriceKes || '');
    setStock(part.stock);
    setImageUrl(part.imageUrl);
    setCondition(part.condition);
    setImageAutoDetected(false);
    setActiveTab('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset form
  const handleResetForm = () => {
    setEditingPartId(null);
    setItemName('');
    setYbNo('');
    setOem('');
    setDes('');
    setCategory(JOYDEVINE_CATEGORIES[1]);
    setPriceKes(2800);
    setBuyingPriceKes(1800);
    setStock(10);
    setImageUrl('');
    setCondition('Brand New');
    setImageAutoDetected(false);
  };

  // Save/Update Part
  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !ybNo || !oem || !des.trim() || priceKes === '') {
      alert('Please fill all mandatory fields: Item Name, YB No, OEM, Product Description (DES), and Selling Price.');
      return;
    }

    const fallbackImg = imageUrl || 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=800&q=80';

    await savePart({
      id: editingPartId || undefined,
      itemName: itemName.trim(),
      ybNo: ybNo.trim().toUpperCase(),
      oem: oem.trim().toUpperCase(),
      des: des.trim(),
      category,
      brand: 'JoyDevine / OEM',
      priceKes: Number(priceKes),
      buyingPriceKes: buyingPriceKes !== '' ? Number(buyingPriceKes) : undefined,
      stock: stock !== '' ? Number(stock) : 0,
      imageUrl: fallbackImg,
      condition,
      warrantyMonths: 12,
    });

    handleResetForm();
    refreshPartsList();
    alert(editingPartId ? 'Stock updated successfully!' : 'New auto part registered into Room B13 inventory!');
  };

  const handleDeletePart = async (id: string, name: string) => {
    if (confirm(`Remove "${name}" permanently from inventory?`)) {
      await deletePart(id);
      refreshPartsList();
    }
  };

  // Cashier Ticket Functions
  const handleAddToTicket = (part: AutoPart) => {
    setTicketItems((prev) => {
      const existing = prev.find((item) => item.part.id === part.id);
      if (existing) {
        return prev.map((item) =>
          item.part.id === part.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotalKes: (item.quantity + 1) * item.unitPriceKes,
              }
            : item
        );
      }
      return [
        ...prev,
        {
          part,
          quantity: 1,
          unitPriceKes: part.priceKes,
          subtotalKes: part.priceKes,
        },
      ];
    });
  };

  const handleUpdateTicketQty = (partId: string, delta: number) => {
    setTicketItems((prev) =>
      prev
        .map((item) => {
          if (item.part.id === partId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0
              ? {
                  ...item,
                  quantity: nextQty,
                  subtotalKes: nextQty * item.unitPriceKes,
                }
              : null;
          }
          return item;
        })
        .filter(Boolean) as POSSaleItem[]
    );
  };

  const handleRemoveFromTicket = (partId: string) => {
    setTicketItems((prev) => prev.filter((item) => item.part.id !== partId));
  };

  const handleClearTicket = () => {
    setTicketItems([]);
    setMpesaRef('');
    setCustomerName('');
    setCustomerPhone('');
  };

  const ticketTotalKes = ticketItems.reduce((sum, item) => sum + item.subtotalKes, 0);

  const handleCompleteCheckout = async () => {
    if (ticketItems.length === 0) return;

    if (paymentMethod === 'M-PESA' && !mpesaRef) {
      if (!confirm('M-PESA transaction reference code is empty. Proceed with counter cash checkout instead?')) {
        return;
      }
    }

    const saleRecord = await recordPOSSale({
      items: ticketItems,
      totalKes: ticketTotalKes,
      paymentMethod,
      mpesaRef: mpesaRef.trim().toUpperCase() || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      cashierName: 'Counter Cashier (Room B13)',
    });

    refreshPartsList();
    setCompletedSale(saleRecord);
    handleClearTicket();
  };

  const handleUpdatePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(oldPass)) {
      updateAdminPassword(newPass);
      setPassMessage({ text: 'Counter admin password updated successfully!', isError: false });
      setOldPass('');
      setNewPass('');
      setTimeout(() => setShowPassModal(false), 2000);
    } else {
      setPassMessage({ text: 'Old password does not match.', isError: true });
    }
  };

  // If not logged in, render clean Navy & White authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-[#0A192F] text-white rounded-xl flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-7 h-7 text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-[#0A192F] font-['Chivo'] uppercase tracking-tight">
              JOYDEVINE COUNTER POS
            </h2>
            <p className="text-xs text-slate-500">
              Room B13, Kirinyaga Road, Nairobi • Restricted Staff Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Counter Admin Password:
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter access password..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 font-mono"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-[#0A192F] hover:bg-[#132A4D] text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Sign In to Counter Terminal
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Default access: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono font-bold">joydevine2026</code></span>
            <button
              onClick={onBackToShop}
              className="text-blue-700 hover:text-blue-900 font-bold hover:underline"
            >
              Back to Shop
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Authenticated: Full POS Workspace
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      
      {/* Top POS Management Bar: Deep Navy Blue */}
      <div className="bg-[#0A192F] text-white border-b border-[#14284B] px-4 sm:px-6 lg:px-8 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center font-black font-mono text-sm">
              B13
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-sm sm:text-base font-['Chivo'] tracking-wide">
                  JOYDEVINE AUTO SPARES • COUNTER POS
                </h1>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kirinyaga Road, Nairobi CBD • Counter Cashier Terminal
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('cashier')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'cashier'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#14284B] text-slate-300 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cashier Ticket</span>
              {ticketItems.length > 0 && (
                <span className="bg-white text-[#0A192F] text-[10px] font-black px-1.5 rounded-full">
                  {ticketItems.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#14284B] text-slate-300 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stock Registration</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#14284B] text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sales Audit</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            {/* Quick Action Buttons */}
            <button
              onClick={() => setShowPassModal(true)}
              title="Change POS Password"
              className="p-1.5 rounded bg-[#14284B] hover:bg-[#1E3A6B] text-slate-300 hover:text-white transition-colors"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="Lock Counter POS"
              className="p-1.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              onClick={onBackToShop}
              className="ml-2 text-xs font-bold text-blue-300 hover:text-white underline cursor-pointer"
            >
              Shop Front →
            </button>
          </div>

        </div>
      </div>

      {/* Google Cloud Firestore Live Status Bar */}
      <div className="bg-[#0c1f38] text-slate-200 border-b border-[#18365f] px-4 sm:px-6 lg:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded border border-slate-700">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className={`w-2 h-2 rounded-full ${dbStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="font-mono font-bold text-white">
                {dbStatus.isConnected ? 'Google Cloud Firestore LIVE' : 'Connecting to Firestore...'}
              </span>
            </div>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300 font-mono text-[11px]">
              Project: <span className="text-blue-300">gen-lang-client-0619428861</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">
              Collection: <span className="font-mono font-bold text-emerald-400">parts</span> ({parts.length} items)
            </span>
            {dbStatus.lastSyncTime && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400 text-[11px]">Last fetch: {dbStatus.lastSyncTime}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncFromFirebase}
              disabled={isSyncingFirebase}
              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-[11px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
              title="Query parts directly from Google Cloud Firestore"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingFirebase ? 'animate-spin' : ''}`} />
              <span>{isSyncingFirebase ? 'Fetching from Cloud...' : 'Verify Cloud Fetch'}</span>
            </button>

            <button
              onClick={handleSeedWithProductsImg}
              disabled={isSyncingFirebase}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-[11px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
              title="Sync all parts to use /productsimg/ folder paths"
            >
              <FolderCheck className="w-3 h-3" />
              <span>Sync productsimg to Cloud</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="max-w-7xl mx-auto mt-2 p-2 bg-emerald-900/90 border border-emerald-500 rounded text-emerald-100 text-xs font-medium flex items-center justify-between animate-fadeIn">
            <span>{syncFeedback}</span>
            <button onClick={() => setSyncFeedback(null)} className="text-emerald-300 hover:text-white ml-2 text-xs">✕ Dismiss</button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: CASHIER COUNTER REGISTER */}
        {activeTab === 'cashier' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Quick Search & Parts Selector (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0A192F] uppercase tracking-wider font-mono">
                    Counter Parts Lookup
                  </h3>
                  <span className="text-xs text-slate-500">
                    Click part to add to sale ticket
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={cashierSearch}
                    onChange={(e) => setCashierSearch(e.target.value)}
                    placeholder="Search by YB No, OEM Code, or Part Name..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                    autoFocus
                  />
                </div>
              </div>

              {/* Fast Lookup Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {parts
                  .filter((p) => {
                    const q = cashierSearch.toLowerCase();
                    return (
                      p.itemName.toLowerCase().includes(q) ||
                      p.ybNo.toLowerCase().includes(q) ||
                      p.oem.toLowerCase().includes(q) ||
                      p.des.toLowerCase().includes(q)
                    );
                  })
                  .map((part) => (
                    <div
                      key={part.id}
                      onClick={() => handleAddToTicket(part)}
                      className="bg-white border border-slate-200 hover:border-blue-600 rounded-xl p-3 flex gap-3 cursor-pointer shadow-sm hover:shadow transition-all group"
                    >
                      <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center shrink-0">
                        <img
                          src={part.imageUrl}
                          alt={part.itemName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-mono font-bold text-white bg-[#0A192F] px-1.5 py-0.2 rounded">
                            {part.ybNo}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 truncate">
                            {part.oem}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 truncate mt-1 group-hover:text-blue-800">
                          {part.itemName}
                        </h4>
                        <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-100">
                          <span className="text-xs font-bold text-blue-900 font-mono">
                            KES {part.priceKes.toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1">
                            {part.stock < 5 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                Low Stock
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">
                              Stock: <strong className={part.stock < 5 ? 'text-amber-700 font-bold' : 'text-slate-800'}>{part.stock}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Counter Sales Ticket & Checkout (5 Cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-5 space-y-4 sticky top-16">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="font-black text-sm text-[#0A192F] uppercase tracking-wider font-mono">
                      Current Sales Ticket
                    </h3>
                    <span className="text-[11px] text-slate-500">Room B13 Counter Register</span>
                  </div>
                  {ticketItems.length > 0 && (
                    <button
                      onClick={handleClearTicket}
                      className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>

                {/* Ticket Items List */}
                {ticketItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <ShoppingCart className="w-10 h-10 mx-auto opacity-30 text-slate-600" />
                    <p className="text-xs">Ticket is empty. Click any spare part on the left to add.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {ticketItems.map((item) => (
                      <div
                        key={item.part.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="font-bold text-[#0A192F]">{item.part.ybNo}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 truncate">{item.part.itemName}</span>
                          </div>
                          <span className="text-slate-500 font-mono text-[11px]">
                            KES {item.unitPriceKes.toLocaleString()} each
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center border border-slate-300 rounded bg-white">
                            <button
                              onClick={() => handleUpdateTicketQty(item.part.id, -1)}
                              className="px-2 py-0.5 font-bold hover:bg-slate-100"
                            >
                              -
                            </button>
                            <span className="px-1.5 font-mono font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateTicketQty(item.part.id, 1)}
                              className="px-2 py-0.5 font-bold hover:bg-slate-100"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-mono font-bold text-slate-900 w-16 text-right">
                            KES {item.subtotalKes.toLocaleString()}
                          </span>

                          <button
                            onClick={() => handleRemoveFromTicket(item.part.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals & Payment Method */}
                {ticketItems.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-600 uppercase font-mono">Ticket Total:</span>
                      <span className="text-2xl font-black text-[#0A192F] font-mono">
                        KES {ticketTotalKes.toLocaleString()}
                      </span>
                    </div>

                    {/* Payment Mode Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Tender Method:
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {(['M-PESA', 'CASH', 'CARD'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPaymentMethod(mode)}
                            className={`py-2 px-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                              paymentMethod === mode
                                ? 'bg-[#0A192F] text-white border-[#0A192F]'
                                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* M-PESA Code Input */}
                    {paymentMethod === 'M-PESA' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          M-PESA Reference Code:
                        </label>
                        <input
                          type="text"
                          value={mpesaRef}
                          onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                          placeholder="e.g. TKA48X92LM"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold uppercase focus:bg-white focus:outline-none focus:border-blue-700"
                        />
                      </div>
                    )}

                    {/* Customer Info (Optional) */}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer / Garage Name"
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-700"
                      />
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Customer Phone"
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:border-blue-700 font-mono"
                      />
                    </div>

                    {/* Complete Sale Button */}
                    <button
                      onClick={handleCompleteCheckout}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Complete Sale & Print Receipt</span>
                    </button>

                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: STOCK REGISTRATION (With Automatic Image Reflection) */}
        {activeTab === 'register' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Registration Form (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-base text-[#0A192F] font-['Chivo'] tracking-tight">
                    {editingPartId ? 'EDIT INVENTORY ITEM' : 'REGISTER NEW STOCK'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Inventory numbering: YB No, OEM Code, and Description (DES)
                  </p>
                </div>

                {editingPartId && (
                  <button
                    onClick={handleResetForm}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {/* Automatic Image Reflection Notice Banner */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-blue-950">Auto-Image Reflection Active:</strong>
                  <span>
                    Typing an existing <strong>YB No</strong>, <strong>OEM Code</strong>, or <strong>Item Name</strong> automatically recalls and attaches the photo you registered previously so you never have to re-upload it.
                  </span>
                </div>
              </div>

              <form onSubmit={handleSavePart} className="space-y-4">
                
                {/* Item Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => handleItemNameChange(e.target.value)}
                    placeholder="e.g. Brake Wheel Cylinder Assembly Rear RH"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                    required
                  />
                </div>

                {/* YB No and OEM Code (2 Columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      YB No (JoyDevine Inventory Code) *
                    </label>
                    <input
                      type="text"
                      value={ybNo}
                      onChange={(e) => handleYbNoChange(e.target.value)}
                      placeholder="e.g. YB-47550"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-700"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      Internal shop tag
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      OEM Code *
                    </label>
                    <input
                      type="text"
                      value={oem}
                      onChange={(e) => handleOemChange(e.target.value)}
                      placeholder="e.g. 47550-0K010"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-none focus:border-blue-700"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      Original manufacturer number
                    </span>
                  </div>
                </div>

                {/* DES: Product Description & Vehicle Compatibility */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Product Description & Compatibility (DES) *
                    </label>
                    <span className="text-[10px] text-blue-700 font-bold font-mono">
                      Shown on website & catalog
                    </span>
                  </div>
                  <textarea
                    value={des}
                    onChange={(e) => setDes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Fits Toyota Hilux KUN25/KUN26 (2005-2016), Fortuner, HiAce KDH200. Dual piston hydraulic rear wheel brake cylinder complete with bleeder screw."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    This description is stored with the product in the database and shown with the product image on the customer shop.
                  </span>
                </div>

                {/* Category & Condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                    >
                      {JOYDEVINE_CATEGORIES.filter((c) => c !== 'All Parts').map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                    >
                      <option value="Brand New">Brand New</option>
                      <option value="OEM Replacement">OEM Replacement</option>
                      <option value="Heavy Duty">Heavy Duty</option>
                    </select>
                  </div>
                </div>

                {/* Pricing & Stock (3 Columns) */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selling Price (KES) *
                    </label>
                    <input
                      type="number"
                      value={priceKes}
                      onChange={(e) => setPriceKes(e.target.value ? Number(e.target.value) : '')}
                      placeholder="2800"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-950 focus:bg-white focus:outline-none focus:border-blue-700"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cost / Buying Price (KES)
                    </label>
                    <input
                      type="number"
                      value={buyingPriceKes}
                      onChange={(e) => setBuyingPriceKes(e.target.value ? Number(e.target.value) : '')}
                      placeholder="1800"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 focus:bg-white focus:outline-none focus:border-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Current Stock (Room B13)
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                      placeholder="10"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>

                {/* Product Image Sourced from productsimg folder */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0A192F] flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-blue-700" />
                      <span>Product Image (Stored in productsimg)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="pos-product-image-upload"
                        className={`text-[11px] font-bold px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1 cursor-pointer transition-colors ${
                          isUploadingImage ? 'opacity-50 cursor-wait' : ''
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>{isUploadingImage ? 'Saving...' : 'Upload Image'}</span>
                      </label>
                      <input
                        id="pos-product-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => setShowImageLibraryModal(true)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Library ({availableImages.length})</span>
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageAutoDetected(false);
                    }}
                    placeholder="/productsimg/... or upload file above"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-700"
                  />

                  {uploadSuccessMsg && (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{uploadSuccessMsg}</span>
                    </div>
                  )}

                  {/* Active Image Preview Card */}
                  {imageUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200">
                      <div className="w-14 h-14 bg-slate-100 rounded border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/productsimg/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            {imageUrl.startsWith('/productsimg/') ? 'LOCAL FOLDER' : 'EXTERNAL URL'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono truncate">
                            {imageUrl}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Image is ready to be included in WhatsApp inquiries & catalog cards.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      No image selected. Upload a photo or select from the productsimg folder.
                    </div>
                  )}

                  {imageAutoDetected && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Previously registered image automatically matched & reflected!</span>
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#0A192F] hover:bg-[#132A4D] text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    {editingPartId ? 'Update Stock Item' : 'Save & Register into Room B13'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Clear Form
                  </button>
                </div>

              </form>

            </div>

            {/* Right: Live Registered Inventory List (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0A192F] uppercase tracking-wider font-mono">
                    Stocked Inventory ({parts.length})
                  </h3>
                  <button
                    onClick={refreshPartsList}
                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Filter by YB No or Name..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setInventoryFilterLowStock(!inventoryFilterLowStock)}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors border cursor-pointer ${
                      inventoryFilterLowStock
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                    title="Toggle Low Stock Filter (< 5)"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low Stock (&lt;5)</span>
                    <span className="ml-0.5 px-1 py-0.2 text-[9px] bg-white/30 rounded">
                      {parts.filter((p) => p.stock < 5).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {parts
                  .filter((p) => {
                    const matchesLow = !inventoryFilterLowStock || p.stock < 5;
                    const q = inventorySearch.toLowerCase();
                    const matchesText =
                      p.itemName.toLowerCase().includes(q) ||
                      p.ybNo.toLowerCase().includes(q) ||
                      p.oem.toLowerCase().includes(q);
                    return matchesLow && matchesText;
                  })
                  .map((part) => (
                    <div
                      key={part.id}
                      className={`p-3 bg-white border rounded-lg flex items-center justify-between gap-3 shadow-xs hover:border-slate-300 ${
                        part.stock <= 0
                          ? 'border-rose-300 bg-rose-50/30'
                          : part.stock < 5
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center shrink-0">
                        <img
                          src={part.imageUrl}
                          alt={part.itemName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold text-xs text-[#0A192F]">{part.ybNo}</span>
                          <span className="text-slate-400 text-[10px]">|</span>
                          <span className="text-slate-500 text-[11px] truncate">{part.oem}</span>
                          {part.stock < 5 && (
                            <span className="ml-1 text-[10px] font-sans font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                              Low Stock
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                          {part.itemName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                          <span className="font-bold text-blue-900">
                            KES {part.priceKes.toLocaleString()}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className={part.stock < 5 ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                            Stock: {part.stock} {part.stock < 5 ? '(Reorder Alert)' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditPart(part)}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit Part"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePart(part.id, part.itemName)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Part"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: SALES AUDIT & HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-base text-[#0A192F] font-['Chivo'] tracking-tight">
                  COUNTER SALES AUDIT LOG
                </h3>
                <p className="text-xs text-slate-500">
                  Transaction receipts recorded at Room B13 counter
                </p>
              </div>

              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200">
                Total Transactions: {getSalesHistory().length}
              </span>
            </div>

            {getSalesHistory().length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto opacity-30 text-slate-600" />
                <p className="text-xs">No sales recorded yet. Process sales in the Cashier Ticket tab.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Receipt No</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Items Sold</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">M-Pesa Ref</th>
                      <th className="py-2.5 px-3 text-right">Total (KES)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {getSalesHistory().map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-blue-900">{sale.receiptNumber}</td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(sale.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-sans">
                          {sale.items.map((i) => `${i.quantity}x ${i.part.ybNo}`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{sale.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-slate-600">{sale.mpesaRef || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#0A192F]">
                          KES {sale.totalKes.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => setCompletedSale(sale)}
                            className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* COMPLETED SALE / RECEIPT MODAL (Printable) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-[#0A192F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            
            <div className="bg-[#0A192F] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-400" />
                <span className="font-black text-sm font-['Chivo']">OFFICIAL COUNTER RECEIPT</span>
              </div>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div id="printable-receipt" className="p-6 bg-white font-mono text-xs space-y-4">
              
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h2 className="font-black text-base text-slate-900 font-['Chivo']">
                  JOYDEVINE AUTO SPARES
                </h2>
                <p className="text-[11px] text-slate-600">
                  Room B13, Kirinyaga Road, Nairobi<br />
                  Near Kirinyaga Crescent, Opp. Seventies Plaza<br />
                  Tel: 0720 357 361 / 0722 604 419
                </p>
              </div>

              <div className="text-[11px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Receipt No:</span>
                  <strong className="text-slate-900">{completedSale.receiptNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(completedSale.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Tender:</span>
                  <strong className="text-slate-900">{completedSale.paymentMethod}</strong>
                </div>
                {completedSale.mpesaRef && (
                  <div className="flex justify-between">
                    <span>M-PESA Ref:</span>
                    <strong className="text-slate-900">{completedSale.mpesaRef}</strong>
                  </div>
                )}
                {completedSale.customerName && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{completedSale.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="pt-2 border-t border-dashed border-slate-300">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-left pb-1">Item / YB</th>
                      <th className="text-center pb-1">Qty</th>
                      <th className="text-right pb-1">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedSale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1">
                          <div className="font-bold text-slate-900">{it.part.ybNo}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{it.part.itemName}</div>
                        </td>
                        <td className="text-center py-1">{it.quantity}</td>
                        <td className="text-right py-1 font-bold">
                          KES {it.subtotalKes.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t-2 border-slate-900 flex justify-between text-sm font-black text-slate-900">
                <span>TOTAL PAID:</span>
                <span>KES {completedSale.totalKes.toLocaleString()}</span>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-3 border-t border-dashed border-slate-300">
                Thank you for choosing JoyDevine Auto Spares!<br />
                Goods once sold in good condition are not returnable without receipt.
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#0A192F] hover:bg-[#132A4D] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* IMAGE LIBRARY PICKER MODAL */}
      {showImageLibraryModal && (
        <div className="fixed inset-0 z-50 bg-[#0A192F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="bg-[#0A192F] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">Product Images in /public/productsimg/</h3>
                  <p className="text-[11px] text-slate-400">
                    Direct local storage on server • Fast offline loading and WhatsApp previews
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImageLibraryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider">
                    Files in productsimg ({availableImages.length})
                  </span>
                  <label
                    htmlFor="modal-upload-input"
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload New Image Here</span>
                  </label>
                  <input
                    id="modal-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      await handleImageFileUpload(e);
                    }}
                    className="hidden"
                  />
                </div>

                {availableImages.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No images found in /productsimg/. Use the upload button above to upload parts photos.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableImages.map((img) => (
                      <div
                        key={img.filename}
                        onClick={() => {
                          setImageUrl(img.url);
                          setImageAutoDetected(false);
                          setShowImageLibraryModal(false);
                        }}
                        className={`bg-slate-50 border rounded-lg p-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all hover:shadow-md hover:border-blue-600 group ${
                          imageUrl === img.url ? 'border-blue-700 ring-2 ring-blue-700/20 bg-blue-50/50' : 'border-slate-200'
                        }`}
                      >
                        <div className="w-full aspect-square bg-white rounded flex items-center justify-center p-1.5 border border-slate-100 overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.filename}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="w-full text-center">
                          <span className="text-[11px] font-mono font-bold text-slate-800 truncate block group-hover:text-blue-700">
                            {img.filename}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block truncate">
                            {img.url}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previously Remembered Parts */}
              {getStoredImages().length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wider block mb-2">
                    Previously Registered Part Matches ({getStoredImages().length})
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {getStoredImages().slice(0, 12).map((rec) => (
                      <div
                        key={rec.id}
                        onClick={() => {
                          setImageUrl(rec.imageUrl);
                          setImageAutoDetected(false);
                          setShowImageLibraryModal(false);
                        }}
                        className="bg-slate-50 border border-slate-200 hover:border-blue-700 rounded p-1.5 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                        title={rec.label}
                      >
                        <div className="w-full aspect-square bg-white rounded flex items-center justify-center p-1">
                          <img
                            src={rec.imageUrl}
                            alt={rec.label}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 truncate w-full text-center">
                          {rec.key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Location: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">/public/productsimg/</code>
              </span>
              <button
                onClick={() => setShowImageLibraryModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-[#0A192F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-[#0A192F]">Change POS Password</h3>
              <button onClick={() => setShowPassModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password:</label>
                <input
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password:</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                  required
                />
              </div>

              {passMessage.text && (
                <div className={`p-2 rounded text-xs ${passMessage.isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {passMessage.text}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#0A192F] hover:bg-[#132A4D] text-white rounded font-bold"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
