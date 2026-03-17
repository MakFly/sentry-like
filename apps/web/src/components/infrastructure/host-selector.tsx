"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Host = {
  hostId: string;
  hostname: string;
  os: string;
};

export function HostSelector({
  hosts,
  value,
  onChange,
}: {
  hosts: Host[];
  value: string | null;
  onChange: (hostId: string) => void;
}) {
  const t = useTranslations("infrastructure");

  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder={t("selectHost")} />
      </SelectTrigger>
      <SelectContent>
        {hosts.map((host) => (
          <SelectItem key={host.hostId} value={host.hostId}>
            <span className="flex items-center gap-2">
              <span>{host.hostname}</span>
              <span className="text-xs text-muted-foreground">({host.os})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
