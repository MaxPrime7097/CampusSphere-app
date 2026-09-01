import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  Check,
  Heart,
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
  const [activeTab, setActiveTab] = useState<"all" | "going" | "attended" | "interested">("all");
  const [isExporting, setIsExporting] = useState(false);

  const attendedAttendees = attendees.filter((a) => a.status === "attended" || a.isCheckedIn);
  const goingAttendees = attendees.filter((a) => a.status === "going");
  const interestedAttendees = attendees.filter((a) => a.status === "interested");

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
      : activeTab === "interested"
      ? filterList(interestedAttendees)
      : filterList(attendees);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl p-6 space-y-4">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Users className="h-5 w-5 text-primary" />
              <span>Participants ({attendees.length})</span>
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
                  className="rounded-xl text-xs font-semibold"
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
                  className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  {isExporting ? "Export..." : "Exporter CSV"}
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground truncate">{eventTitle}</p>
        </DialogHeader>

        {/* Tabs & Search */}
        <div className="space-y-3">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">
                Tous ({attendees.length})
              </TabsTrigger>
              <TabsTrigger value="attended" className="text-xs flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Présents ({attendedAttendees.length})
              </TabsTrigger>
              <TabsTrigger value="going" className="text-xs flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Inscrits ({goingAttendees.length})
              </TabsTrigger>
              <TabsTrigger value="interested" className="text-xs flex items-center gap-1">
                <Heart className="h-3 w-3 text-amber-500" />
                Intéressés ({interestedAttendees.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, username ou filière..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl h-9"
            />
          </div>
        </div>

        {/* Attendees List */}
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {displayedList.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Aucun participant dans cette vue.
            </div>
          ) : (
            displayedList.map((attendee) => {
              const isChecked = attendee.status === "attended" || attendee.isCheckedIn;

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
                    <Avatar className="h-9 w-9 border border-border">
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
                        {attendee.user.faculty || attendee.user.university || `@${attendee.user.username}`}
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
                    ) : attendee.status === "going" ? (
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
                            className="h-6 text-[10px] rounded-lg"
                          >
                            Valider
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] font-semibold"
                      >
                        Intéressé
                      </Badge>
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
