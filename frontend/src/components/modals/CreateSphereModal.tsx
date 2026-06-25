import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SPHERE_CATEGORY_OPTIONS } from "@/constants/sphereCategories";
import { Loader2, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { createSphere } from "@/services/api";
import { SPHERE_TYPE_OPTIONS_V1, type SphereType } from "@/config/sphereFeatures";
import { cn } from "@/lib/utils";

interface SphereData {
  id: string;
  name: string;
  description: string;
  objective: string;
  category: string;
  sphere_type: string;
  color: string;
  isPrivate: boolean;
  requireApproval: boolean;
  allowMemberPosts: boolean;
  allowResourceSharing: boolean;
  allowTaskCreation: boolean;
  maxMembers: number;
  tags: string[];
  targetAudience: string;
  expectedDuration: string;
  collaborationType: string[];
}

interface CreateSphereModalProps {
  children?: React.ReactNode;
  onSphereCreated?: (sphereData: SphereData) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const colorOptions = [
  { value: "ocean", label: "Bleu → Violet", gradientClass: "from-blue-500 to-purple-500" },
  { value: "sunset", label: "Rose → Orange", gradientClass: "from-pink-500 to-orange-500" },
  { value: "mint", label: "Vert → Turquoise", gradientClass: "from-green-500 to-teal-500" },
  { value: "lime", label: "Jaune → Vert", gradientClass: "from-yellow-500 to-green-500" },
  { value: "ruby", label: "Rouge → Rose", gradientClass: "from-red-500 to-pink-500" },
  { value: "indigo", label: "Indigo → Bleu", gradientClass: "from-indigo-500 to-blue-500" },
] as const;

const sphereSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(50),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500),
  objective: z.string().max(300).optional(),
  category: z.enum(SPHERE_CATEGORY_OPTIONS.filter((c) => c.value !== "all").map(({ value }) => value) as [string, ...string[]], {
    errorMap: () => ({ message: "Veuillez sélectionner une catégorie valide" }),
  }),
  sphere_type: z.enum(["cours", "projet", "communaute", "club", "revision"] as [string, ...string[]], {
    errorMap: () => ({ message: "Veuillez sélectionner un type de sphère" }),
  }),
  color: z.enum(colorOptions.map(({ value }) => value) as [string, ...string[]], {
    errorMap: () => ({ message: "Veuillez sélectionner une couleur valide" }),
  }),
});

type Step = 0 | 1 | 2;

export function CreateSphereModal({ children, onSphereCreated, open: controlledOpen, onOpenChange: setControlledOpen }: CreateSphereModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);

  // Step 0 — type
  const [sphereType, setSphereType] = useState<SphereType | "">("");

  // Step 1 — basics
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");

  // Step 2 — advanced
  const [category, setCategory] = useState("");
  const [color, setColor] = useState<(typeof colorOptions)[number]["value"]>("ocean");
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
        category: sphereType === 'cours' ? 'academic' : category,
        sphere_type: sphereType,
        color,
      });

      setIsCreating(true);

      const sphereData = await createSphere({
        name: payload.name,
        description: payload.description,
        category: payload.category,
        sphere_type: payload.sphere_type,
        color: payload.color,
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
        duration: 4000,
      });

      resetForm();
      setOpen(false);
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
    setCategory("");
    setColor("ocean");
    setTargetAudience("");
    setExpectedDuration("");
    setCollaborationType([]);
    setIsCreating(false);
  };

  const stepTitles = [
    "Quel type de sphère ?",
    "Informations de base",
    "Paramètres avancés",
  ];

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm(); }}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((prev) => (prev - 1) as Step)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <DialogTitle>{stepTitles[step]}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Étape {step + 1} / 3</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex gap-1 mt-2">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  s <= step ? "campus-gradient" : "bg-muted"
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* ─── ÉTAPE 0 : Sélection du type ─── */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choisissez le type de sphère adapté à votre usage.
              </p>
              <div className="grid gap-3">
                {SPHERE_TYPE_OPTIONS_V1.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSphereType(option.value)}
                    className={cn(
                      "w-full text-left border-2 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200",
                      sphereType === option.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {/* Emoji dans un cercle avec gradient */}
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br",
                      option.gradient,
                      "shadow-sm"
                    )}>
                      {option.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </div>
                    {sphereType === option.value && (
                      <div className="ml-auto flex-shrink-0 h-5 w-5 rounded-full campus-gradient flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep(1)}
                  disabled={!sphereType}
                  className="campus-gradient text-white gap-2"
                >
                  Suivant <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── ÉTAPE 1 : Informations de base ─── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Nom */}
              <div>
                <Label htmlFor="name">Nom de la Sphère *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Projet IA 2025"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">{name.length}/50 caractères</p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre sphère et son contexte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  className="mt-2 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">{description.length}/500 caractères</p>
              </div>

              {/* Objectif */}
              <div>
                <Label htmlFor="objective">
                  Objectif <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <Textarea
                  id="objective"
                  placeholder="Quel est l'objectif principal ?"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  maxLength={300}
                  className="mt-2 min-h-[60px]"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!name || !description}
                  className="campus-gradient text-white gap-2"
                >
                  Suivant <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ─── ÉTAPE 2 : Options avancées + création ─── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Catégorie & Couleur (Catégorie masquée si cours) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sphereType !== 'cours' && (
                  <div>
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SPHERE_CATEGORY_OPTIONS.filter((cat) => cat.value !== "all").map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className={cn(sphereType === 'cours' ? "col-span-2" : "")}>
                  <Label htmlFor="color">Thème visuel *</Label>
                  <Select value={color} onValueChange={(val) => setColor(val as typeof color)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded bg-gradient-to-r ${option.gradientClass}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sphereType !== 'cours' && (
                <>
                  {/* Public cible et Durée */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="targetAudience">
                        Public cible <span className="text-muted-foreground">(optionnel)</span>
                      </Label>
                      <Select value={targetAudience} onValueChange={setTargetAudience}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Tous les étudiants" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetAudienceOptions.map((audience) => (
                            <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="expectedDuration">
                        Durée attendue <span className="text-muted-foreground">(optionnel)</span>
                      </Label>
                      <Select value={expectedDuration} onValueChange={setExpectedDuration}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Flexible" />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions.map((duration) => (
                            <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Types de collaboration */}
                  <div>
                    <Label>
                      Collaboration <span className="text-muted-foreground">(optionnel)</span>
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
                            "text-[10px] h-7 py-0 px-2",
                            collaborationType.includes(type)
                              ? "campus-gradient text-white border-none"
                              : "text-muted-foreground"
                          )}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => { resetForm(); setOpen(false); }}
                  disabled={isCreating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={(sphereType !== 'cours' && !category) || isCreating}
                  className="campus-gradient text-white hover:opacity-90 px-8"
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
