import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';

export interface CameraSessionData {
  id: string;
  status: 'waiting' | 'connected' | 'expired';
  imageUrl?: string | null;
  photoTimestamp?: number;
  itemName?: string;
  ybNo?: string;
  createdAt: string;
  connectedAt?: string;
  updatedAt?: string;
}

const COLLECTION_NAME = 'cameraSessions';
const LOCAL_STORAGE_SESSION_KEY = 'joydevine_pos_paired_session_id';

/**
 * Get or create a persistent pairing session.
 * Re-uses existing session ID so the attendant only needs to scan the QR code once!
 */
export async function getOrCreatePersistentSession(metadata?: { itemName?: string; ybNo?: string }): Promise<{
  sessionId: string;
  isExisting: boolean;
}> {
  try {
    const existingId = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (existingId) {
      const sessionRef = doc(db, COLLECTION_NAME, existingId);
      const snap = await getDoc(sessionRef);
      if (snap.exists()) {
        // Re-use active session and update target part info
        await updateDoc(sessionRef, {
          itemName: metadata?.itemName || '',
          ybNo: metadata?.ybNo || '',
          updatedAt: new Date().toISOString()
        });
        return { sessionId: existingId, isExisting: true };
      }
    }
  } catch (err) {
    console.warn('Could not verify existing camera session:', err);
  }

  // Create new session if none exists
  const newId = `cam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sessionRef = doc(db, COLLECTION_NAME, newId);

  const initialData: CameraSessionData = {
    id: newId,
    status: 'waiting',
    imageUrl: null,
    photoTimestamp: 0,
    itemName: metadata?.itemName || '',
    ybNo: metadata?.ybNo || '',
    createdAt: new Date().toISOString(),
  };

  await setDoc(sessionRef, initialData);
  try {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, newId);
  } catch {}

  return { sessionId: newId, isExisting: false };
}

/**
 * Updates the active product being edited on the PC so the phone sees the new name/YB No in real time
 */
export async function updateActiveProductInSession(
  sessionId: string, 
  itemName: string, 
  ybNo?: string
): Promise<void> {
  if (!sessionId) return;
  try {
    const sessionRef = doc(db, COLLECTION_NAME, sessionId);
    await updateDoc(sessionRef, {
      itemName: itemName || '',
      ybNo: ybNo || '',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Could not update active item in camera session:', err);
  }
}

/**
 * Real-time listener on PC or Phone
 */
export function listenToCameraSession(
  sessionId: string, 
  onUpdate: (session: CameraSessionData | null) => void
): () => void {
  if (!sessionId) return () => {};
  try {
    const sessionRef = doc(db, COLLECTION_NAME, sessionId);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CameraSessionData);
      } else {
        onUpdate(null);
      }
    }, (err) => {
      console.warn('Camera session listener note:', err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Error setting up camera session listener:', err);
    return () => {};
  }
}

/**
 * Phone reports it has connected / scanned the QR code
 */
export async function notifyPhoneConnected(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    const sessionRef = doc(db, COLLECTION_NAME, sessionId);
    await updateDoc(sessionRef, {
      status: 'connected',
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn('Could not update session status to connected:', e);
  }
}

/**
 * Phone submits a new photo for whatever product is currently open on PC
 */
export async function submitPhonePhoto(sessionId: string, imageUrl: string): Promise<void> {
  if (!sessionId) return;
  const sessionRef = doc(db, COLLECTION_NAME, sessionId);
  await updateDoc(sessionRef, {
    status: 'connected',
    imageUrl,
    photoTimestamp: Date.now(),
    updatedAt: new Date().toISOString()
  });
}

/**
 * Fetch camera session details for phone interface
 */
export async function getCameraSession(sessionId: string): Promise<CameraSessionData | null> {
  if (!sessionId) return null;
  try {
    const sessionRef = doc(db, COLLECTION_NAME, sessionId);
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      return snap.data() as CameraSessionData;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Disconnect and remove persistent session
 */
export async function disconnectCameraSession(sessionId: string): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    if (sessionId) {
      const sessionRef = doc(db, COLLECTION_NAME, sessionId);
      await deleteDoc(sessionRef);
    }
  } catch {
    // Ignore cleanup errors
  }
}
