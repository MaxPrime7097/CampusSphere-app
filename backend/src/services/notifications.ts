/**
 * Notification creation — API_CONTRACT §3.8.
 *
 * Separated from the notification routes so producing domains (connections,
 * posts, tasks, messaging) can emit without depending on the read API.
 *
 * The canonical type set is the Prisma `NotificationType` enum: 15 values
 * reconciling three lists that had drifted apart. Django emitted
 * `message_received` where both enums declared `message`, and `verification_status`
 * where neither declared anything — using the enum makes that class of drift a
 * compile error.
 */

import { NotificationType, type Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { publishNotification } from "../realtime/hub.js";
import { sendNotificationEmail } from "./email.js";

export interface NotificationSender {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  recipientId: number;
  data?: Prisma.InputJsonObject;
  sender?: NotificationSender | null;
}

/**
 * Create an in-app notification.
 *
 * Returns null when sender and recipient are the same user — nobody is notified of
 * their own action. Never throws: a notification failure must not roll back the
 * action that triggered it.
 */
export async function createNotification(input: CreateNotificationInput): Promise<{ id: number } | null> {
  const { type, title, message, recipientId, sender } = input;

  if (sender && sender.id === recipientId) return null;

  // Built as a mutable record because Prisma.InputJsonObject's index signature is
  // read-only; cast back at the call boundary.
  const data: Record<string, unknown> = { ...(input.data ?? {}) };
  if (sender) {
    data.sender_id = String(sender.id);
    data.sender_name = `${sender.firstName} ${sender.lastName}`.trim() || sender.username;
    data.sender_username = sender.username;
    data.sender_avatar = sender.avatar;
  }

  try {
    const created = await prisma.notification.create({
      data: { type, title, message, recipientId, data: data as Prisma.InputJsonObject },
      select: { id: true, createdAt: true },
    });

    /**
     * Push to the recipient's /ws/notifications/ socket, wherever they are
     * connected. The frame is the notification object itself — AppLayout reads
     * `data.title` and `data.message` straight off the parsed frame, matching what
     * Django's NotificationConsumer sent.
     *
     * `type` goes out lowercase: the enum is uppercase in Postgres, but every
     * client compares against the lowercase wire values in notificationTypes.ts.
     */
    publishNotification(recipientId, {
      id: String(created.id),
      type: type.toLowerCase(),
      title,
      message,
      data,
      created_at: created.createdAt.toISOString(),
      is_read: false,
    });

    // Best-effort, deliberately not awaited: API_CONTRACT §4 requires that email
    // never delay the response that produced the notification.
    void sendNotificationEmail(created.id).catch((error: unknown) => {
      console.error("[notifications] email delivery failed", error);
    });

    return { id: created.id };
  } catch (error) {
    console.error("[notifications] failed to create notification", error);
    return null;
  }
}

export async function notifyConnectionRequested(
  requester: NotificationSender,
  recipientId: number,
  connectionId: number,
): Promise<void> {
  await createNotification({
    type: NotificationType.CONNECTION_REQUEST,
    title: "Nouvelle demande de connexion",
    message: `${requester.firstName} ${requester.lastName}`.trim() + " souhaite se connecter avec vous",
    recipientId,
    sender: requester,
    data: { connection_id: String(connectionId), requester_id: String(requester.id) },
  });
}

/**
 * Verification outcome.
 *
 * Django emitted this type from `create_verification_notification` but never
 * declared it in either NOTIFICATION_TYPES list — the row was written with a
 * `type` no client had a label for. It is now a first-class enum member.
 */
export async function notifyVerificationStatus(recipientId: number, approved: boolean): Promise<void> {
  await createNotification({
    type: NotificationType.VERIFICATION_STATUS,
    title: approved ? "Profil certifié" : "Vérification en cours",
    message: approved
      ? "Ton statut étudiant a été vérifié. Ton profil est maintenant certifié."
      : "Ta demande de certification est en cours de traitement.",
    recipientId,
    data: { verified: String(approved) },
  });
}

export async function notifyConnectionAccepted(
  accepter: NotificationSender,
  requesterId: number,
  connectionId: number,
): Promise<void> {
  await createNotification({
    type: NotificationType.CONNECTION_ACCEPTED,
    title: "Connexion acceptée",
    message: `${accepter.firstName} ${accepter.lastName}`.trim() + " a accepté votre demande de connexion",
    recipientId: requesterId,
    sender: accepter,
    data: { connection_id: String(connectionId), recipient_id: String(accepter.id) },
  });
}
