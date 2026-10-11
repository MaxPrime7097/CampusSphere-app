import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { ConnectionCard } from "./ConnectionCard";
import { SuggestionCard } from "./SuggestionCard";
import { PendingRequestCard } from "./PendingRequestCard";
import type { ConnectionUser } from "./types";

interface ConnectionsViewAllSectionProps {
  viewAllSection: string;
  onBack: () => void;
  pendingRequests: ConnectionUser[];
  connections: ConnectionUser[];
  suggestions: ConnectionUser[];
  onNavigateProfile: (username: string) => void;
  onNavigateMessage: (id: string) => void;
  onAcceptRequest: (request: ConnectionUser) => void;
  onRejectRequest: (request: ConnectionUser) => void;
  onConnectSuggestion: (e: React.MouseEvent, suggestion: ConnectionUser) => void;
}

export function ConnectionsViewAllSection({
  viewAllSection,
  onBack,
  pendingRequests,
  connections,
  suggestions,
  onNavigateProfile,
  onNavigateMessage,
  onAcceptRequest,
  onRejectRequest,
  onConnectSuggestion,
}: ConnectionsViewAllSectionProps) {
  const { t } = useTranslation("connections");

  return (
    <div className="mt-6 space-y-4">
      <div className="ml-2 flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          {t("actions.back")}
        </Button>
        <h2 className="text-lg font-semibold">
          {viewAllSection === "requests" && `${t("sections.pendingRequests")} (${pendingRequests.length})`}
          {viewAllSection === "connections" && `${t("sections.myConnections")} (${connections.length})`}
          {viewAllSection === "suggestions" && `${t("sections.suggestions")} (${suggestions.length})`}
        </h2>
      </div>

      <div className="flex flex-col">
        {viewAllSection === "requests" &&
          pendingRequests.map((request) => (
            <PendingRequestCard
              key={request.id}
              request={request}
              onNavigateProfile={onNavigateProfile}
              onAccept={onAcceptRequest}
              onReject={onRejectRequest}
            />
          ))}

        {viewAllSection === "connections" &&
          connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onNavigateProfile={onNavigateProfile}
              onNavigateMessage={onNavigateMessage}
            />
          ))}

        {viewAllSection === "suggestions" &&
          suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onNavigateProfile={onNavigateProfile}
              onConnect={onConnectSuggestion}
            />
          ))}
      </div>
    </div>
  );
}
