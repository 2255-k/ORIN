import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/Input";
import { api } from "@/services/api";
import { useChat } from "@/store/chat";
import { useUi } from "@/store/ui";
import type { User } from "@/types";

export function NewConversationModal({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: "direct" | "group";
}) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const startDirect = useChat((s) => s.startDirect);
  const loadConversations = useChat((s) => s.loadConversations);
  const setActive = useChat((s) => s.setActive);
  const setMobileChat = useUi((s) => s.setMobileChat);

  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(async () => {
      const { data } = await api.get("/users/search", { params: { q } });
      setUsers(data.data.users);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function submit() {
    if (mode === "direct") {
      const id = selected[0];
      if (!id) return;
      await startDirect(id);
      setMobileChat(true);
      onClose();
      return;
    }
    const form = new FormData();
    form.append("name", name);
    form.append("description", description);
    form.append("memberIds", JSON.stringify(selected));
    const { data } = await api.post("/conversations/group", form);
    await loadConversations("all");
    await setActive(data.data.conversation.id);
    setMobileChat(true);
    onClose();
  }

  return (
    <Modal open={open} title={mode === "group" ? "New group" : "New conversation"} onClose={onClose}>
      {mode === "group" && (
        <div className="mb-3 space-y-2">
          <TextInput placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      )}
      <TextInput placeholder="Search people" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="orin-scroll mt-3 max-h-56 space-y-1 overflow-y-auto">
        {users.map((u) => {
          const on = selected.includes(u.id);
          return (
            <button
              key={u.id}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${on ? "bg-[rgb(var(--accent)/0.16)]" : "hover:bg-[rgb(var(--bg-hover))]"}`}
              onClick={() =>
                setSelected((s) =>
                  mode === "direct" ? [u.id] : on ? s.filter((id) => id !== u.id) : [...s, u.id],
                )
              }
            >
              <span>
                {u.name} <span className="text-[rgb(var(--muted))]">@{u.username}</span>
              </span>
              {on ? "Selected" : "Select"}
            </button>
          );
        })}
      </div>
      <Button className="mt-4 w-full" onClick={() => void submit()} disabled={selected.length === 0 || (mode === "group" && name.trim().length < 2)}>
        {mode === "group" ? "Create group" : "Start chat"}
      </Button>
    </Modal>
  );
}
