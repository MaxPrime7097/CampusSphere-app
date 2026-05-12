import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Loader2, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JobTitleCombobox } from "@/components/forms/JobTitleCombobox";
import { CompanyCombobox } from "@/components/forms/CompanyCombobox";
import { updateUserProfile } from "@/services/api";

interface Experience {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface EditExperiencesModalProps {
  children: React.ReactNode;
  initialExperiences: Experience[];
  onSuccess?: () => void;
}

export function EditExperiencesModal({ children, initialExperiences, onSuccess }: EditExperiencesModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        experiences,
      });

      toast({
        title: "Succès",
        description: "Expériences mises à jour",
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

  const addExperience = () => {
    if (title && company && duration && description) {
      setExperiences([...experiences, { title, company, duration, description }]);
      setTitle("");
      setCompany("");
      setDuration("");
      setDescription("");
    }
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Modifier les expériences
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3 p-4 rounded-xl bg-muted/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Poste *</Label>
                <JobTitleCombobox value={title} onValueChange={setTitle} />
              </div>
              <div className="space-y-2">
                <Label>Entreprise *</Label>
                <CompanyCombobox value={company} onValueChange={setCompany} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Durée *</Label>
              <Input 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)} 
                placeholder="Ex: 6 mois, Jan 2023 - Juin 2023..."
                maxLength={REGISTRATION_MAX_LENGTHS.experienceDuration}
              />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Décrivez vos missions..."
                rows={2}
                maxLength={REGISTRATION_MAX_LENGTHS.experienceDescription}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addExperience}
                disabled={!title || !company || !duration || !description}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter à la liste
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expériences ajoutées ({experiences.length})</Label>
            <div className="space-y-3">
              {experiences.map((exp, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-3 border rounded-lg bg-background group">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{exp.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{exp.company} • {exp.duration}</p>
                    <p className="text-xs mt-1 text-muted-foreground line-clamp-2">{exp.description}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeExperience(i)}
                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {experiences.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Aucune expérience enregistrée
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
