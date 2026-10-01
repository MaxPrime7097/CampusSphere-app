/**
 * Event serialisation — API_CONTRACT §2 `<Event>` and `<EventAttendee>`.
 */

import { EventAttendeeStatus, type Prisma, type Event, type EventAttendee } from "@prisma/client";
import { serializeUser, userSelect, type SerializableUser } from "./user.js";

export const eventInclude = {
  organizer: { select: userSelect },
  sphere: {
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      bannerImage: true,
      memberCount: true,
    },
  },
} satisfies Prisma.EventInclude;

export type SerializableEvent = Event & {
  organizer: SerializableUser;
  sphere?: {
    id: number;
    name: string;
    description: string;
    category: string;
    bannerImage: string | null;
    memberCount: number;
  } | null;
};

export interface EventViewerContext {
  viewerId: number | null;
  attendeesCount?: number;
  userStatus?: EventAttendeeStatus | null;
  userAttendee?: {
    status?: EventAttendeeStatus | string;
    ticketCode?: string | null;
    checkedInAt?: Date | null;
  } | null;
}

export function serializeEvent(
  event: SerializableEvent,
  ctx: EventViewerContext = { viewerId: null }
): Record<string, unknown> {
  const { viewerId, attendeesCount = 0, userStatus = null, userAttendee = null } = ctx;

  const startDate = event.startDate.toISOString();
  const endDate = event.endDate ? event.endDate.toISOString() : null;
  const isPast = event.startDate <= new Date();

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category.toLowerCase(),

    organizer: serializeUser(event.organizer, { viewerId }),
    organizer_id: event.organizerId,

    sphere: event.sphere
      ? {
          id: event.sphere.id,
          name: event.sphere.name,
          description: event.sphere.description,
          category: event.sphere.category.toLowerCase(),
          avatar: event.sphere.bannerImage,
          members_count: event.sphere.memberCount,
        }
      : null,
    sphere_id: event.sphereId,

    start_date: startDate,
    startDate,
    end_date: endDate,
    endDate,

    location: event.location,
    is_online: event.isOnline,
    isOnline: event.isOnline,
    online_link: event.onlineLink,
    onlineLink: event.onlineLink,

    cover_image: event.coverImage,
    coverImage: event.coverImage,
    max_attendees: event.maxAttendees,
    maxAttendees: event.maxAttendees,
    is_public: event.isPublic,
    isPublic: event.isPublic,
    is_featured: event.isFeatured,
    isFeatured: event.isFeatured,
    has_ticketing: (event as any).hasTicketing ?? true,
    hasTicketing: (event as any).hasTicketing ?? true,

    attendees_count: attendeesCount,
    attendeesCount,
    user_status: userStatus ? userStatus.toLowerCase() : null,
    userStatus: userStatus ? userStatus.toLowerCase() : null,
    user_ticket_code: userAttendee?.ticketCode || null,
    userTicketCode: userAttendee?.ticketCode || null,
    is_checked_in: userAttendee?.status === EventAttendeeStatus.ATTENDED,
    isCheckedIn: userAttendee?.status === EventAttendeeStatus.ATTENDED,
    checked_in_at: userAttendee?.checkedInAt ? userAttendee.checkedInAt.toISOString() : null,
    is_past: isPast,

    created_at: event.createdAt.toISOString(),
    updated_at: event.updatedAt.toISOString(),
  };
}

export function serializeEventAttendee(
  attendee: EventAttendee & { user: SerializableUser },
  viewerId: number | null = null
): Record<string, unknown> {
  return {
    id: attendee.id,
    event_id: attendee.eventId,
    eventId: attendee.eventId,
    user: serializeUser(attendee.user, { viewerId }),
    status: attendee.status.toLowerCase(),
    ticket_code: attendee.ticketCode,
    ticketCode: attendee.ticketCode,
    checked_in_at: attendee.checkedInAt ? attendee.checkedInAt.toISOString() : null,
    checkedInAt: attendee.checkedInAt ? attendee.checkedInAt.toISOString() : null,
    registered_at: attendee.registeredAt.toISOString(),
    registeredAt: attendee.registeredAt.toISOString(),
  };
}
