import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ResourceDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
}

export function ResourceDeleteDialog({
  open,
  onOpenChange,
  isDeleting,
  onConfirm,
}: ResourceDeleteDialogProps) {
  const { t } = useTranslation("resources");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("detail.deleteTitle")}</DialogTitle>
          <DialogDescription>{t("detail.deleteDesc")}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t("detail.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t("detail.deletingBtn") : t("detail.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
