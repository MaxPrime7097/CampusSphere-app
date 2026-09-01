/**
 * Events and Attendees routes — mounted at /api/events/.
 *
 * Allows students and campus clubs/spheres to create, discover, and RSVP to
 * campus events (Welcome Week, MathScam, Hackathons, Masterclasses, etc.)
 */

import { Router, type Request } from "express";
import { z } from "zod";
import {
  EventCategory,
  EventAttendeeStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  eventInclude,
  serializeEvent,
  serializeEventAttendee,
  type SerializableEvent,
} from "../serializers/event.js";
import { userSelect } from "../serializers/user.js";
import { ok, created, list, noContent } from "../lib/envelope.js";
import { badRequest, forbidden, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { notifySphereMembersNewEvent } from "../services/eventNotifications.js";

export const eventsRouter: Router = Router();

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const CategorySchema = z.enum([
  "conference",
  "hackathon",
  "party",
  "competition",
  "workshop",
  "other",
]);

const AttendeeStatusSchema = z.enum(["interested", "going", "attended"]);

const CreateEventSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire").max(200),
  description: z.string().optional().default(""),
  category: CategorySchema.default("other"),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z
    .string()
    .or(z.date())
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  location: z.string().optional().default(""),
  isOnline: z.boolean().optional().default(false),
  onlineLink: z.string().url().optional().nullable().or(z.literal("")),
  coverImage: z.string().optional().nullable(),
  maxAttendees: z.number().int().positive().optional().nullable(),
  isPublic: z.boolean().optional().default(true),
  sphereId: z.number().int().positive().optional().nullable(),
});

const UpdateEventSchema = CreateEventSchema.partial();

const RegisterSchema = z.object({
  status: AttendeeStatusSchema.default("going"),
});

// Helper function to resolve category string to Prisma Enum
function toPrismaCategory(cat: string): EventCategory {
  const map: Record<string, EventCategory> = {
    conference: EventCategory.CONFERENCE,
    hackathon: EventCategory.HACKATHON,
    party: EventCategory.PARTY,
    competition: EventCategory.COMPETITION,
    workshop: EventCategory.WORKSHOP,
    other: EventCategory.OTHER,
  };
  return map[cat.toLowerCase()] || EventCategory.OTHER;
}

function toPrismaStatus(status: string): EventAttendeeStatus {
  const map: Record<string, EventAttendeeStatus> = {
    interested: EventAttendeeStatus.INTERESTED,
    going: EventAttendeeStatus.GOING,
    attended: EventAttendeeStatus.ATTENDED,
  };
  return map[status.toLowerCase()] || EventAttendeeStatus.INTERESTED;
}

function idParam(req: Request, name = "id"): number {
  const id = Number(req.params[name]);
  if (!Number.isInteger(id) || id < 1) throw notFound("Événement introuvable.");
  return id;
}

// ── Endpoints ───────────────────────────────────────────────────────────────

/**
 * GET /api/events/mine
 * List events organized or registered by current authenticated user.
 */
eventsRouter.get("/mine", requireAuth, async (req, res) => {
  const user = req.user!;
  const [createdEvents, attendances] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: user.id },
      include: eventInclude,
      orderBy: { startDate: "asc" },
    }),
    prisma.eventAttendee.findMany({
      where: { userId: user.id },
      include: {
        event: {
          include: eventInclude,
        },
      },
      orderBy: { registeredAt: "desc" },
    }),
  ]);

  const createdSerialized = createdEvents.map((e) =>
    serializeEvent(e as unknown as SerializableEvent, {
      viewerId: user.id,
      userStatus: EventAttendeeStatus.GOING,
    })
  );

  const registeredSerialized = attendances.map((a) =>
    serializeEvent(a.event as unknown as SerializableEvent, {
      viewerId: user.id,
      userStatus: a.status,
    })
  );

  res.json({
    success: true,
    data: {
      created: createdSerialized,
      registered: registeredSerialized,
    },
  });
});

/**
 * GET /api/events
 * List all events with optional filters (category, sphereId, upcoming, search, timeframe).
 */
