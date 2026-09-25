import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Briefcase, Loader2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JobTitleCombobox } from "@/components/forms/JobTitleCombobox";
import { CompanyCombobox } from "@/components/forms/CompanyCombobox";

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface AddExperienceModalProps {
  children?: React.ReactNode;
  onExperienceAdded?: (experience: Experience) => void;
  existingExperiences?: Experience[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddExperienceModal({ children, onExperienceAdded, existingExperiences = [], open: controlledOpen, onOpenChange: setControlledOpen }: AddExperienceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const handleSubmit = async () => {
    if (!title.trim() || !company.trim() || !duration.trim() || !description.trim()) {
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

      const experience: Experience = {
        title: title.trim(),
        company: company.trim(),
        duration: duration.trim(),
        description: description.trim()
      };

      if (onExperienceAdded) {
        onExperienceAdded(experience);
      }

      toast({
        title: "Expérience ajoutée !",
        description: "Votre expérience a été ajoutée avec succès",
        duration: 3000,
      });

      resetForm();

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'expérience",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCompany("");
    setDuration("");
    setDescription("");
    setOpen(false);
  };

  const removeExperience = (index: number) => {
    // Cette fonction sera gérée par le composant parent
    console.log("Remove experience at index:", index);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Ajouter une expérience
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Expériences existantes */}
          {existingExperiences.length > 0 && (
            <div>
              <Label>Expériences ajoutées ({existingExperiences.length})</Label>
              <div className="space-y-2 mt-2">
                {existingExperiences.map((exp, index) => (
                  <div key={index} className="border-l-2 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-semibold overflow-hidden text-ellipsis whitespace-nowrap">{exp.title}</p>
                        <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{exp.company}</p>
                        <p className="text-xs text-muted-foreground mb-2 overflow-hidden text-ellipsis whitespace-nowrap">{exp.duration}</p>
                        <p className="text-sm break-words">{exp.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExperience(index)}
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
              <Label htmlFor="title">Poste/Intitulé *</Label>
              <JobTitleCombobox
                value={title}
                onValueChange={setTitle}
                placeholder="Sélectionner ou saisir un poste"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="company">Entreprise/Organisation *</Label>
              <CompanyCombobox
                value={company}
                onValueChange={setCompany}
                placeholder="Sélectionner ou saisir une entreprise"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="duration">Durée *</Label>
              <Input
                id="duration"
                placeholder="Ex: 6 mois, 1 an, Été 2023..."
                value={duration}
                maxLength={REGISTRATION_MAX_LENGTHS.experienceDuration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez vos missions et responsabilités..."
                rows={3}
                value={description}
                maxLength={REGISTRATION_MAX_LENGTHS.experienceDescription}
                onChange={(e) => setDescription(e.target.value)}
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
            disabled={isSubmitting || !title.trim() || !company.trim() || !duration.trim() || !description.trim()}
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
                Ajouter l'expérience
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
