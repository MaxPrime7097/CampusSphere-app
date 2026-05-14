import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { deleteResource, downloadResource, getResource, getResourcePreviewUrl, reportResource, saveResource, trackResourceShare, updateResource, listFolders, updateFolder, type ResourceFolder } from "@/services/api";
import { Download, Share2, ChevronLeft, Eye, Flag, Loader2, Zap, Bookmark, Pencil, Trash2, Info, X, Copy, FileText, FolderInput, BadgeCheck } from "lucide-react";
import { FaFacebook, FaTwitter, FaWhatsapp, FaLinkedin } from 'react-icons/fa';

import { renderMentionText } from "@/lib/mentions";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { formatFrenchDate } from "@/lib/date";
import {
  getAudienceLabel,
  getCategoryLabel,
  getSubjectLabel,
  getTypeLabel,
  normalizeAudience,
  normalizeCategory,
  normalizeResourceType,
  normalizeSubject,
} from "@/lib/resourceMetadata";
import { formatFileSize } from "@/lib/utils";

const RESOURCE_DETAIL_LOG_PREFIX = "[ResourceDetail][debug]";

function shouldLogResourceDetailDebug() {
  if (typeof window === "undefined") return false;
  return import.meta.env.DEV || window.localStorage.getItem("debug:resource-detail") === "true";
}

function logResourceDetailDebug(message: string, payload: Record<string, unknown>) {
  if (!shouldLogResourceDetailDebug()) return;
  console.info(`${RESOURCE_DETAIL_LOG_PREFIX} ${message}`, payload);
}

