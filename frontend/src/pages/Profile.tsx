import { Suspense, lazy, useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  getUserByUsername,
  getUserPosts,
  uploadAvatar,
  uploadCoverPhoto,
  updateUserProfile,
  getUserConnections,
  getUserResources,
  connectWithUser,
  disconnectFromUser,
  downloadResource,
  getUserConnectionRelation,
  isApiRequestErrorStatus,
  acceptConnection,
} from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, formatFileSize } from "@/lib/utils";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/contexts/AuthContext";
import {
  STUDY_YEAR_LABELS,
  FACULTY_LABELS,
  normalizeCanonicalLabel,
  normalizeId,
  NOT_AVAILABLE_TEXT,
} from "@/constants/profileConstants";
import {
  ProfileHeader,
  ProfilePostsTab,
  ProfileConnectionsTab,
  ProfileAboutTab,
  ProfileContributionsTab,
  ProfileMoodModal,
} from "@/components/profile";

const ImageUploadModal = lazy(() =>
  import("@/components/modals/ImageUploadModal").then((module) => ({
    default: module.ImageUploadModal,
  }))
);

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
      name: resource.title || resource.filename || resource.fileName || "",
      filename: resource.filename || resource.fileName || resource.title || `resource-${resource.id}`,
      type: resource.type || "",
      size: formatFileSize(resource.fileSize || 0),
    })),
    stats: {
      posts: posts?.length || 0,
      connections: connections?.length || 0,
      contributions: resourcesAvailable ? resources.length : null,
    },
    badges: [
      ...(profile.is_staff || profile.isStaff
        ? [{ id: "admin", label: "CampusSphere Admin", color: "bg-gradient-to-r from-primary to-accent text-white" }]
        : []),
    ],
  };
}

