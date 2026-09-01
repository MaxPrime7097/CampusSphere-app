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
// Initial Mock Data (pour l'aperçu immédiat et cas d'usage IUC Welcome Week / MathScam)
// ─────────────────────────────────────────────────────────────────────────────
const LOCAL_STORAGE_KEY = "campussphere_events_cache_v1";

const INITIAL_MOCK_EVENTS: Event[] = [
  {
    id: "welcome-ceremony-2026",
    title: "Welcome Ceremony — Cérémonie d'Intégration & Soirée IUC 2026",
    description: `Bienvenue à tous les nouveaux arrivants sur le campus de l'IUC ! 🎉\n\nRejoignez-nous pour la grande Welcome Ceremony de rentrée. Au programme :\n- Accueil des nouveaux étudiants et discours d'ouverture\n- Présentation des clubs et des sphères académiques\n- Jeux, DJ sets, animations scéniques et collation offerte\n- Remise des packs de bienvenue CampusSphere !\n\nTenue : Smart casual / Couleurs de votre faculté.`,
    category: "party",
    organizer: {
      id: "org-bde-1",
      name: "BDE Campus IUC",
      firstName: "Kana",
      lastName: "BDE IUC",
      username: "bde_iuc",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      university: "IUC Douala",
      faculty: "Bureau Des Étudiants",
      isVerified: true,
    },
    sphere: {
      id: "sphere-bde",
      name: "Vie Étudiante & BDE IUC",
      category: "Social",
      avatar: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=150&auto=format&fit=crop&q=80",
      membersCount: 342,
    },
    sphereId: "sphere-bde",
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // Dans 3 jours
    endDate: new Date(Date.now() + 1000 * 60 * 60 * (24 * 3 + 6)).toISOString(),
    location: "Grand Amphi & Esplanade Principale, IUC Douala",
    isOnline: false,
    coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    maxAttendees: 500,
    isPublic: true,
    attendeesCount: 184,
    userStatus: "going",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "mathscam-iuc-2026",
    title: "MathScam 2026 — Le Grand Défi Mathématique & Algorithmique",
    description: `Le légendaire MathScam est de retour ! 🏆\n\nÊtes-vous prêts à repousser vos limites analytiques ? Venez concourir seul ou en binôme sur des épreuves de logique, probabilités, calcul différentiel et défis algorithmiques surprises.\n\nLots à gagner :\n🥇 1er Prix : Bourse d'excellence + PC Portable + Accès Sphera Pro à vie\n🥈 2ème Prix : Tablette tactile graphique\n🥉 3ème Prix : Kit objets connectés & goodies exclusifs.\n\nInscrivez-vous vite pour réserver votre place !`,
    category: "competition",
    organizer: {
      id: "org-math-club",
      name: "Club Math & Algorithmique",
      firstName: "Dr. Kamga",
      lastName: "Math Dept",
      username: "kamga_math",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      university: "IUC Douala",
      faculty: "Sciences & Technologies",
      isVerified: true,
    },
    sphere: {
      id: "sphere-math-sciences",
      name: "Sphère Mathématiques & Sciences",
      category: "Académique",
      avatar: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=150&auto=format&fit=crop&q=80",
      membersCount: 189,
    },
    sphereId: "sphere-math-sciences",
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // Dans 7 jours
    endDate: new Date(Date.now() + 1000 * 60 * 60 * (24 * 7 + 4)).toISOString(),
    location: "Salle Informatique B3 & Amphi 100",
    isOnline: false,
    coverImage: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&auto=format&fit=crop&q=80",
    maxAttendees: 80,
    isPublic: true,
    attendeesCount: 62,
    userStatus: "interested",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "hackathon-ai-campus-2026",
    title: "Campus AI Hackathon — 48h pour réinventer l'Éducation",
    description: `Créez la prochaine génération d'outils d'apprentissage propulsés par l'Intelligence Artificielle générative.\n\nMentorat continu par des ingénieurs Google & alumni CampusSphere, pizzas non-stop et jury international. Ouvert à tous les niveaux de code.`,
    category: "hackathon",
    organizer: {
      id: "org-dev-club",
      name: "Google Developer Student Club (GDSC)",
      username: "gdsc_iuc",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      university: "IUC Douala",
      faculty: "Génie Informatique",
      isVerified: true,
    },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * (24 * 16)).toISOString(),
    location: "Campus Lab Tech & Discord Live",
    isOnline: true,
    onlineLink: "https://meet.google.com/campussphere-hackathon",
    coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80",
    maxAttendees: 150,
    isPublic: true,
    attendeesCount: 94,
    userStatus: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "masterclass-ai-prep-2026",
    title: "Masterclass : Réussir ses examens avec l'IA Sphera",
    description: `Découvrez toutes les méthodes pour transformer vos cours en flashcards, quiz d'auto-évaluation et annales corrigées grâce à l'assistant d'étude Sphera. Démo live et session questions/réponses.`,
    category: "workshop",
    organizer: {
      id: "org-sphera-team",
      name: "Équipe Sphera CampusSphere",
      username: "sphera_team",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      university: "CampusSphere Official",
      isVerified: true,
    },
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * (24 * 2 + 2)).toISOString(),
    location: "En ligne via Google Meet",
    isOnline: true,
    onlineLink: "https://meet.google.com/sphera-masterclass",
    coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80",
    maxAttendees: 300,
    isPublic: true,
    attendeesCount: 140,
    userStatus: "going",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

