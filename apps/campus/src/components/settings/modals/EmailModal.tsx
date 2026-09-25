import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface EmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailForm: {
    currentEmail: string;
    newEmail: string;
    confirmEmail: string;
    phoneNumber: string;
  };
  onFormChange: (field: "currentEmail" | "newEmail" | "confirmEmail" | "phoneNumber", value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function EmailModal({
  open,
  onOpenChange,
  emailForm,
  onFormChange,
  onSubmit,
  isLoading,
}: EmailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email et authentification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
            <Input
              id="phoneNumber"
              placeholder="6XXXXXXXX"
              value={emailForm.phoneNumber}
              onChange={(e) => onFormChange("phoneNumber", e.target.value)}
            />
          </div>
          <Separator className="my-2" />
          <div>
            <Label htmlFor="currentEmail">Email actuel</Label>
            <Input
              id="currentEmail"
              type="email"
              value={emailForm.currentEmail}
              disabled
            />
          </div>
          <div>
            <Label htmlFor="newEmail">Nouvel email</Label>
            <Input
              id="newEmail"
              type="email"
              value={emailForm.newEmail}
              onChange={(e) => onFormChange("newEmail", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmEmail">Confirmer le nouvel email</Label>
            <Input
              id="confirmEmail"
              type="email"
              value={emailForm.confirmEmail}
              onChange={(e) => onFormChange("confirmEmail", e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={onSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
