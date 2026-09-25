import { Suspense, lazy } from "react";
import { User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card className="campus-card">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <User className="h-4 w-4 md:h-5 md:w-5" />
          Compte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-4 md:p-6 pt-0">
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base"
            onClick={() => onOpenEditAccount(true)}
          >
            <span>Informations personnelles</span>
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
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
        <Separator />
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base"
            onClick={onOpenPasswordModal}
          >
            <span>Mot de passe</span>
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
        <Separator />
        <div>
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base"
            onClick={onOpenEmailModal}
          >
            <span>Email et authentification</span>
            <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
