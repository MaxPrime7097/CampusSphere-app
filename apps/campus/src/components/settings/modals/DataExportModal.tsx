import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface DataExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: {
    include_connections: boolean;
    include_posts: boolean;
  };
  onOptionsChange: (field: "include_connections" | "include_posts", value: boolean) => void;
  onExport: () => void;
  isLoading: boolean;
}

export function DataExportModal({
  open,
  onOpenChange,
  options,
  onOptionsChange,
  onExport,
  isLoading,
}: DataExportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export des données</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="include-connections">Inclure les connexions</Label>
            <Switch
              id="include-connections"
              checked={options.include_connections}
              onCheckedChange={(value) => onOptionsChange("include_connections", value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="include-posts">Inclure les posts</Label>
            <Switch
              id="include-posts"
              checked={options.include_posts}
              onCheckedChange={(value) => onOptionsChange("include_posts", value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Fonctionnalité disponible : un fichier JSON est généré et téléchargé immédiatement.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={onExport} disabled={isLoading}>Télécharger mes données</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
