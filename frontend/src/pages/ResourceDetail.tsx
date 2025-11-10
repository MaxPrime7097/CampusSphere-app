import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, endpoints } from "@/services/api/config";
import { Download, Share2, ChevronLeft, Eye, Flag, FileText, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [impactScore, setImpactScore] = useState(15);
  const [hasRatedImpact, setHasRatedImpact] = useState(false);

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
      avatar: string;
      verified: boolean;
      level: string;
      contributions: number;
    };
    uploadDate: string;
    stats: {
      downloads: number;
      likes: number;
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
  const res = await api.get(endpoints.resources.details(String(id)));
  const data = res.data;
        if (isMounted && data) {
          setResource({
            id: String(data.id),
            title: data.title,
            description: data.description || '',
            subject: data.subject || 'other',
            type: data.type || 'notes',
            format: data.file?.split('.').pop() || 'pdf',
            size: data.file_size || '0 MB',
            level: data.audience || 'L2',
            pages: 0,
            uploader: {
              name: data.author_info?.name || data.author_name || "Utilisateur",
              avatar: data.author_info?.avatar || "/placeholder-avatar.jpg",
              verified: data.author_info?.is_verified || false,
              level: data.author_info?.study_level || "L3",
              contributions: data.author_info?.impact_score || 0
            },
            uploadDate: data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR') : 'Date inconnue',
            stats: {
              downloads: data.download_count || 0,
              likes: data.like_count || 0,
              views: data.view_count || 0
            },
            impactScore: data.impact_score || 15,
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
    setIsDownloading(true);
    
    setTimeout(() => {
      setIsDownloading(false);
      toast({
        title: "Téléchargement démarré !",
        description: "Votre fichier va être téléchargé dans quelques instants",
        duration: 3000,
      });
    }, 2000);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Like retiré" : "Ressource aimée !",
      description: isLiked ? "Vous n'aimez plus cette ressource" : "Cette ressource a été ajoutée à vos favoris",
      duration: 2000,
    });
  };

  const handleImpactScore = () => {
    if (hasRatedImpact) return;
    
    setHasRatedImpact(true);
    setImpactScore(prev => prev + 5);
    toast({
      title: "Impact évalué !",
      description: "Vous avez donné 5 points d'impact à cette ressource",
      duration: 2000,
    });
  };

  const handleShare = () => {
    setIsSharing(true);
    
    setTimeout(() => {
      setIsSharing(false);
      toast({
        title: "Lien copié !",
        description: "Le lien de cette ressource a été copié dans votre presse-papiers",
        duration: 2000,
      });
    }, 1000);
  };

  const handleReport = () => {
    setIsReporting(true);
    
    setTimeout(() => {
      setIsReporting(false);
      toast({
        title: "Signalement envoyé",
        description: "Merci pour votre signalement. Nous examinerons cette ressource",
        duration: 3000,
      });
    }, 1500);
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
                <Badge className="campus-gradient text-white">{resource.type}</Badge>
                <Badge variant="secondary">{resource.subject}</Badge>
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
                {impactScore}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {resource.stats.views}
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
              <Button variant="outline" size="sm">Connect</Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                className="flex-1 campus-gradient text-white hover:opacity-90 gap-2"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Téléchargement..." : `Télécharger (${resource.size})`}
              </Button>
              <Button 
                variant="outline" 
                className={`text-primary border-primary hover:bg-primary/10 ${hasRatedImpact ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleImpactScore}
                disabled={hasRatedImpact}
              >
                <Zap className="h-4 w-4" />
                <span className="ml-1">{impactScore}</span>
              </Button>
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
                <p className="text-sm text-muted-foreground mb-1">Matière associé</p>
                <p className="font-medium">{resource.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pour des étudiants</p>
                <p className="font-medium">{resource.level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Date d'upload</p>
                <p className="font-medium"> il y a {resource.uploadDate}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
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
