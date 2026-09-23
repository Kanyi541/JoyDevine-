import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from './firebase';
import { POSUser, UserRole } from '../types';

const POS_USERS_COLLECTION = 'posUsers';
const POS_SESSION_KEY = 'joydevine_pos_active_session_v2';
const LOCAL_USERS_BACKUP_KEY = 'joydevine_pos_users_cache_v2';

// Default Administrator Account as mandated by the business owner
export const DEFAULT_ADMIN_USER: POSUser = {
  id: 'admin_devine2026',
  username: 'Devine2026',
  displayName: 'Joy Devine (Admin)',
  password: 'Devine2026',
  role: 'admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'System',
};

// In-memory cache of POS users
let cachedPOSUsers: POSUser[] = [];

// Load local fallback cache
function getLocalUsersCache(): POSUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_BACKUP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return [DEFAULT_ADMIN_USER];
}

function saveLocalUsersCache(users: POSUser[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_BACKUP_KEY, JSON.stringify(users));
  } catch {
    // Ignore error
  }
}

/**
 * Ensures the default Admin account (Devine2026) exists in Firestore
 */
export async function ensureDefaultAdminExists(): Promise<void> {
  try {
    const usersCollection = collection(db, POS_USERS_COLLECTION);
    const snap = await getDocs(usersCollection);
    
    let adminFound = false;
    snap.forEach((d) => {
      const u = d.data() as POSUser;
      if (u.username && u.username.toLowerCase() === 'devine2026') {
        adminFound = true;
      }
    });

    if (!adminFound) {
      const adminDocRef = doc(db, POS_USERS_COLLECTION, DEFAULT_ADMIN_USER.id);
      await setDoc(adminDocRef, DEFAULT_ADMIN_USER, { merge: true });
    }
  } catch (err) {
    console.warn('Notice: Could not sync default admin to Firestore (offline or init):', err);
  }
}

/**
 * Real-time subscription to all POS users from Firebase Firestore
 */
export function subscribeToPOSUsers(callback: (users: POSUser[]) => void): () => void {
  // Immediately provide cached or default users
  const initial = cachedPOSUsers.length > 0 ? cachedPOSUsers : getLocalUsersCache();
  callback(initial);

  try {
    const usersCollection = collection(db, POS_USERS_COLLECTION);
    const unsubscribe = onSnapshot(
      usersCollection,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, seed default admin
          ensureDefaultAdminExists().then(() => {
            callback([DEFAULT_ADMIN_USER]);
          });
          return;
        }

        const list: POSUser[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as POSUser;
          list.push({ ...data, id: d.id });
        });

        // Ensure Devine2026 is always present
        const hasAdmin = list.some((u) => u.username?.toLowerCase() === 'devine2026');
        if (!hasAdmin) {
          list.unshift(DEFAULT_ADMIN_USER);
        }

        cachedPOSUsers = list;
        saveLocalUsersCache(list);
        callback(list);
      },
      (error) => {
        console.warn('Firestore posUsers listener fallback:', error);
        callback(getLocalUsersCache());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Error setting up posUsers subscription:', err);
    return () => {};
  }
}

/**
 * Fetch all users directly from Firebase
 */
export async function fetchPOSUsers(): Promise<POSUser[]> {
  try {
    const usersCollection = collection(db, POS_USERS_COLLECTION);
    const snapshot = await getDocs(usersCollection);
    const list: POSUser[] = [];
    snapshot.forEach((d) => {
      list.push({ ...(d.data() as POSUser), id: d.id });
    });

    if (list.length === 0) {
      await ensureDefaultAdminExists();
      return [DEFAULT_ADMIN_USER];
    }

    cachedPOSUsers = list;
    saveLocalUsersCache(list);
    return list;
  } catch {
    return getLocalUsersCache();
  }
}

/**
 * Admin creates a new staff user (Cashier or Admin)
 */
export async function createPOSUser(userData: {
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  createdBy: string;
}): Promise<{ success: boolean; message?: string; user?: POSUser }> {
  const cleanUsername = userData.username.trim();
  if (!cleanUsername) {
    return { success: false, message: 'Username is required.' };
  }
  if (!userData.password || userData.password.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters.' };
  }

  // Check for duplicate username
  const currentUsers = await fetchPOSUsers();
  const duplicate = currentUsers.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (duplicate) {
    return { success: false, message: `Username "${cleanUsername}" is already taken.` };
  }

  const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: POSUser = {
    id: newId,
    username: cleanUsername,
    displayName: userData.displayName.trim() || cleanUsername,
    password: userData.password,
    role: userData.role,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy: userData.createdBy,
  };

  try {
    const docRef = doc(db, POS_USERS_COLLECTION, newId);
    await setDoc(docRef, newUser);

    cachedPOSUsers = [...cachedPOSUsers, newUser];
    saveLocalUsersCache(cachedPOSUsers);

    return { success: true, user: newUser };
  } catch (err: any) {
    // Save to local cache as fallback
    cachedPOSUsers = [...cachedPOSUsers, newUser];
    saveLocalUsersCache(cachedPOSUsers);
    return { 
      success: true, 
      user: newUser, 
      message: 'Created in local cache (will sync with Firestore when online).' 
    };
  }
}

