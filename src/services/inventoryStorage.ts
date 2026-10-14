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
  addDoc,
  query, 
  orderBy, 
  limit,
  startAfter,
  onSnapshot,
  getDoc
} from 'firebase/firestore';
import { uploadToFirebaseStorage } from './productImageService';

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
export const fetchMoreParts = async (lastVisibleDoc: any) => {
  const partsCol = collection(db, 'parts');
  const q = query(partsCol, orderBy('itemName'), startAfter(lastVisibleDoc), limit(50));
  const snapshot = await getDocs(q);
  
  const newParts: AutoPart[] = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as AutoPart;
    newParts.push({
      ...data,
      id: data.id || docSnap.id,
    });
  });
  
  return {
    parts: newParts,
    lastVisible: snapshot.docs[snapshot.docs.length - 1]
  };
};

export const initFirestoreSync = () => {
  if (firestoreListenerAttached) return;
  firestoreListenerAttached = true;

  dbStatus.isSyncing = true;
  notifyStatus();

  try {
    const q = query(partsCol, orderBy('itemName'), limit(50));
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
 * Robustly load all inventory parts for reporting, booklet printing, and cataloging.
 * Falls back to local cached storage or INITIAL_PARTS if Firebase is unreachable.
 */
export const getAllInventoryParts = async (): Promise<AutoPart[]> => {
  try {
    const directItems = await fetchDirectlyFromFirebase();
    if (directItems && directItems.length > 0) {
      return directItems;
    }
  } catch (err) {
    console.warn('[getAllInventoryParts] Direct Firestore fetch notice, checking local cache:', err);
  }

  const stored = getStoredParts();
  if (stored && stored.length > 0) {
    return stored;
  }

  return INITIAL_PARTS;
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
 * Migrate all local images (Base64 or /productsimg/) to Firebase Storage
 */
export const migrateBase64ToStorage = async (onProgress: (msg: string, progress?: number) => void): Promise<number> => {
  const parts = getStoredParts();
  const partsToMigrate = parts.filter(p => 
    p.imageUrl && (p.imageUrl.startsWith('data:') || p.imageUrl.startsWith('/productsimg/'))
  );
  
  if (partsToMigrate.length === 0) {
    onProgress('No images to migrate.');
    return 0;
  }

  let completed = 0;
  onProgress(`Starting migration of ${partsToMigrate.length} images...`, 0);

  for (const part of partsToMigrate) {
    try {
      let base64Image = '';

      if (part.imageUrl!.startsWith('data:')) {
        base64Image = part.imageUrl!;
      } else {
        // Fetch local image and convert to Base64
        const response = await fetch(part.imageUrl!);
        const blob = await response.blob();
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const storagePath = `parts/${Date.now()}_${part.id}.jpg`;
      const publicUrl = await uploadToFirebaseStorage(base64Image, storagePath);
      
      // Update part with new URL
      await savePart({ ...part, imageUrl: publicUrl });
      completed++;
      onProgress(`Migrated ${completed}/${partsToMigrate.length}...`, (completed / partsToMigrate.length) * 100);
    } catch (err) {
      console.error(`Failed to migrate image for ${part.itemName}:`, err);
    }
  }
  
  onProgress(`Migration complete. ${completed} images migrated.`, 100);
  return completed;
};

/**
 * Check if the image migration has already been completed.
 */
export const checkMigrationStatus = async (): Promise<boolean> => {
  try {
    const metaRef = doc(db, 'systemMeta', 'imageMigration');
    const docSnap = await getDoc(metaRef);
    return docSnap.exists() && docSnap.data().status === 'completed';
  } catch (err) {
    console.warn('Migration status notice (defaulting to not completed):', err);
    return false;
  }
};

/**
 * Mark the image migration as completed.
 */
export const markMigrationComplete = async (): Promise<void> => {
  try {
    const metaRef = doc(db, 'systemMeta', 'imageMigration');
    await setDoc(metaRef, { status: 'completed', completedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Failed to mark migration complete:', err);
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
  try {
    localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
  } catch (storageErr) {
    console.warn('Local storage quota notice (database sync will proceed):', storageErr);
  }
  notifyParts(cachedParts, dbStatus.isConnected);

  // Persist directly to Google Cloud Firestore
  try {
    const partRef = doc(db, 'parts', savedPart.id);
    await setDoc(partRef, savedPart, { merge: true });
    dbStatus.lastSyncTime = new Date().toLocaleTimeString();
    dbStatus.partCount = parts.length;
    notifyStatus();
  } catch (err: any) {
    console.error('Failed saving part to Firestore:', err);
    throw new Error(`Cloud Database Sync Note: ${err.message || 'Firestore write failed'}`);
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
 * Save multiple parts of a category in batch to both Firestore and local state
 */
export const batchSaveParts = async (partsData: Array<Omit<AutoPart, 'id' | 'createdAt'> & { id?: string }>): Promise<AutoPart[]> => {
  const parts = getStoredParts();
  const now = new Date().toISOString();
  const savedParts: AutoPart[] = [];

  for (let i = 0; i < partsData.length; i++) {
    const item = partsData[i];
    const newPart: AutoPart = {
      ...item,
      id: item.id || `jd-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
    } as AutoPart;

    savedParts.push(newPart);
    parts.unshift(newPart);

    if (newPart.imageUrl) {
      rememberImage(newPart.ybNo, newPart.imageUrl, newPart.itemName);
      rememberImage(newPart.oem, newPart.imageUrl, newPart.itemName);
      rememberImage(newPart.itemName, newPart.imageUrl, newPart.itemName);
    }
  }

  cachedParts = [...parts];
  try {
    localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
  } catch (storageErr) {
    console.warn('Local storage quota notice (database sync will proceed):', storageErr);
  }
  notifyParts(cachedParts, dbStatus.isConnected);

  // Persist all to Firestore
  try {
    const promises = savedParts.map((p) => {
      const partRef = doc(db, 'parts', p.id);
      return setDoc(partRef, p, { merge: true });
    });
    await Promise.all(promises);
    dbStatus.lastSyncTime = new Date().toLocaleTimeString();
    dbStatus.partCount = parts.length;
    notifyStatus();
  } catch (err: any) {
    console.error('Failed batch saving parts to Firestore:', err);
    throw new Error(`Cloud Database Sync Note: ${err.message || 'Firestore batch write failed'}`);
  }

  return savedParts;
};

/**
 * Delete part from both Firestore and local state
 */
export const deletePart = async (id: string): Promise<void> => {
  const parts = getStoredParts();
  const partToTrash = parts.find(p => p.id === id);
  const updatedParts = parts.filter(p => p.id !== id);
  
  cachedParts = [...updatedParts];
  localStorage.setItem(PARTS_KEY, JSON.stringify(updatedParts));
  notifyParts(cachedParts, dbStatus.isConnected);

  try {
    const partRef = doc(db, 'parts', id);
    if (partToTrash) {
      const trashRef = collection(db, 'trash');
      await addDoc(trashRef, {
        ...partToTrash,
        deletedAt: new Date().toISOString(),
      });
    }
    await deleteDoc(partRef);
    dbStatus.lastSyncTime = new Date().toLocaleTimeString();
    notifyStatus();
  } catch (err) {
    console.error('CRITICAL: Failed deleting part from Firestore:', err);
    throw err; // Re-throw to inform caller
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
  try {
    localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
  } catch (storageErr) {
    console.warn('Local storage image cache notice:', storageErr);
  }

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
