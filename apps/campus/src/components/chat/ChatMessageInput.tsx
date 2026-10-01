import React, { useRef } from "react";
import { PaperPlaneTilt as Send, Spinner as Loader2 } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChatMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  placeholder?: string;
}

export function ChatMessageInput({
  value,
  onChange,
  onSend,
  isSending,
  placeholder = "Écrivez votre message...",
}: ChatMessageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-3 border-t bg-card/50 flex-shrink-0">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm pr-12"
            maxLength={1000}
          />
          {value.length > 800 && (
            <span
              className={`absolute right-3 bottom-2 text-[10px] ${
                value.length >= 1000 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {value.length}/1000
            </span>
          )}
        </div>
        <Button
          onClick={onSend}
          className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 h-9 w-9 p-0 flex-shrink-0"
          disabled={!value.trim() || isSending}
          aria-label="Send message"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 pl-0.5">Entrée pour envoyer</p>
    </div>
  );
}
