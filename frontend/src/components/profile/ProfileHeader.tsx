import { Suspense, lazy, useState } from "react";
import {
  Camera,
  Check,
  Unlink,
  Link as LinkIcon,
  Loader2,
  Shield,
  Info,
  Pencil,
  BadgeCheck,
  Zap,
  Smile,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { getImpactLevelInfo, getMoodLabel } from "@/constants/profileConstants";

const VerificationModal = lazy(() =>
  import("@/components/modals/VerificationModal").then((module) => ({
    default: module.VerificationModal,
  }))
);
const EditAccountModal = lazy(() =>
  import("@/components/modals/EditAccountModal").then((module) => ({
    default: module.EditAccountModal,
  }))
);

export interface ProfileHeaderUser {
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  bio?: string;
  avatar?: string;
  coverPhoto?: string | null;
  isVerified?: boolean;
  impactScore?: number | null;
  currentMood?: string | null;
  stats: {
    posts: number;
    connections: number;
    contributions: number | null;
  };
  badges: Array<{ id?: string; label?: string; [key: string]: any }>;
}

interface ProfileHeaderProps {
  user: ProfileHeaderUser;
  currentUser?: { isVerified?: boolean; id?: string } | null;
  isOwnProfile: boolean;
  cardClasses: string;
  animateScore: boolean;
  isFollowing: boolean;
  isFollowingLoading: boolean;
  relationActionUnavailable: boolean;
  connectionStatus: string | null;
  isRecipient: boolean;
  onFollow: () => void;
  onOpenAvatarModal: () => void;
  onOpenCoverModal: () => void;
  onOpenMoodModal: () => void;
  onRefreshUser: () => Promise<void> | void;
}

export function ProfileHeader({
  user,
  currentUser,
  isOwnProfile,
  cardClasses,
  animateScore,
  isFollowing,
  isFollowingLoading,
  relationActionUnavailable,
  connectionStatus,
  isRecipient,
  onFollow,
  onOpenAvatarModal,
  onOpenCoverModal,
  onOpenMoodModal,
  onRefreshUser,
}: ProfileHeaderProps) {
  const { toast } = useToast();
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);

  return (
    <>
      {/* Compte non certifié banner */}
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
          <>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto shadow-lg shadow-amber-600/20"
              onClick={() => setIsVerificationModalOpen(true)}
            >
              Certifier mon statut
            </Button>
            {isVerificationModalOpen && (
              <Suspense fallback={<ModalLoadingFallback />}>
                <VerificationModal
                  open={isVerificationModalOpen}
                  onOpenChange={setIsVerificationModalOpen}
                  onSuccess={() => {
                    void onRefreshUser();
                  }}
                />
              </Suspense>
            )}
          </>
        </div>
      )}

      {/* Profile Header Card */}
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
              onClick={onOpenCoverModal}
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
                    {user.name?.slice(0, 1).toUpperCase() || "..."}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
                    onClick={onOpenAvatarModal}
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
                      onClick={onFollow}
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
                          <LinkIcon className="h-4 w-4 mr-2" />
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
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditAccountOpen(true)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      <span className="inline">Modifier</span>
                    </Button>
                    {isEditAccountOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <EditAccountModal
                          open={isEditAccountOpen}
                          onOpenChange={setIsEditAccountOpen}
                          initialData={{
                            firstName: user.firstName || "",
                            lastName: user.lastName || "",
                            username: user.username || "",
                            bio: user.bio || "",
                          }}
                          onSuccess={() => window.location.reload()}
                        />
                      </Suspense>
                    )}
                  </>
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

              <p className="text-foreground leading-relaxed">
                {user.bio || "Pas de bio pour l'instant"}
              </p>

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
                        onClick={() =>
                          toast({
                            title: "Score d'impact",
                            description:
                              "Le Score d'Impact mesure l'utilité et la pertinence de ce contenu pour la communauté CampusSphere. Il est calculé en fonction des interactions et des retours des étudiants.",
                          })
                        }
                      >
                        <Info className="h-3 w-3 text-primary/60" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-sm sm:text-lg font-bold text-primary truncate transition-all duration-300",
                          animateScore && "animate-pop"
                        )}
                      >
                        {user.impactScore ?? 0}
                      </p>
                      {user.impactScore !== null && (
                        <div
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r shadow-sm",
                            getImpactLevelInfo(user.impactScore).currentLevel.color
                          )}
                        >
                          <span>{getImpactLevelInfo(user.impactScore).currentLevel.icon}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-border shrink-0" />

                <div
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-1 sm:p-2 -m-1 sm:-m-2 transition-colors min-w-0"
                  onClick={() => isOwnProfile && onOpenMoodModal()}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shrink-0">
                    <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-sm font-semibold">Mood du moment</p>
                    <p className="text-xs sm:text-sm text-muted-foreground break-words line-clamp-3 overflow-hidden">
                      {getMoodLabel(user.currentMood)}
                    </p>
                  </div>
                  {isOwnProfile && (
                    <Settings className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block ml-auto" />
                  )}
                </div>
              </div>

              {/* Stats */}
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

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge: any) => (
                  <Badge
                    key={badge.id || badge}
                    className={`gap-1 ${badge.id === "admin" ? "campus-gradient text-white border-0" : ""}`}
                    variant={badge.id === "admin" ? "default" : "secondary"}
                  >
                    {badge.id === "admin" && <Shield className="h-3 w-3" />}
                    {badge.label || badge}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
