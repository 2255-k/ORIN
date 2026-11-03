import { Check, CheckCheck, Copy, Pencil, Reply, Smile, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ChatMessage, User } from "@/types";
import { formatTime } from "@/utils/format";
import { EmojiPicker } from "./EmojiPicker";

export function MessageBubble({
  message,
  mine,
  sender,
  reply,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: {
  message: ChatMessage;
  mine: boolean;
  sender?: User;
  reply?: ChatMessage;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const status =
    message.readBy.length > 1 ? "read" : message.deliveredTo.length > 1 ? "delivered" : "sent";

  if (message.type === "system") {
    return (
      <div className="my-3 text-center text-xs text-[rgb(var(--muted))]">{message.text}</div>
    );
  }

  return (
    <div className={`group flex ${mine ? "justify-end" : "justify-start"} px-4 py-1`}>
      <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {!mine && sender && <span className="mb-1 px-1 text-[11px] text-[rgb(var(--muted))]">{sender.name}</span>}
        <div
          className={`relative rounded-2xl px-3.5 py-2.5 text-sm ${mine ? "bubble-out rounded-br-md" : "bubble-in rounded-bl-md"} ${
            message.failed ? "opacity-70" : ""
          }`}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu((m) => !m);
          }}
        >
          {reply && (
            <div className="mb-1 rounded-lg border-l-2 border-white/50 bg-black/10 px-2 py-1 text-xs opacity-90">
              {reply.text || "Attachment"}
            </div>
          )}
          {message.deletedAt ? (
            <em className="opacity-70">This message was deleted</em>
          ) : message.type === "image" && message.attachment ? (
            <a href={message.attachment.url} target="_blank" rel="noreferrer">
              <img src={message.attachment.url} alt="" className="mb-1 max-h-64 rounded-xl" />
              {message.text}
            </a>
          ) : message.type === "file" && message.attachment ? (
            <a href={message.attachment.url} className="underline" target="_blank" rel="noreferrer">
              {message.attachment.filename}
            </a>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          )}
          <div className={`mt-1 flex items-center gap-1 text-[10px] ${mine ? "text-white/70" : "text-[rgb(var(--muted))]"}`}>
            {message.editedAt && <span>edited</span>}
            <span>{formatTime(message.createdAt)}</span>
            {mine && !message.pending && (
              status === "read" ? <CheckCheck size={12} /> : <Check size={12} />
            )}
            {message.pending && <span>sending…</span>}
            {message.failed && <span>failed</span>}
          </div>
          {message.reactions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {Object.entries(
                message.reactions.reduce<Record<string, number>>((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
                  return acc;
                }, {}),
              ).map(([emoji, count]) => (
                <button key={emoji} onClick={() => onReact(emoji)} className="rounded-full bg-black/10 px-1.5 text-xs">
                  {emoji} {count}
                </button>
              ))}
            </div>
          )}
          {menu && (
            <div className={`absolute z-10 mt-2 w-40 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-1 shadow-panel ${mine ? "right-0" : "left-0"}`}>
              <MenuItem icon={Reply} label="Reply" onClick={onReply} />
              <MenuItem icon={Smile} label="React" onClick={() => setEmojiOpen(true)} />
              <MenuItem
                icon={Copy}
                label="Copy"
                onClick={() => void navigator.clipboard.writeText(message.text)}
              />
              {mine && !message.deletedAt && message.type === "text" && (
                <MenuItem icon={Pencil} label="Edit" onClick={onEdit} />
              )}
              {mine && !message.deletedAt && <MenuItem icon={Trash2} label="Delete" onClick={onDelete} />}
            </div>
          )}
          {emojiOpen && (
            <div className="absolute z-20 mt-2">
              <EmojiPicker
                onPick={(e) => {
                  onReact(e);
                  setEmojiOpen(false);
                  setMenu(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Reply;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-[rgb(var(--bg-hover))]"
      onClick={() => onClick()}
    >
      <Icon size={13} /> {label}
    </button>
  );
}
