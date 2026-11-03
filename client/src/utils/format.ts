export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatTime(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function formatLastSeen(value?: string | null) {
  if (!value) return "last seen recently";
  const date = new Date(value);
  return `last seen ${date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
}

export function conversationTitle(name: string | undefined, participants: { id: string; name: string }[], meId?: string) {
  if (name) return name;
  const other = participants.find((p) => p.id !== meId);
  return other?.name ?? "Conversation";
}
