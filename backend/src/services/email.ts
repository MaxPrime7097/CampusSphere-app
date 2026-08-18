/**
 * Transactional email — API_CONTRACT §4.
 *
 * **Django never sent a single one of these.** `EmailNotificationService` rendered
 * `emails/<type>.html` through `render_to_string`, with a fallback to
 * `emails/default_notification.html` — and no `templates/emails/` directory exists
 * anywhere in the tree. Every call raised `TemplateDoesNotExist`, the fallback
 * raised it again, and the outer `except` swallowed it into a log line. The
 * templates are replaced here by inline builders, which cannot go missing.
 *
 * Delivery is **off unless SMTP credentials are configured**. Django's defaults
 * were the literal placeholders `your-email@gmail.com` / `your-app-password`, so
 * nothing was configured to begin with; starting to email real people as a side
 * effect of a backend migration is not a decision this code should make silently.
 * Set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD to turn it on.
 *
 * Sending is best-effort and never blocks a response: callers use `void`, and every
 * failure is logged rather than raised.
 */

import type { NotificationType } from "@prisma/client";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

/**
 * Django shipped the literal placeholders `your-email@gmail.com` and
 * `your-app-password` as defaults. If either was copied into the Render dashboard
 * verbatim, treating it as configuration would mean every send fails against
 * Gmail — so the placeholders count as "unconfigured".
 */
const PLACEHOLDERS = new Set(["your-email@gmail.com", "your-app-password"]);

export const emailEnabled =
  Boolean(env.email.user && env.email.password) &&
  !PLACEHOLDERS.has(env.email.user) &&
  !PLACEHOLDERS.has(env.email.password);

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!emailEnabled) return null;
  transporter ??= nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    // 587 is STARTTLS: connect in clear, upgrade. Only 465 is implicit TLS.
    secure: env.email.port === 465,
    auth: { user: env.email.user, pass: env.email.password },
  });
  return transporter;
}

interface Mail {
  to: string;
  subject: string;
  html: string;
}

/** Strip tags for the text/plain alternative, as Django's strip_tags did. */
function toText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function send(mail: Mail): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.log(`[email] skipped (no SMTP credentials configured): "${mail.subject}" -> ${mail.to}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: env.email.from,
      to: mail.to,
      subject: mail.subject,
      text: toText(mail.html),
      html: mail.html,
    });
    return true;
  } catch (error) {
    console.error(`[email] failed to send "${mail.subject}" to ${mail.to}:`, error);
    return false;
  }
}

// ── Templates ───────────────────────────────────────────────────────────────

const BRAND = "CampusSphere";

function layout(heading: string, body: string, action?: { label: string; url: string }): string {
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:#10b981;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${escapeHtml(action.label)}</a></p>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(heading)}</h1>
    <div style="font-size:15px;line-height:1.6;color:#374151">${body}</div>
    ${button}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">
    <p style="font-size:12px;color:#6b7280;margin:0">
      ${BRAND} · <a href="${escapeHtml(env.frontendUrl)}/settings" style="color:#6b7280">Gérer vos notifications</a>
    </p>
  </div></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Subject line per notification type. Ported from Django's `_prepare_email_content`
 * chain, including the emoji, minus the branch that referenced missing templates.
 */
function subjectFor(type: NotificationType, title: string, data: Record<string, unknown>): string {
  const senderName = String(data.sender_name ?? data.user_name ?? "Quelqu'un");
  switch (type) {
    case "POST_LIKE": return `🎉 ${senderName} a aimé votre post`;
    case "POST_COMMENT": return "💬 Nouveau commentaire sur votre post";
    case "SPHERE_INVITATION": return `🌐 Invitation à rejoindre ${String(data.sphere_name ?? "une sphère")}`;
    case "TASK_ASSIGNED": return `✅ Nouvelle tâche assignée: ${String(data.task_title ?? "Tâche")}`;
    case "CONNECTION_REQUEST": return "🤝 Nouvelle demande de connexion";
    case "MESSAGE": return `💬 Nouveau message de ${senderName}`;
    default: return title;
  }
}

/**
 * Which NotificationSettings flag governs each type.
 *
 * Ported verbatim from Django's `email_settings_map`, including its default of
 * `False` for any type not listed — so `mention_post`, `mention_comment`,
 * `resource_shared` and `verification_status` send no email, as before.
 */
function emailAllowed(
  type: NotificationType,
  settings: {
    emailPostLikes: boolean;
    emailPostComments: boolean;
    emailSphereInvitations: boolean;
    emailTaskAssignments: boolean;
    emailMessages: boolean;
    systemUpdates: boolean;
  },
): boolean {
  switch (type) {
    case "POST_LIKE": return settings.emailPostLikes;
    case "POST_COMMENT":
    case "COMMENT_REPLY": return settings.emailPostComments;
    case "SPHERE_INVITATION":
    case "SPHERE_JOIN_REQUEST": return settings.emailSphereInvitations;
    case "TASK_ASSIGNED":
    case "TASK_COMPLETED": return settings.emailTaskAssignments;
    case "CONNECTION_REQUEST":
    case "CONNECTION_ACCEPTED":
    case "MESSAGE": return settings.emailMessages;
    case "SYSTEM": return settings.systemUpdates;
    default: return false;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Email a notification to its recipient, subject to their settings.
 *
 * Resolves to false — never rejects — when the user opted out, has no address, or
 * SMTP is unconfigured.
 */
export async function sendNotificationEmail(notificationId: number): Promise<boolean> {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: {
      recipient: {
        select: { email: true, firstName: true, notificationSetting: true },
      },
    },
  });
  if (!notification?.recipient.email) return false;

  // Django created default settings on the fly here; the same default set is used
  // rather than writing a row as a side effect of sending mail.
  const settings = notification.recipient.notificationSetting ?? {
    emailPostLikes: true,
    emailPostComments: true,
    emailSphereInvitations: true,
    emailTaskAssignments: true,
    emailMessages: true,
    systemUpdates: true,
  };
  if (!emailAllowed(notification.type, settings)) return false;

  const data = (notification.data ?? {}) as Record<string, unknown>;
  return send({
    to: notification.recipient.email,
    subject: subjectFor(notification.type, notification.title, data),
    html: layout(notification.title, `<p>${escapeHtml(notification.message)}</p>`, {
      label: "Ouvrir CampusSphere",
      url: env.frontendUrl,
    }),
  });
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
  return send({
    to,
    subject: `🎉 Bienvenue sur ${BRAND}!`,
    html: layout(
      `Bienvenue, ${escapeHtml(firstName)} !`,
      `<p>Votre compte ${BRAND} est prêt. Rejoignez des sphères, partagez des ressources et travaillez avec votre campus.</p>`,
      { label: "Commencer", url: env.frontendUrl },
    ),
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<boolean> {
  return send({
    to,
    subject: `🔐 Réinitialisation de votre mot de passe ${BRAND}`,
    html: layout(
      "Réinitialisation du mot de passe",
      "<p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>",
      { label: "Réinitialiser", url: resetLink },
    ),
  });
}
