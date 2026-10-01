import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Sparkle as Sparkles, Plus, Compass, UsersThree as Users, Trophy, ArrowClockwise as RefreshCw, MagnifyingGlass as Search, Funnel as Filter, GridFour as LayoutGrid, List, MapPin, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { EventCard } from "@/components/events/EventCard";
import { EventTile } from "@/components/events/EventTile";
import { EventCarousel } from "@/components/events/EventCarousel";
import { EventFiltersBar } from "@/components/events/EventFiltersBar";
import { getEventCategoryMeta } from "@/constants/eventCategories";
import { EventShareModal } from "@/components/events/EventShareModal";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvents } from "@/services/eventService";
import { useAuth } from "@/contexts/AuthContext";
import { openVerificationModal } from "@/lib/events";
import { getEventUrl, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Event, EventFilters, AttendeeStatus } from "@/types/events.types";

export function Events() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const isInitialLoading = isLoading && rawEvents.length === 0;

  // Upcoming events for horizontal Spotify-style carousel
  const upcomingCarouselEvents = useMemo(() => {
    const now = new Date();
    return rawEvents.filter((e) => new Date(e.startDate) >= now);
  }, [rawEvents]);

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
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

      {/* ─── Spotlight Event Banner (Pleine largeur, minimaliste & moderne) ─── */}
      {featuredEvent && activeTab !== "past" && !filters.search && filters.category === "all" && (
        <div
          onClick={() => navigate(getEventUrl(featuredEvent))}
          className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-5 sm:p-6 shadow-xs hover:border-border transition-all cursor-pointer mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Date Box / Cover Image */}
              {featuredEvent.coverImage ? (
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl overflow-hidden shrink-0 bg-muted border border-border/40">
                  <img
                    src={featuredEvent.coverImage}
                    alt={featuredEvent.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="bg-background/90 backdrop-blur-md text-foreground font-semibold text-[10px] px-1.5 py-0.5 border border-border/40 shadow-xs">
                      À la une
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-muted/80 border border-border/50 shrink-0">
                  <span className="text-xl sm:text-2xl font-bold text-foreground leading-none">
                    {new Date(featuredEvent.startDate).getDate()}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase leading-none mt-1">
                    {new Date(featuredEvent.startDate).toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Event Content */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[11px] font-medium text-foreground bg-muted/40 border-border/60">
                    {getEventCategoryMeta(featuredEvent.category).label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(featuredEvent.startDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })} · {new Date(featuredEvent.startDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground leading-snug group-hover:underline">
                  {featuredEvent.title}
                </h2>

                {featuredEvent.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed max-w-3xl">
                    {featuredEvent.description.replace(/[#*`_]/g, "")}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{featuredEvent.attendeesCount || 0} participant{Number(featuredEvent.attendeesCount || 0) > 1 ? "s" : ""}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{featuredEvent.isOnline ? "En ligne" : (featuredEvent.location || "Campus")}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Action */}
            <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0">
              <Button
                size="sm"
                className="w-full md:w-auto font-medium text-xs rounded-xl"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(getEventUrl(featuredEvent));
                }}
              >
                Découvrir l'événement
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Standard Shared Tabs ─── */}
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

        {/* View Mode Switcher Toolbar */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <span className="text-xs text-muted-foreground font-medium">
            {filteredEvents.length} {filteredEvents.length > 1 ? "événements trouvés" : "événement trouvé"}
          </span>
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2.5 rounded-md text-xs gap-1.5 transition-all",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grille</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2.5 rounded-md text-xs gap-1.5 transition-all",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Liste</span>
            </Button>
          </div>
        </div>

        {/* ─── Events Grid / List & Loading / Empty states ─── */}
        {isInitialLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2.5 animate-pulse">
                  <div className="aspect-[16/10] w-full rounded-2xl bg-muted/60" />
                  <div className="space-y-1.5 pt-1">
                    <div className="h-4 w-3/4 bg-muted/60 rounded" />
                    <div className="h-3 w-1/2 bg-muted/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 border-b border-border/40 py-3.5 px-3 flex items-center gap-4 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted/60 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-muted/60 rounded" />
                    <div className="h-3 w-1/4 bg-muted/60 rounded" />
                  </div>
                  <div className="w-20 h-8 rounded-lg bg-muted/60 shrink-0" />
                </div>
              ))}
            </div>
          )
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
                  className="mt-4 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 text-xs"
                >
                  {activeTab === "mine" ? "Explorer les événements" : "Réinitialiser les filtres"}
                </Button>
              }
            />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
            {filteredEvents.map((event) => (
              <EventTile
                key={event.id}
                event={event}
                onStatusChange={handleStatusChange}
                onShare={setShareEvent}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col pt-2">
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
