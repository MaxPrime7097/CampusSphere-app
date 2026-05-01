import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Clock, Check, Loader2, Zap } from "lucide-react";
import { getSphereCategoryLabel } from "@/constants/sphereCategories";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

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
  
  return (
    <Card 
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 campus-card cursor-pointer border-none bg-card/50 backdrop-blur-sm active:scale-[0.98]",
        className
      )}
      onClick={() => navigate(`/spheres/${sphere.id}`)}
    >
      <CardContent className="p-0">
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
          
          {/* Overlay badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-[10px] py-0 px-2 border-none">
              {getSphereCategoryLabel(sphere.category)}
            </Badge>
          </div>
          
          {sphere.requireApproval && (
            <div className="absolute top-2 right-2">
              <Badge variant="destructive" className="text-[10px] py-0 px-2 opacity-90">
                Privé
              </Badge>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 space-y-3">
          <div className="min-h-[60px]">
            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {sphere.name}
            </h3>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
              {sphere.description || "Rejoignez cette communauté pour collaborer et partager."}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {sphere.memberCount || 0}
              </span>
              {Number(sphere.impactScore) > 0 && (
                <span className="flex items-center gap-1 text-primary/80 font-medium">
                  <Zap className="h-3 w-3 fill-current" />
                  {sphere.impactScore}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div onClick={(e) => e.stopPropagation()}>
            {membership === "active" ? (
              <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1 border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-all active:scale-95">
                <Check className="h-3.5 w-3.5" />
                Rejoint
              </Button>
            ) : membership === "pending" ? (
              <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1 bg-amber-50 text-amber-600 border-amber-200" disabled>
                <Clock className="h-3.5 w-3.5" />
                En attente
              </Button>
            ) : (
              <Button 
                size="sm" 
                className="w-full h-8 text-xs gap-1 campus-gradient text-white hover:opacity-90 transition-all active:scale-95"
                onClick={onJoin}
                disabled={isJoining}
              >
                {isJoining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Rejoindre"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SphereCard.displayName = "SphereCard";
