import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Loader2, Zap, BookOpen, Target, Globe, Trophy, FileText, Lock } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import { SPHERE_TYPE_LABELS, SPHERE_TYPE_COLORS, SPHERE_TYPE_ICONS, type SphereType } from "@/config/sphereFeatures";

interface SphereCardProps {
  sphere: any;
  isJoining?: boolean;
  membership?: "active" | "pending" | "none";
  onJoin?: () => void;
  className?: string;
}

export const SphereCard = React.memo(({ sphere, isJoining, membership = "none", onJoin, className }: SphereCardProps) => {
  const navigate = useNavigate();
  
  const sphereColor = sphere.color || "from-primary/20 to-accent/20";
  const bannerImage = sphere.banner_image || sphere.bannerImage;
  const sphereType = (sphere.sphere_type || 'communaute') as SphereType;
  
  return (
    <Card 
      className={cn(
        "group flex flex-col overflow-hidden cursor-pointer border-border/40 hover:border-border/80 hover:shadow-md transition-all duration-300 active:scale-[0.99]",
        className
      )}
      onClick={() => navigate(`/spheres/${sphere.id}`)}
    >
      {/* HEADER: Banner & Avatar */}
      <div className="relative h-24 bg-muted overflow-hidden">
        {/* Banner Image or Gradient Fallback */}
        {bannerImage ? (
          <OptimizedImage 
            src={bannerImage} 
            alt={sphere.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            containerClassName="w-full h-full"
          />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br opacity-60", sphereColor)} />
        )}
        
        {/* Type Badge - Top Right */}
        <div className="absolute top-2 right-2">
           <Badge className={cn("px-2 py-0.5 flex items-center gap-1.5 text-[10px] font-medium border-0 shadow-sm backdrop-blur-md bg-background/90", SPHERE_TYPE_COLORS[sphereType])}>
              {(() => {
                const iconName = SPHERE_TYPE_ICONS[sphereType];
                if (iconName === 'BookOpen') return <BookOpen className="h-3 w-3" />;
                if (iconName === 'Target') return <Target className="h-3 w-3" />;
                if (iconName === 'Globe') return <Globe className="h-3 w-3" />;
                if (iconName === 'Trophy') return <Trophy className="h-3 w-3" />;
                if (iconName === 'Pencil') return <FileText className="h-3 w-3" />;
                return null;
              })()}
              {SPHERE_TYPE_LABELS[sphereType]}
           </Badge>
        </div>

        {/* Overlapping Avatar */}
        <div className="absolute -bottom-5 left-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-card bg-background flex items-center justify-center shadow-sm overflow-hidden z-10 relative">
            <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", sphereColor)}>
              <span className="text-lg font-bold text-foreground/80">
                {sphere.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY: Content */}
      <div className="pt-7 px-4 pb-4 flex flex-col flex-1 bg-card">
        {/* Title & Private Lock */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {sphere.name}
          </h3>
          {sphere.require_approval && (
            <div title="Sphère Privée" className="bg-destructive/10 p-1 rounded-full flex-shrink-0 mt-0.5">
              <Lock className="h-3 w-3 text-destructive" />
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed mb-4 flex-1">
          {sphere.description || "Rejoignez cette communauté pour collaborer et partager."}
        </p>

        {/* Stats & Actions Row */}
        <div className="flex items-center justify-between mt-auto">
          {/* Stats Pills */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-1 rounded-md">
              <Users className="h-3 w-3" />
              {sphere.memberCount || 0}
            </div>
            {Number(sphere.impactScore) > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-md border border-amber-200/50 dark:border-amber-900/50">
                <Zap className="h-3 w-3" />
                {sphere.impactScore}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div onClick={(e) => e.stopPropagation()}>
            {membership === "none" && (
              <Button 
                size="sm" 
                className="h-7 text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] shadow-none px-3"
                onClick={onJoin}
                disabled={isJoining}
              >
                {isJoining ? <Loader2 className="h-3 w-3 animate-spin" /> : "Rejoindre"}
              </Button>
            )}
            
            {membership === "pending" && (
              <Button size="sm" variant="secondary" className="h-7 text-[11px] font-semibold gap-1 px-3" disabled>
                <Clock className="h-3 w-3" />
                Attente
              </Button>
            )}
            
            {membership === "active" && (
              <Button size="sm" variant="outline" className="h-7 text-[11px] font-semibold gap-1 px-3 active:scale-[0.97]">
                Accéder
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

SphereCard.displayName = "SphereCard";
