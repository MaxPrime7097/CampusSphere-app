import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, Globe, Upload, Users, Check, ArrowLeft, X, Ticket, ArrowSquareOut, LinkSimple, Spinner as Loader2 } from "@phosphor-icons/react";
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
import { EVENT_CATEGORY_OPTIONS, getEventCategoryMeta } from "@/constants/eventCategories";
import { createEvent } from "@/services/eventService";
import { getUserSpheres } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn, getEventUrl } from "@/lib/utils";
import type { EventCategory, CreateEventInput } from "@/types/events.types";

export function EventCreate() {
  const { t, i18n } = useTranslation("events");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateEventInput>({
    title: "",
    description: "",
    category: "party",
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * (24 * 2 + 3)).toISOString().slice(0, 16),
    location: "",
    isOnline: false,
    onlineLink: "",
    maxAttendees: undefined,
    isPublic: true,
    hasTicketing: false,
    registrationUrl: "",
    sphereId: undefined,
    isFeatured: false,
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
        title: t("createForm.toasts.created"),
        description: t("createForm.toasts.createdDesc", { title: created.title }),
      });
      navigate(getEventUrl(created));
    },
    onError: (err: any) => {
      toast({
        title: t("createForm.toasts.createError"),
        description: err?.message || t("createForm.toasts.createErrorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t("createForm.toasts.imageTooLarge"),
          description: t("createForm.toasts.imageTooLargeDesc"),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: t("createForm.toasts.titleRequired"),
        description: t("createForm.toasts.titleRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        title: t("createForm.toasts.dateRequired"),
        description: t("createForm.toasts.dateRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...formData,
      hasTicketing: Boolean(formData.hasTicketing),
      registrationUrl: formData.registrationUrl?.trim() || null,
      coverImage: coverFile,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
    });
  };

  const previewDate = formData.startDate ? new Date(formData.startDate) : new Date();
  const dateLocale = i18n.language.startsWith("en") ? "en-US" : "fr-FR";
  const previewMonth = previewDate.toLocaleDateString(dateLocale, { month: "short" }).toUpperCase().replace(".", "");
  const previewDay = previewDate.getDate();
  const previewTime = previewDate.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
  const categoryMeta = getEventCategoryMeta(formData.category);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/events")}
          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            {t("createForm.title")}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {t("createForm.subtitle")}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section: Informations générales */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("createForm.generalInfo")}</h2>
              <p className="text-xs text-muted-foreground">{t("createForm.generalInfoDesc")}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-medium text-foreground">
                {t("createForm.eventTitle")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={t("createForm.titlePlaceholder")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl text-xs sm:text-sm font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {t("createForm.category")} <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {EVENT_CATEGORY_OPTIONS.filter((c) => c.value !== "all").map((cat) => {
                  const isSelected = formData.category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat.value as EventCategory })}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      {t(`categories.${cat.value}Short`, { defaultValue: cat.shortLabel || cat.label })}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-medium text-foreground">
                {t("createForm.description")}
              </Label>
              <Textarea
                id="description"
                placeholder={t("createForm.descriptionPlaceholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="rounded-xl text-xs leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Section: Date, Heure & Lieu */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("createForm.dateTimeLocation")}</h2>
              <p className="text-xs text-muted-foreground">{t("createForm.dateTimeLocationDesc")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-medium text-foreground">
                  {t("createForm.startDate")} <span className="text-destructive">*</span>
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
                <Label htmlFor="endDate" className="text-xs font-medium text-foreground">
                  {t("createForm.endDate")}
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

            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium text-foreground">{t("createForm.onlineEvent")}</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {t("createForm.onlineEventDesc")}
                  </p>
                </div>
                <Switch
                  checked={formData.isOnline}
                  onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked })}
                />
              </div>

              {formData.isOnline ? (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="onlineLink" className="text-xs font-medium text-foreground">
                    {t("createForm.onlineLink")}
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="onlineLink"
                      placeholder="https://meet.google.com/..."
                      value={formData.onlineLink || ""}
                      onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                      className="rounded-xl text-xs pl-9"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <Label htmlFor="location" className="text-xs font-medium text-foreground">
                    {t("createForm.physicalLocation")}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder={t("createForm.physicalLocationPlaceholder")}
                      value={formData.location || ""}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="rounded-xl text-xs pl-9"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Affiche / Bannière */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("createForm.coverPhoto")}</h2>
              <p className="text-xs text-muted-foreground">{t("createForm.coverPhotoDesc")}</p>
            </div>

            {coverPreview ? (
              <div className="relative h-44 w-full rounded-xl overflow-hidden border border-border/60 bg-muted">
                <img src={coverPreview} alt="Aperçu" className="h-full w-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={removeCoverImage}
                  className="absolute top-2.5 right-2.5 h-7 px-2.5 text-xs bg-background/80 hover:bg-background backdrop-blur-md rounded-lg shadow-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1" /> {t("createForm.remove")}
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer p-4 text-center">
                <Upload className="h-5 w-5 text-muted-foreground mb-1.5" />
                <span className="text-xs font-medium text-foreground">
                  {t("createForm.uploadCover")}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {t("createForm.coverHint")}
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

          {/* Section: Options & Visibilité */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t("createForm.optionsAndVisibility")}</h2>
              <p className="text-xs text-muted-foreground">{t("createForm.optionsAndVisibilityDesc")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="maxAttendees" className="text-xs font-medium text-foreground">
                  {t("createForm.maxAttendees")}
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="maxAttendees"
                    type="number"
                    placeholder={t("createForm.unlimited")}
                    value={formData.maxAttendees || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxAttendees: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="rounded-xl text-xs pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {t("createForm.linkSphere")}
                </Label>
                <Select
                  value={formData.sphereId ? String(formData.sphereId) : "none"}
                  onValueChange={(val) =>
                    setFormData({ ...formData, sphereId: val === "none" ? undefined : val })
                  }
                >
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder={t("createForm.noLinkedSphere")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("createForm.generalEvent")}</SelectItem>
                    {userSpheres.map((sphere: any) => (
                      <SelectItem key={sphere.id} value={String(sphere.id)}>
                        {sphere.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5 text-primary" />
                    <Label className="text-xs font-medium text-foreground">{t("createForm.ticketing")}</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("createForm.ticketingDesc")}
                  </p>
                </div>
                <Switch
                  checked={Boolean(formData.hasTicketing)}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasTicketing: checked })}
                />
              </div>

              {/* Lien d'inscription externe */}
              <div className="space-y-1.5 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <Label htmlFor="registrationUrl" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <ArrowSquareOut className="h-3.5 w-3.5 text-primary" />
                    {t("createForm.externalLink")}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">{t("createForm.externalLinkHint")}</span>
                </div>
                <div className="relative">
                  <LinkSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="registrationUrl"
                    placeholder="https://eventbrite.com/e/... ou https://forms.gle/..."
                    value={formData.registrationUrl || ""}
                    onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                    className="rounded-xl text-xs pl-9"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("createForm.externalLinkDesc")}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium text-foreground">{t("createForm.featureEvent")}</Label>
                  <p className="text-[11px] text-muted-foreground">
                    {t("createForm.featureEventDesc")}
                  </p>
                </div>
                <Switch
                  checked={formData.isFeatured || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={createMutation.isPending}
            size="lg"
            className="w-full rounded-xl font-semibold"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("createForm.publishing")}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t("createForm.publish")}
              </>
            )}
          </Button>
        </div>

        {/* Right Column: Live Preview */}
        <div className="space-y-3">
          <div className="sticky top-20 space-y-3">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t("createForm.livePreview")}
            </span>

            <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
              {/* Cover */}
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {coverPreview ? (
                  <img src={coverPreview} alt="Aperçu" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground/40 bg-muted/50">
                    <Calendar className="h-10 w-10 stroke-[1.5]" />
                  </div>
                )}
                <div className="absolute top-2.5 left-2.5 rounded-lg bg-background/90 backdrop-blur-md px-2 py-0.5 text-center border border-border/40">
                  <span className="block text-[9px] font-semibold text-muted-foreground uppercase leading-none">
                    {previewMonth}
                  </span>
                  <span className="block text-xs font-bold text-foreground leading-tight mt-0.5">
                    {previewDay}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <span className="rounded-md bg-background/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/40">
                    {t(`categories.${formData.category}Short`, { defaultValue: categoryMeta?.shortLabel || formData.category })}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 space-y-1.5">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                  {formData.title || t("createForm.defaultTitle")}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {formData.description || t("createForm.defaultDescription")}
                </p>
                <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {previewTime}
                  </span>
                  <span className="flex items-center gap-1 truncate max-w-[140px]">
                    {formData.isOnline ? (
                      <>
                        <Globe className="h-3 w-3 text-sky-500 shrink-0" />
                        <span>{t("createForm.online")}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{formData.location || t("createForm.campus")}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
