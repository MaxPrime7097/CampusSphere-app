import { parseSlugId, encodeHashId } from "@/lib/hashids";
import { getResourceUrl } from "@/lib/utils";
import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { CaretLeft as ChevronLeft, Spinner as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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

function mapResourceDetail(data: any) {
  if (!data) return null;
  const author = (data as any).author_info ?? data.author ?? null;
  const uploaderContributions =
    author?.stats?.contributions ?? author?.contributions_count ?? author?.contributionsCount ?? 1;

  return {
    id: String(data.id),
    title: data.title || "",
    description: data.description || "",
    subject: normalizeSubject(data.subject),
    category: normalizeCategory(data.category),
    type: normalizeResourceType(data.type),
    format: (data.fileUrl || data.file)?.toString().split(".").pop() || "",
    size: String(data.fileSize || data.file_size || data.size || "0"),
    level: normalizeAudience(data.level || data.audience || data.courseLevel),
    pages: Number(data.pages || data.page_count || 0),
    uploader: {
      name: author?.name || (data as any).author_name || "Utilisateur",
      username: author?.username || (data as any).author_username || "",
      avatar: author?.avatar || "/placeholder-avatar.jpg",
      verified: author?.isVerified || (author as any)?.is_verified || false,
      level: author?.level || "",
      contributions: Math.max(1, Number(uploaderContributions) || 1),
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
}

export function ResourceDetail() {
  const { t } = useTranslation("resources");
  const { id: rawParam } = useParams();
  const realId = parseSlugId(rawParam) ?? rawParam;
  const id = realId ? String(realId) : undefined;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const [resource, setResource] = useState<any | null>(() => {
    if (!id) return null;
    const direct = queryClient.getQueryData<any>(["resource", id]);
    if (direct) return mapResourceDetail(direct);
    const cachedResources = queryClient.getQueryData<any[]>(["resources"]);
    const found = (cachedResources || []).find(
      (r: any) => String(r.id) === String(id) || r.slug === id || r.hash_id === id
    );
    if (found) return mapResourceDetail(found);
    const savedResources = queryClient.getQueryData<any[]>(["saved-resources"]);
    const saved = (savedResources || []).find(
      (r: any) => String(r.id) === String(id) || r.slug === id || r.hash_id === id
    );
    return saved ? mapResourceDetail(saved) : null;
  });

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
    placeholderData: () => {
      if (!id) return undefined;
      const direct = queryClient.getQueryData<any>(["resource", id]);
      if (direct) return direct;
      const cachedResources = queryClient.getQueryData<any[]>(["resources"]);
      const found = (cachedResources || []).find(
        (r: any) => String(r.id) === String(id) || r.slug === id || r.hash_id === id
      );
      if (found) return found;
      const savedResources = queryClient.getQueryData<any[]>(["saved-resources"]);
      return (
        (savedResources || []).find(
          (r: any) => String(r.id) === String(id) || r.slug === id || r.hash_id === id
        ) ?? undefined
      );
    },
  });

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    if (resourceQuery.data) {
      const data = resourceQuery.data;
      const author = (data as any).author_info ?? data.author ?? null;
      const uploaderContributions =
        author?.stats?.contributions ?? author?.contributions_count ?? author?.contributionsCount ?? 1;

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
          name: author?.name || (data as any).author_name || "Utilisateur",
          username: author?.username || (data as any).author_username || "",
          avatar: author?.avatar || "/placeholder-avatar.jpg",
          verified: author?.isVerified || (author as any)?.is_verified || false,
          level: author?.level || "",
          contributions: Math.max(1, Number(uploaderContributions) || 1),
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
        title: t("feedCard.toasts.error"),
        description:
          (resourceQuery.error as any)?.message || t("detail.toasts.loadError"),
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
          const result = await downloadResource(id, undefined, { triggerDownload: false });
          const objectUrl = window.URL.createObjectURL(result.blob);
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(objectUrl);

          setResource((prev: any) =>
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
            title: t("detail.toasts.downloadStarted"),
            description: t("detail.toasts.downloadStartedDesc"),
            duration: 3000,
          });
        } catch (e: any) {
          toast({
            title: t("feedCard.toasts.error"),
            description: e?.message || t("feedCard.toasts.downloadError"),
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
        setResource((prev: any) =>
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
          title: saved ? t("detail.toasts.savedTitle") : t("detail.toasts.unsavedTitle"),
          description: saved
            ? t("detail.toasts.savedDesc")
            : t("detail.toasts.unsavedDesc"),
        });
      } catch (e: any) {
        toast({
          title: t("feedCard.toasts.error"),
          description: e?.message || t("feedCard.toasts.actionFailed"),
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
      t("detail.socialShareText", { title: resource?.title || "" })
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
        title: t("detail.toasts.linkCopied"),
        description: t("detail.toasts.linkCopiedDesc"),
      });
      trackResourceShare(id!, { channel: "copy_link" }).catch(() => {});
    } catch {
      toast({
        title: t("feedCard.toasts.error"),
        description: t("feedCard.toasts.actionFailed"),
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
            title: t("detail.toasts.reportSent"),
            description: t("detail.toasts.reportSentDesc"),
            duration: 3000,
          });
        } catch (e: any) {
          toast({
            title: t("detail.toasts.reportFailed"),
            description: e?.message || t("detail.toasts.reportFailedDesc"),
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
        title: t("detail.toasts.titleRequired"),
        description: t("detail.toasts.titleRequiredDesc"),
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
      setResource((prev: any) =>
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
        title: t("detail.toasts.resourceUpdated"),
        description: t("detail.toasts.resourceUpdatedDesc"),
      });
    } catch (e: any) {
      toast({
        title: t("detail.toasts.updateFailed"),
        description: e?.message || t("feedCard.toasts.actionFailed"),
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
        title: t("detail.toasts.resourceDeleted"),
        description: t("detail.toasts.resourceDeletedDesc"),
      });
      navigate("/resources");
    } catch (e: any) {
      setResource(snapshot);
      toast({
        title: t("detail.toasts.deleteFailed"),
        description: e?.message || t("feedCard.toasts.actionFailed"),
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
      title: folderIdVal === "none" ? t("detail.toasts.removedFromFolder") : t("detail.toasts.movedToFolder"),
      description:
        folderIdVal === "none"
          ? t("detail.toasts.removedFromFolderDesc")
          : t("detail.toasts.movedToFolderDesc", { name: folders.find((f) => String(f.id) === folderIdVal)?.name || "" }),
    });
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>
            {isDeletingResource
              ? t("detail.deleting")
              : t("detail.loading")}
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
            {t("detail.back")}
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
