import Script from "next/script";
import { serializeRuntimeConfig } from "@/lib/config";

export function RuntimeConfigScript() {
  return (
    <Script
      id="errorwatch-runtime-config"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `window.__ERRORWATCH_RUNTIME_CONFIG__ = ${serializeRuntimeConfig()};`,
      }}
    />
  );
}
