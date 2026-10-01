import type { Event } from "@/types/events.types";
import { getEventUrl } from "@/lib/utils";
import { UniversalShareModal } from "@/components/shared/UniversalShareModal";

interface EventShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export function EventShareModal({ open, onOpenChange, event }: EventShareModalProps) {
  if (!event) return null;

  const eventUrl = getEventUrl(event);
  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Date à venir";

  return (
    <UniversalShareModal
      open={open}
      onOpenChange={onOpenChange}
      type="event"
      url={eventUrl}
      title={event.title}
      preview={{
        title: event.title,
        description: event.description || "Découvrez et participez à cet événement sur CampusSphere.",
        subtitle: `${formattedDate}${event.location ? ` • ${event.location}` : ""}`,
        badge: event.category || "Événement",
        imageUrl: event.coverImage || null,
      }}
      allowDirectShare={true}
    />
  );
}
