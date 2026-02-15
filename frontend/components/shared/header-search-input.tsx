import * as React from "react";
import { Search } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function HeaderSearchInput({
  value,
  onChange,
  placeholder,
  className,
}: HeaderSearchInputProps) {
  const { t } = useT("translation");

  return (
    <div className={cn("relative w-40 md:w-60 transition-all", className)}>
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder || t("sidebar.search")}
        className="w-full bg-background/50 pl-9 border-border/50 focus-visible:bg-background transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
