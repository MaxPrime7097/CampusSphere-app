import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSphere, listSphereMembers, listSphereTasks, joinSphere, leaveSphere, getCurrentUser, completeTask, updateSphereMember, removeSphereMember } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, Users, TrendingUp, MessageSquare, FileText, 
  CheckSquare, Settings, UserPlus, Share2, MoreVertical,
  Pin, Upload, Link as LinkIcon, Loader2, Plus, Download, X, Check, Clock, Calendar, Zap,
  Crown, Shield, User, UserMinus, UserCheck, UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "@/components/feed/PostCard";
import { CreateTaskModal } from "@/components/modals/CreateTaskModal";
import { AddMemberModal } from "@/components/modals/AddMemberModal";
import { SphereSettingsModal } from "@/components/modals/SphereSettingsModal";
import { ManageMembersModal } from "@/components/modals/ManageMembersModal";
import { MiniChat } from "@/components/chat/MiniChat";
import { ScrollableTabs } from "@/components/ui/scrollable-tabs";

interface PostData {
  content: string;
}

export function SphereDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPendingRequest, setIsPendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [tasks, setTasks] = useState([]);
  const files: any[] = [];
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const handleProfileClick = () => {
    navigate(`/profile/${creator?.username || 'unknown'}`);
  };

  // Charger l'utilisateur actuel et les données de la sphère depuis l'API
  const [sphere, setSphere] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [memberActionStatus, setMemberActionStatus] = useState<string | null>(null);
  const [processingMemberIds, setProcessingMemberIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mapTask = (t: any) => ({
    id: String(t.id),
    title: t.title,
    description: t.description || '',
    status: t.status || (t.is_completed ? 'done' : 'pending'),
    isCompleted: t.is_completed || false,
    assignedTo: t.assigned_to_info?.name || t.assigned_to_info?.first_name + ' ' + t.assigned_to_info?.last_name || 'Non assigné',
    assignedToId: t.assigned_to || null,
    impactPoints: t.impact_points || 0,
    createdAt: t.created_at || new Date().toISOString(),
    completedAt: t.is_completed ? t.updated_at : null,
    dueDate: t.due_date,
    priority: t.priority || 'medium',
  });

  const loadSphereData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [sphereData, membersData, tasksData] = await Promise.all([
        getSphere(String(id)),
        listSphereMembers(String(id)),
        listSphereTasks(String(id)),
      ]);

      setSphere(sphereData);

      const mappedMembers = (membersData || []).map((m: any) => ({
        id: m.id || m.user,
        user: m.user_info || m.user,
        user_info: m.user_info,
        role: m.role_display || m.role || 'member',
        status: m.status || 'active',
        joinedAt: m.joined_at,
        requestedAt: m.joined_at,
        name: m.user_info?.name || m.user_info?.first_name + ' ' + m.user_info?.last_name || 'Unknown',
        username: m.user_info?.username || 'unknown',
        avatar: m.user_info?.avatar || '/placeholder-avatar.jpg',
        isCreator: sphereData?.created_by_info?.id === m.user_info?.id,
      }));
      setMembers(mappedMembers.filter((m: any) => m.status === 'active'));
      setPendingMembers(mappedMembers.filter((m: any) => m.status === 'pending'));

      const mappedTasks = (tasksData || []).map(mapTask);
      setTasks(mappedTasks);

      if (sphereData?.is_member) {
        setIsMember(true);
        setIsPendingRequest(false);
      } else if (sphereData?.membership_status === 'pending') {
        setIsPendingRequest(true);
        setIsMember(false);
      } else {
        setIsMember(false);
        setIsPendingRequest(false);
      }

    } catch (e: any) {
      setLoadError(e?.message || "Erreur de chargement de la sphère");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSphereData();
  }, [id]);

  // Fallback sphere object when not loaded
  const sphereFallback = sphere || {
    id: id || "1",
    name: "Sphère non trouvée",
    description: "Cette sphère n'existe pas",
    objective: "",
    created_by_info: null,
    category: "",
    color: "#3B82F6",
    is_private: false,
    require_approval: false,
    member_count: 0,
    impact_score: 0,
    created_at: "",
    updated_at: "",
    tags: []
  };

  const creator = sphereFallback?.created_by_info || null;





  const handleJoinSphere = async () => {
    setIsJoining(true);
    try {
      const result = await joinSphere(String(id));
      const status = result?.data?.status;
      if (status === 'pending') {
        setIsPendingRequest(true);
        setIsMember(false);
        toast({
          title: "Demande envoyée !",
          description: `Votre demande d'adhésion à "${sphereFallback.name}" est en attente d'approbation`,
          duration: 3000,
        });
      } else {
        setIsMember(true);
        setIsPendingRequest(false);
        toast({
          title: "Bienvenue dans la sphère !",
          description: `Vous avez rejoint "${sphereFallback.name}" avec succès`,
          duration: 3000,
        });
        await loadSphereData();
      }
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de rejoindre la sphère",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancelRequest = () => {
    // No cancel endpoint provided; inform user
    toast({
      title: "Indisponible",
      description: "L'annulation de la demande n'est pas disponible pour le moment",
      duration: 2000,
    });
  };

  // Fonctions pour la gestion des demandes d'adhésion (admin uniquement)
  const handleApproveRequest = async (memberId: string) => {
    const memberToApprove = pendingMembers.find((member) => String(member.id) === String(memberId));
    if (!memberToApprove) {
      return;
    }

    const previousPending = [...pendingMembers];
    const previousMembers = [...members];

    try {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: true }));
      setMemberActionStatus(`Approbation de ${memberToApprove.name}...`);

      setPendingMembers((prev) => prev.filter((member) => String(member.id) !== String(memberId)));
      setMembers((prev) => [{ ...memberToApprove, status: "active" }, ...prev]);

      await updateSphereMember(String(id), memberId, { status: "active" });

      setMemberActionStatus(`${memberToApprove.name} a été approuvé(e).`);
      toast({
        title: "Demande approuvée",
        description: `${memberToApprove.name} est maintenant membre de la sphère`,
        duration: 3000,
      });
    } catch (error: any) {
      setPendingMembers(previousPending);
      setMembers(previousMembers);
      setMemberActionStatus(null);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'approuver la demande",
        variant: "destructive"
      });
    } finally {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleRejectRequest = async (memberId: string) => {
    const memberToReject = pendingMembers.find((member) => String(member.id) === String(memberId));
    if (!memberToReject) {
      return;
    }

    const previousPending = [...pendingMembers];
    try {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: true }));
      setMemberActionStatus(`Rejet de ${memberToReject.name}...`);
      setPendingMembers((prev) => prev.filter((member) => String(member.id) !== String(memberId)));
      await removeSphereMember(String(id), memberId);
      setMemberActionStatus(`${memberToReject.name} a été refusé(e).`);
      toast({
        title: "Demande rejetée",
        description: `${memberToReject.name} a été retiré des demandes en attente`,
        duration: 3000,
      });
    } catch (error: any) {
      setPendingMembers(previousPending);
      setMemberActionStatus(null);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de rejeter la demande",
        variant: "destructive"
      });
    } finally {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  // Fonctions pour la gestion des rôles (admin uniquement, sauf pour le créateur)
  const handleChangeRole = async (memberId: string, newRole: string) => {
    const memberToUpdate = members.find((member) => String(member.id) === String(memberId));
    if (!memberToUpdate) {
      return;
    }

    const previousMembers = [...members];

    try {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: true }));
      setMemberActionStatus(`Mise à jour du rôle de ${memberToUpdate.name}...`);
      setMembers((prev) => prev.map((member) => (
        String(member.id) === String(memberId)
          ? { ...member, role: newRole }
          : member
      )));

      await updateSphereMember(String(id), memberId, { role: newRole as "admin" | "moderator" | "member" });

      setMemberActionStatus(`Le rôle de ${memberToUpdate.name} a été mis à jour.`);
      toast({
        title: "Rôle mis à jour",
        description: `${memberToUpdate.name} est maintenant ${newRole}`,
        duration: 3000,
      });
    } catch (error: any) {
      setMembers(previousMembers);
      setMemberActionStatus(null);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de modifier le rôle de ce membre",
        variant: "destructive",
      });
    } finally {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const memberToRemove = members.find((member) => String(member.id) === String(memberId));
    if (!memberToRemove) {
      return;
    }

    const previousMembers = [...members];
    try {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: true }));
      setMemberActionStatus(`Suppression de ${memberToRemove.name}...`);
      setMembers((prev) => prev.filter((member) => String(member.id) !== String(memberId)));
      await removeSphereMember(String(id), memberId);
      setMemberActionStatus(`${memberToRemove.name} a été retiré(e) de la sphère.`);
      toast({
        title: "Membre supprimé",
        description: `${memberToRemove.name} n'est plus membre de cette sphère`,
        duration: 3000,
      });
    } catch (error: any) {
      setMembers(previousMembers);
      setMemberActionStatus(null);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer ce membre",
        variant: "destructive",
      });
    } finally {
      setProcessingMemberIds((prev) => ({ ...prev, [memberId]: false }));
    }
  };

  const handleShare = () => {
    setIsSharing(true);
    
    setTimeout(() => {
      setIsSharing(false);
      toast({
        title: "Lien copié !",
        description: "Le lien de cette sphère a été copié dans votre presse-papiers",
        duration: 2000,
      });
    }, 1000);
  };

  const handleCreateTask = (createdTask: any) => {
    if (!createdTask) {
      return;
    }

    const mappedTask = mapTask(createdTask);
    setTasks((prev) => [mappedTask, ...prev.filter((task) => task.id !== mappedTask.id)]);
  };

  const handleMembersAdded = (addedMembers: unknown) => {
    const nextMembers = Array.isArray(addedMembers) ? addedMembers : [addedMembers];
    const mappedMembers = nextMembers.map((member: any) => ({
      id: member.id || member.user,
      user: member.user_info || member.user,
      user_info: member.user_info,
      role: member.role_display || member.role || 'member',
      status: member.status || 'active',
      joinedAt: member.joined_at,
      name: member.user_info?.name || 'Utilisateur',
      username: member.user_info?.username || 'unknown',
      avatar: member.user_info?.avatar || '/placeholder-avatar.jpg',
      isCreator: false,
    }));

    setMembers((prev) => [
      ...mappedMembers.filter((item: any) => !prev.some((member) => String(member.user?.id || member.id) === String(item.user_info?.id || item.id))),
      ...prev,
    ]);
  };

  const handleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await completeTask(taskId);
      
      // Mettre à jour la tâche
      const updatedTasks = tasks.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: "done", 
              isCompleted: true,
              completedAt: new Date().toISOString().split('T')[0]
            }
          : t
      );
      setTasks(updatedTasks);

      toast({
        title: "Tâche terminée ! 🎉",
        description: `Félicitations ! Vous avez gagné ${task.impactPoints} points d'impact`,
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de terminer la tâche",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-6xl mx-auto py-4 px-4 space-y-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/spheres")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux sphères
        </Button>

        {/* Error Display */}
        {loadError && (
          <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-900/20 p-4 mb-4">
            <p className="text-red-600 dark:text-red-400">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => void loadSphereData()}
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="overflow-hidden rounded-lg border bg-card">
          {/* Banner */}
          {loading ? (
            <div className="relative h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <div className="relative h-48 flex items-center justify-center">
              <p className="text-muted-foreground">Impossible de charger la sphère</p>
            </div>
          ) : (
            <div className="relative h-48">
              <div className={`w-full h-full bg-gradient-to-r ${sphereFallback.color || 'from-blue-500 to-blue-600'} flex items-center justify-center`}>
                <span className="text-white text-6xl font-bold opacity-50">{sphereFallback.name?.charAt(0) || '?'}</span>
              </div>
              <div className={`absolute inset-0 bg-gradient-to-r ${sphereFallback.color || 'from-blue-500 to-blue-600'} opacity-70`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <h1 className="text-white font-bold text-3xl text-center px-4">
                  {sphereFallback.name}
                </h1>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="space-y-3">
                  <p className="text-foreground text-lg leading-relaxed">{sphereFallback.description || "Aucune description"}</p>
                  
                  {/* Objectif et type d'échange */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-primary">🎯 Objectif de la sphère</h3>
                    <p className="text-sm text-muted-foreground">
                      {sphereFallback.objective || "Partager des connaissances, collaborer sur des projets et créer une communauté active d'apprentissage"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Type d'échange :</span>
                      <Badge variant="outline" className="text-xs">Collaboration</Badge>
                      <Badge variant="outline" className="text-xs">Partage de ressources</Badge>
                      <Badge variant="outline" className="text-xs">Discussion</Badge>
                    </div>
                  </div>
                </div>

                {sphereFallback.tags && sphereFallback.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sphereFallback.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {sphereFallback.member_count || members.length} membres
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {files.length} fichiers
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Actif</Badge>
                  {!sphereFallback.require_approval && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">Public</Badge>
                  )}
                  {sphereFallback.require_approval && (
                    <Badge variant="destructive">Approbation requise</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression globale</span>
                    <span className="font-semibold">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {!isMember && !isPendingRequest ? (
                  <Button 
                    className="campus-gradient text-white hover:opacity-90 gap-2"
                    onClick={handleJoinSphere}
                    disabled={isJoining}
                  >
                    {isJoining ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                    <UserPlus className="h-4 w-4" />
                    )}
                    {isJoining ? "Rejoindre..." : "Rejoindre"}
                  </Button>
                ) : isPendingRequest ? (
                  <Button 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2"
                    onClick={handleCancelRequest}
                  >
                    <Clock className="h-4 w-4" />
                    Demande en attente
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <SphereSettingsModal 
                      sphereData={{
                        id: sphereFallback.id,
                        name: sphereFallback.name,
                        description: sphereFallback.description,
                        category: sphereFallback.category,
                        requireApproval: sphereFallback.require_approval,
                        allowMemberPosts: true,
                        allowResourceSharing: true,
                        allowTaskCreation: true,
                        maxMembers: 100
                      }}
                      onSettingsUpdated={(settings) => {
                        toast({
                          title: "Paramètres mis à jour",
                          description: "Les paramètres de la sphère ont été sauvegardés",
                        });
                      }}
                      onSphereDeleted={(sphereId) => {
                        toast({
                          title: "Sphère supprimée",
                          description: "La sphère a été supprimée avec succès",
                        });
                        navigate("/spheres");
                      }}
                    >
                      <Button variant="outline" className="gap-2 w-full">
                    <Settings className="h-4 w-4" />
                    Paramètres
                  </Button>
                    </SphereSettingsModal>
                    
                    <ManageMembersModal 
                      sphereId={sphereFallback.id}
                      sphereName={sphereFallback.name}
                      onMemberAction={(action, memberId, data) => {
                        toast({
                          title: "Action effectuée",
                          description: `Action ${action} sur le membre ${memberId}`,
                        });
                      }}
                    >
                      <Button variant="outline" className="gap-2 w-full">
                        <Users className="h-4 w-4" />
                        Gérer les membres
                      </Button>
                    </ManageMembersModal>
                    
                    <AddMemberModal 
                      sphereId={sphereFallback.id}
                      sphereName={sphereFallback.name}
                      onMemberAdded={handleMembersAdded}
                    >
                      <Button variant="outline" className="gap-2 w-full">
                        <UserPlus className="h-4 w-4" />
                        Inviter des membres
                      </Button>
                    </AddMemberModal>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                  <Share2 className="h-4 w-4" />
                  )}
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs ou Message d'attente */}
        {!isMember && isPendingRequest ? (
          <div className="rounded-lg border bg-card p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Demande en attente</h3>
                  <p className="text-muted-foreground mb-4">
                    Votre demande d'adhésion à cette sphère est en cours d'examen par les administrateurs.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vous recevrez une notification une fois votre demande approuvée.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleCancelRequest}
                  className="mt-2"
                >
                  Annuler la demande
                </Button>
              </div>
          </div>
        ) : !isMember ? (
          <div className="rounded-lg border bg-card p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Rejoindre la sphère</h3>
                  <p className="text-muted-foreground mb-4">
                    Vous devez être membre de cette sphère pour accéder à son contenu.
                  </p>
                  </div>
                <Button 
                  onClick={handleJoinSphere}
                  disabled={isJoining}
                  className="campus-gradient text-white"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Rejoindre...
                    </>
                  ) : (
                    "Rejoindre la sphère"
                  )}
                </Button>
              </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             <ScrollableTabs>
               <TabsList className="h-auto p-1 bg-transparent">
                 <TabsTrigger value="chat" className="h-8">
                   Chat
                 </TabsTrigger>
                 <TabsTrigger value="tasks" className="h-8">
                   Tâches ({tasks.length})
                 </TabsTrigger>
                 <TabsTrigger value="files" className="h-8">
                   Fichiers ({files.length})
                 </TabsTrigger>
                 <TabsTrigger value="members" className="h-8">
                   Membres ({members.length})
                 </TabsTrigger>
                 <TabsTrigger value="pending" className="h-8">
                   Demandes ({pendingMembers.length})
                 </TabsTrigger>
               </TabsList>
             </ScrollableTabs>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <MiniChat
              sphereId={id || ""}
              sphereName={sphereFallback.name}
              isExpanded={isChatExpanded}
              onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)}
            />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex flex-row items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Gestion des tâches</h3>
                {isMember && (
                  <CreateTaskModal
                    onTaskCreated={handleCreateTask}
                    sphereId={sphereFallback.id}
                    sphereMembers={members.map((member) => ({
                      id: member.user_info?.id || member.user?.id || member.id,
                      name: member.name,
                      username: member.username,
                      avatar: member.avatar || "",
                    }))}
                  >
                    <Button size="sm" className="campus-gradient text-white gap-2">
                      <Plus className="h-4 w-4" />
                    Nouvelle tâche
                  </Button>
                  </CreateTaskModal>
                )}
              </div>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          {/* Checkbox pour completion */}
                          <div className="flex-shrink-0 mt-1">
                            {task.isCompleted ? (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-5 h-5 p-0 rounded-full border-2"
                                onClick={() => handleTaskComplete(task.id)}
                                disabled={task.isCompleted}
                              >
                                <div className="w-2 h-2 rounded-full bg-transparent" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                {task.title}
                              </p>
                              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                +{task.impactPoints}
                              </Badge>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>Assigné à: {task.assignedTo}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Créé le {new Date(task.createdAt).toLocaleDateString('fr-FR')}</span>
                              </div>
                              {task.completedAt && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <Check className="h-3 w-3" />
                                  <span>Terminé le {new Date(task.completedAt).toLocaleDateString('fr-FR')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={task.status === 'done' ? 'default' : 
                                   task.status === 'in-progress' ? 'secondary' : 'outline'}
                            className={task.status === 'done' ? 'bg-green-500 hover:bg-green-600' : ''}
                          >
                          {task.status === 'done' ? 'Terminé' :
                           task.status === 'in-progress' ? 'En cours' :
                           'À faire'}
                        </Badge>
                          
                          {!task.isCompleted && (
                            <Button
                              size="sm"
                              onClick={() => handleTaskComplete(task.id)}
                              className="campus-gradient text-white hover:opacity-90 text-xs"
                              disabled={task.isCompleted}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Terminer
                            </Button>
                          )}
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="files" className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex flex-row items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Fichiers</h3>
              </div>
              <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-2">Partage de fichiers indisponible</p>
                <p className="text-sm text-muted-foreground">
                  Le backend ne propose pas encore d&apos;API pour les fichiers de sphère.
                  Cette section s&apos;activera dès que l&apos;upload et le téléchargement seront disponibles.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Membres actifs ({members.length})</h3>
                {isMember && (
                  <AddMemberModal
                    sphereId={sphereFallback.id}
                    sphereName={sphereFallback.name}
                    onMemberAdded={handleMembersAdded}
                  >
                    <Button size="sm" className="campus-gradient text-white gap-2">
                      <UserPlus className="h-4 w-4" />
                      Ajouter un membre
                    </Button>
                  </AddMemberModal>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-input text-muted-foreground font-semibold">
                              {member.name?.slice(0, 1).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          {member.isCreator && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Crown className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            {member.name}
                            {member.isCreator && <span className="text-xs text-yellow-600">Créateur</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">@{member.username}</p>
                          <Badge 
                            variant={member.role === "admin" || member.role === "Admin" ? "default" : member.role === "moderator" || member.role === "Modérateur" ? "secondary" : "outline"} 
                            className="text-xs mt-1"
                          >
                            {(member.role === "admin" || member.role === "Admin") && <Shield className="h-3 w-3 mr-1" />}
                            {(member.role === "moderator" || member.role === "Modérateur") && <User className="h-3 w-3 mr-1" />}
                            {member.role === "admin" ? "Admin" : member.role === "moderator" ? "Modérateur" : member.role === "member" ? "Membre" : member.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/profile/${member.username}`)}>
                          Profil
                        </Button>
                        {isMember && !member.isCreator && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, "Modérateur")}>
                                <Shield className="h-4 w-4 mr-2" />
                                Promouvoir Modérateur
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, "Membre")}>
                                <User className="h-4 w-4 mr-2" />
                                Rétrograder Membre
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(member.id)}
                                disabled={Boolean(processingMemberIds[String(member.id)])}
                                className="text-red-600"
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Pending Members Tab */}
          <TabsContent value="pending" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Demandes en attente ({pendingMembers.length})</h3>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Seuls les administrateurs peuvent gérer les demandes
                  </p>
                  {memberActionStatus && (
                    <p className="text-xs text-muted-foreground mt-1">{memberActionStatus}</p>
                  )}
                </div>
              </div>
              
              {pendingMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune demande en attente</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingMembers.map((member) => (
                    <div key={member.id} className="rounded-lg border bg-card p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-input text-muted-foreground font-semibold">
                              {member.name?.slice(0, 1).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{member.name}</p>
                              <p className="text-sm text-muted-foreground">@{member.username}</p>
                            <p className="text-xs text-muted-foreground">
                              Demande le {new Date(member.requestedAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate(`/profile/${member.username}`)}
                          >
                            Profil
                          </Button>
                          {isMember && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleApproveRequest(member.id)}
                                disabled={Boolean(processingMemberIds[String(member.id)])}
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRejectRequest(member.id)}
                                disabled={Boolean(processingMemberIds[String(member.id)])}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
