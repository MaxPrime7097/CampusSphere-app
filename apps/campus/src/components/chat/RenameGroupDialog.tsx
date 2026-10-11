import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner as Loader2 } from "@phosphor-icons/react";

interface RenameGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  isUpdating: boolean;
}

export function RenameGroupDialog({
  open,
  onOpenChange,
  value,
  onChange,
  onConfirm,
  isUpdating,
}: RenameGroupDialogProps) {
  const { t } = useTranslation("messages");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t("renameDialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("renameDialog.placeholder")}
            maxLength={50}
            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              {t("renameDialog.cancel")}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!value.trim() || isUpdating}
              className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("renameDialog.rename")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
