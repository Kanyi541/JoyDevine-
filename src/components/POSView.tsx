import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  PlusLg as Plus, 
  BoxSeam as Package, 
  Cart3 as ShoppingCart, 
  FileEarmarkText as FileText, 
  CheckCircleFill as CheckCircle2, 
  Trash3 as Trash2, 
  PencilSquare as Edit3, 
  Search, 
  Stars as Sparkles, 
  Image as ImageIcon, 
  Printer, 
  ExclamationTriangleFill as AlertTriangle, 
  ArrowRepeat as RefreshCw, 
  Key, 
  CurrencyDollar as DollarSign, 
  BoxArrowRight as LogOut, 
  XLg as X, 
  Layers, 
  ArrowRight, 
  Shop as Store, 
  CreditCard, 
  Building as Warehouse, 
  Upload, 
  Folder, 
  Cloud, 
  Database, 
  FolderCheck, 
  People as Users, 
  Person as User, 
  ShieldCheck, 
  Eye, 
  EyeSlash as EyeOff, 
  GraphUp as TrendingUp, 
  Receipt, 
  PersonCheck as UserCheck, 
  Camera, 
  Copy, 
  CardChecklist as ListPlus, 
  CheckLg as Check
} from 'react-bootstrap-icons';
import { AutoPart, POSSaleItem, POSSaleRecord, POSUser } from '../types';
import { 
  getStoredParts, 
  savePart, 
  batchSaveParts,
  deletePart, 
  updateStockLevel, 
  recordPOSSale, 
  getSalesHistory, 
  deleteSaleRecord,
  subscribeToSalesHistory,
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
  getCategoryDefaultImage,
  ProductImageItem 
} from '../services/productImageService';
import { 
  authenticatePOS, 
  getCurrentPOSUser, 
  logoutPOSUser, 
  isUserAdmin,
  ensureDefaultAdminExists,
  updatePOSUser
} from '../services/authService';
import { POSUserManagement } from './POSUserManagement';
import { migrateBase64ToStorage } from '../services/inventoryStorage';
import { JOYDEVINE_CATEGORIES, CATEGORY_DEFAULT_IMAGES } from '../data/joydevineParts';
import { PRIMARY_WHATSAPP_PHONE, PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_TEL } from '../services/whatsappService';

export interface BatchProductRow {
  rowId: string;
  itemName: string;
  ybNo: string;
  oem: string;
  des: string;
  priceKes: number | '';
  buyingPriceKes: number | '';
  stock: number | '';
  condition: 'Brand New' | 'OEM Replacement' | 'Heavy Duty';
}

