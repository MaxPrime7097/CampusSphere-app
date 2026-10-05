import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Smiley as Smile,
  DotsThreeVertical as MoreVertical,
  PencilSimple,
  Trash,
  Check,
  Checks,
  Clock,
  ArrowBendUpLeft,
  FileText,
  Camera,
  VideoCamera,
  Microphone,
  DownloadSimple,
  Play,
  Pause,
  Prohibit,
  CircleNotch,
  SpeakerHigh,
  SpeakerSimpleSlash,
  ArrowsOut,
} from "@phosphor-icons/react";
import { getCachedMediaUrl, isMediaCached, downloadAndCacheMedia } from "@/lib/mediaCache";
import type { Message } from "@/types";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const WAVE_BARS = [
  30, 45, 25, 60, 85, 40, 70, 95, 65, 80, 50, 90, 75, 60, 40, 70, 85, 55, 65, 45, 75, 50, 35, 20,
];

export function formatFileSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function formatAudioTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function formatMessageTime(timestamp?: string | null): string {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "";
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function StatusCheckmarks({ status }: { status?: string }) {
  if (status === "sending") {
    return <Clock className="h-2.5 w-2.5 opacity-80 animate-spin" />;
  }
  if (status === "read") {
    return <Checks className="h-3 w-3 text-sky-300 dark:text-sky-400 stroke-[2.5]" />;
  }
  if (status === "delivered") {
    return <Checks className="h-3 w-3 opacity-80" />;
  }
  return <Check className="h-2.5 w-2.5 opacity-80" />;
}

/**
 * WhatsApp-style cached image component
 */
export function CachedImage({
  src,
  alt,
  className,
  onClick,
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [cachedUrl, setCachedUrl] = useState(src);

  useEffect(() => {
    let isMounted = true;
    void getCachedMediaUrl(src).then((url) => {
      if (isMounted && url) setCachedUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <img
      src={cachedUrl}
      alt={alt}
      className={className}
      onClick={onClick}
      loading="lazy"
    />
  );
}

/**
 * Modern Soundwave Voice Note Player (WhatsApp & Telegram style)
 * Includes speed toggle (1x / 1.5x / 2x) and WhatsApp-style local media caching
 */
export function SoundwavePlayer({
  src,
  duration,
  isCurrentUser,
  timestamp,
  status,
}: {
  src: string;
  duration?: number | null;
  isCurrentUser: boolean;
  timestamp?: string | null;
  status?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(() => {
    if (isCurrentUser) return true;
    if (src.startsWith("blob:") || src.startsWith("data:")) return true;
    return false;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [mediaSrc, setMediaSrc] = useState<string>(src);

  useEffect(() => {
    let isMounted = true;
    if (isCurrentUser || src.startsWith("blob:") || src.startsWith("data:")) {
      setIsDownloaded(true);
      return;
    }
    void isMediaCached(src).then((cached) => {
      if (!isMounted) return;
      if (cached) {
        setIsDownloaded(true);
        void getCachedMediaUrl(src, false).then((url) => {
          if (isMounted) setMediaSrc(url);
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [src, isCurrentUser]);

  const handleDownload = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const url = await downloadAndCacheMedia(src);
      setMediaSrc(url);
      setIsDownloaded(true);
    } catch {
      setIsDownloaded(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const totalDuration = duration && duration > 0 ? duration : 5;

  const togglePlay = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!isDownloaded) {
      void handleDownload(e);
      return;
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsBuffering(false);
    } else {
      setIsBuffering(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch((): void => {
          setIsBuffering(false);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = (): void => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);

    if (cur >= totalDuration) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setIsBuffering(false);
      setCurrentTime(0);
    }
  };

  const handleEnded = (): void => {
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);
  };

  const handleBarClick = (index: number, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!isDownloaded) {
      void handleDownload(e);
      return;
    }
    const percent = index / (WAVE_BARS.length - 1);
    const targetTime = percent * totalDuration;
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      if (!isPlaying) {
        setIsBuffering(true);
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((): void => {
            setIsBuffering(false);
            setIsPlaying(false);
          });
      }
    }
  };

  const cyclePlaybackRate = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const rates = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const progressPercent = totalDuration > 0 ? Math.min(1, Math.max(0, currentTime / totalDuration)) : 0;
  const activeBarIndex = Math.floor(progressPercent * WAVE_BARS.length);

  return (
    <div
      className={`flex items-center gap-2 py-1 px-1 rounded-2xl min-w-[220px] max-w-[285px] select-none ${
        isCurrentUser ? "text-primary-foreground" : "text-foreground"
      }`}
    >
      <audio
        ref={audioRef}
        src={mediaSrc}
        preload="metadata"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* WhatsApp Download button (if not downloaded) or Play/Pause button */}
      {!isDownloaded ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-xs ${
            isCurrentUser
              ? "bg-white text-zinc-800 hover:bg-white/95"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          aria-label="Télécharger le vocal"
          title="Télécharger le vocal"
        >
          {isDownloading ? (
            <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" />
          ) : (
            <DownloadSimple className="h-4 w-4" weight="bold" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={togglePlay}
          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-xs ${
            isCurrentUser
              ? "bg-white text-zinc-800 hover:bg-white/95"
              : "bg-foreground text-background hover:opacity-90"
          }`}
          aria-label={isPlaying ? "Pause" : "Lecture"}
        >
          {isBuffering ? (
            <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" />
          ) : isPlaying ? (
            <Pause className="h-3.5 w-3.5" weight="fill" />
          ) : (
            <Play className="h-3.5 w-3.5 ml-0.5" weight="fill" />
          )}
        </button>
      )}

      {/* Soundwave Bars Equalizer */}
      <div className="flex-1 flex items-center gap-[2px] h-6 cursor-pointer">
        {WAVE_BARS.map((heightPercent, i) => {
          const isPassed = i <= activeBarIndex;
          return (
            <div
              key={i}
              onClick={(e) => handleBarClick(i, e)}
              className="flex-1 h-full flex items-center justify-center py-0.5 hover:opacity-80 transition-opacity"
            >
              <span
                style={{ height: `${Math.max(18, heightPercent)}%` }}
                className={`w-[2.5px] rounded-full transition-colors ${
                  isCurrentUser
                    ? isPassed
                      ? "bg-white"
                      : "bg-white/35"
                    : isPassed
                    ? "bg-foreground"
                    : "bg-muted-foreground/35"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Time, Speed and Status in Soundwave */}
      <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] tabular-nums font-medium opacity-90">
        <span>{isPlaying ? formatAudioTime(currentTime) : formatAudioTime(totalDuration)}</span>
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold transition-all select-none hover:scale-105 active:scale-95 ${
            isCurrentUser
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-muted hover:bg-muted/80 text-foreground border border-border/50"
          }`}
          title="Vitesse de lecture"
          aria-label={`Vitesse: ${playbackRate}x`}
        >
          {playbackRate}x
        </button>
        {isCurrentUser && <StatusCheckmarks status={status} />}
      </div>
    </div>
  );
}

/**
 * Custom WhatsApp-style Video Player with caching, custom controls, and download button
 */
export function CustomVideoPlayer({
  src,
  fileName,
  timestamp,
  status,
  isCurrentUser,
  isAutoCaption,
  onOpenMedia,
}: {
  src: string;
  fileName?: string | null;
  timestamp?: string | null;
  status?: string;
  isCurrentUser: boolean;
  isAutoCaption: boolean;
  onOpenMedia?: (mediaUrl: string, mediaType?: string, fileName?: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cachedUrl, setCachedUrl] = useState(src);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(() => {
    if (isCurrentUser) return true;
    if (src.startsWith("blob:") || src.startsWith("data:")) return true;
    return false;
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideControlsTimer = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isCurrentUser || src.startsWith("blob:") || src.startsWith("data:")) {
      setIsDownloaded(true);
      return;
    }
    void isMediaCached(src).then((cached) => {
      if (!isMounted) return;
      if (cached) {
        setIsDownloaded(true);
        void getCachedMediaUrl(src, false).then((url) => {
          if (isMounted) setCachedUrl(url);
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [src, isCurrentUser]);

  const handleDownload = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const url = await downloadAndCacheMedia(src);
      setCachedUrl(url);
      setIsDownloaded(true);
    } catch {
      setIsDownloaded(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const scheduleHideControls = () => {
    if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 2500);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    scheduleHideControls();
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isDownloaded) {
      if (e) void handleDownload(e);
      return;
    }
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    } else {
      setIsBuffering(true);
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
          scheduleHideControls();
        })
        .catch(() => {
          setIsBuffering(false);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const target = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenMedia) {
      onOpenMedia(cachedUrl, "video", fileName || undefined);
    } else if (containerRef.current) {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      } else {
        void containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      onClick={togglePlay}
      className="rounded-xl overflow-hidden max-w-sm mb-0.5 relative bg-black select-none group/vid cursor-pointer shadow-sm"
    >
      <video
        ref={videoRef}
        src={cachedUrl}
        playsInline
        preload="metadata"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="w-full max-h-72 rounded-xl object-contain bg-black block"
      />

      {/* Central WhatsApp-style Download button OR Play/Buffering button */}
      {!isDownloaded ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xs z-10">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-12 w-12 rounded-full bg-black/75 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-transform active:scale-95 shadow-xl border border-white/20"
            aria-label="Télécharger la vidéo"
            title="Télécharger la vidéo"
          >
            {isDownloading ? (
              <CircleNotch className="h-6 w-6 animate-spin" weight="bold" />
            ) : (
              <DownloadSimple className="h-6 w-6" weight="bold" />
            )}
          </button>
        </div>
      ) : (
        (!isPlaying || isBuffering || showControls) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={togglePlay}
              className="h-12 w-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-transform active:scale-95 pointer-events-auto shadow-lg"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isBuffering ? (
                <CircleNotch className="h-6 w-6 animate-spin" weight="bold" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" weight="fill" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" weight="fill" />
              )}
            </button>
          </div>
        )
      )}

      {/* Bottom Custom Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-2 pt-6 flex flex-col gap-1 transition-opacity duration-200 ${
          (showControls || !isPlaying) && isDownloaded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar */}
        <div className="relative w-full flex items-center h-2 cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          />
        </div>

        {/* Buttons and Time */}
        <div className="flex items-center justify-between text-white text-[11px] pt-0.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="hover:text-primary transition-colors p-0.5"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? <Pause className="h-4 w-4" weight="fill" /> : <Play className="h-4 w-4" weight="fill" />}
            </button>
            <span className="tabular-nums font-mono opacity-90 text-[10px]">
              {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="hover:text-primary transition-colors p-0.5"
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <SpeakerSimpleSlash className="h-4 w-4" /> : <SpeakerHigh className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleFullscreen}
              className="hover:text-primary transition-colors p-0.5"
              aria-label="Plein écran"
              title="Plein écran"
            >
              <ArrowsOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto caption time badge & status checkmarks (ALWAYS visible on video!) */}
      {isAutoCaption && (
        <div
          className={`absolute right-1.5 z-20 bg-black/65 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums pointer-events-none transition-all duration-200 ${
            showControls || !isPlaying ? "bottom-9" : "bottom-1.5"
          }`}
        >
          <span>{formatMessageTime(timestamp)}</span>
          {isCurrentUser && <StatusCheckmarks status={status} />}
        </div>
      )}
    </div>
  );
}

interface ChatMessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  isModerator: boolean;
  isGroup?: boolean;
  isDeleting?: boolean;
  isEditing: boolean;
  editingContent: string;
  onStartEdit: (message: Message) => void;
  onChangeEditContent: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onScrollToMessage?: (messageId: string) => void;
  messageReactions?: Record<string, string[]>;
  onToggleReaction: (messageId: string, emoji: string) => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: (messageId: string) => void;
  onSelectEmoji: (messageId: string, emoji: string) => void;
  onNavigateProfile: (username?: string, displayName?: string) => void;
  onOpenMedia?: (mediaUrl: string, mediaType?: string, fileName?: string) => void;
}

export function ChatMessageItem({
  message,
  isCurrentUser,
  isModerator,
  isGroup = false,
  isDeleting = false,
  isEditing,
  editingContent,
  onStartEdit,
  onChangeEditContent,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onReply,
  onScrollToMessage,
  messageReactions = {},
  onToggleReaction,
  showEmojiPicker,
  onToggleEmojiPicker,
  onSelectEmoji,
  onNavigateProfile,
  onOpenMedia,
}: ChatMessageItemProps) {
  const isAutoCaption =
    !message.content ||
    message.content.trim() === "" ||
    message.content === "📷 Image" ||
    message.content === "Photo" ||
    message.content === "Image" ||
    message.content === "🎥 Vidéo" ||
    message.content === "Vidéo" ||
    message.content === "Video" ||
    message.content === "🎤 Message vocal" ||
    message.content === "Message vocal" ||
    message.content === message.fileName;

  const hasMedia = Boolean(message.mediaUrl);
  const isAudio = Boolean(
    message.mediaUrl &&
      (message.mediaType === "audio" ||
        message.type === "audio" ||
        message.mediaType?.startsWith("audio/") ||
        (message.duration !== undefined && message.duration !== null && message.duration > 0 && message.type !== "video" && !message.mediaType?.startsWith("video/")) ||
        /\.(mp3|wav|ogg|m4a|aac|opus)$/i.test(message.mediaUrl || message.fileName || "") ||
        ((message.fileName || "").toLowerCase().includes("voice") || (message.fileName || "").toLowerCase().includes("vocal")))
  );
  const isVideo = Boolean(
    message.mediaUrl &&
      !isAudio &&
      (message.mediaType === "video" ||
        message.type === "video" ||
        message.mediaType?.startsWith("video/") ||
        /\.(mp4|mov|mkv|avi|ogv)$/i.test(message.mediaUrl || message.fileName || "") ||
        (/\.webm$/i.test(message.mediaUrl || message.fileName || "") && !message.duration && message.type !== "audio" && !message.mediaType?.startsWith("audio/")))
  );
  const isImage = Boolean(
    message.mediaUrl &&
      !isAudio &&
      !isVideo &&
      (message.mediaType === "image" ||
        message.type === "image" ||
        message.mediaType?.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(message.mediaUrl || message.fileName || ""))
  );
  const isFile = Boolean(hasMedia && !isImage && !isAudio && !isVideo);

  // 15-minute edit window & cannot edit audio, nor media without text
  const isMessageWithinEditWindow = Boolean(
    message.timestamp && Date.now() - new Date(message.timestamp).getTime() <= 15 * 60 * 1000
  );
  const isContentEditable = !isAudio && (!hasMedia || (!isAutoCaption && message.content.trim().length > 0));

  const canEdit = Boolean(
    isCurrentUser &&
    !message.isDeleted &&
    isMessageWithinEditWindow &&
    isContentEditable
  );
  const canDelete = Boolean((isCurrentUser || isModerator) && !message.isDeleted);

  return (
    <div
      id={`message-${message.id}`}
      className={`flex items-end gap-1.5 my-0.5 group transition-colors relative ${
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Sender Avatar (Only on received messages in group chats) */}
      {!isCurrentUser && isGroup && (
        <Avatar
          className={`h-7 w-7 mb-0.5 flex-shrink-0 transition-opacity ${
            message.senderUsername ? "cursor-pointer hover:opacity-80" : "opacity-80"
          }`}
          onClick={() => onNavigateProfile(message.senderUsername, message.sender)}
        >
          <AvatarImage src={message.avatar} />
          <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-[11px]">
            {message.sender?.slice(0, 1).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Main Bubble + Horizontal Quick Actions (Beside the bubble!) */}
      <div
        className={`flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] min-w-0 ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Bubble */}
        <div
          className={`group/bubble relative inline-block transition-all shadow-xs ${
            isDeleting ? "opacity-60 pointer-events-none" : ""
          } ${
            message.isDeleted
              ? "bg-muted/60 text-muted-foreground border border-border/40 rounded-2xl px-3.5 py-2"
              : isCurrentUser
              ? "bg-zinc-700 dark:bg-zinc-700 text-white rounded-2xl rounded-tr-xs px-3 py-1.5 shadow-xs"
              : "bg-card text-card-foreground border border-border/70 rounded-2xl rounded-tl-xs px-3 py-1.5"
          }`}
        >
          {/* Deleting state feedback */}
          {isDeleting ? (
            <p className="italic text-xs flex items-center gap-1.5 py-1 text-muted-foreground">
              <CircleNotch className="h-3.5 w-3.5 animate-spin" />
              Suppression en cours...
            </p>
          ) : message.isDeleted ? (
            <p className="italic text-xs flex items-center gap-1.5 py-0.5">
              <Prohibit className="h-3.5 w-3.5 opacity-60" />
              Ce message a été supprimé
            </p>
          ) : isEditing ? (
            /* Inline Edit Box */
            <div className="space-y-2 min-w-[200px]">
              <input
                value={editingContent}
                onChange={(e) => onChangeEditContent(e.target.value)}
                className="w-full bg-background text-foreground h-8 text-sm px-2 rounded-lg border focus:outline-none"
                maxLength={1000}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSaveEdit();
                  if (e.key === "Escape") onCancelEdit();
                }}
              />
              <div className="flex gap-1.5 justify-end">
                <button
                  type="button"
                  className="h-6 px-2 text-xs rounded-md bg-white text-zinc-900 font-medium hover:bg-white/90"
                  onClick={onSaveEdit}
                >
                  OK
                </button>
                <button
                  type="button"
                  className="h-6 px-2 text-xs rounded-md hover:bg-black/10 text-white"
                  onClick={onCancelEdit}
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Sender Name in Group Chat (only for received messages in group chats) */}
              {!isCurrentUser && isGroup && message.sender && (
                <p
                  className="text-[11px] font-bold text-primary truncate mb-0.5 cursor-pointer hover:underline"
                  onClick={() => onNavigateProfile(message.senderUsername, message.sender)}
                >
                  {message.sender}
                </p>
              )}

              {/* Quoted Message (Reply Preview) - French translation & vector icons */}
              {message.replyTo && (
                <div
                  className={`mb-1.5 px-2.5 py-1 rounded-xl text-xs cursor-pointer transition-colors text-left ${
                    isCurrentUser
                      ? "bg-white/15 hover:bg-white/20 text-white"
                      : "bg-muted/70 hover:bg-muted text-foreground border-l-2 border-primary"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (message.replyTo?.id) {
                      onScrollToMessage?.(String(message.replyTo.id));
                    }
                  }}
                  title="Cliquer pour afficher le message d'origine"
                >
                  <p
                    className={`font-semibold text-[10.5px] truncate ${
                      isCurrentUser ? "text-zinc-200" : "text-primary"
                    }`}
                  >
                    Réponse à @{message.replyTo.author_info?.username || message.replyTo.author_info?.name || "message"}
                  </p>
                  <p className="truncate text-[10.5px] opacity-85 flex items-center gap-1">
                    {message.replyTo.type === "image" ? (
                      <>
                        <Camera className="h-3 w-3 inline flex-shrink-0" /> Photo
                      </>
                    ) : message.replyTo.type === "video" ? (
                      <>
                        <VideoCamera className="h-3 w-3 inline flex-shrink-0" /> Vidéo
                      </>
                    ) : message.replyTo.type === "audio" ? (
                      <>
                        <Microphone className="h-3 w-3 inline flex-shrink-0" /> Message vocal
                      </>
                    ) : (
                      message.replyTo.content || "Pièce jointe"
                    )}
                  </p>
                </div>
              )}

              {/* Media: Image (Cached, Lightbox on click, nested time badge) */}
              {isImage && (
                <div className="rounded-xl overflow-hidden max-w-sm mb-0.5 relative group/img">
                  <CachedImage
                    src={message.mediaUrl!}
                    alt="Photo"
                    className="w-full max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => {
                      if (onOpenMedia) {
                        onOpenMedia(message.mediaUrl!, "image", message.fileName || undefined);
                      } else {
                        window.open(message.mediaUrl!, "_blank");
                      }
                    }}
                  />
                  {/* Nested Time Badge on Image if no text caption */}
                  {isAutoCaption && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums pointer-events-none">
                      <span>{formatMessageTime(message.timestamp)}</span>
                      {isCurrentUser && <StatusCheckmarks status={message.status} />}
                    </div>
                  )}
                </div>
              )}

              {/* Media: Video (Custom player with WhatsApp-style caching & controls) */}
              {isVideo && (
                <CustomVideoPlayer
                  src={message.mediaUrl!}
                  fileName={message.fileName}
                  timestamp={message.timestamp}
                  status={message.status}
                  isCurrentUser={isCurrentUser}
                  isAutoCaption={isAutoCaption}
                  onOpenMedia={onOpenMedia}
                />
              )}

              {/* Media: Audio (Soundwave Player with integrated time) */}
              {isAudio && (
                <SoundwavePlayer
                  src={message.mediaUrl!}
                  duration={message.duration}
                  isCurrentUser={isCurrentUser}
                  timestamp={message.timestamp}
                  status={message.status}
                />
              )}

              {/* Media: File / Document */}
              {isFile && (
                <div
                  className={`flex items-center gap-2.5 p-2 rounded-xl mb-1 min-w-[190px] max-w-sm ${
                    isCurrentUser
                      ? "bg-white/10 text-white"
                      : "bg-muted/50 text-foreground border border-border/40"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isCurrentUser
                        ? "bg-white/20 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="font-medium text-xs truncate">{message.fileName || "Document"}</p>
                    {message.fileSize && (
                      <p className={`text-[10px] ${isCurrentUser ? "text-white/70" : "text-muted-foreground"}`}>
                        {formatFileSize(message.fileSize)}
                      </p>
                    )}
                  </div>
                  <a
                    href={message.mediaUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={message.fileName || true}
                    className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                      isCurrentUser ? "hover:bg-white/20 text-white" : "hover:bg-muted text-muted-foreground"
                    }`}
                    title="Télécharger"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DownloadSimple className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {/* Text Content with WhatsApp-style Inline Bottom-Right Timestamp & Status */}
              {!isAutoCaption && (
                <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-0.5">
                  <p className="leading-relaxed break-words text-[13.5px] whitespace-pre-wrap flex-1 min-w-0">
                    {message.content
                      .split(/(https?:\/\/[^\s]+)/g)
                      .map((part: string, i: number) =>
                        /^https?:\/\//.test(part) ? (
                          <a
                            key={i}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:opacity-80 break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {part}
                          </a>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    {message.isEdited && (
                      <span className="text-[10px] opacity-70 ml-1.5 italic whitespace-nowrap">
                        (modifié)
                      </span>
                    )}
                  </p>

                  {/* Inline Time and Status in bubble */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] tabular-nums select-none flex-shrink-0 self-end ml-auto pl-1 pb-0.5 ${
                      isCurrentUser ? "text-zinc-300/80" : "text-muted-foreground"
                    }`}
                  >
                    <span>{formatMessageTime(message.timestamp)}</span>
                    {isCurrentUser && <StatusCheckmarks status={message.status} />}
                  </span>
                </div>
              )}

              {/* For File without caption: Time & status */}
              {isFile && isAutoCaption && (
                <div
                  className={`flex justify-end items-center gap-1 text-[10px] tabular-nums select-none pt-0.5 ${
                    isCurrentUser ? "text-zinc-300/80" : "text-muted-foreground"
                  }`}
                >
                  <span>{formatMessageTime(message.timestamp)}</span>
                  {isCurrentUser && <StatusCheckmarks status={message.status} />}
                </div>
              )}
            </div>
          )}

          {/* Emoji Reactions Pill nested on bottom edge of bubble */}
          {Object.entries(messageReactions).some(([_, users]) => users.length > 0) && (
            <div
              className={`flex flex-wrap items-center gap-1 mt-1 pt-0.5 border-t ${
                isCurrentUser ? "border-white/15" : "border-border/40"
              }`}
            >
              {Object.entries(messageReactions).map(([emoji, users]) =>
                users.length > 0 ? (
                  <button
                    key={emoji}
                    type="button"
                    className={`text-[11px] rounded-full px-1.5 py-0.2 flex items-center gap-0.5 transition-colors shadow-2xs ${
                      isCurrentUser
                        ? "bg-white/20 text-white hover:bg-white/30"
                        : "bg-muted/80 text-foreground hover:bg-muted"
                    }`}
                    onClick={() => onToggleReaction(message.id, emoji)}
                  >
                    <span>{emoji}</span>
                    <span className="font-semibold text-[9.5px]">{users.length}</span>
                  </button>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Horizontal Quick Actions (Beside the bubble on hover - WhatsApp style!) */}
        {!isEditing && !message.isDeleted && (
          <div
            className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 relative ${
              isCurrentUser ? "mr-0.5" : "ml-0.5"
            }`}
          >
            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Réagir"
              onClick={() => onToggleEmojiPicker(message.id)}
            >
              <Smile className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Répondre"
              onClick={() => onReply?.(message)}
            >
              <ArrowBendUpLeft className="h-4 w-4" />
            </button>

            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Plus d'options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    side="bottom"
                    align={isCurrentUser ? "end" : "start"}
                    className="z-50"
                  >
                    <DropdownMenuItem onClick={() => onReply?.(message)} className="gap-2 text-xs">
                      <ArrowBendUpLeft className="h-3.5 w-3.5" /> Répondre
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onStartEdit(message)} className="gap-2 text-xs">
                        <PencilSimple className="h-3.5 w-3.5" /> Modifier
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(message.id)}
                        className="text-destructive focus:text-destructive gap-2 text-xs"
                      >
                        <Trash className="h-3.5 w-3.5" /> Supprimer
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenu>
            )}

            {/* Quick Emoji Picker Popup on Hover */}
            {showEmojiPicker && (
              <div
                className={`absolute bottom-full mb-1 ${
                  isCurrentUser ? "right-0" : "left-0"
                } flex gap-1 bg-card border rounded-full px-2 py-1 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100`}
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="text-base hover:scale-125 transition-transform"
                    onClick={() => onSelectEmoji(message.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
