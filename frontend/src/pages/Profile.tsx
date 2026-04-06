import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getCurrentUser, getUserByUsername, getUserPosts, uploadAvatar, uploadCoverPhoto, updateUserProfile, getUserConnections, getUserResources, connectWithUser, disconnectFromUser, downloadResource, getUserProfile, getUserConnectionRelation, isApiRequestErrorStatus } from "@/services/api";
import { MapPin, Camera, Calendar, Link, Users, User, BookOpen, Award, Settings, FileText, Briefcase, GraduationCap, Loader2, Check, Download, Unlink, ExternalLink, Upload, X, Zap, Smile, BriefcaseBusiness, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, formatFileSize } from "@/lib/utils"; // si tu utilises cn dans ce fichier

const NOT_AVAILABLE_TEXT = "—";
const MOOD_OPTIONS = [
  { value: "excited", label: "🚀 En pleine révision !" },
  { value: "focused", label: "🎯 Concentré sur mes objectifs" },
  { value: "collaborating", label: "🤝 Prêt à collaborer" },
  { value: "learning", label: "📚 En mode apprentissage" },
  { value: "inspired", label: "🌟 Inspiré et créatif" },
  { value: "determined", label: "💪 Déterminé" },
];

const MOOD_VALUE_TO_LABEL = MOOD_OPTIONS.reduce<Record<string, string>>((acc, mood) => {
  acc[mood.value] = mood.label;
  return acc;
}, {});

function getMoodLabel(moodValue?: string | null) {
  if (!moodValue) {
    return NOT_AVAILABLE_TEXT;
  }

  return MOOD_VALUE_TO_LABEL[moodValue] ?? moodValue;
}

function findMoodOptionByValue(moodValue?: string | null) {
  if (!moodValue) {
    return null;
  }

  return MOOD_OPTIONS.find((option) => option.value === moodValue) ?? null;
}

const STUDY_YEAR_LABELS: Record<string, string> = {
  bts1: "BTS 1/HND 1",
  bts2: "BTS 2/HND 2",
  l1: "Licence 1/Bachelor 1",
  l2: "Licence 2/Bachelor 2",
  l3: "Licence 3/Bachelor 3",
  l4: "Licence 4/Bachelor 4",
  m1: "Master 1",
  m2: "Master 2",
  d1: "Doctorat 1/PhD 1",
  d2: "Doctorat 2/PhD 2",
  d3: "Doctorat 3/PhD 3",
  other: "Autre niveau",
};

