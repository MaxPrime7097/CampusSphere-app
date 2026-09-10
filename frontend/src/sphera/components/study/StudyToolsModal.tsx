import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Loader2,
  Share2,
  AlertCircle,
  ChevronLeft,
  Check,
  Columns,
  BrainCircuit,
} from "lucide-react";
import { SpheraIcon } from "@/components/ui/sphera-icon";
import { FicheRevision } from "./FicheRevision";
import { QuizInteractif } from "./QuizInteractif";
import { Flashcards } from "./Flashcards";
import { QuotaIndicator } from "../QuotaIndicator";
import {
  generateStudyTools,
  generateFromUpload,
  shareStudySession,
  listSpheres,
} from "@/services/api";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

type ToolType = "fiche" | "quiz" | "flashcards";
type Step = "choose" | "loading" | "result" | "error";

// [BE-MIGRATION FE-02] Needs a `sphereFileId?: string | number | null` prop forwarded to
// generateStudyTools, so sphere files stop being sent as resource ids. — documentation/FRONTEND_CHANGES.md
interface StudyToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId?: string | number | null;
  resourceTitle?: string;
  uploadFile?: File | null;
  onSuccess?: (data: any) => void;
}

const TOOLS: { type: ToolType; icon: React.ReactNode; label: string; desc: string; color: string; bg: string }[] = [
  {
    type: "fiche",
    icon: <BookOpen className="h-6 w-6" />,
    label: "Fiche de révision",
    desc: "Points clés, définitions, formules résumés",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/30 hover:border-blue-500",
  },
  {
    type: "quiz",
    icon: <BrainCircuit className="h-6 w-6" />,
    label: "Quiz interactif",
    desc: "20 questions QCM avec timer et score",
    color: "text-[#ff9800]",
    bg: "bg-[#ff9800]/10 border-[#ff9800]/30 hover:border-[#ff9800]",
  },
  {
    type: "flashcards",
    icon: <Columns className="h-6 w-6" />,
    label: "Flashcards",
    desc: "20 cartes recto/verso pour mémoriser",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/30 hover:border-purple-500",
  },
];

