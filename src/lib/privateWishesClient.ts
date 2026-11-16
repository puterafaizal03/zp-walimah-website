import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import {
  FIREBASE_CONFIG,
  HOST_ADMIN_EMAIL,
  clearQuotaExceededCooldown,
  createQuotaCooldownError,
  isQuotaCooldownActive,
  isQuotaExceededError,
  markQuotaExceededCooldown,
} from './firebase';

export interface PrivateWishRecord {
  id: string;
  guestName: string;
  relationship?: string;
  message: string;
  createdAt: Timestamp | null;
}

const PRIVATE_MEMORY_TTL_MS = 2 * 60 * 1000; // Volatile 2-minute memory cache only

// Volatile in-memory cache ONLY (never written to IndexedDB, localStorage, or sessionStorage)
const volatilePrivateCache = new Map<
  string,
  { wishes: PrivateWishRecord[]; fetchedAt: number }
>();
const inFlightPrivateReads = new Map<string, Promise<PrivateWishRecord[]>>();

const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${encodeURIComponent(FIREBASE_CONFIG.firestoreDatabaseId)}`;

function assertVerifiedHostUser(user: User | null): asserts user is User {
  if (
    !user ||
    !user.emailVerified ||
    user.email?.toLowerCase() !== HOST_ADMIN_EMAIL.toLowerCase()
  ) {
    throw new Error('Unauthorized: Verified host login required.');
  }
}

function createRestError(status: number, rawBody: string): Error & { code: string; status: number } {
  let parsedMessage = rawBody;
  let parsedStatus = '';
  try {
    const json = JSON.parse(rawBody) as {
      error?: { message?: string; status?: string };
    };
    if (json?.error?.message) parsedMessage = json.error.message;
    if (json?.error?.status) parsedStatus = json.error.status;
  } catch {
    // Ignore non-JSON body
  }

  const code =
    status === 429 || parsedStatus === 'RESOURCE_EXHAUSTED'
      ? 'resource-exhausted'
      : status === 401 || status === 403 || parsedStatus === 'PERMISSION_DENIED'
        ? 'permission-denied'
        : 'unavailable';

  const err = new Error(parsedMessage || `HTTP ${status}`) as Error & {
    code: string;
    status: number;
  };
  err.code = code;
  err.status = status;
  return err;
}

function parseTimestampField(value?: { timestampValue?: string }): Timestamp | null {
  if (!value?.timestampValue) return null;
  const date = new Date(value.timestampValue);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

/**
 * Clears all volatile in-memory private wish caches (must be called on sign-out or user switch).
 */
export function clearPrivateWishesMemoryCache(): void {
  volatilePrivateCache.clear();
  inFlightPrivateReads.clear();
}

/**
 * Reads `private_wishes` via authenticated Cloud Firestore REST API so private guest messages
 * are NEVER stored inside Firestore SDK's IndexedDB persistentLocalCache on any visitor device.
 */
export async function listPrivateWishesForHost(
  user: User,
  options: { forceServer?: boolean } = {}
): Promise<{ wishes: PrivateWishRecord[]; fromMemoryCache: boolean }> {
  assertVerifiedHostUser(user);

  const cached = volatilePrivateCache.get(user.uid);
  const now = Date.now();
  const cacheIsFresh = Boolean(cached && now - cached.fetchedAt < PRIVATE_MEMORY_TTL_MS);

  if (!options.forceServer && cached && (cacheIsFresh || isQuotaCooldownActive())) {
    return { wishes: cached.wishes, fromMemoryCache: true };
  }

  if (!options.forceServer && isQuotaCooldownActive()) {
    throw createQuotaCooldownError();
  }

  const existingPromise = inFlightPrivateReads.get(user.uid);
  if (existingPromise) {
    const wishes = await existingPromise;
    return { wishes, fromMemoryCache: false };
  }

  const requestPromise = (async (): Promise<PrivateWishRecord[]> => {
    try {
      const idToken = await user.getIdToken();
      const response = await fetch(
        `${FIRESTORE_REST_BASE}/documents:runQuery?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: 'private_wishes' }],
              orderBy: [
                {
                  field: { fieldPath: 'createdAt' },
                  direction: 'DESCENDING',
                },
              ],
              limit: 60,
            },
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        throw createRestError(response.status, body);
      }

      const rows = (await response.json()) as Array<{
        document?: {
          name?: string;
          fields?: {
            guestName?: { stringValue?: string };
            relationship?: { stringValue?: string };
            message?: { stringValue?: string };
            createdAt?: { timestampValue?: string };
          };
        };
      }>;

      const wishes: PrivateWishRecord[] = [];
      for (const row of rows) {
        const docName = row.document?.name;
        const fields = row.document?.fields;
        if (!docName || !fields) continue;
        const id = docName.split('/').pop() ?? '';
        if (!id) continue;
        wishes.push({
          id,
          guestName: String(fields.guestName?.stringValue ?? ''),
          relationship: fields.relationship?.stringValue
            ? String(fields.relationship.stringValue)
            : undefined,
          message: String(fields.message?.stringValue ?? ''),
          createdAt: parseTimestampField(fields.createdAt),
        });
      }

      clearQuotaExceededCooldown();
      volatilePrivateCache.set(user.uid, { wishes, fetchedAt: Date.now() });
      return wishes;
    } catch (error) {
      if (isQuotaExceededError(error)) {
        markQuotaExceededCooldown();
      }
      throw error;
    } finally {
      inFlightPrivateReads.delete(user.uid);
    }
  })();

  inFlightPrivateReads.set(user.uid, requestPromise);
  const wishes = await requestPromise;
  return { wishes, fromMemoryCache: false };
}

