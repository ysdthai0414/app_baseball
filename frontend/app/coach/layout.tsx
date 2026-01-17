import React from "react";
import { CoachHeader } from "@/components/coach/CoachHeader";
import { CoachTabs } from "@/components/coach/CoachTabs";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <CoachHeader />
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <CoachTabs />
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
