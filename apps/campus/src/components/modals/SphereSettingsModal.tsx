import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Gear as Settings,
  FloppyDisk as Save,
  Spinner as Loader2,
  Sphere,
  Shield,
  Trash as Trash2,
  Clock as Clock3,
  BookOpen,
  Target,
  UsersThree as Users,
  Sparkle as Sparkles,
  Kanban,
  CheckCircle,
} from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { deleteSphere, extendSphereDuration, updateSphere } from "@/services/api";
import { cn } from "@/lib/utils";

interface SphereSettings {
  name: string;
  description: string;
  requireApproval: boolean;
  objective?: string;
  targetAudience?: string;
  duration?: string;
  autoDeleteOnExpiry?: boolean;
  collaborationTypes?: string[];
}

interface SphereSettingsModalProps {
  children?: React.ReactNode;
  sphereData?: {
    id: string;
    name: string;
    description: string;
    type?: string;
    sphere_type?: string;
    sphereType?: string;
    isPrivate?: boolean;
    is_private?: boolean;
    requireApproval?: boolean;
    require_approval?: boolean;
    objective?: string;
    targetAudience?: string;
    target_audience?: string;
    duration?: string;
    expiresAt?: string | null;
    expires_at?: string | null;
    autoDeleteOnExpiry?: boolean;
    auto_delete_on_expiry?: boolean;
    collaborationTypes?: string[];
    collaboration_types?: string[];
  };
  onSettingsUpdated?: (updatedSettings: SphereSettings) => void;
  onSphereDeleted?: (sphereId: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SphereSettingsModal({ 
  children, 
  sphereData, 
  onSettingsUpdated, 
  onSphereDeleted,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: SphereSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [settings, setSettings] = useState<SphereSettings>({
    name: "",
    description: "",
    requireApproval: false,
    duration: "Permanent",
    autoDeleteOnExpiry: false,
    objective: "",
    targetAudience: "Tous les étudiants",
    collaborationTypes: []
  });

  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const rawType = (
    sphereData?.sphere_type ||
    sphereData?.sphereType ||
    sphereData?.type ||
    "communaute"
  ).toLowerCase();

  const sphereType: "cours" | "projet" | "communaute" =
    rawType === "cours" || rawType === "revision" || rawType === "study" || rawType === "academic"
      ? "cours"
      : rawType === "projet" || rawType === "project"
      ? "projet"
      : "communaute";

  useEffect(() => {
    if (sphereData) {
      setSettings({
        name: sphereData.name || "",
        description: sphereData.description || "",
        requireApproval: Boolean(
          sphereData.requireApproval ?? sphereData.require_approval ?? false
        ),
        duration: sphereData.duration || "Permanent",
        autoDeleteOnExpiry: Boolean(
          sphereData.autoDeleteOnExpiry ?? sphereData.auto_delete_on_expiry ?? false
        ),
        objective: sphereData.objective || "",
        targetAudience:
          sphereData.targetAudience || sphereData.target_audience || "Tous les étudiants",
        collaborationTypes:
          sphereData.collaborationTypes || sphereData.collaboration_types || [],
      });
    }
  }, [sphereData]);

  const durationOptions = [
    "Court terme (1-3 mois)",
    "Moyen terme (3-6 mois)",
    "Long terme (6-12 mois)",
    "Permanent",
    "Flexible"
  ];

  const targetAudienceOptions =
    sphereType === "cours"
      ? [
          "Tous les étudiants",
          "Licence 1 (L1)",
          "Licence 2 (L2)",
          "Licence 3 (L3)",
          "Master 1 (M1)",
          "Master 2 (M2)",
          "Classes Préparatoires / Ingénieur",
          "BTS / DUT",
          "Autre",
        ]
      : sphereType === "projet"
      ? [
          "Toute l'équipe du projet",
          "Étudiants en informatique",
          "Étudiants en business & gestion",
          "Étudiants en design & arts",
          "Étudiants en ingénierie",
          "Pluridisciplinaire",
          "Autre",
        ]
      : [
          "Tous les étudiants",
          "Étudiants en informatique",
          "Étudiants en business",
          "Étudiants en sciences",
          "Étudiants en arts",
          "Étudiants en médecine",
          "Étudiants en ingénierie",
          "Étudiants en droit",
          "Étudiants en économie",
          "Vie de campus & BDE",
          "Autre",
        ];

  const collaborationTypesList =
    sphereType === "cours"
      ? [
          "Partage de ressources",
          "Révisions de groupe",
          "Annales corrigées",
          "Questions & Entraide",
          "Fiches de synthèse",
        ]
      : sphereType === "projet"
      ? [
          "Collaboration sur projets",
          "Tableau Kanban",
          "Partage de fichiers & livrables",
          "Suivi des tâches",
          "Recherche collaborative",
        ]
      : [
          "Discussion et échanges",
          "Événements du campus",
          "Mentorat & Entraide",
          "Partage de bons plans",
          "Réseautage étudiant",
        ];

  const updateSetting = (key: keyof SphereSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleCollaborationType = (type: string) => {
    const current = settings.collaborationTypes || [];
    if (current.includes(type)) {
      updateSetting("collaborationTypes", current.filter(t => t !== type));
    } else {
      updateSetting("collaborationTypes", [...current, type]);
    }
  };

  const handleSave = async () => {
    if (!settings.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nom requis",
        description: "Le nom de la sphère est obligatoire",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (!sphereData?.id) {
        throw new Error("Identifiant de sphère manquant");
      }

      const payload = {
        name: settings.name.trim(),
        description: settings.description,
        sphere_type: sphereType,
        require_approval: settings.requireApproval,
        objective: settings.objective,
        target_audience: settings.targetAudience,
        duration: settings.duration,
        auto_delete_on_expiry: settings.autoDeleteOnExpiry,
        collaboration_types: settings.collaborationTypes,
      };

      const response = await updateSphere(sphereData.id, payload);
      const isSuccess = response?.success ?? true;
      if (!isSuccess) {
        throw new Error(response?.message || "Échec de la mise à jour de la sphère");
      }

      if (onSettingsUpdated) {
        onSettingsUpdated(settings);
      }

      toast({
        title: "Paramètres sauvegardés !",
        description: "Les paramètres de la sphère ont été mis à jour avec succès",
        duration: 3000,
      });

      setOpen(false);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtendDuration = async () => {
    if (!sphereData?.id) return;

    setIsExtending(true);
    try {
      const updatedSphere = await extendSphereDuration(sphereData.id, settings.duration || "Permanent");
      toast({
        title: "Durée prolongée",
        description: "Nouvelle expiration: " + (updatedSphere?.expiresAt ? new Date(updatedSphere.expiresAt).toLocaleString() : "aucune"),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de prolonger la durée (réservé au créateur).",
      });
    } finally {
      setIsExtending(false);
    }
  };

  const handleDeleteSphere = async () => {
    if (!sphereData?.id) return;

    setIsDeleting(true);
    try {
      await deleteSphere(sphereData.id);
      
      toast({
        title: "Sphère supprimée",
        description: "La sphère a été supprimée avec succès",
      });

      setOpen(false);
      setShowDeleteConfirm(false);

      if (onSphereDeleted) {
        onSphereDeleted(sphereData.id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de supprimer la sphère",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const expiresDate = sphereData?.expiresAt || sphereData?.expires_at;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de la sphère
          </DialogTitle>
          <DialogDescription className="sr-only">Modifier les paramètres de la sphère</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badge & Type Info Header */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
            {sphereType === "cours" && (
              <>
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Sphère de Cours</h4>
                  <p className="text-xs text-muted-foreground">Espace pédagogique dédié aux cours, TDs, annales & révisions</p>
                </div>
              </>
            )}
            {sphereType === "projet" && (
              <>
                <div className="h-10 w-10 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Sphère de Projet</h4>
                  <p className="text-xs text-muted-foreground">Gestion d'équipe, tableau Kanban, tâches et livrables</p>
                </div>
              </>
            )}
            {sphereType === "communaute" && (
              <>
                <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Communauté Étudiante</h4>
                  <p className="text-xs text-muted-foreground">Échanges libres, flux d'actualités et vie étudiante</p>
                </div>
              </>
            )}
          </div>

          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
              <Sphere className="h-4 w-4 text-primary" />
              Informations générales
            </h3>
            
            <div>
              <Label htmlFor="name" className="text-xs">Nom de la sphère *</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => updateSetting("name", e.target.value)}
                placeholder="Nom de votre sphère"
                maxLength={50}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-xs">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => updateSetting("description", e.target.value)}
                placeholder="Description concise de la sphère"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Section Spécifique au Type */}
          {sphereType === "cours" && (
            <div className="space-y-4 pt-2 border-t border-border/40">
              <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Configuration du cours & pédagogie
              </h3>

              <div>
                <Label htmlFor="courseObjective" className="text-xs">Objectifs pédagogiques & Syllabus</Label>
                <Textarea
                  id="courseObjective"
                  value={settings.objective}
                  onChange={(e) => updateSetting("objective", e.target.value)}
                  placeholder="Ex : Notions clés du semestre, programme des examens, chapitres abordés..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="targetAudience" className="text-xs">Niveau d'études & Promotion ciblée</Label>
                <Select value={settings.targetAudience} onValueChange={(value) => updateSetting("targetAudience", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionnez le niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetAudienceOptions.map((audience) => (
                      <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Modalités de révision & entraide</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {collaborationTypesList.map((type) => {
                    const isSelected = (settings.collaborationTypes || []).includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCollaborationType(type)}
                        className={cn(
                          "text-xs h-7 py-0 px-2.5 rounded-lg",
                          isSelected
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "text-muted-foreground"
                        )}
                      >
                        {type}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {sphereType === "projet" && (
            <div className="space-y-4 pt-2 border-t border-border/40">
              <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-500" />
                Configuration du projet & Kanban
              </h3>

              <div>
                <Label htmlFor="projectObjective" className="text-xs">Objectif & Livrable principal du projet</Label>
                <Textarea
                  id="projectObjective"
                  value={settings.objective}
                  onChange={(e) => updateSetting("objective", e.target.value)}
                  placeholder="Ex : Développer un MVP, soumettre le rapport de projet, préparer la soutenance..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience" className="text-xs">Profils & Équipe recherchée</Label>
                  <Select value={settings.targetAudience} onValueChange={(value) => updateSetting("targetAudience", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Profils ciblés" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAudienceOptions.map((audience) => (
                        <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration" className="text-xs">Durée estimée du projet</Label>
                  <Select value={settings.duration} onValueChange={(value) => updateSetting("duration", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((duration) => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {settings.duration !== "Permanent" && (
                <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/20">
                  <div>
                    <Label htmlFor="autoDeleteOnExpiry" className="text-xs font-medium">Suppression automatique à expiration</Label>
                    <p className="text-[11px] text-muted-foreground">Archiver la sphère et ses données lorsque l'échéance est atteinte</p>
                  </div>
                  <Switch
                    id="autoDeleteOnExpiry"
                    checked={settings.autoDeleteOnExpiry}
                    onCheckedChange={(value) => updateSetting("autoDeleteOnExpiry", value)}
                  />
                </div>
              )}

              {expiresDate && (
                <div className="text-xs text-muted-foreground flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                  <span>
                    Statut : {new Date(expiresDate) < new Date() ? "Expiré" : "En cours"} (Expire le {new Date(expiresDate).toLocaleDateString()})
                  </span>
                  {settings.duration !== "Permanent" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExtendDuration}
                      disabled={isExtending || isSaving || isDeleting}
                      className="h-7 text-xs gap-1"
                    >
                      {isExtending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock3 className="h-3 w-3" />}
                      Prolonger
                    </Button>
                  )}
                </div>
              )}

              <div>
                <Label className="text-xs">Outils & Modalités du projet</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {collaborationTypesList.map((type) => {
                    const isSelected = (settings.collaborationTypes || []).includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCollaborationType(type)}
                        className={cn(
                          "text-xs h-7 py-0 px-2.5 rounded-lg",
                          isSelected
                            ? "bg-violet-600 text-white hover:bg-violet-700"
                            : "text-muted-foreground"
                        )}
                      >
                        {type}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {sphereType === "communaute" && (
            <div className="space-y-4 pt-2 border-t border-border/40">
              <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-500" />
                Configuration de la communauté
              </h3>

              <div>
                <Label htmlFor="communityCharter" className="text-xs">Charte & Consignes de bienveillance</Label>
                <Textarea
                  id="communityCharter"
                  value={settings.objective}
                  onChange={(e) => updateSetting("objective", e.target.value)}
                  placeholder="Ex : Espace d'entraide et de partage respectueux, ouvert à toutes les promos..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience" className="text-xs">Public ciblé</Label>
                  <Select value={settings.targetAudience} onValueChange={(value) => updateSetting("targetAudience", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Public visé" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetAudienceOptions.map((audience) => (
                        <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration" className="text-xs">Durée de la communauté</Label>
                  <Select value={settings.duration} onValueChange={(value) => updateSetting("duration", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((duration) => (
                        <SelectItem key={duration} value={duration}>
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Activités communautaires</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {collaborationTypesList.map((type) => {
                    const isSelected = (settings.collaborationTypes || []).includes(type);
                    return (
                      <Button
                        key={type}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCollaborationType(type)}
                        className={cn(
                          "text-xs h-7 py-0 px-2.5 rounded-lg",
                          isSelected
                            ? "bg-sky-600 text-white hover:bg-sky-700"
                            : "text-muted-foreground"
                        )}
                      >
                        {type}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Confidentialité et accès */}
          <div className="space-y-4 pt-2 border-t border-border/40">
            <h3 className="text-sm font-semibold tracking-wide text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              Confidentialité & Accès
            </h3>
            
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card">
              <div>
                <Label htmlFor="requireApproval" className="text-xs font-medium">Approbation des adhésions requise</Label>
                <p className="text-[11px] text-muted-foreground">
                  Les nouveaux membres doivent être validés par un modérateur ou créateur avant d'accéder à la sphère
                </p>
              </div>
              <Switch
                id="requireApproval"
                checked={settings.requireApproval}
                onCheckedChange={(value) => updateSetting("requireApproval", value)}
              />
            </div>
          </div>

          {/* Zone de danger */}
          <div className="space-y-4 pt-4 border-t border-destructive/20">
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-xs font-semibold"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la sphère
              </Button>
            ) : (
              <div className="space-y-3 p-4 border border-destructive/30 rounded-xl bg-destructive/5">
                <p className="text-sm text-destructive font-semibold">
                  Êtes-vous sûr de vouloir supprimer cette sphère ?
                </p>
                <p className="text-xs text-muted-foreground">
                  Cette action est irréversible. Tous les messages, fichiers et tâches associés seront définitivement supprimés.
                </p>
                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="text-xs"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSphere}
                    disabled={isDeleting}
                    className="text-xs font-semibold"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Confirmer la suppression
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-2 border-t border-border/40">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setOpen(false)}
              disabled={isSaving || isDeleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!settings.name.trim() || isSaving || isDeleting}
              className="flex-1 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
