import { Send } from "lucide-react";
import { useState } from "react";

import { Button } from "#/components/ui/Button";

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask your agent anything..."
        disabled={disabled}
        className="flex-1 rounded-xl border border-surface-border bg-surface-raised px-4 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-crew-500 focus:ring-2 focus:ring-crew-500/20 disabled:opacity-50"
      />
      <Button type="submit" disabled={disabled || !value.trim()} icon={<Send className="h-4 w-4" />}>
        Send
      </Button>
    </form>
  );
}
