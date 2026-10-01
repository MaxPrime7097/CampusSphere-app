import {
  getAdminModerationQueue,
  getAdminReportedContent,
  getAdminUserManagementSummary,
  type AdminModerationQueueItem,
  type AdminReportedContentItem,
  type AdminUserManagementSummary,
} from "@/services/api";
import type { ActivityLog, ModerationResource, ReportedContent } from "../types/moderation";
import type { AdminStatSummary } from "../types/users";

export async function fetchAdminSummary(): Promise<AdminStatSummary> {
  const summary: AdminUserManagementSummary = await getAdminUserManagementSummary();
  return summary;
}

export async function fetchModerationQueue(): Promise<ModerationResource[]> {
  const queue: AdminModerationQueueItem[] = await getAdminModerationQueue();
  return queue;
}

export async function fetchReportedContent(): Promise<ReportedContent[]> {
  const reports: AdminReportedContentItem[] = await getAdminReportedContent();
  return reports;
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const summary = await fetchAdminSummary();

  return [
    {
      id: "summary-users",
      actor: "Système",
      action: "Mise à jour KPI utilisateurs",
      target: `${summary.totalUsers} utilisateurs`,
      createdAt: new Date().toISOString(),
      status: "success",
    },
    {
      id: "summary-moderation",
      actor: "Système",
      action: "Vérification modération",
      target: `${summary.pendingResources} ressources en attente`,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      status: summary.pendingResources > 0 ? "warning" : "success",
    },
    {
      id: "summary-reports",
      actor: "Système",
      action: "Analyse signalements",
      target: `${summary.reportedContent} contenus signalés`,
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      status: summary.reportedContent > 0 ? "warning" : "success",
    },
  ];
}
