import { MagnifyingGlass as Search } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ConnectionCard } from "./ConnectionCard";
import { SuggestionCard } from "./SuggestionCard";
import type { ConnectionUser } from "./types";

interface ConnectionsFilteredResultsProps {
  connections: ConnectionUser[];
  suggestions: ConnectionUser[];
  onNavigateProfile: (username: string) => void;
  onNavigateMessage: (id: string) => void;
  onConnect: (e: React.MouseEvent, suggestion: ConnectionUser) => void;
  onResetFilters: () => void;
}

export function ConnectionsFilteredResults({
  connections,
  suggestions,
  onNavigateProfile,
  onNavigateMessage,
  onConnect,
  onResetFilters,
}: ConnectionsFilteredResultsProps) {
  return (
    <div className="mt-6 space-y-8">
      {connections.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2 pb-2 border-b border-border/40 px-1">Résultats de vos connexions</h2>
          <div className="flex flex-col">
            {connections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onNavigateProfile={onNavigateProfile}
                onNavigateMessage={onNavigateMessage}
              />
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2 pb-2 border-b border-border/40 px-1">Résultats des suggestions</h2>
          <div className="flex flex-col">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onNavigateProfile={onNavigateProfile}
                onConnect={onConnect}
              />
            ))}
          </div>
        </section>
      )}

      {connections.length === 0 && suggestions.length === 0 && (
        <EmptyState
          icon={Search}
          title="Aucun résultat"
          description="Essayez de changer les filtres ou la recherche."
          actionLabel="Réinitialiser"
          onAction={onResetFilters}
        />
      )}
    </div>
  );
}
