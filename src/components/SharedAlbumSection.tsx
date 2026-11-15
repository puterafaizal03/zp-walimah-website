import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ImagePlus,
  Images,
  LogIn,
  LogOut,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  HOST_ADMIN_EMAIL,
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../lib/firebase';
import { AwanLaratCorner, RoyalDivider } from './RoyalOrnaments';

interface SharedAlbumPhoto {
  id: string;
  uploaderName: string;
  caption?: string;
  imageDataUrl: string;
  width?: number;
  height?: number;
  createdAt: Timestamp | null;
}

interface CompressedPhotoResult {
  dataUrl: string;
  width: number;
  height: number;
  sizeKb: number;
}

const MAX_DATA_URL_LENGTH = 420_000;
const SAFE_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function generateSafePhotoId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `photo_${Date.now()}_${randomPart}`;
}

function formatPhotoDate(ts: Timestamp | null): string {
  if (!ts) return 'Baru dimuat naik';
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

async function compressImageForAlbum(file: File): Promise<CompressedPhotoResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Sila pilih fail gambar sahaja (JPG, PNG atau WebP).');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imageEl = new Image();
      imageEl.onload = () => resolve(imageEl);
      imageEl.onerror = () =>
        reject(new Error('Format gambar tidak disokong oleh pelayar ini. Sila pilih gambar JPG atau PNG.'));
      imageEl.src = objectUrl;
    });

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    if (!naturalW || !naturalH) {
      throw new Error('Gambar tidak sah. Sila cuba gambar lain.');
    }

    const attempts: Array<{ maxEdge: number; quality: number }> = [
      { maxEdge: 1080, quality: 0.78 },
      { maxEdge: 1080, quality: 0.65 },
      { maxEdge: 900, quality: 0.60 },
      { maxEdge: 760, quality: 0.55 },
      { maxEdge: 600, quality: 0.48 },
    ];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Pelayar tidak menyokong pemprosesan gambar.');
    }

    for (const preset of attempts) {
      const scale = Math.min(1, preset.maxEdge / Math.max(naturalW, naturalH));
      const targetW = Math.max(1, Math.round(naturalW * scale));
      const targetH = Math.max(1, Math.round(naturalH * scale));

      canvas.width = targetW;
      canvas.height = targetH;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const dataUrl = canvas.toDataURL('image/jpeg', preset.quality);
      if (dataUrl.length <= MAX_DATA_URL_LENGTH && SAFE_DATA_URL_PATTERN.test(dataUrl)) {
        return {
          dataUrl,
          width: targetW,
          height: targetH,
          sizeKb: Math.max(1, Math.round((dataUrl.length * 3) / 4 / 1024)),
        };
      }
    }

    throw new Error('Saiz gambar terlalu besar untuk dimuat naik. Sila pilih gambar lain.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function downloadPhotoFile(photo: SharedAlbumPhoto, index: number) {
  try {
    const [header, base64Body] = photo.imageDataUrl.split(',');
    const mimeMatch = header?.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64$/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';

    const binary = atob(base64Body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `kenangan-walimatulurus-zp-${index + 1}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  } catch {
    // Graceful fallback using direct data URL download
    const link = document.createElement('a');
    link.href = photo.imageDataUrl;
    link.download = `kenangan-walimatulurus-zp-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const SharedAlbumSection: React.FC = () => {
  // Album real-time stream state
  const [photos, setPhotos] = useState<SharedAlbumPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Upload composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [uploaderName, setUploaderName] = useState('');
  const [caption, setCaption] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<CompressedPhotoResult | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lightbox modal state
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Shared Firebase Host Admin auth state for moderation
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authPanelOpen, setAuthPanelOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isVerifiedHost = Boolean(
    currentUser?.emailVerified &&
      currentUser.email?.toLowerCase() === HOST_ADMIN_EMAIL.toLowerCase()
  );

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to shared_album_photos in real time
  useEffect(() => {
    const albumPath = 'shared_album_photos';
    const q = query(
      collection(db, albumPath),
      orderBy('createdAt', 'desc'),
      limit(60)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: SharedAlbumPhoto[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            uploaderName: String(data.uploaderName ?? 'Tetamu'),
            caption: data.caption ? String(data.caption) : undefined,
            imageDataUrl: String(data.imageDataUrl ?? ''),
            width: typeof data.width === 'number' ? data.width : undefined,
            height: typeof data.height === 'number' ? data.height : undefined,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          };
        });
        setPhotos(items);
        setLoading(false);
        setLoadError('');
      },
      (error) => {
        setLoading(false);
        setLoadError('Galeri kenangan tidak dapat dimuatkan buat masa ini.');
        try {
          handleFirestoreError(error, OperationType.LIST, albumPath);
        } catch {
          // Logged by handleFirestoreError
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep activeIndex valid if a photo is deleted while lightbox is open
  useEffect(() => {
    if (activeIndex !== null && photos.length === 0) {
      setActiveIndex(null);
    } else if (activeIndex !== null && activeIndex >= photos.length) {
      setActiveIndex(photos.length - 1);
    }
  }, [activeIndex, photos.length]);

  const handleCloseLightbox = useCallback(() => {
    setActiveIndex(null);
    setConfirmDeleteId(null);
  }, []);

  const handlePrevPhoto = useCallback(() => {
    setConfirmDeleteId(null);
    setActiveIndex((prev) => {
      if (prev === null || photos.length === 0) return null;
      return prev === 0 ? photos.length - 1 : prev - 1;
    });
  }, [photos.length]);

  const handleNextPhoto = useCallback(() => {
    setConfirmDeleteId(null);
    setActiveIndex((prev) => {
      if (prev === null || photos.length === 0) return null;
      return prev === photos.length - 1 ? 0 : prev + 1;
    });
  }, [photos.length]);

  // Lightbox keyboard navigation & scroll lock
  useEffect(() => {
    if (activeIndex === null) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowLeft') {
        handlePrevPhoto();
      } else if (e.key === 'ArrowRight') {
        handleNextPhoto();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, handleCloseLightbox, handleNextPhoto, handlePrevPhoto]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    setUploadSuccess(false);
    setProcessingImage(true);

    try {
      const compressed = await compressImageForAlbum(file);
      setPreviewPhoto(compressed);
    } catch (err) {
      setPreviewPhoto(null);
      setFormError(
        err instanceof Error
          ? err.message
          : 'Gambar gagal diproses. Sila pilih fail gambar yang lain.'
      );
    } finally {
      setProcessingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmitPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setUploadSuccess(false);

    if (!previewPhoto) {
      setFormError('Sila pilih gambar terlebih dahulu sebelum memuat naik.');
      return;
    }

    const trimmedName = uploaderName.trim();
    const trimmedCaption = caption.trim();

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setFormError('Sila masukkan nama anda (2 hingga 80 aksara).');
      return;
    }
    if (trimmedCaption.length > 200) {
      setFormError('Kapsyen tidak boleh melebihi 200 aksara.');
      return;
    }

    setSubmitting(true);
    const photoId = generateSafePhotoId();
    const payload: {
      uploaderName: string;
      imageDataUrl: string;
      width: number;
      height: number;
      createdAt: ReturnType<typeof serverTimestamp>;
      caption?: string;
    } = {
      uploaderName: trimmedName,
      imageDataUrl: previewPhoto.dataUrl,
      width: previewPhoto.width,
      height: previewPhoto.height,
      createdAt: serverTimestamp(),
    };

    if (trimmedCaption.length > 0) {
      payload.caption = trimmedCaption;
    }

    try {
      await setDoc(doc(db, 'shared_album_photos', photoId), payload);
      setPreviewPhoto(null);
      setCaption('');
      setUploadSuccess(true);
    } catch (error) {
      setFormError('Gambar gagal dimuat naik. Sila semak sambungan internet anda dan cuba lagi.');
      try {
        handleFirestoreError(error, OperationType.CREATE, `shared_album_photos/${photoId}`);
      } catch {
        // Logged by handleFirestoreError
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
      setAuthPanelOpen(false);
    } catch {
      setAuthError('Log masuk dibatalkan atau gagal. Sila cuba lagi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleHostSignOut = async () => {
    setAuthError('');
    setConfirmDeleteId(null);
    await signOut(auth);
  };

  const handleDeletePhoto = async (photoId: string) => {
    setDeletingId(photoId);
    try {
      await deleteDoc(doc(db, 'shared_album_photos', photoId));
      setConfirmDeleteId(null);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.DELETE, `shared_album_photos/${photoId}`);
      } catch {
        // Logged by handleFirestoreError
      }
    } finally {
      setDeletingId(null);
    }
  };

  const activePhoto = activeIndex !== null ? photos[activeIndex] ?? null : null;

  return (
    <section
      id="galeri"
      aria-label="Galeri Kenangan Majlis — Album Foto Bersama"
      className="relative w-full py-6 sm:py-10 px-3 sm:px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-5xl rounded-3xl bg-songket-ivory border border-[#C6A15B]/80 shadow-[0_24px_65px_rgba(3,43,32,0.45)] px-4 sm:px-10 md:px-12 py-11 sm:py-14 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C6A15B]/40" />
        <AwanLaratCorner position="tl" className="absolute top-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="tr" className="absolute top-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="bl" className="absolute bottom-3.5 left-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />
        <AwanLaratCorner position="br" className="absolute bottom-3.5 right-3.5 w-10 h-10 sm:w-14 sm:h-14 text-[#C6A15B]" />

        <div className="relative z-10">
          {/* Editorial Header */}
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-script text-2xl sm:text-3xl text-[#8E6D31]">
              Abadikan Detik Indah
            </p>
            <h2 className="mt-1 font-heading text-3xl sm:text-4xl font-bold text-[#064E3B]">
              Galeri Kenangan Majlis
            </h2>
            <p className="mt-2 font-body text-xs sm:text-sm text-[#16261F]/80 leading-relaxed text-balance">
              Ruang album bersama buat para tetamu berkongsi foto kenangan indah sepanjang majlis untuk ditatap dan dimuat turun oleh semua.
            </p>

            {/* Unboxed Metadata Line */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-body text-xs text-[#8E6D31] font-medium tabular-nums">
              <span>{photos.length} foto dikongsi</span>
              <span aria-hidden="true">·</span>
              <span>Terbuka untuk semua tetamu</span>
              <span aria-hidden="true">·</span>
              <span>Kemaskini masa nyata</span>
            </div>

            <RoyalDivider className="mt-4" />

            {/* Action Toolbar */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setComposerOpen((prev) => !prev);
                  setUploadSuccess(false);
                  setFormError('');
                }}
                aria-expanded={composerOpen}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#064E3B] border border-[#C6A15B]/85 text-[#FAF7F0] font-body text-xs sm:text-sm font-semibold tracking-wide shadow-md hover:bg-[#043B2C] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
              >
                {composerOpen ? (
                  <>
                    <X className="w-4 h-4 text-[#E6CB8E]" aria-hidden="true" />
                    <span>Tutup Borang Muat Naik</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-[#E6CB8E]" aria-hidden="true" />
                    <span>Kongsi Gambar Anda</span>
                  </>
                )}
              </button>

              {isVerifiedHost ? (
                <button
                  type="button"
                  onClick={handleHostSignOut}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#C6A15B]/70 bg-[#FAF7F0] text-[#064E3B] font-body text-xs font-semibold hover:bg-[#EFE9DA] transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#8E6D31]" aria-hidden="true" />
                  <span>Mod Pengantin · Log Keluar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthPanelOpen((prev) => !prev)}
                  className="min-h-[48px] px-4 py-2.5 rounded-xl border border-[#C6A15B]/60 bg-transparent text-[#064E3B] font-body text-xs font-semibold hover:bg-[#FAF7F0]/70 transition-colors cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#8E6D31]" aria-hidden="true" />
                  <span>Urus Album (Pengantin)</span>
                </button>
              )}
            </div>

            {/* Optional Host Sign-In Drawer */}
            <AnimatePresence>
              {authPanelOpen && !isVerifiedHost && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 mx-auto max-w-md rounded-2xl bg-[#FAF7F0] border border-[#C6A15B]/55 p-4 text-center font-body space-y-3">
                    {!currentUser ? (
                      <>
                        <p className="text-xs text-[#16261F]/80 leading-relaxed">
                          Tuan rumah boleh log masuk dengan akaun Google rasmi untuk mengurus atau memadam gambar dalam galeri.
                        </p>
                        {authError && (
                          <p className="text-xs text-red-800 font-medium">{authError}</p>
                        )}
                        <button
                          type="button"
                          onClick={handleHostSignIn}
                          disabled={authLoading}
                          className="min-h-[44px] px-5 py-2 rounded-xl bg-[#064E3B] text-[#E6CB8E] border border-[#C6A15B] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#043B2C] cursor-pointer disabled:opacity-65"
                        >
                          <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{authLoading ? 'Sedang Log Masuk...' : 'Log Masuk Google Pengantin'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-[#16261F]/80 leading-relaxed">
                          Anda sedang log masuk sebagai <strong>{currentUser.email}</strong>. Hanya akaun pengantin yang disahkan dibenarkan memadam foto.
                        </p>
                        <button
                          type="button"
                          onClick={handleHostSignOut}
                          className="min-h-[40px] px-4 py-2 rounded-xl border border-[#C6A15B] text-xs font-semibold text-[#064E3B] inline-flex items-center gap-1.5 hover:bg-[#EFE9DA] cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Log Keluar</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expandable Photo Upload Composer */}
          <AnimatePresence>
            {composerOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <form
                  onSubmit={handleSubmitPhoto}
                  noValidate
                  className="mt-7 mx-auto max-w-2xl rounded-2xl bg-[#FAF7F0] border border-[#C6A15B]/65 p-5 sm:p-7 font-body space-y-5"
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#C6A15B]/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#064E3B] text-[#E6CB8E] flex items-center justify-center shrink-0">
                        <ImagePlus className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-[#064E3B] leading-tight">
                          Muat Naik Foto Kenangan
                        </h3>
                        <p className="text-xs text-[#16261F]/65">
                          Gambar dioptimumkan secara automatik supaya pantas dilihat oleh semua
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Image Picker / Preview Area */}
                  <div>
                    <input
                      ref={fileInputRef}
                      id="shared-album-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelected}
                      className="sr-only"
                    />

                    {!previewPhoto ? (
                      <label
                        htmlFor="shared-album-file"
                        className="flex flex-col items-center justify-center text-center min-h-[140px] rounded-xl border border-dashed border-[#C6A15B] bg-[#F5F0E5]/75 hover:bg-[#EFE9DA] transition-colors px-4 py-6 cursor-pointer"
                      >
                        <Upload className="w-6 h-6 text-[#8E6D31] mb-2" aria-hidden="true" />
                        <span className="text-sm font-semibold text-[#064E3B]">
                          {processingImage
                            ? 'Sedang memproses & mengoptimumkan gambar...'
                            : 'Pilih Gambar dari Galeri atau Kamera'}
                        </span>
                        <span className="mt-1 text-xs text-[#16261F]/65">
                          Menyokong JPG, PNG &amp; WebP terus dari telefon bimbit
                        </span>
                      </label>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl border border-[#C6A15B]/55 bg-[#F5F0E5]/65">
                        <div className="w-full sm:w-36 aspect-[4/5] rounded-lg overflow-hidden border border-[#C6A15B]/45 bg-[#FAF7F0] shrink-0">
                          <img
                            src={previewPhoto.dataUrl}
                            alt="Pratonton gambar pilihan anda"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 text-center sm:text-left space-y-2">
                          <p className="text-xs font-semibold text-[#064E3B]">
                            Gambar sedia untuk dikongsi
                          </p>
                          <p className="text-xs text-[#8E6D31] tabular-nums">
                            {previewPhoto.width} × {previewPhoto.height} px · {previewPhoto.sizeKb} KB
                          </p>
                          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <label
                              htmlFor="shared-album-file"
                              className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#C6A15B]/80 bg-[#FAF7F0] text-xs font-semibold text-[#064E3B] hover:bg-[#EFE9DA] transition-colors cursor-pointer inline-flex items-center"
                            >
                              Tukar Gambar
                            </label>
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(null)}
                              className="min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium text-[#16261F]/70 hover:text-red-800 transition-colors cursor-pointer"
                            >
                              Buang
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Uploader Name & Optional Caption */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="album-uploader-name"
                        className="block text-xs sm:text-sm font-semibold text-[#064E3B] mb-1.5"
                      >
                        Nama Anda <span className="text-[#8E6D31]">*</span>
                      </label>
                      <input
                        id="album-uploader-name"
                        type="text"
                        required
                        maxLength={80}
                        value={uploaderName}
                        onChange={(e) => {
                          setUploaderName(e.target.value);
                          if (formError) setFormError('');
                          if (uploadSuccess) setUploadSuccess(false);
                        }}
                        placeholder="Contoh: Amin & Keluarga"
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F5F0E5]/70 border border-[#C6A15B]/70 text-[#16261F] placeholder:text-[#16261F]/45 text-sm focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="album-caption"
                          className="block text-xs sm:text-sm font-semibold text-[#064E3B]"
                        >
                          Kapsyen <span className="font-normal text-[#16261F]/60">(Pilihan)</span>
                        </label>
                        <span className="text-[11px] text-[#16261F]/60 tabular-nums">
                          {caption.length}/200
                        </span>
                      </div>
                      <input
                        id="album-caption"
                        type="text"
                        maxLength={200}
                        value={caption}
                        onChange={(e) => {
                          setCaption(e.target.value);
                          if (formError) setFormError('');
                          if (uploadSuccess) setUploadSuccess(false);
                        }}
                        placeholder="Contoh: Bergambar di pelamin diraja"
                        className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[#F5F0E5]/70 border border-[#C6A15B]/70 text-[#16261F] placeholder:text-[#16261F]/45 text-sm focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
                      />
                    </div>
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

                  {uploadSuccess && (
                    <div
                      role="status"
                      className="rounded-xl border border-[#064E3B]/30 bg-[#064E3B]/10 px-3.5 py-3 text-xs sm:text-sm font-medium text-[#064E3B] flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#064E3B]" aria-hidden="true" />
                      <span>
                        Terima kasih! Gambar anda telah berjaya dimuat naik ke Galeri Kenangan dan boleh dilihat oleh semua tetamu.
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || processingImage}
                    className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#064E3B] border border-[#C6A15B]/80 text-[#FAF7F0] font-semibold text-sm tracking-wide shadow-md hover:bg-[#043B2C] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
                  >
                    <Upload className="w-4 h-4 text-[#E6CB8E]" aria-hidden="true" />
                    <span>{submitting ? 'Sedang Memuat Naik...' : 'Muat Naik ke Galeri'}</span>
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gallery Grid */}
          <div className="mt-9">
            {loading ? (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
                aria-busy="true"
              >
                {[1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    className="aspect-[4/5] rounded-2xl bg-[#EFE9DA] animate-pulse"
                  />
                ))}
              </div>
            ) : loadError ? (
              <div className="py-12 text-center font-body text-sm text-[#16261F]/75">
                {loadError}
              </div>
            ) : photos.length === 0 ? (
              <div className="py-14 px-4 text-center rounded-2xl border border-[#C6A15B]/45 bg-[#FAF7F0]/80 space-y-3">
                <Images className="w-9 h-9 text-[#C6A15B] mx-auto" aria-hidden="true" />
                <h3 className="font-heading text-xl font-semibold text-[#064E3B]">
                  Album Kenangan Menanti Detik Pertama
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#16261F]/70 max-w-md mx-auto leading-relaxed">
                  Belum ada foto dimuat naik setakat ini. Jadilah tetamu pertama yang merakam dan berkongsi kemeriahan majlis!
                </p>
                {!composerOpen && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setComposerOpen(true)}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#064E3B] text-[#E6CB8E] border border-[#C6A15B] font-body text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#043B2C] transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" aria-hidden="true" />
                      <span>Muat Naik Foto Pertama</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {photos.map((photo, index) => {
                  const isConfirmingDelete = confirmDeleteId === photo.id;
                  return (
                    <figure
                      key={photo.id}
                      className="group relative flex flex-col rounded-2xl bg-[#FAF7F0] border border-[#C6A15B]/55 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Clickable Photo Frame */}
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(null);
                          setActiveIndex(index);
                        }}
                        aria-label={`Lihat gambar penuh yang dikongsi oleh ${photo.uploaderName}`}
                        className="relative aspect-[4/5] w-full overflow-hidden bg-[#EFE9DA] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
                      >
                        <img
                          src={photo.imageDataUrl}
                          alt={`Kenangan majlis dikongsi oleh ${photo.uploaderName}${
                            photo.caption ? ` — ${photo.caption}` : ''
                          }`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_18px_rgba(3,43,32,0.12)]"
                        />
                      </button>

                      {/* Archival Figure Caption */}
                      <figcaption className="px-3 py-2.5 sm:px-3.5 sm:py-3 flex flex-col gap-0.5 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-names text-base sm:text-[17px] font-bold text-[#064E3B] leading-snug truncate">
                            {photo.uploaderName}
                          </span>

                          {isVerifiedHost && !isConfirmingDelete && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(photo.id)}
                              aria-label={`Padam foto oleh ${photo.uploaderName}`}
                              className="min-h-[36px] min-w-[36px] -mr-1.5 -mt-1 rounded-lg text-[#8E6D31] hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>

                        {photo.caption && (
                          <p className="font-names italic text-sm text-[#16261F]/85 leading-snug line-clamp-2">
                            &ldquo;{photo.caption}&rdquo;
                          </p>
                        )}

                        <span className="mt-auto pt-1 font-body text-[10px] sm:text-[11px] text-[#8E6D31]/90">
                          {formatPhotoDate(photo.createdAt)}
                        </span>

                        {isVerifiedHost && isConfirmingDelete && (
                          <div className="mt-2 pt-2 border-t border-[#C6A15B]/30 flex items-center justify-between gap-2 font-body">
                            <button
                              type="button"
                              onClick={() => handleDeletePhoto(photo.id)}
                              disabled={deletingId === photo.id}
                              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-red-700 text-white text-[11px] font-semibold hover:bg-red-800 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {deletingId === photo.id ? 'Memadam...' : 'Sahkan Padam'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#16261F]/75 hover:bg-[#EFE9DA] transition-colors cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        )}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Full-Screen Archival Lightbox Viewer */}
      <AnimatePresence>
        {activePhoto && activeIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Paparan penuh foto oleh ${activePhoto.uploaderName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleCloseLightbox}
            className="fixed inset-0 z-50 bg-[#032B20]/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
          >
            {/* Top Bar: Counter + Close */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl flex items-center justify-between pb-3 text-[#E6CB8E] font-body"
            >
              <span className="text-xs sm:text-sm font-medium tracking-wider tabular-nums">
                Foto {activeIndex + 1} daripada {photos.length}
              </span>
              <button
                type="button"
                onClick={handleCloseLightbox}
                aria-label="Tutup paparan foto"
                className="min-h-[44px] min-w-[44px] rounded-full border border-[#C6A15B]/60 bg-[#064E3B]/80 text-[#FAF7F0] hover:bg-[#064E3B] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Center Image Stage with Prev / Next Controls */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl flex items-center justify-center gap-2 sm:gap-4"
            >
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  aria-label="Foto sebelumnya"
                  className="min-h-[44px] min-w-[44px] rounded-full border border-[#C6A15B]/60 bg-[#032B20]/85 text-[#E6CB8E] hover:bg-[#064E3B] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </button>
              )}

              <div className="relative rounded-2xl border border-[#C6A15B]/75 bg-[#021D15] p-1.5 sm:p-2 shadow-2xl max-h-[65dvh] overflow-hidden flex items-center justify-center">
                <img
                  src={activePhoto.imageDataUrl}
                  alt={`Kenangan majlis dikongsi oleh ${activePhoto.uploaderName}`}
                  referrerPolicy="no-referrer"
                  className="max-h-[62dvh] max-w-full w-auto object-contain rounded-xl"
                />
              </div>

              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  aria-label="Foto seterusnya"
                  className="min-h-[44px] min-w-[44px] rounded-full border border-[#C6A15B]/60 bg-[#032B20]/85 text-[#E6CB8E] hover:bg-[#064E3B] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Caption & Action Bar */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="mt-4 w-full max-w-2xl text-center space-y-3"
            >
              <div>
                <h3 className="font-names text-xl sm:text-2xl font-bold text-[#E6CB8E]">
                  {activePhoto.uploaderName}
                </h3>
                {activePhoto.caption && (
                  <p className="mt-1 font-names italic text-base sm:text-lg text-[#FAF7F0]/95">
                    &ldquo;{activePhoto.caption}&rdquo;
                  </p>
                )}
                <p className="mt-1 font-body text-xs text-[#C6A15B]/85">
                  {formatPhotoDate(activePhoto.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1 font-body">
                <button
                  type="button"
                  onClick={() => downloadPhotoFile(activePhoto, activeIndex)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B89047] via-[#E2C27E] to-[#B89047] text-[#032B20] font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Muat Turun Gambar</span>
                </button>

                {isVerifiedHost && (
                  confirmDeleteId === activePhoto.id ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(activePhoto.id)}
                        disabled={deletingId === activePhoto.id}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 cursor-pointer disabled:opacity-60"
                      >
                        {deletingId === activePhoto.id ? 'Memadam...' : 'Sahkan Padam'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#C6A15B]/60 text-[#FAF7F0] text-xs font-medium hover:bg-[#064E3B] cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(activePhoto.id)}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl border border-red-400/60 bg-red-950/50 text-red-200 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-red-900/70 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      <span>Padam Foto</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
