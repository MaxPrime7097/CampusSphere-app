import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Search, Check, Heart, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { EventAttendee } from "@/types/events.types";

interface EventAttendeesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendees: EventAttendee[];
  eventTitle: string;
  isOrganizer?: boolean;
}

export function EventAttendeesModal({
  open,
  onOpenChange,
  attendees,
  eventTitle,
  isOrganizer = false,
}: EventAttendeesModalProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "going" | "interested">("all");

  const goingAttendees = attendees.filter((a) => a.status === "going" || a.status === "attended");
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
    activeTab === "going"
      ? filterList(goingAttendees)
      : activeTab === "interested"
      ? filterList(interestedAttendees)
      : filterList(attendees);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-5 w-5 text-primary" />
            <span>Participants à l'événement</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{eventTitle}</p>
        </DialogHeader>

        {/* Tabs & Search */}
        <div className="mt-4 space-y-3">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                Tous ({attendees.length})
              </TabsTrigger>
              <TabsTrigger value="going" className="text-xs flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-500" />
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
              placeholder="Rechercher un participant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl h-9"
            />
          </div>
        </div>

        {/* List */}
        <div className="mt-2 max-h-80 overflow-y-auto space-y-2 pr-1">
          {displayedList.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Aucun participant trouvé.
            </div>
          ) : (
            displayedList.map((attendee) => (
              <div
                key={attendee.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-colors"
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

                <div className="shrink-0">
                  {attendee.status === "going" || attendee.status === "attended" ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-semibold"
                    >
                      Participe
                    </Badge>
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
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
