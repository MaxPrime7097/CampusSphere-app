import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gear as Settings, FloppyDisk as Save, Spinner as Loader2, Sphere, Shield, Trash as Trash2, Clock as Clock3 } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { deleteSphere, extendSphereDuration, updateSphere } from "@/services/api";
import { normalizeSphereType } from "@/config/sphereFeatures";
import { cn } from "@/lib/utils";

interface SphereSettings {
  name: string;
  description: string;
  sphereType: string;
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
    isPrivate?: boolean;
    requireApproval: boolean;
    objective?: string;
    targetAudience?: string;
    duration?: string;
    expiresAt?: string | null;
    autoDeleteOnExpiry?: boolean;
    collaborationTypes?: string[];
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
    sphereType: "communaute",
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

  useEffect(() => {
    if (sphereData) {
      const data = sphereData as any;
      const rawType =
        data.sphere_type ||
        data.sphereType ||
        data.type ||
        data.category ||
        "communaute";
      setSettings({
        name: data.name || "",
        description: data.description || "",
        sphereType: normalizeSphereType(rawType),
        requireApproval: Boolean(data.require_approval ?? data.requireApproval ?? false),
        duration: data.duration || "Permanent",
        autoDeleteOnExpiry: Boolean(data.auto_delete_on_expiry ?? data.autoDeleteOnExpiry ?? false),
        objective: data.objective || "",
        targetAudience: data.target_audience ?? data.targetAudience ?? "Tous les étudiants",
        collaborationTypes: data.collaboration_types ?? data.collaborationTypes ?? []
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

  const collaborationTypesList = [
    "Partage de ressources",
    "Collaboration sur projets",
    "Discussion et échanges",
    "Mentorat",
    "Études de groupe",
    "Événements",
    "Recherche collaborative",
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
        sphere_type: settings.sphereType,
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
        description: "Les paramètres de la sphère ont été mis à jour",
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
    if (!sphereData?.id) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Identifiant de sphère manquant",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const response = await deleteSphere(sphereData.id);
      const isSuccess = response?.success ?? true;
      if (!isSuccess) {
        throw new Error(response?.message || "Échec de la suppression de la sphère");
      }

      if (onSphereDeleted) {
        onSphereDeleted(sphereData.id);
      }

      toast({
        title: "Sphère supprimée",
        description: "La sphère a été supprimée avec succès",
        duration: 3000,
      });

      setOpen(false);
      setShowDeleteConfirm(false);

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

  const showAdvancedOptions = normalizeSphereType(settings.sphereType) === "projet";

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
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sphere className="h-4 w-4" />
              Informations générales
            </h3>
            
            <div>
                <Label htmlFor="name">Nom de la sphère *</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => updateSetting("name", e.target.value)}
                  placeholder="Nom de votre sphère"
                  maxLength={50}
                />
            </div>

            <div>
              <Label htmlFor="sphereType">Type de sphère</Label>
              <Select
                value={settings.sphereType}
                onValueChange={(val) => updateSetting("sphereType", val)}
              >
                <SelectTrigger id="sphereType" className="mt-1">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cours">🎓 Cours & TD (Supports, Annonces, Révision IA)</SelectItem>
                  <SelectItem value="projet">🚀 Projet & Équipe (Kanban, Tâches, Copilote IA)</SelectItem>
                  <SelectItem value="communaute">👥 Communauté (Promo, Club, Actualités)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Définit les onglets actifs et les fonctionnalités (Kanban, Annonces, Révision Sphera).
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => updateSetting("description", e.target.value)}
                placeholder="Description de la sphère"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="objective">Objectif</Label>
              <Textarea
                id="objective"
                value={settings.objective}
                onChange={(e) => updateSetting("objective", e.target.value)}
                placeholder="Objectif de la sphère (optionnel)"
                rows={2}
              />
            </div>
          </div>

          {/* Confidentialité et accès */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Confidentialité et accès
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval">Approbation requise</Label>
                  <p className="text-sm text-muted-foreground">
                    Les demandes d'adhésion doivent être approuvées
                  </p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={settings.requireApproval}
                  onCheckedChange={(value) => updateSetting("requireApproval", value)}
                />
              </div>
            </div>
          </div>

          {/* Options Avancées (Public cible, Durée, Collaboration) */}
          {showAdvancedOptions && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Options avancées
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAudience">Public cible</Label>
                  <Select value={settings.targetAudience} onValueChange={(value) => updateSetting("targetAudience", value)}>
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
                  <Label htmlFor="duration">Durée</Label>
                  <Select value={settings.duration} onValueChange={(value) => updateSetting("duration", value)}>
                    <SelectTrigger className="mt-2">
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
                <Label>Collaboration</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {collaborationTypesList.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={(settings.collaborationTypes || []).includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCollaborationType(type)}
                      className={cn(
                        "text-[10px] h-7 py-0 px-2",
                        (settings.collaborationTypes || []).includes(type)
                          ? "bg-secondary text-secondary-foreground hover:bg-muted border border-border/60 border-none"
                          : "text-muted-foreground"
                      )}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {settings.duration !== "Permanent" && (
                <div className="flex items-center justify-between rounded-md border p-3 mt-4">
                  <div>
                    <Label htmlFor="autoDeleteOnExpiry">Suppression auto à expiration</Label>
                    <p className="text-xs text-muted-foreground">Supprime la sphère expirée automatiquement</p>
                  </div>
                  <Switch
                    id="autoDeleteOnExpiry"
                    checked={settings.autoDeleteOnExpiry}
                    onCheckedChange={(value) => updateSetting("autoDeleteOnExpiry", value)}
                  />
                </div>
              )}

              {(() => {
                const expiresAtValue = (sphereData as any)?.expires_at || sphereData?.expiresAt;
                return (
                  <div className="text-sm text-muted-foreground mt-2">
                    Statut: {expiresAtValue ? (new Date(expiresAtValue) < new Date() ? "Expirée" : "Active") : "Sans expiration"}
                    {expiresAtValue ? ` - Expire le ${new Date(expiresAtValue).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}
                  </div>
                );
              })()}

              {settings.duration !== "Permanent" && (
                <Button
                  variant="secondary"
                  onClick={handleExtendDuration}
                  disabled={isExtending || isSaving || isDeleting}
                  className="mt-2"
                >
                  {isExtending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock3 className="h-4 w-4 mr-2" />}
                  Prolonger la durée
                </Button>
              )}
            </div>
          )}

          {/* Zone de danger */}
          <div className="space-y-4 pt-4 border-t">
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la sphère
              </Button>
            ) : (
              <div className="space-y-3 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <p className="text-sm text-destructive font-medium">
                  Êtes-vous sûr de vouloir supprimer cette sphère ?
                </p>
                <p className="text-xs text-muted-foreground">
                  Cette action est irréversible. Tous les posts, ressources et tâches seront supprimés.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSphere}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Confirmer la suppression
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isSaving || isDeleting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={!settings.name.trim() || isSaving || isDeleting}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


