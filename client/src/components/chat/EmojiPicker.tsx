const EMOJIS = ["😀","😁","😂","🥰","😍","😎","🤔","😢","😡","👍","👎","👏","🙏","🔥","✨","💜","💙","✅","🎉","❤️","😮","😴","🤝","📌"];

export function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg-elevated))] p-2 shadow-panel">
      {EMOJIS.map((e) => (
        <button key={e} className="h-8 w-8 rounded-lg text-lg hover:bg-[rgb(var(--bg-hover))]" onClick={() => onPick(e)}>
          {e}
        </button>
      ))}
    </div>
  );
}
