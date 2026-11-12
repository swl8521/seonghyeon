"use client";

import Link from "@/components/LocaleLink";
import { useLocale } from "./LocaleProvider";
import { usePlayStore } from "@/lib/store";
import { Icon } from "./Icon";

export function InventoryLink() {
  const { t } = useLocale();
  const count = usePlayStore((s) => s.inventory.length);

  return (
    <Link href="/inventory" aria-label={t("모아둔 구절")} className="relative text-lg leading-none">
      <Icon name="collection" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-sans text-[10px] leading-none text-accent-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