export const StudyToolsModal: React.FC<StudyToolsModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceTitle,
  uploadFile,
  onSuccess,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [selectedTypes, setSelectedTypes] = useState<ToolType[]>([]);
  const [sessionData, setSessionData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [wasCached, setWasCached] = useState(false);

  // Partage
  const [showShare, setShowShare] = useState(false);
  const [spheres, setSpheres] = useState<any[]>([]);
  const [selectedSphere, setSelectedSphere] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const handleSelectTool = (type: ToolType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) return;
    setStep("loading");
    setErrorMsg("");
    try {
      let res;
      if (uploadFile) {
        res = await generateFromUpload(uploadFile, selectedTypes);
      } else if (resourceId) {
        res = await generateStudyTools(resourceId, selectedTypes);
      } else {
        throw new Error("Aucune source spécifiée pour la génération.");
      }
      
      const data = res?.data;
      if (!data) throw new Error("Réponse vide du serveur.");
      setSessionData(data.content);
      setSessionId(data.id);
      setWasCached(res.cached ?? false);
      
      if (onSuccess) onSuccess(data);
      onClose();
      navigate(`/sphera/sessions/${data.id}`);
    } catch (err: any) {
      const msg =
        err?.message ||
        "La génération a échoué. Vérifie ta connexion et réessaie.";
      setErrorMsg(msg);
      setStep("error");
    }
  };

  const handleBack = () => {
    setStep("choose");
    setSelectedTypes([]);
    setSessionData(null);
    setSessionId(null);
    setErrorMsg("");
    setShowShare(false);
    setShared(false);
  };

  const handleOpenShare = async () => {
    setShowShare(true);
    if (spheres.length === 0) {
      try {
        const mySpheres = await listSpheres({ my_spheres: "true" });
        setSpheres(mySpheres || []);
      } catch {
        toast({ title: "Impossible de charger les sphères", variant: "destructive" });
      }
    }
  };

  const handleShare = async () => {
    if (!sessionId || !selectedSphere) return;
    setSharing(true);
    try {
      await shareStudySession(sessionId, selectedSphere);
      setShared(true);
      toast({ title: "Session partagée avec succès !" });
    } catch (err: any) {
      toast({
        title: "Erreur de partage",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  const handleClose = () => {
    handleBack();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {step !== "choose" && (
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <SpheraIcon size="lg" />
              <div className="min-w-0">
                <DialogTitle className="text-base font-bold">
                  Réviser avec l'IA
                </DialogTitle>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {uploadFile ? uploadFile.name : resourceTitle}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ÉTAPE 1 : Choix du type */}
          {step === "choose" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choisis un ou plusieurs outils à générer depuis ce document.
              </p>
              <div className="grid gap-3">
                {TOOLS.map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => handleSelectTool(tool.type)}
                    className={cn(
                      "w-full flex items-center gap-4 border-2 rounded-2xl p-4 text-left transition-all duration-200",
                      tool.bg,
                      selectedTypes.includes(tool.type)
                        ? "ring-2 ring-[#ff9800] ring-offset-2 ring-offset-background"
                        : ""
                    )}
                  >
                    <div className={cn("flex-shrink-0", tool.color)}>{tool.icon}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm">{tool.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
                    </div>
                    {selectedTypes.includes(tool.type) && (
                      <div className="ml-auto flex-shrink-0 h-5 w-5 rounded-full bg-[#ff9800] flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-1">
                <QuotaIndicator />
              </div>

              <Button
                disabled={selectedTypes.length === 0}
                onClick={handleGenerate}
                className="w-full campus-gradient text-white gap-2 mt-2"
              >
                <SpheraIcon size="md" variant="white" />
                Générer{selectedTypes.length > 0 ? ` (${selectedTypes.length} outil${selectedTypes.length > 1 ? 's' : ''})` : ""}
              </Button>
            </div>
          )}

          {/* ÉTAPE 2 : Chargement */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-[#ff9800]/10 flex items-center justify-center">
                  <SpheraIcon size="xl" />
                </div>
                <Loader2 className="h-14 w-14 text-[#ff9800] animate-spin absolute inset-0" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  Génération en cours…
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  L'IA analyse ton document. Cela peut prendre quelques secondes.
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Résultat */}
          {step === "result" && sessionData && (
            <div className="space-y-5">
              {/* Badge "depuis cache" */}
              {wasCached && (
                <Badge
                  variant="secondary"
                  className="bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 border text-xs"
                >
                  ✓ Session déjà générée — rechargée instantanément
                </Badge>
              )}

              {/* Composants résultat avec Tabs si multiple */}
              {Object.keys(sessionData).length > 1 ? (
                <Tabs defaultValue={Object.keys(sessionData)[0]} className="w-full">
                  <TabsList className="w-full grid grid-cols-3 mb-4">
                    {Object.keys(sessionData).map((type) => (
                      <TabsTrigger key={type} value={type} className="capitalize">
                        {type}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.keys(sessionData).map((type) => (
                    <TabsContent key={type} value={type} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                      {type === "fiche" && <FicheRevision data={sessionData[type]} />}
                      {type === "quiz" && <QuizInteractif data={sessionData[type]} />}
                      {type === "flashcards" && <Flashcards data={sessionData[type]} />}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                Object.keys(sessionData).map((type) => (
                  <div key={type}>
                    {type === "fiche" && <FicheRevision data={sessionData[type]} />}
                    {type === "quiz" && <QuizInteractif data={sessionData[type]} />}
                    {type === "flashcards" && <Flashcards data={sessionData[type]} />}
                  </div>
                ))
              )}

              {/* Section partage */}
              <div className="border-t border-border pt-4">
                {!showShare ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-sm"
                    onClick={handleOpenShare}
                    disabled={shared}
                  >
                    {shared ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" /> Partagé !
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" /> Partager dans une sphère
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">
                      Partager dans une de tes sphères :
                    </p>
                    <div className="flex gap-2">
                      <Select
                        value={selectedSphere}
                        onValueChange={setSelectedSphere}
                      >
                        <SelectTrigger className="flex-1 h-9 text-sm">
                          <SelectValue placeholder="Choisir une sphère…" />
                        </SelectTrigger>
                        <SelectContent>
                          {spheres.length === 0 ? (
                            <SelectItem value="__none__" disabled>
                              Aucune sphère disponible
                            </SelectItem>
                          ) : (
                            spheres.map((s: any) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        className="campus-gradient text-white gap-1.5"
                        disabled={!selectedSphere || sharing || shared}
                        onClick={handleShare}
                      >
                        {sharing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : shared ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                        {shared ? "Partagé" : "Partager"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ÉTAPE : Erreur */}
          {step === "error" && (
            <div className="flex flex-col items-center py-10 gap-4 text-center">
              <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Génération échouée</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{errorMsg}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack}>
                  Retour
                </Button>
                <Button onClick={handleGenerate} className="campus-gradient text-white">
                  Réessayer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
