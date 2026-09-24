import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ResourceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftTitle: string;
  onChangeTitle: (value: string) => void;
  draftDescription: string;
  onChangeDescription: (value: string) => void;
  isUpdating: boolean;
  onConfirm: () => void;
}

export function ResourceEditDialog({
  open,
  onOpenChange,
  draftTitle,
  onChangeTitle,
  draftDescription,
  onChangeDescription,
  isUpdating,
  onConfirm,
}: ResourceEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la ressource</DialogTitle>
          <DialogDescription>Mettre à jour le titre et la description.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={draftTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="min-h-[60px]"
            placeholder="Titre de la ressource"
          />
          <Textarea
            value={draftDescription}
            onChange={(e) => onChangeDescription(e.target.value)}
            className="min-h-[120px]"
            placeholder="Description de la ressource"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button onClick={onConfirm} disabled={isUpdating}>
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
