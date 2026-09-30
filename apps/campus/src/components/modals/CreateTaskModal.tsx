import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createTask } from "@/services/api";

interface CreateTaskModalProps {
  children?: React.ReactNode;
  onTaskCreated?: (taskData: any) => void;
  sphereMembers?: Array<{ id: string; userId?: string; name: string; username: string; avatar?: string }>;
  sphereId: string | number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PRIORITIES = [
  { value: "low",    label: "Basse",   color: "bg-green-500" },
  { value: "medium", label: "Moyenne", color: "bg-yellow-500" },
  { value: "high",   label: "Haute",   color: "bg-red-500" },
];

export function CreateTaskModal({ children, onTaskCreated, sphereMembers = [], sphereId, open: controlledOpen, onOpenChange: setControlledOpen }: CreateTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState(() => {
    // Attempt to default to current user if they are a member
    const currentUserStr = localStorage.getItem("user");
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        const currentUserId = String(currentUser.id);
        const isMember = sphereMembers.some(m => String(m.userId || m.id) === currentUserId);
        if (isMember) return currentUserId;
      } catch (e) { /* ignore */ }
    }
    return "";
  });
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const reset = () => {
    setTitle(""); setDescription(""); setDueDate("");
    setPriority("medium"); setAssignedTo("");
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Titre requis", description: "Le titre doit contenir au moins 3 caractères." });
      return;
    }
    if (title.trim().length < 3) {
      toast({ variant: "destructive", title: "Titre trop court", description: "Le titre doit contenir au moins 3 caractères." });
      return;
    }
    if (!assignedTo) {
      toast({ variant: "destructive", title: "Assignation requise", description: "Veuillez assigner la tâche à un membre." });
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = await createTask({
        title: title.trim(),
        description: description.trim() || title.trim(),
        due_date: dueDate || undefined,
        priority,
        sphere_id: Number(sphereId),
        assigned_to: assignedTo,
        impact_points: priority === "high" ? 20 : priority === "medium" ? 15 : 10,
      } as any);

      onTaskCreated?.(taskData);
      toast({ title: "Tâche créée !", description: `"${title}" a été ajoutée`, duration: 3000 });
      reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error?.message || "Impossible de créer la tâche" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" /> Créer une tâche
          </DialogTitle>
          <DialogDescription>Ajoutez une tâche à votre sphère collaborative.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="task-title">Titre *</Label>
            <Input id="task-title" placeholder="Ex: Implémenter la recherche" value={title}
              onChange={(e) => setTitle(e.target.value)} maxLength={100} className="mt-1" />
          </div>

          <div>
            <Label htmlFor="task-desc">Description <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Textarea id="task-desc" placeholder="Décrivez la tâche..." value={description}
              onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.color}`} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due">Échéance</Label>
              <Input id="task-due" type="date" value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Assigner à *</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Sélectionner un membre" />
              </SelectTrigger>
              <SelectContent>
                {sphereMembers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Aucun membre disponible</div>
                ) : sphereMembers.map((m) => (
                  <SelectItem key={m.id} value={m.userId || m.id}>
                    {m.name} {m.username ? `(@${m.username})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !assignedTo || isSubmitting}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
            >
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création...</>
                : <><CheckCircle className="h-4 w-4 mr-2" />Créer</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
