import { Suspense, lazy, useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft, AlertCircle, Shield } from "lucide-react";
import { getSphereFeatures } from "@/config/sphereFeatures";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { useAuth } from "@/contexts/AuthContext";
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [sphere, setSphere] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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

  const [loading, setLoading] = useState<boolean>(true);
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
  });

  const membersQuery = useQuery({
    queryKey: ["sphere-members", id],
    queryFn: () => listSphereMembers(String(id)),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });

  const tasksQuery = useQuery({
    queryKey: ["sphere-tasks", id],
    queryFn: () => listSphereTasks(String(id)),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    retry: false,
  });

  const filesQuery = useQuery({
    queryKey: ["sphere-files", id],
    queryFn: () => getSphereFiles(String(id)),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });

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

    const isFetchingMain = sphereQuery.isLoading || membersQuery.isLoading;
    if (isFetchingMain) {
      setLoading(true);
      return;
    }

    if (sphereQuery.error) {
      setLoadError((sphereQuery.error as any)?.message || "Erreur de chargement");
      setLoading(false);
      return;
    }

    setLoading(false);
    setLoadError(null);

    const sphereData = sphereQuery.data;
    const rawMembersData = membersQuery.data;

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

  const sphereFeatures = useMemo(
    () => getSphereFeatures(sphere?.sphere_type),
    [sphere?.sphere_type]
  );

  const sphereMemberCount = Math.max(sphere?.memberCount ?? 0, members.length);
  const membershipStateLabel = useMemo(() => {
    if (isMember) return "Membre";
    if (isPendingRequest) return "Demande en attente";
    return "Non membre";
  }, [isMember, isPendingRequest]);

  const resolvedUserRole = useMemo(() => {
    if (!currentUserId) return "member";
    const member = members.find((m) => String(m.userId) === String(currentUserId));
    if (member) return normalizeRole(member.role);
    return normalizeRole(sphere?.user_role || sphere?.userRole);
  }, [currentUserId, members, sphere]);

  const canModerateMembers = resolvedUserRole === "admin" || resolvedUserRole === "moderator";

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
    if (currentUser && !currentUser.isVerified) {
      toast({
        title: "Compte non certifié",
        description: "Vous devez être certifié pour rejoindre une sphère.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            Vérifier
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
        toast({ title: "Demande envoyée" });
      } else {
        setIsMember(true);
        setIsPendingRequest(false);
        await loadSphereData();
        toast({ title: "Bienvenue dans la sphère !" });
      }
    } catch (e: any) {
      const joinConflict = resolveJoinConflict(e);
      if (joinConflict === "already_active") {
        setIsMember(true);
        setIsPendingRequest(false);
        toast({
          title: "Déjà membre",
          description: "Vous êtes déjà membre actif de cette sphère.",
        });
      } else if (joinConflict === "already_pending") {
        setIsMember(false);
        setIsPendingRequest(true);
        toast({
          title: "Demande déjà en attente",
          description: "Votre demande d'adhésion est déjà en cours de validation.",
        });
      } else {
        setIsMember(false);
        setIsPendingRequest(false);
        toast({ title: "Erreur", description: e.message, variant: "destructive" });
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast({ title: "Tâche supprimée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: true }));
      await removeSphereMember(String(id), memberId);
      await loadSphereData();
      toast({ title: "Membre retiré" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
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
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    }
  };

  const handleCancelRequest = async () => {
    setIsCancellingRequest(true);
    try {
      await cancelSphereJoinRequest(String(id));
      await loadSphereData();
      setIsPendingRequest(false);
      toast({ title: "Demande annulée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsCancellingRequest(false);
    }
  };

  const handleApproveRequest = async (memberId: string) => {
    try {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: true }));
      await updateSphereMember(String(id), memberId, { status: "active" });
      await loadSphereData();
      toast({ title: "Membre approuvé" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: false }));
    }
  };

  const handleRejectRequest = async (memberId: string) => {
    try {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: true }));
      await removeSphereMember(String(id), memberId);
      setPendingMembers((prev) => prev.filter((m) => String(m.id) !== String(memberId)));
      toast({ title: "Demande rejetée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setProcessingMemberIds((p) => ({ ...p, [memberId]: false }));
    }
  };

  const handleSocialShare = (platform: string) => {
    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`Rejoins ma sphère "${sphere?.name}" sur CampusSphere !`);

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
      toast({ title: "Lien copié !", description: "Le lien de la sphère a été copié." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier le lien.", variant: "destructive" });
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleDeleteFile = async (fileId: string | number) => {
    try {
      await deleteSphereFile(String(id), fileId);
      setResources((prev: any[]) => prev.filter((r: any) => r.id !== fileId));
      toast({ title: "Fichier supprimé" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    }
  };

  if (loading) {
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
            Chargement de votre sphère...
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
        <h2 className="text-2xl font-bold mb-2">Oups ! Une erreur est survenue</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{loadError}</p>
        <Button onClick={() => window.location.reload()} className="campus-gradient text-white">
          Réessayer
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
              toast({ title: "Bannière mise à jour !" });
            }}
            title="Photo de couverture de la sphère"
            description="Téléchargez une nouvelle bannière pour cette sphère."
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
              <ArrowLeft className="h-4 w-4" /> Retour
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
                  <SharedTabsTrigger value="overview">Vue d'ensemble</SharedTabsTrigger>
                  <SharedTabsTrigger value="chat">Discussion</SharedTabsTrigger>
                  {sphereFeatures.has_kanban && (
                    <SharedTabsTrigger value="tasks">
                      Tâches ({tasks.length})
                    </SharedTabsTrigger>
                  )}
                  <SharedTabsTrigger value="files">
                    Fichiers ({resources.length})
                  </SharedTabsTrigger>
                  {sphereFeatures.has_sphera && (
                    <SharedTabsTrigger value="sphera">Sphera</SharedTabsTrigger>
                  )}
                  {sphereFeatures.has_announcements && (
                    <SharedTabsTrigger value="annonces">Annonces</SharedTabsTrigger>
                  )}
                  <SharedTabsTrigger value="members" className="hidden md:flex">
                    Membres
                  </SharedTabsTrigger>
                  {canModerateMembers && (
                    <SharedTabsTrigger value="pending" className="hidden md:flex">
                      Demandes ({pendingMembers.length})
                    </SharedTabsTrigger>
                  )}
                </SharedTabsList>
              </div>

              <div className="px-4 md:px-0">
                <TabsContent value="overview" className="mt-4">
                  <SphereOverview
                    sphereId={String(id)}
                    sphereType={sphere?.sphere_type}
                    objective={sphere?.objective || sphereFallback.objective}
                    onTabChange={setActiveTab}
                  />
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                  <MiniChat
                    sphereId={String(id)}
                    sphereName={sphereFallback.name}
                    isExpanded={isChatExpanded}
                    onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)}
                  />
                </TabsContent>

                <TabsContent value="tasks" className="mt-4">
                  <SphereTasksTab
                    sphereId={String(id)}
                    hasKanban={sphereFeatures.has_kanban}
                    taskState={taskState}
                    tasks={tasks}
                    onTasksChange={setTasks}
                    onDeleteTask={handleTaskDelete}
                    canModerate={canModerateMembers}
                    isVerifiedUser={Boolean(currentUser?.isVerified)}
                    members={members}
                    onTaskCreated={loadSphereData}
                  />
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                  <SphereFilesTab
                    sphereId={String(id)}
                    resources={resources}
                    canModerateMembers={canModerateMembers}
                    currentUserId={currentUserId}
                    onDeleteFile={handleDeleteFile}
                    onFileUploaded={() =>
                      getSphereFiles(String(id)).then(setResources).catch((): void => {})
                    }
                  />
                </TabsContent>

                <TabsContent value="members" className="mt-4">
                  <SphereMembersTab
                    members={members}
                    canModerateMembers={canModerateMembers}
                    currentUserId={currentUserId}
                    onUpdateRole={handleUpdateRole}
                    onRemoveMember={handleRemoveMember}
                  />
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                  <SpherePendingMembersTab
                    pendingMembers={pendingMembers}
                    processingMemberIds={processingMemberIds}
                    onApprove={handleApproveRequest}
                    onReject={handleRejectRequest}
                  />
                </TabsContent>

                {sphereFeatures.has_sphera && (
                  <TabsContent value="sphera" className="mt-4">
                    <SphereSpheraTab sphereId={String(id)} />
                  </TabsContent>
                )}

                {sphereFeatures.has_announcements && (
                  <TabsContent value="annonces" className="mt-4">
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
              title="Contenu Protégé"
              description={
                isPendingRequest
                  ? "Votre demande est en attente. Vous pourrez accéder au contenu dès qu'un administrateur l'aura validée."
                  : "Rejoignez cette sphère pour accéder au chat, aux tâches et aux fichiers partagés."
              }
              actionLabel={!isPendingRequest ? "Rejoindre la sphère" : undefined}
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
