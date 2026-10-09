import { Suspense, lazy, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, LinkBreak as Unlink, Link as LinkIcon, Spinner as Loader2, Shield, Info, PencilSimple, SealCheck as BadgeCheck, Lightning as Zap, Smiley as Smile, Gear as Settings, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { getImpactLevelInfo, getMoodLabel } from "@/constants/profileConstants";
import { useTranslation } from "react-i18next";

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
  currentUser?: { isVerified?: boolean; id?: string | number } | null;
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
  const { t } = useTranslation("profile");
  const navigate = useNavigate();
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
              <h3 className="font-bold text-amber-900 dark:text-amber-100">{t("header.uncertifiedTitle")}</h3>
              <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                {t("header.uncertifiedDesc")}
              </p>
            </div>
          </div>
          <>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto shadow-lg shadow-amber-600/20"
              onClick={() => setIsVerificationModalOpen(true)}
            >
              {t("header.certifyStatus")}
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
              alt={t("header.coverPhoto")}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full absolute inset-0"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/30 to-primary/40 flex items-center justify-center">
              <div className="text-center text-white/80">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm opacity-75">{t("header.coverPhoto")}</p>
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
              {t("header.changeCover")}
            </Button>
          )}
        </div>

        <div className="p-6 relative">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Top row on mobile (Avatar on left, actions on right) / Left column on PC (Avatar with actions below) */}
            <div className="flex items-start justify-between md:flex-col md:items-start md:justify-start md:space-y-4 shrink-0">
              <div className="relative -mt-20 shrink-0">
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

              <div className="flex gap-2 pt-1 md:pt-0">
                {!isOwnProfile && (
                  <div className="space-y-1">
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={onFollow}
                      disabled={isFollowingLoading || relationActionUnavailable}
                      className={!isFollowing ? "bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 font-medium shadow-none" : ""}
                      size="sm"
                    >
                      {isFollowingLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : isFollowing ? (
                        connectionStatus === "pending" ? (
                          isRecipient ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              <span className="inline">{t("header.actions.accept")}</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              <span className="inline">{t("header.actions.pending")}</span>
                            </>
                          )
                        ) : (
                          <>
                            <Unlink className="h-4 w-4 mr-2" />
                            <span className="inline">{t("header.actions.disconnect")}</span>
                          </>
                        )
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          <span className="inline">{t("header.actions.connect")}</span>
                        </>
                      )}
                    </Button>
                    {relationActionUnavailable && (
                      <p className="text-xs text-muted-foreground">
                        {t("header.actions.unavailableAction")}
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
                      <PencilSimple className="h-4 w-4 mr-2" />
                      <span className="inline">{t("header.actions.edit")}</span>
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

            {/* Profile Info: right column on PC, flows directly under avatar row on mobile */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  {user.isVerified && (
                    <BadgeCheck className="h-5 w-5 text-primary" weight="fill" />
                  )}
                </div>
                <p className="text-muted-foreground">@{user.username}</p>
              </div>

              <p className="text-foreground leading-relaxed">
                {user.bio || t("header.noBio")}
              </p>

            {/* Impact Score et Mood (45% / 55%) */}
            <div className="grid grid-cols-[9fr_11fr] gap-2 sm:gap-3 w-full p-2.5 sm:p-3 bg-muted/40 border border-border/40 rounded-xl">
              {/* 45% Impact Score */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" weight="fill" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs sm:text-sm font-semibold truncate">{t("header.impactScore")}</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 sm:h-5 sm:w-5 p-0 rounded-full hover:bg-muted transition-colors shrink-0"
                          aria-label={t("header.impactScore")}
                        >
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 sm:w-80 p-4 space-y-3 z-50 text-left" align="start">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Zap className="h-4 w-4 text-primary" weight="fill" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm leading-none">{t("header.helpTitle")}</h4>
                            <span className="text-[11px] text-muted-foreground">{t("header.helpSubtitle")}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t("header.helpDesc")}
                        </p>
                        <div className="pt-2 flex items-center justify-between border-t border-border/40">
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => navigate("/cs-inc/impact-score")}
                            className="p-0 h-auto text-primary font-semibold text-xs inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                          >
                            <span>{t("header.learnMore")}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <p
                      className={cn(
                        "text-sm sm:text-lg font-bold text-foreground truncate transition-all duration-300",
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

              {/* 55% Mood du moment */}
              <div
                className={cn(
                  "flex items-center gap-2 sm:gap-3 min-w-0 rounded-lg p-1 sm:p-1.5 transition-colors border-l border-border/50 pl-2 sm:pl-3",
                  isOwnProfile ? "cursor-pointer hover:bg-muted/60" : ""
                )}
                onClick={() => isOwnProfile && onOpenMoodModal()}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Smile className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs sm:text-sm font-semibold truncate">{t("header.currentMood")}</p>
                    {isOwnProfile && (
                      <Settings className="h-3 w-3 text-muted-foreground shrink-0 hidden sm:block" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground break-words line-clamp-2 leading-snug" title={getMoodLabel(user.currentMood)}>
                    {getMoodLabel(user.currentMood)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="font-semibold">{user.stats.posts}</span>
                <span className="text-muted-foreground ml-1">{t("header.stats.posts")}</span>
              </div>
              <div>
                <span className="font-semibold">{user.stats.connections}</span>
                <span className="text-muted-foreground ml-1">{t("header.stats.connections")}</span>
              </div>
              <div>
                <span className="font-semibold">{user.stats.contributions}</span>
                <span className="text-muted-foreground ml-1">{t("header.stats.contributions")}</span>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge: any) => (
                <Badge
                  key={badge.id || badge}
                  className={`gap-1 ${badge.id === "admin" ? "bg-secondary text-secondary-foreground border border-border/60" : ""}`}
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
