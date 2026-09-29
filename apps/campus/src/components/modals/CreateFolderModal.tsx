import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FolderPlus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFolder, updateFolder, type ResourceFolder } from "@/services/api";

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCount: number;
  folder?: ResourceFolder | null; // if provided, we're editing
  onSuccess: (folder: ResourceFolder) => void;
}

export function CreateFolderModal({
  open,
  onOpenChange,
  existingCount,
  folder,
  onSuccess,
}: CreateFolderModalProps) {
  const { toast } = useToast();
  const isEditing = Boolean(folder);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "university" | "friends">("public");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || "");
      setVisibility((folder.visibility as "public" | "university" | "friends") || "public");
    } else {
      setName("");
      setDescription("");
      setVisibility("public");
    }
  }, [folder, open]);

  const atLimit = !isEditing && existingCount >= 4;

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Nom requis", description: "Veuillez donner un nom au dossier.", variant: "destructive" });
      return;
    }
    if (atLimit) {
      toast({ title: "Limite atteinte", description: "Vous avez déjà 4 dossiers (maximum).", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      let result: ResourceFolder;
      if (isEditing && folder) {
        result = await updateFolder(folder.id, { name: name.trim(), description, visibility });
        toast({ title: "Dossier mis à jour !" });
      } else {
        result = await createFolder({ name: name.trim(), description, visibility });
        toast({ title: "Dossier créé !" });
      }
      onSuccess(result);
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message || "Une erreur est survenue.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Save className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
            {isEditing ? "Modifier le dossier" : "Nouveau dossier"}
          </DialogTitle>
        </DialogHeader>

        {atLimit ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Vous avez atteint la limite de <strong>4 dossiers</strong>.
            </p>
            <p className="text-xs text-muted-foreground">Supprimez un dossier existant pour en créer un nouveau.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Nom du dossier *</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cours de Maths S1"
                maxLength={100}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {!isEditing && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {existingCount}/4 dossiers utilisés
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="folder-desc">Description <span className="text-muted-foreground">(optionnel)</span></Label>
              <Textarea
                id="folder-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le contenu de ce dossier..."
                rows={2}
                maxLength={300}
              />
            </div>

            <div>
              <Label htmlFor="folder-visibility">Visibilité</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as typeof visibility)}
              >
                <SelectTrigger id="folder-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — visible par tous</SelectItem>
                  <SelectItem value="university">Université — même université</SelectItem>
                  <SelectItem value="friends">Amis uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
                onClick={handleSubmit}
                disabled={isSaving || !name.trim()}
              >
                {isSaving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sauvegarde...</>
                ) : isEditing ? (
                  <><Save className="h-4 w-4 mr-2" /> Sauvegarder</>
                ) : (
                  <><FolderPlus className="h-4 w-4 mr-2" /> Créer le dossier</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
