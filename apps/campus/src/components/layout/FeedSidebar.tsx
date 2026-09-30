import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Users,
  BadgeCheck,
  FileText,
  BookOpen,
  FileCode,
  GraduationCap,
  Sparkles,
  Archive,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listResources,
  listSpheres,
  searchUsers,
  getUserConnections,
  createConnection,
} from "@/services/api";
import { getEvents } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/date";
import { getSphereCategoryLabel } from "@/constants/sphereCategories";
import {
  getResourceTypeLabel,
  getSubjectLabel,
  normalizeResourceType,
  normalizeSubject,
} from "@/lib/resourceMetadata";
import { cn, formatSlugToLabel } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const RESOURCE_TYPE_STYLES: Record<string, { icon: string; bg: string }> = {
  notes: { icon: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  resumes: { icon: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20" },
  exercises: { icon: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  exam_papers: { icon: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  annales: { icon: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  projects: { icon: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  presentations: { icon: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
  other: { icon: "text-muted-foreground", bg: "bg-muted/30 border-border/40" },
};

function getResourceStyle(type?: string) {
  if (!type) return RESOURCE_TYPE_STYLES.other;
  return RESOURCE_TYPE_STYLES[type.toLowerCase()] || RESOURCE_TYPE_STYLES.other;
}

function getResourceIcon(type?: string, className = "h-4 w-4") {
  const key = (type || "").toLowerCase();
  switch (key) {
    case "notes":
      return <BookOpen className={className} />;
    case "resumes":
      return <FileText className={className} />;
    case "exercises":
      return <FileCode className={className} />;
    case "exam_papers":
      return <GraduationCap className={className} />;
    case "annales":
      return <Sparkles className={className} />;
    case "projects":
      return <Archive className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export function FeedSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const appVersion = import.meta.env.VITE_APP_VERSION || "2.0.0";

  const [connectedUserIds, setConnectedUserIds] = useState<Set<string>>(new Set());
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);

  // Spheres query
  const spheresQuery = useQuery({
    queryKey: ["sidebar", "popular-spheres"],
    queryFn: () => listSpheres(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (spheres) =>
      [...(Array.isArray(spheres) ? spheres : [])]
        .sort((a: any, b: any) => Number(b.memberCount || 0) - Number(a.memberCount || 0))
        .slice(0, 3),
  });

  // Upcoming Events query with fallback to recent events
  const eventsQuery = useQuery({
    queryKey: ["sidebar", "upcoming-events"],
    queryFn: async () => {
      try {
        const events = await getEvents({ upcoming: true });
        if (Array.isArray(events) && events.length > 0) {
          const future = events.filter((e) => new Date(e.startDate) >= new Date());
          if (future.length > 0) return future.slice(0, 2);
          return events.slice(0, 2);
        }
        const allEvents = await getEvents();
        return Array.isArray(allEvents) ? allEvents.slice(0, 2) : [];
      } catch {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Connection Suggestions query
  const suggestionsQuery = useQuery({
    queryKey: ["sidebar", "suggested-students", currentUser?.id || "anon"],
    queryFn: async (): Promise<any[]> => {
      if (!currentUser?.id) return [];
      try {
        const [allUsers, userConnections] = await Promise.all([
          searchUsers(""),
          getUserConnections(currentUser.id).catch((): any[] => []),
        ]);
        const connectionIds = new Set(
          (userConnections || []).map((c: any) =>
            String(c.requester === currentUser.id ? c.recipient : c.requester)
          )
        );
        return (allUsers || [])
          .filter(
            (u: any) =>
              String(u.id) !== String(currentUser.id) &&
              !connectionIds.has(String(u.id))
          )
          .slice(0, 3)
          .map((u: any) => ({
            id: String(u.id),
            name:
              u.name ||
              [u.first_name, u.last_name].filter(Boolean).join(" ") ||
              u.username,
            username: u.username,
            avatar: u.avatar || null,
            faculty: formatSlugToLabel(u.faculty),
            university: formatSlugToLabel(u.university),
            isVerified: Boolean(u.is_verified ?? u.isVerified),
          }));
      } catch {
        return [];
      }
    },
    enabled: Boolean(currentUser?.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Resources query
  const resourcesQuery = useQuery({
    queryKey: ["sidebar", "recent-resources"],
    queryFn: () => listResources({ ordering: "-created_at" }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (resources) =>
      (Array.isArray(resources) ? resources : []).slice(0, 3).map((resource: any) => ({
        ...resource,
        subject: normalizeSubject(resource?.subject),
        type: normalizeResourceType(resource?.type),
      })),
  });

  const popularSpheres = spheresQuery.data || [];
  const upcomingEvents = eventsQuery.data || [];
  const suggestedStudents = suggestionsQuery.data || [];
  const recentResources = resourcesQuery.data || [];
  const isLoading = spheresQuery.isLoading || resourcesQuery.isLoading;
  const loadError = spheresQuery.error || resourcesQuery.error;

  useEffect(() => {
    if (!loadError) return;
    toast({
      title: "Sidebar incomplète",
      description: (loadError as any)?.message || "Impossible de charger les données latérales",
      variant: "destructive",
    });
  }, [loadError, toast]);

  const handleConnectUser = async (userId: string, studentName: string) => {
    if (!currentUser?.id || connectingUserId) return;
    setConnectingUserId(userId);
    try {
      await createConnection(userId);
      setConnectedUserIds((prev) => new Set(prev).add(userId));
      toast({
        title: "Demande envoyée",
        description: `Demande de connexion envoyée à ${studentName}`,
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["sidebar", "suggested-students"] });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de connexion.",
        variant: "destructive",
      });
    } finally {
      setConnectingUserId(null);
    }
  };

  const openSphere = (sphereId: string | number) => {
    navigate(`/spheres/${sphereId}`);
  };

  const openResource = (resourceId?: string | number) => {
    navigate(resourceId ? `/resources/${resourceId}` : "/resources");
  };

  const openEvent = (eventId: string | number) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ─── 1. Sphères actives ─── */}
      <div className="py-2 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Sphères actives
          </h3>
          <button
            type="button"
            onClick={() => navigate("/spheres")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            Voir tout
          </button>
        </div>

        <div className="space-y-1">
          {isLoading && (
            <div className="space-y-2 py-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && popularSpheres.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 text-center">Aucune sphère à afficher.</p>
          )}

          {popularSpheres.map((sphere) => (
            <button
              key={sphere.id}
              type="button"
              onClick={() => openSphere(sphere.id)}
              className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-border/40">
                  <AvatarImage src={sphere.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-muted text-muted-foreground font-semibold text-xs">
                    {sphere.name?.[0]?.toUpperCase() || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-foreground truncate group-hover:underline">
                    {sphere.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {sphere.category
                      ? (getSphereCategoryLabel(String(sphere.category).trim().toLowerCase()) || "Sphère")
                      : "Sphère collaborative"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0 text-muted-foreground">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {sphere.memberCount || 0}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 2. Prochains événements ─── */}
      <div className="py-2 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Prochains événements
          </h3>
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            Voir tout
          </button>
        </div>

        <div className="space-y-1.5">
          {eventsQuery.isLoading && (
            <div className="space-y-2 py-1">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!eventsQuery.isLoading && upcomingEvents.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 text-center">Aucun événement prévu.</p>
          )}

          {upcomingEvents.map((evt) => {
            const startDate = evt.startDate ? new Date(evt.startDate) : new Date();
            const day = !isNaN(startDate.getTime()) ? startDate.getDate() : 1;
            const month = !isNaN(startDate.getTime())
              ? startDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()
              : "EVT";

            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => openEvent(evt.id)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left group cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center h-8 w-8 rounded-lg bg-muted border border-border/40 shrink-0">
                  <span className="text-[11px] font-bold text-foreground leading-none">{day}</span>
                  <span className="text-[8px] font-semibold text-muted-foreground uppercase leading-none mt-0.5">{month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-foreground truncate group-hover:underline">
                    {evt.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {evt.isOnline ? "En ligne" : (evt.location || "Campus")}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3. Suggestions d'étudiants (Qui suivre) ─── */}
      {suggestedStudents.length > 0 && (
        <div className="py-2 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between px-2 mb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Suggestions d'étudiants
            </h3>
            <button
              type="button"
              onClick={() => navigate("/connections")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
            >
              Voir tout
            </button>
          </div>

          <div className="space-y-2">
            {suggestedStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-muted/40 transition-colors"
              >
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => navigate(`/profile/${student.username}`)}
                >
                  <Avatar className="h-8 w-8 rounded-full shrink-0 border border-border/40">
                    <AvatarImage src={student.avatar || undefined} />
                    <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                      {student.name?.[0]?.toUpperCase() || "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-foreground truncate hover:underline">
                        {student.name}
                      </span>
                      {student.isVerified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {student.faculty || student.university || "Étudiant"}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleConnectUser(student.id, student.name)}
                  disabled={connectingUserId === student.id}
                  className={cn(
                    "h-7 px-2.5 text-[11px] rounded-lg font-medium shadow-none shrink-0 transition-colors",
                    connectedUserIds.has(student.id)
                      ? "text-muted-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40"
                  )}
                >
                  {connectedUserIds.has(student.id) ? "Envoyé" : "Connecter"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4. Ressources récentes (comme la vue liste) ─── */}
      <div className="py-2 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            Ressources récentes
          </h3>
          <button
            type="button"
            onClick={() => navigate("/resources")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            Voir tout
          </button>
        </div>

        <div className="space-y-1">
          {isLoading && (
            <div className="space-y-2 py-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {!isLoading && recentResources.length === 0 && (
            <p className="text-xs text-muted-foreground py-3 text-center">Aucune ressource récente.</p>
          )}

          {recentResources.map((resource) => {
            const style = getResourceStyle(resource.type);
            return (
              <button
                key={resource.id}
                type="button"
                onClick={() => openResource(resource.id)}
                className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border", style.bg, style.icon)}>
                    {getResourceIcon(resource.type, "h-4 w-4")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground truncate group-hover:underline">
                      {resource.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      <span>{getSubjectLabel(resource.subject)}</span>
                      <span className="mx-1">·</span>
                      <span>{formatRelativeTime(resource.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Footer version ─── */}
      <div className="px-4 py-2 text-center space-y-0.5">
        <span className="font-automata text-xs text-muted-foreground/70 tracking-wide">CampusSphere</span>
        <span className="block text-[10px] text-muted-foreground/40">v{appVersion}</span>
      </div>
    </div>
  );
}
