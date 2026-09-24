import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetflixCarousel } from "@/components/ui/netflix-carousel";
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
    <div className="flex flex-col gap-10 mt-8 pb-12">
      {/* Row 1: Demandes (Only if > 0) */}
      {pendingRequests.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Demandes en attente ({pendingRequests.length})
            </h2>
            {pendingRequests.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onViewAll("requests")}
              >
                Voir tout
              </Button>
            )}
          </div>
          <NetflixCarousel className="gap-3 pb-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="cs-scroll-item w-[280px] sm:w-[320px]">
                  <ConnectionSkeleton />
                </div>
              ))
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="cs-scroll-item w-[280px] sm:w-[320px]">
                  <PendingRequestCard
                    request={request}
                    onNavigateProfile={onNavigateProfile}
                    onAccept={onAcceptRequest}
                    onReject={onRejectRequest}
                  />
                </div>
              ))
            )}
          </NetflixCarousel>
        </section>
      )}

      {/* Row 2: Mes Connexions */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Mes Connexions ({connections.length})
          </h2>
          {connections.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onViewAll("connections")}
            >
              Voir tout
            </Button>
          )}
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
          <NetflixCarousel className="gap-3 pb-1">
            {connections.map((connection) => (
              <div key={connection.id} className="cs-scroll-item w-[280px] sm:w-[320px]">
                <ConnectionCard
                  connection={connection}
                  onNavigateProfile={onNavigateProfile}
                  onNavigateMessage={onNavigateMessage}
                />
              </div>
            ))}
          </NetflixCarousel>
        )}
      </section>

      {/* Row 3: Suggestions */}
      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Suggestions ({suggestions.length})
          </h2>
          {suggestions.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => onViewAll("suggestions")}
            >
              Voir tout
            </Button>
          )}
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
          <NetflixCarousel className="gap-3 pb-1">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="cs-scroll-item w-[280px] sm:w-[320px]">
                <SuggestionCard
                  suggestion={suggestion}
                  onNavigateProfile={onNavigateProfile}
                  onConnect={onConnectSuggestion}
                />
              </div>
            ))}
          </NetflixCarousel>
        )}
      </section>
    </div>
  );
}
