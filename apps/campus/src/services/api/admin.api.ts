/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  normalizeUser,
  toNumber,
  unwrapItem,
  unwrapList,
} from "./client";

// ============================================================================
// ADMIN
// ============================================================================

export interface AdminModerationQueueItem {
  id: string;
  title: string;
  type: string;
  subject: string;
  size: string;
  uploadDate: string | null;
  uploader: {
    name: string;
    avatar: string | null;
  };
}

export interface AdminReportedContentItem {
  id: string;
  type: string;
  content: string;
  reason: string;
  date: string | null;
  status: string;
  reporter: {
    name: string;
    avatar: string | null;
  };
}

export interface AdminPermissions {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}

export interface AdminPermissionsPayload {
  role: string | null;
  permissions: AdminPermissions;
}

export interface AdminUserManagementSummary {
  totalUsers: number;
  newUsersToday: number;
  pendingResources: number;
  reportedContent: number;
  activeGroups: number;
  totalResources: number;
}

export type AdminStatsRange = "24h" | "7j" | "30j" | "custom";

export interface AdminKpiStats {
  newUsers: number;
  activeSpheres: number;
  pendingReports: number;
  overdueTasks: number;
  failedNotifications: number;
  range: AdminStatsRange;
  startDate: string | null;
  endDate: string | null;
}

export interface AdminQuickActionResult {
  action: string;
  success: boolean;
  message: string;
}

function mapAdminModerationQueueItem(item: any): AdminModerationQueueItem {
  const uploader = normalizeUser(item?.uploader ?? item?.author ?? item?.uploaded_by ?? item?.uploader_info);
  return {
    id: String(item?.id ?? ""),
    title: item?.title ?? item?.name ?? "Ressource sans titre",
    type: item?.type ?? item?.resource_type ?? "Ressource",
    subject: item?.subject ?? item?.category ?? "Non défini",
    size: item?.size ?? item?.file_size ?? item?.fileSize ?? "—",
    uploadDate: item?.upload_date ?? item?.created_at ?? item?.createdAt ?? null,
    uploader: {
      name: uploader?.name ?? item?.uploader_name ?? "Utilisateur inconnu",
      avatar: uploader?.avatar ?? item?.uploader_avatar ?? null,
    },
  };
}

function mapAdminReportedContentItem(item: any): AdminReportedContentItem {
  const reporter = normalizeUser(item?.reporter ?? item?.reported_by ?? item?.reporter_info);
  return {
    id: String(item?.id ?? ""),
    type: item?.type ?? item?.content_type ?? "Contenu",
    content: item?.content ?? item?.excerpt ?? item?.message ?? "",
    reason: item?.reason ?? item?.report_reason ?? "Non précisé",
    date: item?.date ?? item?.reported_at ?? item?.created_at ?? item?.createdAt ?? null,
    status: item?.status ?? "pending",
    reporter: {
      name: reporter?.name ?? item?.reporter_name ?? "Utilisateur inconnu",
      avatar: reporter?.avatar ?? item?.reporter_avatar ?? null,
    },
  };
}

function mapAdminSummary(summary: any): AdminUserManagementSummary {
  return {
    totalUsers: toNumber(summary?.totalUsers ?? summary?.total_users, 0),
    newUsersToday: toNumber(summary?.newUsersToday ?? summary?.new_users_today, 0),
    pendingResources: toNumber(summary?.pendingResources ?? summary?.pending_resources, 0),
    reportedContent: toNumber(summary?.reportedContent ?? summary?.reported_content, 0),
    activeGroups: toNumber(summary?.activeGroups ?? summary?.active_groups, 0),
    totalResources: toNumber(summary?.totalResources ?? summary?.total_resources, 0),
  };
}

export function mapAdminKpiStats(stats: any): AdminKpiStats {
  return {
    newUsers: toNumber(stats?.newUsers ?? stats?.new_users, 0),
    activeSpheres: toNumber(stats?.activeSpheres ?? stats?.active_spheres, 0),
    pendingReports: toNumber(stats?.pendingReports ?? stats?.pending_reports, 0),
    overdueTasks: toNumber(stats?.overdueTasks ?? stats?.overdue_tasks, 0),
    failedNotifications: toNumber(stats?.failedNotifications ?? stats?.failed_notifications, 0),
    range: (stats?.range as AdminStatsRange) ?? "24h",
    startDate: stats?.startDate ?? stats?.start_date ?? null,
    endDate: stats?.endDate ?? stats?.end_date ?? null,
  };
}

export async function getAdminModerationQueue(token?: string): Promise<AdminModerationQueueItem[]> {
  const response = await apiFetch<any>("api/admin/moderation-queue/", { token: token || getAccessToken() });
  return unwrapList(response).map(mapAdminModerationQueueItem);
}

export async function getAdminReportedContent(token?: string): Promise<AdminReportedContentItem[]> {
  const response = await apiFetch<any>("api/admin/reported-content/", { token: token || getAccessToken() });
  return unwrapList(response).map(mapAdminReportedContentItem);
}

export async function getAdminUserManagementSummary(token?: string): Promise<AdminUserManagementSummary> {
  const response = await apiFetch<any>("api/admin/user-management-summary/", { token: token || getAccessToken() });
  return mapAdminSummary(unwrapItem(response));
}

