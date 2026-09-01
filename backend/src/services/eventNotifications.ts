/**
 * Event Notifications & Reminder Services.
 */

import { NotificationType, type Event } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createNotification } from "./notifications.js";

/**
 * Notifie les membres d'une sphère lors de la création d'un événement lié.
 */
export async function notifySphereMembersNewEvent(
  event: Event,
  organizer: { id: number; username: string; firstName: string; lastName: string; avatar: string | null }
): Promise<void> {
  if (!event.sphereId) return;

  try {
    const sphere = await prisma.sphere.findUnique({
      where: { id: event.sphereId },
      select: { name: true },
    });

    const members = await prisma.sphereMember.findMany({
      where: {
        sphereId: event.sphereId,
        status: "ACTIVE",
        userId: { not: organizer.id },
      },
      select: { userId: true },
    });

    const formattedDate = new Date(event.startDate).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    await Promise.all(
      members.map((m) =>
        createNotification({
          type: NotificationType.NEW_EVENT,
          title: `Nouvel événement : ${event.title}`,
          message: `${organizer.firstName || organizer.username} a publié un événement pour la sphère ${sphere?.name || ""}. Date : ${formattedDate}`,
          recipientId: m.userId,
          sender: organizer,
          data: {
            event_id: String(event.id),
            sphere_id: String(event.sphereId),
            link: `/events/${event.id}`,
          },
        })
      )
    );
  } catch (error) {
    console.error("[eventNotifications] Failed to notify sphere members:", error);
  }
}

/**
 * Rappel automatique 24h avant l'événement.
 * Déclenché par le job scheduler.
 */
export async function sendEventReminders(): Promise<number> {
  const now = new Date();
  const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  try {
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: startWindow,
          lte: endWindow,
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        attendees: {
          where: {
            status: "GOING",
          },
          select: {
            userId: true,
          },
        },
      },
    });

    let sentCount = 0;

    for (const event of upcomingEvents) {
      const formattedTime = new Date(event.startDate).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const attendee of event.attendees) {
        await createNotification({
          type: NotificationType.EVENT_REMINDER,
          title: `Demain : ${event.title} 📅`,
          message: `Rappel pour votre événement de demain à ${formattedTime} (${event.location || "en ligne"}).`,
          recipientId: attendee.userId,
          sender: event.organizer,
          data: {
            event_id: String(event.id),
            link: `/events/${event.id}`,
          },
        });
        sentCount++;
      }
    }

    if (sentCount > 0) {
      console.log(`[eventNotifications] Sent ${sentCount} reminders for ${upcomingEvents.length} events.`);
    }

    return sentCount;
  } catch (error) {
    console.error("[eventNotifications] Error sending event reminders:", error);
    return 0;
  }
}
