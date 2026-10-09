import { UsersThree as Users, UserPlus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ConnectionSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "react-i18next";
import { ConnectionCard } from "./ConnectionCard";
import { SuggestionCard } from "./SuggestionCard";
import { PendingRequestCard } from "./PendingRequestCard";
import type { ConnectionUser } from "./types";

interface ConnectionsDashboardSectionsProps {
  loading: boolean;
  pendingRequests: ConnectionUser[];
  connections: ConnectionUser[];
  suggestions: ConnectionUser[];
  onViewAll: (section: string) => void;
  onNavigateProfile: (username: string) => void;
  onNavigateMessage: (id: string) => void;
  onAcceptRequest: (request: ConnectionUser) => void;
  onRejectRequest: (request: ConnectionUser) => void;
  onConnectSuggestion: (e: React.MouseEvent, suggestion: ConnectionUser) => void;
}

export function ConnectionsDashboardSections({
  loading,
  pendingRequests,
  connections,
  suggestions,
  onViewAll,
  onNavigateProfile,
  onNavigateMessage,
  onAcceptRequest,
  onRejectRequest,
  onConnectSuggestion,
}: ConnectionsDashboardSectionsProps) {
  const { t } = useTranslation("connections");

  return (
    <div className="flex flex-col gap-10 mt-6 pb-12">
      {/* Row 1: Demandes (Only if > 0) */}
      {pendingRequests.length > 0 && (
        <section className="space-y-1">
          <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
            <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              {t("sections.pendingRequests")} ({pendingRequests.length})
            </h2>
            {pendingRequests.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
                onClick={() => onViewAll("requests")}
              >
                {t("sections.viewAllSimple")}
              </Button>
            )}
          </div>
          <div className="flex flex-col">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <ConnectionSkeleton key={i} />
              ))
            ) : (
              pendingRequests.slice(0, 4).map((request) => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  onNavigateProfile={onNavigateProfile}
                  onAccept={onAcceptRequest}
                  onReject={onRejectRequest}
                />
              ))
            )}
          </div>
        </section>
      )}

      {/* Row 2: Mes Connexions */}
      <section className="space-y-1">
        <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
          <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            {t("sections.myConnections")} ({connections.length})
          </h2>
          {connections.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
              onClick={() => onViewAll("connections")}
            >
              {t("sections.viewAllSimple")}
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <ConnectionSkeleton key={i} />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("empty.connectionsTitle")}
            description={t("empty.connectionsDesc")}
          />
        ) : (
          <div className="flex flex-col">
            {connections.slice(0, 5).map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onNavigateProfile={onNavigateProfile}
                onNavigateMessage={onNavigateMessage}
              />
            ))}
          </div>
        )}
      </section>

      {/* Row 3: Suggestions */}
      <section className="space-y-1">
        <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
          <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            {t("sections.suggestions")} ({suggestions.length})
          </h2>
          {suggestions.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
              onClick={() => onViewAll("suggestions")}
            >
              {t("sections.viewAllSimple")}
            </Button>
          )}
        </div>
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <ConnectionSkeleton key={i} />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title={t("empty.suggestionsTitle")}
            description={t("empty.suggestionsDesc")}
          />
        ) : (
          <div className="flex flex-col">
            {suggestions.slice(0, 5).map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onNavigateProfile={onNavigateProfile}
                onConnect={onConnectSuggestion}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
