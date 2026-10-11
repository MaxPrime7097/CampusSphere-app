import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lightning as Zap } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("resources");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" weight="fill" />
            {t("detail.authModalTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("detail.authModalDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={onNavigateRegister} className="campus-gradient text-white w-full">
            {t("detail.registerFree")}
          </Button>
          <Button variant="outline" onClick={onNavigateLogin} className="w-full">
            {t("detail.login")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
