import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Check,
  ShieldCheck,
  Download,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { exportAttendeesCsv, checkInAttendee } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import { formatSlugToLabel, cn } from "@/lib/utils";
import type { EventAttendee } from "@/types/events.types";

interface EventAttendeesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendees: EventAttendee[];
  eventTitle: string;
  eventId?: string | number;
  isOrganizer?: boolean;
  onOpenScanner?: () => void;
  onAttendeeUpdated?: (updated: EventAttendee) => void;
}

function getAttendeeName(user: any, fallback = "Participant"): string {
  if (!user) return fallback;
  return (
    user.name ||
    user.full_name ||
    `${user.firstName || user.first_name || ""} ${user.lastName || user.last_name || ""}`.trim() ||
    user.username ||
    fallback
  );
}

export function EventAttendeesModal({
  open,
  onOpenChange,
  attendees,
  eventTitle,
  eventId,
  isOrganizer = false,
  onOpenScanner,
  onAttendeeUpdated,
}: EventAttendeesModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "going" | "attended">("all");
  const [isExporting, setIsExporting] = useState(false);

  // We consider registered / going attendees and checked-in attendees
  const attendedAttendees = attendees.filter((a) => a.status === "attended" || Boolean(a.isCheckedIn));
  const goingAttendees = attendees.filter((a) => a.status === "going" && !a.isCheckedIn);

  const filterList = (list: EventAttendee[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((a) => {
      const name = getAttendeeName(a.user, "").toLowerCase();
      const username = (a.user?.username || "").toLowerCase();
      const faculty = (a.user?.faculty || "").toLowerCase();
      const university = (a.user?.university || "").toLowerCase();
      return (
        name.includes(q) ||
        username.includes(q) ||
        faculty.includes(q) ||
        university.includes(q)
      );
    });
  };

  const displayedList =
    activeTab === "attended"
      ? filterList(attendedAttendees)
      : activeTab === "going"
      ? filterList(goingAttendees)
      : filterList(attendees.filter(a => a.status === "going" || a.status === "attended" || Boolean(a.isCheckedIn)));

  const handleAttendeeClick = (e: React.MouseEvent, username?: string) => {
    e.preventDefault();
    if (!username) return;
    onOpenChange(false);
    setTimeout(() => {
      navigate(`/profile/${username}`);
    }, 100);
  };

  const handleOpenScanner = () => {
    onOpenChange(false);
    setTimeout(() => {
      onOpenScanner?.();
    }, 100);
  };

  const handleExportCsv = async () => {
    if (!eventId) return;
    try {
      setIsExporting(true);
      await exportAttendeesCsv(eventId, eventTitle);
      toast({
        title: "Export réussi",
        description: "Le fichier CSV des participants a été téléchargé.",
      });
    } catch {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter la liste des participants.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleManualCheckIn = async (attendee: EventAttendee) => {
    if (!eventId) return;
    try {
      const res = await checkInAttendee(eventId, attendee.ticketCode || attendee.user.id);
      onAttendeeUpdated?.(res.attendee);
      toast({
        title: "Présence validée",
        description: `Entrée validée pour ${getAttendeeName(attendee.user)}.`,
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de valider la présence.",
        variant: "destructive",
      });
    }
  };

  const totalRegistered = attendees.filter(a => a.status === "going" || a.status === "attended" || Boolean(a.isCheckedIn)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85vh] rounded-3xl p-5 sm:p-6 flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 space-y-1 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>Participants ({totalRegistered})</span>
            </DialogTitle>

            <div className="flex items-center gap-2">
              {isOrganizer && onOpenScanner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenScanner}
                  className="rounded-xl text-xs font-semibold h-8"
                >
                  <QrCode className="h-3.5 w-3.5 mr-1" />
                  Scanner
                </Button>
              )}

              {isOrganizer && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  className="rounded-xl text-xs font-semibold h-8"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  {isExporting ? "Export..." : "CSV"}
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">{eventTitle}</p>
        </DialogHeader>

        {/* Tabs & Search */}
        <div className="space-y-3 shrink-0">
          {/* Segmented Control Navigation */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-muted/60 border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all text-xs cursor-pointer",
                activeTab === "all"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>Tous</span>
              <span className="text-[11px] opacity-70">({totalRegistered})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("going")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all text-xs cursor-pointer",
                activeTab === "going"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Check className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate">Inscrits</span>
              <span className="text-[11px] opacity-70">({goingAttendees.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("attended")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-medium transition-all text-xs cursor-pointer",
                activeTab === "attended"
                  ? "bg-background text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="truncate">Présents</span>
              <span className="text-[11px] opacity-70">({attendedAttendees.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, promo ou filière..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl h-9"
            />
          </div>
        </div>

        {/* Attendees List (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px] mt-2">
          {displayedList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Aucun participant dans cette liste.
            </div>
          ) : (
            displayedList.map((attendee) => {
              const isChecked = attendee.status === "attended" || Boolean(attendee.isCheckedIn);
              const attName = getAttendeeName(attendee.user);
              const initial = attName.slice(0, 1).toUpperCase();
              const formattedFaculty = attendee.user?.faculty
                ? formatSlugToLabel(attendee.user.faculty)
                : attendee.user?.university || (attendee.user?.username ? `@${attendee.user.username}` : "");

              return (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/50 bg-card hover:bg-muted/40 transition-colors"
                >
                  <div
                    onClick={(e) => handleAttendeeClick(e, attendee.user?.username)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleAttendeeClick(e as any, attendee.user?.username);
                      }
                    }}
                  >
                    <Avatar className="h-9 w-9 border border-border/60 shrink-0">
                      <AvatarImage src={attendee.user?.avatar || undefined} alt={attName} />
                      <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate group-hover:underline">
                          {attName}
                        </span>
                        {attendee.user?.isVerified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {formattedFaculty}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isChecked ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Présent
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium text-muted-foreground border-border/50 bg-muted/40"
                        >
                          Inscrit
                        </Badge>
                        {isOrganizer && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManualCheckIn(attendee)}
                            className="h-6 text-[10px] rounded-lg px-2 text-muted-foreground hover:text-foreground"
                          >
                            Valider
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
