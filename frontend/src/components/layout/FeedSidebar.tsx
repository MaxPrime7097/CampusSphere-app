import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ExternalLink, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listResources, listSpheres } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/date";
import { getSphereCategoryLabel } from "@/constants/sphereCategories";
import { getResourceTypeLabel, getSubjectLabel, normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";

export function FeedSidebar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [popularSpheres, setPopularSpheres] = useState<any[]>([]);
  const [recentResources, setRecentResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const appVersion = import.meta.env.VITE_APP_VERSION || "2.0.0";

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const [spheres, resources] = await Promise.all([
          listSpheres(),
          listResources({ ordering: "-created_at" }),
        ]);

        if (!isMounted) {
          return;
        }

        setPopularSpheres(
          [...(spheres || [])]
            .sort((a: any, b: any) => Number(b.memberCount || 0) - Number(a.memberCount || 0))
            .slice(0, 4)
        );
        setRecentResources(
          (resources || []).slice(0, 4).map((resource: any) => ({
            ...resource,
            subject: normalizeSubject(resource?.subject),
            type: normalizeResourceType(resource?.type),
          }))
        );
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        toast({
          title: "Sidebar incomplète",
          description: error?.message || "Impossible de charger les données latérales",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const openSphere = (sphereId: string | number, sphereName: string) => {
    navigate(`/spheres/${sphereId}`);
    toast({
      title: "Sphère ouverte",
      description: `Ouverture de "${sphereName}"`,
      duration: 2000,
    });
  };

  const openResource = (resourceId?: string | number, resourceTitle?: string) => {
    if (resourceId) {
      navigate(`/resources/${resourceId}`);
      toast({
        title: "Ressource ouverte",
        description: `Ouverture de "${resourceTitle}"`,
        duration: 2000,
      });
      return;
    }

    navigate("/resources");
  };

  return (
    <div className="space-y-4 sticky top-20">
      <Card className="campus-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Sphères actives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {!isLoading && popularSpheres.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune sphère à afficher.</p>
          )}
          {popularSpheres.map((sphere) => (
            <button
              key={sphere.id}
              type="button"
              className="w-full flex items-center justify-between hover:bg-accent/50 p-2 rounded-lg transition-colors text-left border border-input"
              onClick={() => openSphere(sphere.id, sphere.name)}
            >
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{sphere.name}</div>
                <Badge variant="secondary" className="text-xs">
                  {sphere.category ? (getSphereCategoryLabel(String(sphere.category).trim().toLowerCase()) || "Autre") : "Sphère collaborative"}
                </Badge>
              </div>
              <Badge variant="secondary" className="text-xs">
                {sphere.memberCount || 0} membres
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="campus-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Ressources récentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Chargement...</p>}
          {!isLoading && recentResources.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune ressource récente.</p>
          )}
          {recentResources.map((resource) => (
            <button
              key={resource.id}
              type="button"
              className="w-full space-y-1 hover:bg-accent/50 p-2 rounded-lg transition-colors text-left border border-input"
              onClick={() => openResource(resource.id, resource.title)}
            >
              <div className="font-medium text-sm line-clamp-2">{resource.title}</div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {getSubjectLabel(resource.subject)}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {getResourceTypeLabel(resource.type)}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{resource.authorName || "Auteur inconnu"}</span>
                <span>{formatRelativeTime(resource.createdAt)}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="campus-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-primary" />
            Accès rapide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/spheres")}>
            Explorer les sphères
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/resources")}>
            Explorer les ressources
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/notifications")}>
            Voir les notifications
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card className="campus-card mt-5">
        <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="font-automata text-primary text-lg md:text-xl">CampusSphere</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Version {appVersion}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
