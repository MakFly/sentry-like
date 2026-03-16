const isDev = process.env.NODE_ENV !== 'production';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

type ApiLogContext = {
  method: string;
  path: string;
  status: number;
  duration: number;
  hasAuth?: boolean;
};

const methodColors: Record<string, string> = {
  GET: '\x1b[32m',    // Vert
  POST: '\x1b[33m',   // Jaune
  PUT: '\x1b[34m',    // Bleu
  DELETE: '\x1b[31m', // Rouge
  PATCH: '\x1b[35m',  // Magenta
  OPTIONS: '\x1b[36m', // Cyan
  HEAD: '\x1b[36m',   // Cyan
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
    `${errorPrefix}${bright}${methodColor}${ctx.method}${reset} ${authIcon} ${ctx.path} ${statusStr} ${durationStr}`
  );
  console.log(`${dim}──────────────────────────────────────────${reset}`);
}
