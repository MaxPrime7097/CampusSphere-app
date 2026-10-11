import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pen as PenLine, Upload, UsersThree as Users, Calendar, ChatCircle as MessageSquare, ArrowRight } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { getVerificationAccessStatus } from "@/utils/verification";
import { useToast } from "@/hooks/use-toast";
import { openVerificationModal } from "@/lib/events";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { cn } from "@/lib/utils";

const CreatePostModal = lazy(() =>
  import("@/components/modals/CreatePostModal").then((m) => ({ default: m.CreatePostModal }))
);
const UploadResourceModal = lazy(() =>
  import("@/components/modals/UploadResourceModal").then((m) => ({ default: m.UploadResourceModal }))
);
const CreateSphereModal = lazy(() =>
  import("@/components/modals/CreateSphereModal").then((m) => ({ default: m.CreateSphereModal }))
);
const QuickNewMessageModal = lazy(() =>
  import("@/components/modals/QuickNewMessageModal").then((m) => ({ default: m.QuickNewMessageModal }))
);

interface CreateHubModalProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPostCreated?: (postData: unknown) => void;
  onResourceUploaded?: (resource?: unknown) => void;
  onSphereCreated?: (sphereData: unknown) => void;
}

type ActionType = "post" | "resource" | "sphere" | "event" | "message";

export function CreateHubModal({
  children,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onPostCreated,
  onResourceUploaded,
  onSphereCreated,
}: CreateHubModalProps) {
  const { t } = useTranslation("feed");
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const { canPerformAction } = getVerificationAccessStatus(user);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
    }
  }, [open]);

  const handleActionClick = (type: ActionType) => {
    if (!canPerformAction) {
      toast({
        title: t("createHub.unverifiedTitle"),
        description: t("createHub.unverifiedDesc"),
        variant: "destructive",
        action: (
          <button
            type="button"
            className="text-xs font-bold underline cursor-pointer"
            onClick={() => openVerificationModal()}
          >
            {t("createHub.verifyAction")}
          </button>
        ),
      });
      return;
    }

    if (type === "event") {
      setSelectedAction(null);
      setOpen(false);
      navigate("/events/create");
      return;
    }

    setSelectedAction(type);
  };

  const handleCloseChildModal = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedAction(null);
      setOpen(false);
    }
  };

  const actions = [
    {
      id: "post" as const,
      title: t("createHub.actions.post.title"),
      description: t("createHub.actions.post.description"),
      icon: PenLine,
      iconColor: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      id: "resource" as const,
      title: t("createHub.actions.resource.title"),
      description: t("createHub.actions.resource.description"),
      icon: Upload,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "sphere" as const,
      title: t("createHub.actions.sphere.title"),
      description: t("createHub.actions.sphere.description"),
      icon: Users,
      iconColor: "text-violet-500 dark:text-violet-400",
      iconBg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      id: "event" as const,
      title: t("createHub.actions.event.title"),
      description: t("createHub.actions.event.description"),
      icon: Calendar,
      iconColor: "text-rose-500 dark:text-rose-400",
      iconBg: "bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "message" as const,
      title: t("createHub.actions.message.title"),
      description: t("createHub.actions.message.description"),
      icon: MessageSquare,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  return (
    <>
      <Dialog
        open={open && selectedAction === null}
        onOpenChange={(next) => {
          if (!next) {
            setSelectedAction(null);
            setOpen(false);
          }
        }}
      >
        {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{t("createHub.title")}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("createHub.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-2">
            {actions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleActionClick(item.id)}
                className="w-full text-left p-3 sm:p-3.5 rounded-xl border border-border/50 bg-background hover:bg-muted/40 hover:border-primary/40 transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                    item.iconBg,
                    item.iconColor
                  )}
                >
                  <item.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedAction(null);
                setOpen(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("createHub.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Modals opened upon selection */}
      {selectedAction === "post" && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CreatePostModal
            open={true}
            onOpenChange={handleCloseChildModal}
            onPostCreated={onPostCreated}
          />
        </Suspense>
      )}

      {selectedAction === "resource" && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <UploadResourceModal
            open={true}
            onOpenChange={handleCloseChildModal}
            onResourceUploaded={onResourceUploaded}
          />
        </Suspense>
      )}

      {selectedAction === "sphere" && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <CreateSphereModal
            open={true}
            onOpenChange={handleCloseChildModal}
            onSphereCreated={onSphereCreated as any}
          />
        </Suspense>
      )}

      {selectedAction === "message" && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <QuickNewMessageModal
            open={true}
            onOpenChange={handleCloseChildModal}
          />
        </Suspense>
      )}
    </>
  );
}
