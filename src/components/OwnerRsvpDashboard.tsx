import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Lock,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface RsvpSubmissionRow {
  id: string;
  rowNumber: number;
  timestamp: string;
  guestName: string;
  attendance: string;
  attendanceStatus: 'attending' | 'not_attending' | 'unknown';
  pax: number | null;
  phone: string;
  notes: string;
  fields: Record<string, string>;
}

interface RsvpDashboardSummary {
  totalSubmissions: number;
  attendingCount: number;
  notAttendingCount: number;
  unknownCount: number;
  totalGuestsAttending: number;
  latestSubmissionAt: string | null;
}

interface RsvpDashboardResponse {
  authorized: boolean;
  ownerEmail?: string;
  sheetsConfigured?: boolean;
  missingEnvVars?: string[];
  sheetTitle?: string;
  headers?: string[];
  summary?: RsvpDashboardSummary | null;
  submissions?: RsvpSubmissionRow[];
  error?: string;
  code?: string;
}

type AttendanceFilter = 'all' | 'attending' | 'not_attending';

export const OwnerRsvpDashboard: React.FC = () => {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [fetching, setFetching] = useState(false);
  const [dashboardData, setDashboardData] = useState<RsvpDashboardResponse | null>(null);
  const [fetchError, setFetchError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      if (!user) {
        setDashboardData(null);
        setFetchError('');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchOwnerRsvpData = useCallback(async (user: User) => {
    setFetching(true);
    setFetchError('');
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/rsvp-dashboard', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: 'no-store',
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'Pelayan API RSVP (/api/rsvp-dashboard) tidak mengembalikan JSON. Pastikan Netlify Functions atau server backend sedang berjalan.'
        );
      }

      const data = (await res.json()) as RsvpDashboardResponse;
      if (!res.ok || !data.authorized) {
        setDashboardData({
          authorized: false,
          code: data.code,
          error:
            data.error ||
            'Akses ditolak. Hanya akaun Google pemilik yang dibenarkan boleh melihat data RSVP.',
        });
        return;
      }

      setDashboardData(data);
    } catch (err) {
      setDashboardData(null);
      setFetchError(
        err instanceof Error
          ? err.message
          : 'Gagal menghubungi pelayan pengesahan pemilik. Sila cuba sebentar lagi.'
      );
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (authReady && currentUser) {
      void fetchOwnerRsvpData(currentUser);
    }
  }, [authReady, currentUser, fetchOwnerRsvpData]);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setFetchError('');
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
          'Pop-up log masuk Google disekat oleh pelayar anda. Sila benarkan pop-up dan cuba lagi.'
        );
      } else {
        setAuthError('Log masuk Google dibatalkan atau gagal. Sila cuba lagi.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    setFetchError('');
    setDashboardData(null);
    await signOut(auth);
  };

  const filteredSubmissions = useMemo(() => {
    const rows = dashboardData?.submissions ?? [];
    const q = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (attendanceFilter !== 'all' && row.attendanceStatus !== attendanceFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        row.guestName,
        row.attendance,
        row.phone,
        row.notes,
        row.timestamp,
        ...Object.values(row.fields),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [attendanceFilter, dashboardData?.submissions, searchQuery]);

  return (
    <div className="mt-6 rounded-2xl bg-[#FAF7F0] border border-[#C6A15B]/75 p-4 sm:p-6 text-left font-body shadow-inner">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#C6A15B]/35">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#064E3B] text-[#E6CB8E] flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-[#064E3B] leading-tight">
              Dashboard RSVP Pemilik
            </h3>
            <p className="text-[11px] sm:text-xs text-[#16261F]/70">
              Akses sulit disahkan oleh pelayan untuk pemilik majlis sahaja
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="flex flex-wrap items-center gap-2">
            {dashboardData?.authorized && (
              <button
                type="button"
                onClick={() => void fetchOwnerRsvpData(currentUser)}
                disabled={fetching}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#C6A15B]/75 bg-[#F5F0E5] text-[#064E3B] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EDE4D2] cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Muat Semula</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#C6A15B]/75 bg-white text-[#064E3B] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#EFE9DA] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Log Keluar</span>
            </button>
          </div>
        )}
      </div>

      {/* State 1: Signed Out */}
      {!currentUser ? (
        <div className="py-7 px-3 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#064E3B] border border-[#C6A15B] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#E6CB8E]" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <p className="font-heading text-lg font-bold text-[#064E3B]">
              Log Masuk Akaun Google Pemilik
            </p>
            <p className="text-xs sm:text-sm text-[#16261F]/75 leading-relaxed">
              Hanya e-mel Google pemilik yang disahkan oleh pelayan dibenarkan melihat senarai RSVP dan jumlah kehadiran tetamu.
            </p>
          </div>

          {authError && (
            <div
              role="alert"
              className="rounded-xl border border-red-700/30 bg-red-50 px-3.5 py-2.5 text-xs text-red-900 font-medium text-left flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#064E3B] text-[#E6CB8E] border border-[#C6A15B] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-[#043B2C] transition-colors cursor-pointer disabled:opacity-65"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>{authLoading ? 'Sedang Log Masuk...' : 'Log Masuk dengan Google'}</span>
          </button>
        </div>
      ) : fetching && !dashboardData ? (
        /* State 2: Verifying Server-Side Token */
        <div className="py-10 text-center space-y-3" aria-busy="true">
          <RefreshCw className="w-6 h-6 text-[#8E6D31] animate-spin mx-auto" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-[#064E3B] font-medium">
            Mengesahkan identiti Google pemilik di pelayan...
          </p>
        </div>
      ) : fetchError ? (
        /* State 3: Network / API Error */
        <div className="mt-4 rounded-xl border border-red-700/30 bg-red-50 p-4 text-xs sm:text-sm text-red-900 space-y-2">
          <div className="flex items-start gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Sambungan Dashboard Gagal</span>
          </div>
          <p className="text-xs leading-relaxed">{fetchError}</p>
        </div>
      ) : dashboardData && !dashboardData.authorized ? (
        /* State 4: Rejected by Server-Side Allowlist */
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-700/35 bg-red-50 p-5 text-center space-y-3"
        >
          <ShieldAlert className="w-8 h-8 text-red-700 mx-auto" aria-hidden="true" />
          <p className="font-heading text-lg font-bold text-red-900">
            Akses Pemilik Ditolak (403)
          </p>
          <p className="text-xs sm:text-sm text-red-900/90 leading-relaxed max-w-md mx-auto">
            {dashboardData.error}
          </p>
          {currentUser.email && (
            <p className="text-xs text-red-800/80">
              Akaun log masuk semasa: <strong>{currentUser.email}</strong>
            </p>
          )}
        </div>
      ) : dashboardData?.authorized && !dashboardData.sheetsConfigured ? (
        /* State 5: Verified Owner, Missing Google Sheets Server Env Vars */
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-[#064E3B]/30 bg-[#064E3B]/10 px-4 py-3 text-xs sm:text-sm text-[#064E3B] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              Identiti pemilik disahkan: <strong>{dashboardData.ownerEmail}</strong>
            </span>
          </div>

          <div className="rounded-xl border border-[#C6A15B]/75 bg-[#F5F0E5] p-4 sm:p-5 space-y-3">
            <p className="font-heading text-base sm:text-lg font-bold text-[#064E3B]">
              Sambungan Google Sheet Peribadi Belum Lengkap
            </p>
            <p className="text-xs sm:text-sm text-[#16261F]/80 leading-relaxed">
              Log masuk pemilik telah disahkan oleh pelayan, tetapi pemboleh ubah persekitaran pelayan berikut belum ditetapkan di Netlify untuk membaca Google Sheet anda secara selamat:
            </p>
            <ul className="list-disc pl-5 text-xs font-mono text-[#064E3B] space-y-1">
              {(dashboardData.missingEnvVars ?? []).map((envName) => (
                <li key={envName}>{envName}</li>
              ))}
            </ul>
            <p className="text-xs text-[#16261F]/70 leading-relaxed">
              Tetapkan pemboleh ubah ini di Netlify (Site settings → Environment variables) dan kongsikan Google Sheet anda sebagai <strong>Viewer</strong> kepada e-mel Service Account tanpa menjadikan Google Sheet tersebut umum.
            </p>
          </div>
        </div>
      ) : dashboardData?.authorized && dashboardData.code === 'SHEETS_FETCH_FAILED' ? (
        /* State 6: Sheets API fetch failed */
        <div className="mt-4 rounded-xl border border-red-700/30 bg-red-50 p-4 text-xs sm:text-sm text-red-900 space-y-2">
          <div className="flex items-start gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Tidak Dapat Membaca Google Sheet</span>
          </div>
          <p className="text-xs leading-relaxed">{dashboardData.error}</p>
        </div>
      ) : dashboardData?.authorized && dashboardData.summary ? (
        /* State 7: Full Live RSVP Dashboard */
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#064E3B] bg-[#064E3B]/10 border border-[#064E3B]/25 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Pemilik Disahkan: <strong>{dashboardData.ownerEmail}</strong>
              </span>
            </div>
            {dashboardData.summary.latestSubmissionAt && (
              <span className="text-[11px] text-[#8E6D31] font-medium">
                Hantaran terkini: {dashboardData.summary.latestSubmissionAt}
              </span>
            )}
          </div>

          {/* Summary KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#064E3B] text-[#FAF7F0] border border-[#C6A15B]/75 p-3.5">
              <div className="flex items-center justify-between text-[#E6CB8E]">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Jumlah Borang
                </span>
                <ClipboardList className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="mt-1.5 font-heading text-2xl sm:text-3xl font-bold tabular-nums">
                {dashboardData.summary.totalSubmissions}
              </p>
            </div>

            <div className="rounded-xl bg-[#F5F0E5] border border-[#C6A15B]/75 p-3.5">
              <div className="flex items-center justify-between text-[#064E3B]">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Tetamu Hadir (Pax)
                </span>
                <Users className="w-4 h-4 text-[#8E6D31]" aria-hidden="true" />
              </div>
              <p className="mt-1.5 font-heading text-2xl sm:text-3xl font-bold text-[#064E3B] tabular-nums">
                {dashboardData.summary.totalGuestsAttending}
              </p>
            </div>

            <div className="rounded-xl bg-[#F5F0E5] border border-[#C6A15B]/75 p-3.5">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Sahkan Hadir
                </span>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="mt-1.5 font-heading text-2xl sm:text-3xl font-bold text-emerald-900 tabular-nums">
                {dashboardData.summary.attendingCount}
              </p>
            </div>

            <div className="rounded-xl bg-[#F5F0E5] border border-[#C6A15B]/75 p-3.5">
              <div className="flex items-center justify-between text-[#8E6D31]">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Tidak Hadir
                </span>
                <XCircle className="w-4 h-4" aria-hidden="true" />
              </div>
              <p className="mt-1.5 font-heading text-2xl sm:text-3xl font-bold text-[#16261F] tabular-nums">
                {dashboardData.summary.notAttendingCount}
              </p>
            </div>
          </div>

          {/* Search & Attendance Filters */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-[#8E6D31] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama tetamu, telefon atau catatan..."
                aria-label="Cari senarai RSVP"
                className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl bg-white border border-[#C6A15B]/70 text-xs sm:text-sm text-[#16261F] placeholder:text-[#16261F]/45 focus:outline-none focus:border-[#064E3B]"
              />
            </div>

            <div className="inline-flex rounded-xl bg-[#E9E1CF] p-1 border border-[#C6A15B]/50">
              {(
                [
                  { key: 'all', label: 'Semua' },
                  { key: 'attending', label: 'Hadir' },
                  { key: 'not_attending', label: 'Tidak Hadir' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setAttendanceFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    attendanceFilter === tab.key
                      ? 'bg-[#064E3B] text-[#E6CB8E]'
                      : 'text-[#064E3B] hover:bg-[#FAF7F0]/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="py-10 text-center rounded-xl border border-[#C6A15B]/45 bg-[#F5F0E5]/70 text-xs sm:text-sm text-[#16261F]/70">
              Tiada rekod RSVP yang sepadan ditemui.
            </div>
          ) : (
            <>
              {/* Mobile Card Stack */}
              <div className="md:hidden space-y-3">
                {filteredSubmissions.map((row) => (
                  <article
                    key={row.id}
                    className="rounded-xl bg-white border border-[#C6A15B]/60 p-3.5 space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-names text-lg font-bold text-[#064E3B] leading-snug">
                          {row.guestName}
                        </h4>
                        {row.timestamp && (
                          <p className="text-[11px] text-[#8E6D31]">{row.timestamp}</p>
                        )}
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          row.attendanceStatus === 'attending'
                            ? 'bg-emerald-100 text-emerald-900'
                            : row.attendanceStatus === 'not_attending'
                              ? 'bg-red-100 text-red-900'
                              : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {row.attendance}
                      </span>
                    </div>

                    <dl className="pt-1.5 border-t border-[#C6A15B]/25 space-y-1 text-xs">
                      {Object.entries(row.fields).map(([key, val]) => {
                        if (!val) return null;
                        return (
                          <div key={key} className="flex justify-between gap-3">
                            <dt className="text-[#16261F]/65 font-medium">{key}:</dt>
                            <dd className="text-[#16261F] text-right font-medium break-words">
                              {val}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </article>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-[#C6A15B]/60 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#064E3B] text-[#E6CB8E]">
                      {(dashboardData.headers ?? []).map((header) => (
                        <th
                          key={header}
                          className="px-3.5 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C6A15B]/25">
                    {filteredSubmissions.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FAF7F0]">
                        {(dashboardData.headers ?? []).map((header) => (
                          <td
                            key={`${row.id}-${header}`}
                            className="px-3.5 py-2.5 text-[#16261F] align-top"
                          >
                            {row.fields[header] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};
