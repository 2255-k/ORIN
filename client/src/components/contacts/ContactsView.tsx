import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api, getErrorMessage } from "@/services/api";
import { useChat } from "@/store/chat";
import { useUi } from "@/store/ui";
import type { User } from "@/types";

export function ContactsView() {
  const contacts = useChat((s) => s.contacts);
  const loadContacts = useChat((s) => s.loadContacts);
  const startDirect = useChat((s) => s.startDirect);
  const setMobileChat = useUi((s) => s.setMobileChat);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/users/search", { params: { q } });
        setResults(data.data.users);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function add(user: User) {
    await api.post(`/users/${user.id}/contact`);
    await loadContacts();
    const id = await startDirect(user.id);
    if (id) setMobileChat(true);
  }

  return (
    <section className="flex h-full w-full max-w-[360px] min-w-[280px] flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--bg-panel))]">
      <div className="px-4 pb-2 pt-5">
        <h1 className="text-lg font-semibold">Contacts</h1>
      </div>
      <div className="px-4 pb-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people on ORIN"
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] py-2.5 pl-9 pr-3 text-sm outline-none"
          />
        </div>
      </div>
      <div className="orin-scroll flex-1 overflow-y-auto px-2">
        {q && (
          <>
            <p className="px-2 py-2 text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Search results</p>
            {loading && <p className="px-3 text-sm text-[rgb(var(--muted))]">Searching…</p>}
            {error && <p className="px-3 text-sm text-[rgb(var(--danger))]">{error}</p>}
            {!loading && results.length === 0 && q.trim() && (
              <p className="px-3 py-6 text-sm text-[rgb(var(--muted))]">No users found for “{q}”.</p>
            )}
            {results.map((u) => (
              <UserRow key={u.id} user={u} actionLabel="Add" onAction={() => void add(u)} />
            ))}
          </>
        )}
        <p className="px-2 py-2 text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Your contacts</p>
        {contacts.length === 0 && <p className="px-3 py-6 text-sm text-[rgb(var(--muted))]">No contacts yet. Search to add someone.</p>}
        {contacts.map((u) => (
          <UserRow
            key={u.id}
            user={u}
            actionLabel="Message"
            onAction={async () => {
              await startDirect(u.id);
              setMobileChat(true);
            }}
            onRemove={async () => {
              await api.delete(`/users/${u.id}/contact`);
              await loadContacts();
            }}
          />
        ))}
      </div>
    </section>
  );
}

function UserRow({
  user,
  actionLabel,
  onAction,
  onRemove,
}: {
  user: User;
  actionLabel: string;
  onAction: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[rgb(var(--bg-hover))]">
      <Avatar name={user.name} src={user.avatar} online={user.status === "online"} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{user.name}</div>
        <div className="truncate text-xs text-[rgb(var(--muted))]">@{user.username}</div>
      </div>
      <Button className="px-3 py-1.5" onClick={onAction}>
        {actionLabel}
      </Button>
      {onRemove && (
        <button className="text-xs text-[rgb(var(--muted))]" onClick={onRemove}>
          Remove
        </button>
      )}
    </div>
  );
}
