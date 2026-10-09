import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";
import { UsersThree as Users, FileText, Gear as Settings, DotsThreeVertical as MoreVertical, Spinner as Loader2, UserPlus, UserCheck, Camera, ShareNetwork as Share2, Target, Sphere, Trophy, BookOpen, UsersFour } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { renderMentionText } from "@/lib/mentions";
import {
  SPHERE_TYPE_LABELS,
  SPHERE_TYPE_COLORS,
  SPHERE_TYPE_ICONS,
  normalizeSphereType,
  type SphereType,
} from "@/config/sphereFeatures";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";

const SphereSettingsModal = lazy(() =>
  import("@/components/modals/SphereSettingsModal").then((module) => ({
    default: module.SphereSettingsModal,
  }))
);
const AddMemberModal = lazy(() =>
  import("@/components/modals/AddMemberModal").then((module) => ({
    default: module.AddMemberModal,
  }))
);

interface SphereHeaderProps {
  sphere: any;
  sphereFallback: any;
  sphereMemberCount: number;
  filesCount: number;
  isMember: boolean;
  isPendingRequest: boolean;
  isJoining: boolean;
  isCancellingRequest: boolean;
  isSharing: boolean;
  membershipStateLabel: string;
  canManageSphereSettings: boolean;
  canModerateMembers: boolean;
  membersCount: number;
  pendingMembersCount: number;
  activeTab?: string;
  onOpenBannerModal: () => void;
  onJoinSphere: () => void;
  onCancelRequest: () => void;
  onShare: () => void;
  onSelectTab: (tab: string) => void;
  onRefreshData: () => Promise<void>;
  onSphereDeleted: () => void;
}

