import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DegreeCombobox } from "@/components/forms/DegreeCombobox";
import { InstitutionCombobox } from "@/components/forms/InstitutionCombobox";
import { updateUserProfile } from "@/services/api";
import { formatSlugToLabel } from "@/lib/utils";

interface Education {
  degree: string;
  school: string;
  year: string;
}

interface EditEducationModalProps {
  children?: React.ReactNode;
  initialEducation: Education[];
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditEducationModal({ children, initialEducation, onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: EditEducationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [educationList, setEducationList] = useState<Education[]>(initialEducation);
  const [degree, setDegree] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        previous_education: educationList,
      });

      toast({
        title: "Succès",
        description: "Formations mises à jour",
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

  const addEducation = () => {
    if (degree && school && year) {
      setEducationList([...educationList, { degree, school, year }]);
      setDegree("");
      setSchool("");
      setYear("");
    }
  };

  const removeEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Modifier les formations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 p-4 rounded-xl bg-muted/20">
            <div className="space-y-2">
              <Label>Diplôme / Niveau *</Label>
              <DegreeCombobox value={degree} onValueChange={setDegree} />
            </div>
            <div className="space-y-2">
              <Label>Établissement *</Label>
              <InstitutionCombobox value={school} onValueChange={setSchool} />
            </div>
            <div className="space-y-2">
              <Label>Année *</Label>
              <div className="flex gap-2">
                <Input 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                  placeholder="Ex: 2023, 2021-2024..."
                  maxLength={REGISTRATION_MAX_LENGTHS.educationYear}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={addEducation}
                  disabled={!degree || !school || !year}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formations ajoutées ({educationList.length})</Label>
            <div className="space-y-2">
              {educationList.map((edu, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-background group">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{formatSlugToLabel(edu.degree)}</p>
                    <p className="text-xs text-muted-foreground truncate">{edu.school} • {edu.year}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeEducation(i)}
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {educationList.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Aucune formation enregistrée
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