eventsRouter.get("/", async (req, res) => {
  const user = currentUser(req);
  const { category, upcoming, sphereId, sphere_id, search, timeframe } = req.query;

  const where: Prisma.EventWhereInput = {
    isPublic: true,
  };

  if (category && typeof category === "string" && category !== "all") {
    where.category = toPrismaCategory(category);
  }

  const sid = sphereId || sphere_id;
  if (sid && typeof sid === "string") {
    const numSid = Number(sid);
    if (Number.isInteger(numSid)) {
      where.sphereId = numSid;
    }
  }

  const now = new Date();
  if (upcoming === "true") {
    where.startDate = { gte: now };
  }

  if (timeframe === "today") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    where.startDate = { gte: startOfDay, lte: endOfDay };
  } else if (timeframe === "this_week") {
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    where.startDate = { gte: now, lte: nextWeek };
  } else if (timeframe === "this_month") {
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    where.startDate = { gte: now, lte: nextMonth };
  } else if (timeframe === "past") {
    where.startDate = { lt: now };
  }

  if (search && typeof search === "string" && search.trim()) {
    const term = search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { location: { contains: term, mode: "insensitive" } },
    ];
  }

  const events = await prisma.event.findMany({
    where,
    include: eventInclude,
    orderBy: { startDate: "asc" },
  });

  // Fetch viewer attendances in bulk to avoid N+1
  const eventIds = events.map((e) => e.id);
  const [attendeeCounts, userAttendances] = await Promise.all([
    prisma.eventAttendee.groupBy({
      by: ["eventId"],
      where: {
        eventId: { in: eventIds },
        status: { in: ["GOING", "ATTENDED"] },
      },
      _count: { _all: true },
    }),
    user
      ? prisma.eventAttendee.findMany({
          where: {
            eventId: { in: eventIds },
            userId: user.id,
          },
          select: { eventId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const countMap = new Map<number, number>(
    attendeeCounts.map((c) => [c.eventId, c._count._all])
  );
  const statusMap = new Map<number, EventAttendeeStatus>(
    userAttendances.map((a) => [a.eventId, a.status])
  );

  const payload = events.map((event) =>
    serializeEvent(event as unknown as SerializableEvent, {
      viewerId: user?.id ?? null,
      attendeesCount: countMap.get(event.id) ?? 0,
      userStatus: statusMap.get(event.id) ?? null,
    })
  );

  list(res, payload);
});

/**
 * GET /api/events/:id
 * Retrieve details of a single event.
 */
eventsRouter.get("/:id", async (req, res) => {
  const id = idParam(req);
  const user = currentUser(req);

  const event = await prisma.event.findUnique({
    where: { id },
    include: eventInclude,
  });

  if (!event) throw notFound("Événement introuvable.");

  const [attendeesCount, userAttendance] = await Promise.all([
    prisma.eventAttendee.count({
      where: { eventId: id, status: { in: ["GOING", "ATTENDED"] } },
    }),
    user
      ? prisma.eventAttendee.findUnique({
          where: { eventId_userId: { eventId: id, userId: user.id } },
          select: { status: true },
        })
      : Promise.resolve(null),
  ]);

  ok(
    res,
    serializeEvent(event as unknown as SerializableEvent, {
      viewerId: user?.id ?? null,
      attendeesCount,
      userStatus: userAttendance?.status ?? null,
    })
  );
});

/**
 * POST /api/events
 * Create a new event.
 */
eventsRouter.post("/", requireAuth, async (req, res) => {
  const user = req.user!;
  const parsed = CreateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const {
    title,
    description,
    category,
    startDate,
    endDate,
    location,
    isOnline,
    onlineLink,
    coverImage,
    maxAttendees,
    isPublic,
    sphereId,
  } = parsed.data;

  // Validate sphere membership if attached to a sphere
  if (sphereId) {
    const membership = await prisma.sphereMember.findUnique({
      where: { sphereId_userId: { sphereId, userId: user.id } },
    });
    if (!membership && !user.isSuperuser && !user.isStaff) {
      throw forbidden("Vous devez être membre de la sphère pour y créer un événement.");
    }
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      category: toPrismaCategory(category),
      startDate,
      endDate: endDate || null,
      location,
      isOnline,
      onlineLink: onlineLink || null,
      coverImage: coverImage || null,
      maxAttendees: maxAttendees || null,
      isPublic,
      sphereId: sphereId || null,
      organizerId: user.id,
    },
    include: eventInclude,
  });

  // Auto-register organizer as 'GOING'
  await prisma.eventAttendee.create({
    data: {
      eventId: event.id,
      userId: user.id,
      status: EventAttendeeStatus.GOING,
    },
  });

  // Broadcast to sphere members if attached
  if (sphereId) {
    void notifySphereMembersNewEvent(event, event.organizer);
  }

  created(
    res,
    serializeEvent(event as unknown as SerializableEvent, {
      viewerId: user.id,
      attendeesCount: 1,
      userStatus: EventAttendeeStatus.GOING,
    })
  );
});

/**
 * PUT/PATCH /api/events/:id
 * Update an existing event (organizer or staff only).
 */
eventsRouter.put("/:id", requireAuth, async (req, res) => {
  const id = idParam(req);
  const user = req.user!;

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { organizerId: true },
  });

  if (!existing) throw notFound("Événement introuvable.");

  if (existing.organizerId !== user.id && !user.isStaff && !user.isSuperuser) {
    throw forbidden("Seul l'organisateur peut modifier cet événement.");
  }

  const parsed = UpdateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest(parsed.error.errors.map((e) => e.message).join(", "));
  }

  const data: Prisma.EventUpdateInput = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.category !== undefined) data.category = toPrismaCategory(parsed.data.category);
  if (parsed.data.startDate !== undefined) data.startDate = parsed.data.startDate;
  if (parsed.data.endDate !== undefined) data.endDate = parsed.data.endDate;
  if (parsed.data.location !== undefined) data.location = parsed.data.location;
  if (parsed.data.isOnline !== undefined) data.isOnline = parsed.data.isOnline;
  if (parsed.data.onlineLink !== undefined) data.onlineLink = parsed.data.onlineLink;
  if (parsed.data.coverImage !== undefined) data.coverImage = parsed.data.coverImage;
  if (parsed.data.maxAttendees !== undefined) data.maxAttendees = parsed.data.maxAttendees;
  if (parsed.data.isPublic !== undefined) data.isPublic = parsed.data.isPublic;
  if (parsed.data.sphereId !== undefined) {
    data.sphere = parsed.data.sphereId ? { connect: { id: parsed.data.sphereId } } : { disconnect: true };
  }

  const updated = await prisma.event.update({
    where: { id },
    data,
    include: eventInclude,
  });

  const attendeesCount = await prisma.eventAttendee.count({
    where: { eventId: id, status: { in: ["GOING", "ATTENDED"] } },
  });

  ok(
    res,
    serializeEvent(updated as unknown as SerializableEvent, {
      viewerId: user.id,
      attendeesCount,
      userStatus: EventAttendeeStatus.GOING,
    })
  );
});

