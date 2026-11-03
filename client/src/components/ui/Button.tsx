import type { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "muted" }) {
  const styles = {
    primary: "bg-[rgb(var(--accent))] text-white hover:brightness-110",
    ghost: "hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text))]",
    danger: "bg-[rgb(var(--danger))] text-white hover:brightness-110",
    muted: "bg-[rgb(var(--bg-hover))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}
