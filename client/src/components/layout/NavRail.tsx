import { Archive, LogOut, MessageCircle, Settings, Users, UsersRound } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/store/auth";
import { useChat } from "@/store/chat";
import { useUi, type NavView } from "@/store/ui";

const items: { id: NavView; icon: typeof MessageCircle; label: string }[] = [
  { id: "chats", icon: MessageCircle, label: "Chats" },
  { id: "contacts", icon: Users, label: "Contacts" },
  { id: "groups", icon: UsersRound, label: "Groups" },
  { id: "archived", icon: Archive, label: "Archived" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function NavRail() {
  const nav = useUi((s) => s.nav);
  const setNav = useUi((s) => s.setNav);
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const unread = useChat((s) => s.conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0));

  return (
    <aside className="flex h-full w-[76px] shrink-0 flex-col items-center border-r border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] py-4">
      <Logo compact />
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = nav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setNav(item.id)}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
                active
                  ? "bg-[rgb(var(--accent)/0.16)] text-[rgb(var(--accent))]"
                  : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg-hover))]"
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <Icon size={20} />
              {item.id === "chats" && unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-[rgb(var(--accent))] px-1 text-[10px] text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="flex flex-col items-center gap-3">
        <Avatar name={user?.name ?? "You"} src={user?.avatar} size="sm" online />
        <button
          onClick={() => void logout()}
          className="text-[rgb(var(--muted))] hover:text-[rgb(var(--danger))]"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
