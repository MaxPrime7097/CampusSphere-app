import { Users } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "react-i18next";

export interface ProfileConnection {
  id: string | null;
  name: string;
  username: string;
  avatar?: string;
  mutual?: number;
}

interface ProfileConnectionsTabProps {
  connections: ProfileConnection[];
  onViewProfile: (username?: string, name?: string, showToast?: boolean) => void;
}

export function ProfileConnectionsTab({
  connections,
  onViewProfile,
}: ProfileConnectionsTabProps) {
  const { t } = useTranslation("profile");

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-2">
        <h3 className="text-base font-semibold text-foreground">
          {t("connections.title")} <span className="text-muted-foreground font-normal">({connections.length})</span>
        </h3>
      </div>
      {connections.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("connections.emptyTitle")}
          description={t("connections.emptyDesc")}
        />
      ) : (
        <div className="flex flex-col">
          {connections.map((connection) => (
            <div
              key={connection.id || connection.username}
              className="py-3 px-2 flex items-center justify-between gap-3 border-b border-border/40 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer"
              onClick={() => onViewProfile(connection.username, connection.name, true)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={connection.avatar} />
                  <AvatarFallback className="bg-input text-muted-foreground font-semibold text-sm">
                    {connection.name?.slice(0, 1).toUpperCase() || "..."}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{connection.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{connection.username}</p>
                  {connection.mutual !== undefined && connection.mutual > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      {t("connections.mutualFriends", { count: connection.mutual })}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile(connection.username, connection.name, true);
                }}
                disabled={!connection.username}
                className="h-8 px-3 text-xs flex-shrink-0"
              >
                {t("connections.viewAction")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
