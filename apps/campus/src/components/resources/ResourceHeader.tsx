import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Eye, BookmarkSimple, Lightning as Zap, SealCheck as BadgeCheck, PencilSimple, FolderSimplePlus as FolderInput, Trash as Trash2, ShareNetwork as Share2, Flag, Spinner as Loader2, X } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { renderMentionText } from "@/lib/mentions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredResourceRating, getStoredResourceImpactScore, setStoredResourceRating } from "@/lib/resourceImpact";
import { getAccessToken } from "@/services/api/client";
import {
  getTypeLabel,
  getSubjectLabel,
  getCategoryLabel,
} from "@/lib/resourceMetadata";
import { impactRateResource, type ResourceFolder } from "@/services/api";

interface ResourceHeaderProps {
  resource: {
    id: string;
    title: string;
    description: string;
    subject: string;
    category: string;
    type: string | null;
    format: string;
    uploader: {
      name: string;
      username?: string;
      avatar: string;
      verified: boolean;
      contributions: number;
    };
    stats: {
      downloads: number;
      saves: number;
      views: number;
    };
    impactScore: number;
    canEdit?: boolean;
    canDelete?: boolean;
  };
  isSaved: boolean;
  isSaving: boolean;
  isSharing: boolean;
  isReporting: boolean;
  isDeleting: boolean;
  folders: ResourceFolder[];
  currentFolderId: string;
  onSave: () => void;
  onOpenEdit: () => void;
  onOpenDelete: () => void;
  onShare: () => void;
  onReport: () => void;
  onMoveToFolder: (folderId: string) => Promise<void>;
}

