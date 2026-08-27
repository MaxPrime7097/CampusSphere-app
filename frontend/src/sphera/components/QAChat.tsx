import React, { useRef, useEffect, useState } from "react";
import { Send, MessageCircleQuestion, AlertCircle, Loader2 } from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { useQAChat } from "../hooks/useQAChat";
import type { QAMessage } from "../types/sphera.types";

interface QAChatProps {
  sessionId: number;
  initialHistory?: QAMessage[];
}

export function QAChat({ sessionId, initialHistory = [] }: QAChatProps) {
  const { messages, isLoading, error, sendQuestion, clearError } = useQAChat({
    sessionId,
    initialHistory,
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendQuestion(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[560px] rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-primary/5">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <MessageCircleQuestion className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Q&A -- Assistante Sphera</p>
          <p className="text-xs text-muted-foreground">Reponses basees uniquement sur ton cours</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
          <SpheraIcon size="xs" />
          IA
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-border">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <MessageCircleQuestion className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Pose ta premiere question</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                Je reponds en me basant exclusivement sur le contenu de ton cours.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Question (droite) */}
            <div className="flex justify-end">
              <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
                {msg.question}
              </div>
            </div>
            {/* Reponse (gauche) */}
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <SpheraIcon size="sm" />
              </div>
              <div className="max-w-[80%] bg-accent/60 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
                {msg.answer}
              </div>
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {isLoading && (
          <div className="flex gap-2.5 animate-in fade-in duration-200">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <SpheraIcon size="sm" />
            </div>
            <div className="bg-accent/60 border border-border/30 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-destructive">{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-muted-foreground underline mt-1 hover:text-foreground transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2.5 px-5 py-4 border-t border-border/40 bg-background/40">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pose ta question sur le cours..."
          disabled={isLoading}
          className="flex-1 bg-accent/40 border border-border/40 rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
