import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, Loader2, Check, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateUserProfile } from "@/services/api";

interface EditAccountModalProps {
  children: React.ReactNode;
  initialData: {
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
  };
  onSuccess?: () => void;
}

export function EditAccountModal({ children, initialData, onSuccess }: EditAccountModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState(initialData.firstName);
  const [lastName, setLastName] = useState(initialData.lastName);
  const [username, setUsername] = useState(initialData.username);
  const [bio, setBio] = useState(initialData.bio);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        username: username,
        bio: bio,
      });

      toast({
        title: "Succès",
        description: "Informations de compte mises à jour",
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Informations du compte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input 
                id="firstName"
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                placeholder="Votre prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input 
                id="lastName"
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input 
              id="username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio"
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Parlez-nous de vous..."
              className="resize-none"
              rows={4}
            />
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
