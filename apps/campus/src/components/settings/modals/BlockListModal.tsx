import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface BlockListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockSearch: string;
  onBlockSearchChange: (value: string) => void;
  blockedUsers: any[];
  onBlockUser: () => void;
  onUnblockUser: (blockId: number) => void;
  isLoading: boolean;
}

export function BlockListModal({
  open,
  onOpenChange,
  blockSearch,
  onBlockSearchChange,
  blockedUsers,
  onBlockUser,
  onUnblockUser,
  isLoading,
}: BlockListModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Liste de blocage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nom d'utilisateur à bloquer"
              value={blockSearch}
              onChange={(e) => onBlockSearchChange(e.target.value)}
            />
            <Button onClick={onBlockUser} disabled={isLoading || !blockSearch.trim()}>
              Bloquer
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Fonctionnalité disponible : blocage et déblocage en temps réel.</p>
          <div className="space-y-2 max-h-60 overflow-auto">
            {blockedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun utilisateur bloqué.</p>
            ) : (
              blockedUsers.map((block: any) => (
                <div key={block.id} className="flex items-center justify-between border rounded-md p-2">
                  <span className="text-sm">@{block.blocked_user?.username || block.blocked}</span>
                  <Button variant="outline" size="sm" onClick={() => onUnblockUser(block.id)} disabled={isLoading}>
                    Débloquer
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
