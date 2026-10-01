import { useState } from "react";
import { Ticket, Calendar, Clock, MapPin, Globe, ShieldCheck, Download, Copy, Check, SealCheck as BadgeCheck } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QRCodeSVG } from "@/components/events/QRCodeSVG";
import { getEventCategoryMeta } from "@/constants/eventCategories";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatSlugToLabel } from "@/lib/utils";
import type { Event } from "@/types/events.types";

interface EventTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
}

export function EventTicketModal({
  open,
  onOpenChange,
  event,
}: EventTicketModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const ticketCode =
    event.userTicketCode || `CS-EVT-${event.id}-${currentUser?.id || "ME"}-7C9B`;
  const meta = getEventCategoryMeta(event.category);
  const startDate = new Date(event.startDate);

  const formattedDate = startDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = startDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const facultyFormatted = currentUser?.faculty
    ? formatSlugToLabel(currentUser.faculty)
    : currentUser?.university || "IUC Douala";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    toast({
      title: "Code de billet copié",
      description: "Le code unique a été copié dans votre presse-papier.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md sm:rounded-3xl p-0 overflow-hidden border-border/80 bg-card shadow-2xl">
        {/* Printable Container */}
        <div id="ticket-printable" className="w-full flex flex-col bg-card">
          {/* Ticket Header Banner */}
          <div className={`p-5 bg-gradient-to-r ${meta.gradient} text-white relative`}>
            <div className="flex items-center justify-between">
              <Badge className="bg-black/40 backdrop-blur-md text-white border-white/20 text-[11px] font-semibold">
                <Ticket className="h-3.5 w-3.5 mr-1" />
                {meta.shortLabel || "Billet officiel"}
              </Badge>

              <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase">
                CampusSphere Pass
              </span>
            </div>

            <h3 className="mt-3 text-lg font-bold text-white line-clamp-2 leading-tight">
              {event.title}
            </h3>

            <div className="mt-2 flex items-center gap-2 text-xs text-white/90 font-medium">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-white/80" />
              <span className="capitalize">{formattedDate}</span>
              <span>•</span>
              <Clock className="h-3.5 w-3.5 shrink-0 text-white/80" />
              <span>{formattedTime}</span>
            </div>
          </div>

          {/* Ticket Body: Attendee & QR Code */}
          <div className="p-6 space-y-5">
            {/* Attendee details */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border/60">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={currentUser?.avatar || undefined} />
                  <AvatarFallback className="font-bold text-xs bg-muted text-muted-foreground">
                    {currentUser?.name?.slice(0, 1).toUpperCase() ||
                      currentUser?.username?.slice(0, 1).toUpperCase() ||
                      "E"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {currentUser?.name || currentUser?.username || "Étudiant Campus"}
                    </span>
                    <BadgeCheck className="h-3.5 w-3.5 text-primary" weight="fill" />
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {facultyFormatted}
                  </p>
                </div>
              </div>

              <Badge
                variant="outline"
                className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              >
                {event.isCheckedIn || event.userStatus === "attended" ? "Validé (Présent)" : "Inscrit"}
              </Badge>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-border/80 bg-background space-y-3">
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-gray-100">
                <QRCodeSVG value={ticketCode} size={150} fgColor="#111827" bgColor="#FFFFFF" />
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-foreground tracking-wider">
                    {ticketCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 print:hidden"
                    title="Copier le code"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Présentez ce QR code à l'entrée de l'événement pour valider votre accès.
                </p>
              </div>
            </div>

            {/* Location info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {event.isOnline ? (
                <Globe className="h-4 w-4 text-blue-500 shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium text-foreground truncate">
                {event.isOnline ? "Événement en ligne" : event.location || "Grand Amphi, Campus IUC"}
              </span>
            </div>

            {/* Actions: Print & Done */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/60 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1 rounded-xl text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Imprimer le billet
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-xl text-xs font-semibold"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>

        {/* Global Print Isolation Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #ticket-printable, #ticket-printable * {
              visibility: visible !important;
            }
            #ticket-printable {
              position: fixed !important;
              left: 50% !important;
              top: 50% !important;
              transform: translate(-50%, -50%) !important;
              width: 380px !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 16px !important;
              overflow: hidden !important;
              background: #ffffff !important;
              color: #111827 !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            @page {
              size: auto;
              margin: 10mm;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
