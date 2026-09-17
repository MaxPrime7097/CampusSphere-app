export type EventCategory =
  | "conference"
  | "hackathon"
  | "party"
  | "competition"
  | "workshop"
  | "other";

export type AttendeeStatus = "interested" | "going" | "attended";

export interface EventOrganizer {
  id: string | number;
  name?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  avatar?: string | null;
  email?: string;
  university?: string;
  faculty?: string;
  isVerified?: boolean;
}

export interface EventSphere {
  id: string | number;
  name: string;
  description?: string;
  avatar?: string | null;
  category?: string;
  membersCount?: number;
}

export interface Event {
  id: string | number;
  title: string;
  description?: string;
  category: EventCategory;
  organizer: EventOrganizer;
  sphere?: EventSphere | null;
  sphereId?: string | number | null;
  startDate: string;
  endDate?: string | null;
  location?: string;
  isOnline: boolean;
  onlineLink?: string | null;
  coverImage?: string | null;
  maxAttendees?: number | null;
  isPublic: boolean;
  isFeatured?: boolean;
  hasTicketing?: boolean;
  attendeesCount: number;
  userStatus?: AttendeeStatus | null;
  userTicketCode?: string | null;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface EventAttendee {
  id: string | number;
  eventId: string | number;
  user: EventOrganizer;
  status: AttendeeStatus;
  ticketCode?: string | null;
  isCheckedIn?: boolean;
  checkedInAt?: string | null;
  registeredAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  startDate: string;
  endDate?: string | null;
  location?: string;
  isOnline?: boolean;
  onlineLink?: string | null;
  coverImage?: string | File | null;
  maxAttendees?: number | null;
  isPublic?: boolean;
  isFeatured?: boolean;
  hasTicketing?: boolean;
  sphereId?: string | number | null;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface EventFilters {
  category?: string;
  upcoming?: boolean | string;
  sphereId?: string | number;
  search?: string;
  timeframe?: "all" | "today" | "this_week" | "this_month" | "past";
}

export interface SpheraEventDraft {
  title: string;
  description: string;
  suggestedSchedule?: string;
  tips?: string[];
  category: EventCategory;
}

export interface CheckInResult {
  success: boolean;
  alreadyCheckedIn: boolean;
  message: string;
  checkedInAt: string;
  attendee: EventAttendee;
}
