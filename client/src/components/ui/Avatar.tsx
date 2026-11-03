import { initials } from "@/utils/format";

export function Avatar({
  name,
  src,
  size = "md",
  online,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  return (
    <div className={`relative shrink-0 ${dim}`}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[rgb(var(--accent)/0.18)] font-semibold text-[rgb(var(--accent))]">
          {initials(name)}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[rgb(var(--bg-panel))] ${
            online ? "bg-[rgb(var(--online))]" : "bg-zinc-500"
          }`}
        />
      )}
    </div>
  );
}
