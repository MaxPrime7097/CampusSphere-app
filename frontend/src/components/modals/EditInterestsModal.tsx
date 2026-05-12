import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Smile, Loader2, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";
import { updateUserProfile } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { formatSlugToLabel } from "@/lib/utils";

interface EditInterestsModalProps {
  children: React.ReactNode;
  initialInterests: string[];
  onSuccess?: () => void;
}

export function EditInterestsModal({ children, initialInterests, onSuccess }: EditInterestsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [newInterest, setNewInterest] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        interests,
      });

      toast({
        title: "Succès",
        description: "Centres d'intérêt mis à jour",
      });
      
      if (onSuccess) onSuccess();
      setIsOpen(false);
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

  const addInterest = (interest: string) => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smile className="h-5 w-5 text-primary" />
            Modifier les centres d'intérêt
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ajouter un centre d'intérêt</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <InterestsCombobox 
                  value={newInterest} 
                  onValueChange={setNewInterest}
                  onSearchValueChange={setNewInterest}
                  onInterestAdd={addInterest}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => addInterest(newInterest)}
                disabled={!newInterest.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 p-3 rounded-xl bg-muted/20 min-h-[100px]">
              {interests.map((it, i) => (
                <Badge key={i} variant="outline" className="gap-1 pl-3 pr-1 py-1.5 bg-background">
                  {formatSlugToLabel(it)}
                  <button onClick={() => removeInterest(it)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {interests.length === 0 && (
                <p className="text-sm text-muted-foreground italic w-full text-center py-4">
                  Aucun centre d'intérêt ajouté
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting} className="campus-gradient text-white">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
