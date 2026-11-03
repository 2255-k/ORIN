import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-[rgb(var(--muted))]">{label}</span>
      {children}
      {error ? <span className="text-xs text-[rgb(var(--danger))]">{error}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] px-3.5 py-2.5 text-sm outline-none transition placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--accent))] ${props.className ?? ""}`}
    />
  );
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} type={show ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
