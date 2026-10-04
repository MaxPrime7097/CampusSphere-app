import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner as Loader2, Check, ArrowLeft, ArrowRight, BookOpen, Target, Globe, UsersFour, CaretDown as ChevronDown, CaretUp as ChevronUp, SlidersHorizontal } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { createSphere } from "@/services/api";
import { SPHERE_TYPE_OPTIONS_V1, type SphereType } from "@/config/sphereFeatures";
import { cn } from "@/lib/utils";

import type { Sphere } from "@/types";

interface CreateSphereModalProps {
  children?: React.ReactNode;
  onSphereCreated?: (sphereData: Sphere) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const sphereSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(50),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500),
  objective: z.string().max(300).optional(),
  sphere_type: z.enum(["cours", "projet", "communaute", "club", "revision"] as [string, ...string[]], {
    errorMap: () => ({ message: "Veuillez sélectionner un type de sphère" }),
  }),
});

type Step = 0 | 1;

export function CreateSphereModal({ children, onSphereCreated, open: controlledOpen, onOpenChange: setControlledOpen }: CreateSphereModalProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);

  // Basics
  const [sphereType, setSphereType] = useState<SphereType | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");

  // Advanced options (collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [targetAudience, setTargetAudience] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [collaborationType, setCollaborationType] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const targetAudienceOptions = [
    "Tous les étudiants",
    "Étudiants en informatique",
    "Étudiants en business",
    "Étudiants en sciences",
    "Étudiants en arts",
    "Étudiants en médecine",
    "Étudiants en ingénierie",
    "Étudiants en droit",
    "Étudiants en économie",
    "Autre",
  ];

  const durationOptions = [
    "Court terme (1-3 mois)",
    "Moyen terme (3-6 mois)",
    "Long terme (6-12 mois)",
    "Permanent",
    "Flexible",
  ];

  const collaborationTypes = [
    "Partage de ressources",
    "Collaboration sur projets",
    "Discussion et échanges",
    "Mentorat",
    "Études de groupe",
    "Événements",
    "Recherche collaborative",
  ];

  const toggleCollaborationType = (type: string) => {
    if (collaborationType.includes(type)) {
      setCollaborationType(collaborationType.filter((t) => t !== type));
    } else {
      setCollaborationType([...collaborationType, type]);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = sphereSchema.parse({
        name: name.trim(),
        description: description.trim(),
        objective: objective.trim() || undefined,
        sphere_type: sphereType,
      });

      setIsCreating(true);

      const sphereData = await createSphere({
        name: payload.name,
        description: payload.description,
        sphere_type: payload.sphere_type,
        is_private: false,
        require_approval: false,
        objective: payload.objective || "Objectif non défini",
        target_audience: sphereType === 'cours' ? "Étudiants" : (targetAudience || "Tous les étudiants"),
        duration: sphereType === 'cours' ? "Permanent" : (expectedDuration || "Flexible"),
        collaboration_types: sphereType === 'cours' ? ["Partage de ressources"] : (collaborationType.length > 0 ? collaborationType : ["Discussion et échanges"]),
      });

      if (onSphereCreated) {
        onSphereCreated(sphereData);
      }

      toast({
        title: "Sphère créée avec succès !",
        description: `${name} est maintenant disponible.`,
        duration: 3000,
      });

      const createdId = (sphereData as any)?.id ?? (sphereData as any)?.data?.id;
      resetForm();
      setOpen(false);

      if (createdId) {
        navigate(`/spheres/${createdId}`);
      } else {
        navigate('/spheres');
      }
    } catch (error) {
      setIsCreating(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const message = (error as any)?.message || "Impossible de créer la sphère";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setStep(0);
    setSphereType("");
    setName("");
    setDescription("");
    setObjective("");
    setTargetAudience("");
    setExpectedDuration("");
    setCollaborationType([]);
    setShowAdvanced(false);
    setIsCreating(false);
  };

  const selectedOption = SPHERE_TYPE_OPTIONS_V1.find((o) => o.value === sphereType);

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm(); }}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(0)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                title="Changer de type"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <DialogTitle className="text-base sm:text-lg">
                {step === 0 ? "Quel type de sphère ?" : selectedOption ? selectedOption.label : "Créer une sphère"}
              </DialogTitle>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1.5 mt-2">
            {[0, 1].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  s <= step ? "bg-muted-foreground/60" : "bg-muted"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* ÉTAPE 0 : Les 3 propositions (Cours, Projet, Communauté) */}
          {step === 0 && (
            <div className="space-y-3.5">
              <p className="text-xs text-muted-foreground">
                Choisissez le type d'espace adapté à votre usage :
              </p>

              <div className="grid gap-3">
                {SPHERE_TYPE_OPTIONS_V1.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSphereType(option.value);
                      setStep(1);
                    }}
                    className={cn(
                      "w-full text-left border rounded-xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-all duration-200 group hover:border-primary/40 hover:bg-muted/30 cursor-pointer",
                      sphereType === option.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                    )}
                  >
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br shadow-sm",
                      option.gradient
                    )}>
                      {option.iconName === 'book-open' && <BookOpen className="h-5 w-5" />}
                      {option.iconName === 'target' && <Target className="h-5 w-5" />}
                      {(option.iconName === 'users-four' || option.iconName === 'globe') && <UsersFour className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{option.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { resetForm(); setOpen(false); }}
                  className="text-xs sm:text-sm h-9 text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* ÉTAPE 1 : Formulaire de la sphère + Volet Options en bas */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Nom */}
              <div>
                <Label htmlFor="name" className="text-xs font-medium">Nom de la Sphère *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Algorithmique L2, Projet Web 2025..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="mt-1 h-9 text-xs sm:text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{name.length}/50</p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-xs font-medium">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre sphère et son contexte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  className="mt-1 min-h-[75px] resize-none text-xs sm:text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{description.length}/500</p>
              </div>

              {/* Objectif */}
              <div>
                <Label htmlFor="objective" className="text-xs font-medium">
                  Objectif <span className="text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="objective"
                  placeholder="Ex: Réussir l'examen final, Développer un MVP..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  maxLength={300}
                  className="mt-1 h-9 text-xs sm:text-sm"
                />
              </div>

              {/* Volet repliable Options en bas */}
              <div className="pt-1">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={cn(
                    "text-xs font-semibold tracking-tight h-8 px-3 rounded-full gap-1.5 transition-all border border-border/40",
                    showAdvanced ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Options</span>
                  {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>

                {showAdvanced && (
                  <div className="space-y-3.5 p-3.5 mt-2 rounded-xl border border-border/50 bg-muted/10 campus-animate-slide-up">
                    {/* Public cible et Durée */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="targetAudience" className="text-xs font-medium">
                          Public cible <span className="text-muted-foreground font-normal">(optionnel)</span>
                        </Label>
                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                          <SelectTrigger className="mt-1 h-9 text-xs">
                            <SelectValue placeholder="Tous les étudiants" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetAudienceOptions.map((audience) => (
                              <SelectItem key={audience} value={audience} className="text-xs">{audience}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="expectedDuration" className="text-xs font-medium">
                          Durée attendue <span className="text-muted-foreground font-normal">(optionnel)</span>
                        </Label>
                        <Select value={expectedDuration} onValueChange={setExpectedDuration}>
                          <SelectTrigger className="mt-1 h-9 text-xs">
                            <SelectValue placeholder="Flexible" />
                          </SelectTrigger>
                          <SelectContent>
                            {durationOptions.map((duration) => (
                              <SelectItem key={duration} value={duration} className="text-xs">{duration}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Types de collaboration */}
                    <div>
                      <Label className="text-xs font-medium">
                        Collaboration <span className="text-muted-foreground font-normal">(optionnel)</span>
                      </Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {collaborationTypes.map((type) => (
                          <Button
                            key={type}
                            type="button"
                            variant={collaborationType.includes(type) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCollaborationType(type)}
                            className={cn(
                              "text-[11px] h-7 py-0 px-2.5 rounded-full transition-colors",
                              collaborationType.includes(type)
                                ? "bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex justify-between items-center pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(0)}
                  className="text-xs gap-1.5 h-9 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Retour</span>
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !description.trim() || isCreating}
                  className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 text-xs sm:text-sm h-9 px-6"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Créer la Sphère
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
