import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { downloadResource, getResource, reportResource, trackResourceShare } from "@/services/api";
import { Download, Share2, ChevronLeft, Eye, Flag, Loader2, Zap, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RESOURCE_TYPE_OPTIONS } from "@/constants/resourceTypes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatFrenchDate } from "@/lib/date";

const SUBJECT_LABELS: Record<string, string> = {
  math: "Mathématiques",
  cs: "Informatique",
  physics: "Physique",
  economics: "Économie",
  language: "Langues",
  other: "Autre",
};

function getSubjectLabel(subject: string) {
  return SUBJECT_LABELS[subject] || subject.charAt(0).toUpperCase() + subject.slice(1);
}

function getResourceTypeLabel(type: string) {
  return RESOURCE_TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
}

export function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  const [resource, setResource] = useState<{
    id: string;
    title: string;
    description: string;
    subject: string;
    type: string;
    format: string;
    size: string;
    level: string;
    pages: number;
    uploader: {
      name: string;
      username?: string;
      avatar: string;
      verified: boolean;
      level: string;
      contributions: number;
    };
    uploadDate: string | null;
    stats: {
      downloads: number;
      saves: number;
      views: number;
    };
    impactScore: number;
    tags: string[];
    relatedCourse: string;
  } | null>(null);

  // Load resource from API
  useEffect(() => {
    if (!id) return;
    
    let isMounted = true;
    (async () => {
      try {
        const data = await getResource(id);
        if (isMounted && data) {
          setResource({
            id: String(data.id),
            title: data.title,
            description: data.description || '',
            subject: data.subject,
            type: data.type,
            format: (data.fileUrl || data.file)?.toString().split('.').pop(),
            size: data.fileSize || data.file_size || data.size,
            level: data.level || data.audience || data.courseLevel,
            pages: data.pages || data.page_count || 0,
            uploader: {
              name: data.author?.name || data.author_info?.name || data.author_name || "Utilisateur",
              username: data.author?.username || data.author_info?.username || data.author_username || "",
              avatar: data.author?.avatar || data.author_info?.avatar || "/placeholder-avatar.jpg",
              verified: data.author?.isVerified || data.author_info?.is_verified || false,
              level: data.author?.level || data.author_info?.level || "",
              contributions: data.author?.contributions || data.author_info?.contributions || 0,
            },
            uploadDate: data.createdAt || data.created_at || data.uploaded_at || null,
            stats: {
              downloads: data.downloadCount || data.download_count || data.stats?.downloads || 0,
              saves: data.saves || data.stats?.saves || data.saves_count || 0,
              views: data.viewCount || data.view_count || data.stats?.views || 0
            },
            impactScore: data.impactScore || data.impact_score || 0,
            tags: data.tags || [],
            relatedCourse: data.subject || ''
          });
        }
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de charger la ressource",
          variant: "destructive",
        });
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);


  const handleDownload = () => {
    if (!id) return;

    setIsDownloading(true);
    
    void (async () => {
      try {
        const result = await downloadResource(id);
        const objectUrl = window.URL.createObjectURL(result.blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(objectUrl);

        setResource((prev) =>
          prev
            ? {
                ...prev,
                stats: {
                  ...prev.stats,
                  downloads: prev.stats.downloads + 1,
                },
              }
            : prev
        );

        toast({
          title: "Téléchargement démarré !",
          description: "Votre fichier va être téléchargé dans quelques instants",
          duration: 3000,
        });
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de télécharger la ressource",
          variant: "destructive",
        });
      } finally {
        setIsDownloading(false);
      }
    })();
  };

  const handleShare = () => {
    if (!id) return;
    setIsSharing(true);

    void (async () => {
      try {
        const shareUrl = window.location.href;
        await navigator.clipboard.writeText(shareUrl);

        try {
          await trackResourceShare(id, { channel: "copy_link" });
        } catch {
          // Optional analytics endpoint failure should not block UX.
        }

        toast({
          title: "Lien copié !",
          description: "Le lien de cette ressource a été copié dans votre presse-papiers",
          duration: 2000,
        });
      } catch (e: any) {
        toast({
          title: "Partage impossible",
          description: e?.message || "Impossible de copier le lien dans le presse-papiers.",
          variant: "destructive",
        });
      } finally {
        setIsSharing(false);
      }
    })();
  };

  const handleReport = () => {
    if (!id) return;
    setIsReporting(true);

    void (async () => {
      try {
        await reportResource(id, {
          reason: "inappropriate_content",
          details: "Signalé depuis la page de détail de la ressource.",
        });

        toast({
          title: "Signalement envoyé",
          description: "Merci pour votre signalement. Nous examinerons cette ressource",
          duration: 3000,
        });
      } catch (e: any) {
        toast({
          title: "Échec du signalement",
          description: e?.message || "Impossible d'envoyer le signalement pour le moment.",
          variant: "destructive",
        });
      } finally {
        setIsReporting(false);
      }
    })();
  };


  if (!resource) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement de la ressource...</p>
        </div>
      </div>
    );
  }

  return (
    <div key={id} className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-4 px-4 md:py-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4 gap-2"
          onClick={() => navigate("/resources")}
        >
          <ChevronLeft className="h-4 w-4" />
          Retour aux ressources
        </Button>
        
        {/* Resource Header */}
        <Card className="campus-card mb-4">
          <CardContent className="p-4 md:p-6">
            {/* Title & Type */}
            <div className="mb-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className="campus-gradient text-white">
                  {getResourceTypeLabel(resource.type)}
                </Badge>
                <Badge variant="secondary">{getSubjectLabel(resource.subject)}</Badge>
                <Badge variant="outline">{resource.format.toUpperCase()}</Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{resource.title}</h1>
              <p className="text-muted-foreground">{resource.description}</p>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {resource.stats.downloads}
              </span>
              <span className="flex items-center gap-1 text-primary">
                <Zap className="h-4 w-4" />
                {resource.impactScore}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {resource.stats.views}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-4 w-4" />
                {resource.stats.saves}
              </span>
            </div>

            {/* Uploader Info */}
            <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={resource.uploader.avatar} />
                  <AvatarFallback>{resource.uploader.name.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{resource.uploader.name}</p>
                    {resource.uploader.verified && (
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {resource.uploader.level} · {resource.uploader.contributions} contributions
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resource.uploader.username && navigate(`/profile/${resource.uploader.username}`)}
                disabled={!resource.uploader.username}
              >
                Voir le profil
              </Button>
              <Badge className="flex items-center gap-1 rounded-lg px-3 py-2 h-10 text-sm bg-secondary/20 text-secondary">
                <Zap className="h-4 w-4" />
                <span>{resource.impactScore}</span>
              </Badge>
              <Button 
                variant="outline"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={handleReport}
                disabled={isReporting}
              >
                {isReporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="campus-card mb-4">
          <CardContent className="p-4 md:p-6">
            <h3 className="font-semibold text-lg mb-4">Détails</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Matière associée</p>
                <p className="font-medium">{getSubjectLabel(resource.subject)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Public cible</p>
                <p className="font-medium">{resource.level || "Non défini"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pages</p>
                <p className="font-medium">{resource.pages || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date d'upload</p>
                <p className="font-medium">{resource.uploadDate ? formatFrenchDate(resource.uploadDate) : "N/A"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {(resource.tags || []).map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
