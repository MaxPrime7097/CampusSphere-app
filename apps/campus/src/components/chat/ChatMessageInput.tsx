import React, { useRef, useState, useEffect } from "react";
import {
  PaperPlaneTilt as Send,
  Spinner as Loader2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Microphone,
  Trash,
  X,
  Smiley,
  Camera,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Message } from "@/types";

interface ChatMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (file?: File, duration?: number) => void;
  isSending: boolean;
  placeholder?: string;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

export const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
      "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋",
      "😛", "😜", "🤪", "😝", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨",
      "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔",
      "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵",
      "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐",
    ],
  },
  {
    name: "Gestes & Mains",
    icon: "👍",
    emojis: [
      "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲",
      "🤝", "🙏", "✍️", "💅", "🤳", "💪", "👈", "👉", "👆", "👇",
      "✌️", "🤞", "🖖", "🤘", "🤙", "🖐️", "✋", "👌", "👋", "🫡",
    ],
  },
  {
    name: "Cœurs & Amour",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💌",
    ],
  },
  {
    name: "Fêtes & Objets",
    icon: "🔥",
    emojis: [
      "🔥", "✨", "🌟", "💥", "💯", "💢", "💫", "💬", "💭", "🎉",
      "🎊", "🎁", "🎈", "🏆", "🥇", "🥈", "🥉", "⚽", "🏀", "🎓",
      "📚", "💡", "🚀", "☕", "🍕", "🍔", "🍻", "🍿", "🎵", "📷",
    ],
  },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatSeconds(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function ChatMessageInput({
  value,
  onChange,
  onSend,
  isSending,
  placeholder = "Écrivez un message...",
  replyingTo,
  onCancelReply,
}: ChatMessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Emoji Popover state
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-resize textarea height
  const adjustHeight = (): void => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setAttachedFile(file);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
    e.target.value = "";
  };

  const removeAttachment = (): void => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAttachedFile(null);
    setPreviewUrl(null);
  };

  const insertEmoji = (emoji: string): void => {
    if (!textareaRef.current) {
      onChange(value + emoji);
      return;
    }
    const start = textareaRef.current.selectionStart ?? value.length;
    const end = textareaRef.current.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    onChange(newValue);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + emoji.length;
        textareaRef.current.selectionEnd = start + emoji.length;
        textareaRef.current.focus();
      }
    }, 10);
  };

  // Keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTriggerSend();
    }
  };

  const handleTriggerSend = (): void => {
    if (isSending) return;
    if (!value.trim() && !attachedFile) return;

    const fileToSend = attachedFile || undefined;
    removeAttachment();
    onSend(fileToSend);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Voice recording handlers
  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Unable to access microphone:", err);
    }
  };

  const cancelRecording = (): void => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setRecordSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = (): void => {
    if (!mediaRecorderRef.current) return;
    const duration = Math.max(1, recordSeconds);
    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioFile = new File([audioBlob], `vocal_${Date.now()}.${ext}`, { type: mimeType });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      onSend(audioFile, duration);
    };

    recorder.stop();
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordSeconds(0);
  };

  return (
    <div className="p-3 bg-transparent flex-shrink-0 transition-all">
      {/* Hidden file pickers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="max-w-4xl mx-auto flex flex-col gap-1.5">
        {/* Reply Preview Bar (Clean French translation & Phosphor icons) */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-card border border-border/70 border-l-4 border-l-primary px-3.5 py-2 rounded-2xl text-xs shadow-xs animate-in slide-in-from-bottom-2 duration-150 mx-1">
            <div className="min-w-0 flex-1 pr-2">
              <p className="font-semibold text-primary truncate text-[11px]">
                Réponse à @{replyingTo.senderUsername || replyingTo.sender || "message"}
              </p>
              <p className="text-muted-foreground truncate text-[11px] flex items-center gap-1">
                {replyingTo.mediaType === "image" ? (
                  <>
                    <Camera className="h-3 w-3 inline flex-shrink-0" /> Photo
                  </>
                ) : replyingTo.mediaType === "audio" ? (
                  <>
                    <Microphone className="h-3 w-3 inline flex-shrink-0" /> Message vocal
                  </>
                ) : replyingTo.fileName ? (
                  <>
                    <FileText className="h-3 w-3 inline flex-shrink-0" /> {replyingTo.fileName}
                  </>
                ) : (
                  replyingTo.content || "Message"
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Annuler la réponse"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Attachment Preview Box */}
        {attachedFile && (
          <div className="flex items-center gap-2.5 p-2 bg-card border border-border/70 rounded-2xl shadow-xs animate-in fade-in duration-150 mx-1">
            {previewUrl ? (
              attachedFile.type.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  className="h-12 w-12 object-cover rounded-xl border border-border/40 bg-black"
                  muted
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Aperçu"
                  className="h-12 w-12 object-cover rounded-xl border border-border/40"
                />
              )
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{attachedFile.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(attachedFile.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={removeAttachment}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Live Audio Recording Pill (Modern redesigned WhatsApp/Telegram style) */}
        {isRecording ? (
          <div className="flex items-center justify-between gap-3 bg-card border border-rose-300 dark:border-rose-900/60 rounded-full px-3.5 py-1.5 shadow-sm animate-in fade-in duration-150">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={cancelRecording}
              className="h-8 w-8 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
              title="Annuler l'enregistrement"
              aria-label="Annuler l'enregistrement"
            >
              <Trash className="h-4 w-4" />
            </button>

            {/* Recording State & Live Soundwave Animation */}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-mono font-bold text-foreground tabular-nums">
                {formatSeconds(recordSeconds)}
              </span>

              {/* Animated Equalizer Visualizer */}
              <div className="flex items-center gap-[3px] h-4 mx-2">
                {[40, 75, 30, 90, 60, 100, 45, 80, 50, 70].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-[2.5px] bg-rose-500/80 rounded-full animate-pulse [animation-duration:800ms]"
                  />
                ))}
              </div>

              <span className="text-[11px] text-muted-foreground hidden sm:inline truncate">
                Enregistrement audio...
              </span>
            </div>

            {/* Send Audio Button */}
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-xs transition-transform active:scale-95 flex-shrink-0"
              title="Envoyer le vocal"
              aria-label="Envoyer le vocal"
            >
              <Send className="h-3.5 w-3.5" weight="fill" />
            </button>
          </div>
        ) : (
          /* Floating Capsule Input Pill (Brand Orange Sphera / Neutral Surfaces) */
          <div className="flex items-center gap-1.5 bg-card border border-border/80 rounded-full px-3 py-1 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            {/* Full-Featured Emoji Picker Popover */}
            <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  title="Émojis"
                  aria-label="Choisir un émoji"
                >
                  <Smiley className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-72 sm:w-80 p-2 rounded-2xl shadow-xl border bg-card text-card-foreground mb-2"
              >
                {/* Category Navigation */}
                <div className="flex items-center justify-between border-b pb-1.5 mb-2 gap-1">
                  {EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(i)}
                      className={`text-base h-8 flex-1 rounded-lg flex items-center justify-center transition-colors ${
                        selectedCategory === i
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                      title={cat.name}
                    >
                      {cat.icon}
                    </button>
                  ))}
                </div>

                {/* Emoji Grid */}
                <div className="grid grid-cols-7 sm:grid-cols-8 gap-1 max-h-48 overflow-y-auto scrollbar-thin p-1">
                  {EMOJI_CATEGORIES[selectedCategory].emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="text-lg h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted transition-transform hover:scale-115 active:scale-95"
                      onClick={() => insertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Paperclip Attachment Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Ajouter une pièce jointe"
                  title="Pièce jointe"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="mb-2 rounded-2xl p-1.5 shadow-lg">
                <DropdownMenuItem
                  onClick={() => imageInputRef.current?.click()}
                  className="gap-2.5 cursor-pointer rounded-xl py-2 px-3 text-xs"
                >
                  <ImageIcon className="h-4 w-4 text-emerald-500" />
                  <span>Photo / Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2.5 cursor-pointer rounded-xl py-2 px-3 text-xs"
                >
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span>Document / Fichier</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Seamless Auto-resizing Text Input */}
            <div className="flex-1 min-w-0 flex items-center py-1">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full resize-none bg-transparent text-[13.5px] px-1 focus:outline-none max-h-[120px] min-h-[24px] scrollbar-thin placeholder:text-muted-foreground leading-normal block"
                maxLength={1000}
              />
            </div>

            {/* Microphone or Send Action Button (Orange Sphera Primary) */}
            {!value.trim() && !attachedFile ? (
              <button
                type="button"
                className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform active:scale-95 shadow-xs flex-shrink-0"
                onClick={startRecording}
                aria-label="Enregistrer un message vocal"
                title="Enregistrer un message vocal"
              >
                <Microphone className="h-4.5 w-4.5" weight="fill" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTriggerSend}
                className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform active:scale-95 shadow-xs flex-shrink-0"
                disabled={(!value.trim() && !attachedFile) || isSending}
                aria-label="Envoyer"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 ml-0.5" weight="fill" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
