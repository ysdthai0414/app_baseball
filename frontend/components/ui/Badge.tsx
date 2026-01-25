// @/components/ui/Badge.tsx

import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "destructive"; // これを追加
}

export function Badge({ children, className, variant = "default", ...props }: BadgeProps) {
  // variantによってクラスを切り替える例
  const variantStyles = {
    default: "bg-blue-500 text-white",
    outline: "border border-white/20 text-white",
    secondary: "bg-slate-800 text-slate-400",
    destructive: "bg-red-500 text-white",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}