import React from "react";

type BadgeProps = React.PropsWithChildren<{
  className?: string;
}> &
  React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
