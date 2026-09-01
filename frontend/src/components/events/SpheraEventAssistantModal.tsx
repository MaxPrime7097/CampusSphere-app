import { useState } from "react";
import { Sparkles, Wand2, Loader2, Check, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { generateSpheraEventDraft } from "@/services/eventService";
import type { EventCategory, SpheraEventDraft } from "@/types/events.types";

interface SpheraEventAssistantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: EventCategory;
  onApply: (draft: SpheraEventDraft) => void;
}

const PRESET_IDEAS = [
  {
    title: "Welcome Ceremony 2026",
    category: "party" as EventCategory,
    prompt: "Soirée d'intégration Welcome Week IUC avec DJ set, stands des sphères et remise de packs étudiants.",
  },
  {
    title: "MathScam 2026 — Concours",
    category: "competition" as EventCategory,
    prompt: "Grand tournoi d'énigmes mathématiques et algorithmiques avec bourses et PC portables à gagner.",
  },
  {
    title: "Hackathon Campus IA 48H",
    category: "hackathon" as EventCategory,
    prompt: "Marathon de code sur 48h pour créer des outils d'IA au service de l'éducation sur le campus.",
  },
  {
    title: "Conférence Tech & Carrières",
    category: "conference" as EventCategory,
    prompt: "Masterclass avec des ingénieurs sur l'insertion professionnelle et les technologies cloud & IA.",
  },
];

export function SpheraEventAssistantModal({
  open,
  onOpenChange,
  category,
  onApply,
}: SpheraEventAssistantModalProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>(category || "party");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<SpheraEventDraft | null>(null);

  const handleGenerate = async (presetPrompt?: string, presetCat?: EventCategory) => {
    const textToUse = presetPrompt || prompt;
    const catToUse = presetCat || selectedCategory;

    setIsGenerating(true);
    try {
      const draft = await generateSpheraEventDraft(textToUse, catToUse);
      setGeneratedDraft(draft);
    } catch (err) {
      console.error("Sphera event generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedDraft) {
      onApply(generatedDraft);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <SpheraIcon size="md" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Rédiger avec l'Assistant Sphera
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Générez instantanément un titre percutant, une description attrayante et un programme complet.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Quick presets */}
          <div>
            <span className="text-xs font-semibold text-muted-foreground block mb-2">
              💡 Idées d'événements rapides :
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_IDEAS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(preset.prompt);
                    setSelectedCategory(preset.category);
                    handleGenerate(preset.prompt, preset.category);
                  }}
                  className="rounded-lg border border-border/70 bg-card hover:bg-accent px-2.5 py-1.5 text-xs text-left transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Décrivez les grandes lignes de votre événement :
            </label>
            <Textarea
              placeholder="Ex: Cérémonie d'accueil des étudiants de première année avec DJ, jeux, présentation des clubs et remise des prix..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="text-xs rounded-xl"
            />
          </div>

          {/* Action button */}
          <Button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sphera rédige votre événement...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Générer la description & le programme
              </>
            )}
          </Button>

          {/* Preview of generated content */}
          {generatedDraft && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[11px] font-bold border-primary/40 text-primary">
                  ✨ Proposition Sphera
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleGenerate()}
                  className="h-7 text-xs text-muted-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Régénérer
                </Button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">{generatedDraft.title}</h4>
                <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto pr-1">
                  {generatedDraft.description}
                </p>
              </div>

              {generatedDraft.suggestedSchedule && (
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[11px] font-bold text-foreground block mb-1">
                    📅 Programme suggéré :
                  </span>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {generatedDraft.suggestedSchedule}
                  </p>
                </div>
              )}

              <Button
                onClick={handleApply}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl mt-2"
              >
                <Check className="h-4 w-4 mr-2" />
                Insérer dans le formulaire
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
