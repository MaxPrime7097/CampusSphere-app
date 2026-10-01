import { useState } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Users,
  Camera,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { checkInAttendee } from "@/services/eventService";
import type { Event, EventAttendee } from "@/types/events.types";

interface EventScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  attendees: EventAttendee[];
  onCheckInSuccess: (updatedAttendee: EventAttendee) => void;
}

export function EventScannerModal({
  open,
  onOpenChange,
  event,
  attendees,
  onCheckInSuccess,
}: EventScannerModalProps) {
  const [ticketInput, setTicketInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "success" | "already_scanned" | "error";
    message: string;
    attendee?: EventAttendee;
  } | null>(null);

  const checkedInCount = attendees.filter(
    (a) => a.status === "attended" || a.isCheckedIn
  ).length;

  const handleValidateTicket = async (codeToUse?: string) => {
    const code = codeToUse || ticketInput.trim();
    if (!code) return;

    setIsProcessing(true);
    setScanResult(null);

    try {
      const res = await checkInAttendee(event.id, code);
      if (res.alreadyCheckedIn) {
        setScanResult({
          status: "already_scanned",
          message: "Attention : Ce billet a déjà été validé précédemment.",
          attendee: res.attendee,
        });
      } else {
        setScanResult({
          status: "success",
          message: `Présence validée avec succès pour ${res.attendee?.user?.name || res.attendee?.user?.username || "l'étudiant"}.`,
          attendee: res.attendee,
        });
        onCheckInSuccess(res.attendee);
      }
      setTicketInput("");
    } catch (err: any) {
      setScanResult({
        status: "error",
        message: err?.message || "Billet introuvable pour cet événement.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 space-y-5">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <QrCode className="h-5 w-5 text-muted-foreground" />
              <span>Contrôle d'accès & Check-in</span>
            </DialogTitle>
            <Badge variant="secondary" className="text-xs font-semibold">
              {checkedInCount} / {attendees.length} entrées
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{event.title}</p>
        </DialogHeader>

        {/* Camera Viewfinder Simulation */}
        <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-950 border border-border flex flex-col items-center justify-center text-white space-y-2">
          {/* Animated scanning line */}
          <div className="absolute inset-x-8 h-0.5 bg-emerald-500/80 animate-pulse shadow-md top-1/2" />

          <Camera className="h-10 w-10 text-muted-foreground mb-1" />
          <span className="text-xs font-bold tracking-wide">
            Viseur de scan actif
          </span>
          <span className="text-[10px] text-white/60">
            Pointez vers le QR code de l'étudiant
          </span>
        </div>

        {/* Manual Code Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Ou saisir le code de billet manuellement :
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Ex: CS-EVT-1-42-9B3F"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleValidateTicket();
                }}
                className="text-xs rounded-xl font-mono"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => handleValidateTicket()}
              disabled={isProcessing || !ticketInput.trim()}
              className="rounded-xl font-bold text-xs shrink-0"
            >
              {isProcessing ? "Validation..." : "Valider"}
            </Button>
          </div>
        </div>

        {/* Result Notification Banner */}
        {scanResult && (
          <div
            className={`p-4 rounded-2xl border text-xs font-medium space-y-1 animate-in fade-in duration-200 ${
              scanResult.status === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : scanResult.status === "already_scanned"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {scanResult.status === "success" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              {scanResult.status === "already_scanned" && (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              {scanResult.status === "error" && (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <span>
                {scanResult.status === "success"
                  ? "Entrée Validée"
                  : scanResult.status === "already_scanned"
                  ? "Billet Déjà Validé"
                  : "Erreur de validation"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">{scanResult.message}</p>
          </div>
        )}

        {/* Quick check-in from registered list */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <span className="text-xs font-bold text-muted-foreground block">
            Participants inscrits récents :
          </span>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {attendees.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-xs"
              >
                <span className="font-semibold text-foreground truncate">
                  {att.user.name || att.user.username}
                </span>

                {att.status === "attended" || att.isCheckedIn ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                    Présent
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidateTicket(att.ticketCode || String(att.user.id))}
                    className="h-6 text-[10px] rounded-lg"
                  >
                    Valider l'entrée
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full rounded-xl text-xs font-semibold"
        >
          Terminer le contrôle
        </Button>
      </DialogContent>
    </Dialog>
  );
}
