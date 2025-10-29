import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserPlus, 
  Search, 
  Loader2, 
  CheckCircle,
  Users,
  Mail,
  UserCheck,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddMemberModalProps {
  children: React.ReactNode;
  onMemberAdded?: (memberData: any) => void;
  sphereId?: string;
  sphereName?: string;
}

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  university: string;
  faculty: string;
  isOnline: boolean;
  mutualConnections: number;
  skills: string[];
}

export function AddMemberModal({ children, onMemberAdded, sphereId, sphereName }: AddMemberModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [inviteMessage, setInviteMessage] = useState("");
  const { toast } = useToast();

  // Mock data pour les utilisateurs disponibles
  const mockUsers: User[] = [
    {
      id: "1",
      name: "Marie Dubois",
      username: "marie.dubois",
      email: "marie.dubois@univ-cameroon.cm",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      university: "Université de Douala",
      faculty: "Informatique",
      isOnline: true,
      mutualConnections: 3,
      skills: ["React", "Python", "Design"]
    },
    {
      id: "2",
      name: "Jean Mballa",
      username: "jean.mballa",
      email: "jean.mballa@univ-cameroon.cm",
      university: "Université de Yaoundé",
      faculty: "Mathématiques",
      isOnline: false,
      mutualConnections: 1,
      skills: ["Machine Learning", "Statistics", "R"]
    },
    {
      id: "3",
      name: "Fatou Ndiaye",
      username: "fatou.ndiaye",
      email: "fatou.ndiaye@univ-cameroon.cm",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      university: "Université de Douala",
      faculty: "Économie",
      isOnline: true,
      mutualConnections: 5,
      skills: ["Finance", "Excel", "Marketing"]
    },
    {
      id: "4",
      name: "Pierre Essomba",
      username: "pierre.essomba",
      email: "pierre.essomba@univ-cameroon.cm",
      university: "Université de Buea",
      faculty: "Ingénierie",
      isOnline: true,
      mutualConnections: 2,
      skills: ["Java", "C++", "Electronics"]
    },
    {
      id: "5",
      name: "Aisha Oumarou",
      username: "aisha.oumarou",
      email: "aisha.oumarou@univ-cameroon.cm",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      university: "Université de Ngaoundéré",
      faculty: "Médecine",
      isOnline: false,
      mutualConnections: 0,
      skills: ["Biologie", "Chimie", "Recherche"]
    }
  ];

  // Recherche d'utilisateurs
  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Simuler une recherche avec délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const filtered = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.faculty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setSearchResults(filtered);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de recherche",
        description: "Impossible de rechercher les utilisateurs",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Recherche automatique avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const addUserToSelection = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeUserFromSelection = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const sendInvitations = async () => {
    if (selectedUsers.length === 0) {
      toast({
        variant: "destructive",
        title: "Aucun utilisateur sélectionné",
        description: "Veuillez sélectionner au moins un utilisateur à inviter",
      });
      return;
    }

    setIsInviting(true);

    try {
      // Simuler l'envoi d'invitations
      await new Promise(resolve => setTimeout(resolve, 2000));

      const invitations = selectedUsers.map(user => ({
        id: Date.now().toString() + user.id,
        userId: user.id,
        userName: user.name,
        userUsername: user.username,
        sphereId: sphereId || "sphere-1",
        sphereName: sphereName || "Ma Sphère",
        message: inviteMessage || `Rejoignez notre sphère "${sphereName || "Ma Sphère"}" !`,
        status: "pending",
        sentAt: new Date().toISOString(),
        sentBy: "Vous"
      }));

      console.log("Sending invitations:", invitations);

      // Appeler le callback si fourni
      if (onMemberAdded) {
        onMemberAdded(invitations);
      }

      toast({
        title: "Invitations envoyées !",
        description: `${selectedUsers.length} invitation(s) envoyée(s) avec succès`,
        duration: 3000,
      });

      // Réinitialiser
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      setInviteMessage("");
      setIsOpen(false);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer les invitations",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUsers([]);
    setInviteMessage("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter des membres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recherche */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Rechercher des utilisateurs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, username, université, compétences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Résultats ({searchResults.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name}</p>
                            <span className="text-sm text-muted-foreground">@{user.username}</span>
                            {user.isOnline && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {user.university} • {user.faculty}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {user.mutualConnections} connexion(s) mutuelle(s)
                            </span>
                            <div className="flex gap-1">
                              {user.skills.slice(0, 2).map(skill => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {user.skills.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{user.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addUserToSelection(user)}
                        disabled={selectedUsers.some(u => u.id === user.id)}
                        variant={selectedUsers.some(u => u.id === user.id) ? "secondary" : "default"}
                      >
                        {selectedUsers.some(u => u.id === user.id) ? (
                          <UserCheck className="h-4 w-4" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun utilisateur trouvé</p>
                <p className="text-sm">Essayez avec d'autres mots-clés</p>
              </div>
            )}
          </div>

          {/* Utilisateurs sélectionnés */}
          {selectedUsers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                Utilisateurs sélectionnés ({selectedUsers.length})
              </h3>
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeUserFromSelection(user.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message d'invitation */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteMessage">Message d'invitation (optionnel)</Label>
              <Input
                id="inviteMessage"
                placeholder={`Rejoignez notre sphère "${sphereName || "Ma Sphère"}" !`}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {inviteMessage.length}/200 caractères
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isInviting}
            >
              Annuler
            </Button>
            <Button
              onClick={sendInvitations}
              disabled={selectedUsers.length === 0 || isInviting}
              className="flex-1 campus-gradient text-white hover:opacity-90"
            >
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer {selectedUsers.length} invitation(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
