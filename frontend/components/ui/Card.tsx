import React from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border bg-white shadow-sm ${className}`}>{children}</div>;
}
export function CardHeader({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`p-4 md:p-5 ${className}`}>{children}</div>;
}
export function CardTitle({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`text-base font-semibold ${className}`}>{children}</div>;
}
export function CardContent({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-4 pb-4 md:px-5 md:pb-5 ${className}`}>{children}</div>;
}
