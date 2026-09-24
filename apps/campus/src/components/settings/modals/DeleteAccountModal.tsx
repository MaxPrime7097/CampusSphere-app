import { Loader2, TriangleAlert, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmText: string;
  onConfirmTextChange: (value: string) => void;
  onDelete: () => void;
  isLoading: boolean;
}

export function DeleteAccountModal({
  open,
  onOpenChange,
  confirmText,
  onConfirmTextChange,
  onDelete,
  isLoading,
}: DeleteAccountModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            Supprimer le Compte
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium mb-2">⚠️ Attention !</p>
            <p className="text-sm text-muted-foreground">
              Cette action est irréversible. Toutes vos données, posts, connexions et contributions seront définitivement supprimées.
            </p>
          </div>
          <div>
            <Label htmlFor="confirmText">Tapez "SUPPRIMER" pour confirmer</Label>
            <Input
              id="confirmText"
              placeholder="SUPPRIMER"
              className="font-mono"
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDelete} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 mr-2" />
                  Supprimer le Compte
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
