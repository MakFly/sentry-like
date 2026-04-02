import Link from "next/link";
import { Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-center px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-600/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">{t("appName")}</span>
          </Link>
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
