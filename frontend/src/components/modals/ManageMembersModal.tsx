import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Loader2, 
  CheckCircle,
  UserMinus,
  Crown,
  Shield,
  User,
  MoreHorizontal,
  Mail,
  Ban,
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManageMembersModalProps {
  children: React.ReactNode;
  sphereId?: string;
  sphereName?: string;
  onMemberAction?: (action: string, memberId: string, data?: any) => void;
}

interface Member {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  role: "admin" | "moderator" | "member";
  joinedAt: string;
  isOnline: boolean;
  contributions: {
    posts: number;
    resources: number;
    tasks: number;
  };
  lastActive: string;
}

interface PendingMember {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  requestedAt: string;
  message?: string;
}

export function ManageMembersModal({ 
  children, 
  sphereId, 
  sphereName, 
  onMemberAction 
}: ManageMembersModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [activeTab, setActiveTab] = useState<"members" | "pending">("members");
  const { toast } = useToast();

  // Placeholder members (TODO: Load from API)
  const placeholderMembers: Member[] = [
    {
      id: "1",
      name: "Marie Dubois",
      username: "marie.dubois",
      email: "marie.dubois@univ-cameroon.cm",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      role: "admin",
      joinedAt: "2024-01-15T10:00:00Z",
      isOnline: true,
      contributions: { posts: 12, resources: 8, tasks: 5 },
      lastActive: "2024-01-20T14:30:00Z"
    },
    {
      id: "2",
      name: "Jean Mballa",
      username: "jean.mballa",
      email: "jean.mballa@univ-cameroon.cm",
      role: "moderator",
      joinedAt: "2024-01-16T09:00:00Z",
      isOnline: false,
      contributions: { posts: 8, resources: 12, tasks: 3 },
      lastActive: "2024-01-19T16:45:00Z"
    },
    {
      id: "3",
      name: "Fatou Ndiaye",
      username: "fatou.ndiaye",
      email: "fatou.ndiaye@univ-cameroon.cm",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      role: "member",
      joinedAt: "2024-01-17T14:00:00Z",
      isOnline: true,
      contributions: { posts: 5, resources: 3, tasks: 7 },
      lastActive: "2024-01-20T12:15:00Z"
    },
    {
      id: "4",
      name: "Pierre Essomba",
      username: "pierre.essomba",
      email: "pierre.essomba@univ-cameroon.cm",
      role: "member",
      joinedAt: "2024-01-18T11:00:00Z",
      isOnline: true,
      contributions: { posts: 2, resources: 1, tasks: 2 },
      lastActive: "2024-01-20T10:30:00Z"
    }
  ];

  const placeholderPendingMembers: PendingMember[] = [
    {
      id: "5",
      name: "Aisha Oumarou",
      username: "aisha.oumarou",
      email: "aisha.oumarou@univ-cameroon.cm",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      requestedAt: "2024-01-19T15:00:00Z",
      message: "Je suis intéressée par ce projet et j'aimerais contribuer avec mes compétences en design."
    },
    {
      id: "6",
      name: "Samuel Tchoumi",
      username: "samuel.tchoumi",
      email: "samuel.tchoumi@univ-cameroon.cm",
      requestedAt: "2024-01-20T09:30:00Z"
    }
  ];

  // Charger les données au montage
  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      // TODO: Load from API - listSphereMembers(sphereId)
      await new Promise(resolve => setTimeout(resolve, 1000));
      // For now, use placeholder data until API endpoint is available
      setMembers(placeholderMembers);
      setPendingMembers(placeholderPendingMembers);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les membres",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      // Simuler la mise à jour
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, role: newRole as "admin" | "moderator" | "member" } : member
      ));

      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été modifié avec succès`,
      });

      if (onMemberAction) {
        onMemberAction("role_changed", memberId, { newRole });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de modifier le rôle",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      // Simuler la suppression
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMembers(prev => prev.filter(member => member.id !== memberId));

      toast({
        title: "Membre supprimé",
        description: `${memberName} a été retiré de la sphère`,
      });

      if (onMemberAction) {
        onMemberAction("member_removed", memberId);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer le membre",
      });
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      // Simuler l'approbation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pendingMember = pendingMembers.find(m => m.id === memberId);
      if (pendingMember) {
        const newMember: Member = {
          id: pendingMember.id,
          name: pendingMember.name,
          username: pendingMember.username,
          email: pendingMember.email,
          avatar: pendingMember.avatar,
          role: "member",
          joinedAt: new Date().toISOString(),
          isOnline: false,
          contributions: { posts: 0, resources: 0, tasks: 0 },
          lastActive: new Date().toISOString()
        };

        setMembers(prev => [...prev, newMember]);
        setPendingMembers(prev => prev.filter(m => m.id !== memberId));

        toast({
          title: "Membre approuvé",
          description: `${pendingMember.name} a rejoint la sphère`,
        });

        if (onMemberAction) {
          onMemberAction("member_approved", memberId, newMember);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'approuver le membre",
      });
    }
  };

  const handleRejectMember = async (memberId: string) => {
    try {
      // Simuler le rejet
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pendingMember = pendingMembers.find(m => m.id === memberId);
      setPendingMembers(prev => prev.filter(m => m.id !== memberId));

      toast({
        title: "Demande rejetée",
        description: `La demande de ${pendingMember?.name} a été rejetée`,
      });

      if (onMemberAction) {
        onMemberAction("member_rejected", memberId);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de rejeter la demande",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Crown className="h-4 w-4 text-yellow-500" />;
      case "moderator": return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Administrateur";
      case "moderator": return "Modérateur";
      default: return "Membre";
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return "Hier";
    return formatDate(dateString);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gérer les membres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Onglets */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "members" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Membres ({members.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "pending" 
                  ? "border-primary text-primary" 
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              En attente ({pendingMembers.length})
            </button>
          </div>

          {/* Filtres */}
          {activeTab === "members" && (
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nom, username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Label htmlFor="role">Rôle</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Administrateurs</SelectItem>
                    <SelectItem value="moderator">Modérateurs</SelectItem>
                    <SelectItem value="member">Membres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Contenu des onglets */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Liste des membres */}
              {activeTab === "members" && (
                <div className="space-y-3">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            {member.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.name}</p>
                              <span className="text-sm text-muted-foreground">@{member.username}</span>
                              <div className="flex items-center gap-1">
                                {getRoleIcon(member.role)}
                                <span className="text-xs text-muted-foreground">
                                  {getRoleLabel(member.role)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Rejoint le {formatDate(member.joinedAt)} • 
                              Dernière activité: {formatLastActive(member.lastActive)}
                            </p>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{member.contributions.posts} posts</span>
                              <span>{member.contributions.resources} ressources</span>
                              <span>{member.contributions.tasks} tâches</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Membre</SelectItem>
                              <SelectItem value="moderator">Modérateur</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun membre trouvé</p>
                    </div>
                  )}
                </div>
              )}

              {/* Demandes en attente */}
              {activeTab === "pending" && (
                <div className="space-y-3">
                  {pendingMembers.length > 0 ? (
                    pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{member.name}</p>
                                <span className="text-sm text-muted-foreground">@{member.username}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Demande le {formatDate(member.requestedAt)}
                              </p>
                              {member.message && (
                                <p className="text-sm mt-2 p-2 bg-muted/50 rounded">
                                  "{member.message}"
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRejectMember(member.id)}
                              variant="outline"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rejeter
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveMember(member.id)}
                              className="campus-gradient text-white"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucune demande en attente</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
