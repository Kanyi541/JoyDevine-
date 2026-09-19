import { AutoPart, POSSaleRecord, StoredImageRecord } from '../types';
import { INITIAL_PARTS } from '../data/joydevineParts';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

const PARTS_KEY = 'joydevine_parts_from_firestore_v4';
const SALES_KEY = 'joydevine_pos_sales_v2';
const IMAGES_KEY = 'joydevine_images_memory_v2';
const AUTH_KEY = 'joydevine_pos_auth_v1';
const PASSWORD_KEY = 'joydevine_pos_pass_v1';
const DEFAULT_PASSWORD = 'joydevine2026';

// Clean up previous dummy data and old cache keys if present
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('joydevine_parts_catalog_v2');
    window.localStorage.removeItem('joydevine_parts_from_firestore_v3');
  }
} catch {
  // Ignore storage access errors
}

// Firestore collection references
const partsCol = collection(db, 'parts');
const salesCol = collection(db, 'sales');
const imageMemoryCol = collection(db, 'imageMemory');

export interface DatabaseStatus {
  isLive: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  partCount: number;
  salesCount: number;
  source: 'Firebase Firestore' | 'Local Offline Cache';
  error: string | null;
}

let dbStatus: DatabaseStatus = {
  isLive: false,
  isConnected: false,
  isSyncing: false,
  lastSyncTime: null,
  partCount: 0,
  salesCount: 0,
  source: 'Local Offline Cache',
  error: null,
};

// Listeners
type PartsListener = (parts: AutoPart[], isFromFirebase: boolean) => void;
type StatusListener = (status: DatabaseStatus) => void;

const partsListeners = new Set<PartsListener>();
const statusListeners = new Set<StatusListener>();

const notifyStatus = () => {
  statusListeners.forEach((fn) => {
    try {
      fn({ ...dbStatus });
    } catch (e) {
      console.error(e);
    }
  });
};

const notifyParts = (parts: AutoPart[], isFromFirebase: boolean) => {
  partsListeners.forEach((fn) => {
    try {
      fn(parts, isFromFirebase);
    } catch (e) {
      console.error(e);
    }
  });
};

// Cached parts in memory
let cachedParts: AutoPart[] = [];
let firestoreListenerAttached = false;
let initialDirectFetchTriggered = false;

/**
 * Subscribe to live inventory catalog changes
 */
export const subscribeToPartsCatalog = (listener: PartsListener): (() => void) => {
  partsListeners.add(listener);

  // Send current cached parts immediately (even if empty [])
  const initial = getStoredParts();
  listener(initial, dbStatus.isConnected);

  // Start Firestore real-time sync if not yet running
  initFirestoreSync();

  // Also immediately trigger direct fetch once on startup so data is loaded without delay
  if (!initialDirectFetchTriggered) {
    initialDirectFetchTriggered = true;
    fetchDirectlyFromFirebase().catch((err) => {
      console.warn('[Firebase Firestore] Direct fetch note:', err);
    });
  }

  return () => {
    partsListeners.delete(listener);
  };
};

/**
 * Subscribe to Firebase Database connection status
 */
export const subscribeToDatabaseStatus = (listener: StatusListener): (() => void) => {
  statusListeners.add(listener);
  listener({ ...dbStatus });
  return () => {
    statusListeners.delete(listener);
  };
};

/**
 * Initialize real-time synchronization with Google Cloud Firestore
 */
