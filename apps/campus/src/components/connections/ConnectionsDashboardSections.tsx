import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
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
  return (
    <div className="flex flex-col gap-10 mt-6 pb-12">
      {/* Row 1: Demandes (Only if > 0) */}
      {pendingRequests.length > 0 && (
        <section className="space-y-1">
          <div className="flex justify-between items-center pb-2 border-b border-border/40 px-1">
            <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              Demandes en attente ({pendingRequests.length})
            </h2>
            {pendingRequests.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
                onClick={() => onViewAll("requests")}
              >
                Voir tout
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
            Mes Connexions ({connections.length})
          </h2>
          {connections.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
              onClick={() => onViewAll("connections")}
            >
              Voir tout
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
            title="Aucune connexion"
            description="Commencez à vous connecter avec d'autres étudiants !"
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
            Suggestions ({suggestions.length})
          </h2>
          {suggestions.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground font-medium h-7 px-2"
              onClick={() => onViewAll("suggestions")}
            >
              Voir tout
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
            title="Aucune suggestion"
            description="Revenez plus tard, de nouveaux étudiants rejoignent la plateforme."
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
