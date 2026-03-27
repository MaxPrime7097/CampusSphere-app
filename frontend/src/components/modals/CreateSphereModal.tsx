import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Sparkles, Loader2, Check, Users, Lock, Globe, Shield, Bell, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface SphereData {
  id: string;
  name: string;
  description: string;
  objective: string;
  category: string;
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
  children: React.ReactNode;
  onSphereCreated?: (sphereData: SphereData) => void;
}

const sphereSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(50),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500),
  objective: z.string().min(10, "L'objectif doit contenir au moins 10 caractères").max(300),
  category: z.string().min(1, "Veuillez sélectionner une catégorie"),
  color: z.string().min(1, "Veuillez sélectionner une couleur"),
  targetAudience: z.string().min(1, "Veuillez sélectionner le public cible"),
  expectedDuration: z.string().min(1, "Veuillez sélectionner la durée attendue")
});

export function CreateSphereModal({ children, onSphereCreated }: CreateSphereModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState("from-blue-500 to-purple-500");
  const [requireApproval, setRequireApproval] = useState(false);
  const [allowMemberPosts, setAllowMemberPosts] = useState(true);
  const [allowResourceSharing, setAllowResourceSharing] = useState(true);
  const [allowTaskCreation, setAllowTaskCreation] = useState(true);
  const [maxMembers, setMaxMembers] = useState(100);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [collaborationType, setCollaborationType] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const categories = [
    "Général",
    "Académique", 
    "Projet",
    "Événement",
    "Étude",
    "Social",
    "Technologie",
    "Art",
    "Sport",
    "Autre"
  ];

  const colorOptions = [
    { value: "from-blue-500 to-purple-500", label: "Bleu → Violet", class: "bg-gradient-to-r from-blue-500 to-purple-500" },
    { value: "from-pink-500 to-orange-500", label: "Rose → Orange", class: "bg-gradient-to-r from-pink-500 to-orange-500" },
    { value: "from-green-500 to-teal-500", label: "Vert → Turquoise", class: "bg-gradient-to-r from-green-500 to-teal-500" },
    { value: "from-yellow-500 to-green-500", label: "Jaune → Vert", class: "bg-gradient-to-r from-yellow-500 to-green-500" },
    { value: "from-red-500 to-pink-500", label: "Rouge → Rose", class: "bg-gradient-to-r from-red-500 to-pink-500" },
    { value: "from-indigo-500 to-blue-500", label: "Indigo → Bleu", class: "bg-gradient-to-r from-indigo-500 to-blue-500" }
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
    "Autre"
  ];

  const durationOptions = [
    "Court terme (1-3 mois)",
    "Moyen terme (3-6 mois)",
    "Long terme (6-12 mois)",
    "Permanent",
    "Flexible"
  ];

  const collaborationTypes = [
    "Partage de ressources",
    "Collaboration sur projets",
    "Discussion et échanges",
    "Mentorat",
    "Études de groupe",
    "Événements",
    "Recherche collaborative"
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    } else if (tags.length >= 5) {
      toast({
        title: "Limite de tags atteinte",
        description: "Vous ne pouvez pas ajouter plus de 5 tags",
        variant: "destructive"
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const toggleCollaborationType = (type: string) => {
    if (collaborationType.includes(type)) {
      setCollaborationType(collaborationType.filter(t => t !== type));
    } else {
      setCollaborationType([...collaborationType, type]);
    }
  };

  const handleSubmit = async () => {
    try {
      sphereSchema.parse({ name, description, objective, category, color, targetAudience, expectedDuration });
      
      setIsCreating(true);
      
      // Simuler la création de sphère
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const sphereData = {
        id: Date.now().toString(),
        name,
        description,
        objective,
        category,
        color,
        isPrivate: false,
        requireApproval,
        allowMemberPosts,
        allowResourceSharing,
        allowTaskCreation,
        maxMembers,
        tags,
        targetAudience,
        expectedDuration,
        collaborationType,
        members: 1,
        status: "Actif",
        progress: 0,
        impactScore: 0,
        createdAt: new Date().toISOString(),
        admin: {
          name: "Vous",
          username: "current_user",
          avatar: "/placeholder-avatar.jpg"
        }
      };

      console.log("Creating sphere:", sphereData);

      if (onSphereCreated) {
        onSphereCreated(sphereData);
      }
      
      toast({
        title: "Sphère créée avec succès !",
        description: `${name} est maintenant disponible. Vous êtes automatiquement admin.`,
        duration: 4000,
      });

      resetForm();
      setIsOpen(false);
    } catch (error) {
      setIsCreating(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setObjective("");
    setCategory("");
    setColor("from-blue-500 to-purple-500");
    setRequireApproval(false);
    setAllowMemberPosts(true);
    setAllowResourceSharing(true);
    setAllowTaskCreation(true);
    setMaxMembers(100);
    setTags([]);
    setNewTag("");
    setTargetAudience("");
    setExpectedDuration("");
    setCollaborationType([]);
    setIsCreating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Créer une Sphère Collaborative
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name */}
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
            <p className="text-xs text-muted-foreground mt-1">
              {name.length}/50 caractères
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/500 caractères
            </p>
          </div>

          {/* Objectif */}
          <div>
            <Label htmlFor="objective">Objectif de la sphère *</Label>
            <Textarea
              id="objective"
              placeholder="Quel est l'objectif principal de cette sphère ? Que voulez-vous accomplir ensemble ?"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              maxLength={300}
              className="mt-2 min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {objective.length}/300 caractères
            </p>
          </div>

          <Separator />

          {/* Category & Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Couleur du thème *</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${option.value}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Public cible et Durée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetAudience">Public cible *</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner le public..." />
                </SelectTrigger>
                <SelectContent>
                  {targetAudienceOptions.map((audience) => (
                    <SelectItem key={audience} value={audience}>{audience}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expectedDuration">Durée attendue *</Label>
              <Select value={expectedDuration} onValueChange={setExpectedDuration}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner la durée..." />
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
            <Label>Types de collaboration *</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Sélectionnez les types d'activités que vous souhaitez dans cette sphère
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {collaborationTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={collaborationType.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCollaborationType(type)}
                  className={`text-xs h-auto py-2 px-3 ${
                    collaborationType.includes(type) 
                      ? "campus-gradient text-white" 
                      : "hover:bg-muted"
                  }`}
                >
                  {type}
                </Button>
              ))}
            </div>
            {collaborationType.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Veuillez sélectionner au moins un type de collaboration
              </p>
            )}
          </div>

          {/* Preview */}
          <div>
            <Label>Aperçu</Label>
            <div className="mt-2 relative h-24 rounded-lg overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-r ${color}`} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-xl text-center px-4">
                  {name || "Nom de votre sphère"}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <div>
              <Label>Tags (optionnel)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Ajouter un tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  maxLength={20}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  disabled={tags.length >= 5}
                >
                  Ajouter
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-xs"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Paramètres de confidentialité
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Approbation requise
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Valider manuellement chaque demande d'adhésion
                </p>
              </div>
              <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
            </div>

            <div>
              <Label htmlFor="maxMembers">Nombre maximum de membres</Label>
              <Input
                id="maxMembers"
                type="number"
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 100)}
                min="1"
                max="1000"
                className="w-32 mt-2"
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name || !description || !category || isCreating}
              className="campus-gradient text-white hover:opacity-90"
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
      </DialogContent>
    </Dialog>
  );
}