const FACULTY_LABELS: Record<string, string> = {
  // Sciences de la Santé
  medecine: "Médecine générale",
  pharmacie: "Pharmacie",
  veterinaire: "Vétérinaire",
  odontostomatologie: "Odontostomatologie (Chirurgie dentaire)",
  sciences_infirmieres: "Sciences infirmières",
  sage_femme: "Sage-femme / Maïeutique",
  techniques_laboratoire: "Techniques de laboratoire médical",
  radiologie: "Radiologie / Imagerie médicale",
  sante_publique: "Santé publique",
  biotechnologies: "Biotechnologies",
  science_laboratoire_medicale: "Sciences de laboratoire médical",
  sciences_biomedicales: "Sciences biomédicales",
  physiotherapie: "Physiothérapie / Kinésithérapie",
  nutrition: "Nutrition et diététique",
  // Sciences et Technologies
  mathematiques: "Mathématiques",
  physique: "Physique",
  chimie: "Chimie",
  biologie: "Biologie",
  sciences_terre: "Sciences de la Terre et Géologie",
  environnement: "Sciences de l'Environnement",
  energies_renouvelables: "Énergies renouvelables",
  geomatique: "Géomatique / Géographie physique",
  statistiques: "Statistiques et Probabilités",
  informatique_generale: "Informatique générale",
  developpement_web: "Développement Web",
  developpement_mobile: "Développement d'applications mobiles",
  intelligence_artificielle: "Intelligence Artificielle (IA)",
  machine_learning: "Machine Learning / Deep Learning",
  science_donnees: "Science des données (Data Science)",
  big_data: "Big Data et Analyse de données",
  "cybersécurité": "Cybersécurité / Sécurité informatique",
  reseaux_telecom: "Réseaux et Télécommunications",
  systemes_reseaux: "Systèmes et Administration Réseaux",
  cloud_computing: "Cloud Computing",
  systemes_embarques: "Systèmes embarqués / IoT",
  informatique_industrielle: "Informatique industrielle / Automatisme",
  base_donnees: "Bases de données et Administration BDD",
  genie_informatique: "Génie Informatique",
  informatique_theorique: "Informatique théorique et Algorithmique",
  multimedia_jeux: "Multimédia et Développement de jeux vidéo",
  informatique_gestion: "Informatique de gestion / Systèmes d'information",
  // Ingénierie
  genie_civil: "Génie Civil",
  genie_electrique: "Génie Électrique / Électrotechnique",
  genie_mecanique: "Génie Mécanique",
  genie_electronique: "Génie Electronique",
  genie_automatique: "Génie Automatique",
  genie_electromecanique: "Génie Electromécanique",
  genie_chimique: "Génie Chimique",
  genie_logiciel: "Génie logiciel / Développement logiciel",
  genie_industriel: "Génie Industriel",
  genie_procedes: "Génie des Procédés / Chimie industrielle",
  genie_energies: "Génie des Énergies",
  genie_automobile: "Génie Automobile",
  genie_aeronautique: "Génie Aéronautique et Spatial",
  genie_robotique: "Génie Robotique",
  genie_minier: "Génie minier",
  maintenance_systemes_industriels: "Maintenance des systèmes industrielle",
  maintenance_systemes_informatique: "Maintenance des systèmes informatique",
  automatisation_industrielle: "Automatisation industrielle",
  tic: "Technologies de l'Information et de la Communication (TIC)",
  logistique: "Logistique et Transport",
  // Agronomie
  agronomie: "Agronomie générale",
  productions_vegetales: "Productions végétales",
  productions_animales: "Productions animales / Élevage",
  sciences_forestieres: "Sciences forestières",
  aquaculture: "Aquaculture et Pêche",
  agribusiness: "Agribusiness / Économie rurale",
  technologie_agroalimentaire: "Technologie agroalimentaire",
  medecine_veterinaire: "Sciences vétérinaires / Médecine vétérinaire",
  gestion_environnement: "Gestion des ressources naturelles",
  // Économie & Gestion
  economie: "Économie",
  gestion_entreprises: "Gestion des Entreprises / Management",
  comptabilite_finance: "Comptabilité / Finance / Audit",
  banque_assurance: "Banque et Assurance",
  marketing: "Marketing / Commerce international",
  grh: "Gestion des Ressources Humaines",
  administration_affaires: "Administration des Affaires",
  // Droit
  droit_prive: "Droit privé",
  droit_public: "Droit public",
  sciences_politiques: "Sciences politiques",
  relations_internationales: "Relations internationales / Diplomatie",
  droit_international: "Droit international",
  // Lettres
  histoire: "Histoire",
  geographie: "Géographie humaine",
  philosophie: "Philosophie",
  litterature: "Littérature (française, anglaise, africaine)",
  linguistique: "Linguistique / Langues modernes",
  anthropologie: "Anthropologie / Sociologie",
  psychologie: "Psychologie",
  communication: "Communication / Journalisme",
  tourisme: "Tourisme / Patrimoine culturel",
  // Éducation
  sciences_education: "Sciences de l'Éducation",
  formation_enseignants: "Formation des enseignants du secondaire (ENS)",
  enseignement_technique: "Formation technique et professionnelle (ENSET)",
  pedagogie: "Pédagogie / Didactique",
  administration_scolaire: "Administration scolaire",
  eps: "Éducation physique et sportive",
  // Autres
  sciences_maritimes: "Sciences maritimes / Océanographie",
  mines_geologie: "Mines et Géologie appliquée",
  hydraulique: "Hydraulique et Maîtrise des Eaux",
  autre: "Autre filière",
};

const normalizeCanonicalLabel = (value: unknown, map: Record<string, string>): string => {
  if (!value || typeof value !== "string") return "";
  const key = value.trim().toLowerCase();
  return map[key] || value;
};

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
};

function isProfilePayloadValid(profile: any): boolean {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  const identifier = profile.id;
  const hasValidIdentifier = identifier !== null && identifier !== undefined && identifier !== "";
  const username = profile.username ?? profile.slug;
  const hasValidUsername = typeof username === "string" && username.trim().length > 0;

  return hasValidIdentifier && hasValidUsername;
}

export function getConnectionCounterpart(conn: any, targetUserId: string) {
  const requesterId = normalizeId(conn?.requester ?? conn?.requester_id ?? conn?.requester_info?.id);
  const recipientId = normalizeId(conn?.recipient ?? conn?.recipient_id ?? conn?.recipient_info?.id);

  const isRequesterTarget = requesterId === targetUserId;
  const isRecipientTarget = recipientId === targetUserId;

  if (!isRequesterTarget && !isRecipientTarget) {
    return null;
  }

  const counterpartInfo = isRequesterTarget ? conn?.recipient_info : conn?.requester_info;
  const counterpartId = isRequesterTarget ? recipientId : requesterId;

  return {
    id: normalizeId(counterpartInfo?.id ?? counterpartId ?? conn?.id ?? conn?.user_id),
    name: counterpartInfo?.full_name || counterpartInfo?.name || conn?.name || "Utilisateur",
    username: counterpartInfo?.username || conn?.username || "user",
    avatar: counterpartInfo?.avatar || conn?.avatar || "/placeholder-avatar.jpg",
    mutual: 0,
  };
}

