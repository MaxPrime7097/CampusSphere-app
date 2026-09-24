import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

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
  return (
    <section className="mt-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Connexions ({connections.length})</h3>
        {connections.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucune connexion"
            description="Cet utilisateur n'est pas encore connecté avec d'autres étudiants."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((connection) => (
              <Card
                key={connection.id || connection.username}
                className="campus-card mobile-card cursor-pointer hover:campus-glow transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={connection.avatar} />
                      <AvatarFallback className="bg-input text-muted-foreground font-bold text-lg">
                        {connection.name?.slice(0, 1).toUpperCase() || "..."}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{connection.name}</p>
                      <p className="text-sm text-muted-foreground truncate">@{connection.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {connection.mutual ?? 0} amis en commun
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewProfile(connection.username, connection.name, true)}
                      disabled={!connection.username}
                    >
                      Voir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
