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
  
  // Design details
  const sphereColor = sphere.color || "from-primary/20 to-accent/20";
  const bannerImage = sphere.banner_image || sphere.bannerImage;
  const sphereType = (sphere.sphere_type || 'communaute') as SphereType;
  
  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 campus-card cursor-pointer border-border/50 bg-card active:scale-[0.98]",
        className
      )}
      onClick={() => navigate(`/spheres/${sphere.id}`)}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Banner Section */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {bannerImage ? (
            <OptimizedImage 
              src={bannerImage} 
              alt={sphere.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              containerClassName="w-full h-full"
            />
          ) : (
            <div className={cn("w-full h-full bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold", sphereColor)}>
              {sphere.name?.charAt(0)}
            </div>
          )}
          
          {/* Overlay badges (Type de sphère au lieu de catégorie) */}
          <div className="absolute top-3 left-3">
             <Badge className={cn("px-2 py-0.5 text-[10px] font-bold border shadow-sm", SPHERE_TYPE_COLORS[sphereType])}>
                {SPHERE_TYPE_LABELS[sphereType]}
             </Badge>
          </div>
          
          {sphere.require_approval && (
            <div className="absolute top-3 right-3">
              <Badge variant="destructive" className="text-[10px] py-0.5 px-2 opacity-90 shadow-sm border-none bg-red-600">
                Privé
              </Badge>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 flex flex-col flex-1 space-y-3">
          <div className="flex-1">
            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {sphere.name}
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
              {sphere.description || "Rejoignez cette communauté pour collaborer et partager."}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <Users className="h-3.5 w-3.5" />
                {sphere.memberCount || 0}
              </span>
              {Number(sphere.impactScore) > 0 && (
                <span className="flex items-center gap-1.5 text-primary/80 text-[11px] font-bold">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  {sphere.impactScore}
                </span>
              )}
            </div>
            
            {/* Action text indicator */}
            {membership === "active" && (
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Check className="h-3 w-3" /> Membre
              </span>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
            {membership === "none" && (
              <Button 
                size="sm" 
                className="w-full h-8 text-[11px] font-bold campus-gradient text-white hover:opacity-90 transition-all active:scale-95 shadow-md border-none"
                onClick={onJoin}
                disabled={isJoining}
              >
                {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Rejoindre la sphère"}
              </Button>
            )}
            
            {membership === "pending" && (
              <Button size="sm" variant="outline" className="w-full h-8 text-[11px] font-bold gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20" disabled>
                <Clock className="h-3.5 w-3.5" />
                Demande en attente
              </Button>
            )}
            
            {membership === "active" && (
              <Button size="sm" variant="outline" className="w-full h-8 text-[11px] font-bold gap-1 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all active:scale-95">
                Accéder
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SphereCard.displayName = "SphereCard";
