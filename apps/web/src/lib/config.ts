/**
 * Centralized runtime configuration
 * All environment variable access should go through this module.
 */

export const MONITORING_API_URL =
  process.env.NEXT_PUBLIC_MONITORING_API_URL || "http://localhost:3333";
