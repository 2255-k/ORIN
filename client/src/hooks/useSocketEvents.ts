import { useEffect } from "react";
import { connectSocket } from "@/services/socket";
import { useAuth } from "@/store/auth";
import { useChat } from "@/store/chat";
import type { ChatMessage, Conversation } from "@/types";

export function useSocketEvents() {
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();

    const onMessage = (message: ChatMessage) => {
      const state = useChat.getState();
      state.ingestMessage(message);
      if (message.senderId !== user.id && message.conversationId !== state.activeId) {
        const convo = state.conversations.find((c) => c.id === message.conversationId);
        const title = convo?.name ?? "New message";
        state.upsertConversation({
          ...(convo ?? {
            id: message.conversationId,
            type: "direct",
            avatar: null,
            admins: [],
            createdBy: message.senderId,
            participants: [],
            lastMessage: null,
          }),
          lastMessage: {
            text: message.text || (message.type === "image" ? "Photo" : "Attachment"),
            sender: message.senderId,
            type: message.type,
            createdAt: message.createdAt,
          },
          unreadCount: (convo?.unreadCount ?? 0) + 1,
          updatedAt: message.createdAt,
        } as Conversation);
        if (user.notifications?.inApp !== false) {
          useChat.setState({ inAppNotice: { title, body: message.text || "New attachment" } });
        }
        if (user.notifications?.messageSound !== false) {
          void playPing();
        }
        if (user.notifications?.desktop && Notification.permission === "granted") {
          new Notification(title, { body: message.text || "New message" });
        }
      }
    };

    const onUpdated = (message: ChatMessage) => useChat.getState().updateMessage(message);
    const onConvo = (conversation: Conversation) => useChat.getState().upsertConversation(conversation);
    const onTyping = (p: { conversationId: string; userId: string; typing: boolean }) => {
      if (p.userId === user.id) return;
      useChat.getState().setTyping(p.conversationId, p.userId, p.typing);
    };
    const onPresence = (p: { userId: string; status: "online" | "offline"; lastSeen?: string }) => {
      useChat.getState().updatePresence(p.userId, p.status, p.lastSeen);
    };
    const onRead = (p: { conversationId: string; userId: string }) => {
      const state = useChat.getState();
      const list = state.messages[p.conversationId];
      if (!list) return;
      useChat.setState({
        messages: {
          ...state.messages,
          [p.conversationId]: list.map((m) =>
            m.readBy.includes(p.userId) ? m : { ...m, readBy: [...m.readBy, p.userId] },
          ),
        },
      });
    };

    socket.on("message:new", onMessage);
    socket.on("message:updated", onUpdated);
    socket.on("conversation:updated", onConvo);
    socket.on("typing:update", onTyping);
    socket.on("presence:update", onPresence);
    socket.on("conversation:read", onRead);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:updated", onUpdated);
      socket.off("conversation:updated", onConvo);
      socket.off("typing:update", onTyping);
      socket.off("presence:update", onPresence);
      socket.off("conversation:read", onRead);
    };
  }, [user]);
}

async function playPing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    /* ignore */
  }
}
