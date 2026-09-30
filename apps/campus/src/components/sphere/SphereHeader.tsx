import { Suspense, lazy, useState } from "react";
import {
  Users,
  FileText,
  Settings,
  MoreVertical,
  Loader2,
  UserPlus,
  UserCheck,
  Camera,
  Share2,
  Target,
  Globe,
  Trophy,
  BookOpen,
} from "lucide-react";
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
  type SphereType,
} from "@/config/sphereFeatures";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";

const SphereSettingsModal = lazy(() =>
  import("@/components/modals/SphereSettingsModal").then((module) => ({
    default: module.SphereSettingsModal,
  }))
);
const ManageMembersModal = lazy(() =>
  import("@/components/modals/ManageMembersModal").then((module) => ({
    default: module.ManageMembersModal,
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
  onOpenBannerModal,
  onJoinSphere,
  onCancelRequest,
  onShare,
  onSelectTab,
  onRefreshData,
  onSphereDeleted,
}: SphereHeaderProps) {
  const [isSphereSettingsOpen, setIsSphereSettingsOpen] = useState(false);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
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
            Changer la bannière
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
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> {sphereMemberCount} membres
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> {filesCount} fichiers
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
            {sphere?.sphere_type && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  SPHERE_TYPE_COLORS[sphere.sphere_type as SphereType] ??
                  "bg-muted text-muted-foreground border-border"
                }`}
              >
                {(() => {
                  const iconName = SPHERE_TYPE_ICONS[sphere.sphere_type as SphereType];
                  if (iconName === "BookOpen") return <BookOpen className="h-3.5 w-3.5" />;
                  if (iconName === "Target") return <Target className="h-3.5 w-3.5" />;
                  if (iconName === "Globe") return <Globe className="h-3.5 w-3.5" />;
                  if (iconName === "Trophy") return <Trophy className="h-3.5 w-3.5" />;
                  if (iconName === "Pencil") return <FileText className="h-3.5 w-3.5" />;
                  return null;
                })()}
                {SPHERE_TYPE_LABELS[sphere.sphere_type as SphereType] ?? sphere.sphere_type}
              </span>
            )}
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
                      <span className="hidden sm:inline">Paramètres</span>
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

                {canModerateMembers && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsManageMembersOpen(true)}
                    >
                      <Users className="h-4 w-4" />{" "}
                      <span className="hidden sm:inline">Équipe</span>
                    </Button>
                    {isManageMembersOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <ManageMembersModal
                          open={isManageMembersOpen}
                          onOpenChange={setIsManageMembersOpen}
                          sphereId={sphereFallback.id}
                          sphereName={sphereFallback.name}
                        />
                      </Suspense>
                    )}
                  </>
                )}

                {canModerateMembers && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setIsAddMemberOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />{" "}
                      <span className="hidden sm:inline">Inviter</span>
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
                    {isPendingRequest ? "Demande en attente" : "Rejoindre la Sphère"}
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
                    <span className="hidden sm:inline">Annuler la demande</span>
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
              Partager
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
                  <Users className="h-4 w-4 mr-2" /> Membres ({membersCount})
                </DropdownMenuItem>
                {canModerateMembers && (
                  <DropdownMenuItem onClick={() => onSelectTab("pending")}>
                    <UserCheck className="h-4 w-4 mr-2" /> Demandes ({pendingMembersCount})
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
