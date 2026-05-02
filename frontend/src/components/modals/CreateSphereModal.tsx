import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SPHERE_CATEGORY_OPTIONS } from "@/constants/sphereCategories";
import { Sparkles, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { createSphere } from "@/services/api";

interface SphereData {
  id: string;
  name: string;
  description: string;
  objective: string;
  category: string;
  type: string;
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

const typeOptions = [
  { value: "study", label: "Étude" },
  { value: "project", label: "Projet" },
  { value: "club", label: "Club" },
  { value: "event", label: "Événement" },
  { value: "networking", label: "Réseautage" },
  { value: "other", label: "Autre" },
] as const;

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
  type: z.enum(typeOptions.map(({ value }) => value) as [string, ...string[]], {
    errorMap: () => ({ message: "Veuillez sélectionner un type valide" }),
  }),
  color: z.enum(colorOptions.map(({ value }) => value) as [string, ...string[]], {
    errorMap: () => ({ message: "Veuillez sélectionner une couleur valide" }),
  }),
});

export function CreateSphereModal({ children, onSphereCreated }: CreateSphereModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
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

  const toggleCollaborationType = (type: string) => {
    if (collaborationType.includes(type)) {
      setCollaborationType(collaborationType.filter(t => t !== type));
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
        category,
        type,
        color,
      });
      
      setIsCreating(true);

      const sphereData = await createSphere({
        name: payload.name,
        description: payload.description,
        category: payload.category,
        type: payload.type,
        color: payload.color,
        is_private: false,
        require_approval: false,
        objective: payload.objective || "Objectif non défini",
        target_audience: targetAudience || "Tous les étudiants",
        duration: expectedDuration || "Flexible",
        collaboration_types: collaborationType.length > 0 ? collaborationType : ["Discussion et échanges"],
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
      setIsOpen(false);
    } catch (error) {
      setIsCreating(false);
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive"
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
    setName("");
    setDescription("");
    setObjective("");
    setCategory("");
    setType("");
    setColor("ocean");
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
            <Label htmlFor="objective">Objectif de la sphère <span className="text-muted-foreground">(optionnel)</span></Label>
            <Textarea
              id="objective"
              placeholder="Quel est l'objectif principal ?"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              maxLength={300}
              className="mt-2 min-h-[60px]"
            />
          </div>

          <Separator />

          {/* Category, Type & Color */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Thème *</Label>
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

          {/* Public cible et Durée */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetAudience">Public cible <span className="text-muted-foreground">(optionnel)</span></Label>
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
              <Label htmlFor="expectedDuration">Durée attendue <span className="text-muted-foreground">(optionnel)</span></Label>
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
            <Label>Collaboration <span className="text-muted-foreground">(optionnel)</span></Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {collaborationTypes.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={collaborationType.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleCollaborationType(type)}
                  className={`text-[10px] h-7 py-0 px-2 ${
                    collaborationType.includes(type) 
                      ? "campus-gradient text-white border-none" 
                      : "text-muted-foreground"
                  }`}
                >
                  {type}
                </Button>
              ))}
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
              disabled={!name || !description || !category || !type || isCreating}
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
      </DialogContent>
    </Dialog>
  );
}
