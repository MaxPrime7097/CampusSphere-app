import { useState } from "react";
import { Check, Plus, ShieldCheck } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { followPartner, unfollowPartner } from "@/services/api";
import type { UserProfile } from "@/types";

interface PartnerCardProps {
  partner: UserProfile;
  onNavigateProfile: (username: string) => void;
}

export function PartnerCard({ partner, onNavigateProfile }: PartnerCardProps) {
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(Boolean(partner.isFollowing));
  const [followersCount, setFollowersCount] = useState(Number(partner.followersCount || 0));
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    const previous = isFollowing;
    setIsFollowing(!previous);
    setFollowersCount((prev) => (previous ? Math.max(0, prev - 1) : prev + 1));
    setIsLoading(true);

    try {
      if (previous) {
        await unfollowPartner(partner.id);
        toast({
          title: "Désabonnement",
          description: `Vous ne suivez plus ${partner.name}.`,
          duration: 2000,
        });
      } else {
        await followPartner(partner.id);
        toast({
          title: "Abonnement réussi",
          description: `Vous suivez désormais ${partner.name}. Ses publications apparaîtront dans votre fil.`,
          duration: 2500,
        });
      }
    } catch (err: any) {
      setIsFollowing(previous);
      setFollowersCount((prev) => (previous ? prev + 1 : Math.max(0, prev - 1)));
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Une erreur est survenue lors du suivi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const orgType = partner.partnerProfile?.organizationType || "Organisation";
  const sector = partner.partnerProfile?.sector;

  return (
    <div
      className="flex items-center justify-between gap-3 py-3 px-2 sm:px-3 border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer rounded-lg"
      onClick={() => onNavigateProfile(partner.username)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-11 w-11 flex-shrink-0 border border-primary/20">
          <AvatarImage src={partner.avatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
            {partner.name?.slice(0, 2).toUpperCase() || "IP"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-sm truncate hover:underline text-foreground">
              {partner.name}
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 gap-0.5">
              <ShieldCheck className="h-3 w-3" />
              {orgType.toUpperCase()}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground truncate">@{partner.username}</p>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
            {sector && (
              <span className="text-foreground/80 font-medium truncate max-w-[160px]">
                {sector}
              </span>
            )}
            {sector && <span>·</span>}
            <span>
              {followersCount} {followersCount > 1 ? "abonnés" : "abonné"}
            </span>
          </div>
        </div>
      </div>

      <Button
        size="sm"
        disabled={isLoading}
        variant={isFollowing ? "outline" : "default"}
        className={`h-8 px-3 rounded-lg font-medium text-xs shrink-0 transition-all ${
          isFollowing
            ? "border-primary/40 text-primary hover:bg-primary/10"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
        }`}
        onClick={handleFollowToggle}
      >
        {isFollowing ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1 text-primary" />
            Suivi
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Suivre
          </>
        )}
      </Button>
    </div>
  );
}
