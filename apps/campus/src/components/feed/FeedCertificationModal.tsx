import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, SealCheck, Sparkle, Clock, ArrowRight } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { getVerificationAccessStatus } from "@/utils/verification";

interface FeedCertificationModalProps {
  onOpenVerificationModal: () => void;
}

const STORAGE_KEY = "cs_cert_modal_dismissed";

export function FeedCertificationModal({ onOpenVerificationModal }: FeedCertificationModalProps) {
  const { t } = useTranslation("feed");
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const status = getVerificationAccessStatus(user);
    // Ne pas afficher si déjà certifié ou si demande déjà soumise
    if (status.isVerified || status.hasPendingVerification) {
      return;
    }

    const dismissed = localStorage.getItem(STORAGE_KEY);
    const justOnboarded = localStorage.getItem("cs_just_onboarded");

    // Afficher si l'utilisateur vient de terminer l'onboarding ou n'a jamais vu la modale
    if (justOnboarded === "1" || !dismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        if (justOnboarded) {
          localStorage.removeItem("cs_just_onboarded");
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsOpen(false);
  };

  const handleStartVerification = () => {
    handleDismiss();
    onOpenVerificationModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md p-6 overflow-hidden">
        <DialogHeader className="text-center sm:text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Shield className="h-6 w-6" weight="fill" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {t("certificationModal.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("certificationModal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3 text-sm">
          <div className="p-3 bg-muted/40 rounded-xl border border-border/50 space-y-2">
            <p className="font-medium text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              {t("certificationModal.whyCertify")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <SealCheck className="h-4 w-4 text-primary shrink-0" weight="fill" />
                <span className="text-xs text-foreground/90">{t("certificationModal.benefit1")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkle className="h-4 w-4 text-primary shrink-0" weight="fill" />
                <span className="text-xs text-foreground/90">{t("certificationModal.benefit2")}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-primary shrink-0" weight="fill" />
                <span className="text-xs text-foreground/90">{t("certificationModal.benefit3")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full sm:w-auto order-2 sm:order-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {t("certificationModal.exploreFirst")}
          </Button>
          <Button
            onClick={handleStartVerification}
            className="w-full sm:flex-1 order-1 sm:order-2 campus-gradient text-white hover:opacity-90 text-xs font-medium"
          >
            {t("certificationModal.submitCard")}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
