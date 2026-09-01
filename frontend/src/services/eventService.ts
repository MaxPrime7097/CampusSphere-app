import type {
  Event,
  EventAttendee,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
  AttendeeStatus,
  SpheraEventDraft,
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

/**
 * Sphera AI Assistant — Générateur de description & programme d'événement
 */
export async function generateSpheraEventDraft(
  prompt: string,
  category: EventCategory
): Promise<SpheraEventDraft> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  if (category === "party" || prompt.toLowerCase().includes("welcome")) {
    return {
      category: "party",
      title: "Welcome Ceremony 2026 — Soirée d'Intégration CampusSphere",
      description: `Le rendez-vous incontournable de la rentrée universitaire.\n\nVenez célébrer le début d'une nouvelle année lors de la Welcome Ceremony officielle. Rencontrez d'autres étudiants, découvrez les sphères étudiantes et profitez des animations sur le campus.\n\nPoints forts :\n- Village associatif & présentation des projets étudiants\n- Performances artistiques & DJ set\n- Stand photo & animations connectées CampusSphere\n- Collation d'accueil et rafraîchissements offerts`,
      suggestedSchedule: `18:00 : Accueil & Check-in des participants\n19:00 : Mot de bienvenue & Présentation des sphères\n20:30 : Concerts & Animations interactives\n22:00 : DJ Set`,
      tips: [
        "Carte étudiante ou justificatif recommandé à l'entrée",
        "Invitez vos camarades de promotion via le lien de partage",
        "Retrouvez les temps forts de l'événement sur CampusSphere",
      ],
    };
  }

  if (category === "competition" || prompt.toLowerCase().includes("math")) {
    return {
      category: "competition",
      title: "MathScam 2026 — Le Grand Défi Mathématique & Logique",
      description: `Testez votre intuition mathématique et votre rapidité analytique.\n\nLe MathScam rassemble les passionnés de sciences, de logique et d'algorithmique pour une compétition conviviale et stimulante.\n\nRécompenses & Distinctions :\n- Prix d'Excellence pour les 3 meilleurs scores\n- Badges de reconnaissance sur les profils CampusSphere\n- Opportunités de stages auprès de nos partenaires académiques`,
      suggestedSchedule: `09:30 : Installation & Briefing des règles\n10:00 - 12:00 : Épreuve individuelle (Logique & Calcul)\n14:00 - 16:30 : Épreuve en équipe (Résolution de problèmes complexes)\n17:30 : Cérémonie de remise des prix`,
      tips: [
        "Calculatrice autorisée selon les règles de la session",
        "Équipes de 2 à 3 personnes",
        "Consultez les annales d'entraînement sur l'onglet Ressources",
      ],
    };
  }

  if (category === "hackathon") {
    return {
      category: "hackathon",
      title: "Campus Hackathon 2026 — 48H pour Innover",
      description: `Transformez vos idées en prototypes fonctionnels.\n\nRejoignez des développeurs, designers et chefs de projet pour un sprint d'innovation de 48 heures. Choisissez une thématique (IA, Éducation, Climat, Fintech) et concevez une solution concrète.`,
      suggestedSchedule: `Vendredi 18h : Lancement des sujets & Formation des équipes\nSamedi : Sprint de développement & Sessions de mentorat\nDimanche 14h : Pitchs finaux devant le jury\nDimanche 17h : Annonce des lauréats`,
      tips: [
        "Préparez vos environnements de développement à l'avance",
        "Des mentors seront disponibles pour vous orienter",
      ],
    };
  }

  return {
    category,
    title: prompt ? `Événement : ${prompt}` : "Conférence & Échange Étudiant",
    description: `Rejoignez-nous pour cet événement sur le campus.\n\nUne occasion d'apprendre, de partager vos idées et d'élargir votre réseau universitaire. Des intervenants seront présents pour répondre à vos questions.`,
    suggestedSchedule: `14:00 : Ouverture & Accueil\n14:30 : Conférence principale\n16:00 : Session Q&A et échanges ouverts\n17:00 : Clôture & Networking`,
    tips: [
      "Préparez vos questions pour les intervenants",
      "Places limitées selon la capacité de la salle",
    ],
  };
}
