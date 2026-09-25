import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exportAttendeesCsv, checkInAttendee } from "@/services/eventService";
import { useToast } from "@/hooks/use-toast";
import { formatSlugToLabel } from "@/lib/utils";
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
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "going" | "attended">("all");
  const [isExporting, setIsExporting] = useState(false);

  // We consider registered / going attendees and checked-in attendees
  const attendedAttendees = attendees.filter((a) => a.status === "attended" || a.isCheckedIn);
  const goingAttendees = attendees.filter((a) => a.status === "going" && !a.isCheckedIn);

  const filterList = (list: EventAttendee[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (a) =>
        a.user.name?.toLowerCase().includes(q) ||
        a.user.username?.toLowerCase().includes(q) ||
        a.user.faculty?.toLowerCase().includes(q) ||
        a.user.university?.toLowerCase().includes(q)
    );
  };

  const displayedList =
    activeTab === "attended"
      ? filterList(attendedAttendees)
      : activeTab === "going"
      ? filterList(goingAttendees)
      : filterList(attendees.filter(a => a.status === "going" || a.status === "attended" || a.isCheckedIn));

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
        description: `Entrée validée pour ${attendee.user.name || attendee.user.username}.`,
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de valider la présence.",
        variant: "destructive",
      });
    }
  };

  const totalRegistered = attendees.filter(a => a.status === "going" || a.status === "attended" || a.isCheckedIn).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85vh] rounded-3xl p-5 sm:p-6 flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 space-y-1 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              <Users className="h-5 w-5 text-primary" />
              <span>Participants ({totalRegistered})</span>
            </DialogTitle>

            <div className="flex items-center gap-2">
              {isOrganizer && onOpenScanner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenScanner();
                  }}
                  className="rounded-xl text-xs font-semibold h-8"
                >
                  <QrCode className="h-3.5 w-3.5 mr-1 text-primary" />
                  Scanner
                </Button>
              )}

              {isOrganizer && (
                <Button
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground h-8"
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
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="all" className="text-xs">
                Tous ({totalRegistered})
              </TabsTrigger>
              <TabsTrigger value="going" className="text-xs flex items-center justify-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                <span className="truncate">Inscrits ({goingAttendees.length})</span>
              </TabsTrigger>
              <TabsTrigger value="attended" className="text-xs flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="truncate">Présents ({attendedAttendees.length})</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
              const isChecked = attendee.status === "attended" || attendee.isCheckedIn;
              const formattedFaculty = attendee.user.faculty
                ? formatSlugToLabel(attendee.user.faculty)
                : attendee.user.university || `@${attendee.user.username}`;

              return (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-border/50 bg-card hover:bg-accent/40 transition-colors"
                >
                  <Link
                    to={`/profile/${attendee.user.username}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <Avatar className="h-9 w-9 border border-border shrink-0">
                      <AvatarImage src={attendee.user.avatar || undefined} />
                      <AvatarFallback className="text-xs font-bold">
                        {attendee.user.name?.slice(0, 2).toUpperCase() || "US"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-foreground truncate">
                          {attendee.user.name || attendee.user.username}
                        </span>
                        {attendee.user.isVerified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {formattedFaculty}
                      </p>
                    </div>
                  </Link>

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
                          variant="secondary"
                          className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold"
                        >
                          Inscrit
                        </Badge>
                        {isOrganizer && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManualCheckIn(attendee)}
                            className="h-6 text-[10px] rounded-lg px-2"
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
