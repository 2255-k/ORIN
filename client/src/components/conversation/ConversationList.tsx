import { Pin, Plus, Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/auth";
import { useChat } from "@/store/chat";
import { useUi } from "@/store/ui";
import { conversationTitle, formatTime } from "@/utils/format";

export function ConversationList({
  onNew,
  filter,
}: {
  onNew: () => void;
  filter: "all" | "groups" | "archived";
}) {
  const conversations = useChat((s) => s.conversations);
  const loading = useChat((s) => s.loadingList);
  const search = useChat((s) => s.search);
  const setSearch = useChat((s) => s.setSearch);
  const activeId = useChat((s) => s.activeId);
  const setActive = useChat((s) => s.setActive);
  const setMobileChat = useUi((s) => s.setMobileChat);
  const me = useAuth((s) => s.user);

  const visible = conversations.filter((c) => {
    if (filter === "groups" && c.type !== "group") return false;
    const q = search.toLowerCase();
    if (!q) return true;
    const title = conversationTitle(c.name, c.participants, me?.id).toLowerCase();
    return title.includes(q) || (c.lastMessage?.text ?? "").toLowerCase().includes(q);
  });

  return (
    <section className="flex h-full w-full max-w-[360px] min-w-[280px] flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--bg-panel))]">
      <div className="flex items-center justify-between px-4 pb-2 pt-5">
        <h1 className="text-lg font-semibold">
          {filter === "groups" ? "Groups" : filter === "archived" ? "Archived" : "Messages"}
        </h1>
        <button
          onClick={onNew}
          className="rounded-xl bg-[rgb(var(--accent))] p-2 text-white"
          aria-label="New conversation"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] py-2.5 pl-9 pr-3 text-sm outline-none"
          />
        </div>
      </div>
      <div className="orin-scroll flex-1 overflow-y-auto">
        {loading && <p className="px-4 py-6 text-sm text-[rgb(var(--muted))]">Loading conversations…</p>}
        {!loading && visible.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-[rgb(var(--muted))]">
            No conversations yet. Start a new one.
          </p>
        )}
        {visible.map((c) => {
          const other = c.participants.find((p) => p.id !== me?.id);
          const title = conversationTitle(c.name, c.participants, me?.id);
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => {
                void setActive(c.id);
                setMobileChat(true);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                active ? "bg-[rgb(var(--accent)/0.12)]" : "hover:bg-[rgb(var(--bg-hover))]"
              }`}
            >
              <Avatar
                name={title}
                src={c.type === "group" ? c.avatar : other?.avatar}
                online={c.type === "direct" ? other?.status === "online" : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{title}</span>
                  <span className="shrink-0 text-[11px] text-[rgb(var(--muted))]">
                    {formatTime(c.lastMessage?.createdAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-[rgb(var(--muted))]">{c.lastMessage?.text ?? "No messages yet"}</p>
                  <div className="flex items-center gap-1">
                    {c.pinned && <Pin size={11} className="text-[rgb(var(--accent))]" />}
                    {(c.unreadCount ?? 0) > 0 && (
                      <span className="min-w-[18px] rounded-full bg-[rgb(var(--accent))] px-1.5 text-center text-[10px] text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