// Admin V1 endpoints
export async function getAdminUsers(params?: { page?: number; search?: string }, token?: string) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch<any>(`api/admin/v1/users/${suffix}`, { token: token || getAccessToken() });
}

export async function banAdminUsers(ids: string[], token?: string) {
  return apiFetch<any>('api/admin/v1/users/bulk-ban/', {
    method: 'POST',
    body: { ids },
    token: token || getAccessToken(),
  });
}

export async function getAdminSpheres(params?: { page?: number; search?: string }, token?: string) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch<any>(`api/admin/v1/spheres/${suffix}`, { token: token || getAccessToken() });
}

export async function getAdminResources(params?: { page?: number; search?: string }, token?: string) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch<any>(`api/admin/v1/resources/${suffix}`, { token: token || getAccessToken() });
}

export async function deleteAdminResources(ids: string[], token?: string) {
  return apiFetch<any>('api/admin/v1/resources/bulk-delete/', {
    method: 'POST',
    body: { ids },
    token: token || getAccessToken(),
  });
}

export async function getAdminReports(params?: { page?: number; search?: string }, token?: string) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch<any>(`api/admin/v1/reports/${suffix}`, { token: token || getAccessToken() });
}

export async function approveAdminReports(ids: string[], token?: string) {
  return apiFetch<any>('api/admin/v1/reports/bulk-approve/', {
    method: 'POST',
    body: { ids },
    token: token || getAccessToken(),
  });
}

export async function getAdminStats(token?: string) {
  const response = await apiFetch<any>('api/admin/v1/stats/', { token: token || getAccessToken() });
  return unwrapItem<any>(response);
}

export async function getAdminVerificationQueue(params?: { page?: number; search?: string }, token?: string) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch<any>(`api/admin/v1/verification-queue/${suffix}`, { token: token || getAccessToken() });
}

export async function verifyAdminUser(userId: string, isVerified: boolean = true, token?: string) {
  return apiFetch<any>('api/admin/v1/users/verify/', {
    method: 'POST',
    body: { userId, isVerified },
    token: token || getAccessToken(),
  });
}

export async function getAdminLogs(params?: { page?: number; search?: string }, token?: string) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const suffix = q.toString() ? `?${q}` : '';
  return apiFetch<any>(`api/admin/v1/logs/${suffix}`, { token: token || getAccessToken() });
}

export interface AdminAiUsageSummary {
  totalBudget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  weeklyBurnRate: number;
  estimatedWeeksRemaining: number | null;
  totalGenerations: number;
  recentGenerations7d: number;
  model: string;
  safetyThresholdPercent: number;
  safetyThresholdUSD: number;
  isThresholdExceeded: boolean;
  breakdownByTool: Array<{
    toolType: string;
    count: number;
    totalCostUSD: number;
    inputTokens: number;
    outputTokens: number;
  }>;
}

export async function getAdminAiUsageSummary(token?: string): Promise<AdminAiUsageSummary> {
  const response = await apiFetch<any>('api/admin/ai-usage-summary/', { token: token || getAccessToken() });
  return unwrapItem<AdminAiUsageSummary>(response);
}

export interface AdminSpheraStats {
  budget: {
    totalBudget: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    weeklyBurnRate: number;
    estimatedWeeksRemaining: number | null;
    totalBedrockGenerations: number;
    totalGenerationsAllProviders: number;
    model: string;
    safetyThresholdPercent: number;
    safetyThresholdUSD: number;
    isThresholdExceeded: boolean;
  };
  quotas: {
    activeStudentsThisWeek: number;
    saturatedCount: number;
    saturatedPercent: number;
    totalWeeklyGenerations: number;
    avgWeeklyGens: number;
    distribution: Array<{ range: string; count: number }>;
  };
  tools: Array<{
    toolType: string;
    count: number;
    totalCostUSD: number;
    inputTokens: number;
    outputTokens: number;
    averageCostUSD: number;
  }>;
  providers: Array<{
    provider: string;
    count: number;
    totalCostUSD: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
    costUSD: number;
    tokens: number;
  }>;
  demographics: {
    topUniversities: Array<{ name: string; count: number }>;
    topFaculties: Array<{ name: string; count: number }>;
    topStudyYears: Array<{ name: string; count: number }>;
  };
  recentLogs: Array<{
    id: string;
    provider: string;
    toolType: string | null;
    inputTokensEstimate: number;
    outputTokensEstimate: number;
    estimatedCostUSD: number;
    createdAt: string;
  }>;
}

export async function getAdminSpheraStats(token?: string): Promise<AdminSpheraStats> {
  const response = await apiFetch<any>('api/admin/sphera-stats/', { token: token || getAccessToken() });
  return unwrapItem<AdminSpheraStats>(response);
}

export async function getAdminPermissions(token?: string): Promise<AdminPermissionsPayload> {
  const response = await apiFetch<any>("api/admin/permissions/", { token: token || getAccessToken() });
  const payload = unwrapItem<any>(response) || {};

  return {
    role: payload?.role ?? null,
    permissions: {
      view: Boolean(payload?.permissions?.view),
      create: Boolean(payload?.permissions?.create),
      update: Boolean(payload?.permissions?.update),
      delete: Boolean(payload?.permissions?.delete),
      export: Boolean(payload?.permissions?.export),
    },
  };
}