/**
 * Submits a new private wish directly via Cloud Firestore REST commit with server REQUEST_TIME
 * so private guest messages are never persisted in IndexedDB on public visitors' devices.
 */
export async function createPrivateWishDirect(
  wishId: string,
  input: {
    guestName: string;
    relationship?: string;
    message: string;
  },
  signedInUser?: User | null
): Promise<void> {
  const fields: Record<string, { stringValue: string }> = {
    guestName: { stringValue: input.guestName },
    message: { stringValue: input.message },
  };
  if (input.relationship && input.relationship.length > 0) {
    fields.relationship = { stringValue: input.relationship };
  }

  const documentPath = `projects/${FIREBASE_CONFIG.projectId}/databases/${FIREBASE_CONFIG.firestoreDatabaseId}/documents/private_wishes/${wishId}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (signedInUser) {
    try {
      const token = await signedInUser.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // Public guests can submit private wishes without Auth
    }
  }

  const response = await fetch(
    `${FIRESTORE_REST_BASE}/documents:commit?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: documentPath,
              fields,
            },
            updateTransforms: [
              {
                fieldPath: 'createdAt',
                setToServerValue: 'REQUEST_TIME',
              },
            ],
            currentDocument: {
              exists: false,
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    const err = createRestError(response.status, body);
    if (isQuotaExceededError(err)) {
      markQuotaExceededCooldown();
    }
    throw err;
  }
}

/**
 * Prepends a newly submitted private wish into the verified host's volatile memory cache (if active).
 */
export function prependPrivateWishInMemory(user: User, wish: PrivateWishRecord): void {
  const entry = volatilePrivateCache.get(user.uid);
  if (!entry) return;
  volatilePrivateCache.set(user.uid, {
    wishes: [wish, ...entry.wishes.filter((w) => w.id !== wish.id)],
    fetchedAt: entry.fetchedAt,
  });
}

/**
 * Deletes a private wish via authenticated Cloud Firestore REST API (host-only).
 */
export async function deletePrivateWishForHost(user: User, wishId: string): Promise<void> {
  assertVerifiedHostUser(user);
  const idToken = await user.getIdToken();
  const response = await fetch(
    `${FIRESTORE_REST_BASE}/documents/private_wishes/${encodeURIComponent(wishId)}?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    const err = createRestError(response.status, body);
    if (isQuotaExceededError(err)) {
      markQuotaExceededCooldown();
    }
    throw err;
  }

  const entry = volatilePrivateCache.get(user.uid);
  if (entry) {
    volatilePrivateCache.set(user.uid, {
      wishes: entry.wishes.filter((w) => w.id !== wishId),
      fetchedAt: entry.fetchedAt,
    });
  }
}
