import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Check, Loader2, Zap } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";
import { SPHERE_TYPE_LABELS, SPHERE_TYPE_COLORS, type SphereType } from "@/config/sphereFeatures";

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
        "group overflow-hidden cursor-pointer cs-card-raised border-border/40 active:scale-[0.98]",
        className
      )}
      onClick={() => navigate(`/spheres/${sphere.id}`)}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Banner — compact aspect ratio */}
        <div className="relative aspect-[2/1] overflow-hidden bg-muted">
          {bannerImage ? (
            <OptimizedImage 
              src={bannerImage} 
              alt={sphere.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              containerClassName="w-full h-full"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center", sphereColor)}>
              <span className="text-2xl font-bold text-foreground/20">
                {sphere.name?.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Type badge — top left */}
          <div className="absolute top-2 left-2">
             <Badge className={cn("px-1.5 py-0 text-[9px] font-semibold border shadow-sm", SPHERE_TYPE_COLORS[sphereType])}>
                {SPHERE_TYPE_LABELS[sphereType]}
             </Badge>
          </div>
          
          {/* Private badge — top right */}
          {sphere.require_approval && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="text-[9px] py-0 px-1.5 opacity-90 shadow-sm border-none">
                Prive
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1 gap-2">
          <div className="flex-1 min-h-0">
            <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-foreground transition-colors">
              {sphere.name}
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
              {sphere.description || "Rejoignez cette communaute pour collaborer et partager."}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1 text-[11px] font-medium">
                <Users className="h-3 w-3" />
                {sphere.memberCount || 0}
              </span>
              {Number(sphere.impactScore) > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                  <Zap className="h-3 w-3 text-primary" />
                  {sphere.impactScore}
                </span>
              )}
            </div>
            
            {membership === "active" && (
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-0.5">
                <Check className="h-3 w-3" /> Membre
              </span>
            )}
          </div>

          {/* Action Button */}
          <div onClick={(e) => e.stopPropagation()}>
            {membership === "none" && (
              <Button 
                size="sm" 
                className="w-full h-7 text-[11px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] shadow-none"
                onClick={onJoin}
                disabled={isJoining}
              >
                {isJoining ? <Loader2 className="h-3 w-3 animate-spin" /> : "Rejoindre"}
              </Button>
            )}
            
            {membership === "pending" && (
              <Button size="sm" variant="secondary" className="w-full h-7 text-[11px] font-semibold gap-1" disabled>
                <Clock className="h-3 w-3" />
                En attente
              </Button>
            )}
            
            {membership === "active" && (
              <Button size="sm" variant="outline" className="w-full h-7 text-[11px] font-semibold gap-1 active:scale-[0.97]">
                Acceder
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SphereCard.displayName = "SphereCard";