export function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isPreviewMode = searchParams.get("mode") === "preview";
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUpdatingResource, setIsUpdatingResource] = useState(false);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  // Folder state (for owner)
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("none");
  const [isMovingToFolder, setIsMovingToFolder] = useState(false);
  const [showFolderSelect, setShowFolderSelect] = useState(false);


  const [resource, setResource] = useState<{
    id: string;
    title: string;
    description: string;
    subject: string;
    category: string;
    type: string | null;
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
    isSaved: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    fileUrl?: string;
    fileName?: string;
    mimeType?: string;
  } | null>(null);
  const fileSource = resource?.fileUrl || resource?.fileName || "";
  const inferredExtension = (fileSource.split(".").pop() || resource?.format || "").toLowerCase();
  const normalizedMime = (resource?.mimeType || "").toLowerCase();
  const isPdf = normalizedMime.includes("pdf") || inferredExtension === "pdf";
  const isImage = normalizedMime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(inferredExtension);
  const isPreviewable = isPdf || isImage;

  const EmptyField = () => <span className="italic text-muted-foreground text-xs font-normal">Aucun</span>;

  // Load resource from API
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    (async () => {
      try {
        const data = await getResource(id);
        if (isMounted && data) {
          logResourceDetailDebug("received_api_resource", {
            resourceId: id,
            type: data.type,
            subject: data.subject,
            tags: data.tags,
            author: data.author,
            author_name: data.author_name,
            author_username: data.author_username,
          });

          const author = data.author ?? null;
          const uploaderContributions =
            author?.contributions_count ??
            author?.stats?.contributions ??
            0;

          const resourcePayload = {
            id: String(data.id),
            title: data.title,
            description: data.description || '',
            subject: normalizeSubject(data.subject),
            category: normalizeCategory(data.category),
            type: normalizeResourceType(data.type),
            format: (data.fileUrl || data.file)?.toString().split('.').pop(),
            size: data.fileSize || data.file_size || data.size,
            level: normalizeAudience(data.level || data.audience || data.courseLevel),
            pages: data.pages || data.page_count || 0,
            uploader: {
              name: author?.name || data.author_name || "Utilisateur",
              username: author?.username || data.author_username || "",
              avatar: author?.avatar || "/placeholder-avatar.jpg",
              verified: author?.isVerified || author?.is_verified || false,
              level: author?.level || "",
              contributions: Number.isFinite(Number(uploaderContributions))
                ? Number(uploaderContributions)
                : 0,
            },
            uploadDate: data.createdAt || data.created_at || data.uploaded_at || null,
            stats: {
              downloads: data.downloadCount || data.download_count || data.stats?.downloads || 0,
              saves: data.saves || data.stats?.saves || data.saves_count || 0,
              views: data.viewCount || data.view_count || data.stats?.views || 0
            },
            isSaved: data.isSaved ?? data.is_saved ?? false,
            canEdit: data.canEdit ?? data.can_edit ?? false,
            canDelete: data.canDelete ?? data.can_delete ?? false,
            fileUrl: data.fileUrl || data.file_url || data.file || "",
            fileName: data.fileName || data.file_name || "",
            mimeType: data.mimeType || data.mime_type || data.contentType || data.content_type || "",
            impactScore: data.impactScore || data.impact_score || 0,
            tags: data.tags || [],
            relatedCourse: normalizeSubject(data.subject)
          };

          logResourceDetailDebug("normalized_resource_payload", {
            resourceId: id,
            type: resourcePayload.type,
            subject: resourcePayload.subject,
            tags: resourcePayload.tags,
            uploader: {
              name: resourcePayload.uploader.name,
              username: resourcePayload.uploader.username,
              avatar: resourcePayload.uploader.avatar,
              verified: resourcePayload.uploader.verified,
              level: resourcePayload.uploader.level,
              contributions: resourcePayload.uploader.contributions,
            },
          });

          setResource(resourcePayload);
          setIsSaved(resourcePayload.isSaved);
          setDraftTitle(resourcePayload.title);
          setDraftDescription(resourcePayload.description || "");

          // If owner, load folders and set current folder
          if (resourcePayload.canEdit) {
            listFolders().then((foldersData) => {
              if (isMounted) {
                setFolders(foldersData);
                // Get folder_id from raw data
                const rawFolderId = (data as any).folder_id ?? (data as any).folder ?? null;
                setCurrentFolderId(rawFolderId ? String(rawFolderId) : "none");
              }
            }).catch(() => null);
          }
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

  useEffect(() => {
    if (!id || !isPreviewMode) {
      setPreviewSrc(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    if (!isPreviewable) {
      setPreviewSrc(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    let isMounted = true;

    setIsPreviewLoading(true);
    setPreviewError(null);

    void (async () => {
      try {
        const previewUrl = await getResourcePreviewUrl(id);
        if (!isMounted) return;
        if (!previewUrl) {
          setPreviewError("Impossible de récupérer l’URL d’aperçu.");
          return;
        }
        setPreviewSrc(previewUrl);
      } catch (e: any) {
        if (!isMounted) return;
        setPreviewError(e?.message || "Impossible de charger l'aperçu.");
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id, isPreviewMode, isPreviewable]);


  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = !!localStorage.getItem("access");

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setShowAuthModal(true);
    }
  };

  const handleDownload = () => {
    if (!id) return;
    requireAuth(() => {
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
    });
  };

  const handleSaveResource = async () => {
    if (!id || isSaving) return;
    requireAuth(async () => {
      setIsSaving(true);
      try {
        const response = await saveResource(id);
        const saved = response?.data?.saved ?? !isSaved;
        setIsSaved(saved);
        setResource((prev) =>
          prev
            ? {
              ...prev,
              isSaved: saved,
              stats: {
                ...prev.stats,
                saves: saved ? (Number(prev.stats.saves) || 0) + 1 : Math.max(0, (Number(prev.stats.saves) || 1) - 1),
              },
            }
            : prev
        );

        toast({
          title: saved ? "Ressource sauvegardée" : "Ressource retirée des sauvegardes",
          description: saved
            ? "Cette ressource est maintenant enregistrée dans vos favoris"
            : "Cette ressource a été retirée de vos favoris",
        });
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de modifier l'état de sauvegarde",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    });
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleSocialShare = (platform: string) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`Découvre cette ressource sur CampusSphere : ${resource?.title}`);

    let url = "";
    switch (platform) {
      case "whatsapp":
        url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
        break;
      default:
        return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    trackResourceShare(id!, { channel: platform }).catch(() => { });
  };

  const handleCopyLink = async () => {
    if (isCopyingLink) return;
    setIsCopyingLink(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Lien copié !", description: "Le lien a été copié dans votre presse-papiers." });
      trackResourceShare(id!, { channel: "copy_link" }).catch(() => { });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier le lien.", variant: "destructive" });
    } finally {
      setIsCopyingLink(false);
    }
  };


  const handleReport = () => {
    if (!id) return;
    requireAuth(() => {
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
    });
  };

  const handleOpenEdit = () => {
    if (!resource) return;
    setDraftTitle(resource.title);
    setDraftDescription(resource.description || "");
    setShowEditDialog(true);
  };

  const handleUpdateResource = async () => {
    if (!id || !resource || isUpdatingResource) return;
    const title = draftTitle.trim();
    if (!title) {
      toast({ title: "Titre requis", description: "Le titre ne peut pas être vide.", variant: "destructive" });
      return;
    }

    // Pessimistic update.
    setIsUpdatingResource(true);
    try {
      const updated = await updateResource(id, { title, description: draftDescription.trim() });
      setResource((prev) =>
        prev
          ? {
            ...prev,
            title: updated?.title ?? title,
            description: updated?.description ?? draftDescription.trim(),
          }
          : prev
      );
      setShowEditDialog(false);
      toast({ title: "Ressource modifiée", description: "La ressource a été mise à jour." });
    } catch (e: any) {
      toast({ title: "Échec de modification", description: e?.message || "Impossible de modifier cette ressource.", variant: "destructive" });
    } finally {
      setIsUpdatingResource(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!id || !resource || isDeletingResource) return;
    const snapshot = resource;
    setShowDeleteDialog(false);
    setIsDeletingResource(true);
    // Optimistic UI: hide content locally while deletion is pending.
    setResource(null);
    try {
      await deleteResource(id);
      toast({ title: "Ressource supprimée", description: "La ressource a été supprimée définitivement." });
      navigate("/resources");
    } catch (e: any) {
      setResource(snapshot);
      toast({ title: "Échec de suppression", description: e?.message || "Impossible de supprimer la ressource.", variant: "destructive" });
    } finally {
      setIsDeletingResource(false);
    }
  };


  if (!resource) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{isDeletingResource ? "Suppression de la ressource..." : "Chargement de la ressource..."}</p>
        </div>
      </div>
    );
  }

  logResourceDetailDebug("render_resource_critical_values", {
    resourceId: resource.id,
    type: resource.type,
    subject: resource.subject,
    tags: resource.tags,
    uploader: {
      name: resource.uploader.name,
      username: resource.uploader.username,
      avatar: resource.uploader.avatar,
      verified: resource.uploader.verified,
      level: resource.uploader.level,
      contributions: resource.uploader.contributions,
    },
  });

  return (
    <>
      <Helmet>
        <title>{resource.title} - CampusSphere</title>
        <meta name="description" content={resource.description ? (resource.description.length > 160 ? resource.description.substring(0, 160) + "..." : resource.description) : "Consultez cette ressource sur CampusSphere."} />
        <link rel="canonical" href={`https://campussphere.app/resources/${id}`} />
        <meta property="og:title" content={`${resource.title} - Ressource CampusSphere`} />
        <meta property="og:description" content={resource.description ? resource.description.substring(0, 160) : "Téléchargez et partagez des ressources académiques sur CampusSphere."} />
        <meta property="og:url" content={`https://campussphere.app/resources/${id}`} />
      </Helmet>
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
                    {getTypeLabel(resource.type)}
                  </Badge>
                  <Badge variant="secondary">{getSubjectLabel(resource.subject)}</Badge>
                  {resource.category && (
                    <Badge variant="outline">{getCategoryLabel(resource.category)}</Badge>
                  )}
                  <Badge variant="outline">{resource.format ? resource.format.toUpperCase() : "Non défini"}</Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{resource.title}</h1>
                <p className="text-muted-foreground whitespace-pre-wrap">{renderMentionText(resource.description)}</p>
              </div>


              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  {resource.stats.downloads}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {resource.stats.views}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" />
                  {resource.stats.saves}
                </span>
                <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary rounded-full ml-auto group relative">
                  <Zap className="h-3 w-3 fill-current" />
                  <span className="text-xs font-bold">{resource.impactScore || 0}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full hover:bg-primary/20 transition-colors"
                    onClick={() => toast({
                      title: "Score d'impact",
                      description: "Le Score d'Impact mesure l'utilité et la pertinence de ce contenu pour la communauté CampusSphere. Il est calculé en fonction des interactions et des retours des étudiants.",
                    })}

                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </div>
              </div>


              {/* Uploader Info */}
              <div className="flex flex-col gap-3 p-3 bg-accent/50 rounded-lg mb-4 md:flex-row md:items-center md:justify-between">
                <div
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => resource.uploader.username && navigate(`/profile/${resource.uploader.username}`)}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={resource.uploader.avatar} />
                    <AvatarFallback>{resource.uploader.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{resource.uploader.name}</p>
                      {resource.uploader.verified && (
                        <BadgeCheck className="h-4 w-4 text-primary fill-primary/10" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {resource.uploader.contributions} contributions
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">



                  <Button
                    variant={isSaved ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleSaveResource}
                    disabled={isSaving}
                    className="gap-2"
                    aria-label={isSaved ? "Retirer des enregistrements" : "Enregistrer la ressource"}
                  >
                    <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                    <span className="hidden md:inline">{isSaved ? "Enregistré" : "Enregistrer"}</span>
                  </Button>


                  {resource.canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenEdit}
                      disabled={isUpdatingResource}
                      className="gap-2"
                      aria-label="Modifier la ressource"
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden md:inline">Modifier</span>
                    </Button>
                  )}

                  {resource.canEdit && folders.length > 0 && !showFolderSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFolderSelect(true)}
                      className="gap-2"
                      aria-label="Déplacer vers un dossier"
                    >
                      <FolderInput className="h-4 w-4" />
                      <span className="hidden md:inline">Dossier</span>
                    </Button>
                  )}

                  {resource.canEdit && folders.length > 0 && showFolderSelect && (
                    <div className="flex items-center gap-1">
                      <Select
                        value={currentFolderId}
                        onValueChange={async (val) => {
                          setIsMovingToFolder(true);
                          try {
                            const folderId = val === "none" ? null : Number(val);
                            await updateResource(resource.id, { folder_id: folderId });

                            setCurrentFolderId(val);
                            toast({
                              title: val === "none" ? "Retiré du dossier" : "Déplacé dans le dossier",
                              description: val === "none"
                                ? "La ressource n'est plus dans un dossier."
                                : `Ressource déplacée dans "${folders.find(f => String(f.id) === val)?.name}".`,
                            });
                            setShowFolderSelect(false);
                          } catch (e: any) {
                            toast({ title: "Erreur", description: e?.message, variant: "destructive" });
                          } finally {
                            setIsMovingToFolder(false);
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs w-36">
                          {isMovingToFolder
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <SelectValue placeholder="Choisir dossier" />
                          }
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun dossier</SelectItem>
                          {folders.map(f => (
                            <SelectItem key={f.id} value={String(f.id)} disabled={f.resource_count >= 20 && currentFolderId !== String(f.id)}>
                              {f.name} ({f.resource_count}/20)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowFolderSelect(false)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {resource.canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeletingResource}
                      className="gap-2"
                      aria-label="Supprimer la ressource"
                    >
                      {isDeletingResource ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="hidden md:inline">Supprimer</span>
                    </Button>

                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="gap-2"
                    aria-label="Partager la ressource"
                  >
                    {isSharing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">Partager</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    disabled={isReporting}
                    className="gap-2"
                    aria-label="Signaler la ressource"
                  >
                    {isReporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Flag className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">Signaler</span>
                  </Button>

                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card mb-4">
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Aperçu</h3>
                  <p className="text-sm text-muted-foreground">
                    {isPreviewMode
                      ? "Mode aperçu actif (ouvert depuis l'icône œil)."
                      : "Ouvrez cette page avec ?mode=preview pour charger l'aperçu du fichier."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isPreviewMode ? "secondary" : "outline"}>
                    {isPreviewMode ? "Aperçu actif" : "Aperçu inactif"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="gap-2"
                    aria-label="Télécharger la ressource"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span className="hidden md:inline">Télécharger</span>
                  </Button>

                </div>
              </div>

              {isPreviewMode ? (
                isPreviewLoading ? (
                  <div className="flex items-center justify-center rounded-lg border border-dashed h-[420px]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : previewError ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-destructive">
                    {previewError}
                  </div>
                ) : !isPreviewable ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Ce format n’est pas prévisualisable dans l’application. Utilisez le bouton Télécharger.
                  </div>
                ) : previewSrc ? (
                  <div className="rounded-lg border overflow-hidden bg-background">
                    {isPdf ? (
                      <iframe
                        title={`Aperçu de ${resource.title}`}
                        src={previewSrc}
                        className="w-full h-[70vh] min-h-[420px]"
                      />
                    ) : (
                      <img
                        src={previewSrc}
                        alt={`Aperçu de ${resource.title}`}
                        className="w-full max-h-[70vh] object-contain bg-muted/20"
                      />
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Impossible de charger l’aperçu pour le moment.
                  </div>
                )
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  Cliquez sur l’icône œil depuis la liste des ressources pour ouvrir directement cette vue en mode aperçu.
                </div>
              )}
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
                  <p className="font-medium">{getAudienceLabel(resource.level)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Taille du fichier</p>
                  <p className="font-medium">{formatFileSize(resource.size)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date d'upload</p>
                  <p className="font-medium">{resource.uploadDate ? formatFrenchDate(resource.uploadDate) : <EmptyField />}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {(resource.tags || []).length > 0 ? (
                    (resource.tags || []).map((tag) => (
                      <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <EmptyField />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la ressource</DialogTitle>
              <DialogDescription>Mettre à jour le titre et la description.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} className="min-h-[60px]" />
              <Textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} className="min-h-[120px]" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUpdatingResource}>Annuler</Button>
                <Button onClick={handleUpdateResource} disabled={isUpdatingResource}>
                  {isUpdatingResource ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer cette ressource ?</DialogTitle>
              <DialogDescription>Cette action est destructive et ne peut pas être annulée.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeletingResource}>Annuler</Button>
              <Button variant="destructive" onClick={handleDeleteResource} disabled={isDeletingResource}>
                {isDeletingResource ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Guest CTA Banner */}
        {!isAuthenticated && (
          <Card className="mt-8 border-primary/50 bg-primary/5 campus-animate-slide-up overflow-hidden relative">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Zap className="h-24 w-24 text-primary fill-current -rotate-12 translate-x-8 -translate-y-8" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-7 w-7 text-primary fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Voulez-vous aller plus loin ?</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Inscrivez-vous pour télécharger cette ressource, la sauvegarder dans vos dossiers et accéder à des milliers d'autres documents partagés par la communauté.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Button onClick={() => navigate("/register")} className="campus-gradient text-white px-8 h-11">
                    S'inscrire gratuitement
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/login")} className="h-11">
                    Se connecter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partager la ressource</DialogTitle>
            <DialogDescription>
              Partagez cette ressource avec votre réseau ou copiez le lien.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
                onClick={() => handleSocialShare("whatsapp")}
              >
                <FaWhatsapp className="h-5 w-5 text-green-500" />
                <span>WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                onClick={() => handleSocialShare("facebook")}
              >
                <FaFacebook className="h-5 w-5 text-blue-600" />
                <span>Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all"
                onClick={() => handleSocialShare("twitter")}
              >
                <FaTwitter className="h-5 w-5 text-sky-500" />
                <span>Twitter / X</span>
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
                onClick={() => handleSocialShare("linkedin")}
              >
                <FaLinkedin className="h-5 w-5 text-blue-700" />
                <span>LinkedIn</span>
              </Button>
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <label htmlFor="link" className="sr-only">Lien</label>
                <div className="relative">
                  <Input
                    id="link"
                    defaultValue={window.location.href}
                    readOnly
                    className="pr-10 h-11 bg-muted/30"
                  />
                  <Button
                    size="sm"
                    className="absolute right-1 top-1 h-9 px-3"
                    onClick={handleCopyLink}
                    disabled={isCopyingLink}
                  >
                    {isCopyingLink ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary fill-current" />
              Rejoignez CampusSphere
            </DialogTitle>
            <DialogDescription>
              Vous devez être connecté pour télécharger ou sauvegarder des ressources.
              Créez un compte gratuitement pour accéder à tout le contenu.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button onClick={() => navigate("/register")} className="campus-gradient text-white w-full">
              Créer un compte gratuitement
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
              Se connecter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


