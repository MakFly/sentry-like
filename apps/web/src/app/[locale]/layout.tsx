import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { TRPCProvider } from "@/lib/trpc/provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { RuntimeConfigScript } from "@/components/runtime-config-script";

// GHCR images are built without API_URL; static HTML would otherwise embed
// default localhost URLs in __ERRORWATCH_RUNTIME_CONFIG__ for the browser.
export const dynamic = "force-dynamic";

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
    <html lang={locale} className="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-background text-foreground antialiased">
        <RuntimeConfigScript />
        <NuqsAdapter>
          <TRPCProvider>
            <NextIntlClientProvider messages={messages}>
              {children}
            </NextIntlClientProvider>
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                },
              }}
            />
          </TRPCProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
