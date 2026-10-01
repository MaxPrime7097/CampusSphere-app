import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface RenameGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  isUpdating: boolean;
}

export function RenameGroupDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
  isUpdating,
}: RenameGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Renommer le groupe</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nouveau nom..."
            maxLength={50}
            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!value.trim() || isUpdating}
              className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Renommer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
