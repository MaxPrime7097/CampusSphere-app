import React, { useEffect, useState, useRef } from "react";
import {
  X,
  DownloadSimple,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Play,
  Pause,
  CircleNotch,
  SpeakerHigh,
  SpeakerSimpleSlash,
} from "@phosphor-icons/react";
import { triggerDirectDownload, getCachedMediaUrl } from "@/lib/mediaCache";

function formatAudioTime(sec: number): string {
  if (!isFinite(sec) || isNaN(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function LightboxVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cachedUrl, setCachedUrl] = useState(src);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    void getCachedMediaUrl(src).then((url) => {
      if (isMounted && url) setCachedUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [src]);

  const scheduleHideControls = () => {
    if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 2800);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    scheduleHideControls();
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
      className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-black select-none group"
    >
      <video
        ref={videoRef}
        src={cachedUrl}
        autoPlay
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
        className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain bg-black block cursor-pointer"
      />

      {/* Central Play/Buffering button */}
      {(!isPlaying || isBuffering || showControls) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={togglePlay}
            className="h-16 w-16 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-transform active:scale-95 pointer-events-auto shadow-2xl border border-white/20"
            aria-label={isPlaying ? "Pause" : "Lecture"}
          >
            {isBuffering ? (
              <CircleNotch className="h-8 w-8 animate-spin" weight="bold" />
            ) : isPlaying ? (
              <Pause className="h-7 w-7" weight="fill" />
            ) : (
              <Play className="h-7 w-7 ml-1" weight="fill" />
            )}
          </button>
        </div>
      )}

      {/* Bottom Custom Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-10 flex flex-col gap-2 transition-opacity duration-200 ${
          showControls || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
            className="w-full h-1.5 bg-white/30 hover:bg-white/40 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none transition-all"
          />
        </div>

        {/* Buttons and Time */}
        <div className="flex items-center justify-between text-white text-xs pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? <Pause className="h-4 w-4" weight="fill" /> : <Play className="h-4 w-4" weight="fill" />}
            </button>
            <span className="tabular-nums font-mono opacity-90 text-xs">
              {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMute}
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <SpeakerSimpleSlash className="h-4 w-4" /> : <SpeakerHigh className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | null;
  mediaType?: string | null;
  fileName?: string | null;
}

export function MediaLightbox({
  isOpen,
  onClose,
  mediaUrl,
  mediaType = "image",
  fileName,
}: MediaLightboxProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset zoom on open/close
  useEffect(() => {
    setScale(1);
  }, [isOpen, mediaUrl]);

  if (!isOpen || !mediaUrl) return null;

  const isVideo = mediaType === "video" || mediaUrl.match(/\.(mp4|webm|mov|ogg)$/i);

  const zoomIn = () => setScale((s) => Math.min(s + 0.3, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.3, 0.5));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Bar Controls */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-white/90 min-w-0">
          <p className="text-xs sm:text-sm font-medium truncate max-w-xs sm:max-w-md">
            {fileName || (isVideo ? "Vidéo" : "Photo")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isVideo && (
            <>
              <button
                type="button"
                onClick={zoomOut}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Dézoomer"
                aria-label="Dézoomer"
              >
                <MagnifyingGlassMinus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Zoomer"
                aria-label="Zoomer"
              >
                <MagnifyingGlassPlus className="h-4 w-4" />
              </button>
            </>
          )}

          <button
            type="button"
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            title="Télécharger sur l'appareil"
            aria-label="Télécharger sur l'appareil"
            onClick={(e) => {
              e.stopPropagation();
              void triggerDirectDownload(mediaUrl, fileName || (isVideo ? "video.mp4" : "image.jpg"));
            }}
          >
            <DownloadSimple className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/15 hover:bg-rose-600 text-white flex items-center justify-center transition-colors ml-2"
            title="Fermer (Échap)"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {isVideo ? (
          <LightboxVideoPlayer src={mediaUrl} />
        ) : (
          <img
            src={mediaUrl}
            alt={fileName || "Photo"}
            style={{ transform: `scale(${scale})` }}
            className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl object-contain transition-transform duration-150 cursor-grab active:cursor-grabbing"
            onClick={(e) => {
              e.stopPropagation();
              setScale((s) => (s === 1 ? 1.8 : 1));
            }}
          />
        )}
      </div>
    </div>
  );
}
