import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Check,
  ArrowLeft,
  Sparkles,
  Trophy,
  Code,
  Mic,
  BookOpen,
  Compass,
  AlertCircle,
  Ticket,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EventAttendeesModal } from "@/components/events/EventAttendeesModal";
import { EventShareModal } from "@/components/events/EventShareModal";
import { EventTicketModal } from "@/components/events/EventTicketModal";
import { EventScannerModal } from "@/components/events/EventScannerModal";
import { getEventCategoryMeta } from "@/constants/eventCategories";
import {
  getEventById,
  getEventAttendees,
  registerToEvent,
  unregisterFromEvent,
  deleteEvent,
  exportAttendeesCsv,
} from "@/services/eventService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AttendeeStatus, EventAttendee } from "@/types/events.types";

const CategoryIconMap: Record<string, any> = {
  party: Sparkles,
  competition: Trophy,
  hackathon: Code,
  conference: Mic,
  workshop: BookOpen,
  other: Compass,
};

function getUserDisplayName(user: any, fallback = "Utilisateur"): string {
  if (!user) return fallback;
  return (
    user.name ||
    user.full_name ||
    `${user.firstName || user.first_name || ""} ${user.lastName || user.last_name || ""}`.trim() ||
    user.username ||
    fallback
  );
}

function getUserInitial(user: any, fallback = "U"): string {
  const name = getUserDisplayName(user, fallback);
  return name.slice(0, 1).toUpperCase();
}

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Fetch Event details
  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch Attendees
  const { data: attendees = [] } = useQuery<EventAttendee[]>({
    queryKey: ["event-attendees", id],
    queryFn: () => getEventAttendees(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const confirmedAttendees = useMemo<EventAttendee[]>(() => {
    return (attendees as EventAttendee[]).filter(
      (a: EventAttendee) => a.status === "going" || a.status === "attended" || Boolean(a.isCheckedIn)
    );
  }, [attendees]);

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (status: AttendeeStatus) => registerToEvent(id!, status),
    onSuccess: (data, status) => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
      toast({
        title: status === "going" ? "Inscription confirmée" : "Marqué comme intéressé",
        description:
          status === "going"
            ? "Votre billet d'entrée est maintenant disponible."
            : "L'événement a été ajouté à votre liste d'intérêts.",
      });
      if (status === "going") {
        setIsTicketOpen(true);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Erreur d'inscription",
        description: err?.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    },
  });

  // Unregister mutation
  const unregisterMutation = useMutation({
    mutationFn: () => unregisterFromEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
      toast({
        title: "Désinscription effectuée",
        description: "Vous n'êtes plus inscrit à cet événement.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur de désinscription",
        description: err?.message || "Impossible d'annuler votre participation.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Événement supprimé",
        description: "L'événement a été retiré avec succès.",
      });
      navigate("/events");
    },
    onError: (err: any) => {
      toast({
        title: "Erreur de suppression",
        description: err?.message || "Impossible de supprimer cet événement.",
        variant: "destructive",
      });
    },
  });

  const handleExportAttendees = async () => {
    try {
      await exportAttendeesCsv(id!);
      toast({
        title: "Export réussi",
        description: "La liste des participants a été téléchargée.",
      });
    } catch {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter la liste des participants.",
        variant: "destructive",
      });
    }
  };

  const handleAttendeeUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["event", id] });
    queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
  };

  const isInitialLoading = isLoading && !event;

  if (isInitialLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6 animate-pulse">
        <div className="h-9 w-36 bg-muted rounded-xl" />
        <div className="h-64 sm:h-80 w-full bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-16 bg-muted rounded-xl" />
            <div className="h-40 bg-muted rounded-xl" />
          </div>
          <div className="h-80 bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Événement introuvable</h2>
        <p className="text-sm text-muted-foreground">
          Cet événement n'existe pas ou a été supprimé par son organisateur.
        </p>
        <Button onClick={() => navigate("/events")} className="rounded-xl mt-2">
          Retour aux événements
        </Button>
      </div>
    );
  }

  const isOrganizer = currentUser?.id === event.organizer.id;
  const userRegistration = attendees.find((a: EventAttendee) => a.user?.id === currentUser?.id);
  const isRegistered = Boolean(userRegistration);
  const isCheckedIn = Boolean(userRegistration?.isCheckedIn);

  const meta = getEventCategoryMeta(event.category);
  const IconComponent = CategoryIconMap[event.category] || Calendar;

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPast = startDate < new Date();

  // Progress capacity calculation
  const capacityPercent = event.maxAttendees
    ? Math.min(100, Math.round((event.attendeesCount / event.maxAttendees) * 100))
    : null;

  // Add to Google Calendar URL
  const gcalUrl = () => {
    const startIso = startDate.toISOString().replace(/-|:|.\d\d\d/g, "");
    const endIso = (endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000))
      .toISOString()
      .replace(/-|:|.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(
      event.location || ""
    )}&dates=${startIso}/${endIso}`;
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 space-y-6">
      {/* Back and actions header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/events")}
          className="rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground self-start gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux événements</span>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action: Ticket Modal (if registered) */}
          {isRegistered && (
            <Button
              size="sm"
              onClick={() => setIsTicketOpen(true)}
              className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground shadow-xs gap-1.5"
            >
              <Ticket className="h-3.5 w-3.5" />
              <span>Mon billet</span>
            </Button>
          )}

          {/* Action: Organizer Scanner */}
          {isOrganizer && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsScannerOpen(true)}
                className="rounded-xl text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <span>Scanner entrées</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportAttendees}
                className="rounded-xl text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <span>Exporter CSV</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/events/${event.id}/edit`)}
                className="rounded-xl text-xs font-medium gap-1.5"
              >
                <span>Modifier</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Voulez-vous vraiment supprimer cet événement ?")) {
                    deleteMutation.mutate();
                  }
                }}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <span>Supprimer</span>
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="rounded-xl text-xs font-medium gap-1.5"
          >
            <span>Partager</span>
          </Button>
        </div>
      </div>

      {/* Hero Banner Cover */}
      <div className="relative w-full overflow-hidden rounded-none sm:rounded-2xl border border-border/40 bg-muted aspect-[21/9] min-h-[220px] max-h-[380px] shadow-xs">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${meta.gradient} opacity-90 flex items-center justify-center`}>
            <IconComponent className="h-20 w-20 text-white/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

        {/* Category & Status Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Badge
            className="bg-background/90 text-foreground border border-border/40 backdrop-blur-md px-3 py-1 text-xs font-semibold shadow-xs"
          >
            {meta.label}
          </Badge>

          {event.isOnline && (
            <Badge className="bg-background/80 text-foreground border border-border/40 font-semibold text-xs backdrop-blur-md px-3 py-1">
              En ligne
            </Badge>
          )}
        </div>

        {/* Title & Date on Cover bottom */}
        <div className="absolute bottom-5 left-5 right-5 text-white space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-white/90 flex-wrap">
            <span className="capitalize">
              {startDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <span>•</span>
            <span>
              {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {endDate &&
                ` - ${endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Main Grid: Content (Left) & Actions/Logistics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left column: Continuous fluid flow without cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organizer Row */}
          <div className="flex items-center justify-between pb-6 border-b border-border/30">
            <Link
              to={`/profile/${event.organizer.username}`}
              className="flex items-center gap-3 hover:opacity-85 transition-opacity min-w-0"
            >
              <Avatar className="h-11 w-11 border border-border/60 shrink-0">
                <AvatarImage src={event.organizer.avatar || undefined} />
                <AvatarFallback className="font-semibold text-xs bg-muted text-muted-foreground">
                  {getUserInitial(event.organizer, "O")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground text-sm truncate">
                    {getUserDisplayName(event.organizer, "Organisateur")}
                  </span>
                  {event.organizer.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-amber-500 fill-amber-500/20 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Organisateur • {event.organizer.faculty || event.organizer.university || "Membre CampusSphere"}
                </p>
              </div>
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/profile/${event.organizer.username}`)}
              className="rounded-lg text-xs font-medium shrink-0"
            >
              Voir le profil
            </Button>
          </div>

          {/* Description Section */}
          <div className="pb-6 border-b border-border/30 space-y-3">
            <h2 className="text-base font-bold text-foreground">
              À propos de cet événement
            </h2>

            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line space-y-3 font-normal">
              {event.description || "Aucune description fournie pour cet événement."}
            </div>
          </div>

          {/* Associated Sphere Widget (if linked) */}
          {event.sphere && (
            <div className="pb-6 border-b border-border/30">
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/30 bg-muted/20">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 border border-border/40 shrink-0">
                    <AvatarImage src={event.sphere.avatar || undefined} />
                    <AvatarFallback className="font-semibold text-xs bg-muted text-muted-foreground">
                      {event.sphere.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Sphère organisatrice
                    </span>
                    <h3 className="text-sm font-semibold text-foreground truncate">{event.sphere.name}</h3>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/spheres/${event.sphereId || event.sphere?.id}`)}
                  className="rounded-lg text-xs font-medium shrink-0"
                >
                  Visiter la sphère
                </Button>
              </div>
            </div>
          )}

          {/* Attendees Preview Section */}
          <div className="pb-6 border-b border-border/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                Participants ({event.attendeesCount || confirmedAttendees.length})
              </h3>
              {confirmedAttendees.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAttendeesOpen(true)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Voir tout
                </button>
              )}
            </div>

            {confirmedAttendees.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {confirmedAttendees.slice(0, 8).map((att: EventAttendee) => {
                  const attName = getUserDisplayName(att.user, "Participant");
                  const initial = getUserInitial(att.user, "P");
                  const profileUrl = att.user?.username ? `/profile/${att.user.username}` : "#";

                  return (
                    <Link
                      key={att.id}
                      to={profileUrl}
                      className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-muted/40 hover:bg-muted border border-border/50 text-xs font-medium text-foreground transition-colors group max-w-[220px]"
                      title={attName}
                    >
                      <Avatar className="h-6 w-6 border border-border/50 shrink-0">
                        <AvatarImage src={att.user?.avatar || undefined} alt={attName} />
                        <AvatarFallback className="text-[10px] font-semibold bg-muted text-muted-foreground">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate group-hover:underline">{attName}</span>
                    </Link>
                  );
                })}

                {confirmedAttendees.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setIsAttendeesOpen(true)}
                    className="inline-flex items-center px-3 py-1 rounded-full bg-muted/20 hover:bg-muted border border-border/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    +{confirmedAttendees.length - 8} autre{confirmedAttendees.length - 8 > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Soyez le premier à vous inscrire !</p>
            )}
          </div>
        </div>

        {/* Right column: Sticky RSVP & Info Sidebar */}
        <div className="space-y-6">
          <div className="sticky top-20 p-5 rounded-2xl border border-border/40 bg-card shadow-xs space-y-5">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Statut de participation
              </span>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-foreground">
                    {event.attendeesCount}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {event.attendeesCount > 1 ? "inscrits" : "inscrit"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAttendeesOpen(true)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Voir la liste
                </button>
              </div>

              {/* Capacity Progress Bar */}
              {event.maxAttendees && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                    <span>Places restantes</span>
                    <span>
                      {Math.max(0, event.maxAttendees - event.attendeesCount)} sur {event.maxAttendees}
                    </span>
                  </div>
                  <Progress value={capacityPercent || 0} className="h-1.5 rounded-full" />
                </div>
              )}
            </div>

            {/* Registration Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              {isPast ? (
                <Button disabled className="w-full rounded-xl text-xs" variant="outline">
                  Événement terminé
                </Button>
              ) : isRegistered ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{isCheckedIn ? "Présence validée au check-in" : "Vous participez à cet événement"}</span>
                  </div>

                  {event.hasTicketing !== false && (
                    <Button
                      onClick={() => setIsTicketOpen(true)}
                      className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all py-5 text-xs gap-1.5"
                    >
                      <Ticket className="h-4 w-4" />
                      <span>Afficher mon billet & QR Code</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unregisterMutation.mutate()}
                    disabled={unregisterMutation.isPending}
                    className="w-full rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    Annuler ma participation
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => registerMutation.mutate("going")}
                    disabled={registerMutation.isPending}
                    className="w-full rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-all py-5 text-sm gap-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>
                      {registerMutation.isPending
                        ? "Inscription en cours..."
                        : event.hasTicketing !== false
                        ? "Obtenir mon billet"
                        : "Je participe"}
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* Event Logistics & Time/Location */}
            <div className="space-y-3 pt-4 border-t border-border/40 text-xs text-muted-foreground">
              {/* Date & Time */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">
                  Date & heure
                </span>
                <span className="font-medium text-foreground block capitalize">
                  {startDate.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {endDate &&
                    ` - ${endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                </span>
                <div>
                  <a
                    href={gcalUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline mt-0.5"
                  >
                    Ajouter à Google Agenda
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-0.5 pt-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 block">
                  {event.isOnline ? "En ligne" : "Lieu"}
                </span>
                <span className="font-medium text-foreground block truncate">
                  {event.location || (event.isOnline ? "Visioconférence" : "Campus")}
                </span>

                {event.isOnline && event.onlineLink && (
                  <div className="pt-1.5">
                    <Button
                      size="sm"
                      asChild
                      variant="outline"
                      className="rounded-lg text-xs font-medium"
                    >
                      <a href={event.onlineLink} target="_blank" rel="noopener noreferrer">
                        Rejoindre la réunion
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendees Modal */}
      <EventAttendeesModal
        open={isAttendeesOpen}
        onOpenChange={setIsAttendeesOpen}
        attendees={attendees}
        eventTitle={event.title}
        eventId={event.id}
        isOrganizer={isOrganizer}
        onOpenScanner={() => setIsScannerOpen(true)}
        onAttendeeUpdated={handleAttendeeUpdated}
      />

      {/* Ticket Modal */}
      <EventTicketModal
        open={isTicketOpen}
        onOpenChange={setIsTicketOpen}
        event={event}
      />

      {/* Scanner Check-in Modal */}
      <EventScannerModal
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        event={event}
        attendees={attendees}
        onCheckInSuccess={handleAttendeeUpdated}
      />

      {/* Share Modal */}
      <EventShareModal
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        event={event}
      />
    </div>
  );
}