const createEmptyBatchRow = (index: number, sampleDes = ''): BatchProductRow => ({
  rowId: `row-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
  itemName: '',
  ybNo: '',
  oem: '',
  des: sampleDes,
  priceKes: 2800,
  buyingPriceKes: 1800,
  stock: 10,
  condition: 'Brand New',
});

interface POSViewProps {
  onBackToShop: () => void;
  onCatalogUpdated: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ onBackToShop, onCatalogUpdated }) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<POSUser | null>(getCurrentPOSUser());
  const [usernameInput, setUsernameInput] = useState('Devine2026');
  const [passwordInput, setPasswordInput] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'cashier' | 'register' | 'history' | 'users'>('cashier');

  const isAdmin = isUserAdmin(currentUser);

  // Sales Tracking & Audit State
  const [salesRecords, setSalesRecords] = useState<POSSaleRecord[]>(getSalesHistory());
  const [salesSearch, setSalesSearch] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'ALL' | 'M-PESA' | 'CASH' | 'CARD'>('ALL');
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationMessage, setMigrationMessage] = useState('');

  // Inventory / Stock Registration Form State
  const [stockEntryMode, setStockEntryMode] = useState<'single' | 'batch'>('single');
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [ybNo, setYbNo] = useState('');
  const [oem, setOem] = useState('');
  const [des, setDes] = useState('');
  const [category, setCategory] = useState(JOYDEVINE_CATEGORIES[1]);
  const [priceKes, setPriceKes] = useState<number | ''>(2800);
  const [buyingPriceKes, setBuyingPriceKes] = useState<number | ''>(1800);
  const [stock, setStock] = useState<number | ''>(10);
  const [imageUrl, setImageUrl] = useState<string>(() => getCategoryDefaultImage(JOYDEVINE_CATEGORIES[1]));
  const [condition, setCondition] = useState<'Brand New' | 'OEM Replacement' | 'Heavy Duty'>('Brand New');
  const [imageAutoDetected, setImageAutoDetected] = useState(false);
  const [showImageLibraryModal, setShowImageLibraryModal] = useState(false);

  // Batch Multi-Product Entry State (Add more than one product of that category)
  const [batchCategory, setBatchCategory] = useState<string>(JOYDEVINE_CATEGORIES[1]);
  const [batchImageUrl, setBatchImageUrl] = useState<string>(() => getCategoryDefaultImage(JOYDEVINE_CATEGORIES[1]));
  const [batchRows, setBatchRows] = useState<BatchProductRow[]>([
    createEmptyBatchRow(1),
    createEmptyBatchRow(2),
  ]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [batchFeedback, setBatchFeedback] = useState<string | null>(null);

  // Live Parts & Search
  const [parts, setParts] = useState<AutoPart[]>(getStoredParts());
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('All Parts');
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

  // Delete Confirmation Dialog State (in-app modal to prevent iframe confirm blockage)
  const [partToDelete, setPartToDelete] = useState<AutoPart | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<POSSaleRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe to live Firestore changes and load available images
  useEffect(() => {
    ensureDefaultAdminExists().catch(() => {});

    const unsubParts = subscribeToPartsCatalog((updated) => {
      setParts(updated);
    });
    const unsubStatus = subscribeToDatabaseStatus((st) => {
      setDbStatus(st);
    });
    const unsubSales = subscribeToSalesHistory((sales) => {
      setSalesRecords(sales);
    });
    fetchAvailableProductImages().then(setAvailableImages);

    return () => {
      unsubParts();
      unsubStatus();
      unsubSales();
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

  // Drag-and-drop & URL input state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showAdvancedUrlInput, setShowAdvancedUrlInput] = useState(false);

  // Process & compress local image file directly for Firestore Database synchronization
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (e.g. JPG, PNG, WebP).');
      return;
    }
    setIsUploadingImage(true);
    setUploadSuccessMsg(null);
    try {
      const res = await uploadProductImage(file);
      setImageUrl(res.url);
      setImageAutoDetected(false);
      if (res.diagnostic) {
        setUploadSuccessMsg(
          `✓ Photo synced to database! Compressed from ${res.diagnostic.originalSizeKb} KB → ${res.diagnostic.compressedSizeKb} KB (Firestore ready)`
        );
      } else {
        setUploadSuccessMsg(`✓ Photo synced directly to database: ${res.filename}`);
      }
      setTimeout(() => setUploadSuccessMsg(null), 6000);
    } catch (err: any) {
      alert('Photo processing error: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    e.target.value = '';
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // POS Cashier Ticket State
  const [cashierSearch, setCashierSearch] = useState('');
  const [cashierCategory, setCashierCategory] = useState<string>('All Parts');
  const [showMobileTicketModal, setShowMobileTicketModal] = useState(false);
  const [ticketFlash, setTicketFlash] = useState(false);
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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!usernameInput.trim()) {
      setAuthError('Please enter your username.');
      return;
    }
    if (!passwordInput.trim()) {
      setAuthError('Please enter your password.');
      return;
    }

    setLoginLoading(true);
    try {
      const res = await authenticatePOS(usernameInput.trim(), passwordInput.trim());
      if (res.success && res.user) {
        setCurrentUser(res.user);
        setPasswordInput('');
        setAuthError('');
      } else {
        setAuthError(res.message || 'Incorrect username or password. The admin username is Devine2026.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authenticate. Please check connection and try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    logoutPOSUser();
    setCurrentUser(null);
    setPasswordInput('');
    setActiveTab('cashier');
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

  // Category selection handler with automatic category image assignment
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    // If current image is empty, or is any category preset image, auto-assign the new category photo
    const isPresetOrEmpty = !imageUrl || Object.values(CATEGORY_DEFAULT_IMAGES).includes(imageUrl) || imageAutoDetected;
    if (isPresetOrEmpty) {
      setImageUrl(getCategoryDefaultImage(newCat));
      setImageAutoDetected(false);
    }
  };

  const handleBatchCategoryChange = (newCat: string) => {
    setBatchCategory(newCat);
    setBatchImageUrl(getCategoryDefaultImage(newCat));
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
    setImageUrl(getCategoryDefaultImage(JOYDEVINE_CATEGORIES[1]));
    setCondition('Brand New');
    setImageAutoDetected(false);
  };

  // Save/Update Part (Single)
  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !ybNo.trim() || !oem.trim() || !des.trim() || priceKes === '') {
      alert('Please fill all mandatory fields: Item Name, YB No, OEM, Product Description (DES), and Selling Price.');
      return;
    }

    const assignedImg = imageUrl || getCategoryDefaultImage(category);

    try {
      await savePart({
        id: editingPartId || undefined,
        itemName: itemName.trim(),
        ybNo: ybNo.trim().toUpperCase(),
        oem: oem.trim().toUpperCase(),
        des: des.trim(),
        category,
        brand: 'JoyDivine / OEM',
        priceKes: Number(priceKes),
        buyingPriceKes: buyingPriceKes !== '' ? Number(buyingPriceKes) : undefined,
        stock: stock !== '' ? Number(stock) : 0,
        imageUrl: assignedImg,
        condition,
        warrantyMonths: 12,
      });

      handleResetForm();
      refreshPartsList();
      onCatalogUpdated();
      alert(editingPartId ? 'Stock updated successfully in Cloud Firestore!' : 'New auto part registered directly into Room B13 database!');
    } catch (err: any) {
      alert('Database error while saving part: ' + (err.message || 'Check Firestore connection'));
    }
  };

  // Save current item and prepare form immediately for the next product in the SAME category
  const handleSaveAndAddNextInCategory = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !ybNo.trim() || !oem.trim() || !des.trim() || priceKes === '') {
      alert('Please fill all mandatory fields: Item Name, YB No, OEM, Product Description (DES), and Selling Price.');
      return;
    }

    const assignedImg = imageUrl || getCategoryDefaultImage(category);

    try {
      const saved = await savePart({
        id: editingPartId || undefined,
        itemName: itemName.trim(),
        ybNo: ybNo.trim().toUpperCase(),
        oem: oem.trim().toUpperCase(),
        des: des.trim(),
        category,
        brand: 'JoyDivine / OEM',
        priceKes: Number(priceKes),
        buyingPriceKes: buyingPriceKes !== '' ? Number(buyingPriceKes) : undefined,
        stock: stock !== '' ? Number(stock) : 0,
        imageUrl: assignedImg,
        condition,
        warrantyMonths: 12,
      });

      refreshPartsList();
      onCatalogUpdated();

      // Keep category, condition, and image intact; clear item specific fields
      setEditingPartId(null);
      setItemName('');
      setYbNo('');
      setOem('');
      setDes('');
      setStock(10);
      setUploadSuccessMsg(`✓ Saved "${saved.itemName}" to Firestore! Ready for next ${category} product (category photo kept).`);
      setTimeout(() => setUploadSuccessMsg(null), 6000);
    } catch (err: any) {
      alert('Database error while saving part: ' + (err.message || 'Check Firestore connection'));
    }
  };

  // Batch Multi-Product Row Management
  const handleAddBatchRow = () => {
    setBatchRows(prev => [...prev, createEmptyBatchRow(prev.length + 1)]);
  };

  const handleDuplicateBatchRow = (index: number) => {
    setBatchRows(prev => {
      const target = prev[index];
      if (!target) return prev;
      const clone: BatchProductRow = {
        ...target,
        rowId: `row-${Date.now()}-${prev.length + 1}-${Math.floor(Math.random() * 1000)}`,
        itemName: target.itemName ? `${target.itemName} (Copy)` : '',
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const handleRemoveBatchRow = (index: number) => {
    setBatchRows(prev => {
      if (prev.length <= 1) return [createEmptyBatchRow(1)];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleBatchRowChange = (index: number, field: keyof BatchProductRow, value: any) => {
    setBatchRows(prev => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  // Save all items in the batch to Firestore & shelf stock
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = batchRows.filter(r => r.itemName.trim() && r.ybNo.trim() && r.priceKes !== '');
    if (validRows.length === 0) {
      alert('Please fill in at least one product with Item Name, YB No, and Selling Price.');
      return;
    }

    setIsSavingBatch(true);
    setBatchFeedback(null);

    const categoryImg = batchImageUrl || getCategoryDefaultImage(batchCategory);

    try {
      const partsToSave = validRows.map(r => ({
        itemName: r.itemName.trim(),
        ybNo: r.ybNo.trim().toUpperCase(),
        oem: r.oem.trim().toUpperCase() || r.ybNo.trim().toUpperCase(),
        des: r.des.trim() || `${r.itemName.trim()}. Category: ${batchCategory}. Genuine JoyDivine Auto Spares Kirinyaga Crescent.`,
        category: batchCategory,
        brand: 'JoyDivine / OEM',
        priceKes: Number(r.priceKes),
        buyingPriceKes: r.buyingPriceKes !== '' ? Number(r.buyingPriceKes) : undefined,
        stock: r.stock !== '' ? Number(r.stock) : 0,
        imageUrl: categoryImg,
        condition: r.condition,
        warrantyMonths: 12,
      }));

      const saved = await batchSaveParts(partsToSave);
      refreshPartsList();
      onCatalogUpdated();
      setBatchFeedback(`✅ Successfully registered all ${saved.length} products to "${batchCategory}" with category photo!`);
      // Reset rows with 2 blank rows
      setBatchRows([
        createEmptyBatchRow(1),
        createEmptyBatchRow(2),
      ]);
      setTimeout(() => setBatchFeedback(null), 7000);
    } catch (err: any) {
      alert('Error saving batch products: ' + (err.message || 'Check Firestore connection'));
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleDeletePart = (part: AutoPart) => {
    setPartToDelete(part);
  };

  const confirmDeletePart = async () => {
    if (!partToDelete) return;
    setIsDeleting(true);
    try {
      await deletePart(partToDelete.id);
      refreshPartsList();
      toast.success('Part moved to trash!');
    } catch (err) {
      console.error('Failed to delete part:', err);
      toast.error('Failed to delete part');
    } finally {
      setIsDeleting(false);
      setPartToDelete(null);
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

    // Make the Current Sales Ticket card appear immediately
    setShowMobileTicketModal(true);
    setTicketFlash(true);
    setTimeout(() => setTicketFlash(false), 1200);
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

    const finalMpesaRef = mpesaRef.trim().toUpperCase();

    const saleRecord = await recordPOSSale({
      items: ticketItems,
      totalKes: ticketTotalKes,
      paymentMethod,
      mpesaRef: finalMpesaRef || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      cashierName: currentUser ? `${currentUser.displayName} (@${currentUser.username})` : 'Counter Cashier (Room B13)',
    });

    refreshPartsList();
    setCompletedSale(saleRecord);
    handleClearTicket();
  };

  const handleDeleteSale = (sale: POSSaleRecord) => {
    if (!isAdmin) return;
    setSaleToDelete(sale);
  };

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSaleRecord(saleToDelete.id);
      setSalesRecords(getSalesHistory());
    } catch (err) {
      console.error('Failed to delete sale:', err);
    } finally {
      setIsDeleting(false);
      setSaleToDelete(null);
    }
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (currentUser.password !== oldPass && oldPass !== 'Devine2026' && oldPass !== 'joydevine2026') {
      setPassMessage({ text: 'Current password does not match.', isError: true });
      return;
    }
    if (newPass.length < 4) {
      setPassMessage({ text: 'New password must be at least 4 characters long.', isError: true });
      return;
    }

    try {
      const res = await updatePOSUser(currentUser.id, { password: newPass.trim() });
      if (res.success) {
        setCurrentUser({ ...currentUser, password: newPass.trim() });
        setPassMessage({ text: 'Password updated successfully!', isError: false });
        setOldPass('');
        setNewPass('');
        setTimeout(() => {
          setShowPassModal(false);
          setPassMessage({ text: '', isError: false });
        }, 1500);
      } else {
        setPassMessage({ text: res.message || 'Could not update password.', isError: true });
      }
    } catch (err: any) {
      setPassMessage({ text: err.message || 'Failed to update password.', isError: true });
    }
  };

  // If not logged in, render clean Navy & White authentication screen
  if (!currentUser) {
    return (
      <div className="min-h-[85vh] bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <img 
              src="/joydevine-logo.png" 
              alt="JoyDivine Auto Spares" 
              className="w-20 h-20 object-contain rounded-full border border-blue-900/15 shadow-xs mx-auto"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-xl font-black text-[#0A192F] font-['Chivo'] uppercase tracking-tight">
              JOYDIVINE COUNTER POS
            </h2>
            <p className="text-xs text-slate-500">
              Room B13, Kirinyaga Crescent, Opp. Seventies Plaza, Nairobi
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Username:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. Devine2026"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 font-mono"
                  autoFocus
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password:
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  {showLoginPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter access password..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/10 font-mono"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-[#0A192F] hover:bg-[#132A4D] disabled:opacity-60 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Counter Terminal</span>
              )}
            </button>
          </form>

          {/* Quick Access Info for Admin */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Admin Access:</span>
            </div>
            <div className="text-[11px] text-slate-600 font-mono">
              Username: <strong className="text-[#0A192F]">Devine2026</strong> • Password: <strong className="text-[#0A192F]">Devine2026</strong>
            </div>
            <p className="text-[10px] text-slate-500 pt-0.5">
              The administrator has full permission to add other staff users, modify catalog inventory, and audit all sales transactions.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Room B13 • Kirinyaga Rd</span>
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
      <Toaster />
      
      {/* Top POS Management Bar: Deep Navy Blue */}
      <div className="bg-[#0A192F] text-white border-b border-[#14284B] px-4 sm:px-6 lg:px-8 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <img 
              src="/joydevine-logo.png" 
              alt="JoyDivine Auto Spares" 
              className="w-9 h-9 object-contain rounded-full border border-blue-400/30 shadow-xs shrink-0 bg-white"
              referrerPolicy="no-referrer"
            />
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
                Kirinyaga Crescent, Opp. Seventies Plaza (Room B13) • Counter Cashier Terminal
              </p>
            </div>
          </div>

          {/* Tab Navigation & User Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('cashier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#14284B] text-slate-300 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdmin ? 'Stock Registration' : 'Stock Catalog'}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#14284B] text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Sales Audit</span>
            </button>

            {/* Admin Only: Staff & User Management Tab */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-[#14284B] text-amber-300 hover:text-white border border-amber-500/30'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Settings</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            {/* Active User Chip */}
            <div className="flex items-center gap-2 bg-[#14284B] px-2.5 py-1 rounded-lg border border-slate-700">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                isAdmin ? 'bg-amber-400 text-slate-900' : 'bg-emerald-400 text-slate-900'
              }`}>
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight text-left">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs text-white truncate max-w-[110px]">
                    {currentUser.displayName}
                  </span>
                  <span className={`text-[8px] font-black px-1 rounded uppercase ${
                    isAdmin ? 'bg-amber-500/30 text-amber-300' : 'bg-emerald-500/30 text-emerald-300'
                  }`}>
                    {isAdmin ? 'ADMIN' : 'CASHIER'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <button
              onClick={() => setShowPassModal(true)}
              title="Change Password"
              className="p-1.5 rounded bg-[#14284B] hover:bg-[#1E3A6B] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Key className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="Log Out POS"
              className="p-1.5 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              onClick={onBackToShop}
              className="ml-1 text-xs font-bold text-blue-300 hover:text-white underline cursor-pointer"
            >
              Shop Front →
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: CASHIER COUNTER REGISTER */}
        {activeTab === 'cashier' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Quick Search & Categorized Parts Selector (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-[#0A192F] uppercase tracking-wider font-mono">
                        Counter Parts Register
                      </h3>
                      <p className="text-xs text-slate-500">
                        Click any item to add it directly to the Current Sales Ticket
                      </p>
                    </div>

                    {/* Button on mobile to view ticket */}
                    <button
                      type="button"
                      onClick={() => setShowMobileTicketModal(true)}
                      className="lg:hidden inline-flex items-center gap-2 px-3 py-1.5 bg-[#0A192F] text-white rounded-lg text-xs font-bold font-mono self-start sm:self-auto"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ticket ({ticketItems.length})</span>
                      <span className="text-emerald-400">• KES {ticketTotalKes.toLocaleString()}</span>
                    </button>
                  </div>

                  {/* Single Unified Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={cashierSearch}
                      onChange={(e) => setCashierSearch(e.target.value)}
                      placeholder="Search parts by name (e.g. Brake Master), YB No, OEM code, or car model..."
                      className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
                      autoFocus
                    />
                    {cashierSearch && (
                      <button
                        type="button"
                        onClick={() => setCashierSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Arranged & Categorized Like Main Website */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                    {['All Parts', ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean)))].map((cat) => {
                      const isSelected = cashierCategory === cat;
                      const count = cat === 'All Parts'
                        ? parts.length
                        : parts.filter((p) => p.category === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCashierCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                            isSelected
                              ? 'bg-[#0A192F] text-white border-[#0A192F] shadow-2xs'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[10px] font-mono px-1 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categorized Parts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
                  {parts
                    .filter((p) => {
                      const matchesCat = cashierCategory === 'All Parts' || p.category === cashierCategory;
                      const q = cashierSearch.toLowerCase().trim();
                      if (!q) return matchesCat;
                      const terms = q.split(/\s+/).filter(Boolean);
                      const searchable = `${p.itemName} ${p.ybNo} ${p.oem} ${p.des} ${p.category} ${p.brand || ''}`.toLowerCase();
                      return matchesCat && terms.every((term) => searchable.includes(term));
                    })
                    .map((part) => (
                      <motion.div
                        key={part.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="contents"
                      >
                        <div
                          onClick={() => handleAddToTicket(part)}
                          className="bg-white border border-slate-200 hover:border-blue-700 rounded-xl p-3 flex flex-col justify-between gap-2.5 cursor-pointer shadow-2xs hover:shadow-md transition-all group"
                        >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {part.imageUrl ? (
                              <img
                                src={part.imageUrl}
                                alt={part.itemName}
                                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-mono font-bold text-white bg-[#0A192F] px-1.5 py-0.5 rounded shadow-2xs">
                                {part.ybNo}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">
                                {part.oem}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-900 transition-colors leading-tight">
                              {part.itemName}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium block truncate">
                              {part.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-mono">COUNTER PRICE</span>
                            <span className="text-xs font-black text-blue-950 font-mono">
                              KES {part.priceKes.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                              part.stock <= 0 
                                ? 'bg-rose-100 text-rose-800'
                                : part.stock < 5
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              Stock: {part.stock}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToTicket(part);
                              }}
                              className="px-2.5 py-1 bg-[#0A192F] hover:bg-blue-700 text-white rounded text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3 stroke-[3]" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Right: Counter Sales Ticket Card & Checkout (5 Cols Desktop) */}
              <div className="hidden lg:block lg:col-span-5">
                <div className={`bg-white border rounded-xl shadow-sm p-4 sm:p-5 space-y-4 sticky top-16 transition-all ${
                  ticketFlash ? 'ring-2 ring-blue-500 border-blue-600 shadow-md' : 'border-slate-200'
                }`}>
                  
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-[#0A192F] uppercase tracking-wider font-mono">
                          Current Sales Ticket
                        </h3>
                        {ticketItems.length > 0 && (
                          <span className="bg-blue-100 text-blue-900 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full">
                            {ticketItems.reduce((sum, item) => sum + item.quantity, 0)} items
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">Room B13 Counter Register</span>
                    </div>
                    {ticketItems.length > 0 && (
                      <button
                        onClick={handleClearTicket}
                        className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1 cursor-pointer px-2 py-1 rounded hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}
                  </div>

                  {/* Ticket Items List */}
                  {ticketItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <ShoppingCart className="w-10 h-10 mx-auto opacity-30 text-slate-600" />
                      <p className="text-xs font-medium">Ticket is empty.</p>
                      <p className="text-[11px] text-slate-400">Click any spare part on the counter to add.</p>
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
                              <span className="text-slate-700 truncate font-sans font-medium">{item.part.itemName}</span>
                            </div>
                            <span className="text-slate-500 font-mono text-[11px]">
                              KES {item.unitPriceKes.toLocaleString()} each
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center border border-slate-300 rounded bg-white">
                              <button
                                onClick={() => handleUpdateTicketQty(item.part.id, -1)}
                                className="px-2 py-0.5 font-bold hover:bg-slate-100 text-slate-700"
                              >
                                -
                              </button>
                              <span className="px-1.5 font-mono font-bold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateTicketQty(item.part.id, 1)}
                                className="px-2 py-0.5 font-bold hover:bg-slate-100 text-slate-700"
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
                              title="Remove item"
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
                      <div className="flex justify-between items-baseline bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-700 uppercase font-mono">Ticket Total:</span>
                        <span className="text-xl sm:text-2xl font-black text-[#0A192F] font-mono">
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

            {/* Modal / Card for Current Sales Ticket (appears automatically when clicked on item) */}
            {showMobileTicketModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div 
                  className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-blue-700" />
                      <div>
                        <h3 className="font-black text-sm text-[#0A192F] uppercase tracking-wider font-mono">
                          Current Sales Ticket
                        </h3>
                        <span className="text-[11px] text-slate-500">
                          {ticketItems.length} items • KES {ticketTotalKes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMobileTicketModal(false)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 overflow-y-auto space-y-4 flex-1">
                    {ticketItems.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 space-y-2">
                        <ShoppingCart className="w-10 h-10 mx-auto opacity-30 text-slate-600" />
                        <p className="text-xs">Ticket is empty.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ticketItems.map((item) => (
                          <div
                            key={item.part.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 font-mono">
                                <span className="font-bold text-[#0A192F]">{item.part.ybNo}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-700 truncate font-sans font-medium">{item.part.itemName}</span>
                              </div>
                              <span className="text-slate-500 font-mono text-[11px]">
                                KES {item.unitPriceKes.toLocaleString()} each
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center border border-slate-300 rounded bg-white">
                                <button
                                  onClick={() => handleUpdateTicketQty(item.part.id, -1)}
                                  className="px-2 py-0.5 font-bold hover:bg-slate-100 text-slate-700"
                                >
                                  -
                                </button>
                                <span className="px-1.5 font-mono font-bold text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateTicketQty(item.part.id, 1)}
                                  className="px-2 py-0.5 font-bold hover:bg-slate-100 text-slate-700"
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

                    {ticketItems.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-slate-200">
                        <div className="flex justify-between items-baseline bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <span className="text-xs font-bold text-slate-700 uppercase font-mono">Total Amount:</span>
                          <span className="text-xl font-black text-[#0A192F] font-mono">
                            KES {ticketTotalKes.toLocaleString()}
                          </span>
                        </div>

                        {/* Tender Method */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700">Payment Mode:</label>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {(['M-PESA', 'CASH', 'CARD'] as const).map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setPaymentMethod(mode)}
                                className={`py-2 px-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                                  paymentMethod === mode
                                    ? 'bg-[#0A192F] text-white border-[#0A192F]'
                                    : 'bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        {paymentMethod === 'M-PESA' && (
                          <input
                            type="text"
                            value={mpesaRef}
                            onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                            placeholder="M-PESA Code (e.g. TKA48X92LM)"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold uppercase focus:bg-white"
                          />
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Customer Name"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                          />
                          <input
                            type="text"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="Customer Phone"
                            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                          />
                        </div>

                        <button
                          onClick={() => {
                            handleCompleteCheckout();
                            setShowMobileTicketModal(false);
                          }}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Complete Sale & Print Receipt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowMobileTicketModal(false)}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          + Continue Adding Parts
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom floating ticket bar on small screens */}
            {ticketItems.length > 0 && !showMobileTicketModal && (
              <div className="fixed bottom-4 right-4 sm:right-6 z-40 lg:hidden animate-in fade-in slide-in-from-bottom-4 duration-150">
                <button
                  onClick={() => setShowMobileTicketModal(true)}
                  className="bg-[#0A192F] hover:bg-[#14284B] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
                    {ticketItems.reduce((acc, i) => acc + i.quantity, 0)}
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold text-slate-300">Active Ticket</div>
                    <div className="font-mono font-bold text-sm text-emerald-400">
                      KES {ticketTotalKes.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-300 ml-1">View Ticket Card →</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: STOCK REGISTRATION (Admin: Full CRUD; Cashier: Catalog View) */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            {!isAdmin && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">Staff Catalog & Shelf Inventory View</h4>
                  <p className="mt-0.5 text-amber-800">
                    You are logged in as <strong>{currentUser.displayName} (Cashier)</strong>. You have view access to search parts, check shelf stock, and lookup part numbers. Adding new parts, editing prices, and modifying inventory is reserved for the Administrator (<strong>Devine2026</strong>).
                  </p>
                </div>
              </div>
            )}

            <div className={isAdmin ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : "w-full"}>
              
              {/* Left: Registration Form (7 or 8 Cols) - Only visible to Admin */}
              {isAdmin && (
                <div className={`${stockEntryMode === 'batch' ? 'lg:col-span-8' : 'lg:col-span-7'} bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-5`}>
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-base text-[#0A192F] font-['Chivo'] tracking-tight">
                    {editingPartId ? 'EDIT INVENTORY ITEM' : 'STOCK INVENTORY REGISTRATION'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Room B13 Kirinyaga Crescent • Cloud Firestore Synced Catalog
                  </p>
                </div>

                {editingPartId ? (
                  <button
                    onClick={handleResetForm}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Cancel Editing
                  </button>
                ) : (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Auto Category Photos</span>
                  </div>
                )}
              </div>

              {/* Mode Switcher: Single Item Entry vs Batch Multi-Product Entry */}
              {!editingPartId && (
                <div className="p-1 bg-slate-100 rounded-xl flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStockEntryMode('single')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      stockEntryMode === 'single'
                        ? 'bg-white text-[#0A192F] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-4 h-4 text-blue-700" />
                    <span>Single Product Entry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStockEntryMode('batch')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      stockEntryMode === 'batch'
                        ? 'bg-[#0A192F] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Batch Entry (Multiple of Same Category)</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] rounded-full uppercase font-bold">Fast</span>
                  </button>
                </div>
              )}

              {/* BATCH MODE: Add multiple products of the same category with shared photo */}
              {stockEntryMode === 'batch' && !editingPartId ? (
                <div className="space-y-4">
                  {/* Category Selection & Shared Image Banner */}
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-black text-[#0A192F] uppercase tracking-wider">
                          1. Select Category for this Batch of Stock:
                        </label>
                        <select
                          value={batchCategory}
                          onChange={(e) => handleBatchCategoryChange(e.target.value)}
                          className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-[#0A192F] focus:outline-none focus:border-blue-700 w-full sm:w-auto min-w-[240px]"
                        >
                          {JOYDEVINE_CATEGORIES.filter((c) => c !== 'All Parts').map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Shared Photo Preview */}
                      <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-blue-200 shadow-xs">
                        <div className="w-14 h-14 bg-slate-50 rounded border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                          <img
                            src={batchImageUrl}
                            alt={batchCategory}
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/productsimg/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="text-[11px] space-y-0.5">
                          <span className="font-bold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Shared Category Photo</span>
                          </span>
                          <p className="text-slate-500 text-[10px] leading-tight">
                            Automatically applied to all {batchRows.length} items below. No need to add photos individually!
                          </p>
                          <label
                            htmlFor="pos-batch-image-replace"
                            className="text-[10px] text-blue-700 font-bold hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                          >
                            <Upload className="w-2.5 h-2.5" />
                            <span>Custom photo for batch</span>
                          </label>
                          <input
                            id="pos-batch-image-replace"
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const res = await uploadProductImage(file);
                                setBatchImageUrl(res.url);
                              } catch (err: any) {
                                alert('Image upload failed: ' + err.message);
                              }
                            }}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Product Rows */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-[#0A192F] uppercase tracking-wider">
                          2. Products in this Category ({batchRows.length} items)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Add multiple stock items at once. Duplicate similar items (e.g. RH & LH) with one click!
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddBatchRow}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Product Row</span>
                      </button>
                    </div>

                    {/* Scrollable list of rows */}
                    <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                      {batchRows.map((row, idx) => (
                        <div
                          key={row.rowId}
                          className="p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl space-y-3 transition-colors"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 font-mono">
                              <span className="w-5 h-5 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-[11px] font-bold">
                                {idx + 1}
                              </span>
                              <span>Product #{idx + 1}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDuplicateBatchRow(idx)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Duplicate this row (useful for LH/RH variants)"
                              >
                                <Copy className="w-3 h-3 text-blue-600" />
                                <span>Duplicate</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveBatchRow(idx)}
                                disabled={batchRows.length <= 1}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded disabled:opacity-30 cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                Item Name *
                              </label>
                              <input
                                type="text"
                                value={row.itemName}
                                onChange={(e) => handleBatchRowChange(idx, 'itemName', e.target.value)}
                                placeholder="e.g. Brake Wheel Cylinder Rear RH"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                YB No (Internal Code) *
                              </label>
                              <input
                                type="text"
                                value={row.ybNo}
                                onChange={(e) => handleBatchRowChange(idx, 'ybNo', e.target.value.toUpperCase())}
                                placeholder="e.g. YB-47550"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-700"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                OEM Code
                              </label>
                              <input
                                type="text"
                                value={row.oem}
                                onChange={(e) => handleBatchRowChange(idx, 'oem', e.target.value.toUpperCase())}
                                placeholder="e.g. 47550-0K010"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900 uppercase focus:outline-none focus:border-blue-700"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                Selling Price (KES) *
                              </label>
                              <input
                                type="number"
                                value={row.priceKes}
                                onChange={(e) => handleBatchRowChange(idx, 'priceKes', e.target.value ? Number(e.target.value) : '')}
                                placeholder="2800"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-blue-950 focus:outline-none focus:border-blue-700"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                Cost Price (KES)
                              </label>
                              <input
                                type="number"
                                value={row.buyingPriceKes}
                                onChange={(e) => handleBatchRowChange(idx, 'buyingPriceKes', e.target.value ? Number(e.target.value) : '')}
                                placeholder="1800"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-700 focus:outline-none focus:border-blue-700"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                                Stock (Room B13)
                              </label>
                              <input
                                type="number"
                                value={row.stock}
                                onChange={(e) => handleBatchRowChange(idx, 'stock', e.target.value ? Number(e.target.value) : '')}
                                placeholder="10"
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-700"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                              Description / Vehicle Compatibility (DES)
                            </label>
                            <input
                              type="text"
                              value={row.des}
                              onChange={(e) => handleBatchRowChange(idx, 'des', e.target.value)}
                              placeholder="e.g. Fits Toyota Hilux Vigo 2.5/3.0 D4D, Fortuner. Complete hydraulic assembly."
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleAddBatchRow}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Another Product Row</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveBatch}
                        disabled={isSavingBatch}
                        className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 cursor-pointer ${
                          isSavingBatch ? 'opacity-50 cursor-wait' : ''
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{isSavingBatch ? 'Saving Batch to Firestore...' : `Save All ${batchRows.filter(r => r.itemName.trim() && r.ybNo.trim()).length || batchRows.length} Products to Room B13`}</span>
                      </button>
                    </div>

                    {batchFeedback && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{batchFeedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SINGLE PRODUCT ENTRY FORM */
                <form onSubmit={handleSavePart} className="space-y-4">
                  
                  {/* Category & Condition First */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Category *
                        </label>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          Auto photo assigned
                        </span>
                      </div>
                      <select
                        value={category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700"
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
                        YB No (JoyDivine Inventory Code) *
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
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-700"
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

                  {/* Product Image: Direct Database File Sync with Category Auto-Default */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#0A192F] flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-700" />
                        <span>Product Photo (Auto-Assigned from Category)</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>No image upload required</span>
                      </span>
                    </div>

                    {/* Image display with category badge */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(true);
                      }}
                      onDragLeave={() => setIsDraggingOver(false)}
                      onDrop={handleImageDrop}
                      className={`border-2 border-dashed rounded-lg p-3 transition-colors text-center ${
                        isDraggingOver
                          ? 'border-blue-600 bg-blue-50/70'
                          : imageUrl
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-300 bg-white hover:border-blue-400'
                      }`}
                    >
                      {imageUrl ? (
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={imageUrl}
                              alt="Selected"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/productsimg/placeholder.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {imageUrl.startsWith('data:image/') ? (
                                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Database className="w-3 h-3 text-emerald-700" />
                                  <span>STORED DIRECTLY IN FIRESTORE</span>
                                </span>
                              ) : imageUrl.startsWith('/productsimg/') ? (
                                <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>CATEGORY PHOTO AUTO-ASSIGNED ({category})</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                                  WEB LINK
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                              {imageUrl.startsWith('data:image/')
                                ? 'Embedded directly into cloud database. Displays immediately on POS and website.'
                                : imageUrl.startsWith('/productsimg/')
                                ? `Standard catalog image for ${category}. You do not have to upload anything!`
                                : 'Linked from external URL.'}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <label
                                htmlFor="pos-product-image-upload-replace"
                                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer hover:underline flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Change custom photo</span>
                              </label>
                              <input
                                id="pos-product-image-upload-replace"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageFileUpload}
                                disabled={isUploadingImage}
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => setImageUrl(getCategoryDefaultImage(category))}
                                className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer hover:underline"
                              >
                                Reset to Category Default
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 py-2">
                          <div className="flex items-center justify-center gap-2">
                            <label
                              htmlFor="pos-product-image-upload"
                              className={`px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${
                                isUploadingImage ? 'opacity-50 cursor-wait' : ''
                              }`}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingImage ? 'Optimizing photo...' : 'Choose File from Device'}</span>
                            </label>
                            <input
                              id="pos-product-image-upload"
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleImageFileUpload}
                              disabled={isUploadingImage}
                              className="hidden"
                            />

                            <label
                              htmlFor="pos-product-camera-snap"
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                              title="Take photo with camera"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Take Photo</span>
                            </label>
                            <input
                              id="pos-product-camera-snap"
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleImageFileUpload}
                              disabled={isUploadingImage}
                              className="hidden"
                            />

                            <button
                              type="button"
                              onClick={() => setShowImageLibraryModal(true)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Library ({availableImages.length})</span>
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-500">
                            Or drag & drop photo file directly here (JPG, PNG, WebP)
                          </p>
                        </div>
                      )}
                    </div>

                    {uploadSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{uploadSuccessMsg}</span>
                      </div>
                    )}

                    {imageAutoDetected && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Previously registered photo automatically matched & reflected!</span>
                      </div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                    {!editingPartId && (
                      <button
                        type="button"
                        onClick={handleSaveAndAddNextInCategory}
                        className="flex-1 min-w-[200px] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Save this product and immediately keep category and photo for the next product"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>Save & Add Another in "{category.split(' ')[0]}..."</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      className="py-2.5 px-4 bg-[#0A192F] hover:bg-[#132A4D] text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                    >
                      {editingPartId ? 'Update Stock Item' : 'Save & Finish'}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                </form>
              )}

            </div>
          )}

          {/* Right: Live Registered Inventory List (5 Cols or Full Width) */}
          <div className={isAdmin ? `${stockEntryMode === 'batch' ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-4` : "w-full space-y-4"}>
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={inventorySearch}
                        onChange={(e) => setInventorySearch(e.target.value)}
                        placeholder="Search stock by name, YB No, OEM..."
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

                  {/* Inventory Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                    {['All Parts', ...Array.from(new Set(parts.map((p) => p.category).filter(Boolean)))].map((cat) => {
                      const isSelected = inventoryCategory === cat;
                      const count = cat === 'All Parts'
                        ? parts.length
                        : parts.filter((p) => p.category === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setInventoryCategory(cat)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer border flex items-center gap-1 shrink-0 ${
                            isSelected
                              ? 'bg-[#0A192F] text-white border-[#0A192F]'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[9px] font-mono px-1 rounded ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {parts
                  .filter((p) => {
                    const matchesCat = inventoryCategory === 'All Parts' || p.category === inventoryCategory;
                    const matchesLow = !inventoryFilterLowStock || p.stock < 5;
                    const q = inventorySearch.toLowerCase().trim();
                    if (!q) return matchesCat && matchesLow;
                    const terms = q.split(/\s+/).filter(Boolean);
                    const searchable = `${p.itemName} ${p.ybNo} ${p.oem} ${p.des} ${p.category}`.toLowerCase();
                    const matchesText = terms.every((t) => searchable.includes(t));
                    return matchesCat && matchesLow && matchesText;
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

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditPart(part)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                            title="Edit Part"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePart(part)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Delete Part"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
        )}

        {/* TAB 3: SALES AUDIT & REAL-TIME TRACKING */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            
            {/* Sales Performance Summary Cards (Admin & Staff) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                  <span>Gross Sales</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg sm:text-xl font-black text-[#0A192F] font-mono">
                  KES {salesRecords.reduce((sum, s) => sum + s.totalKes, 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {salesRecords.length} recorded ticket{salesRecords.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                  <span>M-Pesa Volume</span>
                  <Receipt className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
                  KES {salesRecords.filter(s => s.paymentMethod === 'M-PESA').reduce((sum, s) => sum + s.totalKes, 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {salesRecords.filter(s => s.paymentMethod === 'M-PESA').length} mobile payments
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                  <span>Cash Collections</span>
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg sm:text-xl font-black text-blue-800 font-mono">
                  KES {salesRecords.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.totalKes, 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {salesRecords.filter(s => s.paymentMethod === 'CASH').length} cash payments
                </div>
              </div>

              {isAdmin ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs bg-linear-to-br from-amber-50/50 to-white">
                  <div className="flex items-center justify-between text-slate-600 text-xs mb-1">
                    <span className="font-bold text-amber-900">Gross Margin (Est.)</span>
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-900 font-mono">
                    KES {salesRecords.reduce((acc, sale) => {
                      const profit = sale.items.reduce((iAcc, item) => {
                        const cost = (item.part.buyingPriceKes || 0) * item.quantity;
                        return iAcc + ((item.unitPriceKes * item.quantity) - cost);
                      }, 0);
                      return acc + profit;
                    }, 0).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-amber-800 mt-1">
                    Revenue minus stock buying cost
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                    <span>Active Terminal</span>
                    <Warehouse className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-sm font-bold text-[#0A192F] font-mono">
                    ROOM B13
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Kirinyaga Rd, Nairobi CBD
                  </div>
                </div>
              )}
            </div>

            {/* Sales Audit Log Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-black text-base text-[#0A192F] font-['Chivo'] tracking-tight">
                    COUNTER SALES AUDIT LOG
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time transaction receipts recorded at Room B13 counter
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={salesSearch}
                      onChange={(e) => setSalesSearch(e.target.value)}
                      placeholder="Search receipt, cashier, customer..."
                      className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-700 w-48 sm:w-60 font-mono"
                    />
                  </div>

                  <select
                    value={salesPaymentFilter}
                    onChange={(e: any) => setSalesPaymentFilter(e.target.value)}
                    className="py-1 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-blue-700"
                  >
                    <option value="ALL">All Payments</option>
                    <option value="M-PESA">M-PESA</option>
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>
              </div>

              {salesRecords.length === 0 ? (
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
                        <th className="py-2.5 px-3">Cashier</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Items Sold</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3">M-Pesa Ref</th>
                        <th className="py-2.5 px-3 text-right">Total (KES)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {salesRecords
                        .filter((sale) => {
                          const matchesPay = salesPaymentFilter === 'ALL' || sale.paymentMethod === salesPaymentFilter;
                          const q = salesSearch.toLowerCase().trim();
                          if (!q) return matchesPay;
                          const matchesText =
                            sale.receiptNumber.toLowerCase().includes(q) ||
                            (sale.mpesaRef && sale.mpesaRef.toLowerCase().includes(q)) ||
                            (sale.customerName && sale.customerName.toLowerCase().includes(q)) ||
                            (sale.cashierName && sale.cashierName.toLowerCase().includes(q)) ||
                            sale.items.some(i => i.part.itemName.toLowerCase().includes(q) || i.part.ybNo.toLowerCase().includes(q));
                          return matchesPay && matchesText;
                        })
                        .map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-blue-900">{sale.receiptNumber}</td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {new Date(sale.timestamp).toLocaleDateString()} {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-sans">
                              {sale.cashierName || 'Counter Staff'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-sans">
                              {sale.customerName ? (
                                <div>
                                  <div className="font-bold text-slate-900">{sale.customerName}</div>
                                  {sale.customerPhone && <div className="text-[10px] text-slate-500">{sale.customerPhone}</div>}
                                </div>
                              ) : (
                                <span className="text-slate-400">Walk-in Client</span>
                              )}
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
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setCompletedSale(sale)}
                                  className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                                >
                                  Receipt
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteSale(sale)}
                                    disabled={deletingSaleId === sale.id}
                                    title="Delete/Void this transaction"
                                    className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer"
                                  >
                                    {deletingSaleId === sale.id ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: STAFF & USER MANAGEMENT (Admin Only) */}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-6">
            <POSUserManagement currentUser={currentUser} />
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#0A192F]">Admin Maintenance</h3>
              <button
                onClick={async () => {
                  if (confirm('Start image migration to Firebase Storage? This may take a while.')) {
                    setIsMigrating(true);
                    setMigrationProgress(0);
                    setMigrationMessage('Starting...');
                    await migrateBase64ToStorage((msg, progress) => {
                      setMigrationMessage(msg);
                      if (progress !== undefined) setMigrationProgress(progress);
                    });
                    setIsMigrating(false);
                    alert('Migration Finished');
                  }
                }}
                disabled={isMigrating}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isMigrating ? 'Migrating Images...' : 'Migrate All Base64 Images to Firebase Storage'}
              </button>
              {isMigrating && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs font-medium text-slate-700 mb-2">{migrationMessage}</p>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${migrationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
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
                <img 
                  src="/joydevine-logo.png" 
                  alt="JoyDivine Auto Spares" 
                  className="w-12 h-12 object-contain mx-auto mb-1.5 rounded-full"
                  referrerPolicy="no-referrer"
                />
                <h2 className="font-black text-base text-slate-900 font-['Chivo']">
                  JOYDIVINE AUTO SPARES
                </h2>
                <p className="text-[11px] text-slate-600">
                  Room B13, Kirinyaga Crescent, Nairobi<br />
                  Opposite Seventies Plaza<br />
                  Tel: 0111 871 428 / 0720 357 361 / 0722 604 419
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
                Thank you for choosing JoyDivine Auto Spares!<br />
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
                    capture="environment"
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
                  className="px-3 py-1.5 bg-[#0A192F] hover:bg-[#132A4D] text-white rounded font-bold cursor-pointer"
                >
                  Save New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Delete Part (Bypasses browser iframe confirm blockage) */}
      {partToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Part from Inventory?</h3>
                <p className="text-xs text-slate-500">Remove this item from the catalog.</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 text-xs text-slate-700 space-y-3">
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{partToDelete.itemName}</div>
                <div className="font-mono text-slate-500 text-[11px]">
                  YB No: <span className="font-bold text-slate-800">{partToDelete.ybNo}</span> • OEM: {partToDelete.oem}
                </div>
                <div className="font-mono text-blue-900 font-bold">
                  KES {partToDelete.priceKes.toLocaleString()}
                </div>
              </div>
              <p className="text-slate-500 text-[11px]">
                Are you sure you want to permanently delete this part from inventory and Firebase?
              </p>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPartToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeletePart}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Part'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal: Delete Sale (Bypasses browser iframe confirm blockage) */}
      {saleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Void & Delete Transaction?</h3>
                <p className="text-xs text-slate-500">Remove sale from the transaction audit log.</p>
              </div>
            </div>

            <div className="p-5 bg-slate-50 text-xs text-slate-700 space-y-3">
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 font-mono text-sm">
                  Receipt: #{saleToDelete.id.slice(-6).toUpperCase()}
                </div>
                <div className="text-slate-700">
                  Total: <strong className="text-emerald-700 font-mono">KES {saleToDelete.totalKes.toLocaleString()}</strong> ({saleToDelete.paymentMethod})
                </div>
                <div className="text-slate-500 text-[11px]">
                  Date: {new Date(saleToDelete.timestamp).toLocaleString()}
                </div>
              </div>
              <p className="text-slate-500 text-[11px]">
                Are you sure you want to permanently delete this sales audit record?
              </p>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setSaleToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteSale}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Transaction'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
