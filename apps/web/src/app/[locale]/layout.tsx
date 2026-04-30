import type { Metadata } from "next";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { TRPCProvider } from "@/lib/trpc/provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { routing } from "@/i18n/routing";
import { RuntimeConfigScript } from "@/components/runtime-config-script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

// GHCR images are built without API_URL; static HTML would otherwise embed
// default localhost URLs in __ERRORWATCH_RUNTIME_CONFIG__ for the browser.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | ErrorWatch",
    default: "ErrorWatch - Error Monitoring",
  },
  description: "Self-hosted error monitoring for modern applications",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <RuntimeConfigScript />
          <NuqsAdapter>
            <TRPCProvider>
              <NextIntlClientProvider messages={messages}>
                {children}
              </NextIntlClientProvider>
              <Toaster position="bottom-right" />
            </TRPCProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
