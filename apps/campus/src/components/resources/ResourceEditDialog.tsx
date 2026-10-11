import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ResourceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftTitle: string;
  onChangeTitle: (value: string) => void;
  draftDescription: string;
  onChangeDescription: (value: string) => void;
  isUpdating: boolean;
  onConfirm: () => void;
}

export function ResourceEditDialog({
  open,
  onOpenChange,
  draftTitle,
  onChangeTitle,
  draftDescription,
  onChangeDescription,
  isUpdating,
  onConfirm,
}: ResourceEditDialogProps) {
  const { t } = useTranslation("resources");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("detail.editTitle")}</DialogTitle>
          <DialogDescription>{t("detail.editDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={draftTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="min-h-[60px]"
            placeholder={t("detail.editTitlePlaceholder")}
          />
          <Textarea
            value={draftDescription}
            onChange={(e) => onChangeDescription(e.target.value)}
            className="min-h-[120px]"
            placeholder={t("detail.editDescPlaceholder")}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              {t("detail.cancel")}
            </Button>
            <Button onClick={onConfirm} disabled={isUpdating}>
              {isUpdating ? t("detail.saving") : t("detail.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