/**
 * Admin updates an existing staff user
 */
export async function updatePOSUser(
  userId: string, 
  updates: Partial<Omit<POSUser, 'id' | 'createdAt'>>
): Promise<{ success: boolean; message?: string }> {
  try {
    const docRef = doc(db, POS_USERS_COLLECTION, userId);
    await updateDoc(docRef, updates);

    cachedPOSUsers = cachedPOSUsers.map((u) => 
      u.id === userId ? { ...u, ...updates } : u
    );
    saveLocalUsersCache(cachedPOSUsers);

    // Update active session if updated user is currently logged in
    const active = getCurrentPOSUser();
    if (active && active.id === userId) {
      savePOSSession({ ...active, ...updates });
    }

    return { success: true };
  } catch (err: any) {
    cachedPOSUsers = cachedPOSUsers.map((u) => 
      u.id === userId ? { ...u, ...updates } : u
    );
    saveLocalUsersCache(cachedPOSUsers);
    return { success: true, message: 'Updated locally.' };
  }
}

/**
 * Admin deletes a staff user
 */
export async function deletePOSUser(userId: string): Promise<{ success: boolean; message?: string }> {
  // Prevent deleting the main admin account Devine2026
  const user = cachedPOSUsers.find((u) => u.id === userId);
  if (user && user.username.toLowerCase() === 'devine2026') {
    return { success: false, message: 'The primary Admin account "Devine2026" cannot be deleted.' };
  }

  try {
    const docRef = doc(db, POS_USERS_COLLECTION, userId);
    await deleteDoc(docRef);

    cachedPOSUsers = cachedPOSUsers.filter((u) => u.id !== userId);
    saveLocalUsersCache(cachedPOSUsers);
    return { success: true };
  } catch (err: any) {
    cachedPOSUsers = cachedPOSUsers.filter((u) => u.id !== userId);
    saveLocalUsersCache(cachedPOSUsers);
    return { success: true };
  }
}

/**
 * Authenticate POS user with Username and Password
 */
export async function authenticatePOS(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: POSUser; message?: string }> {
  const cleanUsername = usernameInput.trim();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername) {
    return { success: false, message: 'Please enter your username.' };
  }
  if (!cleanPassword) {
    return { success: false, message: 'Please enter your password.' };
  }

  // First check direct Admin credentials (Devine2026 with Devine2026 or joydevine2026)
  const isDirectAdminUsername = cleanUsername.toLowerCase() === 'devine2026';
  const isDirectAdminPass = cleanPassword === 'Devine2026' || cleanPassword === 'joydevine2026';
  
  if (isDirectAdminUsername && isDirectAdminPass) {
    savePOSSession(DEFAULT_ADMIN_USER);
    ensureDefaultAdminExists().catch(() => {});
    return { success: true, user: DEFAULT_ADMIN_USER };
  }

  // Try Firebase Authentication
  try {
    const email = `${cleanUsername.toLowerCase()}@pos.joydevine.com`;
    await signInWithEmailAndPassword(auth, email, cleanPassword);
  } catch (error) {
    console.warn('Firebase Auth failed, checking local fallback:', error);
    // If Firebase Auth fails, maybe it's not set up for this user yet
    // For now, let's keep the old password verification as fallback for existing users
    // who haven't been migrated yet.
  }

  // Fetch or refresh users list
  let users = cachedPOSUsers.length > 0 ? cachedPOSUsers : await fetchPOSUsers();

  const user = users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (user) {
    // Check if account is deactivated
    if (user.isActive === false) {
      return { 
        success: false, 
        message: 'This user account has been deactivated by the Administrator. Please contact Joy Devine.' 
      };
    }

    // Verify password (or allow master admin bypass for Devine2026)
    const matches = user.password === cleanPassword;

    if (matches) {
      const updatedUser: POSUser = {
        ...user,
        lastLoginAt: new Date().toISOString(),
      };
      
      savePOSSession(updatedUser);
      // Asynchronously update last login
      updatePOSUser(user.id, { lastLoginAt: updatedUser.lastLoginAt }).catch(() => {});

      return { success: true, user: updatedUser };
    } else {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }
  }

  return { 
    success: false, 
    message: `User "${cleanUsername}" was not found.` 
  };
}

/**
 * Save user session to localStorage
 */
export function savePOSSession(user: POSUser): void {
  try {
    localStorage.setItem(POS_SESSION_KEY, JSON.stringify(user));
  } catch {
    // Ignore error
  }
}

/**
 * Retrieve current logged-in POS user
 */
export function getCurrentPOSUser(): POSUser | null {
  try {
    const raw = localStorage.getItem(POS_SESSION_KEY);
    if (raw) {
      const user = JSON.parse(raw) as POSUser;
      if (user && user.username) {
        return user;
      }
    }
  } catch {
    // Ignore error
  }
  return null;
}

/**
 * Log out current POS user
 */
export function logoutPOSUser(): void {
  try {
    localStorage.removeItem(POS_SESSION_KEY);
  } catch {
    // Ignore error
  }
}

/**
 * Check if the currently logged in user has Admin privileges
 */
export function isUserAdmin(user: POSUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.username.toLowerCase() === 'devine2026';
}
