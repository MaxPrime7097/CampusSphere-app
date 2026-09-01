import { useState } from "react";
import { Share2, Copy, Check, MessageSquare, Twitter, Linkedin, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@/types/events.types";

interface EventShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
}

export function EventShareModal({ open, onOpenChange, event }: EventShareModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const eventUrl = `${window.location.origin}/events/${event.id}`;
  const shareText = `Découvrez l'événement "${event.title}" sur CampusSphere ! 🎓✨`;

  const handleCopy = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    toast({
      title: "Lien copié !",
      description: "Le lien a été copié dans votre presse-papier.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${eventUrl}`)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`, "_blank");
  };

  const shareLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`, "_blank");
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`${shareText}\n\n${eventUrl}`)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Share2 className="h-5 w-5 text-primary" />
            <span>Partager l'événement</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground line-clamp-1">{event.title}</p>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Direct link input with copy button */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={eventUrl}
              className="text-xs rounded-xl bg-muted font-mono"
            />
            <Button
              size="sm"
              onClick={handleCopy}
              className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1" /> Copié
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copier
                </>
              )}
            </Button>
          </div>

          {/* Social share options */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground block mb-2.5">
              Partager directement sur les réseaux :
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareWhatsApp}
                className="justify-start text-xs rounded-xl hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
              >
                <MessageSquare className="h-4 w-4 mr-2 text-emerald-500" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareTwitter}
                className="justify-start text-xs rounded-xl hover:bg-sky-500/10 hover:text-sky-600 hover:border-sky-500/30"
              >
                <Twitter className="h-4 w-4 mr-2 text-sky-500" />
                X / Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareLinkedIn}
                className="justify-start text-xs rounded-xl hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30"
              >
                <Linkedin className="h-4 w-4 mr-2 text-blue-600" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareEmail}
                className="justify-start text-xs rounded-xl hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-500/30"
              >
                <Mail className="h-4 w-4 mr-2 text-purple-500" />
                E-mail
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
