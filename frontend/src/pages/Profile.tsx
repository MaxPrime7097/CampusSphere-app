import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { getCurrentUser, getUserByUsername, getUserPosts, uploadAvatar, uploadCoverPhoto, updateUserProfile, getUserConnections, getUserResources, connectWithUser, disconnectFromUser, downloadResource, getUserProfile, getUserConnectionRelation, isApiRequestErrorStatus } from "@/services/api";
import { MapPin, Camera, Calendar, Link, Users, User, BookOpen, Award, Settings, FileText, Briefcase, GraduationCap, Loader2, Check, Download, Unlink, ExternalLink, Upload, X, Zap, Smile, BriefcaseBusiness, Shield, Info, Pencil, BadgeCheck, Plus, Languages } from "lucide-react";

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
import { cn, formatFileSize, formatSlugToLabel, truncate } from "@/lib/utils";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationModal } from "@/components/modals/VerificationModal";
import { formatFrenchDate } from "@/lib/date";
import { normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";
import { CityCombobox } from "@/components/forms/CityCombobox";
import { LanguageCombobox } from "@/components/forms/LanguageCombobox";
import { EditAcademicModal } from "@/components/modals/EditAcademicModal";
import { EditPersonalModal } from "@/components/modals/EditPersonalModal";
import { EditEducationModal } from "@/components/modals/EditEducationModal";
import { EditExperiencesModal } from "@/components/modals/EditExperiencesModal";
import { EditSkillsModal } from "@/components/modals/EditSkillsModal";
import { EditInterestsModal } from "@/components/modals/EditInterestsModal";
import { EditPortfolioModal } from "@/components/modals/EditPortfolioModal";

const NOT_AVAILABLE_TEXT = "—";
const MOOD_OPTIONS = [
  { value: "excited", label: "🚀🔥 En pleine révision !" },
  { value: "focused", label: "🎯🧠 Concentré sur mes objectifs" },
  { value: "collaborating", label: "🤝✨ Prêt à collaborer" },
  { value: "learning", label: "📚💡 En mode apprentissage" },
  { value: "inspired", label: "🌟🎨 Inspiré et créatif" },
  { value: "determined", label: "💪🏆 Déterminé" },
  { value: "stress", label: "📈🆘 Sous l'eau" },
  { value: "bu_hermit", label: "📚🕯️😶‍🌫️ L'Ermite de la BU" },
  { value: "caffeine_hunt", label: "☕🧟‍♂️ En quête de caféine" },
  { value: "liberated", label: "🍻🎉🔓 Libéré / Délivré" },
  { value: "networker", label: "🤝💼✨ Le Networker" },
  { value: "sleep_mode", label: "💤😴🚫 Mode Sommeil" },
];

const MOOD_VALUE_TO_LABEL = MOOD_OPTIONS.reduce<Record<string, string>>((acc, mood) => {
  acc[mood.value] = mood.label;
  return acc;
}, {});

const IMPACT_LEVELS = [
  { min: 0, label: "Nouveau venu", color: "from-gray-400 to-gray-500", icon: "🌱" },
  { min: 50, label: "Contributeur", color: "from-blue-400 to-blue-600", icon: "⭐" },
  { min: 200, label: "Pilier du Campus", color: "from-orange-400 to-orange-600", icon: "🏆" },
  { min: 500, label: "Légende du Campus", color: "from-purple-500 to-indigo-600", icon: "👑" },
  { min: 1000, label: "Maître Campus", color: "from-yellow-400 to-red-600", icon: "🔥" },
];

function getImpactLevelInfo(score: number) {
  let currentLevel = IMPACT_LEVELS[0];
  let nextLevel = IMPACT_LEVELS[1] || null;
  
  for (let i = 0; i < IMPACT_LEVELS.length; i++) {
    if (score >= IMPACT_LEVELS[i].min) {
      currentLevel = IMPACT_LEVELS[i];
      nextLevel = IMPACT_LEVELS[i + 1] || null;
    } else {
      break;
    }
  }
  
  const progress = nextLevel 
    ? ((score - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;
    
  return { currentLevel, nextLevel, progress };
}

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

const UNIVERSITIES_LIST = [
  "Université de Yaoundé I",
  "Université de Yaoundé II",
  "Université de Douala",
  "Université de Buea",
  "Université de Bamenda",
  "Université de Dschang",
  "Université de Ngaoundéré",
  "Université de Maroua",
  "Université de Bertoua",
  "Université d'Ebolowa",
  "Université de Garoua",
  "Université Inter-États Congo-Cameroun",
  "Université Catholique d'Afrique Centrale",
  "ICT University",
  "PKFokam Institute of Excellence",
  "Saint Jerome Catholic University",
  "Ndi Samba University",
];

const UNIVERSITY_OPTIONS = UNIVERSITIES_LIST.map(u => ({ value: u, label: u }));
const FACULTY_OPTIONS = Object.entries(FACULTY_LABELS).map(([value, label]) => ({ value, label }));
const STUDY_YEAR_OPTIONS = Object.entries(STUDY_YEAR_LABELS).map(([value, label]) => ({ value, label }));

const normalizeCanonicalLabel = (value: unknown, map: Record<string, string>): string => {
  if (!value || typeof value !== "string") return "";
  const key = value.trim().toLowerCase();
  return map[key] || formatSlugToLabel(value);
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
      isVerified: false,
    };
  }

  const NOT_AVAILABLE_TEXT = "";
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  const displayName = fullName || profile.username || "Utilisateur";

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
    isVerified: profile.isVerified ?? profile.is_verified ?? false,
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
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isRecipient, setIsRecipient] = useState(false);
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
  const [moodText, setMoodText] = useState("");
  const [animateScore, setAnimateScore] = useState(false);
  const prevScoreRef = useRef<number | null>(null);
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
  const [profileUnavailableDueToOnboarding, setProfileUnavailableDueToOnboarding] = useState(false);

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
          setProfileUnavailableDueToOnboarding(false);
        } else if (isMounted) {
          setProfileLoadError(true);
          setProfileUnavailableDueToOnboarding(false);
        }
      } catch (e: any) {
        // User not found
        console.error('Error loading user:', e);
        if (isMounted) {
          const rawMessage = String(e?.message || "").toLowerCase();
          const onboardingRestricted =
            isApiRequestErrorStatus(e, 403) ||
            (isApiRequestErrorStatus(e, 404) && rawMessage.includes("onboarding"));

          setProfileLoadError(true);
          setProfileUnavailableDueToOnboarding(onboardingRestricted);
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

  useEffect(() => {
    if (user.impactScore !== prevScoreRef.current && user.impactScore !== null && prevScoreRef.current !== null) {
      setAnimateScore(true);
      const timer = setTimeout(() => setAnimateScore(false), 400);
      prevScoreRef.current = user.impactScore;
      return () => clearTimeout(timer);
    }
    if (user.impactScore !== null && prevScoreRef.current === null) {
      prevScoreRef.current = user.impactScore;
    }
  }, [user.impactScore]);

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
      setConnectionStatus(null);
      setIsRecipient(false);
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
        setConnectionStatus(relation.connection?.status ?? null);
        setIsRecipient(relation.connection?.recipient === currentUser.id);
        setCurrentConnectionId(relation.connection?.id != null ? String(relation.connection.id) : null);
      } catch (error) {
        if (isMounted) {
          setIsFollowing(false);
          setConnectionStatus(null);
          setCurrentConnectionId(null);
          setRelationActionUnavailable(isApiRequestErrorStatus(error, 403));
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, targetUser?.id, isOwnProfile]);
  
  const refreshUser = async () => {
    try {
      const data = await getCurrentUser();
      if (isProfilePayloadValid(data)) {
        setCurrentUser(data);
        if (isOwnProfile) setTargetUser(data);
      }
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

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

        // Si c'est en attente et qu'on est le destinataire, on peut soit accepter soit refuser
        // Pour l'instant, handleFollow fait l'action principale.
        // Si c'est déjà accepté, on déconnecte.
        // Si c'est en attente et qu'on est le destinataire, on accepte.
        if (connectionStatus === "pending" && isRecipient) {
          const { acceptConnection } = await import("@/services/api");
          await acceptConnection(targetUser.id);
          setConnectionStatus("accepted");
          setIsFollowing(true);
          toast({
            title: "Connexion acceptée",
            description: `Vous êtes maintenant connecté(e) à ${user.name}`,
            duration: 2000,
          });
        } else {
          // Annuler la demande ou se déconnecter
          await disconnectFromUser(targetUser.id);
          setCurrentConnectionId(null);
          setConnectionStatus(null);
          setIsRecipient(false);
          setIsFollowing(false);
          toast({
            title: previousIsFollowing && connectionStatus === "accepted" ? "Connexion supprimée" : "Demande annulée",
            description: previousIsFollowing && connectionStatus === "accepted"
              ? `Vous n'êtes plus connecté(e) à ${user.name}`
              : `La demande de connexion à ${user.name} a été annulée`,
            duration: 2000,
          });
        }
      } else {
        const response = await connectWithUser(targetUser.id);
        const createdConnectionId =
          response?.id != null ? String(response.id) : response?.data?.id != null ? String(response.data.id) : previousConnectionId;
        setCurrentConnectionId(createdConnectionId ?? null);
        setConnectionStatus("pending");
        setIsRecipient(false);
        toast({
          title: "Connexion envoyée",
          description: `Demande de connexion envoyée à ${user.name}`,
          duration: 2000,
        });
      }
      setRelationActionUnavailable(false);
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
    const valueToSave = moodText.trim();
    if (!valueToSave || isSavingMood) return;
    setIsSavingMood(true);
    const selectedMoodValue = valueToSave;

    try {
      await updateUserProfile({ current_mood: selectedMoodValue });

      let refreshedProfile = await getUserProfile();
      if (!refreshedProfile) {
        refreshedProfile = await getCurrentUser();
      }

      const confirmedMoodValue = refreshedProfile?.currentMood ?? refreshedProfile?.current_mood ?? "";

      setCurrentUser(refreshedProfile);
      if (isOwnProfile) setTargetUser(refreshedProfile);
      setMoodText("");
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

  const EmptyField = () => <span className="italic text-muted-foreground text-xs font-normal">Aucun pour l'instant</span>;

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background to-accent/20">
        <div className="container max-w-4xl mx-auto py-0 px-0 sm:py-4">
          <div className={cardClasses}>
            <ProfileSkeleton />
          </div>
        </div>
      </div>
    );
  }

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
                {profileUnavailableDueToOnboarding
                  ? "Ce profil n’est pas encore accessible : l’onboarding de ce compte n’est pas terminé."
                  : "Le profil reçu est invalide ou obsolète. Veuillez recharger la page."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div key={`${username || 'current'}`} className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-0 px-0 sm:py-4 space-y-4">
        {isOwnProfile && !currentUser?.isVerified && (
          <div className="mx-4 sm:mx-0 p-4 bg-amber-500/10 border border-amber-500/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-full">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">Compte non certifié</h3>
                <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                  Votre accès est limité au mode lecture. Certifiez votre statut d'étudiant pour publier.
                </p>
              </div>
            </div>
            <VerificationModal onSuccess={() => {
              void refreshUser();
            }}>
              <Button 
                className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto shadow-lg shadow-amber-600/20"
              >
                Certifier mon statut
              </Button>
            </VerificationModal>
          </div>
        )}
        {/* Profile Header */}
        <div className={cardClasses}>
          {/* Photo de couverture */}
          <div className="relative rounded-t-null sm:rounded-t-lg h-48 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/30 overflow-hidden">
            {user.coverPhoto ? (
              <OptimizedImage 
                src={user.coverPhoto} 
                alt="Photo de couverture" 
                className="w-full h-full object-cover"
                containerClassName="w-full h-full absolute inset-0"
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
                          connectionStatus === "pending" ? (
                            isRecipient ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                <span className="inline">Accepter</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                <span className="inline">En attente</span>
                              </>
                            )
                          ) : (
                            <>
                              <Unlink className="h-4 w-4 mr-2" />
                              <span className="inline">Se déconnecter</span>
                            </>
                          )
                        ) : (
                          <>
                            <Link className="h-4 w-4 mr-2" />
                            <span className="inline">Se connecter</span>
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
                      onClick={() => navigate("/profile/edit")}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      <span className="inline">Modifier</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    {user.isVerified && (
                      <BadgeCheck className="h-6 w-6 text-primary fill-primary/10" />
                    )}
                  </div>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>

                <p className="text-foreground leading-relaxed">{user.bio || NOT_AVAILABLE_TEXT}</p>

                {/* Impact Score et Mood */}
                <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 p-2.5 sm:p-3 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shrink-0">
                      <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] sm:text-sm font-semibold truncate">Impact Score</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-4 w-4 sm:h-5 sm:w-5 p-0 rounded-full hover:bg-primary/20 transition-colors shrink-0"
                          onClick={() => toast({
                            title: "Score d'impact",
                            description: "Le Score d'Impact mesure l'utilité et la pertinence de ce contenu pour la communauté CampusSphere. Il est calculé en fonction des interactions et des retours des étudiants.",
                          })}
                        >
                          <Info className="h-3 w-3 text-primary/60" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm sm:text-lg font-bold text-primary truncate transition-all duration-300", animateScore && "animate-pop")}>
                          {user.impactScore ?? 0}
                        </p>
                        {user.impactScore !== null && (
                          <div className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r shadow-sm",
                            getImpactLevelInfo(user.impactScore).currentLevel.color
                          )}>
                            <span>{getImpactLevelInfo(user.impactScore).currentLevel.icon}</span>
                            <span className="uppercase tracking-tighter">{getImpactLevelInfo(user.impactScore).currentLevel.label}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Gamification deactivated for now but code kept
                      {user.impactScore !== null && getImpactLevelInfo(user.impactScore).nextLevel && (
                        <div className="w-full max-w-[120px] mt-1 space-y-1">
                          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-1000 ease-out" 
                              style={{ width: `${getImpactLevelInfo(user.impactScore).progress}%` }}
                            />
                          </div>
                          <p className="text-[8px] text-muted-foreground italic">
                            Plus que {getImpactLevelInfo(user.impactScore).nextLevel!.min - user.impactScore} pts pour le rang {getImpactLevelInfo(user.impactScore).nextLevel!.label}
                          </p>
                        </div>
                      )}
                      */}
                    </div>
                  </div>
                  
                  <div className="h-8 w-px bg-border shrink-0" />

                  {/* Streak deactivated for now but code kept
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 shrink-0">
                    <span className="text-xs font-black">7</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest">Série</span>
                    <span className="text-xs">🔥</span>
                  </div>
                  
                  <div className="h-8 w-px bg-border shrink-0" />
                  */}

                  <div 
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-1 sm:p-2 -m-1 sm:-m-2 transition-colors min-w-0"
                    onClick={() => isOwnProfile && setShowMoodModal(true)}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shrink-0">
                      <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] sm:text-sm font-semibold">Mood du moment</p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words line-clamp-3 overflow-hidden">{getMoodLabel(user.currentMood)}</p>
                    </div>
                    {isOwnProfile && (
                      <Settings className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block ml-auto" />
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
              
              {userPostsData.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Aucun post"
                  description="Cet utilisateur n'a pas encore partagé de publications."
                />
              ) : (
                userPostsData.map((post) => (
                  <div key={post.id} className="campus-animate-fade-in">
                    <PostCard post={post} />
                  </div>
                ))
              )}
            </section>
          )}

          {/* CONNECTIONS */}
          {activeTab === "connections" && (
            <section className="mt-6">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Connexions ({userConnections.length})</h3>
                {userConnections.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="Aucune connexion"
                    description="Cet utilisateur n'est pas encore connecté avec d'autres étudiants."
                  />
                ) : (
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
                )}
              </div>
            </section>
          )}

          {/* ABOUT */}
          {activeTab === "about" && (
            <section className="mt-6 space-y-4">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Informations académiques
                  </div>
                  {isOwnProfile && (
                    <EditAcademicModal 
                      initialData={{
                        university: user.university || "",
                        faculty: user.faculty || "",
                        studyYear: user.studyYear || "",
                        studentId: user.studentId || "",
                        campus: user.campus || "",
                      }}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </EditAcademicModal>
                  )}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Université</p>
                    <p className="font-medium" title={formatSlugToLabel(user.university)}>
                      {truncate(formatSlugToLabel(user.university), 35) || <EmptyField />}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Filière</p>
                    <p className="font-medium">{formatSlugToLabel(user.faculty) || <EmptyField />}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Niveau</p>
                    <p className="font-medium">{displayStudyYear || <EmptyField />}</p>
                  </div>
                  {isOwnProfile && (
                    <div>
                      <p className="text-sm text-muted-foreground">Matricule</p>
                      <p className="font-medium">{user.studentId || <EmptyField />}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Campus</p>
                    <p className="font-medium">{user.campus || <EmptyField />}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informations Personnelles
                  </div>
                  {isOwnProfile && (
                    <EditPersonalModal 
                      initialData={{
                        bio: user.bio || "",
                        email: user.email || "",
                        phoneNumber: user.phoneNumber || "",
                        dateOfBirth: user.dateOfBirth || "",
                        town: user.town || "",
                        languages: Array.isArray(user.language) ? user.language : [],
                      }}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </EditPersonalModal>
                  )}
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    {isOwnProfile && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{user.email || <EmptyField />}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{user.phoneNumber || <EmptyField />}</p>
                        </div>
                      </>
                    )}
                    {isOwnProfile && (
                      <div>
                        <p className="text-sm text-muted-foreground">Date de naissance</p>
                        <p className="font-medium">
                          {user.dateOfBirth ? formatFrenchDate(user.dateOfBirth) : <EmptyField />}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Ville</p>
                      <p className="font-medium">{formatSlugToLabel(user.town) || <EmptyField />}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Langues</p>
                      <p className="font-medium">
                        {Array.isArray(user.language) && user.language.length > 0
                          ? user.language.map(formatSlugToLabel).join(", ") 
                          : <EmptyField />
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Formations précédentes
                  </div>
                  {isOwnProfile && (
                    <EditEducationModal 
                      initialEducation={user.previousEducation || []}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </EditEducationModal>
                  )}
                </h3>
                {user.previousEducation?.length > 0 ? (
                  <div className="space-y-3">
                    {user.previousEducation.map((edu: any, index: number) => (
                      <div key={`${edu?.degree || "degree"}-${index}`} className="border rounded-lg p-3">
                        <p className="font-medium">{formatSlugToLabel(edu?.degree) || <EmptyField />}</p>
                        <p className="text-sm text-muted-foreground">{edu?.school || <EmptyField />}</p>
                        <p className="text-xs text-muted-foreground">{edu?.year || <EmptyField />}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground"><EmptyField /></p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Expériences
                  </div>
                  {isOwnProfile && (
                    <EditExperiencesModal 
                      initialExperiences={user.experiences || []}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </EditExperiencesModal>
                  )}
                </h3>
                {user.experiences?.length > 0 ? (
                  <div className="space-y-3">
                    {user.experiences.map((exp: any, index: number) => (
                      <div key={`${exp?.title || "experience"}-${index}`} className="border rounded-lg p-3">
                        <p className="font-medium">{exp?.title || <EmptyField />}</p>
                        <p className="text-sm text-muted-foreground">
                          {[exp?.company, exp?.duration].filter(Boolean).join(" • ") || <EmptyField />}
                        </p>
                        <p className="text-sm mt-1">{exp?.description || <EmptyField />}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground"><EmptyField /></p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Compétences
                  </div>
                  {isOwnProfile && (
                    <EditSkillsModal 
                      initialSkills={user.skills || []}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </EditSkillsModal>
                  )}
                </h3>
                {user.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill: any, index: number) => (
                      <Badge key={`${skill}-${index}`} variant="secondary">
                        {typeof skill === "string" ? formatSlugToLabel(skill) : formatSlugToLabel(skill?.name) || <EmptyField />}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground"><EmptyField /></p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
                  <div className="flex items-center gap-2">
                    <Smile className="h-5 w-5 text-primary" />
                    Centres d'intérêt
                  </div>
                  {isOwnProfile && (
                    <EditInterestsModal 
                      initialInterests={user.interests || []}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </EditInterestsModal>
                  )}
                </h3>
                {user.interests?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest: any, index: number) => (
                      <Badge key={`${interest}-${index}`} variant="outline">
                        {typeof interest === "string" ? formatSlugToLabel(interest) : formatSlugToLabel(interest?.name) || <EmptyField />}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground"><EmptyField /></p>
                )}
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h3 className="flex items-center justify-between text-lg font-semibold mb-4">
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="h-5 w-5 text-primary" />
                    Portfolio
                  </div>
                  {isOwnProfile && (
                    <EditPortfolioModal 
                      initialLinks={user.portfolioLinks || []}
                      onSuccess={() => window.location.reload()}
                    >
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </EditPortfolioModal>
                  )}
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
                          <EmptyField />
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground"><EmptyField /></p>
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
                {loading ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <ResourceSkeleton key={i} />)}
                  </div>
                ) : user.sharedFiles.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={resourcesAvailable ? "Aucune contribution pour le moment" : "Contributions non disponibles"}
                    description={resourcesAvailable ? "Cet utilisateur n'a pas encore partagé de ressources." : NOT_AVAILABLE_TEXT}
                  />
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {user.sharedFiles.map((file: any) => (
                      <ResourceCard
                        key={file.id}
                        resource={{
                          id: String(file.resourceId || file.id),
                          title: file.name,
                          subject: normalizeSubject(file.subject || ""),
                          type: normalizeResourceType(file.type || ""),
                          authorName: user.name,
                          fileSize: file.size,
                          viewCount: file.viewCount || 0,
                          downloadCount: file.downloadCount || 0,
                        }}
                        isDownloading={false}
                        onDownload={(e) => { e.stopPropagation(); handleDownloadFile(file.resourceId, file.filename || file.name); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

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
              setMoodText(user.currentMood || "");
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
                <Label htmlFor="mood">Mood du moment (max 100 car.)</Label>
                <div className="relative mt-2">
                  <Input
                    id="mood"
                    value={moodText}
                    onChange={(e) => setMoodText(e.target.value.slice(0, 100))}
                    placeholder="Comment vous sentez-vous ?"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    {moodText.length}/100
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Exprimez votre état d'esprit actuel librement.
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
                      onClick={() => setMoodText(mood.label)}
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
                  setMoodText("");
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleMoodChange}
                disabled={!moodText.trim() || isSavingMood}
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
