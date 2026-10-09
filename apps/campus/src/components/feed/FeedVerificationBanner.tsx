import { useAuth } from "@/contexts/AuthContext";
import { getVerificationAccessStatus } from "@/utils/verification";
import { Shield, Hourglass, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface FeedVerificationBannerProps {
  onOpenVerificationModal: () => void;
}

export function FeedVerificationBanner({ onOpenVerificationModal }: FeedVerificationBannerProps) {
  const { t } = useTranslation("feed");
  const { user } = useAuth();
  const status = getVerificationAccessStatus(user);

  // Si le compte est déjà officiellement vérifié, aucune bannière n'est nécessaire
  if (status.isVerified) {
    return null;
  }

  // Cas 1 : Demande de justificatif déjà envoyée et en cours d'examen par l'équipe
  if (status.hasPendingVerification) {
    return (
      <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full shrink-0 mt-0.5 sm:mt-0">
            <Hourglass className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-foreground">
                {t("verificationBanner.underReviewTitle")}
              </h3>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/20">
                {t("verificationBanner.pendingBadge")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("verificationBanner.underReviewDesc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Cas 2 : Période d'accès découverte active (24h de grâce)
  if (status.isWithinGracePeriod) {
    return (
      <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full shrink-0 mt-0.5 sm:mt-0">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-amber-950 dark:text-amber-100">
                {t("verificationBanner.discoveryTitle", { hours: status.hoursRemainingInGrace })}
              </h3>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/40 text-amber-700 dark:text-amber-300">
                {t("verificationBanner.freeBadge")}
              </Badge>
            </div>
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80 mt-0.5">
              {t("verificationBanner.discoveryDesc")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onOpenVerificationModal}
          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white shadow-sm shrink-0 text-xs font-medium h-8"
        >
          {t("verificationBanner.certifyAccount")}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // Cas 3 : Période de grâce de 24h expirée sans certification
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start sm:items-center gap-3">
        <div className="p-2 bg-red-500/20 rounded-full shrink-0 mt-0.5 sm:mt-0">
          <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-red-950 dark:text-red-100">
            {t("verificationBanner.readOnlyTitle")}
          </h3>
          <p className="text-xs text-red-900/80 dark:text-red-200/80 mt-0.5">
            {t("verificationBanner.readOnlyDesc")}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={onOpenVerificationModal}
        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-sm shrink-0 text-xs font-medium h-8"
      >
        {t("verificationBanner.certifyAccount")}
        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
