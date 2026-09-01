import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  Check,
  Share2,
  Sparkles,
  Trophy,
  Code,
  Mic,
  BookOpen,
  Compass,
  ArrowRight,
  Ticket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getEventCategoryMeta } from "@/constants/eventCategories";
import { registerToEvent, unregisterFromEvent } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import type { Event, AttendeeStatus } from "@/types/events.types";

interface EventCardProps {
  event: Event;
  onStatusChange?: (eventId: string | number, newStatus: AttendeeStatus | null) => void;
  onShare?: (event: Event) => void;
}

const CategoryIconMap: Record<string, any> = {
  party: Sparkles,
  competition: Trophy,
  hackathon: Code,
  conference: Mic,
  workshop: BookOpen,
  other: Compass,
};

export function EventCard({ event, onStatusChange, onShare }: EventCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [localStatus, setLocalStatus] = useState<AttendeeStatus | null | undefined>(event.userStatus);
  const [attendeesCount, setAttendeesCount] = useState(event.attendeesCount || 0);

  const meta = getEventCategoryMeta(event.category);
  const IconComponent = CategoryIconMap[event.category] || Calendar;

  const startDate = new Date(event.startDate);
  const isPast = startDate < new Date();

  const formattedDate = startDate.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const formattedTime = startDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

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
      navigator.clipboard?.writeText(`${window.location.origin}/events/${event.id}`);
      toast({
        title: "Lien copié !",
        description: "Le lien de l'événement a été copié dans le presse-papier.",
      });
    }
  };

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl cursor-pointer"
    >
      {/* Top Banner / Image */}
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${meta.gradient} opacity-85 flex items-center justify-center`}>
            <IconComponent className="h-16 w-16 text-white/40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Category Badge */}
        <div className="absolute left-3 top-3">
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 backdrop-blur-md bg-background/90 text-foreground font-semibold px-2.5 py-1 text-xs shadow-sm border border-border/40"
          >
            <IconComponent className="h-3.5 w-3.5 text-primary" />
            <span>{meta.shortLabel}</span>
          </Badge>
        </div>

        {/* Share Button */}
        <div className="absolute right-3 top-3">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background text-foreground shadow-sm"
            onClick={handleShareClick}
            aria-label="Partager"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Date Ribbon on Cover */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
          <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Calendar className="h-3.5 w-3.5 text-orange-400" />
            <span className="capitalize">{formattedDate}</span>
            <span className="opacity-60">•</span>
            <Clock className="h-3 w-3 text-orange-400" />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Status Indicator if user registered */}
        {localStatus === "going" && (
          <div className="absolute bottom-3 right-3">
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-0.5 shadow-md backdrop-blur-sm">
              <Check className="h-3 w-3" /> Inscrit
            </span>
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {event.title}
        </h3>

        {/* Description snippet */}
        {event.description && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
            {event.description.replace(/[#*`_]/g, "")}
          </p>
        )}

        {/* Location & Sphere */}
        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {event.isOnline ? (
              <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            ) : (
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            )}
            <span className="truncate font-medium">
              {event.isOnline ? "En ligne" : event.location || "Campus IUC Douala"}
            </span>
          </div>

          {event.sphere && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
              <span className="truncate">Sphère : <strong className="text-foreground">{event.sphere.name}</strong></span>
            </div>
          )}
        </div>

        {/* Footer info: Organizer & Attendees & Action */}
        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
          {/* Organizer */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 border border-border">
              <AvatarImage src={event.organizer.avatar || undefined} />
              <AvatarFallback className="text-[9px] font-bold">
                {event.organizer.name?.slice(0, 2).toUpperCase() || "EV"}
              </AvatarFallback>
            </Avatar>
            <div className="truncate text-xs">
              <span className="text-muted-foreground block truncate">
                {event.organizer.name || event.organizer.username}
              </span>
            </div>
          </div>

          {/* Attendees count */}
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>{attendeesCount}</span>
            {event.maxAttendees && (
              <span className="text-muted-foreground/60 text-[10px]">/{event.maxAttendees}</span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3 flex gap-2">
          {isPast ? (
            <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground" disabled>
              Événement terminé
            </Button>
          ) : localStatus === "going" || localStatus === "attended" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold text-xs"
                onClick={handleQuickRegister}
                disabled={isRegistering}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                {isRegistering ? "Mise à jour..." : "Inscrit (Gérer)"}
              </Button>
              <Button size="icon" variant="outline" className="shrink-0">
                <Ticket className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all"
              onClick={handleQuickRegister}
              disabled={isRegistering}
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              {isRegistering ? "Inscription..." : "Je participe"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
