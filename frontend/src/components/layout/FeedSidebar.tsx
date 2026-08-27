import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, BookOpen, ChevronRight } from "lucide-react";
import { Card, CardContent, CardSection } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listResources, listSpheres } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/date";
import { getSphereCategoryLabel } from "@/constants/sphereCategories";
import { getResourceTypeLabel, getSubjectLabel, normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { useQuery } from "@tanstack/react-query";

export function FeedSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const appVersion = import.meta.env.VITE_APP_VERSION || "2.0.0";

  const spheresQuery = useQuery({
    queryKey: ["sidebar", "popular-spheres"],
    queryFn: listSpheres,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (spheres) =>
      [...(Array.isArray(spheres) ? spheres : [])]
        .sort((a: any, b: any) => Number(b.memberCount || 0) - Number(a.memberCount || 0))
        .slice(0, 4),
  });

  const resourcesQuery = useQuery({
    queryKey: ["sidebar", "recent-resources"],
    queryFn: () => listResources({ ordering: "-created_at" }),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (resources) =>
      (Array.isArray(resources) ? resources : []).slice(0, 4).map((resource: any) => ({
        ...resource,
        subject: normalizeSubject(resource?.subject),
        type: normalizeResourceType(resource?.type),
      })),
  });

  const popularSpheres = spheresQuery.data || [];
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

  const openSphere = (sphereId: string | number, sphereName: string) => {
    navigate(`/spheres/${sphereId}`);
  };

  const openResource = (resourceId?: string | number) => {
    navigate(resourceId ? `/resources/${resourceId}` : "/resources");
  };

  return (
    <div className="space-y-3 sticky top-[64px]">

      {/* Spheres actives */}
      <Card variant="default">
        <CardSection
          title="Spheres actives"
          action={<span onClick={() => navigate("/spheres")}>Voir tout</span>}
        />
        <CardContent className="pt-0 space-y-0.5">
          {isLoading && (
            <div className="space-y-2 py-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 rounded-[var(--radius-sm)] bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && popularSpheres.length === 0 && (
            <p className="text-caption py-3 text-center">Aucune sphere a afficher.</p>
          )}
          {popularSpheres.map((sphere) => (
            <button
              key={sphere.id}
              type="button"
              onClick={() => openSphere(sphere.id, sphere.name)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-[var(--radius-sm)] hover:bg-accent transition-colors text-left group"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{sphere.name}</div>
                <div className="text-micro mt-0.5">
                  {sphere.category
                    ? (getSphereCategoryLabel(String(sphere.category).trim().toLowerCase()) || "Autre")
                    : "Sphere collaborative"}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-micro text-muted-foreground">{sphere.memberCount || 0}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Ressources recentes */}
      <Card variant="default">
        <CardSection
          title="Ressources recentes"
          action={<span onClick={() => navigate("/resources")}>Voir tout</span>}
        />
        <CardContent className="pt-0 space-y-0.5">
          {isLoading && (
            <div className="space-y-2 py-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-[var(--radius-sm)] bg-muted animate-pulse" />
              ))}
            </div>
          )}
          {!isLoading && recentResources.length === 0 && (
            <p className="text-caption py-3 text-center">Aucune ressource recente.</p>
          )}
          {recentResources.map((resource) => (
            <button
              key={resource.id}
              type="button"
              onClick={() => openResource(resource.id)}
              className="w-full px-3 py-2 rounded-[var(--radius-sm)] hover:bg-accent transition-colors text-left space-y-1 group"
            >
              <div className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{resource.title}</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="muted" size="sm">{getSubjectLabel(resource.subject)}</Badge>
                <Badge variant="outline" size="sm">{getResourceTypeLabel(resource.type)}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-micro truncate">{resource.authorName || "Auteur inconnu"}</span>
                <span className="text-micro flex-shrink-0">{formatRelativeTime(resource.createdAt)}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Footer version */}
      <div className="px-4 py-3 text-center">
        <span className="font-automata text-sm text-muted-foreground/60 tracking-wide">CampusSphere</span>
        <span className="block text-micro text-muted-foreground/40">v{appVersion}</span>
      </div>

    </div>
  );
}
