import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Save, 
  Loader2, 
  CheckCircle,
  Users,
  Lock,
  Globe,
  Shield,
  Trash2,
  AlertTriangle,
  Palette,
  Bell,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SphereSettings {
  name: string;
  description: string;
  category: string;
  requireApproval: boolean;
  allowMemberPosts: boolean;
  allowResourceSharing: boolean;
  allowTaskCreation: boolean;
  maxMembers: number;
}

interface SphereSettingsModalProps {
  children: React.ReactNode;
  sphereData?: {
    id: string;
    name: string;
    description: string;
    category: string;
    requireApproval: boolean;
    allowMemberPosts: boolean;
    allowResourceSharing: boolean;
    allowTaskCreation: boolean;
    maxMembers: number;
  };
  onSettingsUpdated?: (updatedSettings: SphereSettings) => void;
  onSphereDeleted?: (sphereId: string) => void;
}

export function SphereSettingsModal({ 
  children, 
  sphereData, 
  onSettingsUpdated, 
  onSphereDeleted 
}: SphereSettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // État des paramètres
  const [settings, setSettings] = useState({
    name: "",
    description: "",
    category: "Général",
    requireApproval: false,
    allowMemberPosts: true,
    allowResourceSharing: true,
    allowTaskCreation: true,
    maxMembers: 100
  });

  const { toast } = useToast();

  // Initialiser les paramètres avec les données de la sphère
  useEffect(() => {
    if (sphereData) {
      setSettings({
        name: sphereData.name || "",
        description: sphereData.description || "",
        category: sphereData.category || "",
        requireApproval: sphereData.requireApproval || false,
        allowMemberPosts: sphereData.allowMemberPosts ?? true,
        allowResourceSharing: sphereData.allowResourceSharing ?? true,
        allowTaskCreation: sphereData.allowTaskCreation ?? true,
        maxMembers: sphereData.maxMembers || 100
      });
    }
  }, [sphereData]);

  const categories = [
    { title: "Général", value: "Général" },
    { title: "Académique", value: "Académique" },
    { title: "Projet", value: "Projet" },
    { title: "Événement", value: "Événement" },
    { title: "Étude", value: "Étude" },
    { title: "Social", value: "Social" },
    { title: "Technologie", value: "Technologie" },
    { title: "Art", value: "Art" },
    { title: "Sport", value: "Sport" },
    { title: "Autre", value: "Autre" }
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
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedSettings = {
        ...settings,
        id: sphereData?.id || Date.now().toString(),
        updatedAt: new Date().toISOString()
      };

      console.log("Updating sphere settings:", updatedSettings);

      if (onSettingsUpdated) {
        onSettingsUpdated(updatedSettings);
      }

      toast({
        title: "Paramètres sauvegardés !",
        description: "Les paramètres de la sphère ont été mis à jour",
        duration: 3000,
      });

      setIsOpen(false);

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

  const handleDeleteSphere = async () => {
    setIsDeleting(true);

    try {
      // Simuler la suppression
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Deleting sphere:", sphereData?.id);

      if (onSphereDeleted && sphereData?.id) {
        onSphereDeleted(sphereData.id);
      }

      toast({
        title: "Sphère supprimée",
        description: "La sphère a été supprimée avec succès",
        duration: 3000,
      });

      setIsOpen(false);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
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
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select value={settings.category} onValueChange={(value) => updateSetting("category", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              onClick={() => setIsOpen(false)}
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
