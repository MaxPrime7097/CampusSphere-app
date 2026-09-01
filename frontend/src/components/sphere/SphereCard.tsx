import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Lock,
  Check,
  Clock,
  BookOpen,
  FolderGit2,
  Sparkles,
  GraduationCap,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn, getSphereUrl } from "@/lib/utils";

interface SphereCardProps {
  sphere: any;
  isJoining?: boolean;
  membership?: "active" | "pending" | "none";
  onJoin?: () => void;
  className?: string;
}

const SPHERE_TYPE_META: Record<
  string,
  { label: string; gradient: string; icon: React.ComponentType<{ className?: string }> }
> = {
  cours: {
    label: "Cours & TD",
    gradient: "from-blue-600 to-indigo-700",
    icon: BookOpen,
  },
  projet: {
    label: "Projet & Groupe",
    gradient: "from-pink-600 to-rose-700",
    icon: FolderGit2,
  },
  communaute: {
    label: "Communauté",
    gradient: "from-emerald-600 to-teal-700",
    icon: Users,
  },
  club: {
    label: "Club & Asso",
    gradient: "from-amber-500 to-orange-600",
    icon: Sparkles,
  },
  revision: {
    label: "Révisions & Examens",
    gradient: "from-purple-600 to-violet-800",
    icon: GraduationCap,
  },
  default: {
    label: "Sphère",
    gradient: "from-slate-700 to-zinc-900",
    icon: Layers,
  },
};

export const SphereCard = React.memo(
  ({
    sphere,
    isJoining = false,
    membership = "none",
    onJoin,
    className,
  }: SphereCardProps) => {
    const navigate = useNavigate();

    const bannerImage = sphere.banner_url || sphere.bannerUrl || sphere.cover_image || sphere.coverImage;
    const rawType = (sphere.sphere_type || sphere.sphereType || "communaute").toLowerCase();
    const meta = SPHERE_TYPE_META[rawType] || SPHERE_TYPE_META.default;
    const IconComponent = meta.icon;

    const memberCount = Number(sphere.member_count ?? sphere.memberCount ?? 1);
    const creator = sphere.created_by_info || sphere.createdBy || sphere.creator_info;
    const creatorName = creator?.name || creator?.username || "Créateur";

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

    return (
      <div
        onClick={() => navigate(getSphereUrl(sphere))}
        className={cn(
          "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg cursor-pointer",
          className
        )}
      >
        {/* Top Banner / Cover */}
        <div className="relative h-36 w-full overflow-hidden bg-muted">
          {bannerImage ? (
            <img
              src={bannerImage}
              alt={sphere.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${meta.gradient} opacity-90 flex items-center justify-center`}
            >
              <IconComponent className="h-14 w-14 text-white/30" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Sphere Type Badge (Top Left) */}
          <div className="absolute left-3 top-3">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 backdrop-blur-md bg-background/90 text-foreground font-semibold px-2.5 py-1 text-xs shadow-xs border border-border/40"
            >
              <IconComponent className="h-3.5 w-3.5 text-primary" />
              <span>{meta.label}</span>
            </Badge>
          </div>

          {/* Privacy Lock Badge (Top Right) */}
          {(sphere.is_private || sphere.require_approval) && (
            <div className="absolute right-3 top-3">
              <Badge
                variant="outline"
                className="bg-black/60 text-white backdrop-blur-md border-white/20 text-[10px] font-medium px-2 py-0.5"
              >
                <Lock className="h-3 w-3 mr-1" />
                Privée
              </Badge>
            </div>
          )}

          {/* Target Audience / Status on Cover bottom */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
            {sphere.target_audience && sphere.target_audience !== "Tous les étudiants" ? (
              <span className="truncate text-[11px] font-medium text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                {sphere.target_audience}
              </span>
            ) : (
              <span />
            )}

            {isMember && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 shadow-xs backdrop-blur-xs">
                <Check className="h-3 w-3" /> Membre
              </span>
            )}
            {isPending && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 shadow-xs backdrop-blur-xs">
                <Clock className="h-3 w-3" /> En attente
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col p-4">
          {/* Title */}
          <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {sphere.name}
          </h3>

          {/* Description */}
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground leading-relaxed flex-1">
            {sphere.description || sphere.objective || "Sphère d'échange et de travail collaboratif."}
          </p>

          {/* Footer Info: Creator & Member Count */}
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
            {/* Creator */}
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-6 w-6 border border-border shrink-0">
                <AvatarImage src={creator?.avatar || undefined} />
                <AvatarFallback className="text-[9px] font-bold">
                  {creatorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate font-medium">
                {creatorName}
              </span>
            </div>

            {/* Member count */}
            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>{memberCount}</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3">
            {isMember ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold text-xs"
                onClick={handleActionClick}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Accéder à la sphère
              </Button>
            ) : isPending ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="w-full border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold text-xs"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Demande envoyée
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-all"
                onClick={handleActionClick}
                disabled={isJoining}
              >
                {isJoining ? "Connexion..." : "Rejoindre la sphère"}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

SphereCard.displayName = "SphereCard";
