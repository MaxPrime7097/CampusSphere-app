import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  Check,
  Heart,
  Share2,
  Edit,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Trophy,
  Code,
  Mic,
  BookOpen,
  Compass,
  CalendarPlus,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EventAttendeesModal } from "@/components/events/EventAttendeesModal";
import { EventShareModal } from "@/components/events/EventShareModal";
import { getEventCategoryMeta } from "@/constants/eventCategories";
import {
  getEventById,
  getEventAttendees,
  registerToEvent,
  unregisterFromEvent,
  deleteEvent,
} from "@/services/eventService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AttendeeStatus } from "@/types/events.types";

const CategoryIconMap: Record<string, any> = {
  party: Sparkles,
  competition: Trophy,
  hackathon: Code,
  conference: Mic,
  workshop: BookOpen,
  other: Compass,
};

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Fetch Event details
  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id!),
    enabled: Boolean(id),
  });

  // Fetch Attendees
  const { data: attendees = [] } = useQuery({
    queryKey: ["event-attendees", id],
    queryFn: () => getEventAttendees(id!),
    enabled: Boolean(id),
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (status: AttendeeStatus) => registerToEvent(id!, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", id] });
      toast({
        title: status === "going" ? "Inscription confirmée ! 🎉" : "Marqué comme intéressé",
        description:
          status === "going"
            ? "Vous recevrez les rappels pour cet événement."
            : "L'événement a été ajouté à votre liste d'intérêts.",
      });
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
        description: "Vous ne participez plus à cet événement.",
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
        description: "L'événement a bien été supprimé.",
      });
      navigate("/events");
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6 animate-pulse">
        <div className="h-80 w-full rounded-3xl bg-muted/60" />
        <div className="h-10 w-2/3 rounded-xl bg-muted/50" />
        <div className="h-40 w-full rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Événement introuvable</h2>
        <p className="text-xs text-muted-foreground">
          Cet événement n'existe pas ou a été supprimé par son organisateur.
        </p>
        <Button onClick={() => navigate("/events")} className="rounded-xl font-semibold">
          Retour aux événements
        </Button>
      </div>
    );
  }

  const isOrganizer =
    event.organizer.id === currentUser?.id ||
    event.organizer.id === "current-user" ||
    event.organizer.username === currentUser?.username;

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
    const startIso = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = (endDate || new Date(startDate.getTime() + 2 * 60 * 60 * 1000))
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      event.title
    )}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(
      event.location || ""
    )}&dates=${startIso}/${endIso}`;
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8 space-y-8 animate-in fade-in duration-300">
      {/* Back and actions header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/events")}
          className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour aux événements
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="rounded-xl text-xs font-semibold"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Partager
          </Button>

          {isOrganizer && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/events/${event.id}/edit`)}
                className="rounded-xl text-xs font-semibold"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
                    deleteMutation.mutate();
                  }
                }}
                className="rounded-xl text-xs font-semibold"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Supprimer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hero Banner Cover */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-lg">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${meta.gradient} opacity-90 flex items-center justify-center`}>
            <IconComponent className="h-28 w-28 text-white/30" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Category & Status Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-3 py-1 text-xs font-bold shadow-md"
          >
            <IconComponent className="h-3.5 w-3.5 text-primary" />
            <span>{meta.label}</span>
          </Badge>

          {event.isOnline && (
            <Badge className="bg-blue-600/90 text-white font-bold text-xs backdrop-blur-md">
              <Globe className="h-3.5 w-3.5 mr-1" /> En ligne
            </Badge>
          )}
        </div>

        {/* Title & Date on Cover bottom */}
        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-300">
            <Calendar className="h-4 w-4" />
            <span className="capitalize">
              {startDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>
              {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {endDate &&
                ` - ${endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Main Grid: Content (Left) & Actions/Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Description, Agenda, Sphere */}
        <div className="lg:col-span-2 space-y-8">
          {/* Organizer Card */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
            <Link
              to={`/profile/${event.organizer.username}`}
              className="flex items-center gap-3.5 hover:opacity-90 transition-opacity"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src={event.organizer.avatar || undefined} />
                <AvatarFallback className="font-bold text-sm">
                  {event.organizer.name?.slice(0, 2).toUpperCase() || "EV"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground text-sm">
                    {event.organizer.name || event.organizer.username}
                  </span>
                  {event.organizer.isVerified && (
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Organisateur • {event.organizer.faculty || event.organizer.university || "Membre CampusSphere"}
                </p>
              </div>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/profile/${event.organizer.username}`)}
              className="rounded-xl text-xs font-semibold"
            >
              Voir le profil
            </Button>
          </div>

          {/* Description Block */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              À propos de cet événement
            </h2>

            <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line space-y-3">
              {event.description || "Aucune description détaillée fournie."}
            </div>
          </div>

          {/* Associated Sphere Widget (if linked) */}
          {event.sphere && (
            <div className="p-6 rounded-3xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-primary/30">
                    <AvatarImage src={event.sphere.avatar || undefined} />
                    <AvatarFallback className="font-bold text-xs bg-primary/20 text-primary">
                      {event.sphere.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                      Sphère organisatrice
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{event.sphere.name}</h3>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => navigate(`/spheres/${event.sphereId || event.sphere?.id}`)}
                  className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
                >
                  Visiter la sphère
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Sticky RSVP & Info Sidebar */}
        <div className="space-y-6">
          {/* RSVP Card */}
          <div className="sticky top-20 p-6 rounded-3xl border border-border/80 bg-card shadow-md space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Statut de participation
              </span>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-xl font-extrabold text-foreground">
                    {event.attendeesCount}
                  </span>
                  <span className="text-xs text-muted-foreground">participants inscrits</span>
                </div>

                <button
                  onClick={() => setIsAttendeesOpen(true)}
                  className="text-xs font-bold text-primary hover:underline"
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
                  <Progress value={capacityPercent || 0} className="h-2 rounded-full" />
                </div>
              )}
            </div>

            {/* Registration Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              {isPast ? (
                <Button disabled className="w-full rounded-xl text-xs" variant="outline">
                  Événement terminé
                </Button>
              ) : event.userStatus === "going" ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Vous participez à cet événement !
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unregisterMutation.mutate()}
                    disabled={unregisterMutation.isPending}
                    className="w-full rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    Annuler ma participation
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => registerMutation.mutate("going")}
                    disabled={registerMutation.isPending}
                    className="w-full rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all py-5"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {registerMutation.isPending ? "Inscription..." : "Je participe"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => registerMutation.mutate("interested")}
                    disabled={registerMutation.isPending}
                    className="w-full rounded-2xl font-semibold text-xs py-4"
                  >
                    <Heart className="h-4 w-4 mr-2 text-amber-500" />
                    {event.userStatus === "interested" ? "Intéressé ✓" : "Ça m'intéresse"}
                  </Button>
                </div>
              )}
            </div>

            {/* Event Logistics & Time/Location */}
            <div className="space-y-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
              {/* Date & Add to Calendar */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-muted text-foreground shrink-0">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-foreground block capitalize">
                    {startDate.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span>
                    {startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    {endDate &&
                      ` - ${endDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                  </span>
                  <div>
                    <a
                      href={gcalUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1"
                    >
                      <CalendarPlus className="h-3 w-3" />
                      Ajouter à Google Calendar
                    </a>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-muted text-foreground shrink-0">
                  {event.isOnline ? (
                    <Globe className="h-4 w-4 text-blue-500" />
                  ) : (
                    <MapPin className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-foreground block">
                    {event.isOnline ? "Événement en ligne" : "Lieu physique"}
                  </span>
                  <span>{event.location || "Campus IUC Douala"}</span>

                  {event.isOnline && event.onlineLink && (
                    <div className="pt-1">
                      <Button
                        size="sm"
                        asChild
                        className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      >
                        <a href={event.onlineLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
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
      </div>

      {/* Attendees Modal */}
      <EventAttendeesModal
        open={isAttendeesOpen}
        onOpenChange={setIsAttendeesOpen}
        attendees={attendees}
        eventTitle={event.title}
        isOrganizer={isOrganizer}
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
