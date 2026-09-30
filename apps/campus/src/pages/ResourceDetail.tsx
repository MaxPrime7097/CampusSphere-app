import { parseSlugId, encodeHashId } from "@/lib/hashids";
import { getResourceUrl } from "@/lib/utils";
import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import {
  deleteResource,
  downloadResource,
  getResource,
  getResourcePreviewUrl,
  reportResource,
  saveResource,
  trackResourceShare,
  updateResource,
  listFolders,
  type ResourceFolder,
} from "@/services/api";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  normalizeAudience,
  normalizeCategory,
  normalizeResourceType,
  normalizeSubject,
} from "@/lib/resourceMetadata";
import {
  ResourceHeader,
  ResourcePreview,
  ResourceDetailsCard,
  ResourceGuestCta,
  ResourceEditDialog,
  ResourceDeleteDialog,
  ResourceShareModal,
  ResourceAuthModal,
} from "@/components/resources";

export function ResourceDetail() {
  const { id: rawParam } = useParams();
  const realId = parseSlugId(rawParam) ?? rawParam;
  const id = realId ? String(realId) : undefined;
  const navigate = useNavigate();
  const { toast } = useToast();

  // Pre-emptive immediate address bar rewrite if rawParam is pure numeric
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !rawParam) return;
    if (/^\d+$/.test(rawParam)) {
      const parsed = Number(rawParam);
      if (Number.isInteger(parsed) && parsed > 0) {
        const hash = encodeHashId(parsed);
        if (hash && window.location.pathname !== `/resources/${hash}`) {
          window.history.replaceState(null, "", `/resources/${hash}`);
        }
      }
    }
  }, [rawParam]);

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("none");

  const isAuthenticated = Boolean(
    typeof window !== "undefined" &&
      (localStorage.getItem("access") || localStorage.getItem("access_token"))
  );

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
  const isImage =
    normalizedMime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(inferredExtension);
  const isPreviewable = isPdf || isImage;

  const resourceQuery = useQuery({
    queryKey: ["resource", id],
    queryFn: () => getResource(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    if (resourceQuery.data) {
      const data = resourceQuery.data;
      const author = data.author ?? null;
      const uploaderContributions =
        author?.contributions_count ?? author?.stats?.contributions ?? 0;

      const resourcePayload = {
        id: String(data.id),
        title: data.title,
        description: data.description || "",
        subject: normalizeSubject(data.subject),
        category: normalizeCategory(data.category),
        type: normalizeResourceType(data.type),
        format: (data.fileUrl || data.file)?.toString().split(".").pop() || "",
        size: String(data.fileSize || data.file_size || data.size || "0"),
        level: normalizeAudience(data.level || data.audience || data.courseLevel),
        pages: Number(data.pages || data.page_count || 0),
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
          views: data.viewCount || data.view_count || data.stats?.views || 0,
        },
        isSaved: data.isSaved ?? data.is_saved ?? false,
        canEdit: data.canEdit ?? data.can_edit ?? false,
        canDelete: data.canDelete ?? data.can_delete ?? false,
        fileUrl: data.fileUrl || data.file_url || data.file || "",
        fileName: data.fileName || data.file_name || "",
        mimeType:
          data.mimeType || data.mime_type || data.contentType || data.content_type || "",
        impactScore: data.impactScore || data.impact_score || 0,
        tags: data.tags || [],
        relatedCourse: normalizeSubject(data.subject),
      };

      setResource(resourcePayload);
      if (typeof window !== "undefined" && window.history.replaceState) {
        const canonicalUrl = getResourceUrl(resourcePayload);
        if (canonicalUrl && window.location.pathname !== canonicalUrl) {
          window.history.replaceState(null, "", canonicalUrl);
        }
      }
      setIsSaved(Boolean(resourcePayload.isSaved));
      setDraftTitle(resourcePayload.title);
      setDraftDescription(resourcePayload.description || "");

      if (resourcePayload.canEdit) {
        listFolders()
          .then((foldersData) => {
            if (isMounted) {
              setFolders(foldersData);
              const rawFolderId = (data as any).folder_id ?? (data as any).folder ?? null;
              setCurrentFolderId(rawFolderId ? String(rawFolderId) : "none");
            }
          })
          .catch((): void => {});
      }
    } else if (resourceQuery.error) {
      toast({
        title: "Erreur",
        description:
          (resourceQuery.error as any)?.message || "Impossible de charger la ressource",
        variant: "destructive",
      });
    }

    return () => {
      isMounted = false;
    };
  }, [id, resourceQuery.data, resourceQuery.error, toast]);

  useEffect(() => {
    if (!id || !resource) return;

    if (!isPreviewable) {
      setPreviewSrc(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    let isMounted = true;
    setIsPreviewLoading(true);
    setPreviewError(null);

    if (resource.fileUrl) {
      setPreviewSrc(resource.fileUrl);
      setIsPreviewLoading(false);
      return;
    }

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
  }, [id, resource?.fileUrl, isPreviewable]);

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
                  saves: saved
                    ? (Number(prev.stats.saves) || 0) + 1
                    : Math.max(0, (Number(prev.stats.saves) || 1) - 1),
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

  const handleSocialShare = (platform: string) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(
      `Découvre cette ressource sur CampusSphere : ${resource?.title}`
    );

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
    trackResourceShare(id!, { channel: platform }).catch(() => {});
  };

  const handleCopyLink = async () => {
    if (isCopyingLink) return;
    setIsCopyingLink(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Lien copié !",
        description: "Le lien a été copié dans votre presse-papiers.",
      });
      trackResourceShare(id!, { channel: "copy_link" }).catch(() => {});
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
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

  const handleUpdateResource = async () => {
    if (!id || !resource || isUpdatingResource) return;
    const title = draftTitle.trim();
    if (!title) {
      toast({
        title: "Titre requis",
        description: "Le titre ne peut pas être vide.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingResource(true);
    try {
      const updated = await updateResource(id, {
        title,
        description: draftDescription.trim(),
      });
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
      toast({
        title: "Ressource modifiée",
        description: "La ressource a été mise à jour.",
      });
    } catch (e: any) {
      toast({
        title: "Échec de modification",
        description: e?.message || "Impossible de modifier cette ressource.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingResource(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!id || !resource || isDeletingResource) return;
    const snapshot = resource;
    setShowDeleteDialog(false);
    setIsDeletingResource(true);
    setResource(null);
    try {
      await deleteResource(id);
      toast({
        title: "Ressource supprimée",
        description: "La ressource a été supprimée définitivement.",
      });
      navigate("/resources");
    } catch (e: any) {
      setResource(snapshot);
      toast({
        title: "Échec de suppression",
        description: e?.message || "Impossible de supprimer la ressource.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingResource(false);
    }
  };

  const handleMoveToFolder = async (folderIdVal: string) => {
    if (!id || !resource) return;
    const folderId = folderIdVal === "none" ? null : Number(folderIdVal);
    await updateResource(resource.id, { folder_id: folderId });
    setCurrentFolderId(folderIdVal);
    toast({
      title: folderIdVal === "none" ? "Retiré du dossier" : "Déplacé dans le dossier",
      description:
        folderIdVal === "none"
          ? "La ressource n'est plus dans un dossier."
          : `Ressource déplacée dans "${folders.find((f) => String(f.id) === folderIdVal)?.name}".`,
    });
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>
            {isDeletingResource
              ? "Suppression de la ressource..."
              : "Chargement de la ressource..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{resource.title} - CampusSphere</title>
        <meta
          name="description"
          content={
            resource.description
              ? resource.description.length > 160
                ? resource.description.substring(0, 160) + "..."
                : resource.description
              : "Consultez cette ressource sur CampusSphere."
          }
        />
        <link rel="canonical" href={`https://campussphere.app${getResourceUrl(resource)}`} />
        <meta property="og:url" content={`https://campussphere.app${getResourceUrl(resource)}`} />
        <meta property="og:title" content={`${resource.title} - Ressource CampusSphere`} />
        <meta
          property="og:description"
          content={
            resource.description
              ? resource.description.substring(0, 160)
              : "Téléchargez et partagez des ressources académiques sur CampusSphere."
          }
        />
        <meta property="og:url" content={`https://campussphere.app/resources/${id}`} />
      </Helmet>

      <div key={id} className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        <div className="container max-w-4xl mx-auto py-4 px-4 md:py-6">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => navigate("/resources")}
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux ressources
          </Button>

          <ResourceHeader
            resource={resource}
            isSaved={isSaved}
            isSaving={isSaving}
            isSharing={isSharing}
            isReporting={isReporting}
            isDeleting={isDeletingResource}
            folders={folders}
            currentFolderId={currentFolderId}
            onSave={handleSaveResource}
            onOpenEdit={() => {
              setDraftTitle(resource.title);
              setDraftDescription(resource.description || "");
              setShowEditDialog(true);
            }}
            onOpenDelete={() => setShowDeleteDialog(true)}
            onShare={() => setShowShareModal(true)}
            onReport={handleReport}
            onMoveToFolder={handleMoveToFolder}
          />

          <ResourcePreview
            title={resource.title}
            isDownloading={isDownloading}
            isPreviewLoading={isPreviewLoading}
            previewError={previewError}
            isPreviewable={isPreviewable}
            previewSrc={previewSrc}
            isPdf={isPdf}
            onDownload={handleDownload}
          />

          <ResourceDetailsCard
            level={resource.level}
            size={resource.size}
            uploadDate={resource.uploadDate}
            tags={resource.tags}
          />

          {!isAuthenticated && <ResourceGuestCta />}
        </div>

        <ResourceEditDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          draftTitle={draftTitle}
          onChangeTitle={setDraftTitle}
          draftDescription={draftDescription}
          onChangeDescription={setDraftDescription}
          isUpdating={isUpdatingResource}
          onConfirm={handleUpdateResource}
        />

        <ResourceDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          isDeleting={isDeletingResource}
          onConfirm={handleDeleteResource}
        />

        <ResourceShareModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          onSocialShare={handleSocialShare}
          onCopyLink={handleCopyLink}
          isCopyingLink={isCopyingLink}
        />

        <ResourceAuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          onNavigateLogin={() => navigate("/login")}
          onNavigateRegister={() => navigate("/register")}
        />
      </div>
    </>
  );
}

export default ResourceDetail;