/**
 * DELETE /api/events/:id
 * Delete an event (organizer or staff only).
 */
eventsRouter.delete("/:id", requireAuth, async (req, res) => {
  const id = idParam(req);
  const user = req.user!;

  const existing = await prisma.event.findUnique({
    where: { id },
    select: { organizerId: true },
  });

  if (!existing) throw notFound("Événement introuvable.");

  if (existing.organizerId !== user.id && !user.isStaff && !user.isSuperuser) {
    throw forbidden("Non autorisé à supprimer cet événement.");
  }

  await prisma.event.delete({ where: { id } });
  noContent(res);
});

/**
 * POST /api/events/:id/register
 * RSVP to an event (interested | going).
 */
eventsRouter.post("/:id/register", requireAuth, async (req, res) => {
  const id = idParam(req);
  const user = req.user!;

  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    throw badRequest("Statut d'inscription invalide.");
  }

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, maxAttendees: true },
  });

  if (!event) throw notFound("Événement introuvable.");

  const status = toPrismaStatus(parsed.data.status);

  // Check capacity if registering as GOING
  if (status === EventAttendeeStatus.GOING && event.maxAttendees) {
    const currentGoingCount = await prisma.eventAttendee.count({
      where: { eventId: id, status: EventAttendeeStatus.GOING },
    });
    if (currentGoingCount >= event.maxAttendees) {
      throw badRequest("Désolé, la capacité maximale de cet événement est atteinte.");
    }
  }

  await prisma.eventAttendee.upsert({
    where: { eventId_userId: { eventId: id, userId: user.id } },
    create: {
      eventId: id,
      userId: user.id,
      status,
    },
    update: {
      status,
    },
  });

  ok(res, { success: true, status: parsed.data.status });
});

/**
 * DELETE /api/events/:id/register
 * Unregister / Cancel RSVP.
 */
eventsRouter.delete("/:id/register", requireAuth, async (req, res) => {
  const id = idParam(req);
  const user = req.user!;

  await prisma.eventAttendee.deleteMany({
    where: {
      eventId: id,
      userId: user.id,
    },
  });

  ok(res, { success: true });
});

/**
 * GET /api/events/:id/attendees
 * List attendees of an event.
 */
eventsRouter.get("/:id/attendees", async (req, res) => {
  const id = idParam(req);
  const user = currentUser(req);

  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId: id },
    include: {
      user: {
        select: userSelect,
      },
    },
    orderBy: { registeredAt: "asc" },
  });

  const payload = attendees.map((a) =>
    serializeEventAttendee(a as any, user?.id ?? null)
  );

  list(res, payload);
});
