"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  "en-US": "English",
  fr: "Français",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(newLocale: string) {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-xs">{localeLabels[locale] ?? locale}</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" sideOffset={4}>
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => onChange(l)}
            className={l === locale ? "bg-accent" : "cursor-pointer"}
          >
            {localeLabels[l] ?? l}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
