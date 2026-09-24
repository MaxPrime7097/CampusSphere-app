import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Sparkles,
  Plus,
  Compass,
  Users,
  Trophy,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { EventCard } from "@/components/events/EventCard";
import { EventFiltersBar } from "@/components/events/EventFiltersBar";
import { EventShareModal } from "@/components/events/EventShareModal";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvents } from "@/services/eventService";
import { useAuth } from "@/contexts/AuthContext";
import { openVerificationModal } from "@/lib/events";
import { getEventUrl } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Event, EventFilters, AttendeeStatus } from "@/types/events.types";

export function Events() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [filters, setFilters] = useState<EventFilters>({
    category: "all",
    search: "",
    timeframe: "all",
  });
  const [shareEvent, setShareEvent] = useState<Event | null>(null);

  // Fetch events via React Query
  const {
    data: rawEvents = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["events", filters],
    queryFn: () => getEvents(filters),
    staleTime: 60 * 1000,
  });

  // Filter events based on active tab
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return rawEvents.filter((event) => {
      const start = new Date(event.startDate);
      if (activeTab === "upcoming") {
        return start >= now;
      }
      if (activeTab === "past") {
        return start < now;
      }
      if (activeTab === "mine") {
        return (
          event.userStatus === "going" ||
          event.userStatus === "interested" ||
          event.organizer.id === currentUser?.id ||
          event.organizer.id === "current-user"
        );
      }
      return true; // 'all'
    });
  }, [rawEvents, activeTab, currentUser]);

  // Featured major event (1. Événement mis en avant, 2. Plus populaire, 3. Prochain à venir)
  const featuredEvent = useMemo(() => {
    if (!rawEvents || rawEvents.length === 0) return null;
    const now = new Date();
    const upcomingEvents = rawEvents.filter((e) => new Date(e.startDate) >= now);

    // 1. Événement marqué explicitement en vedette
    const explicitFeatured = upcomingEvents.find((e) => (e as any).isFeatured);
    if (explicitFeatured) return explicitFeatured;

    // 2. Événement avec le plus d'inscrits / engagement
    const sortedByPopularity = [...upcomingEvents].sort(
      (a, b) => (b.attendeesCount || 0) - (a.attendeesCount || 0)
    );
    if (sortedByPopularity[0] && (sortedByPopularity[0].attendeesCount || 0) > 0) {
      return sortedByPopularity[0];
    }

    // 3. Prochain événement chronologique
    return upcomingEvents[0] || null;
  }, [rawEvents]);

  const handleFilterChange = (newFilters: Partial<EventFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: "all",
      search: "",
      timeframe: "all",
    });
  };

  const handleStatusChange = (eventId: string | number, newStatus: AttendeeStatus | null) => {
    refetch();
  };

  const handleCreateClick = () => {
    if (currentUser && currentUser.is_verified === false) {
      toast({
        title: "Compte non certifié",
        description: "Vous devez certifier votre compte pour publier un événement.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            Vérifier
          </Button>
        ),
      });
      return;
    }
    navigate("/events/create");
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-6 animate-in fade-in duration-300">
      {/* ─── Top Header (Parfaitement aligné avec Sphères & Ressources) ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 campus-animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Événements Campus
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Découvrez les activités campus, compétitions académiques, hackathons et conférences
          </p>
        </div>

        <div className="flex w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          <Button
            size="sm"
            onClick={handleCreateClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-1 sm:flex-none font-semibold"
          >
            <Plus className="h-4 w-4" />
            <span>Créer</span>
          </Button>
        </div>
      </div>

      {/* ─── Featured Spotlight Banner (Épuré, SANS emoji) ─── */}
      {featuredEvent && activeTab !== "past" && (
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {featuredEvent.coverImage && (
              <div className="relative h-44 w-full lg:w-72 rounded-xl overflow-hidden shrink-0 bg-muted">
                <img
                  src={featuredEvent.coverImage}
                  alt={featuredEvent.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2.5 left-2.5">
                  <Badge className="bg-primary text-primary-foreground font-semibold text-[11px] flex items-center gap-1 shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    À la une
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary/30 text-xs font-medium">
                  {featuredEvent.category === "party"
                    ? "Soirée & Cérémonie"
                    : featuredEvent.category === "competition"
                    ? "Compétition"
                    : "Événement Campus"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(featuredEvent.startDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-foreground">
                {featuredEvent.title}
              </h2>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {featuredEvent.description?.replace(/[#*`_]/g, "")}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>{featuredEvent.attendeesCount} participants</span>
                </div>
                <div>•</div>
                <div className="font-medium text-foreground">
                  {featuredEvent.location}
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full lg:w-auto">
              <Button
                onClick={() => navigate(getEventUrl(featuredEvent))}
                className="w-full lg:w-auto rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
              >
                Découvrir l'événement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Standard Shared Tabs (Lignes de soulignement comme Sphères/Ressources) ─── */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-4"
      >
        <SharedTabsList containerClassName="mb-4">
          <SharedTabsTrigger value="upcoming">À venir</SharedTabsTrigger>
          <SharedTabsTrigger value="all">Tous les événements ({rawEvents.length})</SharedTabsTrigger>
          <SharedTabsTrigger value="mine">Mes inscriptions</SharedTabsTrigger>
          <SharedTabsTrigger value="past">Passés</SharedTabsTrigger>
        </SharedTabsList>

        {/* Filters Bar with Search & Category Pills */}
        <EventFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          totalCount={filteredEvents.length}
        />

        {/* ─── Events Grid & Loading / Empty states ─── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl border border-border/60 bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-14 text-center">
            <EmptyState
              icon={Calendar}
              title={
                activeTab === "mine"
                  ? "Aucune inscription"
                  : "Aucun événement trouvé"
              }
              description={
                activeTab === "mine"
                  ? "Vous ne participez à aucun événement pour le moment. Explorez la liste des événements à venir."
                  : "Aucun événement ne correspond à vos critères de recherche."
              }
              action={
                <Button
                  onClick={activeTab === "mine" ? () => setActiveTab("upcoming") : handleResetFilters}
                  className="mt-4 rounded-xl font-semibold bg-primary text-primary-foreground text-xs"
                >
                  {activeTab === "mine" ? "Explorer les événements" : "Réinitialiser les filtres"}
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onStatusChange={handleStatusChange}
                onShare={setShareEvent}
              />
            ))}
          </div>
        )}
      </Tabs>

      {/* Share Modal */}
      <EventShareModal
        open={Boolean(shareEvent)}
        onOpenChange={(open) => !open && setShareEvent(null)}
        event={shareEvent}
      />
    </div>
  );
}
