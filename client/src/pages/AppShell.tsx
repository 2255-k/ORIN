import { useEffect, useState } from "react";
import { NavRail } from "@/components/layout/NavRail";
import { ConversationList } from "@/components/conversation/ConversationList";
import { ContactsView } from "@/components/contacts/ContactsView";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { DetailsPanel } from "@/components/chat/DetailsPanel";
import { NewConversationModal } from "@/components/conversation/NewConversationModal";
import { SettingsPage } from "@/pages/SettingsPage";
import { useChat } from "@/store/chat";
import { useUi } from "@/store/ui";
import { useSocketEvents } from "@/hooks/useSocketEvents";

export function AppShell() {
  const nav = useUi((s) => s.nav);
  const mobileChat = useUi((s) => s.mobileChat);
  const loadConversations = useChat((s) => s.loadConversations);
  const notice = useChat((s) => s.inAppNotice);
  const clearNotice = useChat((s) => s.clearNotice);
  const [modal, setModal] = useState<"direct" | "group" | null>(null);
  useSocketEvents();

  useEffect(() => {
    const filter = nav === "groups" ? "groups" : nav === "archived" ? "archived" : "all";
    if (nav !== "settings" && nav !== "contacts") void loadConversations(filter);
  }, [nav, loadConversations]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(clearNotice, 4000);
    return () => clearTimeout(t);
  }, [notice, clearNotice]);

  const list =
    nav === "contacts" ? (
      <ContactsView />
    ) : nav === "settings" ? null : (
      <ConversationList
        filter={nav === "groups" ? "groups" : nav === "archived" ? "archived" : "all"}
        onNew={() => setModal(nav === "groups" ? "group" : "direct")}
      />
    );

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`${mobileChat ? "hidden md:flex" : "flex"}`}>
        <NavRail />
      </div>
      {nav === "settings" ? (
        <SettingsPage />
      ) : (
        <>
          <div className={`${mobileChat ? "hidden md:flex" : "flex"} h-full`}>
            {list}
          </div>
          <div className={`${mobileChat ? "flex" : "hidden md:flex"} min-w-0 flex-1`}>
            <ChatWindow />
            <DetailsPanel />
          </div>
        </>
      )}
      <NewConversationModal open={modal !== null} mode={modal ?? "direct"} onClose={() => setModal(null)} />
      {notice && (
        <div className="fixed right-4 top-4 z-50 w-80 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-panel))] p-4 shadow-panel">
          <p className="text-sm font-medium">{notice.title}</p>
          <p className="mt-1 truncate text-sm text-[rgb(var(--muted))]">{notice.body}</p>
        </div>
      )}
    </div>
  );
}
