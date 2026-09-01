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
  CheckCircle2,
  Bookmark,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/events/EventCard";
import { EventFiltersBar } from "@/components/events/EventFiltersBar";
import { EventShareModal } from "@/components/events/EventShareModal";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvents } from "@/services/eventService";
import { useAuth } from "@/contexts/AuthContext";
import type { Event, EventFilters, AttendeeStatus } from "@/types/events.types";

export function Events() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "mine" | "past">("upcoming");
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

  // Featured major event (e.g. Welcome Ceremony or MathScam)
  const featuredEvent = useMemo(() => {
    return rawEvents.find(
      (e) => e.category === "party" || e.category === "competition"
    ) || rawEvents[0];
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
    // Soft update in cache if needed
    refetch();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 space-y-8 animate-in fade-in duration-300">
      {/* ─── Hero Section ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/95 via-orange-600/90 to-amber-600 p-6 md:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Vie Universitaire & Campus</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-automata leading-tight">
              Événements du Campus
            </h1>
            <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-xl">
              Découvrez les soirées d'intégration, hackathons, le MathScam et les conférences organisées par vos clubs et sphères étudiantes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              onClick={() => navigate("/events/create")}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer un événement
            </Button>
          </div>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
      </div>

      {/* ─── Featured Spotlight Banner (si disponible) ─── */}
      {featuredEvent && activeTab !== "past" && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 md:p-6 shadow-sm hover:border-primary/40 transition-all">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {featuredEvent.coverImage && (
              <div className="relative h-48 w-full lg:w-80 rounded-xl overflow-hidden shrink-0">
                <img
                  src={featuredEvent.coverImage}
                  alt={featuredEvent.title}
                  className="h-full w-full object-cover"
                />
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground font-bold text-[11px]">
                  ⭐ À la une
                </Badge>
              </div>
            )}

            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary/30 text-xs font-semibold">
                  {featuredEvent.category === "party" ? "🎉 Welcome Week" : "🏆 Compétition Campus"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(featuredEvent.startDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {featuredEvent.title}
              </h2>

              <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {featuredEvent.description?.replace(/[#*`_]/g, "")}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{featuredEvent.attendeesCount} participants inscrits</span>
                </div>
                <div>•</div>
                <div className="font-medium text-foreground">
                  {featuredEvent.location}
                </div>
              </div>
            </div>

            <div className="shrink-0 w-full lg:w-auto">
              <Button
                onClick={() => navigate(`/events/${featuredEvent.id}`)}
                className="w-full lg:w-auto rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Découvrir l'événement
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tabs & Filters Section ─── */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border pb-2">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 md:flex bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="upcoming" className="text-xs font-semibold rounded-lg">
                À venir
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs font-semibold rounded-lg">
                Tous ({rawEvents.length})
              </TabsTrigger>
              <TabsTrigger value="mine" className="text-xs font-semibold rounded-lg">
                Mes événements
              </TabsTrigger>
              <TabsTrigger value="past" className="text-xs font-semibold rounded-lg">
                Passés
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="hidden md:flex text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* Filter Bar with Search & Category Pills */}
        <EventFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          totalCount={filteredEvents.length}
        />
      </div>

      {/* ─── Events Grid / Empty States ─── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl border border-border/60 bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-16 text-center">
          <EmptyState
            icon={Calendar}
            title={
              activeTab === "mine"
                ? "Aucun événement dans vos participations"
                : "Aucun événement trouvé"
            }
            description={
              activeTab === "mine"
                ? "Vous ne participez à aucun événement pour le moment. Explorez les événements à venir et inscrivez-vous !"
                : "Aucun événement ne correspond à vos filtres actuels. Essayez d'autres critères de recherche."
            }
            action={
              <Button
                onClick={activeTab === "mine" ? () => setActiveTab("upcoming") : handleResetFilters}
                className="mt-4 rounded-xl font-semibold bg-primary text-primary-foreground"
              >
                {activeTab === "mine" ? "Explorer les événements" : "Réinitialiser les filtres"}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Share Modal */}
      <EventShareModal
        open={Boolean(shareEvent)}
        onOpenChange={(open) => !open && setShareEvent(null)}
        event={shareEvent}
      />
    </div>
  );
}
