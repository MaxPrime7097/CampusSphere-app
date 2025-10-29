import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockDB } from "@/services/mockDatabaseService";
import { mockDatabase } from "@/data/mockDatabase";
import { MapPin, Camera, Calendar, Link, Users, BookOpen, Award, Settings, FileText, Briefcase, GraduationCap, Loader2, Check, Download, UserPlus, UserMinus, ExternalLink, Upload, X, Zap, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";

export function Profile() {
  const navigate = useNavigate();
  const { username } = useParams<{ username?: string }>();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentMood, setCurrentMood] = useState("🚀 En pleine révision !");
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  // const [userPosts, setUserPosts] = useState([]);
  // const [connections, setConnections] = useState([]);
  // const [editedProfile, setEditedProfile] = useState({});
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [newMood, setNewMood] = useState("");

  // Charger l'utilisateur actuel depuis le mock database
  useEffect(() => {
    mockDB.loadCurrentUser();
  }, []);

  const currentUser = mockDB.getCurrentUser();

  // Déterminer quel utilisateur afficher
  const targetUser = useMemo(() => {
    if (username) {
      // Si un username est fourni, chercher cet utilisateur
      const allUsers = mockDB.getAllUsers();
      return allUsers.find(user => user.username === username) || currentUser;
    } else {
      // Sinon, afficher l'utilisateur actuel
      return currentUser;
    }
  }, [username, currentUser]);
  
  // Vérifier si c'est le profil de l'utilisateur actuel
  const isOwnProfile = !username || username === currentUser?.username;
  
  // Obtenir les données complètes de l'utilisateur
  const userData = mockDB.getCurrentUserData();
  
  // Données utilisateur avec fallback
  const user = useMemo(() => {
    if (!targetUser) {
      return {
        name: "Utilisateur non trouvé",
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phoneNumber: "",
        dateOfBirth: "",
    avatar: "/placeholder-avatar.jpg",
        coverPhoto: null,
    banner: "/placeholder",
        bio: "",
        town: "",
        language: "",
        impactScore: 0,
        currentMood: "",
        university: "",
        faculty: "",
        studyYear: "",
        studentId: "",
        campus: "",
      };
    }
    
    return {
      // Personal info
      name: targetUser.name,
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      username: targetUser.username,
      email: targetUser.email,
      phoneNumber: "+237 699 99 99 99", // Mock phone
      dateOfBirth: "15/03/2007", // Mock date
      avatar: targetUser.avatar,
      coverPhoto: targetUser.coverPhoto || null,
      banner: "/placeholder",
      bio: "Étudiant passionné par l'IA et le développement web. Toujours prêt à aider et à apprendre !",
      town: targetUser.city,
    language: "Français, Anglais",
      impactScore: targetUser.impactScore,
      currentMood: targetUser.currentMood,
    
    // Academic info
      university: targetUser.university,
      faculty: targetUser.faculty,
      studyYear: targetUser.studyLevel,
      studentId: "IUC24804567", // Mock student ID
      campus: "Campus Logbessou", // Mock campus
    
      // Experience & Skills (Mock data for now)
    previousEducation: [
      {
        degree: "Licence Informatique",
        school: "Sorbonne Université",
        year: "2019-2022"
      },
      {
        degree: "Baccalauréat Scientifique",
        school: "Lycée Henri IV",
        year: "2019"
      }
    ],
    experiences: [
      {
        title: "Développeur Full-Stack",
        company: "TechCorp",
        duration: "6 mois",
        description: "Développement d'applications web avec React et Node.js"
      },
      {
        title: "Assistant de recherche",
        company: "Lab IA - Université Paris-Saclay",
        duration: "1 an",
        description: "Recherche en machine learning et traitement du langage naturel"
      }
    ],
    skills: ["React", "Node.js", "Python", "Machine Learning", "SQL", "TypeScript", "Docker", "MongoDB"],
    interests: ["Intelligence Artificielle", "Développement Web", "Gaming", "Open Source", "Cybersécurité"],
    portfolioLinks: [
        { name: "GitHub", url: "https://github.com/cypher" },
        { name: "LinkedIn", url: "https://linkedin.com/in/cypher" },
        { name: "Portfolio", url: "https://cypher.dev" },
    ],
    sharedFiles: [
      { name: "Notes_IA_2024.pdf", type: "PDF", size: "2.3 MB" },
      { name: "Projet_React_Final.zip", type: "ZIP", size: "15 MB" },
      { name: "Resume_Algo.docx", type: "DOCX", size: "850 KB" }
    ],
    
      // Social stats from userData
    stats: {
        posts: userData?.userPosts.length || 0,
        connections: 23, // Mock for now
        contributions: userData?.userResources.length || 0
    },
    badges: ["Contributeur actif", "Mentor", "Top étudiant"]
  };
  }, [targetUser, userData]);

  // Connexions depuis le mock database
  const userConnections = useMemo(() => {
    const allUsers = mockDB.getAllUsers();
    const currentUserId = mockDB.getCurrentUserId();
    
    // Retourner tous les autres utilisateurs comme connexions (mock)
    return allUsers
      .filter(u => u.id !== currentUserId)
      .map(user => ({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        mutual: Math.floor(Math.random() * 20) + 1 // Mock mutual connections
      }));
  }, []);

  // Posts utilisateur depuis le mock database
  const userPostsData = useMemo(() => {
    if (!userData?.userPosts) return [];
    
    return userData.userPosts.map(post => ({
      id: post.id,
      author: {
        name: currentUser?.name || "",
        avatar: currentUser?.avatar || "",
        username: currentUser?.username || "",
        isVerified: currentUser?.isVerified || false
      },
      content: post.content,
      timestamp: new Date(post.createdAt).toLocaleDateString('fr-FR'),
      likes: post.stats.likes,
      comments: post.stats.comments,
      category: "Général"
    }));
  }, [currentUser, userData]);

  // Utiliser directement les données calculées au lieu de les stocker dans des states
  // setUserPosts(userPostsData);
  // setConnections(userConnections);
  // setEditedProfile(user);

  const handleFollow = async () => {
    setIsFollowingLoading(true);
    
    // Simuler l'action de suivi
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsFollowing(!isFollowing);
    setIsFollowingLoading(false);
    
    toast({
      title: isFollowing ? "Ne suit plus" : "Suit maintenant",
      description: isFollowing 
        ? `Vous ne suivez plus ${user.name}` 
        : `Vous suivez maintenant ${user.name}`,
      duration: 2000,
    });
  };

  const handleViewProfile = (connectionId: string, connectionName: string) => {
    toast({
      title: "Navigation vers profil",
      description: `Ouverture du profil de ${connectionName}`,
      duration: 2000,
    });
    // Ici on pourrait naviguer vers le profil de la connection
    // navigate(`/profile/${connectionId}`);
  };

  const handleDownloadFile = (fileName: string) => {
    toast({
      title: "Téléchargement démarré",
      description: `Le fichier "${fileName}" va être téléchargé`,
      duration: 2000,
    });
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profil mis à jour !",
      description: "Vos modifications ont été sauvegardées",
      duration: 3000,
    });
    setShowEditModal(false);
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Fichier trop grand",
          description: "La photo de couverture ne doit pas dépasser 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setCoverPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCoverPhoto = () => {
    if (coverPhotoFile) {
      // Simuler l'upload
      toast({
        title: "Photo de couverture mise à jour !",
        description: "Votre nouvelle photo de couverture a été sauvegardée",
        duration: 3000,
      });
      setShowCoverPhotoModal(false);
      setCoverPhotoFile(null);
      setCoverPhotoPreview(null);
    }
  };

  const handleRemoveCoverPhoto = () => {
    setCoverPhotoFile(null);
    setCoverPhotoPreview(null);
    toast({
      title: "Photo de couverture supprimée",
      description: "Votre photo de couverture a été supprimée",
      duration: 2000,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit pour avatar
        toast({
          title: "Fichier trop grand",
          description: "L'avatar ne doit pas dépasser 2MB",
          variant: "destructive"
        });
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = () => {
    if (avatarFile) {
      // Simuler l'upload
      toast({
        title: "Avatar mis à jour !",
        description: "Votre nouvel avatar a été sauvegardé",
        duration: 3000,
      });
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    toast({
      title: "Avatar supprimé",
      description: "Votre avatar a été supprimé",
      duration: 2000,
    });
  };

  const handleMoodChange = () => {
    if (!newMood.trim()) return;
    
    // Sauvegarder le nouveau mood dans localStorage
    localStorage.setItem("userCurrentMood", newMood);
    
    toast({
      title: "Mood mis à jour !",
      description: "Votre mood du moment a été changé",
      duration: 2000,
    });
    
    setNewMood("");
    setShowMoodModal(false);
  };

  return (
    <div key={`${username || 'current'}`} className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-4 px-4">
        {/* Profile Header */}
        <div className="campus-animate-fade-in overflow-hidden rounded-lg border bg-card p-0">
          {/* Photo de couverture */}
          <div className="relative h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/30 overflow-hidden">
            {user.coverPhoto ? (
              <img 
                src={user.coverPhoto} 
                alt="Photo de couverture" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/30 to-primary/40 flex items-center justify-center">
                <div className="text-center text-white/80">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm opacity-75">Photo de couverture</p>
                </div>
              </div>
            )}
            
            {/* Bouton pour changer la photo de couverture */}
            {isOwnProfile && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 shadow-lg"
                onClick={() => setShowCoverPhotoModal(true)}
              >
                <Camera className="h-4 w-4 mr-2" />
                Changer
              </Button>
            )}
          </div>
          
          <div className="p-6 relative">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar superposé */}
             <div className="flex flex-col items-start space-y-4">
                <div className="relative -mt-20">
                  <Avatar className="h-32 w-32 ring-4 ring-background">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-input text-muted-foreground font-bold text-2xl">
                      {user.name?.slice(0, 1).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
                      onClick={() => setShowAvatarModal(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isOwnProfile && (
                    <Button 
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      disabled={isFollowingLoading}
                      className={!isFollowing ? "campus-gradient text-white hover:opacity-90" : ""}
                      size="sm"
                    >
                      {isFollowingLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Disconnect
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditProfile}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>

                <p className="text-foreground leading-relaxed">{user.bio}</p>

                {/* Impact Score et Mood */}
                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Impact Score</p>
                      <p className="text-lg font-bold text-primary">{user.impactScore}</p>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => isOwnProfile && setShowMoodModal(true)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <span className="text-lg"><Smile className="h-4 w-4 text-white" /></span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Mood du moment</p>
                      <p className="text-sm text-muted-foreground">{user.currentMood}</p>
                    </div>
                    {isOwnProfile && (
                      <Settings className="h-3 w-3 text-muted-foreground ml-auto" />
                    )}
                  </div>
                </div>

                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="font-semibold">{user.stats.posts}</span>
                    <span className="text-muted-foreground ml-1">Posts</span>
                  </div>
                  <div>
                    <span className="font-semibold">{user.stats.connections}</span>
                    <span className="text-muted-foreground ml-1">Connections</span>
                  </div>
                  <div>
                    <span className="font-semibold">{user.stats.contributions}</span>
                    <span className="text-muted-foreground ml-1">Contributions</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="mt-4 campus-animate-slide-up">
          <Tabs defaultValue="posts" className="w-full">
            <div className="w-full overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex w-full min-w-full">
                <TabsTrigger value="posts" className="flex-shrink-0">
                Posts
              </TabsTrigger>
                <TabsTrigger value="about" className="flex-shrink-0">
                À propos
              </TabsTrigger>
                <TabsTrigger value="connections" className="flex-shrink-0">
                Connections
              </TabsTrigger>
                <TabsTrigger value="contributions" className="flex-shrink-0">
                Contributions
              </TabsTrigger>
            </TabsList>
            </div>


            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4 mt-6">
              {isOwnProfile && (
                <div className="campus-animate-slide-up">
                  <CreatePost />
                </div>
              )}
              
              {userPostsData.map((post) => (
                <div key={post.id} className="campus-animate-fade-in">
                  <PostCard post={post} />
                </div>
              ))}
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="mt-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Amis ({userConnections.length})</h3>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userConnections.map((connection) => (
                      <Card key={connection.id} className="campus-card cursor-pointer hover:campus-glow transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={connection.avatar} />
                              <AvatarFallback className="bg-primary text-white font-bold">
                                {connection.name?.slice(0, 1).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{connection.name}</p>
                              <p className="text-sm text-muted-foreground">@{connection.username}</p>
                              <p className="text-xs text-muted-foreground">{connection.mutual} amis en commun</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewProfile(connection.id, connection.name)}
                            >
                              Voir
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about" className="mt-6">
              <div className="space-y-4">
                {/* Informations Personnelles */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <Users className="h-5 w-5" />
                      Informations Personnelles
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Téléphone</p>
                        <p className="font-medium">{user.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date de naissance</p>
                        <p className="font-medium">{user.dateOfBirth}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ville</p>
                        <p className="font-medium">{user.town}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Langue</p>
                        <p className="font-medium">{user.language}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations Académiques */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <GraduationCap className="h-5 w-5" />
                      Informations Académiques
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Université/Institut</p>
                        <p className="font-medium">{user.university}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Filière</p>
                        <p className="font-medium">{user.faculty}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Niveau d'études</p>
                        <p className="font-medium">{user.studyYear}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Campus</p>
                        <p className="font-medium">{user.campus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Matricule Étudiant</p>
                        <p className="font-medium">{user.studentId}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Centres d'intérêt */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <Award className="h-5 w-5" />
                      Centres d'intérêt
                  </h3>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest) => (
                        <Badge key={interest} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Compétences */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Compétences</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                </div>

                {/* Liens Portfolio */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <Link className="h-5 w-5" />
                    Liens Portfolio
                  </h3>
                  <div>
                    <div className="space-y-3">
                      {user.portfolioLinks.map((link, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div>
                              <p className="font-medium text-sm">{link.name}</p>
                              <p className="text-xs text-muted-foreground">{link.url}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(link.url, '_blank')}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Visiter
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Formations */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <BookOpen className="h-5 w-5" />
                      Formations Précédentes
                  </h3>
                    <div className="space-y-4">
                      {user.previousEducation.map((edu, index) => (
                        <div key={index} className="border-l-2 border-primary/50 pl-4">
                          <p className="font-semibold">{edu.degree}</p>
                          <p className="text-sm text-muted-foreground">{edu.school}</p>
                          <p className="text-xs text-muted-foreground">{edu.year}</p>
                        </div>
                      ))}
                    </div>
                </div>

                {/* Expériences */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <Briefcase className="h-5 w-5" />
                      Expériences
                  </h3>
                    <div className="space-y-4">
                      {user.experiences.map((exp, index) => (
                        <div key={index} className="border-l-2 border-primary/50 pl-4">
                          <p className="font-semibold">{exp.title}</p>
                          <p className="text-sm text-muted-foreground">{exp.company}</p>
                          <p className="text-xs text-muted-foreground mb-2">{exp.duration}</p>
                          <p className="text-sm">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            </TabsContent>

            {/* Contributions Tab */}
            <TabsContent value="contributions" className="mt-6">
              <div className="rounded-lg border bg-card p-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <FileText className="h-5 w-5" />
                      Fichiers Partagés
                  </h3>
                  <div>
                    <div className="space-y-3">
                      {user.sharedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 campus-gradient rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{file.type} • {file.size}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDownloadFile(file.name)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal d'édition du profil */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le profil</DialogTitle>
              <DialogDescription>
                Mettez à jour vos informations personnelles et académiques.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    defaultValue={user.firstName}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    defaultValue={user.lastName}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  defaultValue={user.username}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Biographie</Label>
                <Textarea
                  id="bio"
                  defaultValue={user.bio}
                  className="mt-2"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    defaultValue={user.phoneNumber}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="town">Ville</Label>
                  <Input
                    id="town"
                    defaultValue={user.town}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="language">Langues</Label>
                  <Input
                    id="language"
                    defaultValue={user.language}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={handleSaveProfile}
                >
                  <Check className="h-4 w-4" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal pour changer la photo de couverture */}
        <Dialog open={showCoverPhotoModal} onOpenChange={setShowCoverPhotoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo de couverture
              </DialogTitle>
              <DialogDescription>
                Téléchargez une nouvelle photo de couverture pour votre profil.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Aperçu de la photo */}
              <div className="relative">
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg overflow-hidden">
                  {coverPhotoPreview ? (
                    <img 
                      src={coverPhotoPreview} 
                      alt="Aperçu" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune photo sélectionnée</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Bouton pour supprimer */}
                {coverPhotoPreview && (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={handleRemoveCoverPhoto}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Input file caché */}
              <input
                ref={coverPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverPhotoChange}
                aria-label="Sélectionner une photo de couverture"
                title="Sélectionner une photo de couverture"
                placeholder="Sélectionner une photo de couverture"
                className="hidden"
              />

              {/* Boutons d'action */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => coverPhotoInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {coverPhotoPreview ? "Changer la photo" : "Sélectionner une photo"}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Formats acceptés : JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCoverPhotoModal(false);
                  setCoverPhotoFile(null);
                  setCoverPhotoPreview(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveCoverPhoto}
                disabled={!coverPhotoFile}
                className="campus-gradient text-white hover:opacity-90"
              >
                <Check className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal pour changer l'avatar */}
        <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photo de profil
              </DialogTitle>
              <DialogDescription>
                Téléchargez une nouvelle photo de profil pour votre compte.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Aperçu de l'avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full overflow-hidden ring-4 ring-background shadow-lg">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Aperçu avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Camera className="h-8 w-8 opacity-50" />
                      </div>
                    )}
                  </div>
                  
                  {/* Bouton pour supprimer */}
                  {avatarPreview && (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveAvatar}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Input file caché */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                aria-label="Sélectionner une photo de profil"
                title="Sélectionner une photo de profil"
                placeholder="Sélectionner une photo de profil"
                className="hidden"
              />

              {/* Boutons d'action */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {avatarPreview ? "Changer la photo" : "Sélectionner une photo"}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Formats acceptés : JPG, PNG, GIF (max 2MB)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveAvatar}
                disabled={!avatarFile}
                className="campus-gradient text-white hover:opacity-90"
              >
                <Check className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal pour changer le mood */}
        <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-lg">😊</span>
                Changer votre mood
              </DialogTitle>
              <DialogDescription>
                Partagez votre état d'esprit actuel avec votre communauté.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="mood">Mood du moment</Label>
                <Input
                  id="mood"
                  placeholder="Ex: 🚀 En pleine révision !, 😴 Fatigué mais motivé..."
                  value={newMood}
                  onChange={(e) => setNewMood(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Décrivez votre état d'esprit actuel
                </p>
              </div>

              {/* Moods prédéfinis */}
              <div>
                <Label>Suggestions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    "🚀 En pleine révision !",
                    "😴 Fatigué mais motivé",
                    "💡 Plein d'idées !",
                    "🎯 Concentré sur mes objectifs",
                    "🤝 Prêt à collaborer",
                    "📚 En mode apprentissage"
                  ].map((mood) => (
                    <Button
                      key={mood}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewMood(mood)}
                      className="text-xs h-auto py-2 px-3 justify-start"
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMoodModal(false);
                  setNewMood("");
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleMoodChange}
                disabled={!newMood.trim()}
                className="campus-gradient text-white hover:opacity-90"
              >
                <Check className="h-4 w-4 mr-2" />
                Mettre à jour
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}