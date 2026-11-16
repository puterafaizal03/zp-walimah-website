import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from 'jose';

const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);
const FIREBASE_JWKS = createRemoteJWKSet(FIREBASE_JWKS_URL);
const DEFAULT_FIREBASE_PROJECT_ID = 'gen-lang-client-0205371002';

export interface RsvpSubmissionRow {
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

export interface RsvpDashboardSummary {
  totalSubmissions: number;
  attendingCount: number;
  notAttendingCount: number;
  unknownCount: number;
  totalGuestsAttending: number;
  latestSubmissionAt: string | null;
}

export interface RsvpDashboardPayload {
  authorized: boolean;
  ownerEmail: string;
  sheetsConfigured: boolean;
  missingEnvVars?: string[];
  sheetTitle?: string;
  headers: string[];
  summary: RsvpDashboardSummary | null;
  submissions: RsvpSubmissionRow[];
  error?: string;
  code?: string;
}

export interface RsvpHandlerResult {
  status: number;
  body: RsvpDashboardPayload | { authorized: false; error: string; code: string; email?: string };
}

function getAllowedOwnerEmails(): string[] {
  const raw = process.env.OWNER_ALLOWED_EMAILS || process.env.OWNER_EMAIL || '';
  return raw
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getMissingSheetsEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.GOOGLE_SHEET_ID?.trim()) missing.push('GOOGLE_SHEET_ID');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim()) {
    missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  }
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim()) {
    missing.push('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  }
  return missing;
}

async function verifyOwnerGoogleToken(authHeader: string | undefined): Promise<
  | { ok: true; email: string }
  | { ok: false; status: number; code: string; error: string; email?: string }
> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      code: 'UNAUTHENTICATED',
      error: 'Sila log masuk dengan akaun Google pemilik terlebih dahulu.',
    };
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken || idToken.split('.').length !== 3) {
    return {
      ok: false,
      status: 401,
      code: 'INVALID_TOKEN',
      error: 'Token pengesahan Google tidak sah.',
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || DEFAULT_FIREBASE_PROJECT_ID;

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(idToken, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    payload = verified.payload as Record<string, unknown>;
  } catch {
    return {
      ok: false,
      status: 401,
      code: 'TOKEN_VERIFICATION_FAILED',
      error: 'Sesi Google anda tidak sah atau telah tamat tempoh. Sila log masuk semula.',
    };
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const emailVerified = payload.email_verified === true;
  const firebaseClaim =
    typeof payload.firebase === 'object' && payload.firebase !== null
      ? (payload.firebase as Record<string, unknown>)
      : null;
  const signInProvider =
    firebaseClaim && typeof firebaseClaim.sign_in_provider === 'string'
      ? firebaseClaim.sign_in_provider
      : '';

  if (!email || !emailVerified || signInProvider !== 'google.com') {
    return {
      ok: false,
      status: 403,
      code: 'GOOGLE_ACCOUNT_REQUIRED',
      error: 'Hanya akaun Google yang disahkan dibenarkan untuk akses pemilik.',
    };
  }

  const allowedEmails = getAllowedOwnerEmails();
  if (allowedEmails.length === 0) {
    return {
      ok: false,
      status: 403,
      code: 'ALLOWLIST_NOT_CONFIGURED',
      email,
      error:
        'Senarai e-mel pemilik yang dibenarkan (OWNER_ALLOWED_EMAILS) belum dikonfigurasi pada pelayan.',
    };
  }

  if (!allowedEmails.includes(email.toLowerCase())) {
    return {
      ok: false,
      status: 403,
      code: 'NOT_AUTHORIZED_OWNER',
      email,
      error: `Akses ditolak. Akaun ${email} tidak dibenarkan mengakses data RSVP peribadi pemilik.`,
    };
  }

  return { ok: true, email };
}

async function getGoogleSheetsAccessToken(
  serviceAccountEmail: string,
  privateKeyRaw: string
): Promise<string> {
  const normalizedPem = privateKeyRaw.replace(/\\n/g, '\n').trim();
  const privateKey = await importPKCS8(normalizedPem, 'RS256');
  const nowSec = Math.floor(Date.now() / 1000);

  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(serviceAccountEmail)
    .setSubject(serviceAccountEmail)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + 300)
    .sign(privateKey);

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Google OAuth token error (${tokenRes.status}): ${errText}`);
  }

  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new Error('Google OAuth token response did not contain access_token.');
  }
  return tokenJson.access_token;
}

function classifyAttendance(rawValue: string): 'attending' | 'not_attending' | 'unknown' {
  const val = rawValue.trim().toLowerCase();
  if (!val) return 'unknown';

  if (
    val.includes('tidak') ||
    val.includes('tak hadir') ||
    val === 'tak' ||
    val === 'no' ||
    val.includes('not attending') ||
    val.includes('maaf') ||
    val.includes('unable')
  ) {
    return 'not_attending';
  }

  if (
    val.includes('hadir') ||
    val === 'ya' ||
    val === 'yes' ||
    val.includes('attending') ||
    val.includes('datang') ||
    val.includes('confirm')
  ) {
    return 'attending';
  }

  return 'unknown';
}

function parsePaxCount(rawValue: string): number | null {
  const cleaned = rawValue.trim();
  if (!cleaned) return null;
  const match = cleaned.match(/\d+/);
  if (!match) return null;
  const num = Number.parseInt(match[0], 10);
  if (Number.isNaN(num) || num < 0 || num > 100) return null;
  return num;
}

function findColumnIndex(headers: string[], keywords: string[]): number {
  const lowerHeaders = headers.map((h) => h.toLowerCase());
  for (const kw of keywords) {
    const idx = lowerHeaders.findIndex((h) => h.includes(kw));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseSheetRows(headers: string[], dataRows: string[][]): {
  summary: RsvpDashboardSummary;
  submissions: RsvpSubmissionRow[];
} {
  const tsIdx = findColumnIndex(headers, ['timestamp', 'cap masa', 'tarikh', 'masa']);
  const nameIdx = findColumnIndex(headers, ['nama', 'name', 'tetamu']);
  const attIdx = findColumnIndex(headers, ['kehadiran', 'hadir', 'attend', 'status']);
  const paxIdx = findColumnIndex(headers, ['pax', 'jumlah', 'bilangan', 'orang', 'guest']);
  const phoneIdx = findColumnIndex(headers, ['telefon', 'phone', 'no.', 'hp', 'whatsapp']);
  const notesIdx = findColumnIndex(headers, [
    'ucapan',
    'doa',
    'ahli',
    'tambahan',
    'catatan',
    'nota',
    'wish',
    'note',
  ]);

  let attendingCount = 0;
  let notAttendingCount = 0;
  let unknownCount = 0;
  let totalGuestsAttending = 0;

  const parsed: RsvpSubmissionRow[] = dataRows
    .map((row, idx): RsvpSubmissionRow | null => {
      const hasAnyValue = row.some((cell) => String(cell ?? '').trim().length > 0);
      if (!hasAnyValue) return null;

      const fields: Record<string, string> = {};
      headers.forEach((header, colIdx) => {
        const key = header || `Lajur ${colIdx + 1}`;
        fields[key] = String(row[colIdx] ?? '').trim();
      });

      const timestamp = tsIdx >= 0 ? String(row[tsIdx] ?? '').trim() : '';
      const guestName =
        (nameIdx >= 0 ? String(row[nameIdx] ?? '').trim() : '') ||
        String(row[1] ?? row[0] ?? '').trim() ||
        `Tetamu #${idx + 1}`;
      const attendanceRaw = attIdx >= 0 ? String(row[attIdx] ?? '').trim() : '';
      const attendanceStatus = classifyAttendance(attendanceRaw);
      const paxRaw = paxIdx >= 0 ? String(row[paxIdx] ?? '').trim() : '';
      const parsedPax = parsePaxCount(paxRaw);
      const phone = phoneIdx >= 0 ? String(row[phoneIdx] ?? '').trim() : '';
      const notes = notesIdx >= 0 ? String(row[notesIdx] ?? '').trim() : '';

      if (attendanceStatus === 'attending') {
        attendingCount += 1;
        totalGuestsAttending += parsedPax !== null ? parsedPax : 1;
      } else if (attendanceStatus === 'not_attending') {
        notAttendingCount += 1;
      } else {
        unknownCount += 1;
        if (parsedPax !== null && parsedPax > 0 && !attendanceRaw) {
          totalGuestsAttending += parsedPax;
        }
      }

      return {
        id: `row_${idx + 2}`,
        rowNumber: idx + 2,
        timestamp,
        guestName,
        attendance: attendanceRaw || '-',
        attendanceStatus,
        pax: parsedPax,
        phone,
        notes,
        fields,
      };
    })
    .filter((item): item is RsvpSubmissionRow => item !== null);

  // Latest submissions first
  const submissions = [...parsed].reverse();
  const latestSubmissionAt =
    submissions.find((s) => s.timestamp.length > 0)?.timestamp ?? null;

  return {
    summary: {
      totalSubmissions: submissions.length,
      attendingCount,
      notAttendingCount,
      unknownCount,
      totalGuestsAttending,
      latestSubmissionAt,
    },
    submissions,
  };
}

