import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ArrowLeft,
  Check,
  Upload,
  X,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_CATEGORY_OPTIONS } from "@/constants/eventCategories";
import { getEventById, updateEvent } from "@/services/eventService";
import { getUserSpheres } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { EventCategory, UpdateEventInput } from "@/types/events.types";

export function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateEventInput>({
    title: "",
    description: "",
    category: "party",
    startDate: "",
    endDate: "",
    location: "",
    isOnline: false,
    onlineLink: "",
    maxAttendees: undefined,
    sphereId: undefined,
  });

  const { data: event, isLoading: isFetching } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventById(id!),
    enabled: Boolean(id),
  });

  const { data: userSpheres = [] } = useQuery({
    queryKey: ["user-spheres"],
    queryFn: () => getUserSpheres(),
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        category: event.category,
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        location: event.location || "",
        isOnline: Boolean(event.isOnline),
        onlineLink: event.onlineLink || "",
        maxAttendees: event.maxAttendees || undefined,
        sphereId: event.sphereId || undefined,
      });
      if (event.coverImage) {
        setCoverPreview(event.coverImage);
      }
    }
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateEventInput) => updateEvent(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({
        title: "Modifications enregistrées ! ✨",
        description: "L'événement a été mis à jour avec succès.",
      });
      navigate(`/events/${id}`);
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de mettre à jour l'événement.",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast({ title: "Titre requis", variant: "destructive" });
      return;
    }

    updateMutation.mutate({
      ...formData,
      coverImage: coverFile || coverPreview,
      startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    });
  };

  if (isFetching) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/events/${id}`)}
          className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour aux détails
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground font-automata">
          Modifier l'événement
        </h1>
        <p className="text-xs text-muted-foreground">
          Mettez à jour les informations, la date, le lieu ou l'affiche de l'événement.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-3">
          <Label className="text-xs font-bold text-foreground block">Catégorie</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EVENT_CATEGORY_OPTIONS.filter((c) => c.value !== "all").map((cat) => {
              const isSelected = formData.category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value as EventCategory })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border/60 bg-muted/30 hover:bg-muted/60"
                  }`}
                >
                  <span className="text-xs font-bold text-foreground block">{cat.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Description */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-bold text-foreground">
              Titre de l'événement *
            </Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="rounded-xl font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="rounded-xl text-xs"
            />
          </div>
        </div>

        {/* Dates & Location */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date et heure de début</Label>
              <Input
                type="datetime-local"
                value={formData.startDate || ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date et heure de fin</Label>
              <Input
                type="datetime-local"
                value={formData.endDate || ""}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground">Événement en ligne</Label>
            </div>
            <Switch
              checked={formData.isOnline}
              onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked })}
            />
          </div>

          {formData.isOnline ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lien de visioconférence</Label>
              <Input
                value={formData.onlineLink || ""}
                onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Lieu physique</Label>
              <Input
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-4">
          <Label className="text-xs font-bold text-foreground block">Affiche de l'événement</Label>
          {coverPreview ? (
            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-border">
              <img src={coverPreview} alt="Aperçu" className="h-full w-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => {
                  setCoverFile(null);
                  setCoverPreview(null);
                }}
                className="absolute top-3 right-3 h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-border p-4 cursor-pointer">
              <Upload className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs font-bold">Changer l'affiche</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-sm shadow-md"
        >
          <Check className="h-5 w-5 mr-2" />
          {updateMutation.isPending ? "Sauvegarde..." : "Enregistrer les modifications"}
        </Button>
      </form>
    </div>
  );
}
