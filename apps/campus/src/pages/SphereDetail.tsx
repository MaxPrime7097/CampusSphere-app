import { parseSlugId, encodeHashId } from "@/lib/hashids";
import { getSphereUrl } from "@/lib/utils";
import { Suspense, lazy, useState, useEffect, useMemo, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSphere,
  listSphereMembers,
  listSphereTasks,
  joinSphere,
  cancelSphereJoinRequest,
  updateSphereMember,
  removeSphereMember,
  uploadSphereBanner,
  getSphereFiles,
  deleteSphereFile,
  deleteTask,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { ArrowLeft, WarningCircle as AlertCircle, Shield } from "@phosphor-icons/react";
import { getSphereFeatures, normalizeSphereType } from "@/config/sphereFeatures";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { useAuth } from "@/contexts/AuthContext";
import { getVerificationAccessStatus } from "@/utils/verification";
import { EmptyState } from "@/components/ui/empty-state";
import { MiniChat } from "@/components/chat/MiniChat";
import {
  SphereHeader,
  SphereShareModal,
  SphereTasksTab,
  SphereFilesTab,
  SphereMembersTab,
  SpherePendingMembersTab,
  SphereOverview,
  SphereSpheraTab,
  AnnouncementsTab,
} from "@/components/sphere";
import type { KanbanTask } from "@/components/kanban/KanbanBoard";

const ImageUploadModal = lazy(() =>
  import("@/components/modals/ImageUploadModal").then((module) => ({
    default: module.ImageUploadModal,
  }))
);

export function SphereDetail() {
  const { t } = useTranslation("spheres");
  const { id: rawParam } = useParams();
  const realId = parseSlugId(rawParam) ?? rawParam;
  const id = realId ? String(realId) : undefined;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { canPerformAction } = getVerificationAccessStatus(currentUser);
  const queryClient = useQueryClient();

  // Pre-emptive immediate address bar rewrite if rawParam is pure numeric
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !rawParam) return;
    if (/^\d+$/.test(rawParam)) {
      const parsed = Number(rawParam);
      if (Number.isInteger(parsed) && parsed > 0) {
        const hash = encodeHashId(parsed);
        if (hash && window.location.pathname !== `/spheres/${hash}`) {
          window.history.replaceState(null, "", `/spheres/${hash}`);
        }
      }
    }
  }, [rawParam]);

  const [sphere, setSphere] = useState<any | null>(() => {
    if (!id) return null;
    const direct = queryClient.getQueryData<any>(["sphere", id]);
    if (direct) return direct;
    const allSpheres = queryClient.getQueryData<any[]>(["spheres"]);
    const found = (allSpheres || []).find(
      (s: any) => String(s.id) === String(id) || s.slug === id || s.hash_id === id
    );
    if (found) return found;
    const userSpheres = queryClient.getQueryData<any[]>(["user-spheres"]);
    return (
      (userSpheres || []).find(
        (s: any) => String(s.id) === String(id) || s.slug === id || s.hash_id === id
      ) ?? null
    );
  });

  // Full canonical sync once sphere data is loaded
  useEffect(() => {
    if (!sphere || typeof window === "undefined" || !window.history.replaceState) return;
    const canonicalUrl = getSphereUrl(sphere);
    if (canonicalUrl && window.location.pathname !== canonicalUrl) {
      window.history.replaceState(null, "", canonicalUrl);
    }
  }, [sphere]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    currentUser?.id ? String(currentUser.id) : null
  );
  const [members, setMembers] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const [isMember, setIsMember] = useState(false);
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCancellingRequest, setIsCancellingRequest] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<"ready" | "forbidden" | "server_error">("ready");
  const [processingMemberIds, setProcessingMemberIds] = useState<Record<string, boolean>>({});

  const resolveJoinConflict = (error: unknown): "already_active" | "already_pending" | null => {
    const rawMessage =
      (error as any)?.response?.data?.detail ??
      (error as any)?.response?.data?.message ??
      (error as any)?.message ??
      "";

    let parsedPayload: any = null;
    if (typeof rawMessage === "string") {
      try {
        parsedPayload = JSON.parse(rawMessage);
      } catch {
        parsedPayload = null;
      }
    }

    const normalizedMessage = [
      rawMessage,
      parsedPayload?.detail,
      parsedPayload?.message,
      parsedPayload?.error,
      parsedPayload?.status,
      parsedPayload?.data?.status,
    ]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .join(" ");

    if (normalizedMessage.includes("already active")) return "already_active";
    if (normalizedMessage.includes("already pending")) return "already_pending";
    return null;
  };

  const normalizeRole = (roleValue: unknown): string => {
    if (!roleValue) return "member";
    const role = String(roleValue).trim().toLowerCase();
    if (["admin", "administrateur"].includes(role)) return "admin";
    if (["moderator", "modérateur", "moderateur"].includes(role)) return "moderator";
    if (["teacher", "enseignant", "professeur", "prof"].includes(role)) return "teacher";
    return "member";
  };

  const mapTask = (t: any): KanbanTask => ({
    id: String(t.id),
    title: t.title,
    kanban_status: t.kanban_status || (t.is_completed ? "done" : "todo"),
    priority: t.priority || "medium",
    due_date: t.due_date || null,
    is_completed: t.is_completed || false,
    isCompleted: t.is_completed || false,
    impact_points: t.impact_points || 0,
    impactPoints: t.impact_points || 0,
    assigned_to_info: t.assigned_to_info || null,
    assignedTo:
      t.assigned_to_info?.name ||
      `${t.assigned_to_info?.first_name || ""} ${t.assigned_to_info?.last_name || ""}`.trim() ||
      "Non assigné",
    assignedToAvatar: t.assigned_to_info?.avatar || null,
    is_overdue: t.is_overdue || false,
    isOverdue: t.is_overdue || false,
  });

  const sphereQuery = useQuery({
    queryKey: ["sphere", id],
    queryFn: () => getSphere(String(id)),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: () => {
      if (!id) return undefined;
      const direct = queryClient.getQueryData<any>(["sphere", id]);
      if (direct) return direct;
      const allSpheres = queryClient.getQueryData<any[]>(["spheres"]);
      const found = (allSpheres || []).find(
        (s: any) => String(s.id) === String(id) || s.slug === id || s.hash_id === id
      );
      if (found) return found;
      const userSpheres = queryClient.getQueryData<any[]>(["user-spheres"]);
      return (
        (userSpheres || []).find(
          (s: any) => String(s.id) === String(id) || s.slug === id || s.hash_id === id
        ) ?? undefined
      );
    },
  });

  const membersQuery = useQuery({
    queryKey: ["sphere-members", id],
    queryFn: () => listSphereMembers(String(id)),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const tasksQuery = useQuery({
    queryKey: ["sphere-tasks", id],
    queryFn: () => listSphereTasks(String(id)),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: false,
  });

  const filesQuery = useQuery({
    queryKey: ["sphere-files", id],
    queryFn: () => getSphereFiles(String(id)),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const isInitialLoading =
    sphereQuery.isLoading && !sphereQuery.data && !sphere;

  const loadSphereData = async () => {
    await Promise.all([
      sphereQuery.refetch(),
      membersQuery.refetch(),
      tasksQuery.refetch(),
      filesQuery.refetch(),
    ]);
  };

  useEffect(() => {
    if (!id) return;

    if (sphereQuery.error) {
      setLoadError((sphereQuery.error as any)?.message || "Erreur de chargement");
      return;
    }

    setLoadError(null);

    const sphereData = sphereQuery.data;
    const rawMembersData = membersQuery.data;
    if (!sphereData) return;

    setCurrentUserId(currentUser?.id ? String(currentUser.id) : null);
    setSphere(sphereData);

    const membersData: any[] = Array.isArray(rawMembersData)
      ? rawMembersData
      : Array.isArray((rawMembersData as any)?.data)
      ? (rawMembersData as any).data
      : Array.isArray((rawMembersData as any)?.results)
      ? (rawMembersData as any).results
      : [];

    const mappedMembers = (membersData || []).map((m: any) => ({
      id: String(m.id),
      userId: String(m.user_info?.id ?? m.user ?? ""),
      user_info: m.user_info,
      role: normalizeRole(m.role || m.role_display || "member"),
      status: m.status || "active",
      name:
        m.user_info?.name ||
        `${m.user_info?.first_name || ""} ${m.user_info?.last_name || ""}`.trim() ||
        "Unknown",
      username: m.user_info?.username || "unknown",
      avatar: m.user_info?.avatar || "/placeholder-avatar.jpg",
      isVerified: Boolean(m.user_info?.is_verified ?? m.user_info?.isVerified),
      isCreator: String(sphereData?.created_by_info?.id) === String(m.user_info?.id ?? m.user ?? ""),
    }));

    setMembers(mappedMembers.filter((m: any) => m.status === "active"));
    setPendingMembers(mappedMembers.filter((m: any) => m.status === "pending"));

    const isMemberFromServer = sphereData?.is_member ?? sphereData?.isMember ?? false;
    const membershipStatusFromServer =
      sphereData?.membership_status ?? sphereData?.membershipStatus ?? null;
    const currentUserMember = mappedMembers.find(
      (m: any) => m.userId && m.userId !== "" && String(m.userId) === String(currentUser?.id)
    );

    const resolvedIsMember =
      isMemberFromServer || Boolean(currentUserMember && currentUserMember.status === "active");
    const resolvedIsPending =
      membershipStatusFromServer === "pending" ||
      Boolean(currentUserMember && currentUserMember.status === "pending");

    setIsMember(resolvedIsMember);
    setIsPendingRequest(!resolvedIsMember && resolvedIsPending);

    if (tasksQuery.data) {
      setTasks((tasksQuery.data || []).map(mapTask));
      setTaskState("ready");
    } else if (tasksQuery.error) {
      const errStatus: number = Number(
        (tasksQuery.error as any)?.status ?? (tasksQuery.error as any)?.response?.status ?? 0
      );
      setTasks([]);
      setTaskState(errStatus === 403 ? "forbidden" : "server_error");
    }

    if (filesQuery.data) {
      setResources(filesQuery.data);
    } else if (filesQuery.error) {
      setResources([]);
    }
  }, [
    id,
    currentUser?.id,
    sphereQuery.data,
    sphereQuery.isLoading,
    sphereQuery.error,
    membersQuery.data,
    membersQuery.isLoading,
    membersQuery.error,
    tasksQuery.data,
    tasksQuery.error,
    filesQuery.data,
    filesQuery.error,
  ]);

  const sphereFallback = useMemo(
    () =>
      sphere || {
        id: id || "1",
        name: "Chargement...",
        description: "",
        objective: "",
        color: "from-blue-500 to-blue-600",
        memberCount: 0,
        tags: [],
        resourceCount: 0,
        progression: 0,
      },
    [sphere, id]
  );

  const canonicalSphereType = useMemo(
    () =>
      normalizeSphereType(
        sphere?.sphere_type ??
        sphere?.sphereType ??
        sphere?.type ??
        sphereFallback?.sphere_type ??
        sphereFallback?.sphereType ??
        sphereFallback?.type ??
        sphere?.category
      ),
    [
      sphere?.sphere_type,
      sphere?.sphereType,
      sphere?.type,
      sphereFallback?.sphere_type,
      sphereFallback?.sphereType,
      sphereFallback?.type,
      sphere?.category,
    ]
  );

  const sphereFeatures = useMemo(
    () => getSphereFeatures(canonicalSphereType),
    [canonicalSphereType]
  );

  const resolvedUserRole = useMemo(() => {
    if (!currentUserId) return "member";
    const member = members.find((m) => String(m.userId) === String(currentUserId));
    if (member) return normalizeRole(member.role);
    return normalizeRole(sphere?.user_role || sphere?.userRole);
  }, [currentUserId, members, sphere]);

  const canModerateMembers = resolvedUserRole === "admin" || resolvedUserRole === "moderator";

  // Tabs ordered strictly according to SPHERE_POLICY.md for each canonical type
  // Note: Membres is accessed via the dedicated Header button visible to all members
  const availableTabs = useMemo(() => {
    if (canonicalSphereType === "cours") {
      return [
        { id: "overview", label: t("detail.tabs.overview") },
        { id: "annonces", label: t("detail.tabs.announcements") },
        { id: "files", label: `${t("detail.tabs.files")} (${resources.length})` },
        { id: "chat", label: t("detail.tabs.chat") },
        { id: "sphera", label: t("detail.tabs.sphera") },
        ...(canModerateMembers ? [{ id: "pending", label: `${t("detail.tabs.pending")} (${pendingMembers.length})` }] : []),
      ];
    }
    if (canonicalSphereType === "projet") {
      return [
        { id: "overview", label: t("detail.tabs.overview") },
        { id: "tasks", label: `${t("detail.tabs.tasks")} (${tasks.length})` },
        { id: "files", label: `${t("detail.tabs.files")} (${resources.length})` },
        { id: "chat", label: t("detail.tabs.chat") },
        { id: "sphera", label: t("detail.tabs.sphera") },
        ...(canModerateMembers ? [{ id: "pending", label: `${t("detail.tabs.pending")} (${pendingMembers.length})` }] : []),
      ];
    }
    // communaute
    return [
      { id: "overview", label: t("detail.tabs.overview") },
      { id: "annonces", label: t("detail.tabs.announcements") },
      { id: "files", label: `${t("detail.tabs.files")} (${resources.length})` },
      { id: "chat", label: t("detail.tabs.chat") },
      ...(canModerateMembers ? [{ id: "pending", label: `${t("detail.tabs.pending")} (${pendingMembers.length})` }] : []),
    ];
  }, [
    canonicalSphereType,
    resources.length,
    tasks.length,
    pendingMembers.length,
    canModerateMembers,
    t,
  ]);

  useEffect(() => {
    const isValidTab =
      availableTabs.some((t) => t.id === activeTab) ||
      activeTab === "members" ||
      (canModerateMembers && activeTab === "pending");
    if (!isValidTab) {
      setActiveTab("overview");
    }
  }, [availableTabs, activeTab, canModerateMembers]);

  const sphereMemberCount = Math.max(sphere?.memberCount ?? 0, members.length);
  const membershipStateLabel = useMemo(() => {
    if (isMember) return t("detail.membership.member");
    if (isPendingRequest) return t("detail.membership.pending");
    return t("detail.membership.nonMember");
  }, [isMember, isPendingRequest, t]);

  const sphereCreatorId = useMemo(() => {
    const candidates = [
      sphere?.created_by_info?.id,
      sphere?.createdByInfo?.id,
      sphere?.created_by,
      sphere?.createdBy,
    ];
    const found = candidates.find((value) => value !== undefined && value !== null);
    return found ? String(found) : null;
  }, [sphere]);

  const canManageSphereSettings = Boolean(
    currentUserId && sphereCreatorId && String(currentUserId) === String(sphereCreatorId)
  );

  const handleJoinSphere = async () => {
    if (currentUser && !canPerformAction) {
      toast({
        title: t("detail.toasts.uncertifiedTitle"),
        description: t("detail.toasts.uncertifiedDesc"),
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            {t("detail.toasts.verifyAction")}
          </Button>
        ),
      });
      return;
    }
    setIsJoining(true);
    try {
      const res = await joinSphere(String(id));
      if (res?.data?.status === "pending") {
        setIsPendingRequest(true);
        setIsMember(false);
        toast({ title: t("detail.toasts.requestedTitle") });
      } else {
        setIsMember(true);
        setIsPendingRequest(false);
        await loadSphereData();
        toast({ title: t("detail.toasts.joinedTitle") });
      }
    } catch (e: any) {
      const joinConflict = resolveJoinConflict(e);
      if (joinConflict === "already_active") {
        setIsMember(true);
        setIsPendingRequest(false);
        toast({
          title: t("detail.toasts.alreadyMember"),
          description: t("detail.toasts.alreadyMemberDesc"),
        });
      } else if (joinConflict === "already_pending") {
        setIsMember(false);
        setIsPendingRequest(true);
        toast({
          title: t("detail.toasts.alreadyPending"),
          description: t("detail.toasts.alreadyPendingDesc"),
        });
      } else {
        setIsMember(false);
        setIsPendingRequest(false);
        toast({ title: t("detail.toasts.error"), description: e.message, variant: "destructive" });
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({ title: t("detail.toasts.taskDeleted") });
    } catch (e: any) {
      toast({ title: t("detail.toasts.error"), description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: true }));
      await removeSphereMember(String(id), memberId);
      await loadSphereData();
      toast({ title: t("detail.toasts.memberRemoved") });
    } catch (e: any) {
      toast({ title: t("detail.toasts.error"), description: e.message, variant: "destructive" });
    } finally {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: false }));
    }
  };

  const handleUpdateRole = async (memberId: string, currentRole: string) => {
    try {
      await updateSphereMember(String(id), memberId, {
        role: currentRole === "admin" ? "member" : "admin",
      });
      await loadSphereData();
    } catch (e: any) {
      toast({ title: t("detail.toasts.error"), description: e?.message, variant: "destructive" });
    }
  };

  const handleCancelRequest = async () => {
    setIsCancellingRequest(true);
    try {
      await cancelSphereJoinRequest(String(id));
      await loadSphereData();
      setIsPendingRequest(false);
      toast({ title: t("detail.toasts.requestCancelled") });
    } catch (e: any) {
      toast({ title: t("detail.toasts.error"), description: e.message, variant: "destructive" });
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const handleApproveRequest = async (memberId: string) => {
    try {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: true }));
      await updateSphereMember(String(id), memberId, { status: "active" });
      await loadSphereData();
      toast({ title: t("detail.toasts.memberApproved") });
    } catch (e: any) {
      toast({ title: t("detail.toasts.error"), description: e.message, variant: "destructive" });
    } finally {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: false }));
    }
  };

  const handleRejectRequest = async (memberId: string) => {
    try {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: true }));
      await removeSphereMember(String(id), memberId);
      setPendingMembers((prev) => prev.filter((m) => String(m.id) !== String(memberId)));
      toast({ title: t("detail.toasts.requestRejected") });
    } catch (e: any) {
      toast({ title: t("detail.toasts.error"), description: e.message, variant: "destructive" });
    } finally {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: false }));
    }
  };

  const handleSocialShare = (platform: string) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(t("detail.shareText", { name: sphere?.name }));

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
  };

  const handleCopyLink = async () => {
    if (isCopyingLink) return;
    setIsCopyingLink(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t("detail.toasts.linkCopied"), description: t("detail.toasts.linkCopiedDesc") });
    } catch {
      toast({ title: t("detail.toasts.error"), description: t("detail.toasts.copyLinkError"), variant: "destructive" });
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleDeleteFile = async (fileId: string | number) => {
    try {
      await deleteSphereFile(String(id), fileId);
      setResources((prev: any[]) => prev.filter((r: any) => r.id !== fileId));
      toast({ title: t("detail.toasts.fileDeleted") });
    } catch (e: any) {
      toast({ title: t("detail.toasts.error"), description: e?.message, variant: "destructive" });
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full campus-gradient animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {t("detail.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{t("detail.errorTitle")}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{loadError}</p>
        <Button onClick={() => window.location.reload()} className="campus-gradient text-white">
          {t("detail.retry")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        <Suspense fallback={null}>
          <ImageUploadModal
            isOpen={showBannerModal}
            onClose={() => setShowBannerModal(false)}
            onSave={async (file) => {
              if (!id) return;
              const res = await uploadSphereBanner(id, file);
              setSphere((prev: any) =>
                prev ? { ...prev, banner_image_url: res.banner_image_url } : prev
              );
              toast({ title: t("detail.bannerUpdated") });
            }}
            title={t("detail.bannerModalTitle")}
            description={t("detail.bannerModalDesc")}
            currentImage={sphereFallback.banner_image_url}
            shape="rect"
            aspectRatio={16 / 5}
          />
        </Suspense>

        <div className="max-w-6xl mx-auto py-4 md:py-6 px-0 md:px-4 space-y-4 md:space-y-6">
          <div className="px-4 md:px-0">
            <Button
              variant="ghost"
              onClick={() => navigate("/spheres")}
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" /> {t("detail.back")}
            </Button>
          </div>

          <SphereHeader
            sphere={sphere}
            sphereFallback={sphereFallback}
            sphereMemberCount={sphereMemberCount}
            filesCount={resources.length}
            isMember={isMember}
            isPendingRequest={isPendingRequest}
            isJoining={isJoining}
            isCancellingRequest={isCancellingRequest}
            isSharing={isSharing}
            membershipStateLabel={membershipStateLabel}
            canManageSphereSettings={canManageSphereSettings}
            canModerateMembers={canModerateMembers}
            membersCount={members.length}
            pendingMembersCount={pendingMembers.length}
            activeTab={activeTab}
            onOpenBannerModal={() => setShowBannerModal(true)}
            onJoinSphere={handleJoinSphere}
            onCancelRequest={handleCancelRequest}
            onShare={() => setShowShareModal(true)}
            onSelectTab={setActiveTab}
            onRefreshData={loadSphereData}
            onSphereDeleted={() => navigate("/spheres")}
          />

          {isMember ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 md:px-0">
                <SharedTabsList>
                  {availableTabs.map((tab) => (
                    <SharedTabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </SharedTabsTrigger>
                  ))}
                </SharedTabsList>
              </div>

              <div className="px-4 md:px-0">
                <TabsContent value="overview" forceMount className="mt-4 data-[state=inactive]:hidden">
                  <SphereOverview
                    sphereId={String(id)}
                    sphereType={canonicalSphereType}
                    objective={sphere?.objective || sphereFallback.objective}
                    targetAudience={sphere?.target_audience || sphere?.targetAudience}
                    duration={sphere?.duration}
                    onTabChange={setActiveTab}
                  />
                </TabsContent>

                <TabsContent value="chat" forceMount className="mt-4 data-[state=inactive]:hidden">
                  <MiniChat
                    sphereId={String(id)}
                    sphereName={sphereFallback.name}
                    sphereMembers={members}
                    isExpanded={isChatExpanded}
                    onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)}
                  />
                </TabsContent>

                {sphereFeatures.has_kanban && (
                  <TabsContent value="tasks" forceMount className="mt-4 data-[state=inactive]:hidden">
                    <SphereTasksTab
                      sphereId={String(id)}
                      hasKanban={sphereFeatures.has_kanban}
                      taskState={taskState}
                      tasks={tasks}
                      onTasksChange={setTasks}
                      onDeleteTask={handleTaskDelete}
                      canModerate={canModerateMembers}
                      isVerifiedUser={canPerformAction}
                      members={members}
                      onTaskCreated={loadSphereData}
                    />
                  </TabsContent>
                )}

                <TabsContent value="files" forceMount className="mt-4 data-[state=inactive]:hidden">
                  <SphereFilesTab
                    sphereId={String(id)}
                    resources={resources}
                    isLoading={filesQuery.isLoading}
                    canModerateMembers={canModerateMembers}
                    currentUserId={currentUserId}
                    onDeleteFile={handleDeleteFile}
                    onFileUploaded={async () => {
                      const updated: any[] = await getSphereFiles(String(id)).catch((): any[] => []);
                      setResources(updated);
                      void filesQuery.refetch();
                    }}
                  />
                </TabsContent>

                <TabsContent value="members" forceMount className="mt-4 data-[state=inactive]:hidden">
                  <div className="mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("overview")}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> {t("detail.backToOverview")}
                    </Button>
                  </div>
                  <SphereMembersTab
                    members={members}
                    canModerateMembers={canModerateMembers}
                    currentUserId={currentUserId}
                    onUpdateRole={handleUpdateRole}
                    onRemoveMember={handleRemoveMember}
                  />
                </TabsContent>

                {canModerateMembers && (
                  <TabsContent value="pending" forceMount className="mt-4 data-[state=inactive]:hidden">
                    <SpherePendingMembersTab
                      pendingMembers={pendingMembers}
                      processingMemberIds={processingMemberIds}
                      onApprove={handleApproveRequest}
                      onReject={handleRejectRequest}
                    />
                  </TabsContent>
                )}

                {sphereFeatures.has_sphera && (
                  <TabsContent value="sphera" forceMount className="mt-4 data-[state=inactive]:hidden">
                    <SphereSpheraTab
                      sphereId={String(id)}
                      sphereType={canonicalSphereType}
                      onTabChange={setActiveTab}
                    />
                  </TabsContent>
                )}

                {sphereFeatures.has_announcements && (
                  <TabsContent value="annonces" forceMount className="mt-4 data-[state=inactive]:hidden">
                    <AnnouncementsTab
                      sphereId={String(id)}
                      canModerate={canModerateMembers}
                    />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          ) : (
            <EmptyState
              icon={Shield}
              title={t("detail.protectedTitle")}
              description={
                isPendingRequest
                  ? t("detail.protectedPendingDesc")
                  : t("detail.protectedNonMemberDesc")
              }
              actionLabel={!isPendingRequest ? t("detail.joinSphere") : undefined}
              onAction={!isPendingRequest ? handleJoinSphere : undefined}
              className="mx-4 md:mx-0"
            />
          )}
        </div>
      </div>

      <SphereShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        onSocialShare={handleSocialShare}
        onCopyLink={handleCopyLink}
        isCopyingLink={isCopyingLink}
      />
    </>
  );
}

export default SphereDetail;