export async function handleRsvpDashboardRequest(
  authHeader: string | undefined
): Promise<RsvpHandlerResult> {
  const authResult = await verifyOwnerGoogleToken(authHeader);
  if (authResult.ok === false) {
    return {
      status: authResult.status,
      body: {
        authorized: false,
        code: authResult.code,
        error: authResult.error,
        ...(authResult.email ? { email: authResult.email } : {}),
      },
    };
  }

  const missingEnvVars = getMissingSheetsEnvVars();
  if (missingEnvVars.length > 0) {
    return {
      status: 200,
      body: {
        authorized: true,
        ownerEmail: authResult.email,
        sheetsConfigured: false,
        missingEnvVars,
        headers: [],
        summary: null,
        submissions: [],
      },
    };
  }

  const sheetId = process.env.GOOGLE_SHEET_ID!.trim();
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!.trim();

  try {
    const accessToken = await getGoogleSheetsAccessToken(serviceEmail, privateKey);

    let targetRange = process.env.GOOGLE_SHEET_RANGE?.trim() || '';
    let sheetTitle = targetRange.split('!')[0] || '';

    if (!targetRange) {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          sheetId
        )}?fields=sheets.properties.title`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!metaRes.ok) {
        const metaErr = await metaRes.text();
        throw new Error(`Google Sheets metadata error (${metaRes.status}): ${metaErr}`);
      }
      const metaJson = (await metaRes.json()) as {
        sheets?: Array<{ properties?: { title?: string } }>;
      };
      sheetTitle = metaJson.sheets?.[0]?.properties?.title?.trim() || 'Form Responses 1';
      targetRange = `'${sheetTitle.replace(/'/g, "''")}'!A:Z`;
    }

    const valuesRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        sheetId
      )}/values/${encodeURIComponent(targetRange)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!valuesRes.ok) {
      const valuesErr = await valuesRes.text();
      throw new Error(`Google Sheets values error (${valuesRes.status}): ${valuesErr}`);
    }

    const valuesJson = (await valuesRes.json()) as { values?: string[][] };
    const rows = Array.isArray(valuesJson.values) ? valuesJson.values : [];

    if (rows.length === 0) {
      return {
        status: 200,
        body: {
          authorized: true,
          ownerEmail: authResult.email,
          sheetsConfigured: true,
          sheetTitle,
          headers: [],
          summary: {
            totalSubmissions: 0,
            attendingCount: 0,
            notAttendingCount: 0,
            unknownCount: 0,
            totalGuestsAttending: 0,
            latestSubmissionAt: null,
          },
          submissions: [],
        },
      };
    }

    const headers = rows[0].map((h, i) => String(h ?? '').trim() || `Lajur ${i + 1}`);
    const dataRows = rows.slice(1);
    const { summary, submissions } = parseSheetRows(headers, dataRows);

    return {
      status: 200,
      body: {
        authorized: true,
        ownerEmail: authResult.email,
        sheetsConfigured: true,
        sheetTitle,
        headers,
        summary,
        submissions,
      },
    };
  } catch (err) {
    console.error('RSVP Sheets Fetch Error:', err);
    return {
      status: 502,
      body: {
        authorized: true,
        ownerEmail: authResult.email,
        sheetsConfigured: true,
        headers: [],
        summary: null,
        submissions: [],
        code: 'SHEETS_FETCH_FAILED',
        error:
          'Sambungan ke Google Sheet peribadi gagal. Sila pastikan akaun servis diberi akses Viewer pada Google Sheet dan pemboleh ubah persekitaran Netlify adalah tepat.',
      },
    };
  }
}
