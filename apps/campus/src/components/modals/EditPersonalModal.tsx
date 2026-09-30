import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Loader2, Check, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CityCombobox } from "@/components/forms/CityCombobox";
import { LanguageCombobox } from "@/components/forms/LanguageCombobox";
import { updateUserProfile } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { formatSlugToLabel } from "@/lib/utils";

interface EditPersonalModalProps {
  children?: React.ReactNode;
  initialData: {
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    town: string;
    languages: string[];
  };
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditPersonalModal({ children, initialData, onSuccess, open: controlledOpen, onOpenChange: setControlledOpen }: EditPersonalModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber);
  const [dateOfBirth, setDateOfBirth] = useState(initialData.dateOfBirth);
  const [town, setTown] = useState(initialData.town);
  const [languages, setLanguages] = useState<string[]>(initialData.languages);
  const [newLanguageInput, setNewLanguageInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth,
        town,
        language: languages,
      });

      toast({
        title: "Succès",
        description: "Informations personnelles mises à jour",
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

  const addLanguage = (lang: string) => {
    if (lang && !languages.includes(lang)) {
      setLanguages([...languages, lang]);
      setNewLanguageInput("");
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Modifier les infos personnelles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <Input 
                type="date"
                value={dateOfBirth} 
                onChange={(e) => setDateOfBirth(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                placeholder="6xx xxx xxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ville</Label>
            <CityCombobox value={town} onValueChange={setTown} />
          </div>

          <div className="space-y-2">
            <Label>Langues</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <LanguageCombobox 
                  value={newLanguageInput} 
                  onValueChange={setNewLanguageInput}
                  onSearchValueChange={setNewLanguageInput}
                  onLanguageAdd={addLanguage}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => addLanguage(newLanguageInput)}
                disabled={!newLanguageInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {languages.map((lang, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  {formatSlugToLabel(lang)}
                  <button onClick={() => removeLanguage(lang)} className="hover:bg-muted-foreground/20 rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
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