export const initFirestoreSync = () => {
  if (firestoreListenerAttached) return;
  firestoreListenerAttached = true;

  dbStatus.isSyncing = true;
  notifyStatus();

  try {
    const q = query(partsCol);
    onSnapshot(
      q,
      (snapshot) => {
        const parts: AutoPart[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AutoPart;
          parts.push({
            ...data,
            id: data.id || docSnap.id,
          });
        });

        cachedParts = parts;
        try {
          localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
        } catch {
          // Ignore quota error
        }

        dbStatus = {
          ...dbStatus,
          isLive: true,
          isConnected: true,
          isSyncing: false,
          source: 'Firebase Firestore',
          partCount: parts.length,
          lastSyncTime: new Date().toLocaleTimeString(),
          error: null,
        };

        notifyStatus();
        notifyParts(parts, true);
      },
      (err) => {
        console.warn('[Firebase Firestore] Real-time listener notice:', err);
        dbStatus = {
          ...dbStatus,
          isLive: false,
          isConnected: false,
          isSyncing: false,
          source: 'Local Offline Cache',
          error: err.message || 'Connecting to Firestore...',
        };
        notifyStatus();
      }
    );
  } catch (err: any) {
    console.warn('[Firebase Firestore] Setup error:', err);
    dbStatus = {
      ...dbStatus,
      isLive: false,
      isConnected: false,
      isSyncing: false,
      source: 'Local Offline Cache',
      error: err?.message || 'Offline',
    };
    notifyStatus();
  }
};

/**
 * Explicitly trigger a manual fetch from Firebase Firestore
 */
export const fetchDirectlyFromFirebase = async (): Promise<AutoPart[]> => {
  dbStatus.isSyncing = true;
  notifyStatus();

  try {
    const snapshot = await getDocs(partsCol);
    const items: AutoPart[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as AutoPart;
      items.push({
        ...data,
        id: data.id || docSnap.id,
      });
    });

    cachedParts = items;
    try {
      localStorage.setItem(PARTS_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota error
    }

    dbStatus = {
      ...dbStatus,
      isLive: true,
      isConnected: true,
      isSyncing: false,
      source: 'Firebase Firestore',
      partCount: items.length,
      lastSyncTime: new Date().toLocaleTimeString(),
      error: null,
    };
    notifyStatus();
    notifyParts(items, true);
    return items;
  } catch (err: any) {
    dbStatus = {
      ...dbStatus,
      isSyncing: false,
      error: err.message,
    };
    notifyStatus();
    throw err;
  }
};

/**
 * Seed Firestore with initial parts pointing to /productsimg/ (only when explicitly requested by user)
 */
export const seedFirestoreParts = async (overwriteWithProductsImg = false): Promise<void> => {
  try {
    for (const part of INITIAL_PARTS) {
      const partRef = doc(db, 'parts', part.id);
      await setDoc(partRef, part, { merge: !overwriteWithProductsImg });
    }
  } catch (err) {
    console.error('Error seeding initial parts to Firestore:', err);
  }
};

/**
 * Synchronous cached parts access - returns empty array if no parts in cache
 */
