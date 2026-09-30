import { Suspense, lazy } from "react";
import { User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";

const EditAccountModal = lazy(() =>
  import("@/components/modals/EditAccountModal").then((module) => ({
    default: module.EditAccountModal,
  }))
);

interface SettingsAccountCardProps {
  personalInfo: {
    firstName: string;
    lastName: string;
    username: string;
    bio: string;
  };
  isEditAccountOpen: boolean;
  onOpenEditAccount: (open: boolean) => void;
  onRefreshUser: () => Promise<void>;
  onOpenPasswordModal: () => void;
  onOpenEmailModal: () => void;
  onToast: (opts: { title: string }) => void;
}

export function SettingsAccountCard({
  personalInfo,
  isEditAccountOpen,
  onOpenEditAccount,
  onRefreshUser,
  onOpenPasswordModal,
  onOpenEmailModal,
  onToast,
}: SettingsAccountCardProps) {
  return (
    <div className="py-5 border-b border-border/40 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center text-muted-foreground flex-shrink-0">
          <User className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Compte</h2>
          <p className="text-xs text-muted-foreground">Informations personnelles et sécurité d'accès</p>
        </div>
      </div>
      <div className="divide-y divide-border/40 pt-1">
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto py-3 px-2 text-sm hover:bg-muted/40 font-normal rounded-lg transition-colors"
            onClick={() => onOpenEditAccount(true)}
          >
            <span className="text-foreground/90">Informations personnelles</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
          {isEditAccountOpen && (
            <Suspense fallback={<ModalLoadingFallback />}>
              <EditAccountModal
                open={isEditAccountOpen}
                onOpenChange={onOpenEditAccount}
                initialData={personalInfo}
                onSuccess={async () => {
                  await onRefreshUser();
                  onToast({ title: "Informations mises à jour" });
                }}
              />
            </Suspense>
          )}
        </div>
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto py-3 px-2 text-sm hover:bg-muted/40 font-normal rounded-lg transition-colors"
            onClick={onOpenPasswordModal}
          >
            <span className="text-foreground/90">Mot de passe</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto py-3 px-2 text-sm hover:bg-muted/40 font-normal rounded-lg transition-colors"
            onClick={onOpenEmailModal}
          >
            <span className="text-foreground/90">Email et authentification</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}

