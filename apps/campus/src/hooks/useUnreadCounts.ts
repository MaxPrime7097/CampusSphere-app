import { useEffect, useState } from "react";
import { listNotifications, getUserConversations } from "@/services/api";

interface UnreadCounts {
  notifications: number;
  messages: number;
}

const globalCounts: UnreadCounts = { notifications: 0, messages: 0 };
const listeners = new Set<(c: UnreadCounts) => void>();

function notify() {
  listeners.forEach((fn) => fn({ ...globalCounts }));
}

async function fetchCounts() {
  try {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    const [notifs, convs] = await Promise.allSettled([
      listNotifications(),
      getUserConversations(),
    ]);
    if (notifs.status === "fulfilled") {
      globalCounts.notifications = (notifs.value || []).filter((n: any) => !n.is_read && !n.read).length;
    }
    if (convs.status === "fulfilled") {
      globalCounts.messages = (convs.value || []).reduce((sum: number, c: any) => sum + Number(c.unread_count || c.unreadCount || 0), 0);
    }
    notify();
  } catch { /* ignore */ }
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startUnreadPolling() {
  void fetchCounts();
  if (!pollInterval) {
    pollInterval = setInterval(() => void fetchCounts(), 45000);
  }
}

export function stopUnreadPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

export function refreshCounts() {
  void fetchCounts();
}

export function useUnreadCounts(): UnreadCounts {
  const [counts, setCounts] = useState<UnreadCounts>({ ...globalCounts });

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) return;
    
    listeners.add(setCounts);
    startUnreadPolling();
    return () => { 
      listeners.delete(setCounts); 
    };
  }, []);

  return counts;
}