export function SphereHeader({
  sphere,
  sphereFallback,
  sphereMemberCount,
  filesCount,
  isMember,
  isPendingRequest,
  isJoining,
  isCancellingRequest,
  isSharing,
  membershipStateLabel,
  canManageSphereSettings,
  canModerateMembers,
  membersCount,
  pendingMembersCount,
  activeTab,
  onOpenBannerModal,
  onJoinSphere,
  onCancelRequest,
  onShare,
  onSelectTab,
  onRefreshData,
  onSphereDeleted,
}: SphereHeaderProps) {
  const { t } = useTranslation("spheres");
  const [isSphereSettingsOpen, setIsSphereSettingsOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  return (
    <div className="overflow-hidden md:rounded-xl border-y md:border bg-card shadow-sm">
      {/* Banner */}
      <div className="relative h-36 md:h-48 group">
        {sphere?.banner_image_url ? (
          <OptimizedImage
            src={sphere.banner_image_url}
            alt="Bannière"
            className="w-full h-full object-cover"
            containerClassName="w-full h-full absolute inset-0"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${
                sphereFallback.color?.startsWith("from-")
                  ? "#6366f1, #8b5cf6"
                  : (sphereFallback.color || "#6366f1") +
                    ", " +
                    (sphereFallback.color || "#8b5cf6")
              })`,
            }}
          >
            <h1 className="text-white font-bold text-2xl md:text-4xl drop-shadow-lg px-4 text-center">
              {sphereFallback.name}
            </h1>
          </div>
        )}
        {sphere?.banner_image_url && (
          <div className="absolute inset-0 bg-black/40 flex items-end p-4">
            <h1 className="text-white font-bold text-2xl md:text-3xl drop-shadow-lg">
              {sphereFallback.name}
            </h1>
          </div>
        )}
        {canManageSphereSettings && (
          <button
            type="button"
            onClick={onOpenBannerModal}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-lg px-2 py-1.5 flex items-center gap-1.5 text-xs cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
          >
            <Camera className="h-3.5 w-3.5" />
            {t("detail.changeBanner")}
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 space-y-4">
        {/* Description + stats */}
        <div className="space-y-3">
          <p className="text-sm md:text-base text-muted-foreground whitespace-pre-wrap">
            {renderMentionText(sphereFallback.description)}
          </p>

          <div className="flex flex-wrap gap-3 text-sm font-medium">
            <button
              type="button"
              onClick={() => onSelectTab("members")}
              className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
              title={t("detail.viewMembersList")}
            >
              <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              <span>{t("detail.members", { count: sphereMemberCount })}</span>
            </button>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> {t("detail.files", { count: filesCount })}
            </span>
            {(sphere?.tags || sphereFallback.tags || []).map((tag: string) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const rawType =
                sphere?.sphere_type ??
                sphere?.sphereType ??
                sphere?.type ??
                sphereFallback?.sphere_type ??
                sphereFallback?.sphereType ??
                sphereFallback?.type ??
                sphere?.category;
              if (!rawType) return null;
              const canonicalType = normalizeSphereType(rawType);
              const iconName = SPHERE_TYPE_ICONS[canonicalType];
              return (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    SPHERE_TYPE_COLORS[canonicalType] ??
                    "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {iconName === "BookOpen" && <BookOpen className="h-3.5 w-3.5" />}
                  {iconName === "Target" && <Target className="h-3.5 w-3.5" />}
                  {iconName === "UsersFour" && <UsersFour className="h-3.5 w-3.5" />}
                  {iconName === "Trophy" && <Trophy className="h-3.5 w-3.5" />}
                  {iconName === "Pencil" && <FileText className="h-3.5 w-3.5" />}
                  {t(`card.${canonicalType}`, { defaultValue: SPHERE_TYPE_LABELS[canonicalType] ?? canonicalType })}
                </span>
              );
            })()}
            <Badge
              variant={isMember ? "default" : isPendingRequest ? "secondary" : "outline"}
              className="w-fit"
            >
              {membershipStateLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {isMember ? (
              <>
                {canManageSphereSettings && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsSphereSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4" />{" "}
                      <span className="hidden sm:inline">{t("detail.settings")}</span>
                    </Button>
                    {isSphereSettingsOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <SphereSettingsModal
                          open={isSphereSettingsOpen}
                          onOpenChange={setIsSphereSettingsOpen}
                          sphereData={sphereFallback}
                          onSettingsUpdated={onRefreshData}
                          onSphereDeleted={onSphereDeleted}
                        />
                      </Suspense>
                    )}
                  </>
                )}

                <Button
                  variant={activeTab === "members" ? "default" : "outline"}
                  size="sm"
                  className="hidden md:inline-flex gap-2"
                  onClick={() => onSelectTab("members")}
                >
                  <Users className="h-4 w-4" />{" "}
                  <span>{t("detail.members")}</span>
                  <span className="text-xs opacity-75">({membersCount})</span>
                </Button>

                {canModerateMembers && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsAddMemberOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />{" "}
                      <span className="hidden sm:inline">{t("detail.invite")}</span>
                    </Button>
                    {isAddMemberOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <AddMemberModal
                          open={isAddMemberOpen}
                          onOpenChange={setIsAddMemberOpen}
                          sphereId={sphereFallback.id}
                          sphereName={sphereFallback.name}
                          onMemberAdded={onRefreshData}
                        />
                      </Suspense>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={onJoinSphere}
                  disabled={isPendingRequest || isJoining || isCancellingRequest}
                  className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 font-bold gap-2"
                >
                  {isJoining ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isPendingRequest ? t("detail.pendingRequests") : t("detail.joinSphere")}
                  </span>
                </Button>

                {isPendingRequest && (
                  <Button
                    onClick={onCancelRequest}
                    disabled={isCancellingRequest}
                    variant="outline"
                    size="sm"
                  >
                    {isCancellingRequest && (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    )}
                    <span className="hidden sm:inline">{t("detail.cancelRequest")}</span>
                  </Button>
                )}
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              disabled={isSharing}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              {t("detail.share")}
            </Button>

            {/* Mobile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="md:hidden gap-1">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelectTab("members")}>
                  <Users className="h-4 w-4 mr-2" /> {t("detail.members")} ({membersCount})
                </DropdownMenuItem>
                {canModerateMembers && (
                  <DropdownMenuItem onClick={() => onSelectTab("pending")}>
                    <UserCheck className="h-4 w-4 mr-2" /> {t("detail.pendingRequests")} ({pendingMembersCount})
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
