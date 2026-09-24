import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface ResourceAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export function ResourceAuthModal({
  open,
  onOpenChange,
  onNavigateLogin,
  onNavigateRegister,
}: ResourceAuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary fill-current" />
            Rejoignez CampusSphere
          </DialogTitle>
          <DialogDescription>
            Vous devez être connecté pour télécharger ou sauvegarder des ressources.
            Créez un compte gratuitement pour accéder à tout le contenu.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={onNavigateRegister} className="campus-gradient text-white w-full">
            Créer un compte gratuitement
          </Button>
          <Button variant="outline" onClick={onNavigateLogin} className="w-full">
            Se connecter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
