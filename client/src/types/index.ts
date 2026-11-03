export type PrivacyLevel = "everyone" | "contacts" | "nobody";

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string | null;
  bio: string;
  status: "online" | "offline";
  lastSeen: string | null;
  privacy?: {
    lastSeen: PrivacyLevel;
    profilePhoto: PrivacyLevel;
    readReceipts: boolean;
  };
  notifications?: {
    messageSound: boolean;
    desktop: boolean;
    inApp: boolean;
    mutedConversations: string[];
  };
  contacts?: string[];
  blockedUsers?: string[];
  pinnedConversations?: string[];
  archivedConversations?: string[];
}

export interface Conversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  description?: string;
  avatar: string | null;
  admins: string[];
  createdBy: string;
  participants: User[];
  lastMessage: {
    text: string;
    sender?: string;
    type: string;
    createdAt: string;
  } | null;
  pinned?: boolean;
  archived?: boolean;
  unreadCount?: number;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "file" | "system";
  text: string;
  attachment: {
    url: string;
    publicId?: string;
    filename: string;
    mimeType: string;
    size: number;
  } | null;
  replyTo: string | null;
  reactions: { emoji: string; userId: string }[];
  deliveredTo: string[];
  readBy: string[];
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  clientId?: string;
  pending?: boolean;
  failed?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  details?: unknown;
}
