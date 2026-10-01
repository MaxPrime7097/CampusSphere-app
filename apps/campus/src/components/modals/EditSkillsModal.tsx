import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Zap, Loader2, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { updateUserProfile } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { formatSlugToLabel } from "@/lib/utils";

interface EditSkillsModalProps {
  children?: React.ReactNode;
  initialSkills: string[];
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditSkillsModal({ children, initialSkills, onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: EditSkillsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [newSkill, setNewSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        skills,
      });

      toast({
        title: "Succès",
        description: "Compétences mises à jour",
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

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      setSkills([...skills, skill]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Modifier les compétences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Ajouter une compétence</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SkillsCombobox 
                  value={newSkill} 
                  onValueChange={setNewSkill}
                  onSearchValueChange={setNewSkill}
                  onSkillAdd={addSkill}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => addSkill(newSkill)}
                disabled={!newSkill.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 p-3 rounded-xl bg-muted/20 min-h-[100px]">
              {skills.map((s, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pl-3 pr-1 py-1.5">
                  {formatSlugToLabel(s)}
                  <button onClick={() => removeSkill(s)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground italic w-full text-center py-4">
                  Aucune compétence ajoutée
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
