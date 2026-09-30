import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Check,
  Share2,
  Mail,
  Smartphone,
} from "lucide-react";

export type ShareItemType = "post" | "event" | "resource" | "sphere";

export interface SharePreviewData {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string | null;
  icon?: React.ReactNode;
}

export interface UniversalShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type?: ShareItemType;
  url: string;
  title: string;
  preview?: SharePreviewData;
  allowDirectShare?: boolean;
}

export function UniversalShareModal({
  open,
  onOpenChange,
  type = "resource",
  url,
  title,
  preview,
}: UniversalShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Compute full canonical URL
  const fullUrl = url.startsWith("http")
    ? url
    : `${typeof window !== "undefined" ? window.location.origin : ""}${url.startsWith("/") ? "" : "/"}${url}`;

  const shareTitle = preview?.title || title;
  const shareText = `Découvre ${
    type === "event"
      ? "cet événement"
      : type === "sphere"
      ? "cette sphère"
      : type === "post"
      ? "ce post"
      : "cette ressource"
  } sur CampusSphere : "${shareTitle}"`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: "Lien copié !",
        description: "Le lien canonique a été copié dans votre presse-papiers.",
      });
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: fullUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const shareChannels = [
    {
      name: "WhatsApp",
      icon: (
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#25D366"
            d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2z"
          />
          <path
            fill="#FFFFFF"
            d="M17.47 14.39c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.89-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z"
          />
        </svg>
      ),
      action: () =>
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
          "_blank",
          "noopener,noreferrer"
        ),
    },
    {
      name: "X (Twitter)",
      icon: (
        <svg className="w-6 h-6 shrink-0 fill-foreground" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
          "_blank",
          "noopener,noreferrer"
        ),
    },
    {
      name: "Telegram",
      icon: (
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#24A1DE" />
          <path
            fill="#FFFFFF"
            d="M17.65 8.13c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18.25.25 0 0 0-.21-.02c-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
          />
        </svg>
      ),
      action: () =>
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
          "_blank",
          "noopener,noreferrer"
        ),
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
          <rect width="20" height="20" x="2" y="2" rx="4" fill="#0A66C2" />
          <path
            fill="#FFFFFF"
            d="M8.34 18.34H5.67V9.75h2.67v8.59zM7 8.57a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1zm11.34 9.77h-2.67v-4.18c0-1-.02-2.28-1.39-2.28-1.39 0-1.6 1.09-1.6 2.21v4.25h-2.67V9.75h2.56v1.17h.04c.36-.67 1.23-1.39 2.52-1.39 2.7 0 3.2 1.78 3.2 4.09v4.72z"
          />
        </svg>
      ),
      action: () =>
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
          "_blank",
          "noopener,noreferrer"
        ),
    },
    {
      name: "Facebook",
      icon: (
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#1877F2" />
          <path
            fill="#FFFFFF"
            d="M13.5 18v-5.25h1.76l.26-2.04H13.5V9.41c0-.59.16-1 .99-1h1.06V6.59c-.18-.02-.81-.08-1.54-.08-1.52 0-2.56.93-2.56 2.63v1.57H9.7v2.04h1.75V18h2.05z"
          />
        </svg>
      ),
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
          "_blank",
          "noopener,noreferrer"
        ),
    },
    {
      name: "E-mail",
      icon: <Mail className="w-6 h-6 shrink-0 text-foreground" />,
      action: () =>
        window.open(
          `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
          "_blank"
        ),
    },
  ];

  const typeLabel =
    type === "event"
      ? "l'événement"
      : type === "sphere"
      ? "la sphère"
      : type === "post"
      ? "le post"
      : "la ressource";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl sm:rounded-3xl p-5 sm:p-7 border-border/60 space-y-4 sm:space-y-6">
        {/* Header */}
        <DialogHeader className="space-y-1.5 text-left pb-3 border-b border-border/40 max-sm:!mt-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Partager {typeLabel}
              </DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {shareTitle}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Canonical Direct Link Section */}
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-semibold text-foreground">
            Lien direct
          </label>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={fullUrl}
              className="text-xs sm:text-sm rounded-xl bg-muted/40 border-border/50 font-mono h-12 px-4 select-all flex-1 text-foreground"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="default"
              onClick={handleCopy}
              className="shrink-0 text-xs sm:text-sm rounded-xl h-12 px-5 gap-2 font-semibold transition-all active:scale-[0.98]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copier</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Social Channels Section: 3 columns on mobile, 6 columns on desktop */}
        <div className="space-y-3">
          <span className="text-xs sm:text-sm font-semibold text-foreground block">
            Partager sur les réseaux
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-3.5">
            {shareChannels.map((channel) => (
              <button
                key={channel.name}
                type="button"
                onClick={channel.action}
                className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-muted/40 transition-all active:scale-95 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-muted/60 border border-border/60 group-hover:bg-muted group-hover:border-border/90 group-hover:scale-105 flex items-center justify-center transition-all shadow-xs">
                  {channel.icon}
                </div>
                <span className="text-xs sm:text-[13px] font-medium text-muted-foreground group-hover:text-foreground mt-2 text-center truncate max-w-full">
                  {channel.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Native mobile device share if supported */}
        {typeof navigator !== "undefined" && Boolean(navigator.share) && (
          <Button
            type="button"
            variant="outline"
            onClick={handleNativeShare}
            className="w-full text-xs sm:text-sm text-foreground h-11 rounded-xl gap-2 font-medium border-border/60 hover:bg-muted/50 transition-colors"
          >
            <Smartphone className="h-4 w-4 text-muted-foreground" />
            <span>Ouvrir les options de partage de votre appareil</span>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
