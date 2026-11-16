import { handleRsvpDashboardRequest } from '../../shared/rsvpServer';

interface NetlifyEvent {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
}

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
  'X-Content-Type-Options': 'nosniff',
};

export const handler = async (event: NetlifyEvent) => {
  if (event.httpMethod && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: SECURITY_HEADERS,
      body: JSON.stringify({
        authorized: false,
        code: 'METHOD_NOT_ALLOWED',
        error: 'Kaedah HTTP tidak dibenarkan.',
      }),
    };
  }

  const authHeader =
    event.headers?.authorization || event.headers?.Authorization || undefined;

  const result = await handleRsvpDashboardRequest(authHeader);

  return {
    statusCode: result.status,
    headers: SECURITY_HEADERS,
    body: JSON.stringify(result.body),
  };
};
