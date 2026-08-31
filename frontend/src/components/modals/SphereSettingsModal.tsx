import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  Save, 
  Loader2, 
  Users,
  Globe,
  Shield,
  Trash2,
  Clock3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteSphere, extendSphereDuration, updateSphere } from "@/services/api";

interface SphereSettings {
  name: string;
  description: string;
  requireApproval: boolean;
  allowMemberPosts: boolean;
  allowResourceSharing: boolean;
  allowTaskCreation: boolean;
  maxMembers: number;
  objective?: string;
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
    allowMemberPosts: boolean;
    allowResourceSharing: boolean;
    allowTaskCreation: boolean;
    maxMembers: number;
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
  
  // État des paramètres
  const [settings, setSettings] = useState({
    name: "",
    description: "",
    requireApproval: false,
    allowMemberPosts: true,
    allowResourceSharing: true,
    allowTaskCreation: true,
    maxMembers: 100,
    duration: "Permanent",
    autoDeleteOnExpiry: false,
    objective: ""
  });


  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  // Initialiser les paramètres avec les données de la sphère
  useEffect(() => {
    if (sphereData) {
      setSettings({
        name: sphereData.name || "",
        description: sphereData.description || "",
        requireApproval: sphereData.requireApproval || false,
        allowMemberPosts: sphereData.allowMemberPosts ?? true,
        allowResourceSharing: sphereData.allowResourceSharing ?? true,
        allowTaskCreation: sphereData.allowTaskCreation ?? true,
        maxMembers: sphereData.maxMembers || 100,
        duration: sphereData.duration || "Permanent",
        autoDeleteOnExpiry: sphereData.autoDeleteOnExpiry ?? false,
        objective: sphereData.objective || ""
      });

    }
  }, [sphereData]);const durationOptions = [
    "Court terme (3 mois)",
    "Moyen terme (6 mois)",
    "Long terme (12 mois)",
    "Permanent",
    "Flexible"
  ];

  const updateSetting = (key: string, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
        type: sphereData.type,
        is_private: sphereData.isPrivate ?? false,
        require_approval: settings.requireApproval,
        objective: settings.objective,
        target_audience: sphereData.targetAudience,
        duration: settings.duration,
        auto_delete_on_expiry: settings.autoDeleteOnExpiry,
        collaboration_types: sphereData.collaborationTypes,
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
      const updatedSphere = await extendSphereDuration(sphereData.id, settings.duration);
      toast({
        title: "Durée prolongée",
        description: `Nouvelle expiration: ${updatedSphere?.expiresAt ? new Date(updatedSphere.expiresAt).toLocaleString() : "aucune"}`,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres de la sphère
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Informations générales
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => updateSetting("description", e.target.value)}
                placeholder="Décrivez votre sphère..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="objective">Objectif de la sphère *</Label>
              <Textarea
                id="objective"
                value={settings.objective}
                onChange={(e) => updateSetting("objective", e.target.value)}
                placeholder="Quel est l'objectif principal ?"
                rows={2}
                maxLength={300}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                L'objectif s'affiche en haut de la vue d'ensemble.
              </p>
            </div>
          </div>


          {/* Paramètres de confidentialité */}
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

              <div>
                <Label htmlFor="maxMembers">Nombre maximum de membres</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={settings.maxMembers}
                  onChange={(e) => updateSetting("maxMembers", parseInt(e.target.value) || 100)}
                  min="1"
                  max="1000"
                  className="w-32"
                />
              </div>
            </div>
          </div>

          {/* Permissions des membres */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Permissions des membres
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowResourceSharing">Partage de fichier</Label>
                  <p className="text-sm text-muted-foreground">
                    Les membres peuvent partager des fichiers
                  </p>
                </div>
                <Switch
                  id="allowResourceSharing"
                  checked={settings.allowResourceSharing}
                  onCheckedChange={(value) => updateSetting("allowResourceSharing", value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowTaskCreation">Création de tâches</Label>
                  <p className="text-sm text-muted-foreground">
                    Les membres peuvent créer des tâches
                  </p>
                </div>
                <Switch
                  id="allowTaskCreation"
                  checked={settings.allowTaskCreation}
                  onCheckedChange={(value) => updateSetting("allowTaskCreation", value)}
                />
              </div>
            </div>
          </div>


          {/* Expiration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Durée et expiration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Durée</Label>
                <Select value={settings.duration} onValueChange={(value) => updateSetting("duration", value)}>
                  <SelectTrigger>
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

              <div className="flex items-center justify-between rounded-md border p-3">
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
            </div>

            <div className="text-sm text-muted-foreground">
              Statut: {sphereData?.expiresAt ? (new Date(sphereData.expiresAt) < new Date() ? "Expirée" : "Active") : "Sans expiration"}
              {sphereData?.expiresAt ? ` · Expire le ${new Date(sphereData.expiresAt).toLocaleString()}` : ""}
            </div>

            <Button
              variant="secondary"
              onClick={handleExtendDuration}
              disabled={isExtending || isSaving || isDeleting}
            >
              {isExtending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock3 className="h-4 w-4 mr-2" />}
              Prolonger la durée
            </Button>
          </div>

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
              className="flex-1 campus-gradient text-white hover:opacity-90"
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

