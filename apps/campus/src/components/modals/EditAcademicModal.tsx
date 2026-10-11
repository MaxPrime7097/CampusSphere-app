import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Spinner as Loader2, Check } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { DomainCombobox } from "@/components/forms/DomainCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { getDomainForFaculty } from "@/constants/academicData";
import { updateUserProfile } from "@/services/api";

interface EditAcademicModalProps {
  children?: React.ReactNode;
  initialData: {
    university: string;
    faculty: string;
    studyYear: string;
    studentId: string;
    campus: string;
  };
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditAcademicModal({ children, initialData, onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: EditAcademicModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [university, setUniversity] = useState(initialData.university);
  const [academicDomain, setAcademicDomain] = useState(() => getDomainForFaculty(initialData.faculty) || "");
  const [faculty, setFaculty] = useState(initialData.faculty);
  const [studyYear, setStudyYear] = useState(initialData.studyYear);
  const [studentId, setStudentId] = useState(initialData.studentId);
  const [campus, setCampus] = useState(initialData.campus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const handleSave = async () => {
    if (!university || !faculty || !studyYear) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires (*)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserProfile({
        university,
        faculty,
        study_year: studyYear,
        student_id: studentId,
        campus,
      });

      toast({
        title: "Succès",
        description: "Informations académiques mises à jour",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Modifier les infos académiques
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Université *</Label>
            <UniversityCombobox value={university} onValueChange={setUniversity} />
          </div>

          <div className="space-y-2">
            <Label>Domaine d'études</Label>
            <DomainCombobox
              value={academicDomain}
              onValueChange={(d) => {
                setAcademicDomain(d);
                if (faculty && getDomainForFaculty(faculty) !== d) {
                  setFaculty("");
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Filière *</Label>
            <FacultyCombobox
              domain={academicDomain}
              onDomainChange={(d) => {
                if (d && d !== academicDomain) setAcademicDomain(d);
              }}
              value={faculty}
              onValueChange={setFaculty}
            />
          </div>

          <div className="space-y-2">
            <Label>Niveau *</Label>
            <StudyLevelCombobox value={studyYear} onValueChange={setStudyYear} />
          </div>

          <div className="space-y-2">
            <Label>Matricule <span className="text-muted-foreground">(optionnel)</span></Label>
            <Input 
              value={studentId} 
              onChange={(e) => setStudentId(e.target.value)} 
              maxLength={REGISTRATION_MAX_LENGTHS.studentId}
            />
          </div>

          <div className="space-y-2">
            <Label>Campus</Label>
            <Input 
              value={campus} 
              onChange={(e) => setCampus(e.target.value)} 
              maxLength={REGISTRATION_MAX_LENGTHS.campus}
              placeholder="Si plusieurs campus"
            />
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
