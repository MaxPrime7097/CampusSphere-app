import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CaretRight as ChevronRight,
  UsersThree as Users,
  SealCheck as BadgeCheck,
  FileText,
  BookOpen,
  GraduationCap,
  Sparkle as Sparkles,
  Archive,
  FolderSimple as FolderGit2,
  BookBookmark,
  Notepad,
  Question as QuestionMark,
} from "@phosphor-icons/react";
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
import { normalizeSphereType, SPHERE_TYPE_LABELS } from "@/config/sphereFeatures";
import { normalizeResourceType } from "@/constants/resourceTypes";
import {
  getResourceTypeLabel,
  getSubjectLabel,
  normalizeSubject,
} from "@/lib/resourceMetadata";
import { cn, formatSlugToLabel, getSphereUrl, getEventUrl, getResourceUrl, encodeHashId } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const RESOURCE_TYPE_STYLES: Record<string, { icon: string; bg: string }> = {
  course_notes: { icon: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  td_tp:        { icon: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  exams:        { icon: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  project:      { icon: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20" },
  book:         { icon: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  other:        { icon: "text-muted-foreground", bg: "bg-muted/30 border-border/40" },
};

function getResourceStyle(type?: string) {
  if (!type) return RESOURCE_TYPE_STYLES.other;
  const canonical = normalizeResourceType(type);
  return RESOURCE_TYPE_STYLES[canonical] || RESOURCE_TYPE_STYLES.other;
}

function getResourceIcon(type?: string, className = "h-4 w-4") {
  const canonical = normalizeResourceType(type);
  switch (canonical) {
    case "course_notes":
      return <BookOpen className={className} />;
    case "td_tp":
      return <Notepad className={className} />;
    case "exams":
      return <GraduationCap className={className} />;
    case "project":
      return <FolderGit2 className={className} />;
    case "book":
      return <BookBookmark className={className} />;
    default:
      return <QuestionMark className={className} />;
  }
}

export function FeedSidebar() {
  const { t, i18n } = useTranslation(["feed", "resources"]);
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

  // Upcoming Events query (single fast request with client-side sort & 3 items limit)
  const eventsQuery = useQuery({
    queryKey: ["sidebar", "upcoming-events"],
    queryFn: async () => {
      try {
        const allEvents = await getEvents();
        if (!Array.isArray(allEvents) || allEvents.length === 0) return [];
        const now = new Date();
        const future = allEvents
          .filter((e) => e.startDate && new Date(e.startDate) >= now)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        if (future.length > 0) return future.slice(0, 3);
        return allEvents
          .sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())
          .slice(0, 3);
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
      title: t("sidebar.incompleteTitle"),
      description: (loadError as any)?.message || t("sidebar.incompleteDesc"),
      variant: "destructive",
    });
  }, [loadError, toast, t]);

  const handleConnectUser = async (userId: string, studentName: string) => {
    if (!currentUser?.id || connectingUserId) return;
    setConnectingUserId(userId);
    try {
      await createConnection(userId);
      setConnectedUserIds((prev) => new Set(prev).add(userId));
      toast({
        title: t("sidebar.requestSentTitle"),
        description: t("sidebar.requestSentDesc", { name: studentName }),
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["sidebar", "suggested-students"] });
    } catch {
      toast({
        title: t("sidebar.error"),
        description: t("sidebar.requestSendError"),
        variant: "destructive",
      });
    } finally {
      setConnectingUserId(null);
    }
  };

  const openSphere = (sphere: any) => {
    if (typeof sphere === "object") {
      navigate(getSphereUrl(sphere));
    } else {
      const hash = encodeHashId(sphere);
      navigate(hash ? `/spheres/${hash}` : `/spheres/${sphere}`);
    }
  };

  const openResource = (resource?: any) => {
    if (!resource) {
      navigate("/resources");
      return;
    }
    if (typeof resource === "object") {
      navigate(getResourceUrl(resource));
    } else {
      const hash = encodeHashId(resource);
      navigate(hash ? `/resources/${hash}` : `/resources/${resource}`);
    }
  };

  const openEvent = (event: any) => {
    if (typeof event === "object") {
      navigate(getEventUrl(event));
    } else {
      const hash = encodeHashId(event);
      navigate(hash ? `/events/${hash}` : `/events/${event}`);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* ─── 1. Sphères actives ─── */}
      <div className="py-2 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            {t("sidebar.activeSpheres")}
          </h3>
          <button
            type="button"
            onClick={() => navigate("/spheres")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            {t("sidebar.viewAll")}
          </button>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-2 py-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : popularSpheres.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">{t("sidebar.noSpheres")}</p>
          ) : (
            popularSpheres.map((sphere) => {
              const sphereType = normalizeSphereType(sphere.sphere_type || sphere.sphereType || sphere.type || sphere.category);
              const sphereTypeLabel = SPHERE_TYPE_LABELS[sphereType] || "Communauté";
              return (
                <button
                  key={sphere.id}
                  type="button"
                  onClick={() => openSphere(sphere)}
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
                        {sphereTypeLabel}
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
              );
            })
          )}
        </div>
      </div>

      {/* ─── 2. Prochains événements ─── */}
      <div className="py-2 border-b border-border/40 pb-4">
        <div className="flex items-center justify-between px-2 mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
            {t("sidebar.upcomingEvents")}
          </h3>
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            {t("sidebar.viewAll")}
          </button>
        </div>

        <div className="space-y-1.5">
          {eventsQuery.isLoading ? (
            <div className="space-y-2 py-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">{t("sidebar.noEvents")}</p>
          ) : (
            upcomingEvents.map((evt) => {
            const startDate = evt.startDate ? new Date(evt.startDate) : new Date();
            const day = !isNaN(startDate.getTime()) ? startDate.getDate() : 1;
            const month = !isNaN(startDate.getTime())
              ? startDate.toLocaleDateString(i18n.language?.startsWith("en") ? "en-US" : "fr-FR", { month: "short" }).toUpperCase()
              : "EVT";

            return (
              <button
                key={evt.id}
                type="button"
                onClick={() => openEvent(evt)}
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
                    {evt.isOnline ? t("sidebar.online") : (evt.location || t("sidebar.campus"))}
                  </div>
                </div>
              </button>
            );
          })
          )}
        </div>
      </div>

      {/* ─── 3. Suggestions d'étudiants (Qui suivre) ─── */}
      {suggestedStudents.length > 0 && (
        <div className="py-2 border-b border-border/40 pb-4">
          <div className="flex items-center justify-between px-2 mb-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              {t("sidebar.studentSuggestions")}
            </h3>
            <button
              type="button"
              onClick={() => navigate("/connections")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
            >
              {t("sidebar.viewAll")}
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
                        <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" weight="fill" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {student.faculty || student.university || t("sidebar.defaultStudent")}
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
                  {connectedUserIds.has(student.id) ? t("sidebar.sent") : t("sidebar.connect")}
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
            {t("sidebar.recentResources")}
          </h3>
          <button
            type="button"
            onClick={() => navigate("/resources")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
          >
            {t("sidebar.viewAll")}
          </button>
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-2 py-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : recentResources.length === 0 ? (
            <p className="text-xs text-muted-foreground py-3 text-center">{t("sidebar.noResources")}</p>
          ) : (
            recentResources.map((resource) => {
              const canonicalType = normalizeResourceType(resource.type);
              const style = getResourceStyle(canonicalType);
              const typeLabel = t(`feedCard.types.${canonicalType}`, { ns: "resources", defaultValue: "Autre" });
              return (
                <button
                  key={resource.id}
                  type="button"
                  onClick={() => openResource(resource)}
                  className="w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl hover:bg-muted/40 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border", style.bg, style.icon)}>
                      {getResourceIcon(canonicalType, "h-4 w-4")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate group-hover:underline">
                        {resource.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        <span className="font-medium">{typeLabel}</span>
                        <span className="mx-1">·</span>
                        <span>{formatRelativeTime(resource.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                </button>
              );
            })
          )}
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
