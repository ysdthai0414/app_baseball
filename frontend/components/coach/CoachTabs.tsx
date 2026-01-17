"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/coach", label: "ホーム" },
  { href: "/coach/players", label: "選手" },
  { href: "/coach/events", label: "練習/試合" },
  { href: "/coach/messages", label: "連絡" },
];

export function CoachTabs() {
  const pathname = usePathname();
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-xl px-3 py-2 text-sm transition ${
              active ? "bg-neutral-900 text-white" : "bg-white border hover:bg-neutral-50"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
