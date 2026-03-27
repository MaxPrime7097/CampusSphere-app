import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listSphereMembers } from "@/services/api";
import { formatRelativeTime } from "@/lib/date";
import { Users, Search, Loader2, CheckCircle, Crown, Shield, User, UserMinus } from "lucide-react";
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
  status: string;
}

export function ManageMembersModal({
  children,
  sphereId,
  sphereName,
}: ManageMembersModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<"members" | "pending">("members");
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    (async () => {
      setIsLoading(true);
      try {
        if (!sphereId) {
          if (isMounted) {
            setMembers([]);
          }
          return;
        }

        const data = await listSphereMembers(sphereId);
        if (!isMounted) {
          return;
        }

        setMembers(
          (data || []).map((member: any) => ({
            id: String(member.id ?? member.user),
            name: member.user_info?.name || "Utilisateur",
            username: member.user_info?.username || "unknown",
            email: member.user_info?.email || "",
            avatar: member.user_info?.avatar || undefined,
            role: (member.role || "member") as Member["role"],
            joinedAt: member.joined_at || new Date().toISOString(),
            status: member.status || "active",
          }))
        );
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.message || "Impossible de charger les membres",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sphereId, toast]);

  const activeMembers = useMemo(
    () =>
      members.filter((member) => {
        const matchesSearch =
          member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = selectedRole === "all" || member.role === selectedRole;
        return member.status === "active" && matchesSearch && matchesRole;
      }),
    [members, searchQuery, selectedRole]
  );

  const pendingMembers = useMemo(
    () => members.filter((member) => member.status === "pending"),
    [members]
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "moderator":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur";
      case "moderator":
        return "Modérateur";
      default:
        return "Membre";
    }
  };

  const notifyUnavailable = (label: string) => {
    toast({
      title: "Action indisponible",
      description: `${label} n'est pas encore supporté par l'API de gestion des membres.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gérer les membres{sphereName ? ` · ${sphereName}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "members"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Membres ({members.filter((member) => member.status === "active").length})
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "members" && (
                <div className="space-y-3">
                  {activeMembers.length > 0 ? (
                    activeMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
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
                              Rejoint {formatRelativeTime(member.joinedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) => notifyUnavailable(`Le changement de rôle vers ${value}`)}
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
                            onClick={() => notifyUnavailable(`La suppression de ${member.name}`)}
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
                                Demande créée {formatRelativeTime(member.joinedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => notifyUnavailable(`Le rejet de ${member.name}`)}
                            >
                              Refuser
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => notifyUnavailable(`L'approbation de ${member.name}`)}
                              className="campus-gradient text-white"
                            >
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
