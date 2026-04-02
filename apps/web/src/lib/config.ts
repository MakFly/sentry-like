/**
 * Centralized runtime configuration.
 * Self-hosted images read public URLs at runtime instead of baking them into the build.
 */

type RuntimeConfig = {
  appUrl: string;
  monitoringApiUrl: string;
  ssoEnabled: boolean;
};

declare global {
  interface Window {
    __ERRORWATCH_RUNTIME_CONFIG__?: Partial<RuntimeConfig>;
  }
}

const DEFAULT_APP_URL = "http://localhost:4001";
const DEFAULT_MONITORING_API_URL = "http://localhost:3333";

function getServerRuntimeConfig(): RuntimeConfig {
  return {
    appUrl: process.env.APP_URL || process.env.DASHBOARD_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
    monitoringApiUrl:
      process.env.MONITORING_API_URL ||
      process.env.API_URL ||
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_MONITORING_API_URL ||
      DEFAULT_MONITORING_API_URL,
    ssoEnabled: process.env.NEXT_PUBLIC_ENABLE_SSO !== "false",
  };
}

function getClientRuntimeConfig(): RuntimeConfig {
  const runtimeConfig = window.__ERRORWATCH_RUNTIME_CONFIG__ ?? {};

  return {
    appUrl: runtimeConfig.appUrl || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
    monitoringApiUrl:
      runtimeConfig.monitoringApiUrl ||
      process.env.NEXT_PUBLIC_MONITORING_API_URL ||
      DEFAULT_MONITORING_API_URL,
    ssoEnabled:
      typeof runtimeConfig.ssoEnabled === "boolean"
        ? runtimeConfig.ssoEnabled
        : process.env.NEXT_PUBLIC_ENABLE_SSO !== "false",
  };
}

export function getRuntimeConfig(): RuntimeConfig {
  return typeof window === "undefined" ? getServerRuntimeConfig() : getClientRuntimeConfig();
}

export function serializeRuntimeConfig(): string {
  return JSON.stringify(getServerRuntimeConfig()).replace(/</g, "\\u003c");
}

export function getAppUrl(): string {
  return getRuntimeConfig().appUrl;
}

export function getMonitoringApiUrl(): string {
  return getRuntimeConfig().monitoringApiUrl;
}

export function getInternalMonitoringApiUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.MONITORING_API_URL ||
      process.env.API_URL ||
      process.env.BETTER_AUTH_URL ||
      DEFAULT_MONITORING_API_URL
    );
  }

  return getMonitoringApiUrl();
}

export function isSsoEnabled(): boolean {
  return getRuntimeConfig().ssoEnabled;
}