export const getStoredParts = (): AutoPart[] => {
  if (cachedParts.length > 0) return cachedParts;
  try {
    const raw = localStorage.getItem(PARTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedParts = parsed;
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed reading parts from cache', err);
    return [];
  }
};

/**
 * Save part to both Firestore and local state
 */
export const savePart = async (partData: Omit<AutoPart, 'id' | 'createdAt'> & { id?: string }): Promise<AutoPart> => {
  const parts = getStoredParts();
  const now = new Date().toISOString();

  let savedPart: AutoPart;

  if (partData.id) {
    // Update existing
    savedPart = {
      ...partData,
      id: partData.id,
      createdAt: parts.find(p => p.id === partData.id)?.createdAt || now,
      updatedAt: now,
    } as AutoPart;

    const index = parts.findIndex(p => p.id === partData.id);
    if (index !== -1) {
      parts[index] = savedPart;
    } else {
      parts.unshift(savedPart);
    }
  } else {
    // New item
    savedPart = {
      ...partData,
      id: `jd-${Date.now()}`,
      createdAt: now,
    } as AutoPart;
    parts.unshift(savedPart);
  }

  // Update local cache
  cachedParts = [...parts];
  localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
  notifyParts(cachedParts, dbStatus.isConnected);

  // Persist directly to Google Cloud Firestore
  try {
    const partRef = doc(db, 'parts', savedPart.id);
    await setDoc(partRef, savedPart, { merge: true });
    dbStatus.lastSyncTime = new Date().toLocaleTimeString();
    notifyStatus();
  } catch (err) {
    console.warn('Failed saving part to Firestore (persisted locally):', err);
  }

  // Remember this image for auto-reflection
  if (savedPart.imageUrl) {
    rememberImage(savedPart.ybNo, savedPart.imageUrl, savedPart.itemName);
    rememberImage(savedPart.oem, savedPart.imageUrl, savedPart.itemName);
    rememberImage(savedPart.itemName, savedPart.imageUrl, savedPart.itemName);
  }

  return savedPart;
};

/**
 * Delete part from both Firestore and local state
 */
export const deletePart = async (id: string): Promise<void> => {
  const parts = getStoredParts().filter(p => p.id !== id);
  cachedParts = [...parts];
  localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
  notifyParts(cachedParts, dbStatus.isConnected);

  try {
    const partRef = doc(db, 'parts', id);
    await deleteDoc(partRef);
    dbStatus.lastSyncTime = new Date().toLocaleTimeString();
    notifyStatus();
  } catch (err) {
    console.warn('Failed deleting part from Firestore (deleted locally):', err);
  }
};

/**
 * Update stock level in both Firestore and local state
 */
export const updateStockLevel = async (id: string, deltaOrExact: number, isExact = false): Promise<void> => {
  const parts = getStoredParts();
  const index = parts.findIndex(p => p.id === id);
  if (index !== -1) {
    const newStock = isExact ? Math.max(0, deltaOrExact) : Math.max(0, parts[index].stock + deltaOrExact);
    parts[index].stock = newStock;
    cachedParts = [...parts];
    localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
    notifyParts(cachedParts, dbStatus.isConnected);

    try {
      const partRef = doc(db, 'parts', id);
      await updateDoc(partRef, { stock: newStock });
      dbStatus.lastSyncTime = new Date().toLocaleTimeString();
      notifyStatus();
    } catch (err) {
      console.warn('Failed updating stock on Firestore (updated locally):', err);
    }
  }
};

// ==================== IMAGE MEMORY ENGINE ====================
const seedImageMemory = (parts: AutoPart[]) => {
  const currentImages = getStoredImages();
  if (currentImages.length === 0) {
    const seeded: StoredImageRecord[] = [];
    parts.forEach(p => {
      if (p.imageUrl) {
        seeded.push({
          id: `img-${Date.now()}-${Math.random()}`,
          key: normalizeKey(p.ybNo),
          imageUrl: p.imageUrl,
          label: `${p.ybNo} - ${p.itemName}`,
          addedAt: new Date().toISOString(),
        });
        seeded.push({
          id: `img-${Date.now()}-${Math.random()}`,
          key: normalizeKey(p.oem),
          imageUrl: p.imageUrl,
          label: `${p.oem} - ${p.itemName}`,
          addedAt: new Date().toISOString(),
        });
      }
    });
    localStorage.setItem(IMAGES_KEY, JSON.stringify(seeded));
  }
};

const normalizeKey = (str: string): string => {
  return str.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
};

export const rememberImage = async (key: string, imageUrl: string, label: string): Promise<void> => {
  if (!key || !imageUrl) return;
  const norm = normalizeKey(key);
  if (!norm) return;

  const images = getStoredImages();
  const existingIdx = images.findIndex(img => img.key === norm);
  const rec: StoredImageRecord = {
    id: existingIdx !== -1 ? images[existingIdx].id : `img-${Date.now()}`,
    key: norm,
    imageUrl,
    label,
    addedAt: new Date().toISOString(),
  };

  if (existingIdx !== -1) {
    images[existingIdx] = rec;
  } else {
    images.unshift(rec);
  }
  localStorage.setItem(IMAGES_KEY, JSON.stringify(images));

  // Also sync image memory to Firestore
  try {
    const imgRef = doc(db, 'imageMemory', norm);
    await setDoc(imgRef, rec, { merge: true });
  } catch (err) {
    console.warn('Failed to sync image memory to Firestore:', err);
  }
};

export const findSavedImageForPart = (queryObj: { ybNo?: string; oem?: string; itemName?: string }): string | null => {
  const parts = getStoredParts();
  const images = getStoredImages();

  if (queryObj.ybNo) {
    const ybNorm = normalizeKey(queryObj.ybNo);
    const fromMemory = images.find(img => img.key === ybNorm);
    if (fromMemory) return fromMemory.imageUrl;

    const fromParts = parts.find(p => normalizeKey(p.ybNo) === ybNorm && p.imageUrl);
    if (fromParts) return fromParts.imageUrl;
  }

  if (queryObj.oem) {
    const oemNorm = normalizeKey(queryObj.oem);
    const fromMemory = images.find(img => img.key === oemNorm);
    if (fromMemory) return fromMemory.imageUrl;

    const fromParts = parts.find(p => normalizeKey(p.oem) === oemNorm && p.imageUrl);
    if (fromParts) return fromParts.imageUrl;
  }

  if (queryObj.itemName) {
    const nameLower = queryObj.itemName.trim().toLowerCase();
    const fromParts = parts.find(p => p.itemName.toLowerCase() === nameLower && p.imageUrl);
    if (fromParts) return fromParts.imageUrl;

    const nameNorm = normalizeKey(queryObj.itemName);
    const fromMemory = images.find(img => img.key === nameNorm);
    if (fromMemory) return fromMemory.imageUrl;
  }

  return null;
};

export const getStoredImages = (): StoredImageRecord[] => {
  try {
    const raw = localStorage.getItem(IMAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// ==================== POS SALES ====================
export const recordPOSSale = async (saleData: Omit<POSSaleRecord, 'id' | 'receiptNumber' | 'timestamp'>): Promise<POSSaleRecord> => {
  const sales = getSalesHistory();
  const receiptNumber = `JD-RCP-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();

  const record: POSSaleRecord = {
    ...saleData,
    id: `sale-${Date.now()}`,
    receiptNumber,
    timestamp: now,
  };

  sales.unshift(record);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));

  // Deduct stock for each sold item in memory & Firestore
  for (const item of saleData.items) {
    await updateStockLevel(item.part.id, -item.quantity);
  }

  // Sync sale record to Firestore
  try {
    const saleRef = doc(db, 'sales', record.id);
    await setDoc(saleRef, record);
  } catch (err) {
    console.warn('Failed recording sale to Firestore (saved locally):', err);
  }

  return record;
};

export const getSalesHistory = (): POSSaleRecord[] => {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const deleteSaleRecord = async (saleId: string): Promise<void> => {
  try {
    const saleRef = doc(db, 'sales', saleId);
    await deleteDoc(saleRef);
  } catch (err) {
    console.warn('Failed to delete sale from Firestore:', err);
  }
  const sales = getSalesHistory().filter((s) => s.id !== saleId);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
};

export const subscribeToSalesHistory = (callback: (sales: POSSaleRecord[]) => void): () => void => {
  callback(getSalesHistory());
  try {
    const salesCol = collection(db, 'sales');
    const unsub = onSnapshot(
      salesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: POSSaleRecord[] = [];
          snapshot.forEach((d) => {
            list.push({ ...(d.data() as POSSaleRecord), id: d.id });
          });
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          localStorage.setItem(SALES_KEY, JSON.stringify(list));
          callback(list);
        } else {
          callback(getSalesHistory());
        }
      },
      () => {
        callback(getSalesHistory());
      }
    );
    return unsub;
  } catch {
    return () => {};
  }
};

// ==================== POS AUTHENTICATION ====================
export const checkAdminAuth = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};

export const setAdminAuth = (authenticated: boolean): void => {
  if (authenticated) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
};

export const verifyAdminPassword = (password: string): boolean => {
  const stored = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
  return password.trim() === stored.trim();
};

export const updateAdminPassword = (newPassword: string): void => {
  localStorage.setItem(PASSWORD_KEY, newPassword.trim());
};