export function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { username } = useParams<{ username?: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user: currentUser, refreshUser } = useAuth();

  const [isFollowing, setIsFollowing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [isRecipient, setIsRecipient] = useState(false);
  const [currentConnectionId, setCurrentConnectionId] = useState<string | null>(null);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [relationActionUnavailable, setRelationActionUnavailable] = useState(false);

  const [showCoverPhotoModal, setShowCoverPhotoModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [isSavingMood, setIsSavingMood] = useState(false);

  const [animateScore, setAnimateScore] = useState(false);
  const prevScoreRef = useRef<number | null>(null);

  const [targetUser, setTargetUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [userResources, setUserResources] = useState<any[]>([]);
  const [resourcesAvailable, setResourcesAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [profileUnavailableDueToOnboarding, setProfileUnavailableDueToOnboarding] = useState(false);

  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    if (!username && currentUser) {
      setTargetUser(currentUser);
    }
  }, [username, currentUser]);

  const targetUserQuery = useQuery({
    queryKey: ["profile-user", username],
    queryFn: () => getUserByUsername(username!),
    enabled: Boolean(username),
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!username) return;

    if (targetUserQuery.isLoading) {
      setLoading(true);
      return;
    }

    if (targetUserQuery.error) {
      const e = targetUserQuery.error;
      console.error("Error loading user:", e);
      const rawMessage = String((e as any)?.message || "").toLowerCase();
      const onboardingRestricted =
        isApiRequestErrorStatus(e, 403) ||
        (isApiRequestErrorStatus(e, 404) && rawMessage.includes("onboarding"));

      setProfileLoadError(true);
      setProfileUnavailableDueToOnboarding(onboardingRestricted);
      setLoading(false);
      return;
    }

    const user = targetUserQuery.data;
    if (user && isProfilePayloadValid(user)) {
      setTargetUser(user);
      setProfileLoadError(false);
      setProfileUnavailableDueToOnboarding(false);
    } else {
      setProfileLoadError(true);
      setProfileUnavailableDueToOnboarding(false);
    }
    setLoading(false);
  }, [username, targetUserQuery.data, targetUserQuery.isLoading, targetUserQuery.error]);

  const postsQuery = useQuery({
    queryKey: ["profile-posts", targetUser?.id],
    queryFn: () => getUserPosts(targetUser!.id),
    enabled: Boolean(targetUser?.id),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (postsQuery.data) {
      setUserPosts(postsQuery.data || []);
    }
  }, [postsQuery.data]);

  const isOwnProfile = !username || (currentUser && username === currentUser.username);

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

  const connectionsQuery = useQuery({
    queryKey: ["profile-connections", targetUser?.id],
    queryFn: () => getUserConnections(targetUser!.id),
    enabled: Boolean(targetUser?.id),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (connectionsQuery.data && targetUser?.id) {
      const profileOwnerId = String(targetUser.id);
      const mapped = (connectionsQuery.data || [])
        .map((conn: any) => getConnectionCounterpart(conn, profileOwnerId))
        .filter(Boolean);
      setUserConnections(mapped as any[]);
    }
  }, [connectionsQuery.data, targetUser?.id]);

  const resourcesQuery = useQuery({
    queryKey: ["profile-resources", targetUser?.id],
    queryFn: () => getUserResources(targetUser!.id),
    enabled: Boolean(targetUser?.id),
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (resourcesQuery.data) {
      setUserResources(resourcesQuery.data || []);
      setResourcesAvailable(true);
    } else if (resourcesQuery.error) {
      setUserResources([]);
      setResourcesAvailable(false);
    }
  }, [resourcesQuery.data, resourcesQuery.error]);

  const relationQuery = useQuery({
    queryKey: ["profile-relation", targetUser?.id],
    queryFn: () => getUserConnectionRelation(targetUser!.id),
    enabled: Boolean(targetUser?.id && currentUser?.id && !isOwnProfile),
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!currentUser?.id || !targetUser?.id || isOwnProfile) {
      setIsFollowing(false);
      setConnectionStatus(null);
      setIsRecipient(false);
      setCurrentConnectionId(null);
      setRelationActionUnavailable(false);
      return;
    }

    if (relationQuery.data) {
      const relation = relationQuery.data;
      setRelationActionUnavailable(false);
      setIsFollowing(Boolean(relation.is_connected));
      setConnectionStatus(relation.connection?.status ?? null);
      setIsRecipient(relation.connection?.recipient === currentUser.id);
      setCurrentConnectionId(relation.connection?.id != null ? String(relation.connection.id) : null);
    } else if (relationQuery.error) {
      setIsFollowing(false);
      setConnectionStatus(null);
      setCurrentConnectionId(null);
      setRelationActionUnavailable(isApiRequestErrorStatus(relationQuery.error, 403));
    }
  }, [currentUser?.id, targetUser?.id, isOwnProfile, relationQuery.data, relationQuery.error]);

  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setTargetUser(currentUser);
    }
  }, [currentUser, isOwnProfile]);

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

  const displayStudyYear = useMemo(
    () => normalizeCanonicalLabel(user.studyYear, STUDY_YEAR_LABELS) || NOT_AVAILABLE_TEXT,
    [user.studyYear]
  );

  const handleFollow = async () => {
    if (!currentUser?.id || !targetUser?.id || isFollowingLoading) return;

    const previousIsFollowing = isFollowing;
    const previousConnectionId = currentConnectionId;
    const nextIsFollowing = !previousIsFollowing;

    setIsFollowing(nextIsFollowing);
    setIsFollowingLoading(true);

    try {
      if (previousIsFollowing) {
        if (!previousConnectionId) {
          throw new Error("Connection introuvable pour la suppression.");
        }

        if (connectionStatus === "pending" && isRecipient) {
          await acceptConnection(targetUser.id);
          setConnectionStatus("accepted");
          setIsFollowing(true);
          toast({
            title: "Connexion acceptée",
            description: `Vous êtes maintenant connecté(e) à ${user.name}`,
            duration: 2000,
          });
        } else {
          await disconnectFromUser(targetUser.id);
          setCurrentConnectionId(null);
          setConnectionStatus(null);
          setIsRecipient(false);
          setIsFollowing(false);
          toast({
            title: previousIsFollowing && connectionStatus === "accepted" ? "Connexion supprimée" : "Demande annulée",
            description:
              previousIsFollowing && connectionStatus === "accepted"
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
      setIsFollowing(previousIsFollowing);
      setCurrentConnectionId(previousConnectionId);
      if (isApiRequestErrorStatus(error, 403)) {
        setRelationActionUnavailable(true);
      }

      toast({
        title: "Erreur",
        description:
          error?.message ||
          (previousIsFollowing ? "Impossible de supprimer la connexion" : "Impossible de créer la connexion"),
        variant: "destructive",
      });
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleViewProfile = (profileUsername?: string, connectionName?: string, showToast = false) => {
    if (!profileUsername) {
      toast({
        title: "Profil indisponible",
        description: "Impossible d'ouvrir ce profil pour le moment : username manquant.",
        variant: "destructive",
      });
      return;
    }

    const targetPath = `/profile/${encodeURIComponent(profileUsername)}`;
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

  const handleMoodChange = async (mood: string) => {
    setIsSavingMood(true);
    try {
      await updateUserProfile({ current_mood: mood });
      await refreshUser();
      setShowMoodModal(false);
      toast({ title: "Mood mis à jour !", description: "Votre mood du moment a été changé", duration: 2000 });
    } catch (error: any) {
      toast({ title: "Erreur", description: error?.message || "Impossible de mettre à jour le mood", variant: "destructive" });
    } finally {
      setIsSavingMood(false);
    }
  };

  const cardClasses = cn(
    "transition-all duration-300",
    isMobile ? "rounded-none border-x-0 border-t-0 shadow-none bg-card" : "cs-card hover:shadow-[var(--shadow-sm)]"
  );

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
    <div key={`${username || "current"}`} className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Suspense fallback={null}>
        {showAvatarModal && (
          <ImageUploadModal
            isOpen={showAvatarModal}
            onClose={() => setShowAvatarModal(false)}
            onSave={async (f) => {
              await uploadAvatar(currentUser!.id, f);
              toast({ title: "Avatar mis à jour !", duration: 3000 });
              setShowAvatarModal(false);
              await refreshUser();
            }}
            title="Photo de profil"
            description="Téléchargez une nouvelle photo de profil pour votre compte."
            currentImage={currentUser?.avatar}
            shape="round"
            aspectRatio={1}
          />
        )}
        {showCoverPhotoModal && (
          <ImageUploadModal
            isOpen={showCoverPhotoModal}
            onClose={() => setShowCoverPhotoModal(false)}
            onSave={async (f) => {
              await uploadCoverPhoto(currentUser!.id, f);
              toast({ title: "Photo de couverture mise à jour !", duration: 3000 });
              setShowCoverPhotoModal(false);
              await refreshUser();
            }}
            title="Photo de couverture"
            description="Téléchargez une nouvelle photo de couverture."
            currentImage={currentUser?.coverPhoto}
            shape="rect"
            aspectRatio={16 / 5}
          />
        )}
      </Suspense>

      <div className="container max-w-4xl mx-auto py-0 px-0 sm:py-4 space-y-4">
        <ProfileHeader
          user={user}
          currentUser={currentUser}
          isOwnProfile={isOwnProfile}
          cardClasses={cardClasses}
          animateScore={animateScore}
          isFollowing={isFollowing}
          isFollowingLoading={isFollowingLoading}
          relationActionUnavailable={relationActionUnavailable}
          connectionStatus={connectionStatus}
          isRecipient={isRecipient}
          onFollow={handleFollow}
          onOpenAvatarModal={() => setShowAvatarModal(true)}
          onOpenCoverModal={() => setShowCoverPhotoModal(true)}
          onOpenMoodModal={() => setShowMoodModal(true)}
          onRefreshUser={refreshUser}
        />

        {/* Custom Tabs Bar */}
        <div className="mt-4 campus-animate-slide-up w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="inline-grid grid-flow-col text-center border-b border-gray-200 text-gray-500 min-w-full">
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
                    "w-full flex justify-center px-4 whitespace-nowrap border-b-4 py-4 transition-all duration-200 text-sm font-medium",
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

          {activeTab === "posts" && <ProfilePostsTab isOwnProfile={isOwnProfile} posts={userPostsData} />}

          {activeTab === "connections" && (
            <ProfileConnectionsTab connections={userConnections} onViewProfile={handleViewProfile} />
          )}

          {activeTab === "about" && (
            <ProfileAboutTab user={user} isOwnProfile={isOwnProfile} displayStudyYear={displayStudyYear} />
          )}

          {activeTab === "contributions" && (
            <ProfileContributionsTab
              sharedFiles={user.sharedFiles}
              userName={user.name}
              loading={loading}
              resourcesAvailable={resourcesAvailable}
              onDownloadFile={handleDownloadFile}
            />
          )}
        </div>

        <ProfileMoodModal
          open={showMoodModal}
          onOpenChange={setShowMoodModal}
          currentMood={user.currentMood}
          onSaveMood={handleMoodChange}
          isSaving={isSavingMood}
        />
      </div>
    </div>
  );
}
export default Profile;
