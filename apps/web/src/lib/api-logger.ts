const isDev = process.env.NODE_ENV !== 'production';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type ApiLogContext = {
  method: HttpMethod;
  url: string;
  duration: number;
  status: number;
  error?: string;
  body?: unknown;
  hasAuth?: boolean;
};

const methodColors: Record<HttpMethod, string> = {
  GET: '\x1b[32m',    // Vert
  POST: '\x1b[33m',   // Jaune
  PUT: '\x1b[34m',    // Bleu
  DELETE: '\x1b[31m', // Rouge
  PATCH: '\x1b[35m',  // Magenta
};

const reset = '\x1b[0m';
const dim = '\x1b[2m';
const bright = '\x1b[1m';

/**
 * Formate la durée en ms avec couleur selon performance
 */
function formatDuration(ms: number): string {
  if (ms < 100) return `\x1b[32m${ms}ms${reset}`; // Vert - rapide
  if (ms < 500) return `\x1b[33m${ms}ms${reset}`; // Jaune - moyen
  return `\x1b[31m${ms}ms${reset}`; // Rouge - lent
}

/**
 * Formate le status HTTP avec couleur
 */
function formatStatus(status: number): string {
  if (status >= 200 && status < 300) return `\x1b[32m${status}${reset}`;
  if (status >= 300 && status < 400) return `\x1b[33m${status}${reset}`;
  if (status >= 400 && status < 500) return `\x1b[33m${status}${reset}`;
  return `\x1b[31m${status}${reset}`;
}

/**
 * Log un appel API complet (request + response en une seule ligne)
 */
export function logApiCall(ctx: ApiLogContext) {
  if (!isDev) return;

  const methodColor = methodColors[ctx.method] || '';
  const authIcon = ctx.hasAuth ? '🔐' : '🔓';
  const statusStr = formatStatus(ctx.status);
  const durationStr = formatDuration(ctx.duration);
  const isError = ctx.status >= 400;
  const errorPrefix = isError ? `\x1b[31m✗${reset} ` : '';

  console.log(`${dim}──────────────────────────────────────────${reset}`);
  console.log(
    `${errorPrefix}${bright}${methodColor}${ctx.method}${reset} ${authIcon} ${ctx.url} ${statusStr} ${durationStr}`
  );

  if (ctx.body && Object.keys(ctx.body as object).length > 0) {
    const safeBody = maskSensitiveData(ctx.body);
    console.log(`${dim}Body:${reset}`, JSON.stringify(safeBody, null, 2));
  }

  if (ctx.error) {
    console.log(`${dim}Error:${reset} \x1b[31m${ctx.error}${reset}`);
  }

  console.log(`${dim}──────────────────────────────────────────${reset}`);
}

/**
 * Masque les données sensibles dans les logs
 */
function maskSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'apikey', 'api_key'];
  const masked = { ...data as Record<string, unknown> };

  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

/**
 * Helper pour mesurer la durée d'un appel
 */
export function createApiTimer() {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}
