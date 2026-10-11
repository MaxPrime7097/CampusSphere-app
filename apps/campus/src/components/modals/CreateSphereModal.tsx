import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

type Step = 0 | 1;

export function CreateSphereModal({ children, onSphereCreated, open: controlledOpen, onOpenChange: setControlledOpen }: CreateSphereModalProps) {
  const { t } = useTranslation("spheres");
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);

  const sphereSchema = z.object({
    name: z.string().min(3, t("createModal.validation.nameMin")).max(50),
    description: z.string().min(10, t("createModal.validation.descriptionMin")).max(500),
    objective: z.string().max(300).optional(),
    sphere_type: z.enum(["cours", "projet", "communaute", "club", "revision"] as [string, ...string[]], {
      errorMap: () => ({ message: t("createModal.validation.typeRequired") }),
    }),
  });

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
    { value: "all", label: t("createModal.targetAudiences.all") },
    { value: "cs", label: t("createModal.targetAudiences.cs") },
    { value: "business", label: t("createModal.targetAudiences.business") },
    { value: "science", label: t("createModal.targetAudiences.science") },
    { value: "arts", label: t("createModal.targetAudiences.arts") },
    { value: "medicine", label: t("createModal.targetAudiences.medicine") },
    { value: "engineering", label: t("createModal.targetAudiences.engineering") },
    { value: "law", label: t("createModal.targetAudiences.law") },
    { value: "economics", label: t("createModal.targetAudiences.economics") },
    { value: "other", label: t("createModal.targetAudiences.other") },
  ];

  const durationOptions = [
    { value: "short", label: t("createModal.durations.short") },
    { value: "medium", label: t("createModal.durations.medium") },
    { value: "long", label: t("createModal.durations.long") },
    { value: "permanent", label: t("createModal.durations.permanent") },
    { value: "flexible", label: t("createModal.durations.flexible") },
  ];

  const collaborationTypes = [
    { key: "resources", label: t("createModal.collaborationTypes.resources") },
    { key: "projects", label: t("createModal.collaborationTypes.projects") },
    { key: "discussion", label: t("createModal.collaborationTypes.discussion") },
    { key: "mentorship", label: t("createModal.collaborationTypes.mentorship") },
    { key: "study", label: t("createModal.collaborationTypes.study") },
    { key: "events", label: t("createModal.collaborationTypes.events") },
    { key: "research", label: t("createModal.collaborationTypes.research") },
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
        title: t("createModal.toasts.successTitle"),
        description: t("createModal.toasts.successDesc", { name }),
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
          title: t("createModal.toasts.validationError"),
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const message = (error as any)?.message || t("createModal.toasts.createError");
      toast({
        title: t("createModal.toasts.error"),
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

  const sphereTypeOptions = SPHERE_TYPE_OPTIONS_V1.map((opt) => ({
    ...opt,
    label: t(`createModal.types.${opt.value}.label`, { defaultValue: opt.label }),
    description: t(`createModal.types.${opt.value}.description`, { defaultValue: opt.description }),
  }));

  const selectedOption = sphereTypeOptions.find((o) => o.value === sphereType);

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
                title={t("createModal.changeType")}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <DialogTitle className="text-base sm:text-lg">
                {step === 0 ? t("createModal.step0Title") : selectedOption ? selectedOption.label : t("createModal.defaultTitle")}
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
                {t("createModal.step0Subtitle")}
              </p>

              <div className="grid gap-3">
                {sphereTypeOptions.map((option) => (
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
                  {t("createModal.cancel")}
                </Button>
              </div>
            </div>
          )}

          {/* ÉTAPE 1 : Formulaire de la sphère + Volet Options en bas */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Nom */}
              <div>
                <Label htmlFor="name" className="text-xs font-medium">{t("createModal.nameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("createModal.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={50}
                  className="mt-1 h-9 text-xs sm:text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{name.length}/50</p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-xs font-medium">{t("createModal.descriptionLabel")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("createModal.descriptionPlaceholder")}
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
                  {t("createModal.objectiveLabel")} <span className="text-muted-foreground font-normal">{t("createModal.optional")}</span>
                </Label>
                <Input
                  id="objective"
                  placeholder={t("createModal.objectivePlaceholder")}
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
                  <span>{t("createModal.options")}</span>
                  {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>

                {showAdvanced && (
                  <div className="space-y-3.5 p-3.5 mt-2 rounded-xl border border-border/50 bg-muted/10 campus-animate-slide-up">
                    {/* Public cible et Durée */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="targetAudience" className="text-xs font-medium">
                          {t("createModal.targetAudienceLabel")} <span className="text-muted-foreground font-normal">{t("createModal.optional")}</span>
                        </Label>
                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                          <SelectTrigger className="mt-1 h-9 text-xs">
                            <SelectValue placeholder={t("createModal.targetAudiences.all")} />
                          </SelectTrigger>
                          <SelectContent>
                            {targetAudienceOptions.map((audience) => (
                              <SelectItem key={audience.value} value={audience.label} className="text-xs">{audience.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="expectedDuration" className="text-xs font-medium">
                          {t("createModal.expectedDurationLabel")} <span className="text-muted-foreground font-normal">{t("createModal.optional")}</span>
                        </Label>
                        <Select value={expectedDuration} onValueChange={setExpectedDuration}>
                          <SelectTrigger className="mt-1 h-9 text-xs">
                            <SelectValue placeholder={t("createModal.durations.flexible")} />
                          </SelectTrigger>
                          <SelectContent>
                            {durationOptions.map((duration) => (
                              <SelectItem key={duration.value} value={duration.label} className="text-xs">{duration.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Types de collaboration */}
                    <div>
                      <Label className="text-xs font-medium">
                        {t("createModal.collaborationLabel")} <span className="text-muted-foreground font-normal">{t("createModal.optional")}</span>
                      </Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {collaborationTypes.map((type) => (
                          <Button
                            key={type.key}
                            type="button"
                            variant={collaborationType.includes(type.label) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCollaborationType(type.label)}
                            className={cn(
                              "text-[11px] h-7 py-0 px-2.5 rounded-full transition-colors",
                              collaborationType.includes(type.label)
                                ? "bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {type.label}
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
                  <span>{t("createModal.back")}</span>
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!name.trim() || !description.trim() || isCreating}
                  className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 text-xs sm:text-sm h-9 px-6"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("createModal.creating")}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t("createModal.create")}
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
