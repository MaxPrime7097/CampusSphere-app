import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Calendar, 
  User, 
  Flag, 
  Loader2, 
  CheckCircle,
  Clock,
  AlertCircle,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { createTask } from "@/services/api";

interface TaskData {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  priority: string;
  dueDate?: string;
  tags: string[];
}

interface CreateTaskModalProps {
  children: React.ReactNode;
  onTaskCreated?: (taskData: TaskData) => void;
  sphereMembers?: Array<{ id: string; name: string; username: string; avatar: string }>;
  sphereId: string | number;
}

export function CreateTaskModal({ children, onTaskCreated, sphereMembers = [], sphereId }: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [category, setCategory] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  // Catégories disponibles
  const categories = [
    "Développement",
    "Design",
    "Recherche",
    "Documentation",
    "Test",
    "Marketing",
    "Organisation",
    "Autre"
  ];

  const priorities = [
    { value: "low", label: "Faible", color: "bg-green-500" },
    { value: "medium", label: "Moyenne", color: "bg-yellow-500" },
    { value: "high", label: "Élevée", color: "bg-orange-500" },
    { value: "urgent", label: "Urgente", color: "bg-red-500" }
  ];

  const taskSchema = z.object({
    title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
    description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
    dueDate: z.string().min(1, "La date d'échéance est requise"),
    priority: z.string().min(1, "La priorité est requise"),
    category: z.string().min(1, "La catégorie est requise")
  });

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

  const handleSubmit = async () => {
    const validation = taskSchema.safeParse({
      title,
      description,
      dueDate,
      priority,
      category
    });

    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Validation échouée",
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const descriptionParts = [
        description.trim(),
        `Catégorie: ${category}`,
        estimatedHours ? `Temps estimé: ${estimatedHours}h` : null,
        tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
      ].filter(Boolean);

      const taskData = await createTask({
        title: title.trim(),
        description: descriptionParts.join("\n\n"),
        due_date: dueDate,
        priority,
        sphere_id: sphereId,
        assigned_to: assignedTo && assignedTo !== "unassigned" ? assignedTo : undefined,
        impact_points: priority === "urgent" ? 30 : priority === "high" ? 20 : priority === "medium" ? 15 : 10,
      } as any);

      if (onTaskCreated) {
        onTaskCreated(taskData);
      }

      toast({
        title: "Tâche créée !",
        description: `"${title}" a été ajoutée avec succès`,
        duration: 3000,
      });

      resetForm();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création de la tâche",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setAssignedTo("");
    setCategory("");
    setEstimatedHours("");
    setTags([]);
    setNewTag("");
    setIsOpen(false);
  };

  const getPriorityColor = (priorityValue: string) => {
    const priority = priorities.find(p => p.value === priorityValue);
    return priority?.color || "bg-gray-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Créer une nouvelle tâche
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle tâche pour organiser le travail dans votre sphère collaborative.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de base */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de la tâche *</Label>
              <Input
                id="title"
                placeholder="Ex: Implémenter la fonction de recherche"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez la tâche en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/1000 caractères
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priorité *</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${p.color}`}></div>
                          {p.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Planification */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Planification
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Date d'échéance *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="estimatedHours">Heures estimées</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  placeholder="8"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Attribution */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Attribution
            </h3>
            
            <div>
              <Label htmlFor="assignedTo">Assigner à</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Non assigné</SelectItem>
                  {sphereMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                          {member.name[0]}
                        </div>
                        {member.name} (@{member.username})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tags</h3>
            
            <div className="flex gap-2">
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
            
            <div className="flex flex-wrap gap-2">
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

          {/* Aperçu de la tâche */}
          {title && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Aperçu</h3>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{title}</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`}></div>
                    <span className="text-xs text-muted-foreground">
                      {priorities.find(p => p.value === priority)?.label}
                    </span>
                  </div>
                </div>
                {description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {category && (
                    <span className="flex items-center gap-1">
                      <Flag className="h-3 w-3" />
                      {category}
                    </span>
                  )}
                  {dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(dueDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {estimatedHours && (
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {estimatedHours}h
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title || !description || !dueDate || !priority || !category || isSubmitting}
              className="flex-1 campus-gradient text-white hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Créer la tâche
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
