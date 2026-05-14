import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSphere, listSphereMembers, listSphereTasks, joinSphere,
  cancelSphereJoinRequest, getCurrentUser, completeTask,
  updateSphereMember, removeSphereMember, uploadSphereBanner, getSphereFiles, deleteSphereFile
} from "@/services/api";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import {
  Users, FileText, Settings, Check, MoreVertical, Loader2, Plus, Shield, Crown, UserPlus, UserMinus, UserCheck, UserX, Camera, ExternalLink, Download, Info, X, Copy, Share, ArrowLeft, Share2, BadgeCheck, AlertCircle, Search
} from "lucide-react";
import { FaFacebook, FaTwitter, FaWhatsapp, FaLinkedin } from 'react-icons/fa';


import { renderMentionText } from "@/lib/mentions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getSphereFeatures, SPHERE_TYPE_LABELS, SPHERE_TYPE_COLORS, type SphereType } from "@/config/sphereFeatures";
import { SphereSpheraTab } from "@/components/sphere/SphereSpheraTab";
import { AnnouncementsTab } from "@/components/sphere/AnnouncementsTab";


import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { AddMemberModal } from "@/components/modals/AddMemberModal";
import { SphereSettingsModal } from "@/components/modals/SphereSettingsModal";
import { ManageMembersModal } from "@/components/modals/ManageMembersModal";
import { MiniChat } from "@/components/chat/MiniChat";
import { KanbanBoard, type KanbanTask } from "@/components/kanban/KanbanBoard";
import { SphereOverview } from "@/components/sphere/SphereOverview";
import { SphereUploadResourceModal } from "@/components/modals/SphereUploadResourceModal";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceSkeleton } from "@/components/ui/skeletons";

