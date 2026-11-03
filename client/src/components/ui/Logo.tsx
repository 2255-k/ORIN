export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <defs>
          <linearGradient id="orinG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B6CFF" />
            <stop offset="100%" stopColor="#5B3FD6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#orinG)" />
        <circle cx="16" cy="16" r="6.4" fill="none" stroke="white" strokeWidth="2.1" />
        <path d="M22.6 11.4c1.7 1.3 2.8 3.3 2.8 5.6" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      {!compact && (
        <div>
          <div className="text-sm font-semibold tracking-[0.18em]">ORIN</div>
          <div className="text-[10px] text-[rgb(var(--muted))]">Connect Beyond Words.</div>
        </div>
      )}
    </div>
  );
}
