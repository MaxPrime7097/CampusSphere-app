import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchUsers,
  getUserConnections,
  createConnection,
  disconnectFromUser,
  getMutualConnectionCounts,
  acceptConnection,
  createPrivateConversation,
} from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { normalizeFaculty, normalizeUniversity } from "@/lib/profileMetadata";
import { useTranslation } from "react-i18next";
import {
  ConnectionsHeader,
  ConnectionsFilterBar,
  ConnectionsFilteredResults,
  ConnectionsViewAllSection,
  ConnectionsDashboardSections,
  type ConnectionFilter,
  type ConnectionUser,
} from "@/components/connections";

export function Connections() {
  const { t } = useTranslation("connections");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [connections, setConnections] = useState<ConnectionUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionUser[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAllSection, setViewAllSection] = useState<string | null>(null);
  const [mutualCountStatus, setMutualCountStatus] = useState<string | null>(null);

  const suggestionsQuery = useQuery({
    queryKey: ["connections", "suggestions", currentUser?.id || "anon"],
    queryFn: () => searchUsers(""),
    enabled: Boolean(currentUser?.id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const connectionsQuery = useQuery({
    queryKey: ["user-connections", currentUser?.id],
    queryFn: () => getUserConnections(currentUser!.id),
    enabled: Boolean(currentUser?.id),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (connectionsQuery.isLoading) {
      setLoading(true);
      return;
    }

    if (connectionsQuery.data && currentUser?.id) {
      const connectionsData = connectionsQuery.data;
      const mapped: ConnectionUser[] = (connectionsData || []).map((conn: any) => ({
        id: String(
          conn.requester === currentUser.id
            ? conn.recipient_info?.id || conn.recipient
            : conn.requester_info?.id || conn.requester
        ),
        name:
          (conn.requester === currentUser.id
            ? conn.recipient_info?.full_name
            : conn.requester_info?.full_name) || t("defaultUser"),
        username:
          (conn.requester === currentUser.id
            ? conn.recipient_info?.username
            : conn.requester_info?.username) || "user",
        avatar:
          (conn.requester === currentUser.id
            ? conn.recipient_info?.avatar
            : conn.requester_info?.avatar) || "/placeholder-avatar.jpg",
        university:
          (conn.requester === currentUser.id
            ? conn.recipient_info?.university
            : conn.requester_info?.university) || "",
        faculty:
          (conn.requester === currentUser.id
            ? conn.recipient_info?.faculty
            : conn.requester_info?.faculty) || "",
        field:
          (conn.requester === currentUser.id
            ? conn.recipient_info?.faculty
            : conn.requester_info?.faculty) || "",
        normalizedUniversity: normalizeUniversity(
          conn.requester === currentUser.id
            ? conn.recipient_info?.university
            : conn.requester_info?.university
        ),
        normalizedFaculty: normalizeFaculty(
          conn.requester === currentUser.id
            ? conn.recipient_info?.faculty
            : conn.requester_info?.faculty
        ),
        isVerified: false,
        impactScore:
          (conn.requester === currentUser.id
            ? conn.recipient_info?.impact_score
            : conn.requester_info?.impact_score) || 0,
        mutualFriends: 0,
        status: conn.status,
        isIncomingRequest: conn.recipient === currentUser.id && conn.status === "pending",
      }));

      setConnections(mapped.filter((c) => c.status === "accepted"));
      setPendingRequests(mapped.filter((c) => c.isIncomingRequest));

      let isMounted = true;
      (async () => {
        try {
          setMutualCountStatus(t("status.calculatingMutual"));
          const mutualCounts = await getMutualConnectionCounts({
            currentUserId: currentUser.id,
            connectionUserIds: mapped.map((connection) => connection.id),
          });

          if (isMounted) {
            setConnections((prev) =>
              prev.map((connection) => ({
                ...connection,
                mutualFriends: mutualCounts.counts[String(connection.id)] ?? 0,
              }))
            );
            setMutualCountStatus(t("status.mutualUpdated"));
          }
        } catch {
          if (isMounted) {
            setMutualCountStatus(null);
            toast({
              title: t("toasts.info"),
              description: t("toasts.mutualUnavailable"),
              duration: 2000,
            });
          }
        }
      })();
      setLoading(false);
      return () => {
        isMounted = false;
      };
    } else {
      setLoading(false);
    }
  }, [connectionsQuery.data, connectionsQuery.isLoading, currentUser, toast]);

  // Load suggestions
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const users = suggestionsQuery.data;
    if (isMounted && users) {
      const connectionIds = new Set(connections.map((c) => c.id));
      const mapped: ConnectionUser[] = (users || [])
        .filter((u: any) => u.id !== currentUser.id && !connectionIds.has(String(u.id)))
        .map((u: any) => ({
          id: String(u.id),
          name: u.name || u.first_name + " " + u.last_name,
          username: u.username,
          avatar: u.avatar || "/placeholder-avatar.jpg",
          university: u.university || "",
          faculty: u.faculty || "",
          field: u.faculty || "",
          isVerified: u.is_verified || false,
          impactScore: u.impact_score || 0,
          normalizedUniversity: normalizeUniversity(u.university),
          normalizedFaculty: normalizeFaculty(u.faculty),
          reason:
            normalizeUniversity(u.university) &&
            normalizeUniversity(currentUser.university) &&
            normalizeUniversity(u.university) === normalizeUniversity(currentUser.university)
              ? t("reasons.sameUniversity")
              : normalizeFaculty(u.faculty) &&
                  normalizeFaculty(currentUser.faculty) &&
                  normalizeFaculty(u.faculty) === normalizeFaculty(currentUser.faculty)
                ? t("reasons.sameFaculty")
                : t("reasons.suggested"),
        }));
      setSuggestions(mapped.slice(0, 20));
    }
    return () => {
      isMounted = false;
    };
  }, [currentUser, connections, suggestionsQuery.data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ConnectionFilter>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (entry: ConnectionUser) => {
    if (!normalizedQuery) return true;
    return [entry.name, entry.username, entry.university, entry.faculty, entry.field]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  };

  const matchesFilter = (entry: ConnectionUser) => {
    switch (activeFilter) {
      case "university":
        return Boolean(
          currentUser?.university &&
            entry.university &&
            String(entry.university).toLowerCase() === String(currentUser.university).toLowerCase()
        );
      case "faculty":
        return Boolean(
          currentUser?.faculty &&
            entry.faculty &&
            String(entry.faculty).toLowerCase() === String(currentUser.faculty).toLowerCase()
        );
      case "mutual":
        return Number(entry.mutualFriends || 0) > 0;
      case "impact":
        return Number(entry.impactScore || 0) >= 50;
      default:
        return true;
    }
  };

  const filteredConnections = useMemo(
    () => connections.filter((entry) => matchesSearch(entry) && matchesFilter(entry)),
    [connections, normalizedQuery, activeFilter, currentUser]
  );

  const filteredSuggestions = useMemo(
    () => suggestions.filter((entry) => matchesSearch(entry) && matchesFilter(entry)),
    [suggestions, normalizedQuery, activeFilter, currentUser]
  );

  const hasActiveFilters = normalizedQuery.length > 0 || activeFilter !== "all";

  const handleAcceptRequest = async (request: ConnectionUser) => {
    try {
      await acceptConnection(request.id);
      toast({
        title: t("toasts.accepted"),
        description: t("toasts.acceptedDesc", { name: request.name }),
      });
      setConnections((prev) => [...prev, { ...request, status: "accepted" }]);
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error: any) {
      toast({
        title: t("toasts.error"),
        description: error?.message || t("toasts.acceptFailed"),
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (request: ConnectionUser) => {
    try {
      await disconnectFromUser(request.id);
      toast({
        title: t("toasts.declined"),
        description: t("toasts.declinedDesc", { name: request.name }),
      });
      setPendingRequests((prev) => prev.filter((r) => r.id !== request.id));
    } catch (error: any) {
      toast({
        title: t("toasts.error"),
        description: error?.message || t("toasts.declineFailed"),
        variant: "destructive",
      });
    }
  };

  const handleConnectSuggestion = async (
    e: React.MouseEvent,
    suggestion: ConnectionUser
  ) => {
    e.stopPropagation();
    try {
      await createConnection(suggestion.id);
      toast({
        title: t("toasts.requestSent"),
        description: t("toasts.requestSentDesc", { name: suggestion.name }),
        duration: 2000,
      });
      setConnections((prev) => [...prev, suggestion]);
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
    } catch (error: any) {
      toast({
        title: t("toasts.error"),
        description: error?.message || t("toasts.requestFailed"),
        variant: "destructive",
      });
    }
  };

  const handleNavigateMessage = async (userId: string) => {
    try {
      const res = await createPrivateConversation(userId);
      const conv = res?.data || res;
      const convId = conv?.hash_id || (conv?.id ? String(conv.id) : null);
      if (convId) {
        navigate(`/messages/${convId}`);
        return;
      }
    } catch {
      // fallback
    }
    navigate("/messages");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-6 md:py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <ConnectionsHeader mutualCountStatus={mutualCountStatus} />

        {/* Search & Filters */}
        <ConnectionsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showMobileFilters={showMobileFilters}
          onToggleMobileFilters={() => setShowMobileFilters((v) => !v)}
        />

        {/* Content View Modes */}
        {hasActiveFilters ? (
          <ConnectionsFilteredResults
            connections={filteredConnections}
            suggestions={filteredSuggestions}
            onNavigateProfile={(username) => navigate("/profile/" + username)}
            onNavigateMessage={handleNavigateMessage}
            onConnect={handleConnectSuggestion}
            onResetFilters={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
          />
        ) : viewAllSection ? (
          <ConnectionsViewAllSection
            viewAllSection={viewAllSection}
            onBack={() => setViewAllSection(null)}
            pendingRequests={pendingRequests}
            connections={filteredConnections}
            suggestions={filteredSuggestions}
            onNavigateProfile={(username) => navigate("/profile/" + username)}
            onNavigateMessage={handleNavigateMessage}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onConnectSuggestion={handleConnectSuggestion}
          />
        ) : (
          <ConnectionsDashboardSections
            loading={loading}
            pendingRequests={pendingRequests}
            connections={filteredConnections}
            suggestions={filteredSuggestions}
            onViewAll={setViewAllSection}
            onNavigateProfile={(username) => navigate("/profile/" + username)}
            onNavigateMessage={handleNavigateMessage}
            onAcceptRequest={handleAcceptRequest}
            onRejectRequest={handleRejectRequest}
            onConnectSuggestion={handleConnectSuggestion}
          />
        )}
      </div>
    </div>
  );
}
