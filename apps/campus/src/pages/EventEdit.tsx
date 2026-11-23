import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, ArrowLeft, Check, Upload, X, Ticket, ArrowSquareOut, LinkSimple, Buildings, Megaphone, Users, CaretDown, Spinner as Loader2 } from "@phosphor-icons/react";
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
import { cn, getEventUrl, encodeHashId } from "@/lib/utils";
import type { EventCategory, EventMode, UpdateEventInput } from "@/types/events.types";

export function EventEdit() {
  const { t } = useTranslation("events");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState<UpdateEventInput>({
    title: "",
    description: "",
    category: "party",
    eventMode: "campus",
    organizerName: "",
    startDate: "",
    endDate: "",
    location: "",
    isOnline: false,
    onlineLink: "",
    maxAttendees: undefined,
    hasTicketing: false,
    registrationUrl: "",
    sphereId: undefined,
  });

  const isExternal = formData.eventMode === "external";

  const handleModeChange = (mode: EventMode) => {
    setFormData((prev) => ({
      ...prev,
      eventMode: mode,
      ...(mode === "external" ? { hasTicketing: false, maxAttendees: undefined } : {}),
    }));
  };

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
      const mode: EventMode = event.eventMode === "external" ? "external" : "campus";
      setFormData({
        title: event.title,
        description: event.description || "",
        category: event.category,
        eventMode: mode,
        organizerName: event.organizerName || "",
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        location: event.location || "",
        isOnline: Boolean(event.isOnline),
        onlineLink: event.onlineLink || "",
        maxAttendees: event.maxAttendees || undefined,
        hasTicketing: mode === "campus" && Boolean(event.hasTicketing),
        registrationUrl: event.registrationUrl || "",
        sphereId: event.sphereId || undefined,
      });
      if (mode === "campus" && Boolean(event.hasTicketing)) {
        setShowAdvanced(true);
      }
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
        title: t("editForm.toasts.updated"),
        description: t("editForm.toasts.updatedDesc", { title: event?.title || formData.title }),
      });
      const canonicalTarget = event ? getEventUrl(event) : (id ? `/events/${encodeHashId(id) || id}` : "/events");
      navigate(canonicalTarget);
    },
    onError: (err: any) => {
      toast({
        title: t("editForm.toasts.updateError"),
        description: err?.message || t("editForm.toasts.updateErrorDesc"),
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
      toast({
        title: t("createForm.toasts.titleRequired"),
        description: t("createForm.toasts.titleRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      ...formData,
      eventMode: formData.eventMode || "campus",
      organizerName: isExternal ? formData.organizerName?.trim() || null : null,
      maxAttendees: isExternal ? null : formData.maxAttendees ?? null,
      hasTicketing: isExternal ? false : Boolean(formData.hasTicketing),
      registrationUrl: isExternal ? formData.registrationUrl?.trim() || null : null,
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
          onClick={() => {
            const canonicalTarget = event ? getEventUrl(event) : (id ? `/events/${encodeHashId(id) || id}` : "/events");
            navigate(canonicalTarget);
          }}
          className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t("editForm.backToDetails")}
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl text-foreground">
          {t("editForm.title")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t("editForm.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Selector */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-3">
          <div>
            <Label className="text-xs font-bold text-foreground block">{t("createForm.modeSectionTitle")}</Label>
            <p className="text-[11px] text-muted-foreground">{t("createForm.modeSectionDesc")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleModeChange("campus")}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                !isExternal
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/60 bg-muted/20 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  !isExternal ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Users className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-bold text-foreground block">{t("createForm.modeCampusTitle")}</span>
                <span className="text-[11px] text-muted-foreground block">{t("createForm.modeCampusDesc")}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("external")}
              className={cn(
                "flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                isExternal
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/60 bg-muted/20 hover:bg-muted/50"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  isExternal ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Megaphone className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-bold text-foreground block">{t("createForm.modeExternalTitle")}</span>
                <span className="text-[11px] text-muted-foreground block">{t("createForm.modeExternalDesc")}</span>
              </div>
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-3">
          <Label className="text-xs font-bold text-foreground block">{t("createForm.category")}</Label>
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
                  <span className="text-xs font-bold text-foreground block">
                    {t(`categories.${cat.value}Short`, { defaultValue: cat.shortLabel || cat.label })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Description */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-bold text-foreground">
              {t("createForm.eventTitle")} *
            </Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="rounded-xl font-semibold"
              required
            />
          </div>

          {isExternal && (
            <div className="space-y-1.5">
              <Label htmlFor="organizerName" className="text-xs font-bold text-foreground">
                {t("createForm.organizerName")}
              </Label>
              <div className="relative">
                <Buildings className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="organizerName"
                  placeholder={t("createForm.organizerNamePlaceholder")}
                  value={formData.organizerName || ""}
                  onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                  className="rounded-xl text-xs pl-9"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold text-foreground">
              {t("createForm.description")}
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
              <Label className="text-xs text-muted-foreground">{t("createForm.startDate")}</Label>
              <Input
                type="datetime-local"
                value={formData.startDate || ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("createForm.endDate")}</Label>
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
              <Label className="text-xs font-bold text-foreground">{t("createForm.onlineEvent")}</Label>
            </div>
            <Switch
              checked={formData.isOnline}
              onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked })}
            />
          </div>

          {formData.isOnline ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("createForm.onlineLink")}</Label>
              <Input
                value={formData.onlineLink || ""}
                onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("createForm.physicalLocation")}</Label>
              <Input
                value={formData.location || ""}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="rounded-xl text-xs"
              />
            </div>
          )}

          {/* Mode-specific Options */}
          {isExternal ? (
            <div className="space-y-1.5 pt-3 border-t border-border/50">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ArrowSquareOut className="h-3.5 w-3.5 text-primary" />
                {t("createForm.externalLink")}
              </Label>
              <div className="relative">
                <LinkSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={t("createForm.externalLinkHint")}
                  value={formData.registrationUrl || ""}
                  onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                  className="rounded-xl text-xs pl-9"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {t("createForm.externalLinkDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-3 border-t border-border/50">
              <div className="space-y-1.5">
                <Label htmlFor="maxAttendees" className="text-xs text-muted-foreground">
                  {t("createForm.maxAttendees")}
                </Label>
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
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-between text-left py-1 cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-foreground block">{t("createForm.advancedOptions")}</span>
                    <span className="text-[11px] text-muted-foreground block">{t("createForm.advancedOptionsDesc")}</span>
                  </div>
                  <CaretDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      showAdvanced && "rotate-180"
                    )}
                  />
                </button>

                {showAdvanced && (
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/40">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Ticket className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs font-bold text-foreground">{t("createForm.ticketing")}</Label>
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
                )}
              </div>
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="p-6 rounded-3xl border border-border/70 bg-card space-y-4">
          <Label className="text-xs font-bold text-foreground block">{t("createForm.coverPhoto")}</Label>
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
              <span className="text-xs font-bold">{t("editForm.changeCover")}</span>
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
          {updateMutation.isPending ? t("editForm.updating") : t("editForm.update")}
        </Button>
      </form>
    </div>
  );
}
