import { Lock, Spinner as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordForm: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  onFormChange: (field: "currentPassword" | "newPassword" | "confirmPassword", value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function PasswordModal({
  open,
  onOpenChange,
  passwordForm,
  onFormChange,
  onSubmit,
  isLoading,
}: PasswordModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Changer le Mot de Passe
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => onFormChange("currentPassword", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => onFormChange("newPassword", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => onFormChange("confirmPassword", e.target.value)}
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
                  Modification...
                </>
              ) : (
                "Modifier"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
