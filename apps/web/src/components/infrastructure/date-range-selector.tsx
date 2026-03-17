"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

const ranges = ["1h", "6h", "24h", "7d"] as const;

export function DateRangeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v)}
      size="sm"
    >
      {ranges.map((range) => (
        <ToggleGroupItem key={range} value={range} className="text-xs px-3">
          {range}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
