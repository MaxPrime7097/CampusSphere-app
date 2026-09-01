import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Upload,
  Sparkles,
  Users,
  Check,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Wand2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpheraEventAssistantModal } from "@/components/events/SpheraEventAssistantModal";
import { EVENT_CATEGORY_OPTIONS } from "@/constants/eventCategories";
import { createEvent } from "@/services/eventService";
import { getUserSpheres } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { EventCategory, CreateEventInput, SpheraEventDraft } from "@/types/events.types";

export function EventCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isSpheraOpen, setIsSpheraOpen] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateEventInput>({
    title: "",
    description: "",
    category: "party",
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * (24 * 2 + 3)).toISOString().slice(0, 16),
    location: "Amphi B2, IUC Douala",
    isOnline: false,
    onlineLink: "",
    maxAttendees: undefined,
    isPublic: true,
    sphereId: undefined,
  });

  // Fetch spheres user is a member of (to attach event)
  const { data: userSpheres = [] } = useQuery({
    queryKey: ["user-spheres"],
    queryFn: () => getUserSpheres(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateEventInput) => createEvent(payload),
    onSuccess: (created) => {
      toast({
        title: "Événement créé avec succès ! 🎉",
        description: `"${created.title}" est maintenant en ligne.`,
      });
      navigate(`/events/${created.id}`);
    },
    onError: (err: any) => {
      toast({
        title: "Erreur lors de la création",
        description: err?.message || "Impossible de publier l'événement.",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image trop lourde",
          description: "Veuillez choisir une image de moins de 5 Mo.",
          variant: "destructive",
        });
        return;
      }
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const removeCoverImage = () => {
    setCoverFile(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
  };

  const handleApplySpheraDraft = (draft: SpheraEventDraft) => {
    setFormData((prev) => ({
      ...prev,
      title: draft.title || prev.title,
      description: draft.suggestedSchedule
        ? `${draft.description}\n\n**📅 Programme :**\n${draft.suggestedSchedule}`
        : draft.description,
      category: draft.category || prev.category,
    }));
    toast({
      title: "Contenu Sphera appliqué ! ✨",
      description: "Le titre et la description ont été renseignés.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Titre obligatoire",
        description: "Veuillez indiquer un titre pour votre événement.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        title: "Date requise",
        description: "Veuillez sélectionner une date de début.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      coverImage: coverFile,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/events")}
          className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour aux événements
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsSpheraOpen(true)}
          className="rounded-xl text-xs font-bold border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          ✨ Rédiger avec Sphera
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground font-automata">
          Créer un événement
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Publiez une soirée d'intégration, un hackathon, le MathScam ou une conférence pour la communauté universitaire.
        </p>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Selector */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card shadow-xs space-y-3">
            <Label className="text-xs font-bold text-foreground block">
              1. Catégorie de l'événement *
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {EVENT_CATEGORY_OPTIONS.filter((c) => c.value !== "all").map((cat) => {
                const isSelected = formData.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value as EventCategory })}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                        : "border-border/60 bg-muted/30 hover:bg-muted/60"
                    }`}
                  >
                    <span className="text-xs font-bold text-foreground">{cat.shortLabel}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card shadow-xs space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold text-foreground">
                2. Titre de l'événement *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Welcome Ceremony 2026 / MathScam IUC..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl text-sm font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-bold text-foreground">
                  Description détaillée
                </Label>
                <button
                  type="button"
                  onClick={() => setIsSpheraOpen(true)}
                  className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Générer avec l'IA
                </button>
              </div>
              <Textarea
                id="description"
                placeholder="Présentez l'événement, les objectifs, les prix à gagner, le code vestimentaire ou le programme..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="rounded-xl text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Dates & Location */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card shadow-xs space-y-4">
            <Label className="text-xs font-bold text-foreground block">
              3. Date, Heure & Lieu *
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                  Date et heure de début *
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                  Date et heure de fin (optionnel)
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate || ""}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Online Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-foreground">Événement en ligne</Label>
                <p className="text-[11px] text-muted-foreground">
                  Cochez si l'événement a lieu via Google Meet, Zoom ou Discord.
                </p>
              </div>
              <Switch
                checked={formData.isOnline}
                onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked })}
              />
            </div>

            {formData.isOnline ? (
              <div className="space-y-1.5 animate-in fade-in">
                <Label htmlFor="onlineLink" className="text-xs text-muted-foreground">
                  Lien de la visioconférence
                </Label>
                <Input
                  id="onlineLink"
                  placeholder="https://meet.google.com/..."
                  value={formData.onlineLink || ""}
                  onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            ) : (
              <div className="space-y-1.5 animate-in fade-in">
                <Label htmlFor="location" className="text-xs text-muted-foreground">
                  Lieu physique sur le campus
                </Label>
                <Input
                  id="location"
                  placeholder="Ex: Amphi B2, IUC Douala / Campus Lab"
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>
            )}
          </div>

          {/* Banner & Cover Image */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card shadow-xs space-y-4">
            <Label className="text-xs font-bold text-foreground block">
              4. Affiche / Bannière de l'événement (Kana / Graphisme)
            </Label>

            {coverPreview ? (
              <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-border">
                <img src={coverPreview} alt="Aperçu" className="h-full w-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={removeCoverImage}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-4 text-center">
                <Upload className="h-8 w-8 text-primary mb-2" />
                <span className="text-xs font-bold text-foreground">
                  Téléverser une affiche / bannière
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  PNG, JPG jusqu'à 5 Mo
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Additional Options: Max Attendees, Sphere, Visibility */}
          <div className="p-6 rounded-3xl border border-border/70 bg-card shadow-xs space-y-4">
            <Label className="text-xs font-bold text-foreground block">
              5. Options & Liaison de sphère
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="maxAttendees" className="text-xs text-muted-foreground">
                  Nombre max de participants (optionnel)
                </Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  placeholder="Illimité"
                  value={formData.maxAttendees || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxAttendees: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="rounded-xl text-xs"
                />
              </div>

              {/* Sphere attachment */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Lier à une sphère étudiante (optionnel)
                </Label>
                <Select
                  value={formData.sphereId ? String(formData.sphereId) : "none"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, sphereId: val === "none" ? undefined : val })
                  }
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Aucune sphère liée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune (Événement général)</SelectItem>
                    {userSpheres.map((sphere: any) => (
                      <SelectItem key={sphere.id} value={String(sphere.id)}>
                        {sphere.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full rounded-2xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg py-6 text-sm"
          >
            <Check className="h-5 w-5 mr-2" />
            {createMutation.isPending ? "Publication en cours..." : "Publier l'événement"}
          </Button>
        </div>

        {/* Right Col: Live Preview on desktop */}
        <div className="space-y-4">
          <div className="sticky top-20 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Aperçu en direct de la carte :
            </span>

            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md">
              <div className="relative h-40 w-full overflow-hidden bg-muted">
                {coverPreview ? (
                  <img src={coverPreview} alt="Aperçu" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center opacity-85">
                    <Sparkles className="h-12 w-12 text-white/40" />
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <Badge className="bg-background/90 text-foreground font-bold text-[10px]">
                    {formData.category.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="font-bold text-foreground text-sm line-clamp-1">
                  {formData.title || "Titre de l'événement"}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {formData.description || "Description de l'événement..."}
                </p>
                <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex justify-between">
                  <span>{formData.isOnline ? "En ligne" : formData.location || "Campus"}</span>
                  <span className="text-primary font-bold">1 participant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Sphera AI Assistant Modal */}
      <SpheraEventAssistantModal
        open={isSpheraOpen}
        onOpenChange={setIsSpheraOpen}
        category={formData.category}
        onApply={handleApplySpheraDraft}
      />
    </div>
  );
}
