import type {
  Event,
  EventAttendee,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
  AttendeeStatus,
  EventCategory,
} from "@/types/events.types";

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { hostname } = window.location;
  if (hostname === "www.campussphere.app" || hostname === "campussphere.app") {
    return "https://api.campussphere.app";
  }
  if (hostname.includes("onrender.com") && !hostname.includes("-backend")) {
    return "https://campus-sphere-backend-dyfu.onrender.com";
  }
  return "http://127.0.0.1:3000";
};

const API_BASE = getApiBaseUrl();

function getToken(): string | undefined {
  try {
    return localStorage.getItem("access") || undefined;
  } catch {
    return undefined;
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown> | FormData;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  const url = `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson?.error || errJson?.detail || errJson?.message || `Erreur ${res.status}`;
      throw new Error(msg);
    }
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erreur ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const json = await res.json();
    return (json?.data !== undefined ? json.data : json) as T;
  }
  return res.text() as unknown as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Methods
// ─────────────────────────────────────────────────────────────────────────────

export async function getEvents(filters?: EventFilters): Promise<Event[]> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== "all") {
    params.append("category", filters.category);
  }
  if (filters?.upcoming) {
    params.append("upcoming", "true");
  }
  if (filters?.sphereId) {
    params.append("sphereId", String(filters.sphereId));
  }
  if (filters?.search) {
    params.append("search", filters.search);
  }
  if (filters?.timeframe && filters.timeframe !== "all") {
    params.append("timeframe", filters.timeframe);
  }

  const qs = params.toString();
  const result = await apiFetch<Event[]>(`api/events${qs ? `?${qs}` : ""}`);
  return Array.isArray(result) ? result : [];
}

export async function getEventById(id: string | number): Promise<Event> {
  return await apiFetch<Event>(`api/events/${id}`);
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  let coverImageUrl = typeof input.coverImage === "string" ? input.coverImage : null;

  if (input.coverImage instanceof File) {
    try {
      const formData = new FormData();
      formData.append("file", input.coverImage);
      formData.append("type", "cover");
      const uploadRes = await apiFetch<{ url?: string; file_url?: string; file?: string }>("api/upload/", {
        method: "POST",
        body: formData,
      });
      const returnedUrl = uploadRes?.url || uploadRes?.file_url || uploadRes?.file;
      if (returnedUrl) {
        coverImageUrl = returnedUrl;
      }
    } catch {
      coverImageUrl = URL.createObjectURL(input.coverImage);
    }
  }

  const payload = {
    ...input,
    coverImage: coverImageUrl,
  };

  return await apiFetch<Event>("api/events", {
    method: "POST",
    body: payload as any,
  });
}

export async function updateEvent(id: string | number, input: UpdateEventInput): Promise<Event> {
  let coverImageUrl = typeof input.coverImage === "string" ? input.coverImage : undefined;

  if (input.coverImage instanceof File) {
    coverImageUrl = URL.createObjectURL(input.coverImage);
  }

  const payload = {
    ...input,
    ...(coverImageUrl !== undefined ? { coverImage: coverImageUrl } : {}),
  };

  return await apiFetch<Event>(`api/events/${id}`, {
    method: "PUT",
    body: payload as any,
  });
}

export async function deleteEvent(id: string | number): Promise<boolean> {
  await apiFetch(`api/events/${id}`, { method: "DELETE" });
  return true;
}

export async function registerToEvent(
  id: string | number,
  status: AttendeeStatus
): Promise<{ success: boolean; status: AttendeeStatus; ticketCode?: string }> {
  const res = await apiFetch<{ success: boolean; status: AttendeeStatus; ticketCode?: string; ticket_code?: string }>(`api/events/${id}/register`, {
    method: "POST",
    body: { status },
  });
  return {
    success: true,
    status,
    ticketCode: res?.ticketCode || res?.ticket_code,
  };
}

export async function unregisterFromEvent(id: string | number): Promise<boolean> {
  await apiFetch(`api/events/${id}/register`, { method: "DELETE" });
  return true;
}

export async function getEventAttendees(id: string | number): Promise<EventAttendee[]> {
  const result = await apiFetch<EventAttendee[]>(`api/events/${id}/attendees`);
  return Array.isArray(result) ? result : [];
}

export async function checkInAttendee(
  eventId: string | number,
  ticketCodeOrUserId: string | number
): Promise<{ success: boolean; alreadyCheckedIn: boolean; message: string; attendee: EventAttendee }> {
  const isCode = typeof ticketCodeOrUserId === "string" && ticketCodeOrUserId.startsWith("CS-EVT-");
  const payload = isCode ? { ticketCode: ticketCodeOrUserId } : { userId: Number(ticketCodeOrUserId) };

  return await apiFetch<{
    success: boolean;
    alreadyCheckedIn: boolean;
    message: string;
    attendee: EventAttendee;
  }>(`api/events/${eventId}/check-in`, {
    method: "POST",
    body: payload as any,
  });
}

export async function exportAttendeesCsv(eventId: string | number, eventTitle?: string): Promise<void> {
  const token = getToken();
  const url = `${API_BASE.replace(/\/$/, "")}/api/events/${eventId}/attendees/export`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Erreur lors du téléchargement du fichier.");
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `participants-event-${eventId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}

export async function getMyEvents(): Promise<{ created: Event[]; registered: Event[] }> {
  const result = await apiFetch<{ created: Event[]; registered: Event[] }>("api/events/mine");
  return result || { created: [], registered: [] };
}

