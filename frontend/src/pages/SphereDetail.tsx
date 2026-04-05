import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getSphere, listSphereMembers, listSphereTasks, joinSphere, 
  cancelSphereJoinRequest, getCurrentUser, completeTask, 
  updateSphereMember, removeSphereMember, uploadSphereBanner, getSphereResources 
} from "@/services/api";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { 
  ArrowLeft, Users, FileText, Settings, UserPlus, Share2, MoreVertical, 
  Loader2, Plus, Check, Clock, Calendar, Zap, Crown, Shield, User, 
  UserMinus, UserCheck, UserX, Camera, ExternalLink, Download 
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useToast } from "@/hooks/use-toast";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { AddMemberModal } from "@/components/modals/AddMemberModal";
import { SphereSettingsModal } from "@/components/modals/SphereSettingsModal";
import { ManageMembersModal } from "@/components/modals/ManageMembersModal";
import { MiniChat } from "@/components/chat/MiniChat";
import { KanbanBoard, type KanbanTask } from "@/components/kanban/KanbanBoard";
import { SphereOverview } from "@/components/sphere/SphereOverview";
import { SphereUploadResourceModal } from "@/components/modals/SphereUploadResourceModal";

export function SphereDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ==================== STATE ====================
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

  // ==================== HELPERS ====================
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
    kanban_status: t.kanban_status || (t.is_completed ? 'done' : 'todo'),
    priority: t.priority || 'medium',
    due_date: t.due_date || null,
    is_completed: t.is_completed || false,
    isCompleted: t.is_completed || false,
    impact_points: t.impact_points || 0,
    impactPoints: t.impact_points || 0,
    assigned_to_info: t.assigned_to_info || null,
    assignedTo: t.assigned_to_info?.name ||
      `${t.assigned_to_info?.first_name || ''} ${t.assigned_to_info?.last_name || ''}`.trim() || 'Non assigné',
    assignedToAvatar: t.assigned_to_info?.avatar || null,
    is_overdue: t.is_overdue || false,
    isOverdue: t.is_overdue || false,
  });

  // ==================== DATA LOADING ====================
  const loadSphereData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      setTaskState("ready");

      const [sphereData, rawMembersData, currentUser] = await Promise.all([
        getSphere(String(id)),
        listSphereMembers(String(id)),
        getCurrentUser(),
      ]);
      // listSphereMembers retourne apiFetch<any[]> sans unwrap — normaliser ici
      const membersData: any[] = Array.isArray(rawMembersData)
        ? rawMembersData
        : Array.isArray((rawMembersData as any)?.data)
          ? (rawMembersData as any).data
          : Array.isArray((rawMembersData as any)?.results)
            ? (rawMembersData as any).results
            : [];

      setCurrentUserId(currentUser?.id ? String(currentUser.id) : null);
      setSphere(sphereData);

      const mappedMembers = (membersData || []).map((m: any) => ({
        id: String(m.id),           // ID de la ligne SphereMember (pour les actions API)
        userId: String(m.user_info?.id ?? m.user ?? ""), // ID utilisateur (pour les comparaisons)
        user_info: m.user_info,
        role: normalizeRole(m.role || m.role_display || 'member'),
        status: m.status || 'active',
        name: m.user_info?.name || `${m.user_info?.first_name || ''} ${m.user_info?.last_name || ''}`.trim() || 'Unknown',
        username: m.user_info?.username || 'unknown',
        avatar: m.user_info?.avatar || '/placeholder-avatar.jpg',
        isCreator: String(sphereData?.created_by_info?.id) === String(m.user_info?.id ?? m.user ?? ""),
      }));

      setMembers(mappedMembers.filter((m: any) => m.status === 'active'));
      setPendingMembers(mappedMembers.filter((m: any) => m.status === 'pending'));
      setTasks([]);

      // Membership state logic
      const isMemberFromServer = sphereData?.is_member ?? sphereData?.isMember ?? false;
      const membershipStatusFromServer = sphereData?.membership_status ?? sphereData?.membershipStatus ?? null;
      const currentUserMember = mappedMembers.find(
        (m: any) => m.userId && m.userId !== "" && String(m.userId) === String(currentUser?.id)
      );

      const resolvedIsMember =
        isMemberFromServer ||
        Boolean(currentUserMember && currentUserMember.status === 'active');

      const resolvedIsPending =
        membershipStatusFromServer === 'pending' ||
        Boolean(currentUserMember && currentUserMember.status === 'pending');

      setIsMember(resolvedIsMember);
      setIsPendingRequest(!resolvedIsMember && resolvedIsPending);

      try {
        const tasksData = await listSphereTasks(String(id));
        setTasks((tasksData || []).map(mapTask));
        setTaskState("ready");
      } catch (taskError: any) {
        // ApiRequestError (apiFetch) expose .status directement, pas .response.status
        const errStatus: number = Number(taskError?.status ?? taskError?.response?.status ?? 0);
        setTasks([]);
        setTaskState(errStatus === 403 ? "forbidden" : "server_error");
      }

      // Ressources de la sphère
      getSphereResources(String(id)).then(setResources).catch(() => setResources([]));
    } catch (e: any) {
      setLoadError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void loadSphereData();
  }, [id]);

  // ==================== COMPUTED ====================
  const sphereFallback = useMemo(() => sphere || {
    id: id || "1",
    name: "Chargement...",
    description: "",
    objective: "",
    color: "from-blue-500 to-blue-600",
    memberCount: 0,
    tags: [],
    resourceCount: 0,
    progression: 0,
  }, [sphere, id]);

  const sphereProgress = useMemo(() => {
    if (sphere?.progression !== undefined && sphere?.progression !== null) {
      const value = Number(sphere.progression);
      if (!Number.isNaN(value)) return Math.max(0, Math.min(100, value));
    }
    if (tasks.length > 0) {
      const done = tasks.filter((t) => t.isCompleted).length;
      return Math.round((done / tasks.length) * 100);
    }
    return 0;
  }, [sphere, tasks]);

  const sphereMemberCount = sphere?.memberCount ?? members.length;
  const sphereFileCount = sphere?.resourceCount ?? sphere?.filesCount ?? 0;
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
  const canMarkTaskComplete = (task: any) => {
    if (!currentUserId) return false;
    if (canModerateMembers) return true;
    return String(task.assignedToId) === String(currentUserId);
  };
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


  // ==================== HANDLERS ====================
  const handleJoinSphere = async () => {
    setIsJoining(true);
    try {
      const res = await joinSphere(String(id));
      if (res?.data?.status === 'pending') {
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
    } finally { setIsJoining(false); }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: true, status: 'done' } : t));
      toast({ title: "Tâche accomplie !" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setProcessingMemberIds(p => ({ ...p, [memberId]: true }));
      await removeSphereMember(String(id), memberId);
      await loadSphereData();
      toast({ title: "Membre retiré" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setProcessingMemberIds(p => ({ ...p, [memberId]: false }));
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
      setProcessingMemberIds(p => ({ ...p, [memberId]: true }));
      await updateSphereMember(String(id), memberId, { status: "active" });
      await loadSphereData();
      toast({ title: "Membre approuvé" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setProcessingMemberIds(p => ({ ...p, [memberId]: false })); }
  };

  const handleRejectRequest = async (memberId: string) => {
    try {
      setProcessingMemberIds(p => ({ ...p, [memberId]: true }));
      await removeSphereMember(String(id), memberId);
      setPendingMembers(prev => prev.filter(m => String(m.id) !== String(memberId)));
      toast({ title: "Demande rejetée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally { setProcessingMemberIds(p => ({ ...p, [memberId]: false })); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsSharing(true);
    setTimeout(() => setIsSharing(false), 2000);
    toast({ title: "Lien copié !" });
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="max-w-6xl mx-auto py-4 md:py-6 px-0 md:px-4 space-y-4 md:space-y-6">
        <div className="px-4 md:px-0">
          <Button variant="ghost" onClick={() => navigate("/spheres")} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </div>

        {/* HEADER SECTION */}
        <div className="overflow-hidden md:rounded-xl border-y md:border bg-card shadow-sm">
          <div className="relative h-36 md:h-48 group">
            {sphere?.banner_image_url ? (
              <img
                src={sphere.banner_image_url}
                alt="Bannière"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${sphereFallback.color?.startsWith('from-') ? '#6366f1, #8b5cf6' : (sphereFallback.color || '#6366f1') + ', ' + (sphereFallback.color || '#8b5cf6')})` }}
              >
                <h1 className="text-white font-bold text-2xl md:text-4xl drop-shadow-lg px-4 text-center">{sphereFallback.name}</h1>
              </div>
            )}
            {/* Overlay titre sur image */}
            {sphere?.banner_image_url && (
              <div className="absolute inset-0 bg-black/40 flex items-end p-4">
                <h1 className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg">{sphereFallback.name}</h1>
              </div>
            )}
            {/* Bouton upload bannière */}
            {canManageSphereSettings && (
              <label className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-lg px-2 py-1.5 flex items-center gap-1.5 text-xs cursor-pointer transition-colors opacity-0 group-hover:opacity-100">
                <Camera className="h-3.5 w-3.5" />
                Changer la bannière
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !id) return;
                    try {
                      const res = await uploadSphereBanner(id, file);
                      setSphere((prev: any) => prev ? { ...prev, banner_image_url: res.banner_image_url } : prev);
                      toast({ title: "Bannière mise à jour !" });
                    } catch (err: any) {
                      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>

          <div className="p-4 md:p-6 space-y-4">
            {/* Description + stats */}
              <div className="space-y-3">
              <p className="text-sm md:text-base text-muted-foreground">{sphereFallback.description}</p>
              <div className="flex flex-wrap gap-3 text-sm font-medium">
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> {sphereMemberCount} membres</span>
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> {resources.length} fichiers</span>
                {(sphere?.tags || sphereFallback.tags || []).map((tag: string) => (
                  <Badge key={tag} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Badge variant={isMember ? "default" : isPendingRequest ? "secondary" : "outline"} className="w-fit">
                {membershipStateLabel}
              </Badge>
              <div className="flex flex-wrap gap-2">
                {isMember ? (
                  <>
                    {canManageSphereSettings && (
                      <SphereSettingsModal sphereData={sphereFallback} onSettingsUpdated={loadSphereData} onSphereDeleted={() => navigate("/spheres")}>
                        <Button variant="outline" size="sm" className="gap-2"><Settings className="h-4 w-4" /> Paramètres</Button>
                      </SphereSettingsModal>
                    )}
                    {canModerateMembers && (
                      <ManageMembersModal sphereId={sphereFallback.id} sphereName={sphereFallback.name}>
                        <Button variant="outline" size="sm" className="gap-2"><Users className="h-4 w-4" /> Équipe</Button>
                      </ManageMembersModal>
                    )}
                    {canModerateMembers && (
                      <AddMemberModal sphereId={sphereFallback.id} sphereName={sphereFallback.name} onMemberAdded={loadSphereData}>
                        <Button variant="outline" size="sm" className="gap-2"><UserPlus className="h-4 w-4" /> Inviter</Button>
                      </AddMemberModal>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleJoinSphere}
                      disabled={isPendingRequest || isJoining || isCancellingRequest}
                      className="campus-gradient text-white font-bold gap-2"
                    >
                      {isJoining && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isPendingRequest ? "Demande en attente" : "Rejoindre la Sphère"}
                    </Button>
                    {isPendingRequest && (
                      <Button onClick={handleCancelRequest} disabled={isCancellingRequest} variant="outline" size="sm">
                        {isCancellingRequest && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                        Annuler la demande
                      </Button>
                    )}
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={handleShare} disabled={isSharing} className="gap-2">
                  {isSharing ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                  Partager
                </Button>
                {/* Bouton options mobile pour membres/demandes */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden gap-1">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setActiveTab("members")}>
                      <Users className="h-4 w-4 mr-2" /> Membres ({members.length})
                    </DropdownMenuItem>
                    {canModerateMembers && (
                      <DropdownMenuItem onClick={() => setActiveTab("pending")}>
                        <UserCheck className="h-4 w-4 mr-2" /> Demandes ({pendingMembers.length})
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* TABS SECTION */}
        {isMember ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 md:px-0">
              <SharedTabsList>
                <SharedTabsTrigger value="overview">Vue d'ensemble</SharedTabsTrigger>
                <SharedTabsTrigger value="chat">Discussion</SharedTabsTrigger>
                <SharedTabsTrigger value="tasks">Tâches ({tasks.length})</SharedTabsTrigger>
                <SharedTabsTrigger value="files">Fichiers ({resources.length})</SharedTabsTrigger>
                <SharedTabsTrigger value="members" className="hidden md:flex">Membres</SharedTabsTrigger>
                {canModerateMembers && <SharedTabsTrigger value="pending" className="hidden md:flex">Demandes ({pendingMembers.length})</SharedTabsTrigger>}
              </SharedTabsList>
            </div>

            <div className="px-4 md:px-0">
              <TabsContent value="overview" className="mt-4">
                <SphereOverview sphereId={String(id)} onTabChange={setActiveTab} />
              </TabsContent>

              <TabsContent value="chat" className="mt-4">
                <MiniChat sphereId={String(id)} sphereName={sphereFallback.name} isExpanded={isChatExpanded} onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)} />
              </TabsContent>

              <TabsContent value="tasks" className="mt-4">
                <div className="flex justify-between items-center bg-card p-3 md:p-4 rounded-lg border mb-4">
                  <h3 className="font-bold">Tableau Kanban</h3>
                  <CreateTaskModal onTaskCreated={loadSphereData} sphereId={String(id)} sphereMembers={members}>
                    <Button size="sm" className="campus-gradient text-white"><Plus className="mr-1 h-4 w-4" /> Tâche</Button>
                  </CreateTaskModal>
                </div>
                {taskState === "forbidden" && <p className="text-center py-10 text-muted-foreground italic">Vous devez être membre actif pour voir les tâches</p>}
                {taskState === "server_error" && <p className="text-center py-10 text-muted-foreground italic">Impossible de charger les tâches.</p>}
                {taskState === "ready" && <KanbanBoard tasks={tasks} onTasksChange={setTasks} onCreateTask={() => {}} canModerate={canModerateMembers} />}
              </TabsContent>

              <TabsContent value="files" className="mt-4 space-y-4">
                <div className="flex justify-between items-center bg-card p-3 md:p-4 rounded-lg border">
                  <h3 className="font-bold">Fichiers partagés ({resources.length})</h3>
                  <SphereUploadResourceModal sphereId={String(id)} onUploaded={() => getSphereResources(String(id)).then(setResources).catch(() => null)}>
                    <Button size="sm" className="campus-gradient text-white gap-1">
                      <Plus className="h-4 w-4" /> Partager
                    </Button>
                  </SphereUploadResourceModal>
                </div>

                {resources.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun fichier partagé pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resources.map((res: any) => {
                      const fileInfo = res.file_info || res.fileInfo;
                      const fileUrl = fileInfo?.url || res.file_url || res.fileUrl || res.file || "";
                      const fileName = fileInfo?.name || res.title || "Fichier";
                      const fileType = fileInfo?.type || res.file_type || "";
                      const fileSize = fileInfo?.size || res.file_size || 0;
                      const isImage = fileType.startsWith("image/");
                      const isPdf = fileType === "application/pdf" || fileName.endsWith(".pdf");
                      const authorName = res.author?.name || res.author_info?.name || "";
                      const createdAt = res.createdAt || res.created_at;

                      return (
                        <div key={res.id} className="border rounded-xl bg-card overflow-hidden">
                          {/* Preview image */}
                          {isImage && fileUrl && (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                              <img src={fileUrl} alt={fileName} className="w-full max-h-48 object-cover" />
                            </a>
                          )}
                          {/* Preview PDF inline */}
                          {isPdf && fileUrl && (
                            <div className="bg-muted/30 p-2">
                              <iframe
                                src={`${fileUrl}#toolbar=0&view=FitH`}
                                className="w-full h-48 rounded border"
                                title={fileName}
                              />
                            </div>
                          )}
                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{res.title || fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {authorName && <span>{authorName} · </span>}
                                  {fileSize > 0 && <span>{(fileSize / 1024 / 1024).toFixed(1)} MB · </span>}
                                  {createdAt && <span>{new Date(createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {fileUrl && (
                                <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              {fileUrl && (
                                <Button size="sm" variant="ghost" asChild className="h-8 w-8 p-0">
                                  <a href={fileUrl} download={fileName} title="Télécharger">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="members" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {members.map(m => (
                  <div key={m.id} className="p-3 border rounded-xl flex justify-between items-center bg-card">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage src={m.avatar}/><AvatarFallback>{m.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm flex items-center gap-1">
                          {m.name} {m.isCreator && <Crown className="h-3 w-3 text-yellow-500" />}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{m.role}</p>
                      </div>
                    </div>
                    {canModerateMembers && !m.isCreator && m.userId && String(m.userId) !== String(currentUserId) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => updateSphereMember(String(id), m.id, { role: m.role === 'admin' ? 'member' : 'admin' }).then(loadSphereData).catch((e: any) => toast({ title: "Erreur", description: e?.message, variant: "destructive" }))}>
                            {m.role === 'admin' ? 'Retirer Admin' : 'Nommer Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 font-medium" onClick={() => handleRemoveMember(m.id)}>Retirer de la sphère</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="pending" className="space-y-3 mt-4">
                {pendingMembers.length === 0 && <p className="text-center py-10 text-muted-foreground italic">Aucune demande en attente.</p>}
                {pendingMembers.map(m => (
                  <div key={m.id} className="p-3 border rounded-xl bg-card">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarImage src={m.avatar} /></Avatar>
                        <div>
                          <p className="font-bold text-sm">{m.name}</p>
                          <Badge variant="secondary" className="text-xs">En attente</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => handleApproveRequest(m.id)} disabled={processingMemberIds[m.id]}>
                          <UserCheck className="h-4 w-4" /><span className="hidden sm:inline">Approuver</span>
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600 gap-1" onClick={() => handleRejectRequest(m.id)} disabled={processingMemberIds[m.id]}>
                          <UserX className="h-4 w-4" /><span className="hidden sm:inline">Rejeter</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="mx-4 md:mx-0 flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-dashed border-primary/30">
            <Shield className="h-14 w-14 text-primary/20 mb-4" />
            <h2 className="text-lg font-bold">Contenu Protégé</h2>
            <p className="text-muted-foreground mt-2 text-center max-w-sm px-4 text-sm">
              {isPendingRequest
                ? "Votre demande est en attente. Vous pourrez voir les tâches après validation."
                : "Rejoignez cette sphère pour accéder au chat, aux tâches et aux fichiers partagés."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
