import { create } from "zustand";
import { api } from "@/services/api";
import { getSocket } from "@/services/socket";
import { useAuth } from "@/store/auth";
import type { ChatMessage, Conversation, User } from "@/types";

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeId: string | null;
  contacts: User[];
  typing: Record<string, string[]>;
  search: string;
  loadingList: boolean;
  loadingMessages: boolean;
  hasMore: Record<string, boolean>;
  inAppNotice: { title: string; body: string } | null;
  setSearch: (search: string) => void;
  setActive: (id: string | null) => Promise<void>;
  loadConversations: (filter?: string) => Promise<void>;
  loadContacts: () => Promise<void>;
  loadMessages: (id: string, before?: string) => Promise<void>;
  sendText: (text: string, replyTo?: string | null) => Promise<void>;
  sendFile: (file: File, replyTo?: string | null) => Promise<void>;
  editMessage: (id: string, text: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  react: (id: string, emoji: string) => Promise<void>;
  ingestMessage: (message: ChatMessage) => void;
  updateMessage: (message: ChatMessage) => void;
  upsertConversation: (conversation: Conversation) => void;
  setTyping: (conversationId: string, userId: string, typing: boolean) => void;
  updatePresence: (userId: string, status: "online" | "offline", lastSeen?: string) => void;
  markRead: (id: string) => Promise<void>;
  pin: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  startDirect: (userId: string) => Promise<string>;
  clearNotice: () => void;
}

function sortConversations(list: Conversation[]) {
  return [...list].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
  });
}

export const useChat = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  activeId: null,
  contacts: [],
  typing: {},
  search: "",
  loadingList: false,
  loadingMessages: false,
  hasMore: {},
  inAppNotice: null,
  setSearch: (search) => set({ search }),
  clearNotice: () => set({ inAppNotice: null }),
  loadConversations: async (filter = "all") => {
    set({ loadingList: true });
    const { data } = await api.get("/conversations", { params: { filter } });
    set({ conversations: sortConversations(data.data.conversations), loadingList: false });
  },
  loadContacts: async () => {
    const { data } = await api.get("/users/contacts");
    set({ contacts: data.data.contacts });
  },
  setActive: async (id) => {
    set({ activeId: id });
    if (!id) return;
    getSocket()?.emit("conversation:join", id);
    await get().loadMessages(id);
    await get().markRead(id);
  },
  loadMessages: async (id, before) => {
    if (!before) set({ loadingMessages: true });
    const { data } = await api.get(`/messages/${id}`, { params: { before, limit: 40 } });
    const incoming = data.data.messages as ChatMessage[];
    set((s) => {
      const existing = s.messages[id] ?? [];
      const merged = before ? [...incoming, ...existing] : incoming;
      const unique = Array.from(new Map(merged.map((m) => [m.id, m])).values());
      return {
        messages: { ...s.messages, [id]: unique },
        loadingMessages: false,
        hasMore: { ...s.hasMore, [id]: incoming.length >= 40 },
      };
    });
  },
  sendText: async (text, replyTo) => {
    const { activeId } = get();
    if (!activeId) return;
    const clientId = crypto.randomUUID();
    const optimistic: ChatMessage = {
      id: clientId,
      conversationId: activeId,
      senderId: useAuth.getState().user?.id ?? "me",
      type: "text",
      text,
      attachment: null,
      replyTo: replyTo ?? null,
      reactions: [],
      deliveredTo: [],
      readBy: [],
      editedAt: null,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      clientId,
      pending: true,
    };
    set((s) => ({ messages: { ...s.messages, [activeId]: [...(s.messages[activeId] ?? []), optimistic] } }));
    try {
      const { data } = await api.post("/messages/send", {
        conversationId: activeId,
        text,
        replyTo,
        clientId,
      });
      get().updateMessage({ ...data.data.message, pending: false });
    } catch {
      set((s) => ({
        messages: {
          ...s.messages,
          [activeId]: (s.messages[activeId] ?? []).map((m) =>
            m.clientId === clientId ? { ...m, pending: false, failed: true } : m,
          ),
        },
      }));
    }
  },
  sendFile: async (file, replyTo) => {
    const { activeId } = get();
    if (!activeId) return;
    const form = new FormData();
    form.append("file", file);
    form.append("conversationId", activeId);
    if (replyTo) form.append("replyTo", replyTo);
    const { data } = await api.post("/messages", form);
    get().ingestMessage(data.data.message);
  },
  editMessage: async (id, text) => {
    const { data } = await api.patch(`/messages/${id}`, { text });
    get().updateMessage(data.data.message);
  },
  deleteMessage: async (id) => {
    const { data } = await api.delete(`/messages/${id}`);
    get().updateMessage(data.data.message);
  },
  react: async (id, emoji) => {
    const { data } = await api.post(`/messages/${id}/react`, { emoji });
    get().updateMessage(data.data.message);
  },
  ingestMessage: (message) => {
    set((s) => {
      const list = s.messages[message.conversationId] ?? [];
      const withoutTemp = list.filter((m) => m.clientId !== message.clientId && m.id !== message.id);
      return {
        messages: { ...s.messages, [message.conversationId]: [...withoutTemp, message] },
      };
    });
  },
  updateMessage: (message) => {
    set((s) => {
      const list = s.messages[message.conversationId] ?? [];
      return {
        messages: {
          ...s.messages,
          [message.conversationId]: list.map((m) =>
            m.id === message.id || (message.clientId && m.clientId === message.clientId) ? message : m,
          ),
        },
      };
    });
  },
  upsertConversation: (conversation) => {
    set((s) => {
      const rest = s.conversations.filter((c) => c.id !== conversation.id);
      return { conversations: sortConversations([conversation, ...rest]) };
    });
  },
  setTyping: (conversationId, userId, typing) => {
    set((s) => {
      const current = new Set(s.typing[conversationId] ?? []);
      if (typing) current.add(userId);
      else current.delete(userId);
      return { typing: { ...s.typing, [conversationId]: [...current] } };
    });
  },
  updatePresence: (userId, status, lastSeen) => {
    set((s) => ({
      conversations: s.conversations.map((c) => ({
        ...c,
        participants: c.participants.map((p) =>
          p.id === userId ? { ...p, status, lastSeen: lastSeen ?? p.lastSeen } : p,
        ),
      })),
    }));
  },
  markRead: async (id) => {
    await api.post(`/messages/${id}/read`);
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    }));
  },
  pin: async (id) => {
    await api.post(`/conversations/${id}/pin`);
    await get().loadConversations();
  },
  archive: async (id) => {
    await api.post(`/conversations/${id}/archive`);
    await get().loadConversations();
  },
  startDirect: async (userId) => {
    const { data } = await api.post("/conversations/direct", { userId });
    const conversation = data.data.conversation as Conversation;
    get().upsertConversation(conversation);
    await get().setActive(conversation.id);
    return conversation.id;
  },
}));
