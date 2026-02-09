/**
 * PII Scrubber
 * @description Removes personally identifiable information from error data
 */

const PII_PATTERNS: Array<{ name: string; pattern: RegExp; replacement: string }> = [
  { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[email]' },
  { name: 'ipv4', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[ip]' },
  { name: 'credit_card', pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, replacement: '[card]' },
  { name: 'password_field', pattern: /["']?password["']?\s*[:=]\s*["'][^"']*["']/gi, replacement: '"password":"[filtered]"' },
  { name: 'token_field', pattern: /["']?(?:token|secret|api_?key|authorization)["']?\s*[:=]\s*["'][^"']*["']/gi, replacement: '"[filtered_key]":"[filtered]"' },
  { name: 'bearer', pattern: /Bearer\s+[A-Za-z0-9._~+/=-]+/gi, replacement: 'Bearer [filtered]' },
];

export function scrubPII(text: string): string {
  let result = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
