import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  const v =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : variant === "secondary"
      ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
      : "bg-transparent text-neutral-900 hover:bg-neutral-100";
  const s = size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${v} ${s} ${className}`}
      {...props}
    />
  );
}
