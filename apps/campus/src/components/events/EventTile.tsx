import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  Check,
  Share2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventCategoryMeta } from "@/constants/eventCategories";
import { registerToEvent, unregisterFromEvent } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import type { Event, AttendeeStatus } from "@/types/events.types";
import { getEventUrl } from "@/lib/utils";

interface EventTileProps {
  event: Event;
  onStatusChange?: (eventId: string | number, newStatus: AttendeeStatus | null) => void;
  onShare?: (event: Event) => void;
  className?: string;
}

export function EventTile({ event, onStatusChange, onShare, className = "" }: EventTileProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [localStatus, setLocalStatus] = useState<AttendeeStatus | null>(event.userStatus || null);
  const [attendeesCount, setAttendeesCount] = useState<number>(Number(event.attendeesCount || 0));

  const meta = getEventCategoryMeta(event.category);
  const startDate = new Date(event.startDate);
  const isPast = startDate < new Date();

  const formattedTime = startDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dayNumber = startDate.getDate();
  const monthName = startDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", "");

  const handleQuickRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPast) return;

    try {
      setIsRegistering(true);
      if (localStatus === "going") {
        await unregisterFromEvent(event.id);
        setLocalStatus(null);
        setAttendeesCount((prev) => Math.max(0, prev - 1));
        onStatusChange?.(event.id, null);
        toast({
          title: "Inscription annulée",
          description: "Vous ne participez plus à cet événement.",
        });
      } else {
        await registerToEvent(event.id, "going");
        setLocalStatus("going");
        setAttendeesCount((prev) => prev + 1);
        onStatusChange?.(event.id, "going");
        toast({
          title: "Inscription confirmée",
          description: `Vous êtes inscrit à "${event.title}".`,
        });
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de mettre à jour votre inscription.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onShare) {
      onShare(event);
    } else {
      navigator.clipboard?.writeText(`${window.location.origin}${getEventUrl(event)}`);
      toast({
        title: "Lien copié !",
        description: "Le lien de l'événement a été copié dans le presse-papier.",
      });
    }
  };

  return (
    <div
      onClick={() => navigate(getEventUrl(event))}
      className={`group flex flex-col cursor-pointer transition-all ${className}`}
    >
      {/* ─── Spotify-style Artwork/Banner (No card border/shadow) ─── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted/60 border border-border/30">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-muted/40 to-muted">
            <Calendar className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Date Badge floating top-left */}
        <div className="absolute top-2.5 left-2.5 rounded-xl bg-background/85 backdrop-blur-md px-2.5 py-1 text-center shadow-xs border border-border/40">
          <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
            {monthName}
          </span>
          <span className="block text-sm font-extrabold text-foreground leading-tight mt-0.5">
            {dayNumber}
          </span>
        </div>

        {/* Category Badge floating top-right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <span className="rounded-lg bg-background/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/40 shadow-xs">
            {meta.shortLabel}
          </span>
        </div>

        {/* Registered status indicator */}
        {localStatus === "going" && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="flex items-center gap-1 rounded-lg bg-emerald-500/90 text-white backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold shadow-xs">
              <Check className="h-3 w-3" /> Inscrit
            </span>
          </div>
        )}
      </div>

      {/* ─── Spotify-style Typography & Metadata (Pure whitespace, no container) ─── */}
      <div className="pt-3 space-y-1.5 min-w-0">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:underline">
          {event.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {formattedTime}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 truncate">
            {event.isOnline ? (
              <>
                <Globe className="h-3 w-3 text-sky-500 shrink-0" />
                <span>En ligne</span>
              </>
            ) : (
              <>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.location || "Campus"}</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{attendeesCount} participant{attendeesCount > 1 ? "s" : ""}</span>
          </span>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-80 group-hover:opacity-100"
              onClick={handleShareClick}
              aria-label="Partager"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>

            {!isPast && (
              <Button
                size="sm"
                variant={localStatus === "going" ? "outline" : "secondary"}
                className={`h-7 px-2 text-[11px] font-medium rounded-lg ${
                  localStatus === "going"
                    ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    : "bg-secondary text-secondary-foreground hover:bg-muted border border-border/50"
                }`}
                onClick={handleQuickRegister}
                disabled={isRegistering}
              >
                {isRegistering ? "..." : localStatus === "going" ? "Inscrit" : "Participer"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
