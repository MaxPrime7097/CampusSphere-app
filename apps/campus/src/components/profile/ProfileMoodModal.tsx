import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MOOD_OPTIONS } from "@/constants/profileConstants";

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
            Changer votre mood
          </DialogTitle>
          <DialogDescription>
            Partagez votre état d'esprit actuel avec votre communauté.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="mood">Mood du moment (max 100 car.)</Label>
            <div className="relative mt-2">
              <Input
                id="mood"
                value={moodText}
                onChange={(e) => setMoodText(e.target.value.slice(0, 100))}
                placeholder="Comment vous sentez-vous ?"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {moodText.length}/100
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Exprimez votre état d'esprit actuel librement.
            </p>
          </div>

          <div>
            <Label>Suggestions</Label>
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
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!moodText.trim() || isSaving}
            className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
            {isSaving ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