export function ResourceHeader({
  resource,
  isSaved,
  isSaving,
  isSharing,
  isReporting,
  isDeleting,
  folders,
  currentFolderId,
  onSave,
  onOpenEdit,
  onOpenDelete,
  onShare,
  onReport,
  onMoveToFolder,
}: ResourceHeaderProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showFolderSelect, setShowFolderSelect] = useState(false);
  const [isMovingToFolder, setIsMovingToFolder] = useState(false);

  // Option A Rating state
  const [impactScore, setImpactScore] = useState(Number(resource.impactScore || 0));
  const [userImpactRating, setUserImpactRating] = useState<number | null>(null);
  const [showRatingPicker, setShowRatingPicker] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  const canonicalId = String(resource.id);

  useEffect(() => {
    setImpactScore(Number(resource.impactScore || 0));
  }, [resource.impactScore]);

  useEffect(() => {
    const storedRating = getStoredResourceRating(canonicalId);
    const storedScore = getStoredResourceImpactScore(canonicalId);
    if (storedRating !== null) {
      setUserImpactRating(storedRating);
    }
    if (storedScore !== null) {
      setImpactScore(storedScore);
    } else if (storedRating !== null) {
      setImpactScore((prev) => Math.max(prev, storedRating));
    }

    const handler = (e: any) => {
      if (e.detail?.resourceId === canonicalId) {
        setUserImpactRating(e.detail.value ?? null);
        if (typeof e.detail.impactScore === "number") {
          setImpactScore(e.detail.impactScore);
        }
      }
    };
    window.addEventListener("resource-impact-changed", handler);
    return () => window.removeEventListener("resource-impact-changed", handler);
  }, [canonicalId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!showRatingPicker) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowRatingPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showRatingPicker]);

  const handleImpactRate = async (value: number | null) => {
    if (!user && !getAccessToken()) {
      toast({ title: "Connexion requise", description: "Connectez-vous pour voter", duration: 2000 });
      return;
    }

    const prevScore = impactScore;
    const prevRating = userImpactRating;
    const previous = prevRating ?? 0;
    const current = value ?? 0;
    const delta = current - previous;
    const optimisticScore = Math.max(0, prevScore + delta);

    setImpactScore(optimisticScore);
    setUserImpactRating(value);
    setStoredResourceRating(canonicalId, value, optimisticScore);

    toast({
      title: value === null ? "Vote retiré" : `Impact noté : +${value}`,
      duration: 1500,
    });

    try {
      const response = await impactRateResource(canonicalId, value, prevRating);
      const nextScore = response?.impactScore ?? optimisticScore;
      const nextRating = response?.userImpactRating ?? value;

      setImpactScore(nextScore);
      setUserImpactRating(nextRating);
      setStoredResourceRating(canonicalId, nextRating, nextScore);
    } catch (error: any) {
      setImpactScore(prevScore);
      setUserImpactRating(prevRating);
      setStoredResourceRating(canonicalId, prevRating, prevScore);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'enregistrer votre vote",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handleTouchStartImpact = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (!user && !getAccessToken()) {
        toast({ title: "Connexion requise", description: "Connectez-vous pour voter", duration: 2000 });
        return;
      }
      setShowRatingPicker(true);
    }, 380);
  };

  const handleTouchEndImpact = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      setTimeout(() => {
        isLongPressRef.current = false;
      }, 100);
    }
  };

  const handleTouchMoveImpact = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMouseEnterImpact = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    hoverTimerRef.current = setTimeout(() => {
      if (user || getAccessToken()) setShowRatingPicker(true);
    }, 350);
  };

  const handleMouseLeaveImpact = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setShowRatingPicker(false);
    }, 400);
  };

  const handleSingleTapImpact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    if (!user && !getAccessToken()) {
      toast({ title: "Connexion requise", description: "Connectez-vous pour voter", duration: 2000 });
      return;
    }
    setShowRatingPicker(false);
    if (userImpactRating !== null) {
      handleImpactRate(null);
    } else {
      handleImpactRate(1);
    }
  };

  const handleFolderChange = async (val: string) => {
    setIsMovingToFolder(true);
    try {
      await onMoveToFolder(val);
      setShowFolderSelect(false);
    } finally {
      setIsMovingToFolder(false);
    }
  };

  return (
    <div className="pb-6 mb-4 border-b border-border/40">
      <div>
        {/* Title & Badges */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="font-semibold">
              {getTypeLabel(resource.type)}
            </Badge>
            {resource.subject && !["other", "autre", "general", "général"].includes(resource.subject.toLowerCase()) && (
              <Badge variant="secondary">{getSubjectLabel(resource.subject)}</Badge>
            )}
            {resource.category && !["general", "général", "autre", "other"].includes(getCategoryLabel(resource.category).toLowerCase()) && (
              <Badge variant="outline">{getCategoryLabel(resource.category)}</Badge>
            )}
            <Badge variant="outline">
              {resource.format ? resource.format.toUpperCase() : "Non défini"}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words break-all sm:break-normal">
            {resource.title}
          </h1>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {renderMentionText(resource.description)}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            {resource.stats.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {resource.stats.views}
          </span>
          <span className="flex items-center gap-1">
            <BookmarkSimple className="h-4 w-4" />
            {resource.stats.saves}
          </span>

          {/* Interactive Impact Score Option A */}
          <div
            className="relative ml-auto"
            onMouseEnter={handleMouseEnterImpact}
            onMouseLeave={handleMouseLeaveImpact}
          >
            {showRatingPicker && (
              <div
                ref={pickerRef}
                className="absolute bottom-full right-0 mb-2 z-30 flex items-center gap-1 p-1 bg-background/95 backdrop-blur-md border border-border/80 shadow-lg rounded-full animate-in fade-in-0 zoom-in-95 duration-150 before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-4"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => {
                  if (leaveTimerRef.current) {
                    clearTimeout(leaveTimerRef.current);
                    leaveTimerRef.current = null;
                  }
                }}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRatingPicker(false);
                      handleImpactRate(value);
                    }}
                    className={cn(
                      "h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all cursor-pointer",
                      userImpactRating === value
                        ? "bg-primary text-primary-foreground shadow-sm scale-110"
                        : "hover:bg-primary/20 hover:text-primary text-foreground"
                    )}
                    title={`Noter ${value}/5`}
                  >
                    {value}
                  </button>
                ))}
                {userImpactRating !== null && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRatingPicker(false);
                      handleImpactRate(null);
                    }}
                    className="h-7 w-7 rounded-full text-xs flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Retirer mon vote"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onTouchStart={handleTouchStartImpact}
              onTouchEnd={handleTouchEndImpact}
              onTouchMove={handleTouchMoveImpact}
              onClick={handleSingleTapImpact}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 cursor-pointer select-none",
                userImpactRating
                  ? "bg-primary/20 text-primary border-primary/50 shadow-xs"
                  : "bg-primary/10 text-foreground border-primary/30 hover:bg-primary/15"
              )}
              title={
                userImpactRating
                  ? `Impact attribue (${userImpactRating}/5) — Cliquer pour retirer`
                  : "Cliquer pour +1 Impact ou maintenir pour evaluer de 1 a 5"
              }
            >
              <Zap className="h-4 w-4 text-primary" weight={userImpactRating ? "fill" : "regular"} />
              <span className="text-xs font-bold text-primary">{impactScore}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Impact</span>
            </button>
          </div>
        </div>

        {/* Uploader Info & Actions */}
        <div className="flex flex-col gap-3 p-3 bg-accent/50 rounded-lg mb-4 md:flex-row md:items-center md:justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() =>
              resource.uploader.username &&
              navigate(`/profile/${resource.uploader.username}`)
            }
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={resource.uploader.avatar} />
              <AvatarFallback>{resource.uploader.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{resource.uploader.name}</p>
                {resource.uploader.verified && (
                  <BadgeCheck className="h-4 w-4 text-primary" weight="fill" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {resource.uploader.contributions} contributions
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="gap-2"
              aria-label={isSaved ? "Retirer des enregistrements" : "Enregistrer la ressource"}
            >
              <BookmarkSimple className="h-4 w-4" weight={isSaved ? "fill" : "regular"} />
              <span className="hidden md:inline">
                {isSaved ? "Enregistré" : "Enregistrer"}
              </span>
            </Button>

            {resource.canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenEdit}
                className="gap-2"
                aria-label="Modifier la ressource"
              >
                <PencilSimple className="h-4 w-4" />
                <span className="hidden md:inline">Modifier</span>
              </Button>
            )}

            {resource.canEdit && folders.length > 0 && !showFolderSelect && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFolderSelect(true)}
                className="gap-2"
                aria-label="Déplacer vers un dossier"
              >
                <FolderInput className="h-4 w-4" />
                <span className="hidden md:inline">Dossier</span>
              </Button>
            )}

            {resource.canEdit && folders.length > 0 && showFolderSelect && (
              <div className="flex items-center gap-1">
                <Select
                  value={currentFolderId}
                  onValueChange={handleFolderChange}
                >
                  <SelectTrigger className="h-8 text-xs w-36">
                    {isMovingToFolder ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <SelectValue placeholder="Choisir dossier" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun dossier</SelectItem>
                    {folders.map((f) => (
                      <SelectItem
                        key={f.id}
                        value={String(f.id)}
                        disabled={
                          f.resource_count >= 20 && currentFolderId !== String(f.id)
                        }
                      >
                        {f.name} ({f.resource_count}/20)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFolderSelect(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {resource.canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onOpenDelete}
                disabled={isDeleting}
                className="gap-2"
                aria-label="Supprimer la ressource"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="hidden md:inline">Supprimer</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              disabled={isSharing}
              className="gap-2"
              aria-label="Partager la ressource"
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span className="hidden md:inline">Partager</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onReport}
              disabled={isReporting}
              className="gap-2"
              aria-label="Signaler la ressource"
            >
              {isReporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              <span className="hidden md:inline">Signaler</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