function mapProfileToViewModel({
  profile,
  posts,
  connections,
  resources,
  resourcesAvailable,
  loading,
}: {
  profile: any;
  posts: any[];
  connections: any[];
  resources: any[];
  resourcesAvailable: boolean;
  loading: boolean;
}) {
  if (!profile || loading) {
    return {
      name: "",
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      avatar: "/placeholder-avatar.jpg",
      coverPhoto: null,
      bio: "",
      town: "",
      language: "",
      impactScore: null,
      currentMood: "",
      university: "",
      faculty: "",
      studyYear: "",
      studentId: "",
      campus: "",
      previousEducation: [],
      experiences: [],
      skills: [],
      interests: [],
      portfolioLinks: [],
      sharedFiles: [],
      stats: {
        posts: 0,
        connections: 0,
        contributions: null as number | null,
      },
      badges: [],
    };
  }

  const NOT_AVAILABLE_TEXT = "N/A";
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  const displayName = fullName || profile.username || NOT_AVAILABLE_TEXT;

  return {
    name: profile.name ?? displayName,
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    username: profile.username ?? profile.slug ?? "",
    email: profile.email ?? "",
    phoneNumber: profile.phone_number ?? profile.phoneNumber ?? "",
    dateOfBirth: profile.date_of_birth ?? profile.dateOfBirth ?? "",
    avatar: profile.avatar ?? "/placeholder-avatar.jpg",
    coverPhoto: profile.coverPhoto ?? null,
    bio: profile.bio ?? "",
    town: profile.town ?? "",
    language: profile.language ?? "",
    impactScore: profile.impactScore ?? null,
    university: profile.university ?? "",
    faculty: profile.faculty ?? "",
    studyYear: profile.studyYear ?? profile.study_year ?? "",
    studentId: profile.studentId ?? "",
    campus: profile.campus ?? "",
    currentMood: profile.current_mood ?? profile.currentMood ?? "",
    previousEducation: profile.previousEducation ?? profile.previous_education ?? [],
    experiences: profile.experiences ?? [],
    skills: profile.skills ?? [],
    interests: profile.interests ?? [],
    portfolioLinks: profile.portfolioLinks ?? profile.portfolio_links ?? [],
    sharedFiles: (resources || []).map((resource: any) => ({
      id: resource.id,
      resourceId: resource.id,
      name: resource.title || resource.filename || resource.fileName || NOT_AVAILABLE_TEXT,
      filename: resource.filename || resource.fileName || resource.title || `resource-${resource.id}`,
      type: resource.type || NOT_AVAILABLE_TEXT,
      size: formatFileSize(resource.fileSize || 0),
    })),
    stats: {
      posts: posts?.length || 0,
      connections: connections?.length || 0,
      contributions: resourcesAvailable ? resources.length : null,
    },
    badges: [
      ...(profile.is_staff || profile.isStaff ? [{ id: 'admin', label: 'CampusSphere Admin', color: 'bg-gradient-to-r from-primary to-accent text-white' }] : []),
    ],
  };
}

