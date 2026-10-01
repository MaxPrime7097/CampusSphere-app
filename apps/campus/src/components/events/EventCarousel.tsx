import { useRef } from "react";
import { EventTile } from "./EventTile";
import type { Event, AttendeeStatus } from "@/types/events.types";

interface EventCarouselProps {
  title: string;
  subtitle?: string;
  events: Event[];
  onStatusChange?: (eventId: string | number, newStatus: AttendeeStatus | null) => void;
  onShare?: (event: Event) => void;
  className?: string;
}

export function EventCarousel({
  title,
  subtitle,
  events,
  onStatusChange,
  onShare,
  className = "",
}: EventCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (events.length === 0) return null;

  return (
    <section className={`space-y-3 ${className}`}>
      {/* Header with Title (Clean without cluttering arrow buttons) */}
      <div className="pb-1 px-1">
        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Spotify-style Horizontal Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="w-[260px] sm:w-[280px] shrink-0 snap-start"
          >
            <EventTile
              event={event}
              onStatusChange={onStatusChange}
              onShare={onShare}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
