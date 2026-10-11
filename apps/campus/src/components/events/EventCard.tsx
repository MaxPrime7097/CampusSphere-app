import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, MapPin, Globe, UsersThree as Users, Check, ShareNetwork as Share2, Sparkle as Sparkles, Trophy, Code, Microphone as Mic, BookOpen, Compass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getEventCategoryMeta } from "@/constants/eventCategories";
import { registerToEvent, unregisterFromEvent } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import type { Event, AttendeeStatus } from "@/types/events.types";
import { getEventUrl } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  onStatusChange?: (eventId: string | number, newStatus: AttendeeStatus | null) => void;
  onShare?: (event: Event) => void;
  className?: string;
}

const CategoryIconMap: Record<string, any> = {
  party: Sparkles,
  competition: Trophy,
  hackathon: Code,
  conference: Mic,
  workshop: BookOpen,
  other: Compass,
};

export function EventCard({ event, onStatusChange, onShare, className = "" }: EventCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation("events");
  const [isRegistering, setIsRegistering] = useState(false);
  const [localStatus, setLocalStatus] = useState<AttendeeStatus | null>(event.userStatus || null);
  const [attendeesCount, setAttendeesCount] = useState<number>(Number(event.attendeesCount || 0));

  const meta = getEventCategoryMeta(event.category);
  const dateLocale = i18n.language === "en" ? "en-US" : "fr-FR";
  const startDate = new Date(event.startDate);
  const isPast = startDate < new Date();

  const formattedTime = startDate.toLocaleTimeString(dateLocale, {
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
          title: t("card.toasts.unregistered"),
          description: t("card.toasts.unregisteredDesc"),
        });
      } else {
        await registerToEvent(event.id, "going");
        setLocalStatus("going");
        setAttendeesCount((prev) => prev + 1);
        onStatusChange?.(event.id, "going");
        toast({
          title: t("card.toasts.registered"),
          description: t("card.toasts.registeredDesc", { title: event.title }),
        });
      }
    } catch (err: any) {
      toast({
        title: t("card.toasts.error"),
        description: err?.message || t("card.toasts.errorDesc"),
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
        title: t("card.toasts.linkCopied"),
        description: t("card.toasts.linkCopiedDesc"),
      });
    }
  };

  const dayNumber = startDate.getDate();
  const monthName = startDate.toLocaleDateString(dateLocale, { month: "short" }).toUpperCase().replace(".", "");
  const categoryLabel = t(`categories.${event.category}Short` as any, { defaultValue: meta.shortLabel });

  return (
    <div
      onClick={() => navigate(getEventUrl(event))}
      className={`group flex items-center justify-between gap-3 sm:gap-4 py-4 px-3 sm:px-4 rounded-xl border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer ${className}`}
    >
      {/* Left: Compact Date Badge */}
      <div className="w-12 h-12 rounded-lg bg-muted/60 border border-border/50 flex flex-col items-center justify-center shrink-0 text-center">
        <span className="text-[10px] font-semibold text-muted-foreground leading-none">{monthName}</span>
        <span className="text-base font-bold text-foreground leading-tight">{dayNumber}</span>
      </div>

      {/* Middle: Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm text-foreground truncate group-hover:underline">
            {event.title}
          </h3>
          <Badge variant="muted" size="sm" className="text-[10px] font-normal py-0">
            {categoryLabel}
          </Badge>
          {event.registrationUrl && (
            <Badge variant="outline" size="sm" className="text-[10px] font-normal py-0 border-primary/30 text-primary">
              {t("card.external")}
            </Badge>
          )}
          {localStatus === "going" && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-3 w-3" /> {t("card.registered")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formattedTime}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 truncate max-w-[150px]">
            {event.isOnline ? <Globe className="h-3 w-3 text-sky-500" /> : <MapPin className="h-3 w-3" />}
            {event.isOnline ? t("page.online") : event.location || t("page.campus")}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {attendeesCount}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          onClick={handleShareClick}
          aria-label={t("card.share")}
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {isPast ? (
          <span className="text-xs text-muted-foreground italic px-2">{t("card.finished")}</span>
        ) : localStatus === "going" || localStatus === "attended" ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
            onClick={handleQuickRegister}
            disabled={isRegistering}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            <span>{t("card.registered")}</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-2.5 text-xs bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 font-normal"
            onClick={handleQuickRegister}
            disabled={isRegistering}
          >
            {isRegistering ? "..." : t("card.join")}
          </Button>
        )}
      </div>
    </div>
  );
}