export function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams<{ username?: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [relationActionUnavailable, setRelationActionUnavailable] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false);

  // Edit form state
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editExperiences, setEditExperiences] = useState<{title: string; company: string; duration: string; description: string}[]>([]);
  const [editPreviousEducation, setEditPreviousEducation] = useState<{degree: string; school: string; year: string}[]>([]);
  const [editPortfolioLinks, setEditPortfolioLinks] = useState<{name: string; url: string}[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [newMood, setNewMood] = useState<{ value: string; label: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [userResources, setUserResources] = useState<any[]>([]);
  const [resourcesAvailable, setResourcesAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState(false);

  // Tab State - NEW (same as Spheres)
  const [activeTab, setActiveTab] = useState("posts");

  // Load current user
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted && isProfilePayloadValid(data)) {
          setCurrentUser(data);
          if (!username) {
            setTargetUser(data);
          }
          setProfileLoadError(false);
        } else if (isMounted && !username) {
          setProfileLoadError(true);
        }
      } catch (e) {
        // User not logged in
        if (isMounted && !username) {
          setProfileLoadError(true);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load target user by username
  useEffect(() => {
    if (!username) return;
    
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const user = await getUserByUsername(username);
        if (isMounted && user && isProfilePayloadValid(user)) {
          setTargetUser(user);
          setProfileLoadError(false);
        } else if (isMounted) {
          setProfileLoadError(true);
        }
      } catch (e: any) {
        // User not found
        console.error('Error loading user:', e);
        if (isMounted) {
          setProfileLoadError(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [username]);

  // Load user posts
  useEffect(() => {
    if (!targetUser?.id) return;
    
    let isMounted = true;
    (async () => {
      try {
        const posts = await getUserPosts(targetUser.id);
        if (isMounted) {
          setUserPosts(posts || []);
        }
      } catch (e) {
        // Error loading posts
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, targetUser?.id]);
  
  // Vérifier si c'est le profil de l'utilisateur actuel
  const isOwnProfile = !username || username === currentUser?.username;
  
  // Données utilisateur avec fallback
  const user = useMemo(() => {
    return mapProfileToViewModel({
      profile: targetUser,
      posts: userPosts,
      connections: userConnections,
      resources: userResources,
      resourcesAvailable,
      loading,
    });
  }, [targetUser, userPosts, userConnections, userResources, resourcesAvailable, loading]);

  const aboutProfile = useMemo(() => ({
    phoneNumber: user.phoneNumber ?? "",
    dateOfBirth: user.dateOfBirth ?? "",
  }), [user.phoneNumber, user.dateOfBirth]);

  // Load connections
  useEffect(() => {
    if (!targetUser?.id) return;
    
    let isMounted = true;
    (async () => {
      try {
        const connections = await getUserConnections(targetUser.id);
        if (isMounted && connections) {
          const profileOwnerId = String(targetUser.id);

          const mapped = (connections || [])
            .map((conn: any) => getConnectionCounterpart(conn, profileOwnerId))
            .filter(Boolean);
          setUserConnections(mapped as any[]);
        }
      } catch (e) {
        // Error loading connections
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [targetUser?.id]);

  // Load user resources
  useEffect(() => {
    if (!targetUser?.id) return;

    let isMounted = true;
    (async () => {
      try {
        const resources = await getUserResources(targetUser.id);
        if (isMounted) {
          setUserResources(resources || []);
          setResourcesAvailable(true);
        }
      } catch (e) {
        if (isMounted) {
          setUserResources([]);
          setResourcesAvailable(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, targetUser?.id]);

  // Initialize connection status (current user <-> target user)
  useEffect(() => {
    if (!currentUser?.id || !targetUser?.id || isOwnProfile) {
      setIsFollowing(false);
      setCurrentConnectionId(null);
      setRelationActionUnavailable(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const relation = await getUserConnectionRelation(targetUser.id);
        if (!isMounted || !relation) return;

        setRelationActionUnavailable(false);
        setIsFollowing(Boolean(relation.is_connected));
        setCurrentConnectionId(relation.connection?.id != null ? String(relation.connection.id) : null);
      } catch (error) {
        if (isMounted) {
          setIsFollowing(false);
          setCurrentConnectionId(null);
          setRelationActionUnavailable(isApiRequestErrorStatus(error, 403));
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, targetUser?.id, isOwnProfile]);

  const userPostsData = useMemo(() => {
    if (!userPosts || userPosts.length === 0) return [];
    
    return userPosts.map((post: any) => ({
      id: post.id,
      author: {
        name: post.author?.name || targetUser?.name || currentUser?.name || "",
        avatar: post.author?.avatar || targetUser?.avatar || currentUser?.avatar || "",
        username: post.author?.username || targetUser?.username || currentUser?.username || "",
        isVerified: post.author?.isVerified || false,
        impactScore: Number(post.author?.impactScore || 0),
      },
      content: post.content || post.text || "",
      createdAt: post.createdAt || post.created_at || null,
      likes: post.likesCount ?? post.likes_count ?? post.likes ?? 0,
      comments: post.commentsCount ?? post.comments_count ?? post.comments ?? 0,
      category: post.category || "Général",
      impactScore: Number(post.impactScore ?? post.impact_score ?? 0),
      isLiked: Boolean(post.isLiked ?? post.is_liked),
      isSaved: Boolean(post.isSaved ?? post.is_saved),
      canEdit: Boolean(post.canEdit ?? post.can_edit),
      canDelete: Boolean(post.canDelete ?? post.can_delete),
      files: post.files || [],
      image: post.image || null,
    }));
  }, [currentUser, targetUser, userPosts]);

  const displayFaculty = useMemo(
    () => normalizeCanonicalLabel(user.faculty, FACULTY_LABELS) || NOT_AVAILABLE_TEXT,
    [user.faculty]
  );
  const displayStudyYear = useMemo(
    () => normalizeCanonicalLabel(user.studyYear, STUDY_YEAR_LABELS) || NOT_AVAILABLE_TEXT,
    [user.studyYear]
  );

  const handleFollow = async () => {
    if (!currentUser?.id || !targetUser?.id || isFollowingLoading) return;

    const previousIsFollowing = isFollowing;
    const previousConnectionId = currentConnectionId;
    const nextIsFollowing = !previousIsFollowing;

    // Optimistic update
    setIsFollowing(nextIsFollowing);
    setIsFollowingLoading(true);

    try {
      if (previousIsFollowing) {
        if (!previousConnectionId) {
          throw new Error("Connection introuvable pour la suppression.");
        }

        await disconnectFromUser(targetUser.id);
        setCurrentConnectionId(null);
      } else {
        const response = await connectWithUser(targetUser.id);
        const createdConnectionId =
          response?.id != null ? String(response.id) : previousConnectionId;
        setCurrentConnectionId(createdConnectionId ?? null);
      }
      setRelationActionUnavailable(false);

      toast({
        title: previousIsFollowing ? "Connexion supprimée" : "Connexion envoyée",
        description: previousIsFollowing
          ? `Vous n'êtes plus connecté(e) à ${user.name}`
          : `Vous êtes maintenant connecté(e) à ${user.name}`,
        duration: 2000,
      });
    } catch (error: any) {
      // Rollback optimistic state
      setIsFollowing(previousIsFollowing);
      setCurrentConnectionId(previousConnectionId);
      if (isApiRequestErrorStatus(error, 403)) {
        setRelationActionUnavailable(true);
      }

      toast({
        title: "Erreur",
        description:
          error?.message ||
          (previousIsFollowing
            ? "Impossible de supprimer la connexion"
            : "Impossible de créer la connexion"),
        variant: "destructive",
      });
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleViewProfile = (username?: string, connectionName?: string, showToast = false) => {
    if (!username) {
      toast({
        title: "Profil indisponible",
        description: "Impossible d'ouvrir ce profil pour le moment : username manquant.",
        variant: "destructive",
      });
      return;
    }

    const targetPath = `/profile/${encodeURIComponent(username)}`;

    // Route-level check: avoid redundant navigation when already on the selected profile page.
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }

    if (showToast && connectionName) {
      toast({
        title: "Navigation vers profil",
        description: `Ouverture du profil de ${connectionName}`,
        duration: 2000,
      });
    }
  };

  const handleDownloadFile = async (resourceId?: string | number, fileName?: string) => {
    if (!resourceId) {
      toast({
        title: "Téléchargement indisponible",
        description: "Cette contribution ne possède pas d'identifiant de ressource valide.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await downloadResource(resourceId);
      const objectUrl = window.URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = result.filename || fileName || `resource-${resourceId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);

      toast({
        title: "Téléchargement démarré",
        description: `Le fichier "${result.filename || fileName || `resource-${resourceId}`}" va être téléchargé`,
        duration: 2000,
      });
    } catch (error: any) {
      const message = String(error?.message || "").toLowerCase();
      const isPermissionError =
        message.includes("403") ||
        message.includes("forbidden") ||
        message.includes("permission") ||
        message.includes("not allowed") ||
        message.includes("not authorized");

      toast({
        title: isPermissionError ? "Téléchargement non autorisé" : "Erreur de téléchargement",
        description: isPermissionError
          ? "Vous n'avez pas l'autorisation de télécharger cette ressource. Vérifiez sa visibilité ou contactez son propriétaire."
          : error?.message || "Impossible de télécharger cette ressource pour le moment.",
        variant: "destructive",
      });
    }
  };

  const handleEditProfile = () => {
    setEditSkills(user.skills?.map((s: any) => typeof s === "string" ? s : s?.name || "").filter(Boolean) ?? []);
    setEditInterests(user.interests?.map((i: any) => typeof i === "string" ? i : i?.name || "").filter(Boolean) ?? []);
    setEditExperiences(user.experiences?.length > 0 ? user.experiences : [{ title: "", company: "", duration: "", description: "" }]);
    setEditPreviousEducation(user.previousEducation?.length > 0 ? user.previousEducation : [{ degree: "", school: "", year: "" }]);
    setEditPortfolioLinks(user.portfolioLinks?.length > 0 ? user.portfolioLinks.map((e: any) => typeof e === "string" ? { name: "", url: e } : e) : [{ name: "", url: "" }]);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.id || isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      const firstNameInput = document.getElementById('firstName') as HTMLInputElement;
      const lastNameInput = document.getElementById('lastName') as HTMLInputElement;
      const usernameInput = document.getElementById('username') as HTMLInputElement;
      const bioInput = document.getElementById('bio') as HTMLTextAreaElement;
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const phoneInput = document.getElementById('phone') as HTMLInputElement;
      const townInput = document.getElementById('town') as HTMLInputElement;
      const languageInput = document.getElementById('language') as HTMLInputElement;
      
      const updateData: any = {};
      if (firstNameInput?.value) updateData.first_name = firstNameInput.value;
      if (lastNameInput?.value) updateData.last_name = lastNameInput.value;
      if (usernameInput?.value) updateData.username = usernameInput.value;
      if (bioInput?.value) updateData.bio = bioInput.value;
      if (emailInput?.value) updateData.email = emailInput.value;
      if (phoneInput?.value) updateData.phone_number = phoneInput.value;
      if (townInput?.value) updateData.town = townInput.value;
      if (languageInput?.value) updateData.language = languageInput.value;
      updateData.skills = editSkills.filter(Boolean);
      updateData.interests = editInterests.filter(Boolean);
      updateData.experiences = editExperiences.filter(e => e.title || e.company);
      updateData.previous_education = editPreviousEducation.filter(e => e.degree || e.school);
      updateData.portfolio_links = editPortfolioLinks.filter(e => e.url);
      
      await updateUserProfile(updateData);
      
      toast({
        title: "Profil mis à jour !",
        description: "Vos modifications ont été sauvegardées",
        duration: 3000,
      });
      setShowEditModal(false);
      
      const userData = await getCurrentUser();
      setCurrentUser(userData);
      if (isOwnProfile) setTargetUser(userData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Fichier trop grand", description: "La photo de couverture ne doit pas dépasser 5MB", variant: "destructive" });
        return;
      }
      setCoverPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCoverPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCoverPhoto = async () => {
    if (!coverPhotoFile || !currentUser?.id || isSavingCover) return;
    setIsSavingCover(true);
    try {
      await uploadCoverPhoto(currentUser.id, coverPhotoFile);
      toast({ title: "Photo de couverture mise à jour !", description: "Votre nouvelle photo de couverture a été sauvegardée", duration: 3000 });
      setShowCoverPhotoModal(false);
      setCoverPhotoFile(null);
      setCoverPhotoPreview(null);
      const userData = await getCurrentUser();
      setCurrentUser(userData);
      if (isOwnProfile) setTargetUser(userData);
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Impossible de mettre à jour la photo de couverture", variant: "destructive" });
    } finally {
      setIsSavingCover(false);
    }
  };

  const handleRemoveCoverPhoto = () => {
    setCoverPhotoFile(null);
    setCoverPhotoPreview(null);
    toast({ title: "Photo de couverture supprimée", description: "Votre photo de couverture a été supprimée", duration: 2000 });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Fichier trop grand", description: "L'avatar ne doit pas dépasser 2MB", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile || !currentUser?.id || isSavingAvatar) return;
    setIsSavingAvatar(true);
    try {
      await uploadAvatar(currentUser.id, avatarFile);
      toast({ title: "Avatar mis à jour !", description: "Votre nouvel avatar a été sauvegardé", duration: 3000 });
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      const userData = await getCurrentUser();
      setCurrentUser(userData);
      if (isOwnProfile) setTargetUser(userData);
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Impossible de mettre à jour l'avatar", variant: "destructive" });
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    toast({ title: "Avatar supprimé", description: "Votre avatar a été supprimé", duration: 2000 });
  };

  const handleMoodChange = async () => {
    if (!newMood?.value || !currentUser?.id || isSavingMood) return;
    setIsSavingMood(true);
    const selectedMoodValue = newMood.value;

    try {
      await updateUserProfile({ current_mood: selectedMoodValue });

      let refreshedProfile = await getUserProfile();
      if (!refreshedProfile) {
        refreshedProfile = await getCurrentUser();
      }

      const confirmedMoodValue = refreshedProfile?.currentMood ?? refreshedProfile?.current_mood ?? "";

      setCurrentUser(refreshedProfile);
      if (isOwnProfile) setTargetUser(refreshedProfile);
      setNewMood(null);
      setShowMoodModal(false);

      if (confirmedMoodValue !== selectedMoodValue) {
        toast({
          title: "mise à jour non confirmée",
          description: "La valeur enregistrée diffère de votre sélection.",
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Mood mis à jour !", description: "Votre mood du moment a été changé", duration: 2000 });
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Impossible de mettre à jour le mood", variant: "destructive" });
    } finally {
      setIsSavingMood(false);
    }
  };

  const cardClasses = cn(
    "transition-all duration-300",
    isMobile ? "rounded-none border-x-0 border-t-0 shadow-none bg-card" : "campus-card hover:campus-glow"
  );

  if (!loading && profileLoadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        <div className="container max-w-4xl mx-auto py-6 px-4">
          <Card className="campus-card mobile-card">
            <CardHeader>
              <CardTitle>Erreur de chargement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Le profil reçu est invalide ou obsolète. Veuillez recharger la page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div key={`${username || 'current'}`} className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-0 px-0 sm:py-4">
        {/* Profile Header */}
        <div className={cardClasses}>
          {/* Photo de couverture */}
          <div className="relative rounded-t-null sm:rounded-t-lg h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/30 overflow-hidden">
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
                    <div className="space-y-1">
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollow}
                        disabled={isFollowingLoading || relationActionUnavailable}
                        className={!isFollowing ? "campus-gradient text-white hover:opacity-90" : ""}
                        size="sm"
                      >
                        {isFollowingLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : isFollowing ? (
                          <>
                            <Unlink className="h-4 w-4 mr-2" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <Link className="h-4 w-4 mr-2" />
                            Connect
                          </>
                        )}
                      </Button>
                      {relationActionUnavailable && (
                        <p className="text-xs text-muted-foreground">
                          L'action de connexion est indisponible pour ce profil.
                        </p>
                      )}
                    </div>
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

                <p className="text-foreground leading-relaxed">{user.bio || NOT_AVAILABLE_TEXT}</p>

                {/* Impact Score et Mood */}
                <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Impact Score</p>
                      <p className="text-lg font-bold text-primary">{user.impactScore ?? NOT_AVAILABLE_TEXT}</p>
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
                      <p className="text-sm text-muted-foreground">{getMoodLabel(user.currentMood)}</p>
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
                    <span className="font-semibold">{user.stats.contributions ?? NOT_AVAILABLE_TEXT}</span>
                    <span className="text-muted-foreground ml-1">Contributions</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge: any) => (
                    <Badge
                      key={badge.id || badge}
                      className={`gap-1 ${badge.id === 'admin' ? 'campus-gradient text-white border-0' : ''}`}
                      variant={badge.id === 'admin' ? 'default' : 'secondary'}
                    >
                      {badge.id === 'admin' && <Shield className="h-3 w-3" />}
                      {badge.label || badge}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs - CUSTOM (SAME AS SPHERES) */}
        <div className="mt-4 campus-animate-slide-up">
          <ul className="grid grid-flow-col text-center border-b border-gray-200 text-gray-500">
            {[
              { id: "posts", label: "Posts" },
              { id: "about", label: "À propos" },
              { id: "connections", label: "Connections" },
              { id: "contributions", label: "Contributions" },
            ].map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex justify-center border-b-4 py-4 transition-all duration-200 text-sm font-medium",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent hover:text-primary hover:border-primary"
                  )}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          {/* POSTS */}
          {activeTab === "posts" && (
            <section className="space-y-4 mt-6">
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
            </section>
          )}

          {/* CONNECTIONS */}
          {activeTab === "connections" && (
            <section className="mt-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Connexions ({userConnections.length})</h3>
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userConnections.map((connection) => (
                      <Card key={connection.id} className="campus-card mobile-card cursor-pointer hover:campus-glow transition-all">
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
                              onClick={() => handleViewProfile(connection.username, connection.name, true)}
                              disabled={!connection.username}
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
            </section>
          )}

          {/* ABOUT */}
          {activeTab === "about" && (
            <section className="mt-6 space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <GraduationCap className="h-5 w-5" />
                  Informations académiques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Université</p>
                    <p className="font-medium">{user.university || NOT_AVAILABLE_TEXT}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Filière</p>
                    <p className="font-medium">{displayFaculty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Niveau</p>
                    <p className="font-medium">{displayStudyYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Matricule</p>
                    <p className="font-medium">{user.studentId || NOT_AVAILABLE_TEXT}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Campus</p>
                    <p className="font-medium">{user.campus || NOT_AVAILABLE_TEXT}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <BookOpen className="h-5 w-5" />
                  Formations précédentes
                </h3>
                {user.previousEducation?.length > 0 ? (
                  <div className="space-y-3">
                    {user.previousEducation.map((edu: any, index: number) => (
                      <div key={`${edu?.degree || "degree"}-${index}`} className="border rounded-lg p-3">
                        <p className="font-medium">{edu?.degree || NOT_AVAILABLE_TEXT}</p>
                        <p className="text-sm text-muted-foreground">{edu?.school || NOT_AVAILABLE_TEXT}</p>
                        <p className="text-xs text-muted-foreground">{edu?.year || NOT_AVAILABLE_TEXT}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{NOT_AVAILABLE_TEXT}</p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Briefcase className="h-5 w-5" />
                  Expériences
                </h3>
                {user.experiences?.length > 0 ? (
                  <div className="space-y-3">
                    {user.experiences.map((exp: any, index: number) => (
                      <div key={`${exp?.title || "experience"}-${index}`} className="border rounded-lg p-3">
                        <p className="font-medium">{exp?.title || NOT_AVAILABLE_TEXT}</p>
                        <p className="text-sm text-muted-foreground">
                          {[exp?.company, exp?.duration].filter(Boolean).join(" • ") || NOT_AVAILABLE_TEXT}
                        </p>
                        <p className="text-sm mt-1">{exp?.description || NOT_AVAILABLE_TEXT}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{NOT_AVAILABLE_TEXT}</p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <User className="h-5 w-5" />
                  Informations Personnelles
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email || NOT_AVAILABLE_TEXT}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <p className="font-medium">{aboutProfile.phoneNumber || NOT_AVAILABLE_TEXT}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date de naissance</p>
                      <p className="font-medium">{aboutProfile.dateOfBirth || NOT_AVAILABLE_TEXT}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ville</p>
                      <p className="font-medium">{user.town || NOT_AVAILABLE_TEXT}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Langue</p>
                      <p className="font-medium">{user.language || NOT_AVAILABLE_TEXT}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Zap className="h-5 w-5" />
                  Compétences
                </h3>
                {user.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill: any, index: number) => (
                      <Badge key={`${skill}-${index}`} variant="secondary">
                        {typeof skill === "string" ? skill : skill?.name || NOT_AVAILABLE_TEXT}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{NOT_AVAILABLE_TEXT}</p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Smile className="h-5 w-5" />
                  Centres d'intérêt
                </h3>
                {user.interests?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest: any, index: number) => (
                      <Badge key={`${interest}-${index}`} variant="outline">
                        {typeof interest === "string" ? interest : interest?.name || NOT_AVAILABLE_TEXT}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{NOT_AVAILABLE_TEXT}</p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <BriefcaseBusiness className="h-5 w-5" />
                  Portfolio
                </h3>
                {user.portfolioLinks?.length > 0 ? (
                  <div className="space-y-2">
                    {user.portfolioLinks.map((entry: any, index: number) => {
                      const rawUrl = typeof entry === "string" ? entry : entry?.url;
                      const href = rawUrl?.startsWith("http") ? rawUrl : rawUrl ? `https://${rawUrl}` : "";
                      const label = (typeof entry === "object" && entry?.name) || rawUrl || `Lien ${index + 1}`;

                      return href ? (
                        <a
                          key={`${href}-${index}`}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                        >
                          <span className="font-medium truncate pr-2">{label}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        </a>
                      ) : (
                        <p key={`invalid-link-${index}`} className="text-sm text-muted-foreground">
                          {NOT_AVAILABLE_TEXT}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{NOT_AVAILABLE_TEXT}</p>
                )}
              </div>
            </section>
          )}

          {/* CONTRIBUTIONS */}
          {activeTab === "contributions" && (
            <section className="mt-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <FileText className="h-5 w-5" />
                  Fichiers Partagés
                </h3>
                <div>
                  <div className="space-y-3">
                    {user.sharedFiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {resourcesAvailable ? "Aucune contribution pour le moment." : NOT_AVAILABLE_TEXT}
                      </p>
                    ) : (
                      user.sharedFiles.map((file: any, index: number) => (
                        <div key={file.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
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
                            onClick={() => handleDownloadFile(file.resourceId, file.filename || file.name)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
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
              
              {/* Compétences */}
              <div>
                <Label>Compétences</Label>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Ajouter une compétence..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSkill.trim() && !editSkills.includes(newSkill.trim())) { setEditSkills([...editSkills, newSkill.trim()]); setNewSkill(""); } } }} />
                  <Button type="button" variant="outline" onClick={() => { if (newSkill.trim() && !editSkills.includes(newSkill.trim())) { setEditSkills([...editSkills, newSkill.trim()]); setNewSkill(""); } }}>+</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editSkills.map((s, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setEditSkills(editSkills.filter((_, j) => j !== i))}>{s} ×</Badge>
                  ))}
                </div>
              </div>

              {/* Centres d'intérêt */}
              <div>
                <Label>Centres d'intérêt</Label>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Ajouter un intérêt..." value={newInterest} onChange={(e) => setNewInterest(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newInterest.trim() && !editInterests.includes(newInterest.trim())) { setEditInterests([...editInterests, newInterest.trim()]); setNewInterest(""); } } }} />
                  <Button type="button" variant="outline" onClick={() => { if (newInterest.trim() && !editInterests.includes(newInterest.trim())) { setEditInterests([...editInterests, newInterest.trim()]); setNewInterest(""); } }}>+</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editInterests.map((s, i) => (
                    <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setEditInterests(editInterests.filter((_, j) => j !== i))}>{s} ×</Badge>
                  ))}
                </div>
              </div>

              {/* Expériences */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Expériences</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditExperiences([...editExperiences, { title: "", company: "", duration: "", description: "" }])}>+ Ajouter</Button>
                </div>
                {editExperiences.map((exp, i) => (
                  <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Expérience {i + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditExperiences(editExperiences.filter((_, j) => j !== i))}>Supprimer</Button>
                    </div>
                    <Input placeholder="Titre du poste" value={exp.title} onChange={(e) => { const n = [...editExperiences]; n[i] = {...n[i], title: e.target.value}; setEditExperiences(n); }} />
                    <Input placeholder="Entreprise" value={exp.company} onChange={(e) => { const n = [...editExperiences]; n[i] = {...n[i], company: e.target.value}; setEditExperiences(n); }} />
                    <Input placeholder="Durée (ex: 2022-2023)" value={exp.duration} onChange={(e) => { const n = [...editExperiences]; n[i] = {...n[i], duration: e.target.value}; setEditExperiences(n); }} />
                    <Textarea placeholder="Description" value={exp.description} onChange={(e) => { const n = [...editExperiences]; n[i] = {...n[i], description: e.target.value}; setEditExperiences(n); }} rows={2} />
                  </div>
                ))}
              </div>

              {/* Formations précédentes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Formations précédentes</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditPreviousEducation([...editPreviousEducation, { degree: "", school: "", year: "" }])}>+ Ajouter</Button>
                </div>
                {editPreviousEducation.map((edu, i) => (
                  <div key={i} className="border rounded-lg p-3 mb-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Formation {i + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setEditPreviousEducation(editPreviousEducation.filter((_, j) => j !== i))}>Supprimer</Button>
                    </div>
                    <Input placeholder="Diplôme" value={edu.degree} onChange={(e) => { const n = [...editPreviousEducation]; n[i] = {...n[i], degree: e.target.value}; setEditPreviousEducation(n); }} />
                    <Input placeholder="Établissement" value={edu.school} onChange={(e) => { const n = [...editPreviousEducation]; n[i] = {...n[i], school: e.target.value}; setEditPreviousEducation(n); }} />
                    <Input placeholder="Année" value={edu.year} onChange={(e) => { const n = [...editPreviousEducation]; n[i] = {...n[i], year: e.target.value}; setEditPreviousEducation(n); }} />
                  </div>
                ))}
              </div>

              {/* Portfolio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Portfolio / Liens</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditPortfolioLinks([...editPortfolioLinks, { name: "", url: "" }])}>+ Ajouter</Button>
                </div>
                {editPortfolioLinks.map((link, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input placeholder="Nom (ex: GitHub)" value={link.name} onChange={(e) => { const n = [...editPortfolioLinks]; n[i] = {...n[i], name: e.target.value}; setEditPortfolioLinks(n); }} />
                    <Input placeholder="URL" value={link.url} onChange={(e) => { const n = [...editPortfolioLinks]; n[i] = {...n[i], url: e.target.value}; setEditPortfolioLinks(n); }} />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditPortfolioLinks(editPortfolioLinks.filter((_, j) => j !== i))}>×</Button>
                  </div>
                ))}
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
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {isSavingProfile ? "Sauvegarde..." : "Sauvegarder"}
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
                disabled={!coverPhotoFile || isSavingCover}
                className="campus-gradient text-white hover:opacity-90"
              >
                {isSavingCover ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {isSavingCover ? "Sauvegarde..." : "Sauvegarder"}
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
                disabled={!avatarFile || isSavingAvatar}
                className="campus-gradient text-white hover:opacity-90"
              >
                {isSavingAvatar ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {isSavingAvatar ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal pour changer le mood */}
        <Dialog
          open={showMoodModal}
          onOpenChange={(open) => {
            setShowMoodModal(open);
            if (open) {
              setNewMood(findMoodOptionByValue(user.currentMood));
            }
          }}
        >
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
                  value={newMood?.label ?? ""}
                  readOnly
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Choisissez votre état d'esprit actuel
                </p>
              </div>

              {/* Moods prédéfinis */}
              <div>
                <Label>Suggestions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <Button
                      key={mood.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setNewMood(mood)}
                      className="text-xs h-auto py-2 px-3 justify-start"
                    >
                      {mood.label}
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
                  setNewMood(null);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleMoodChange}
                disabled={!newMood?.value || isSavingMood}
                className="campus-gradient text-white hover:opacity-90"
              >
                {isSavingMood ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {isSavingMood ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