function getStoredEvents(): Event[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Could not read local events cache", err);
  }
  return INITIAL_MOCK_EVENTS;
}

function saveStoredEvents(events: Event[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn("Could not save local events cache", err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Methods
// ─────────────────────────────────────────────────────────────────────────────

export async function getEvents(filters?: EventFilters): Promise<Event[]> {
  try {
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

    const qs = params.toString();
    const result = await apiFetch<Event[]>(`api/events${qs ? `?${qs}` : ""}`);
    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
  } catch {
    // Graceful fallback to client local cache / mock dataset
  }

  let events = getStoredEvents();

  if (filters?.category && filters.category !== "all") {
    events = events.filter((e) => e.category === filters.category);
  }

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(s) ||
        e.description?.toLowerCase().includes(s) ||
        e.location?.toLowerCase().includes(s) ||
        e.organizer.name?.toLowerCase().includes(s)
    );
  }

  if (filters?.sphereId) {
    events = events.filter((e) => String(e.sphereId) === String(filters.sphereId));
  }

  if (filters?.upcoming === true || filters?.upcoming === "true") {
    const now = new Date();
    events = events.filter((e) => new Date(e.startDate) >= now);
  }

  if (filters?.timeframe) {
    const now = new Date();
    if (filters.timeframe === "today") {
      events = events.filter((e) => {
        const d = new Date(e.startDate);
        return d.toDateString() === now.toDateString();
      });
    } else if (filters.timeframe === "this_week") {
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      events = events.filter((e) => {
        const d = new Date(e.startDate);
        return d >= now && d <= nextWeek;
      });
    } else if (filters.timeframe === "this_month") {
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      events = events.filter((e) => {
        const d = new Date(e.startDate);
        return d >= now && d <= nextMonth;
      });
    } else if (filters.timeframe === "past") {
      events = events.filter((e) => new Date(e.startDate) < now);
    }
  }

  // Sort by startDate ascending
  return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export async function getEventById(id: string | number): Promise<Event> {
  try {
    const result = await apiFetch<Event>(`api/events/${id}`);
    if (result && result.id) return result;
  } catch {
    // Fallback to local store
  }

  const events = getStoredEvents();
  const found = events.find((e) => String(e.id) === String(id));
  if (!found) {
    throw new Error("Événement introuvable");
  }
  return found;
}

export async function createEvent(input: CreateEventInput): Promise<Event> {
  let coverImageUrl = typeof input.coverImage === "string" ? input.coverImage : null;

  // If coverImage is a File, handle upload or base64 preview
  if (input.coverImage instanceof File) {
    try {
      const formData = new FormData();
      formData.append("file", input.coverImage);
      const uploadRes = await apiFetch<{ url: string }>("api/uploads/image/", {
        method: "POST",
        body: formData,
      });
      if (uploadRes?.url) {
        coverImageUrl = uploadRes.url;
      }
    } catch {
      coverImageUrl = URL.createObjectURL(input.coverImage);
    }
  }

  const payload = {
    ...input,
    coverImage: coverImageUrl,
  };

  try {
    const result = await apiFetch<Event>("api/events", {
      method: "POST",
      body: payload as any,
    });
    if (result && result.id) return result;
  } catch {
    // Fallback local creation
  }

  const newEvent: Event = {
    id: `event-${Date.now()}`,
    title: input.title,
    description: input.description || "",
    category: input.category,
    organizer: {
      id: "current-user",
      name: "Vous (Organisateur)",
      username: "current_user",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      university: "IUC Douala",
      isVerified: true,
    },
    sphereId: input.sphereId || null,
    startDate: input.startDate,
    endDate: input.endDate || null,
    location: input.location || (input.isOnline ? "En ligne" : "Campus"),
    isOnline: Boolean(input.isOnline),
    onlineLink: input.onlineLink || null,
    coverImage: coverImageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    maxAttendees: input.maxAttendees ? Number(input.maxAttendees) : null,
    isPublic: input.isPublic !== false,
    attendeesCount: 1,
    userStatus: "going",
    createdAt: new Date().toISOString(),
  };

  const currentList = getStoredEvents();
  saveStoredEvents([newEvent, ...currentList]);
  return newEvent;
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

  try {
    const result = await apiFetch<Event>(`api/events/${id}`, {
      method: "PUT",
      body: payload as any,
    });
    if (result && result.id) return result;
  } catch {
    // Fallback local update
  }

  const currentList = getStoredEvents();
  const index = currentList.findIndex((e) => String(e.id) === String(id));
  if (index === -1) throw new Error("Événement introuvable");

  const updated: Event = {
    ...currentList[index],
    ...payload,
    coverImage: coverImageUrl !== undefined ? coverImageUrl : currentList[index].coverImage,
    updatedAt: new Date().toISOString(),
  } as Event;

  currentList[index] = updated;
  saveStoredEvents(currentList);
  return updated;
}

export async function deleteEvent(id: string | number): Promise<boolean> {
  try {
    await apiFetch(`api/events/${id}`, { method: "DELETE" });
    return true;
  } catch {
    // Fallback local delete
  }

  const currentList = getStoredEvents();
  saveStoredEvents(currentList.filter((e) => String(e.id) !== String(id)));
  return true;
}

export async function registerToEvent(
  id: string | number,
  status: AttendeeStatus
): Promise<{ success: boolean; status: AttendeeStatus }> {
  try {
    await apiFetch(`api/events/${id}/register`, {
      method: "POST",
      body: { status },
    });
    return { success: true, status };
  } catch {
    // Fallback local update
  }

  const currentList = getStoredEvents();
  const event = currentList.find((e) => String(e.id) === String(id));
  if (event) {
    const wasGoing = event.userStatus === "going";
    const isNowGoing = status === "going";
    if (!wasGoing && isNowGoing) {
      event.attendeesCount = (event.attendeesCount || 0) + 1;
    } else if (wasGoing && !isNowGoing && event.attendeesCount > 0) {
      event.attendeesCount -= 1;
    }
    event.userStatus = status;
    saveStoredEvents(currentList);
  }
  return { success: true, status };
}

export async function unregisterFromEvent(id: string | number): Promise<boolean> {
  try {
    await apiFetch(`api/events/${id}/register`, { method: "DELETE" });
    return true;
  } catch {
    // Fallback local unregister
  }

  const currentList = getStoredEvents();
  const event = currentList.find((e) => String(e.id) === String(id));
  if (event) {
    if (event.userStatus === "going" && event.attendeesCount > 0) {
      event.attendeesCount -= 1;
    }
    event.userStatus = null;
    saveStoredEvents(currentList);
  }
  return true;
}

export async function getEventAttendees(id: string | number): Promise<EventAttendee[]> {
  try {
    const result = await apiFetch<EventAttendee[]>(`api/events/${id}/attendees`);
    if (Array.isArray(result)) return result;
  } catch {
    // Fallback mock attendees
  }

  return [
    {
      id: "att-1",
      eventId: id,
      status: "going",
      registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      user: {
        id: "u-1",
        name: "Arthur Tsafack",
        firstName: "Arthur",
        lastName: "Tsafack",
        username: "arthur_t",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
        university: "IUC Douala",
        faculty: "Génie Informatique 3",
        isVerified: true,
      },
    },
    {
      id: "att-2",
      eventId: id,
      status: "going",
      registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      user: {
        id: "u-2",
        name: "Brenda Nkodo",
        firstName: "Brenda",
        lastName: "Nkodo",
        username: "brenda_n",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        university: "IUC Douala",
        faculty: "Management & Business",
        isVerified: true,
      },
    },
    {
      id: "att-3",
      eventId: id,
      status: "interested",
      registeredAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      user: {
        id: "u-3",
        name: "Kevin Mbida",
        firstName: "Kevin",
        lastName: "Mbida",
        username: "kevin_m",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        university: "IUC Douala",
        faculty: "Génie Électrique",
        isVerified: false,
      },
    },
  ];
}

export async function getMyEvents(): Promise<{ created: Event[]; registered: Event[] }> {
  try {
    const result = await apiFetch<{ created: Event[]; registered: Event[] }>("api/events/mine");
    if (result && (Array.isArray(result.created) || Array.isArray(result.registered))) {
      return result;
    }
  } catch {
    // Fallback
  }

  const all = getStoredEvents();
  return {
    created: all.filter((e) => e.organizer?.id === "current-user"),
    registered: all.filter((e) => e.userStatus === "going" || e.userStatus === "interested"),
  };
}

/**
 * Sphera AI Assistant — Générateur de description & programme d'événement
 */
export async function generateSpheraEventDraft(
  prompt: string,
  category: EventCategory
): Promise<SpheraEventDraft> {
  // Simulate AI generation with smart prompt matching
  await new Promise((resolve) => setTimeout(resolve, 1200));

  if (category === "party" || prompt.toLowerCase().includes("welcome")) {
    return {
      category: "party",
      title: "Welcome Ceremony 2026 — La Nuit d'Intégration CampusSphere",
      description: `🎉 **Le rendez-vous incontournable de la rentrée !**\n\nVenez célébrer le début d'une nouvelle aventure universitaire lors de la Welcome Ceremony officielle. C'est le moment idéal pour faire des rencontres, découvrir les sphères étudiantes et profiter d'une ambiance électrique.\n\n✨ **Points forts de la soirée :**\n- Village associatif & présentation des projets étudiants\n- Show artistique & DJ set exclusif\n- Stand photo & animations connectées CampusSphere\n- Buffet d'accueil et rafraîchissements offerts`,
      suggestedSchedule: `18:00 : Accueil & Check-in des participants\n19:00 : Mot de bienvenue & Présentation des sphères\n20:30 : Concerts & Animations interactives\n22:00 : DJ Set & Dancefloor`,
      tips: [
        "N'oubliez pas votre carte étudiante ou QR code d'accès",
        "Invitez vos camarades de promotion via le lien de partage",
        "Partagez vos photos sur CampusSphere avec le tag #WelcomeWeek2026",
      ],
    };
  }

  if (category === "competition" || prompt.toLowerCase().includes("math")) {
    return {
      category: "competition",
      title: "MathScam 2026 — Le Grand Défi Mathématique & Logique",
      description: `🧠 **Testez votre intuition mathématique et votre rapidité !**\n\nLe MathScam rassemble les passionnés de sciences, de logique et d'algorithmique pour une compétition intense et conviviale. Relevez les défis posés par les meilleurs professeurs et étudiants de l'université.\n\n🏆 **Récompenses & Distinctions :**\n- Prix d'Excellence pour les 3 meilleurs scores\n- Badges exclusifs sur vos profils CampusSphere\n- Opportunités de stages auprès de nos entreprises partenaires`,
      suggestedSchedule: `09:30 : Installation & Briefing des règles\n10:00 - 12:00 : Épreuve individuelle (Logique & Calcul)\n14:00 - 16:30 : Épreuve en équipe (Résolution de problèmes complexes)\n17:30 : Cérémonie de remise des prix & Cocktail`,
      tips: [
        "Calculatrice non programmable autorisée pour la phase 1",
        "Formez vos équipes de 2 à 3 avant le début de l'épreuve",
        "Consultez les annales d'entraînement disponibles sur l'onglet Ressources",
      ],
    };
  }

  if (category === "hackathon") {
    return {
      category: "hackathon",
      title: "Campus Hackathon 2026 — 48H pour Innover",
      description: `💻 **Transformez vos idées en prototypes fonctionnels !**\n\nRejoignez des développeurs, designers et chefs de projet pour un sprint d'innovation de 48 heures non-stop. Choisissez votre thématique (IA, Éducation, Climat, Fintech) et concevez une solution à fort impact.`,
      suggestedSchedule: `Vendredi 18h : Lancement des sujets & Formation des équipes\nSamedi : Sprint de développement & Sessions de mentorat\nDimanche 14h : Pitchs finaux devant le jury\nDimanche 17h : Délibération & Annonce des vainqueurs`,
      tips: [
        "Préparez vos environnements de dev à l'avance (Git, IDE, API keys)",
        "Des mentors seront disponibles toute la nuit pour vous débloquer",
      ],
    };
  }

  return {
    category,
    title: prompt ? `Événement : ${prompt}` : "Conférence & Échange Étudiant",
    description: `Rejoignez-nous pour cet événement exceptionnel sur le campus.\n\nUne occasion unique d'apprendre, de partager vos idées et d'élargir votre réseau universitaire. Des experts et intervenants seront présents pour répondre à toutes vos questions.`,
    suggestedSchedule: `14:00 : Ouverture & Accueil\n14:30 : Conférence principale\n16:00 : Session Q&A et échanges ouverts\n17:00 : Networking & Clôture`,
    tips: [
      "Préparez vos questions pour les intervenants",
      "Places limitées, inscription obligatoire",
    ],
  };
}
