import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface ContactUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  connections: ContactUser[];
  globalUsers: ContactUser[];
  loadingConnections: boolean;
  loadingGlobalUsers: boolean;
  isCreatingPrivate: boolean;
  onCreatePrivate: (userId: string) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  search,
  onSearchChange,
  connections,
  globalUsers,
  loadingConnections,
  loadingGlobalUsers,
  isCreatingPrivate,
  onCreatePrivate,
}: NewConversationDialogProps) {
  const filteredConnections = connections.filter((contact) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.username.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Rechercher dans vos connexions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
            {/* Connections */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground px-1">
                Vos connexions
              </p>
              {loadingConnections ? (
                <div className="text-sm text-muted-foreground px-1">Chargement...</div>
              ) : filteredConnections.length === 0 ? (
                <div className="text-sm text-muted-foreground px-1 opacity-70">
                  {search ? "Aucun match" : "Aucune connexion trouvée"}
                </div>
              ) : (
                filteredConnections.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                    onClick={() => onCreatePrivate(contact.id)}
                    disabled={isCreatingPrivate}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={contact.avatar} />
                      <AvatarFallback>
                        {(contact.name || "...").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{contact.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.username ? `@${contact.username}` : "Utilisateur"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Global search results */}
            {search.trim().length >= 2 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-[10px] font-bold text-muted-foreground px-1">
                  Global (Tous les membres)
                </p>
                {loadingGlobalUsers ? (
                  <div className="text-sm text-muted-foreground px-1">
                    Recherche globale...
                  </div>
                ) : globalUsers.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-1 opacity-70">
                    Aucun membre trouvé
                  </div>
                ) : (
                  globalUsers
                    .filter((u) => !connections.some((c) => String(c.id) === String(u.id)))
                    .map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent text-left transition-colors"
                        onClick={() => onCreatePrivate(u.id)}
                        disabled={isCreatingPrivate}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback>
                            {(u.name || "...").slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{u.username}
                          </p>
                        </div>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
