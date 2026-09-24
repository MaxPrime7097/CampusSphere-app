import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileVisibilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibility: string;
  onVisibilityChange: (value: string) => void;
  onSave: () => void;
  isLoading: boolean;
}

export function ProfileVisibilityModal({
  open,
  onOpenChange,
  visibility,
  onVisibilityChange,
  onSave,
  isLoading,
}: ProfileVisibilityModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Visibilité du profil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label>Qui peut voir mon profil</Label>
          <Select value={visibility} onValueChange={onVisibilityChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Tout le monde</SelectItem>
              <SelectItem value="connections">Mes connexions uniquement</SelectItem>
              <SelectItem value="private">Moi uniquement</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Cette option est active et synchronisée avec votre compte.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={onSave} disabled={isLoading}>Enregistrer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
