import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UsersThree as Users, Lock, Check, Clock, BookOpen, FolderSimple as FolderGit2, Sparkle as Sparkles, GraduationCap, Stack as Layers, ArrowRight, ShieldCheck, UsersFour, Target } from "@phosphor-icons/react";
import { cn, getSphereUrl } from "@/lib/utils";
import { normalizeSphereType } from "@/config/sphereFeatures";
import type { Sphere } from "@/types";

interface SphereCardProps {
  sphere: Sphere;
  isJoining?: boolean;
  membership?: "active" | "pending" | "none";
  onJoin?: () => void;
  className?: string;
  layout?: "list" | "grid";
}

const SPHERE_TYPE_META: Record<
  string,
  { label: string; gradient: string; icon: React.ComponentType<{ className?: string }> }
> = {
  cours: {
    label: "Cours",
    gradient: "from-blue-600 to-indigo-700",
    icon: BookOpen,
  },
  projet: {
    label: "Projet",
    gradient: "from-violet-600 to-purple-700",
    icon: Target,
  },
  communaute: {
    label: "Communauté",
    gradient: "from-sky-600 to-teal-700",
    icon: UsersFour,
  },
  default: {
    label: "Communauté",
    gradient: "from-sky-600 to-teal-700",
    icon: UsersFour,
  },
};

export const SphereCard = React.memo(
  ({
    sphere,
    isJoining = false,
    membership = "none",
    onJoin,
    className,
    layout = "list",
  }: SphereCardProps) => {
    const { t } = useTranslation("spheres");
    const navigate = useNavigate();

    const bannerImage = sphere.banner_url || sphere.bannerUrl || sphere.cover_image || sphere.coverImage;
    const canonicalType = normalizeSphereType(
      sphere.sphere_type || sphere.sphereType || (sphere as any).category || "communaute"
    );
    const meta = SPHERE_TYPE_META[canonicalType] || SPHERE_TYPE_META.default;
    const IconComponent = meta.icon;
    const typeLabel = t(`card.${canonicalType}`, { defaultValue: meta.label });

    const memberCount = Number(sphere.member_count ?? sphere.memberCount ?? 1);
    const creator = sphere.created_by_info || sphere.createdBy || sphere.creator_info;
    const creatorName = creator?.name || creator?.username || t("card.defaultCreator");

    const isMember = membership === "active";
    const isPending = membership === "pending";

    const handleActionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMember) {
        navigate(getSphereUrl(sphere));
      } else if (!isPending && onJoin) {
        onJoin();
      }
    };

    if (layout === "grid") {
      return (
        <div
          onClick={() => navigate(getSphereUrl(sphere))}
          className={cn("group flex flex-col cursor-pointer transition-all", className)}
        >
          {/* Visual Banner Tile (Spotify-style, no heavy card container) */}
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted/60 border border-border/30">
            {bannerImage ? (
              <img
                src={bannerImage}
                alt={sphere.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className={cn("h-full w-full flex items-center justify-center bg-gradient-to-br", meta.gradient, "opacity-90")}>
                <IconComponent className="h-10 w-10 text-white/90" />
              </div>
            )}

            {/* Category badge floating top-right */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <span className="rounded-lg bg-background/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/40 shadow-2xs">
                {typeLabel}
              </span>
            </div>

            {/* Lock indicator */}
            {(sphere.is_private || sphere.require_approval) && (
              <div className="absolute top-2.5 left-2.5 rounded-lg bg-background/85 backdrop-blur-md p-1.5 text-muted-foreground border border-border/40 shadow-2xs">
                <Lock className="h-3 w-3" />
              </div>
            )}

            {isMember && (
              <div className="absolute bottom-2.5 left-2.5">
                <span className="flex items-center gap-1 rounded-lg bg-emerald-500/90 text-white backdrop-blur-md px-2 py-0.5 text-[10px] font-semibold shadow-xs">
                  <Check className="h-3 w-3" /> {t("card.member")}
                </span>
              </div>
            )}
          </div>

          {/* Typography underneath */}
          <div className="pt-2.5 space-y-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:underline">
              {sphere.name}
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {sphere.description || sphere.objective || t("card.defaultDesc")}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{t("card.members", { count: memberCount })}</span>
              </span>

              <div onClick={(e) => e.stopPropagation()}>
                {isMember ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-[11px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                    onClick={handleActionClick}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    <span>{t("card.open")}</span>
                  </Button>
                ) : isPending ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="h-7 px-2 text-[11px] text-muted-foreground rounded-lg font-normal"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{t("card.requested")}</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-[11px] bg-secondary hover:bg-muted text-secondary-foreground border border-border/50 rounded-lg font-normal"
                    onClick={handleActionClick}
                    disabled={isJoining}
                  >
                    {isJoining ? "..." : t("card.join")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={() => navigate(getSphereUrl(sphere))}
        className={cn(
          "group flex items-center justify-between gap-3 sm:gap-4 py-3.5 px-3 sm:px-4 rounded-xl border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer",
          className
        )}
      >
        {/* Left: Avatar or Icon */}
        <div className="relative shrink-0">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={sphere.name}
              className="h-11 w-11 rounded-lg object-cover border border-border/50"
              loading="lazy"
            />
          ) : (
            <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center border border-border/50", `bg-gradient-to-br ${meta.gradient} opacity-90`)}>
              <IconComponent className="h-5 w-5 text-white" />
            </div>
          )}
          {(sphere.is_private || sphere.require_approval) && (
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border">
              <Lock className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Center: Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-foreground truncate group-hover:underline">
              {sphere.name}
            </h3>
            <Badge variant="muted" size="sm" className="text-[10px] font-normal py-0">
              {typeLabel}
            </Badge>
            {isMember && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="h-3 w-3" /> {t("card.member")}
              </span>
            )}
            {isPending && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <Clock className="h-3 w-3" /> {t("card.pending")}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {sphere.description || sphere.objective || t("card.defaultDesc")}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
            <span className="truncate max-w-[120px]">{t("card.byCreator", { name: creatorName })}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t("card.members", { count: memberCount })}
            </span>
          </div>
        </div>

        {/* Right: Action */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {isMember ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-medium"
              onClick={handleActionClick}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              <span>{t("card.open")}</span>
            </Button>
          ) : isPending ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-8 px-2.5 text-xs text-muted-foreground font-normal"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{t("card.requested")}</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-2.5 text-xs bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 font-normal"
              onClick={handleActionClick}
              disabled={isJoining}
            >
              {isJoining ? "..." : t("card.join")}
            </Button>
          )}
        </div>
      </div>
    );
  }
);

SphereCard.displayName = "SphereCard";
