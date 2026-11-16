import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Lock,
  LogIn,
  LogOut,
  MessageSquareHeart,
  RefreshCw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
} from 'firebase/firestore';
import {
  HOST_ADMIN_EMAIL,
  OperationType,
  PUBLIC_WISHES_CACHE_TTL_MS,
  auth,
  db,
  fetchPublicQueryWithCacheFallback,
  googleProvider,
  handleFirestoreError,
  isQuotaExceededError,
} from '../lib/firebase';
import {
  clearPrivateWishesMemoryCache,
  createPrivateWishDirect,
  deletePrivateWishForHost,
  listPrivateWishesForHost,
  prependPrivateWishInMemory,
} from '../lib/privateWishesClient';
import { AwanLaratCorner, RoyalDivider } from './RoyalOrnaments';

type WishVisibility = 'open' | 'private';
type ViewTab = 'open' | 'private';

interface GuestWish {
  id: string;
  guestName: string;
  relationship?: string;
  message: string;
  createdAt: Timestamp | null;
}

function generateSafeWishId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `wish_${Date.now()}_${randomPart}`;
}

function getUtf8ByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
}

function formatWishDate(ts: Timestamp | null): string {
  if (!ts) return 'Baru sebentar tadi';
  try {
    return new Intl.DateTimeFormat('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts.toDate());
  } catch {
    return '';
  }
}

const PUBLIC_WISHES_PAGE_SIZE = 10;

interface SessionPublicWishesSnapshot {
  wishes: GuestWish[];
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  fromCache: boolean;
  quotaWarning: boolean;
}

// Volatile in-tab memory snapshot for PUBLIC wishes only (never stores private wishes)
let sessionPublicWishesSnapshot: SessionPublicWishesSnapshot | null = null;

export const GuestbookSection: React.FC = () => {
  // Form state
  const [guestName, setGuestName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState<WishVisibility>('open');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState<WishVisibility | null>(null);

  // Reading tabs & public wishes state (lazy-loaded & paginated)
  const [activeTab, setActiveTab] = useState<ViewTab>('open');
  const [publicWishes, setPublicWishes] = useState<GuestWish[]>(
    () => sessionPublicWishesSnapshot?.wishes ?? []
  );
  const [publicLoading, setPublicLoading] = useState<boolean>(
    () => !sessionPublicWishesSnapshot
  );
  const [publicLoadingMore, setPublicLoadingMore] = useState(false);
  const [publicHasMore, setPublicHasMore] = useState<boolean>(
    () => sessionPublicWishesSnapshot?.hasMore ?? false
  );
  const [lastVisiblePublicDoc, setLastVisiblePublicDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(
      () => sessionPublicWishesSnapshot?.lastVisibleDoc ?? null
    );
  const [publicFromCache, setPublicFromCache] = useState<boolean>(
    () => sessionPublicWishesSnapshot?.fromCache ?? false
  );
  const [publicError, setPublicError] = useState('');
  const [publicQuotaWarning, setPublicQuotaWarning] = useState<boolean>(
    () => sessionPublicWishesSnapshot?.quotaWarning ?? false
  );
  const [hasTriggeredPublicLoad, setHasTriggeredPublicLoad] = useState<boolean>(
    () => Boolean(sessionPublicWishesSnapshot)
  );
  const sectionRef = useRef<HTMLElement | null>(null);
  const inFlightPublicRef = useRef<Promise<void> | null>(null);
  const loadedPublicCursorsRef = useRef<Set<string>>(new Set());

  // Auth & Private wishes state (Host-only, non-persistent memory cache only)
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [privateWishes, setPrivateWishes] = useState<GuestWish[]>([]);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [privateError, setPrivateError] = useState('');
  const [privateQuotaWarning, setPrivateQuotaWarning] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isVerifiedHost = Boolean(
    currentUser?.emailVerified &&
      currentUser.email?.toLowerCase() === HOST_ADMIN_EMAIL.toLowerCase()
  );

  // Listen to Firebase Auth state & clear volatile private wish memory when user changes/signs out
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser((prev) => {
        if (prev?.uid !== user?.uid) {
          clearPrivateWishesMemoryCache();
          setPrivateWishes([]);
          setPrivateError('');
          setPrivateQuotaWarning(false);
        }
        return user;
      });
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const mapWishDocs = (docs: QueryDocumentSnapshot<DocumentData>[]): GuestWish[] =>
    docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        guestName: String(data.guestName ?? ''),
        relationship: data.relationship ? String(data.relationship) : undefined,
        message: String(data.message ?? ''),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
      };
    });

  const syncPublicSessionSnapshot = useCallback((next: SessionPublicWishesSnapshot) => {
    sessionPublicWishesSnapshot = next;
  }, []);

  const fetchPublicWishes = useCallback(
    async (options?: {
      cursor?: QueryDocumentSnapshot<DocumentData> | null;
      forceServer?: boolean;
    }) => {
      if (inFlightPublicRef.current) {
        return inFlightPublicRef.current;
      }

      const cursor = options?.cursor ?? null;
      const forceServer = Boolean(options?.forceServer);
      const isNextPage = Boolean(cursor);

      if (cursor && !forceServer && loadedPublicCursorsRef.current.has(cursor.id)) {
        return;
      }

      const task = (async () => {
        const publicPath = 'public_wishes';
        if (isNextPage) {
          setPublicLoadingMore(true);
        } else {
          setPublicLoading(true);
          setPublicError('');
        }

        const q = cursor
          ? query(
              collection(db, publicPath),
              orderBy('createdAt', 'desc'),
              startAfter(cursor),
              limit(PUBLIC_WISHES_PAGE_SIZE)
            )
          : query(
              collection(db, publicPath),
              orderBy('createdAt', 'desc'),
              limit(PUBLIC_WISHES_PAGE_SIZE)
            );

        const cacheKey = cursor ? `public_wishes_after_${cursor.id}` : 'public_wishes_page_1';

        try {
          const result = await fetchPublicQueryWithCacheFallback(q, {
            cacheKey,
            ttlMs: PUBLIC_WISHES_CACHE_TTL_MS,
            forceServer,
          });

          const items = mapWishDocs(result.snapshot.docs);
          const nextCursor =
            result.snapshot.docs[result.snapshot.docs.length - 1] ?? cursor ?? null;
          const moreAvailable = result.snapshot.docs.length === PUBLIC_WISHES_PAGE_SIZE;

          if (cursor) {
            loadedPublicCursorsRef.current.add(cursor.id);
          } else if (forceServer) {
            loadedPublicCursorsRef.current.clear();
          }

          setPublicWishes((prev) => {
            let nextList: GuestWish[];
            if (isNextPage) {
              const seen = new Set(prev.map((w) => w.id));
              nextList = [...prev];
              for (const item of items) {
                if (!seen.has(item.id)) nextList.push(item);
              }
            } else {
              nextList = items;
            }
            syncPublicSessionSnapshot({
              wishes: nextList,
              lastVisibleDoc: nextCursor,
              hasMore: moreAvailable,
              fromCache: result.fromCache,
              quotaWarning: result.quotaHit,
            });
            return nextList;
          });

          setLastVisiblePublicDoc(nextCursor);
          setPublicHasMore(moreAvailable);
          setPublicFromCache(result.fromCache);
          setPublicQuotaWarning(result.quotaHit);
          setPublicError(
            result.quotaHit
              ? 'Kuota bacaan harian pangkalan data penuh sementara. Paparan ini menggunakan salinan cache tempatan. Semua ucapan sedia ada kekal selamat.'
              : ''
          );
        } catch (error) {
          const quotaHit = isQuotaExceededError(error);
          setPublicQuotaWarning(quotaHit);
          setPublicError(
            quotaHit
              ? 'Kuota bacaan harian pangkalan data sedang penuh sementara. Semua ucapan yang telah dihantar kekal selamat dalam pangkalan data dan tidak dipadam. Sila cuba muat semula apabila kuota harian diset semula.'
              : 'Ucapan umum tidak dapat dimuatkan buat masa ini.'
          );
          if (!quotaHit) {
            try {
              handleFirestoreError(error, OperationType.LIST, publicPath);
            } catch {
              // Logged by handleFirestoreError
            }
          }
        } finally {
          setPublicLoading(false);
          setPublicLoadingMore(false);
          inFlightPublicRef.current = null;
        }
      })();

      inFlightPublicRef.current = task;
      return task;
    },
    [syncPublicSessionSnapshot]
  );

  // Lazy-trigger public guestbook fetch ONLY when Buku Ucapan approaches viewport
  useEffect(() => {
    if (hasTriggeredPublicLoad) return;
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setHasTriggeredPublicLoad(true);
      void fetchPublicWishes();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasTriggeredPublicLoad(true);
          void fetchPublicWishes();
          observer.disconnect();
        }
      },
      { rootMargin: '400px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPublicWishes, hasTriggeredPublicLoad]);

  const fetchPrivateWishes = useCallback(
    async (options?: { forceServer?: boolean }) => {
      if (!authReady || !isVerifiedHost || !currentUser) {
        setPrivateWishes([]);
        setPrivateLoading(false);
        setPrivateError('');
        setPrivateQuotaWarning(false);
        return;
      }

      setPrivateLoading(true);
      setPrivateError('');
      setPrivateQuotaWarning(false);

      try {
        const result = await listPrivateWishesForHost(currentUser, {
          forceServer: options?.forceServer,
        });
        setPrivateWishes(result.wishes);
        setPrivateError('');
        setPrivateQuotaWarning(false);
      } catch (error) {
        const quotaHit = isQuotaExceededError(error);
        setPrivateQuotaWarning(quotaHit);
        setPrivateError(
          quotaHit
            ? 'Kuota bacaan harian pangkalan data sedang penuh sementara. Ucapan sulit tetamu kekal selamat dalam pangkalan data dan tidak dipadam.'
            : 'Ucapan sulit tidak dapat dimuatkan buat masa ini.'
        );
        if (!quotaHit) {
          try {
            handleFirestoreError(error, OperationType.LIST, 'private_wishes');
          } catch {
            // Logged by handleFirestoreError
          }
        }
      } finally {
        setPrivateLoading(false);
      }
    },
    [authReady, currentUser, isVerifiedHost]
  );

  // Fetch private_wishes ONLY when verified host explicitly opens the Private tab
  useEffect(() => {
    if (activeTab === 'private' && authReady && isVerifiedHost) {
      void fetchPrivateWishes();
    }
  }, [activeTab, authReady, fetchPrivateWishes, isVerifiedHost]);

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitSuccess(null);

    const trimmedName = guestName.trim();
    const trimmedRel = relationship.trim();
    const trimmedMsg = message.trim();

    if (
      trimmedName.length < 2 ||
      getUtf8ByteLength(trimmedName) < 2 ||
      getUtf8ByteLength(trimmedName) > 80
    ) {
      setFormError('Sila masukkan nama anda (2 hingga 80 bait UTF-8).');
      return;
    }
    if (getUtf8ByteLength(trimmedRel) > 50) {
      setFormError('Ruangan hubungan tidak boleh melebihi 50 bait UTF-8.');
      return;
    }
    if (
      trimmedMsg.length < 3 ||
      getUtf8ByteLength(trimmedMsg) < 3 ||
      getUtf8ByteLength(trimmedMsg) > 400
    ) {
      setFormError('Sila tuliskan ucapan anda (3 hingga 400 bait UTF-8).');
      return;
    }

    setSubmitting(true);
    const targetCollection = visibility === 'open' ? 'public_wishes' : 'private_wishes';
    const wishId = generateSafeWishId();

    const payload: {
      guestName: string;
      message: string;
      createdAt: ReturnType<typeof serverTimestamp>;
      relationship?: string;
    } = {
      guestName: trimmedName,
      message: trimmedMsg,
      createdAt: serverTimestamp(),
    };

    if (trimmedRel.length > 0) {
      payload.relationship = trimmedRel;
    }

    try {
      if (visibility === 'open') {
        await setDoc(doc(db, targetCollection, wishId), payload);
      } else {
        // Submit private wishes via direct REST API so nothing is cached in IndexedDB
        await createPrivateWishDirect(
          wishId,
          {
            guestName: trimmedName,
            ...(trimmedRel.length > 0 ? { relationship: trimmedRel } : {}),
            message: trimmedMsg,
          },
          currentUser
        );
      }
      const localWish: GuestWish = {
        id: wishId,
        guestName: trimmedName,
        ...(trimmedRel.length > 0 ? { relationship: trimmedRel } : {}),
        message: trimmedMsg,
        createdAt: Timestamp.now(),
      };
      if (visibility === 'open') {
        setPublicWishes((prev) => {
          const nextList = [localWish, ...prev];
          syncPublicSessionSnapshot({
            wishes: nextList,
            lastVisibleDoc: lastVisiblePublicDoc,
            hasMore: publicHasMore,
            fromCache: publicFromCache,
            quotaWarning: publicQuotaWarning,
          });
          return nextList;
        });
        setPublicError('');
        setActiveTab('open');
      } else if (isVerifiedHost && currentUser) {
        prependPrivateWishInMemory(currentUser, localWish);
        setPrivateWishes((prev) => [localWish, ...prev]);
        setPrivateError('');
      }
      setGuestName('');
      setRelationship('');
      setMessage('');
      setSubmitSuccess(visibility);
    } catch (error) {
      const quotaHit = isQuotaExceededError(error);
      setFormError(
        quotaHit
          ? 'Kuota harian pangkalan data sedang penuh sementara. Sila cuba hantar ucapan sebentar lagi.'
          : 'Ucapan gagal dihantar. Sila semak sambungan internet anda dan cuba lagi.'
      );
      if (!quotaHit) {
        try {
          handleFirestoreError(error, OperationType.CREATE, `${targetCollection}/${wishId}`);
        } catch {
          // Logged by handleFirestoreError
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleHostSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `Domain (${window.location.hostname}) belum didaftarkan dalam Firebase Console -> Authentication -> Authorized domains.`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Tetingkap log masuk Google disekat oleh pelayar. Sila benarkan pop-up dan cuba lagi.'
        );
      } else {
        setAuthError('Log masuk dibatalkan atau gagal. Sila cuba lagi.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleHostSignOut = async () => {
    setAuthError('');
    setDeleteError('');
    clearPrivateWishesMemoryCache();
    setPrivateWishes([]);
    setPrivateError('');
    await signOut(auth);
  };

  const handleDeleteWish = async (collectionName: 'public_wishes' | 'private_wishes', wishId: string) => {
    setDeleteError('');
    try {
      if (collectionName === 'public_wishes') {
        await deleteDoc(doc(db, collectionName, wishId));
        setPublicWishes((prev) => {
          const nextList = prev.filter((item) => item.id !== wishId);
          syncPublicSessionSnapshot({
            wishes: nextList,
            lastVisibleDoc: lastVisiblePublicDoc,
            hasMore: publicHasMore,
            fromCache: publicFromCache,
            quotaWarning: publicQuotaWarning,
          });
          return nextList;
        });
      } else if (currentUser) {
        await deletePrivateWishForHost(currentUser, wishId);
        setPrivateWishes((prev) => prev.filter((item) => item.id !== wishId));
      }
    } catch (error) {
      const quotaHit = isQuotaExceededError(error);
      setDeleteError(
        quotaHit
          ? 'Kuota harian pangkalan data sedang penuh sementara. Ucapan gagal dipadam buat masa ini.'
          : 'Ucapan gagal dipadam. Sila pastikan anda log masuk dengan akaun pengantin yang dibenarkan dan sambungan internet aktif.'
      );
      if (!quotaHit) {
        try {
          handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${wishId}`);
        } catch {
          // Logged by handleFirestoreError
        }
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      id="ucapan"
      aria-label="Buku Ucapan Tetamu"
      className="relative w-full py-6 sm:py-10 px-3 sm:px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl rounded-3xl bg-songket-ivory border border-[#C6A15B]/80 shadow-[0_24px_65px_rgba(3,43,32,0.45)] px-4 sm:px-10 md:px-12 py-11 sm:py-14 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C6A15B]/40" />
        <AwanLaratCorner position="tl" className="absolute top-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="tr" className="absolute top-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="bl" className="absolute bottom-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="br" className="absolute bottom-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto">
            <p className="font-script text-2xl sm:text-3xl text-[#8E6D31]">
              Titipan Doa &amp; Ingatan
            </p>
            <h2 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#064E3B]">
              Buku Ucapan
            </h2>
            <p className="mt-2 font-body text-xs sm:text-sm text-[#16261F]/80 leading-relaxed text-balance">
              Kongsikan doa serta kata-kata manis buat mempelai secara terbuka untuk dibaca bersama, atau secara sulit khusus buat pengantin.
            </p>
            <RoyalDivider className="mt-4" />
          </div>

          {/* 2-Column Responsive Layout on Desktop, Clean Vertical Stack on Mobile */}
          <div className="mt-9 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Column: Write a Wish Form with Open vs Private Toggle Buttons */}
            <div className="lg:col-span-5 rounded-2xl bg-[#FAF7F0]/95 border border-[#C6A15B]/55 p-5 sm:p-7">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#064E3B] text-[#E6CB8E] flex items-center justify-center shrink-0">
                  <MessageSquareHeart className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-lg font-bold text-[#064E3B]">
                  Tulis Ucapan Anda
                </h3>
              </div>

              <form onSubmit={handleSubmitWish} noValidate className="space-y-4 font-body">
                <div>
                  <label
                    htmlFor="guestbook-name"
                    className="block text-xs sm:text-sm font-semibold text-[#064E3B] mb-1.5"
                  >
                    Nama Anda <span className="text-[#8E6D31]">*</span>
                  </label>
                  <input
                    id="guestbook-name"
                    type="text"
                    required
                    maxLength={80}
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      if (formError) setFormError('');
                      if (submitSuccess) setSubmitSuccess(null);
                    }}
                    placeholder="Contoh: Puan Aisyah & Keluarga"
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F5F0E5]/70 border border-[#C6A15B]/70 text-[#16261F] placeholder:text-[#16261F]/45 text-sm focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="guestbook-relationship"
                    className="block text-xs sm:text-sm font-semibold text-[#064E3B] mb-1.5"
                  >
                    Hubungan / Kenalan{' '}
                    <span className="font-normal text-[#16261F]/60">(Pilihan)</span>
                  </label>
                  <input
                    id="guestbook-relationship"
                    type="text"
                    maxLength={50}
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="Contoh: Keluarga · Rakan Sekolah · Jiran"
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F5F0E5]/70 border border-[#C6A15B]/70 text-[#16261F] placeholder:text-[#16261F]/45 text-sm focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="guestbook-message"
                      className="block text-xs sm:text-sm font-semibold text-[#064E3B]"
                    >
                      Ucapan &amp; Doa <span className="text-[#8E6D31]">*</span>
                    </label>
                    <span className="text-[11px] text-[#16261F]/60 tabular-nums">
                      {message.length}/400
                    </span>
                  </div>
                  <textarea
                    id="guestbook-message"
                    rows={3}
                    required
                    maxLength={400}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (formError) setFormError('');
                      if (submitSuccess) setSubmitSuccess(null);
                    }}
                    placeholder="Selamat pengantin baru, semoga berkekalan hingga ke jannah..."
                    className="w-full px-4 py-3 rounded-xl bg-[#F5F0E5]/70 border border-[#C6A15B]/70 text-[#16261F] placeholder:text-[#16261F]/45 text-sm focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20 resize-y"
                  />
                </div>

                {/* Open vs Private Visibility Toggle Buttons */}
                <div>
                  <span className="block text-xs sm:text-sm font-semibold text-[#064E3B] mb-2">
                    Tetapan Privasi Ucapan
                  </span>
                  <div
                    className="grid grid-cols-2 gap-2.5"
                    role="radiogroup"
                    aria-label="Tetapan privasi ucapan"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={visibility === 'open'}
                      onClick={() => setVisibility('open')}
                      className={`min-h-[50px] px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] ${
                        visibility === 'open'
                          ? 'bg-[#064E3B] text-[#FAF7F0] border-[#064E3B] shadow-md'
                          : 'bg-[#F5F0E5]/70 text-[#064E3B] border-[#C6A15B]/70 hover:border-[#064E3B]'
                      }`}
                    >
                      <Eye
                        className={`w-4 h-4 shrink-0 ${
                          visibility === 'open' ? 'text-[#E6CB8E]' : 'text-[#8E6D31]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap">Terbuka</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={visibility === 'private'}
                      onClick={() => setVisibility('private')}
                      className={`min-h-[50px] px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] ${
                        visibility === 'private'
                          ? 'bg-[#064E3B] text-[#FAF7F0] border-[#064E3B] shadow-md'
                          : 'bg-[#F5F0E5]/70 text-[#064E3B] border-[#C6A15B]/70 hover:border-[#064E3B]'
                      }`}
                    >
                      <Lock
                        className={`w-4 h-4 shrink-0 ${
                          visibility === 'private' ? 'text-[#E6CB8E]' : 'text-[#8E6D31]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap">Sulit</span>
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-[#16261F]/70 leading-relaxed">
                    {visibility === 'open'
                      ? 'Ucapan Terbuka akan dipaparkan di papan Buku Ucapan untuk dibaca oleh semua tetamu.'
                      : 'Ucapan Sulit disimpan secara rahsia dan hanya boleh dibaca oleh pihak pengantin.'}
                  </p>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-700/30 bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-red-900 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </div>
                )}

                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="rounded-xl border border-[#064E3B]/30 bg-[#064E3B]/10 px-3.5 py-3 text-xs sm:text-sm font-medium text-[#064E3B] flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#064E3B]" aria-hidden="true" />
                      <span>
                        {submitSuccess === 'open'
                          ? 'Terima kasih! Ucapan terbuka anda telah dipaparkan di Buku Ucapan.'
                          : 'Terima kasih! Ucapan sulit anda telah dihantar terus kepada pengantin secara peribadi.'}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#064E3B] border border-[#C6A15B]/80 text-[#FAF7F0] font-semibold text-sm tracking-wide shadow-md hover:bg-[#043B2C] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
                >
                  <Send className="w-4 h-4 text-[#E6CB8E]" aria-hidden="true" />
                  <span>
                    {submitting
                      ? 'Sedang Menghantar...'
                      : visibility === 'open'
                        ? 'Hantar Ucapan Terbuka'
                        : 'Hantar Ucapan Sulit'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right Column: Read Wishes Wall (Open Tab & Host Private Tab) */}
            <div className="lg:col-span-7 flex flex-col">
              {/* Interactive Tab Switcher */}
              <div
                className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-[#E9E1CF] border border-[#C6A15B]/55 font-body"
                role="tablist"
                aria-label="Paparan Buku Ucapan"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'open'}
                  onClick={() => setActiveTab('open')}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === 'open'
                      ? 'bg-[#064E3B] text-[#E6CB8E] shadow-sm'
                      : 'text-[#064E3B] hover:bg-[#FAF7F0]/60'
                  }`}
                >
                  <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Ucapan Terbuka</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'private'}
                  onClick={() => setActiveTab('private')}
                  className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                    activeTab === 'private'
                      ? 'bg-[#064E3B] text-[#E6CB8E] shadow-sm'
                      : 'text-[#064E3B] hover:bg-[#FAF7F0]/60'
                  }`}
                >
                  <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Ucapan Sulit</span>
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="mt-4 rounded-2xl bg-[#FAF7F0]/95 border border-[#C6A15B]/50 p-4 sm:p-6 min-h-[340px] max-h-[520px] overflow-y-auto">
                {deleteError && (
                  <div
                    role="alert"
                    className="mb-3 rounded-xl border border-red-700/30 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-900 flex items-center justify-between gap-2 font-body"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{deleteError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteError('')}
                      aria-label="Tutup amaran padam ucapan"
                      className="p-1 rounded-lg hover:bg-red-100 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {activeTab === 'open' ? (
                  publicLoading && publicWishes.length === 0 ? (
                    <div className="space-y-4 py-4" aria-busy="true">
                      {[1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className="h-20 rounded-xl bg-[#EFE9DA] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : publicError && publicWishes.length === 0 ? (
                    <div className="py-10 px-3 text-center font-body space-y-3 max-w-sm mx-auto">
                      <AlertCircle className="w-7 h-7 text-[#8E6D31] mx-auto" aria-hidden="true" />
                      <p className="text-xs sm:text-sm font-semibold text-[#064E3B]">
                        {publicQuotaWarning
                          ? 'Kuota Bacaan Harian Pangkalan Data Penuh Sementara'
                          : 'Ucapan Tidak Dapat Dimuatkan'}
                      </p>
                      <p className="text-xs text-[#16261F]/75 leading-relaxed">
                        {publicError}
                      </p>
                      <button
                        type="button"
                        onClick={() => void fetchPublicWishes({ forceServer: true })}
                        disabled={publicLoading}
                        className="min-h-[40px] px-4 py-2 rounded-xl bg-[#064E3B] text-[#E6CB8E] border border-[#C6A15B] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#043B2C] cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${publicLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                        <span>Cuba Muat Semula</span>
                      </button>
                    </div>
                  ) : publicWishes.length === 0 ? (
                    <div className="py-14 text-center space-y-2">
                      <MessageSquareHeart
                        className="w-8 h-8 text-[#C6A15B] mx-auto"
                        aria-hidden="true"
                      />
                      <p className="font-heading text-lg font-semibold text-[#064E3B]">
                        Belum Ada Ucapan Terbuka
                      </p>
                      <p className="font-body text-xs sm:text-sm text-[#16261F]/70 max-w-xs mx-auto">
                        Jadilah tetamu pertama yang menitipkan doa serta ucapan indah buat mempelai.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[#C6A15B]/25 font-body text-[11px] text-[#8E6D31]">
                        <span>
                          {publicQuotaWarning || publicFromCache
                            ? `${publicWishes.length} ucapan dipaparkan (cache tempatan)`
                            : `${publicWishes.length} ucapan dipaparkan`}
                        </span>
                        <button
                          type="button"
                          onClick={() => void fetchPublicWishes({ forceServer: true })}
                          disabled={publicLoading || publicLoadingMore}
                          className="inline-flex items-center gap-1 font-semibold hover:text-[#064E3B] cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${publicLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                          <span>Muat Semula</span>
                        </button>
                      </div>

                      {publicError && publicWishes.length > 0 && (
                        <div
                          role="status"
                          className="mb-3 rounded-xl border border-[#C6A15B]/60 bg-[#F5F0E5]/85 px-3 py-2 text-xs text-[#064E3B] flex items-center justify-between gap-2 font-body"
                        >
                          <span className="leading-snug">{publicError}</span>
                          <button
                            type="button"
                            onClick={() =>
                              void fetchPublicWishes({
                                cursor: publicHasMore ? lastVisiblePublicDoc : null,
                                forceServer: true,
                              })
                            }
                            className="shrink-0 font-semibold underline cursor-pointer"
                          >
                            Cuba Lagi
                          </button>
                        </div>
                      )}

                      <div className="divide-y divide-[#C6A15B]/25">
                        {publicWishes.map((wish) => (
                          <article key={wish.id} className="py-4 first:pt-1 last:pb-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="font-names text-lg sm:text-xl font-bold text-[#064E3B] leading-snug">
                                  {wish.guestName}
                                </h4>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-xs text-[#8E6D31]">
                                  {wish.relationship && (
                                    <>
                                      <span className="font-medium">{wish.relationship}</span>
                                      <span aria-hidden="true">·</span>
                                    </>
                                  )}
                                  <span>{formatWishDate(wish.createdAt)}</span>
                                </div>
                              </div>

                              {isVerifiedHost && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWish('public_wishes', wish.id)}
                                  aria-label={`Padam ucapan daripada ${wish.guestName}`}
                                  className="min-h-[40px] min-w-[40px] rounded-lg text-[#8E6D31] hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                              )}
                            </div>

                            <p className="mt-2.5 font-body text-sm text-[#16261F]/90 leading-relaxed whitespace-pre-line">
                              {wish.message}
                            </p>
                          </article>
                        ))}
                      </div>

                      {publicHasMore && (
                        <div className="mt-4 pt-3 border-t border-[#C6A15B]/25 text-center font-body">
                          <button
                            type="button"
                            onClick={() =>
                              void fetchPublicWishes({
                                cursor: lastVisiblePublicDoc,
                              })
                            }
                            disabled={publicLoadingMore}
                            className="min-h-[40px] px-4 py-2 rounded-xl border border-[#C6A15B]/80 bg-[#F5F0E5] text-xs font-semibold text-[#064E3B] hover:bg-[#EFE9DA] cursor-pointer disabled:opacity-60"
                          >
                            {publicLoadingMore ? 'Memuatkan Ucapan...' : 'Muat Lebih Banyak Ucapan'}
                          </button>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  /* PRIVATE WISHES TAB (HOST-ONLY GOOGLE AUTH) */
                  <div className="font-body">
                    {!currentUser ? (
                      <div className="py-10 px-3 text-center max-w-sm mx-auto space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-[#064E3B] border border-[#C6A15B] flex items-center justify-center">
                          <Lock className="w-5 h-5 text-[#E6CB8E]" aria-hidden="true" />
                        </div>
                        <h4 className="font-heading text-xl font-bold text-[#064E3B]">
                          Ruangan Ucapan Sulit Pengantin
                        </h4>
                        <p className="text-xs sm:text-sm text-[#16261F]/75 leading-relaxed">
                          Ucapan sulit dilindungi secara peribadi. Sila log masuk menggunakan akaun Google tuan rumah untuk membaca ucapan sulit.
                        </p>

                        {authError && (
                          <p className="text-xs text-red-800 font-medium">{authError}</p>
                        )}

                        <button
                          type="button"
                          onClick={handleHostSignIn}
                          disabled={authLoading}
                          className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#064E3B] text-[#E6CB8E] border border-[#C6A15B] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-[#043B2C] transition-colors cursor-pointer disabled:opacity-65"
                        >
                          <LogIn className="w-4 h-4" aria-hidden="true" />
                          <span>
                            {authLoading ? 'Sedang Log Masuk...' : 'Log Masuk Pengantin (Google)'}
                          </span>
                        </button>
                      </div>
                    ) : !isVerifiedHost ? (
                      <div className="py-10 px-3 text-center max-w-sm mx-auto space-y-4">
                        <Lock className="w-8 h-8 text-[#8E6D31] mx-auto" aria-hidden="true" />
                        <p className="text-sm font-semibold text-[#064E3B]">
                          Akses Terhad kepada Tuan Rumah
                        </p>
                        <p className="text-xs text-[#16261F]/75 leading-relaxed">
                          Anda sedang log masuk sebagai <strong>{currentUser.email}</strong>. Hanya akaun tuan rumah yang disahkan dibenarkan membaca ucapan sulit.
                        </p>
                        <button
                          type="button"
                          onClick={handleHostSignOut}
                          className="min-h-[44px] px-5 py-2 rounded-xl border border-[#C6A15B] text-xs font-semibold text-[#064E3B] inline-flex items-center gap-2 hover:bg-[#EFE9DA] cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Log Keluar</span>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#C6A15B]/35">
                          <span className="text-xs font-semibold text-[#064E3B]">
                            Mod Pengantin · {privateWishes.length} ucapan sulit
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void fetchPrivateWishes({ forceServer: true })}
                              disabled={privateLoading}
                              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-[#C6A15B]/70 text-xs font-medium text-[#064E3B] inline-flex items-center gap-1 hover:bg-[#EFE9DA] cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${privateLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                              <span>Muat Semula</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleHostSignOut}
                              className="min-h-[36px] px-3 py-1 rounded-lg border border-[#C6A15B]/70 text-xs font-medium text-[#064E3B] inline-flex items-center gap-1.5 hover:bg-[#EFE9DA] cursor-pointer"
                            >
                              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Log Keluar</span>
                            </button>
                          </div>
                        </div>

                        {privateLoading && privateWishes.length === 0 ? (
                          <div className="space-y-3 py-4">
                            {[1, 2].map((idx) => (
                              <div
                                key={idx}
                                className="h-20 rounded-xl bg-[#EFE9DA] animate-pulse"
                              />
                            ))}
                          </div>
                        ) : privateError && privateWishes.length === 0 ? (
                          <div className="py-8 px-3 text-center space-y-3">
                            <AlertCircle className="w-7 h-7 text-[#8E6D31] mx-auto" aria-hidden="true" />
                            <p className="text-xs font-semibold text-[#064E3B]">
                              {privateQuotaWarning
                                ? 'Kuota Bacaan Harian Pangkalan Data Penuh Sementara'
                                : 'Ucapan Sulit Tidak Dapat Dimuatkan'}
                            </p>
                            <p className="text-xs text-[#16261F]/75 leading-relaxed">
                              {privateError}
                            </p>
                            <button
                              type="button"
                              onClick={() => void fetchPrivateWishes({ forceServer: true })}
                              className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#064E3B] text-[#E6CB8E] border border-[#C6A15B] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#043B2C] cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Cuba Muat Semula</span>
                            </button>
                          </div>
                        ) : privateWishes.length === 0 ? (
                          <p className="py-12 text-center text-xs sm:text-sm text-[#16261F]/70">
                            Belum ada ucapan sulit dihantar setakat ini.
                          </p>
                        ) : (
                          <>
                            {privateError && (
                              <div
                                role="status"
                                className="mb-3 rounded-xl border border-[#C6A15B]/60 bg-[#F5F0E5]/85 px-3 py-2 text-xs text-[#064E3B] flex items-center justify-between gap-2 font-body"
                              >
                                <span className="leading-snug">{privateError}</span>
                                <button
                                  type="button"
                                  onClick={() => void fetchPrivateWishes({ forceServer: true })}
                                  className="shrink-0 font-semibold underline cursor-pointer"
                                >
                                  Cuba Lagi
                                </button>
                              </div>
                            )}
                            <div className="divide-y divide-[#C6A15B]/25">
                            {privateWishes.map((wish) => (
                              <article key={wish.id} className="py-4 first:pt-1 last:pb-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h4 className="font-names text-lg sm:text-xl font-bold text-[#064E3B]">
                                      {wish.guestName}
                                    </h4>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#8E6D31]">
                                      {wish.relationship && (
                                        <>
                                          <span className="font-medium">{wish.relationship}</span>
                                          <span aria-hidden="true">·</span>
                                        </>
                                      )}
                                      <span>{formatWishDate(wish.createdAt)}</span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWish('private_wishes', wish.id)}
                                    aria-label={`Padam ucapan sulit daripada ${wish.guestName}`}
                                    className="min-h-[40px] min-w-[40px] rounded-lg text-[#8E6D31] hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                </div>

                                <p className="mt-2.5 text-sm text-[#16261F]/90 leading-relaxed whitespace-pre-line">
                                  {wish.message}
                                </p>
                              </article>
                            ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
