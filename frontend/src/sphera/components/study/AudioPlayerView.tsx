import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Download,
  AudioLines,
  ChevronDown,
  ChevronUp,
  Volume2,
  FileText,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AudioContent, DialogueTurn } from "../../types/sphera.types";

interface AudioPlayerViewProps {
  data: AudioContent;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const AudioPlayerView: React.FC<AudioPlayerViewProps> = ({ data }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = data.audioUrl;
  const dialogue: DialogueTurn[] = data.dialogue || [];
  const titre = data.titre || "Résumé audio";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full space-y-6">
      {/* Audio player card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <AudioLines className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Format Podcast · 2 voix
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mt-1">
                {titre}
              </h3>
            </div>
          </div>

          {audioUrl && (
            <a
              href={audioUrl}
              download={`${titre || "resume_audio"}.mp3`}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              Télécharger l'audio
            </a>
          )}
        </div>

        {audioUrl ? (
          <div className="space-y-4 pt-2">
            {/* Scrubber slider */}
            <div className="space-y-1.5">
              <div className="relative w-full flex items-center">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                  style={{
                    background: `linear-gradient(to right, #22C55E ${progressPercent}%, var(--muted) ${progressPercent}%)`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={restartAudio}
                className="text-muted-foreground hover:text-foreground"
                title="Recommencer"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-105 active:scale-95"
                aria-label={isPlaying ? "Pause" : "Lecture"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <div className="w-9 h-9 flex items-center justify-center text-muted-foreground">
                <Volume2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/40 border border-dashed border-border text-center text-sm text-muted-foreground">
            Le fichier audio est en cours de traitement ou la transcription textuelle seule est disponible.
          </div>
        )}
      </div>

      {/* Transcript Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <button
          onClick={() => setShowTranscript((prev) => !prev)}
          className="w-full flex items-center justify-between font-semibold text-base sm:text-lg text-foreground text-left group"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            <span>Transcription intégrale du dialogue</span>
            <span className="text-xs font-normal text-muted-foreground ml-1">
              ({dialogue.length} répliques)
            </span>
          </div>
          <span className="p-1 rounded-md text-muted-foreground group-hover:text-foreground group-hover:bg-muted transition-colors">
            {showTranscript ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </span>
        </button>

        {showTranscript && (
          <div className="mt-6 pt-6 border-t border-border space-y-4 animate-in fade-in duration-300">
            {dialogue.map((turn, i) => {
              const isSpeakerA = turn.speaker?.toUpperCase() === "A";
              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-colors ${
                    isSpeakerA
                      ? "bg-emerald-500/[0.04] border-emerald-500/20"
                      : "bg-blue-500/[0.04] border-blue-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        isSpeakerA
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                      }`}
                    >
                      {isSpeakerA ? "Étudiant A (Tuteur)" : "Étudiant B (Interrogations)"}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-foreground leading-relaxed">
                    {turn.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayerView;
