import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase as BriefcaseBusiness, Spinner as Loader2, Check, Plus, X, Link as LinkIcon } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/services/api";

interface PortfolioLink {
  name: string;
  url: string;
}

interface EditPortfolioModalProps {
  children?: React.ReactNode;
  initialLinks: PortfolioLink[];
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditPortfolioModal({ children, initialLinks, onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: EditPortfolioModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<PortfolioLink[]>(initialLinks);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        portfolio_links: links,
      });

      toast({
        title: "Succès",
        description: "Portfolio mis à jour",
      });
      
      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la mise à jour",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLink = () => {
    if (newUrl.trim()) {
      setLinks([...links, { name: newName.trim() || newUrl.trim(), url: newUrl.trim() }]);
      setNewName("");
      setNewUrl("");
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-primary" />
            Modifier le portfolio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 p-4 rounded-xl bg-muted/20">
            <div className="space-y-2">
              <Label>Nom du projet / Lien</Label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="Ex: Mon GitHub, Portfolio Design..."
              />
            </div>
            <div className="space-y-2">
              <Label>URL *</Label>
              <div className="flex gap-2">
                <Input 
                  value={newUrl} 
                  onChange={(e) => setNewUrl(e.target.value)} 
                  placeholder="https://..."
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={addLink}
                  disabled={!newUrl.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Liens ajoutés ({links.length})</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-background group">
                  <div className="flex items-center gap-2 min-w-0">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{link.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeLink(i)}
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {links.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Aucun lien dans le portfolio
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
