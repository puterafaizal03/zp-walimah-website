import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  DocumentData,
  Firestore,
  Query,
  QuerySnapshot,
  doc,
  getDocFromServer,
  getDocsFromCache,
  getDocsFromServer,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let persistenceActive = false;

function createFirestoreInstance(): Firestore {
  const canUseIndexedDb =
    typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

  if (canUseIndexedDb) {
    try {
      const instance = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        firebaseConfig.firestoreDatabaseId
      );
      persistenceActive = true;
      return instance;
    } catch {
      // Fall back safely to non-persistent memory cache when IndexedDB or multi-tab lock fails
    }
  }

  try {
    persistenceActive = false;
    return initializeFirestore(
      app,
      {
        localCache: memoryLocalCache(),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db: Firestore = createFirestoreInstance();
export const isPersistentCacheActive = persistenceActive;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const FIREBASE_CONFIG = firebaseConfig;
export const HOST_ADMIN_EMAIL = 'PuteraFaizal26@gmail.com';
export const FIRESTORE_QUOTA_UPGRADE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`;

export const ALBUM_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const PUBLIC_WISHES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const QUOTA_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

const QUOTA_COOLDOWN_KEY = 'zp_fs_quota_cooldown_until';
const PUBLIC_CACHE_FRESH_PREFIX = 'zp_fs_fresh_';
const CONNECTION_CHECK_SESSION_KEY = 'zp_fs_checked';

let inMemoryQuotaCooldownUntil = 0;
const inMemoryFreshMap = new Map<string, number>();
let activeConnectionCheckPromise: Promise<boolean> | null = null;

function safeReadStorage(
  storageKind: 'local' | 'session',
  key: string
): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const store = storageKind === 'local' ? window.localStorage : window.sessionStorage;
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeWriteStorage(
  storageKind: 'local' | 'session',
  key: string,
  value: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const store = storageKind === 'local' ? window.localStorage : window.sessionStorage;
    store?.setItem(key, value);
  } catch {
    // Ignore storage failures in private browsing / restricted environments
  }
}

function safeRemoveStorage(storageKind: 'local' | 'session', key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const store = storageKind === 'local' ? window.localStorage : window.sessionStorage;
    store?.removeItem(key);
  } catch {
    // Ignore
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code =
    'code' in error ? String((error as { code?: unknown }).code).toLowerCase() : '';
  const msg =
    'message' in error
      ? String((error as { message?: unknown }).message).toLowerCase()
      : '';
  const status =
    'status' in error ? Number((error as { status?: unknown }).status) : 0;
  return (
    status === 429 ||
    code.includes('resource-exhausted') ||
    code.includes('resource_exhausted') ||
    msg.includes('quota exceeded') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota_cooldown_active') ||
    msg.includes('429')
  );
}

export function isQuotaCooldownActive(): boolean {
  const now = Date.now();
  const storedRaw = safeReadStorage('local', QUOTA_COOLDOWN_KEY);
  const storedUntil = storedRaw ? Number(storedRaw) : 0;
  const effectiveUntil = Math.max(
    inMemoryQuotaCooldownUntil,
    Number.isFinite(storedUntil) ? storedUntil : 0
  );
  return effectiveUntil > now;
}

export function markQuotaExceededCooldown(durationMs: number = QUOTA_COOLDOWN_MS): void {
  const until = Date.now() + durationMs;
  inMemoryQuotaCooldownUntil = until;
  safeWriteStorage('local', QUOTA_COOLDOWN_KEY, String(until));
}

export function clearQuotaExceededCooldown(): void {
  inMemoryQuotaCooldownUntil = 0;
  safeRemoveStorage('local', QUOTA_COOLDOWN_KEY);
}

export function isPublicCacheFresh(cacheKey: string, ttlMs: number): boolean {
  const now = Date.now();
  const memTs = inMemoryFreshMap.get(cacheKey) ?? 0;
  const storedRaw = safeReadStorage('local', `${PUBLIC_CACHE_FRESH_PREFIX}${cacheKey}`);
  const storedTs = storedRaw ? Number(storedRaw) : 0;
  const lastFreshAt = Math.max(memTs, Number.isFinite(storedTs) ? storedTs : 0);
  return lastFreshAt > 0 && now - lastFreshAt < ttlMs;
}

export function markPublicCacheFresh(cacheKey: string): void {
  const now = Date.now();
  inMemoryFreshMap.set(cacheKey, now);
  safeWriteStorage('local', `${PUBLIC_CACHE_FRESH_PREFIX}${cacheKey}`, String(now));
}

export function createQuotaCooldownError(): Error & { code: string } {
  const err = new Error('RESOURCE_EXHAUSTED: quota_cooldown_active') as Error & {
    code: string;
  };
  err.code = 'resource-exhausted';
  return err;
}

export interface PublicCachedQueryResult<T = DocumentData> {
  snapshot: QuerySnapshot<T>;
  fromCache: boolean;
  quotaHit: boolean;
  serverError?: unknown;
}

/**
 * Fetches PUBLIC Firestore queries (`public_wishes` / `shared_album_photos`) using
 * persistent IndexedDB cache first when fresh or during an active quota cooldown,
 * refreshing from server when stale or explicitly requested, and falling back to
 * cached documents on server/quota errors instead of wiping the UI.
 */
export async function fetchPublicQueryWithCacheFallback<T = DocumentData>(
  q: Query<T>,
  options: {
    cacheKey: string;
    ttlMs: number;
    forceServer?: boolean;
  }
): Promise<PublicCachedQueryResult<T>> {
  let cachedSnapshot: QuerySnapshot<T> | null = null;
  try {
    cachedSnapshot = await getDocsFromCache(q);
  } catch {
    cachedSnapshot = null;
  }

  const hasCachedDocs = Boolean(cachedSnapshot && !cachedSnapshot.empty);
  const cooldownActive = isQuotaCooldownActive();
  const cacheIsFresh = isPublicCacheFresh(options.cacheKey, options.ttlMs);

  // Serve directly from IndexedDB cache when fresh or while quota cooldown is active (0 server reads)
  if (!options.forceServer && hasCachedDocs && cachedSnapshot && (cacheIsFresh || cooldownActive)) {
    return {
      snapshot: cachedSnapshot,
      fromCache: true,
      quotaHit: cooldownActive,
    };
  }

  // Do not hit the server automatically while a quota cooldown is active if cache is empty
  if (!options.forceServer && cooldownActive) {
    throw createQuotaCooldownError();
  }

  try {
    const serverSnapshot = await getDocsFromServer(q);
    clearQuotaExceededCooldown();
    markPublicCacheFresh(options.cacheKey);
    return {
      snapshot: serverSnapshot,
      fromCache: false,
      quotaHit: false,
    };
  } catch (error) {
    const quotaHit = isQuotaExceededError(error);
    if (quotaHit) {
      markQuotaExceededCooldown();
    }

    if (hasCachedDocs && cachedSnapshot) {
      return {
        snapshot: cachedSnapshot,
        fromCache: true,
        quotaHit,
        serverError: error,
      };
    }

    throw error;
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Explicit, session-deduplicated server connectivity diagnostic.
 * Never auto-runs on page load, never queries while a quota cooldown is active,
 * and uses getDocFromServer so a cached hit is never mistaken for a live server connection.
 */
export async function verifyServerConnection(): Promise<boolean> {
  if (isQuotaCooldownActive()) {
    return false;
  }

  if (safeReadStorage('session', CONNECTION_CHECK_SESSION_KEY) === '1') {
    return true;
  }

  if (activeConnectionCheckPromise) {
    return activeConnectionCheckPromise;
  }

  activeConnectionCheckPromise = (async () => {
    try {
      await getDocFromServer(doc(db, 'public_wishes', 'connection_check'));
      safeWriteStorage('session', CONNECTION_CHECK_SESSION_KEY, '1');
      clearQuotaExceededCooldown();
      return true;
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceededCooldown();
      }
      return false;
    } finally {
      activeConnectionCheckPromise = null;
    }
  })();

  return activeConnectionCheckPromise;
}
