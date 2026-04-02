import { useEffect, useState } from "react";
import { fetchActivityLogs, fetchAdminSummary, fetchModerationQueue, fetchReportedContent } from "../services/adminService";
import type { ActivityLog, ModerationResource, ReportedContent } from "../types/moderation";
import type { AdminStatSummary } from "../types/users";

interface LoadableState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

function useAsyncData<T>(loader: () => Promise<T>, initialValue: T, fallbackError: string): LoadableState<T> {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await loader();
        if (isMounted) setData(result);
      } catch (err: unknown) {
        if (isMounted) setError(getErrorMessage(err, fallbackError));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loader, fallbackError]);

  return { data, loading, error };
}

export function useAdminSummary() {
  return useAsyncData<AdminStatSummary>(fetchAdminSummary, {
    totalUsers: 0,
    newUsersToday: 0,
    activeGroups: 0,
    totalResources: 0,
    pendingResources: 0,
    reportedContent: 0,
  }, "Impossible de charger les statistiques admin.");
}

export function useModerationQueue() {
  return useAsyncData<ModerationResource[]>(fetchModerationQueue, [], "Impossible de charger la file de modération.");
}

export function useReportedContent() {
  return useAsyncData<ReportedContent[]>(fetchReportedContent, [], "Impossible de charger les contenus signalés.");
}

export function useActivityLogs() {
  return useAsyncData<ActivityLog[]>(fetchActivityLogs, [], "Impossible de charger les logs d'activité.");
}
