import { useState, useEffect } from "react";
import { Spinner as Loader2, Check } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MOOD_OPTIONS } from "@/constants/profileConstants";
import { useTranslation } from "react-i18next";

interface ProfileMoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMood?: string | null;
  onSaveMood: (mood: string) => Promise<void>;
  isSaving?: boolean;
}

export function ProfileMoodModal({
  open,
  onOpenChange,
  currentMood = "",
  onSaveMood,
  isSaving = false,
}: ProfileMoodModalProps) {
  const { t } = useTranslation("profile");
  const [moodText, setMoodText] = useState(currentMood || "");

  useEffect(() => {
    if (open) {
      setMoodText(currentMood || "");
    }
  }, [open, currentMood]);

  const handleSubmit = async () => {
    const value = moodText.trim();
    if (!value || isSaving) return;
    await onSaveMood(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg">😊</span>
            {t("mood.title")}
          </DialogTitle>
          <DialogDescription>
            {t("mood.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="mood">{t("mood.label")}</Label>
            <div className="relative mt-2">
              <Input
                id="mood"
                value={moodText}
                onChange={(e) => setMoodText(e.target.value.slice(0, 100))}
                placeholder={t("mood.placeholder")}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {moodText.length}/100
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("mood.hint")}
            </p>
          </div>

          <div>
            <Label>{t("mood.suggestions")}</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {MOOD_OPTIONS.map((mood) => (
                <Button
                  key={mood.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setMoodText(mood.label)}
                  className="text-xs h-auto py-2 px-3 justify-start"
                >
                  {mood.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setMoodText("");
            }}
          >
            {t("mood.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!moodText.trim() || isSaving}
            className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            {isSaving ? t("mood.updating") : t("mood.update")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
