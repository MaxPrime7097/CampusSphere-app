import type { Event } from "@/types/events.types";
import { getEventUrl } from "@/lib/utils";
import { UniversalShareModal } from "@/components/shared/UniversalShareModal";
import { useTranslation } from "react-i18next";

interface EventShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export function EventShareModal({ open, onOpenChange, event }: EventShareModalProps) {
  const { t, i18n } = useTranslation("events");
  if (!event) return null;

  const eventUrl = getEventUrl(event);
  const formattedDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <UniversalShareModal
      open={open}
      onOpenChange={onOpenChange}
      type="event"
      url={eventUrl}
      title={event.title}
      preview={{
        title: event.title,
        description: event.description || t("detail.sharePreviewText"),
        subtitle: `${formattedDate}${event.location ? ` • ${event.location}` : ""}`,
        badge: t(`categories.${event.category}Short` as any, { defaultValue: event.category }),
        imageUrl: event.coverImage || null,
      }}
      allowDirectShare={true}
    />
  );
}
