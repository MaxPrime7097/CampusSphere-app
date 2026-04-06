import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, GraduationCap, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DegreeCombobox } from "@/components/forms/DegreeCombobox";
import { InstitutionCombobox } from "@/components/forms/InstitutionCombobox";

interface Education {
  degree: string;
  school: string;
  year: string;
}

interface AddEducationModalProps {
  children: React.ReactNode;
  onEducationAdded?: (education: Education) => void;
  existingEducations?: Education[];
}

export function AddEducationModal({ children, onEducationAdded, existingEducations = [] }: AddEducationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [degree, setDegree] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!degree.trim() || !school.trim() || !year.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const education: Education = {
        degree: degree.trim(),
        school: school.trim(),
        year: year.trim()
      };

      if (onEducationAdded) {
        onEducationAdded(education);
      }

      toast({
        title: "Formation ajoutée !",
        description: "Votre formation a été ajoutée avec succès",
        duration: 3000,
      });

      resetForm();

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la formation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDegree("");
    setSchool("");
    setYear("");
    setIsOpen(false);
  };

  const removeEducation = (index: number) => {
    // Cette fonction sera gérée par le composant parent
    console.log("Remove education at index:", index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Ajouter une formation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Formations existantes */}
          {existingEducations.length > 0 && (
            <div>
              <Label>Formations ajoutées ({existingEducations.length})</Label>
              <div className="space-y-2 mt-2">
                {existingEducations.map((edu, index) => (
                  <div key={index} className="border-l-2 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">{edu.school}</p>
                        <p className="text-xs text-muted-foreground">{edu.year}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire d'ajout */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="degree">Diplôme/Formation *</Label>
              <DegreeCombobox
                value={degree}
                onValueChange={setDegree}
                placeholder="Sélectionner ou saisir un diplôme"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="school">Établissement *</Label>
              <InstitutionCombobox
                value={school}
                onValueChange={setSchool}
                placeholder="Sélectionner ou saisir un établissement"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="year">Année(s) *</Label>
              <Input
                id="year"
                placeholder="Ex: 2020-2023, 2022..."
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={resetForm} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !degree.trim() || !school.trim() || !year.trim()}
            className="campus-gradient text-white hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ajout...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Ajouter la formation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
