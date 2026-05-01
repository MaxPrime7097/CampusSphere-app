import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { deleteResource, downloadResource, getResource, getResourcePreviewUrl, reportResource, saveResource, trackResourceShare, updateResource } from "@/services/api";
import { Download, Share2, ChevronLeft, Eye, Flag, Loader2, Zap, Bookmark, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatFrenchDate } from "@/lib/date";
import {
  getAudienceLabel,
  getSubjectLabel,
  getTypeLabel,
  normalizeAudience,
  normalizeCategory,
  normalizeResourceType,
  normalizeSubject,
} from "@/lib/resourceMetadata";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (!id) return;
    
    let isMounted = true;
    (async () => {
      try {
        const data = await getResource(id);
        if (isMounted && data) {
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
            format: (data.fileUrl || data.file)?.toString().split('.').pop() || "PDF",
            size: data.fileSize || data.file_size || data.size || "N/A",
            level: normalizeAudience(data.level || data.audience || data.courseLevel),
            pages: data.pages || data.page_count || 0,
            uploader: {
              name: author?.name || data.author_name || "Utilisateur",
              username: author?.username || data.author_username || "",
              avatar: author?.avatar || "/placeholder-avatar.jpg",
              verified: author?.isVerified || author?.is_verified || false,
              level: author?.level || "Campus Explorer",
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

          setResource(resourcePayload);
          setIsSaved(resourcePayload.isSaved);
          setDraftTitle(resourcePayload.title);
          setDraftDescription(resourcePayload.description || "");
        }
      } catch (e: any) {
        toast({
          title: "Erreur",
          description: e?.message || "Impossible de charger la ressource",
          variant: "destructive",
        });
      }
    })();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!id || !isPreviewMode || !isPreviewable) {
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

    return () => { isMounted = false; };
  }, [id, isPreviewMode, isPreviewable]);

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
        setResource(prev => prev ? { ...prev, stats: { ...prev.stats, downloads: prev.stats.downloads + 1 } } : prev);
        toast({ title: "Téléchargement démarré !", description: "Votre fichier va être téléchargé.", duration: 3000 });
      } catch (e: any) {
        toast({ title: "Erreur", description: e?.message || "Échec du téléchargement", variant: "destructive" });
      } finally {
        setIsDownloading(false);
      }
    })();
  };

  const handleSaveResource = async () => {
    if (!id || isSaving) return;
    setIsSaving(true);
    try {
      const response = await saveResource(id);
      const saved = response?.data?.saved ?? !isSaved;
      setIsSaved(saved);
      setResource(prev => prev ? { ...prev, isSaved: saved, stats: { ...prev.stats, saves: saved ? (prev.stats.saves || 0) + 1 : Math.max(0, (prev.stats.saves || 1) - 1) } } : prev);
      toast({ title: saved ? "Sauvegardée" : "Retirée", description: saved ? "Favoris mis à jour" : "Retirée des favoris" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Action impossible", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (!id) return;
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      trackResourceShare(id, { channel: "copy_link" }).catch(() => {});
      toast({ title: "Lien copié !", description: "Partagez ce lien avec vos amis." });
    }).catch(() => {
      toast({ title: "Erreur", description: "Impossible de copier le lien", variant: "destructive" });
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
    if (!title) return;
    setIsUpdatingResource(true);
    try {
      const updated = await updateResource(id, { title, description: draftDescription.trim() });
      setResource(prev => prev ? { ...prev, title: updated?.title ?? title, description: updated?.description ?? draftDescription.trim() } : prev);
      setShowEditDialog(false);
      toast({ title: "Ressource mise à jour" });
    } catch (e: any) {
      toast({ title: "Échec", description: e?.message, variant: "destructive" });
    } finally {
      setIsUpdatingResource(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!id || !resource || isDeletingResource) return;
    setIsDeletingResource(true);
    try {
      await deleteResource(id);
      toast({ title: "Supprimée" });
      navigate("/resources");
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
      setIsDeletingResource(false);
    }
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground animate-pulse">Chargement de la ressource...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 pb-12">
      {/* Top Banner / Navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/resources")} className="gap-2 hover:bg-accent rounded-full transition-all active:scale-95">
            <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Retour aux ressources</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSaveResource} 
              disabled={isSaving} 
              className={cn("rounded-full transition-all active:scale-95", isSaved && "text-primary bg-primary/10")}
            >
              <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full transition-all active:scale-95">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsReporting(true)} className="rounded-full text-destructive transition-all active:scale-95">
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        {/* Main Content Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 font-semibold transition-colors">
                  {getSubjectLabel(resource.subject)}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 font-medium bg-background/50">
                  {getTypeLabel(resource.type)}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 font-medium bg-background/50 uppercase">
                  {resource.format || "PDF"}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight animate-in fade-in slide-in-from-bottom-2 duration-500">
                {resource.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-700">
                {resource.description}
              </p>
            </div>

            {/* Preview Section */}
            <Card className="overflow-hidden border-none shadow-2xl bg-card/50 backdrop-blur-sm group/card transition-all hover:shadow-primary/5 animate-in zoom-in-95 duration-500">
              <div className="p-1 bg-muted/30">
                <div className="aspect-[4/3] relative bg-muted rounded-xl overflow-hidden group">
                  {isPreviewLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground animate-pulse">Chargement de l'aperçu...</p>
                    </div>
                  ) : previewError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-muted/50">
                      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <Eye className="h-8 w-8" />
                      </div>
                      <div className="max-w-xs">
                        <h3 className="font-bold text-lg">Aperçu indisponible</h3>
                        <p className="text-sm text-muted-foreground mt-1">{previewError}</p>
                      </div>
                      <Button variant="outline" onClick={handleDownload} className="gap-2 rounded-full px-6 transition-all active:scale-95">
                        <Download className="h-4 w-4" /> Télécharger pour voir
                      </Button>
                    </div>
                  ) : isPreviewable && previewSrc ? (
                    isPdf ? (
                      <iframe
                        src={`${previewSrc}#toolbar=0`}
                        className="w-full h-full border-none"
                        title="Aperçu PDF"
                      />
                    ) : (
                      <img
                        src={previewSrc}
                        alt={resource.title}
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-6 bg-gradient-to-br from-muted/50 to-background/50">
                      <div className="h-24 w-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/40 rotate-3 transition-transform group-hover:rotate-0 duration-500 shadow-inner">
                        <FileText className="h-12 w-12" />
                      </div>
                      <div className="max-w-[320px] space-y-2">
                        <h3 className="font-extrabold text-2xl uppercase tracking-tighter text-foreground">{inferredExtension || "Fichier"}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Ce format ne peut pas être prévisualisé directement. Téléchargez-le pour y accéder.
                        </p>
                      </div>
                      <Button 
                        onClick={handleDownload} 
                        className="campus-gradient text-white hover:opacity-90 gap-3 px-10 h-12 rounded-full shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 font-bold text-lg"
                      >
                        <Download className="h-5 w-5" /> Télécharger ({resource.size})
                      </Button>
                    </div>
                  )}
                  
                  {isPreviewable && !isPreviewLoading && !previewError && (
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <Button size="sm" variant="secondary" className="gap-2 backdrop-blur-md bg-white/90 rounded-full shadow-xl" onClick={handleDownload}>
                        <Download className="h-4 w-4" /> Télécharger
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-1000">
                {resource.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs text-muted-foreground hover:text-primary hover:border-primary transition-all cursor-pointer rounded-full px-3 py-0.5 bg-background/30">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Uploader Card */}
            <Card className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-sm animate-in slide-in-from-right-4 duration-500">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative group/avatar">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20 ring-offset-2 transition-transform group-hover/avatar:scale-110 duration-300">
                      <AvatarImage src={resource.uploader.avatar} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xl font-black">
                        {resource.uploader.name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {resource.uploader.verified && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary text-white rounded-full border-2 border-background flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="h-2.5 w-2.5">
                          <path d="M20 6L9 17L4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg truncate hover:text-primary transition-colors cursor-pointer" onClick={() => resource.uploader.username && navigate(`/profile/${resource.uploader.username}`)}>
                      {resource.uploader.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{resource.uploader.username || "user"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/5 p-3 rounded-2xl text-center border border-primary/5 group/stat hover:bg-primary/10 transition-colors">
                    <p className="text-[10px] uppercase tracking-widest font-black text-primary/60 mb-0.5">Niveau</p>
                    <p className="font-black text-primary text-lg">{resource.uploader.level}</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-2xl text-center border border-primary/5 group/stat hover:bg-primary/10 transition-colors">
                    <p className="text-[10px] uppercase tracking-widest font-black text-primary/60 mb-0.5">Apport</p>
                    <p className="font-black text-primary text-lg">+{resource.uploader.contributions}</p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full rounded-full h-10 border-primary/10 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-bold"
                  onClick={() => resource.uploader.username && navigate(`/profile/${resource.uploader.username}`)}
                >
                  Voir le profil
                </Button>
              </div>
            </Card>

            {/* Stats & Metadata Card */}
            <Card className="border-none shadow-2xl bg-gradient-to-br from-card/60 to-accent/10 backdrop-blur-md animate-in slide-in-from-right-8 duration-700">
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm group/row">
                    <span className="text-muted-foreground flex items-center gap-2 group-hover/row:text-foreground transition-colors"><Eye className="h-4 w-4" /> Vues</span>
                    <span className="font-bold tabular-nums">{resource.stats.views}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm group/row">
                    <span className="text-muted-foreground flex items-center gap-2 group-hover/row:text-foreground transition-colors"><Download className="h-4 w-4" /> Téléchargements</span>
                    <span className="font-bold tabular-nums">{resource.stats.downloads}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm group/row">
                    <span className="text-muted-foreground flex items-center gap-2 group-hover/row:text-foreground transition-colors"><Bookmark className="h-4 w-4" /> Sauvegardes</span>
                    <span className="font-bold tabular-nums">{resource.stats.saves}</span>
                  </div>
                  
                  <div className="h-px bg-primary/10 my-4" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary fill-primary/20" /> Score d'impact
                    </span>
                    <Badge className="bg-primary text-white border-none font-black text-lg px-4 py-0.5 rounded-full shadow-lg shadow-primary/20">
                      {resource.impactScore}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">
                    <span>Format</span>
                    <span className="text-foreground">{resource.format}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">
                    <span>Taille</span>
                    <span className="text-foreground">{resource.size}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold text-muted-foreground/60">
                    <span>Publié le</span>
                    <span className="text-foreground">{resource.uploadDate ? formatFrenchDate(resource.uploadDate) : "Récemment"}</span>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="w-full campus-gradient text-white hover:opacity-90 gap-3 h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {isDownloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                    Télécharger
                  </Button>
                  
                  {/* Admin Controls in Sidebar for better access */}
                  {(resource.canEdit || resource.canDelete) && (
                    <div className="flex gap-2 pt-2">
                      {resource.canEdit && (
                        <Button variant="outline" className="flex-1 h-10 rounded-xl gap-2 hover:bg-primary/5 hover:text-primary" onClick={handleOpenEdit}>
                          <Pencil className="h-3.5 w-3.5" /> <span className="text-xs">Éditer</span>
                        </Button>
                      )}
                      {resource.canDelete && (
                        <Button variant="outline" className="flex-1 h-10 rounded-xl gap-2 text-destructive hover:bg-destructive/5 hover:border-destructive/30" onClick={() => setShowDeleteDialog(true)}>
                          <Trash2 className="h-3.5 w-3.5" /> <span className="text-xs">Supprimer</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier la ressource</DialogTitle>
            <DialogDescription>Mettez à jour le titre et la description de votre ressource.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Titre</label>
              <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Titre de la ressource" className="h-12 text-lg font-semibold" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description</label>
              <Textarea value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} placeholder="Description détaillée..." className="min-h-[150px] resize-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowEditDialog(false)} disabled={isUpdatingResource}>Annuler</Button>
            <Button onClick={handleUpdateResource} disabled={isUpdatingResource} className="campus-gradient text-white px-8">
              {isUpdatingResource ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer la ressource ?</DialogTitle>
            <DialogDescription>Cette action est irréversible. Toutes les données liées à cette ressource seront perdues.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)} disabled={isDeletingResource}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteResource} disabled={isDeletingResource} className="px-8">
              {isDeletingResource ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Supprimer définitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={isReporting} onOpenChange={setIsReporting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler la ressource</DialogTitle>
            <DialogDescription>Pourquoi signalez-vous ce contenu ? Nos modérateurs examineront votre signalement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            {["Contenu inapproprié", "Droits d'auteur", "Spam / Publicité", "Fichier corrompu", "Autre"].map(reason => (
              <Button 
                key={reason} 
                variant="outline" 
                className="w-full justify-start hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all"
                onClick={() => {
                  toast({ title: "Signalement envoyé", description: "Merci de nous aider à maintenir la qualité du contenu." });
                  setIsReporting(false);
                }}
              >
                {reason}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