export function SphereDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // ==================== STATE ====================
  const [sphere, setSphere] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
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
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [fileSearchQuery, setFileSearchQuery] = useState("");


  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<"ready" | "forbidden" | "server_error">("ready");
  const [processingMemberIds, setProcessingMemberIds] = useState<Record<string, boolean>>({});

  const filteredResources = useMemo(() => {
    if (!fileSearchQuery.trim()) return resources;
    const query = fileSearchQuery.toLowerCase();
    return resources.filter(res => 
      (res.title || "Fichier").toLowerCase().includes(query)
    );
  }, [resources, fileSearchQuery]);

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

      const [sphereData, rawMembersData, userData] = await Promise.all([
        getSphere(String(id)),
        listSphereMembers(String(id)),
        getCurrentUser(),
      ]);

      setCurrentUser(userData);
      setCurrentUserId(userData?.id ? String(userData.id) : null);
      setSphere(sphereData);

      // listSphereMembers retourne apiFetch<any[]> sans unwrap — normaliser ici
      const membersData: any[] = Array.isArray(rawMembersData)
        ? rawMembersData
        : Array.isArray((rawMembersData as any)?.data)
          ? (rawMembersData as any).data
          : Array.isArray((rawMembersData as any)?.results)
            ? (rawMembersData as any).results
            : [];

      setCurrentUserId(userData?.id ? String(userData.id) : null);
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
        isVerified: Boolean(m.user_info?.is_verified ?? m.user_info?.isVerified),
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
      getSphereFiles(String(id)).then(setResources).catch(() => setResources([]));
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

  // Features dynamiques selon le type de la sphère
  const sphereFeatures = useMemo(
    () => getSphereFeatures(sphere?.sphere_type),
    [sphere?.sphere_type]
  );

  const sphereMemberCount = Math.max(sphere?.memberCount ?? 0, members.length);
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
    if (currentUser && !currentUser.isVerified) {
      toast({
        title: "Compte non certifié",
        description: "Vous devez être certifié pour rejoindre une sphère.",
        variant: "destructive",
        action: (
          <VerificationModal>
            <Button variant="outline" size="sm">Vérifier</Button>
          </VerificationModal>
        )
      });
      return;
    }
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

  const handleTaskDelete = async (taskId: string) => {
    try {
      const { deleteTask } = await import("@/services/api");
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({ title: "Tâche supprimée" });
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
    setShowShareModal(true);
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


  // ==================== RENDER ====================
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
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Chargement de votre sphère...</p>
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
                <OptimizedImage
                  src={sphere.banner_image_url}
                  alt="Bannière"
                  className="w-full h-full object-cover"
                  containerClassName="w-full h-full absolute inset-0"
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
                <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">{renderMentionText(sphereFallback.description)}</p>

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
                <div className="flex flex-wrap items-center gap-2">
                  {/* Badge de type */}
                  {sphere?.sphere_type && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${SPHERE_TYPE_COLORS[sphere.sphere_type as SphereType] ?? 'bg-muted text-muted-foreground border-border'}`}>
                      {SPHERE_TYPE_LABELS[sphere.sphere_type as SphereType] ?? sphere.sphere_type}
                    </span>
                  )}
                  <Badge variant={isMember ? "default" : isPendingRequest ? "secondary" : "outline"} className="w-fit">
                    {membershipStateLabel}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isMember ? (
                    <>
                      {canManageSphereSettings && (
                        <SphereSettingsModal sphereData={sphereFallback} onSettingsUpdated={loadSphereData} onSphereDeleted={() => navigate("/spheres")}>
                          <Button variant="outline" size="sm" className="gap-2"><Settings className="h-4 w-4" /> <span className="hidden sm:inline">Paramètres</span></Button>
                        </SphereSettingsModal>
                      )}
                      {canModerateMembers && (
                        <ManageMembersModal sphereId={sphereFallback.id} sphereName={sphereFallback.name}>
                          <Button variant="outline" size="sm" className="gap-2"><Users className="h-4 w-4" /> <span className="hidden sm:inline">Équipe</span></Button>
                        </ManageMembersModal>
                      )}
                      {canModerateMembers && (
                        <AddMemberModal sphereId={sphereFallback.id} sphereName={sphereFallback.name} onMemberAdded={loadSphereData}>
                          <Button variant="outline" size="sm" className="gap-2"><UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Inviter</span></Button>
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
                        {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isPendingRequest ? "Demande en attente" : "Rejoindre la Sphère"}</span>
                      </Button>

                      {isPendingRequest && (
                        <Button onClick={handleCancelRequest} disabled={isCancellingRequest} variant="outline" size="sm">
                          {isCancellingRequest && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                          <span className="hidden sm:inline">Annuler la demande</span>
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
                  {sphereFeatures.has_kanban && (
                    <SharedTabsTrigger value="tasks">Tâches ({tasks.length})</SharedTabsTrigger>
                  )}
                  <SharedTabsTrigger value="files">Fichiers ({resources.length})</SharedTabsTrigger>
                  {sphereFeatures.has_sphera && (
                    <SharedTabsTrigger value="sphera">Sphera</SharedTabsTrigger>
                  )}
                  {sphereFeatures.has_announcements && (
                    <SharedTabsTrigger value="annonces">Annonces</SharedTabsTrigger>
                  )}
                  <SharedTabsTrigger value="members" className="hidden md:flex">Membres</SharedTabsTrigger>
                  {canModerateMembers && <SharedTabsTrigger value="pending" className="hidden md:flex">Demandes ({pendingMembers.length})</SharedTabsTrigger>}
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
                  <MiniChat sphereId={String(id)} sphereName={sphereFallback.name} isExpanded={isChatExpanded} onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)} />
                </TabsContent>

                <TabsContent value="tasks" className="mt-4">
                  {!sphereFeatures.has_kanban ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Le Kanban n'est pas disponible pour ce type de sphère.
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-card p-3 md:p-4 rounded-lg border mb-4">
                      <h3 className="font-bold">Tableau Kanban</h3>
                      {currentUser?.isVerified ? (
                        <CreateTaskModal onTaskCreated={loadSphereData} sphereId={String(id)} sphereMembers={members}>
                          <Button size="sm" className="campus-gradient text-white"><Plus className="mr-1 h-4 w-4" /> Tâche</Button>
                        </CreateTaskModal>
                      ) : (
                        <Button
                          size="sm"
                          className="campus-gradient text-white"
                          onClick={() => {
                            toast({
                              title: "Compte non certifié",
                              description: "Certifiez votre compte pour créer des tâches.",
                              variant: "destructive",
                              action: (
                                <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>Vérifier</Button>
                              )
                            });
                          }}
                        >
                          <Plus className="mr-1 h-4 w-4" /> Tâche
                        </Button>
                      )}
                    </div>)}
                  {sphereFeatures.has_kanban && taskState === "forbidden" && (
                    <EmptyState
                      icon={Shield}
                      title="Accès restreint"
                      description="Vous devez être membre actif pour voir les tâches de cette sphère."
                    />
                  )}
                  {sphereFeatures.has_kanban && taskState === "server_error" && (
                    <EmptyState
                      icon={AlertCircle}
                      title="Erreur"
                      description="Impossible de charger les tâches."
                    />
                  )}
                  {sphereFeatures.has_kanban && taskState === "ready" && (
                    <div className="-mx-4 md:mx-0 overflow-x-auto">
                      <div className="px-4 md:px-0 min-w-0">
                        <KanbanBoard
                          tasks={tasks}
                          onTasksChange={setTasks}
                          onCreateTask={() => { }}
                          onDeleteTask={handleTaskDelete}
                          canModerate={canModerateMembers}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="files" className="mt-4 space-y-4">
                  <div className="flex justify-between items-center bg-card p-3 md:p-4 rounded-lg border">
                    <h3 className="font-bold">Fichiers partagés ({resources.length})</h3>
                    <SphereUploadResourceModal sphereId={String(id)} onUploaded={() => getSphereFiles(String(id)).then(setResources).catch(() => null)}>
                      <Button size="sm" className="campus-gradient text-white gap-1">
                        <Plus className="h-4 w-4" /> Partager
                      </Button>
                    </SphereUploadResourceModal>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un fichier..."
                      className="pl-9"
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                    />
                  </div>

                  {filteredResources.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">
                        {fileSearchQuery ? "Aucun fichier ne correspond à votre recherche." : "Aucun fichier partagé pour le moment."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredResources.map((res: any) => {
                        const fileUrl = res.file_url || res.fileUrl || "";
                        const fileName = res.title || "Fichier";
                        const fileType = res.file_type || res.fileType || "";
                        const fileSize = res.file_size || res.fileSize || 0;
                        const isImage = fileType.startsWith("image/");
                        const isPdf = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
                        const uploaderName = res.uploaded_by?.name || res.uploadedBy?.name || "";
                        const createdAt = res.created_at || res.createdAt;
                        const canDelete = canModerateMembers || String(res.uploaded_by?.id) === String(currentUserId);

                        return (
                          <div key={res.id} className="border rounded-xl bg-card overflow-hidden">
                            {isImage && fileUrl && (
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block relative w-full h-48">
                                <OptimizedImage
                                  src={fileUrl}
                                  alt={fileName}
                                  className="w-full h-full object-contain"
                                  containerClassName="w-full h-full max-h-48 bg-muted"
                                />
                              </a>
                            )}
                            {isPdf && fileUrl && (
                              <div className="bg-muted/30 p-2">
                                <iframe src={`${fileUrl}#toolbar=0&view=FitH`} className="w-full h-48 rounded border" title={fileName} />
                              </div>
                            )}
                            <div className="p-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <FileText className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{fileName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {uploaderName && <span>{uploaderName} · </span>}
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
                                {canDelete && (
                                  <Button
                                    size="sm" variant="ghost"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={async () => {
                                      try {
                                        await deleteSphereFile(String(id), res.id);
                                        setResources((prev: any[]) => prev.filter((r: any) => r.id !== res.id));
                                        toast({ title: "Fichier supprimé" });
                                      } catch (e: any) {
                                        toast({ title: "Erreur", description: e?.message, variant: "destructive" });
                                      }
                                    }}
                                    title="Supprimer"
                                  >
                                    <X className="h-4 w-4" />
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
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => m.username && navigate(`/profile/${m.username}`)}
                      >
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={m.avatar} /><AvatarFallback>{m.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm flex items-center gap-1">
                            {m.name}
                            {m.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/10" />}
                            {m.isCreator && <Crown className="h-3 w-3 text-yellow-500" />}
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
                  {pendingMembers.length === 0 ? (
                    <EmptyState
                      icon={Users}
                      title="Aucune demande"
                      description="Il n'y a aucune demande d'adhésion en attente pour le moment."
                    />
                  ) : (
                    pendingMembers.map(m => (
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
                    ))
                  )}
                </TabsContent>

                {/* Onglet Sphera */}
                {sphereFeatures.has_sphera && (
                  <TabsContent value="sphera" className="mt-4">
                    <SphereSpheraTab sphereId={String(id)} />
                  </TabsContent>
                )}

                {/* Onglet Annonces */}
                {sphereFeatures.has_announcements && (
                  <TabsContent value="annonces" className="mt-4">
                    <AnnouncementsTab sphereId={String(id)} canModerate={canModerateMembers} />
                  </TabsContent>
                )}

              </div>
            </Tabs>
          ) : (
            <EmptyState
              icon={Shield}
              title="Contenu Protégé"
              description={isPendingRequest
                ? "Votre demande est en attente. Vous pourrez accéder au contenu dès qu'un administrateur l'aura validée."
                : "Rejoignez cette sphère pour accéder au chat, aux tâches et aux fichiers partagés."}
              actionLabel={!isPendingRequest ? "Rejoindre la sphère" : undefined}
              onAction={!isPendingRequest ? handleJoinSphere : undefined}
              className="mx-4 md:mx-0"
            />
          )}
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Partager la Sphère</DialogTitle>
            <DialogDescription>
              Invitez d'autres étudiants à rejoindre cette sphère de collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
                onClick={() => handleSocialShare("whatsapp")}
              >
                <div className="bg-green-500 text-white p-1.5 rounded-full">
                  <FaWhatsapp className="h-3.5 w-3.5" />
                </div>
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
    </>
  );
}

