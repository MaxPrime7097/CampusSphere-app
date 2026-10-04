import { Suspense, lazy, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { CaretRight as ChevronRight, Check, Spinner as Loader2, Plus, X, Camera, Info, ArrowSquareOut as ExternalLink, Briefcase, Heart, Lightning as Zap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  completeSupabaseProfile,
  verifyStudentStatus,
} from "@/services/api";
import {
  completeSupabaseProfilePayloadSchema,
  mapCompleteProfileErrors,
} from "@/schemas/completeProfilePayload";
import { cn } from "@/lib/utils";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";
import { WELCOME_FLAG_KEY } from "@/components/onboarding/WelcomeTeamModal";

const AddEducationModal = lazy(() =>
  import("@/components/modals/AddEducationModal").then((module) => ({
    default: module.AddEducationModal,
  }))
);
const AddExperienceModal = lazy(() =>
  import("@/components/modals/AddExperienceModal").then((module) => ({
    default: module.AddExperienceModal,
  }))
);

type Step = 1 | 2;

const MINIMUM_AGE = 16;
const AGE_POLICY_URL = "/cs-inc/policies/terms#age-restriction";

const parseISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
};

const getAgeFromDate = (birthDate: Date, today: Date) => {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = today.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) age--;
  return age;
};

const getBirthDateMax = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - MINIMUM_AGE, now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .split("T")[0];
};

/** Retourne un message d'erreur, ou null si la date est valide et l'âge >= MINIMUM_AGE. */
const validateDateOfBirth = (value: string): string | null => {
  if (!value) return "Date de naissance requise";
  const birthDate = parseISODate(value);
  if (!birthDate) return "Date de naissance invalide";
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (birthDate > todayUtc) return "La date de naissance ne peut pas être dans le futur";
  if (getAgeFromDate(birthDate, todayUtc) < MINIMUM_AGE) return `Vous devez avoir au moins ${MINIMUM_AGE} ans`;
  return null;
};

const COMMON_SKILLS = [
  "JavaScript", "Python", "React", "Node.js", "TypeScript",
  "UI/UX Design", "Figma", "Marketing Digital", "SEO", "Gestion de projet",
  "Communication", "SQL", "Docker", "AWS", "Excel",
  "Canva", "Copywriting", "Leadership", "Analyse de données", "HTML/CSS",
];

const COMMON_LANGUAGES = [
  "Français", "Anglais", "Espagnol", "Allemand", "Mandarin",
  "Arabe", "Italien", "Portugais", "Russe", "Japonais",
];

const COMMON_INTERESTS = [
  "Intelligence Artificielle", "Entrepreneuriat", "Design", "Développement Web",
  "Finance", "Sport", "Lecture", "Voyages", "Photographie",
  "Musique", "Cinéma", "Jeux Vidéo", "Bénévolat", "Mode", "Cuisine",
];

export function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser, user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // La date de naissance n'est demandée que si elle n'est pas déjà connue (ex: inscription Google)
  const [needsDateOfBirth] = useState(() => !user?.dateOfBirth);

  const [isAddEducationOpen, setIsAddEducationOpen] = useState(false);
  const [isAddExperienceOpen, setIsAddExperienceOpen] = useState(false);
  const [showExperiencesSection, setShowExperiencesSection] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    dateOfBirth: "",
    university: "iuc",
    faculty: "",
    studyYear: "",
    studentId: "",
    campus: "",
    town: "",
    bio: "",
    previousEducation: [] as Array<{ degree: string; school: string; year: string }>,
    experiences: [] as Array<{ title: string; company: string; duration: string; description: string }>,
    skills: [] as string[],
    interests: [] as string[],
    languages: ["Français"] as string[],
    portfolioLinks: [] as Array<{ name: string; url: string }>,
  });

  const [newLanguageInput, setNewLanguageInput] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newInterestInput, setNewInterestInput] = useState("");
  const [newLink, setNewLink] = useState({ name: "", url: "" });

  const step1Schema = z.object({
    university: z.string().min(1, "Requis"),
    faculty: z.string().min(1, "Requis"),
    studyYear: z.string().min(1, "Requis"),
    studentId: z.string().optional(),
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop lourd",
          description: "L'image ne doit pas dépasser 10 Mo.",
          variant: "destructive",
        });
        return;
      }
      setCardImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setCardPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = async () => {
    if (isLoading) return;

    if (needsDateOfBirth) {
      const dobError = validateDateOfBirth(formData.dateOfBirth);
      if (dobError) {
        setErrors({ dateOfBirth: dobError });
        setStep(1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }

    const payload = {
      ...(needsDateOfBirth ? { date_of_birth: formData.dateOfBirth } : {}),
      university: formData.university,
      faculty: formData.faculty,
      study_year: formData.studyYear,
      student_id: formData.studentId,
      campus: formData.campus,
      town: formData.town,
      language: formData.languages.length > 0 ? formData.languages : ["Français"],
      bio: formData.bio,
      skills: formData.skills,
      interests: formData.interests,
      previous_education: formData.previousEducation,
      experiences: formData.experiences,
      portfolio_links: formData.portfolioLinks,
    };

    const validation = completeSupabaseProfilePayloadSchema.safeParse(payload);
    if (!validation.success) {
      setErrors(mapCompleteProfileErrors(validation.error));
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      await completeSupabaseProfile(payload);

      if (cardImage) {
        try {
          await verifyStudentStatus(formData.studentId || "Inconnu", cardImage);
        } catch (verifyErr) {
          console.error("Erreur certification auto:", verifyErr);
        }
      }

      await refreshUser();
      // Déclenche la pop-up de bienvenue de l'équipe une fois dans l'application
      localStorage.setItem(WELCOME_FLAG_KEY, "1");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getProgress = () => (step === 1 ? 50 : 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col items-center justify-center p-4 sm:p-8">
      <Helmet>
        <title>Onboarding - CampusSphere</title>
      </Helmet>

      <div className="w-full max-w-2xl">
        {/* Entête épurée */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold font-automata text-primary">CampusSphere</span>
          <h1 className="text-xl font-semibold mt-4">
            {step === 1 ? "Où étudiez-vous ?" : "Votre profil étudiant"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {step === 1
              ? "Renseignez votre établissement pour être directement connecté à la communauté de votre campus."
              : "Personnalisez vos centres d'intérêt pour découvrir des étudiants qui partagent les mêmes cours ou passions que vous."}
          </p>
        </div>

        {/* Barre de progression épurée */}
        <div className="mb-8">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-2 font-normal">
            <span>
              {step === 1 && "Étape 1/2 • Établissement"}
              {step === 2 && "Étape 2/2 • Profil & Intérêts"}
            </span>
            <span>{getProgress()}%</span>
          </div>
          <Progress value={getProgress()} className="h-1.5" />
        </div>

        <div className="space-y-6">
          {/* ── ÉTAPE 1 : Infos académiques (design fluide sans carte lourde) ── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500 py-2">
              {user?.firstName && (
                <div className="flex items-start gap-2 p-3 bg-primary/5 text-foreground/80 rounded-lg text-xs">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
                  <span>
                    Bienvenue <strong>{user.firstName}</strong> ! Tu pourras modifier ton nom, ton prénom et ta photo à tout moment depuis ton profil.
                  </span>
                </div>
              )}

              {needsDateOfBirth && (
                <div>
                  <Label>Date de naissance *</Label>
                  <Input
                    type="date"
                    max={getBirthDateMax()}
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className={cn("mt-2", errors.dateOfBirth && "border-destructive")}
                  />
                  {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Pourquoi cette information ?{" "}
                    <a
                      href={AGE_POLICY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      CampusSphere est réservé aux personnes de {MINIMUM_AGE} ans et plus — en savoir plus
                    </a>
                  </p>
                </div>
              )}

              <div>
                <Label>Université / Institut *</Label>
                <UniversityCombobox
                  value={formData.university}
                  onValueChange={(v) => handleInputChange("university", v)}
                  className="mt-2"
                />
                {errors.university && <p className="text-xs text-red-500 mt-1">{errors.university}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Filière *</Label>
                  <FacultyCombobox
                    value={formData.faculty}
                    onValueChange={(v) => handleInputChange("faculty", v)}
                    className="mt-2"
                  />
                  {errors.faculty && <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>}
                </div>
                <div>
                  <Label>Niveau *</Label>
                  <StudyLevelCombobox
                    value={formData.studyYear}
                    onValueChange={(v) => handleInputChange("studyYear", v)}
                    className="mt-2"
                  />
                  {errors.studyYear && <p className="text-xs text-red-500 mt-1">{errors.studyYear}</p>}
                </div>
              </div>

              <div>
                <Label>
                  Matricule <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  maxLength={REGISTRATION_MAX_LENGTHS?.studentId || 50}
                  value={formData.studentId}
                  onChange={(e) => handleInputChange("studentId", e.target.value)}
                  placeholder="Ex: 21T2045"
                  className="mt-2"
                />
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
              </div>

              <div>
                <Label>
                  Badge Étudiant Vérifié{" "}
                  <span className="text-muted-foreground">(carte, reçu, certificat... - optionnel)</span>
                </Label>
                <div
                  onClick={() => cardInputRef.current?.click()}
                  className={cn(
                    "mt-2 relative h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/20 hover:bg-muted/40",
                    cardPreview ? "border-primary/50" : "border-muted-foreground/25"
                  )}
                >
                  {cardPreview ? (
                    <div className="relative w-full h-full">
                      <img src={cardPreview} alt="Aperçu preuve" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium">Changer la photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 bg-primary/10 rounded-full mb-1.5">
                        <Camera className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-xs font-medium">Uploader une preuve de statut étudiant</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG (Max 10Mo)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={cardInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleCardChange}
                />
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-500/5 text-blue-600 rounded-lg text-xs">
                  <Info className="h-3.5 w-3.5 flex-shrink-0" />
                  La certification permet d'obtenir le badge Étudiant Vérifié sur votre profil et d'accéder aux espaces réservés de votre établissement.
                </div>
              </div>

              <div>
                <Label>
                  Campus <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  maxLength={REGISTRATION_MAX_LENGTHS?.campus || 100}
                  value={formData.campus}
                  onChange={(e) => handleInputChange("campus", e.target.value)}
                  placeholder="Si plusieurs campus (ex: Logbessou, Akwa...)"
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end items-center pt-6 border-t border-border/40">
                <Button
                  onClick={() => {
                    const v = step1Schema.safeParse(formData);
                    const fe: Record<string, string> = {};
                    if (!v.success) {
                      v.error.errors.forEach((e) => {
                        if (e.path[0]) fe[e.path[0] as string] = e.message;
                      });
                    }
                    if (needsDateOfBirth) {
                      const dobError = validateDateOfBirth(formData.dateOfBirth);
                      if (dobError) fe.dateOfBirth = dobError;
                    }
                    if (Object.keys(fe).length > 0) {
                      setErrors(fe);
                      return;
                    }
                    setErrors({});
                    setStep(2);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="campus-gradient text-white hover:opacity-90 w-full sm:w-auto px-6"
                >
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Profil étudiant & Intérêts (aéré et sans cadre lourd) ── */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500 pb-8 py-2">
              {/* 1. CENTRES D'INTÉRÊT (priorité immédiate) */}
              <div>
                <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-4">
                  <Heart className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-base">Vos centres d'intérêt</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajoutez un intérêt (ex: IA, Entrepreneuriat, Musique...) puis Entrée"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newInterestInput.trim() && !formData.interests.includes(newInterestInput.trim())) {
                          setFormData((p) => ({ ...p, interests: [...p.interests, newInterestInput.trim()] }));
                          setNewInterestInput("");
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      if (newInterestInput.trim() && !formData.interests.includes(newInterestInput.trim())) {
                        setFormData((p) => ({ ...p, interests: [...p.interests, newInterestInput.trim()] }));
                        setNewInterestInput("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Suggestions en pilules */}
                {COMMON_INTERESTS.filter((i) => !formData.interests.includes(i)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-xs text-muted-foreground w-full mb-1">Suggestions rapides :</span>
                    {COMMON_INTERESTS.filter((i) => !formData.interests.includes(i))
                      .slice(0, 10)
                      .map((item) => (
                        <Badge
                          key={item}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-xs font-normal"
                          onClick={() => setFormData((p) => ({ ...p, interests: [...p.interests, item] }))}
                        >
                          <Plus className="h-3 w-3 mr-1 opacity-50" /> {item}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Pilules sélectionnées */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {formData.interests.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors px-2.5 py-1 text-xs"
                      onClick={() => setFormData((p) => ({ ...p, interests: p.interests.filter((x) => x !== s) }))}
                    >
                      {s} <X className="h-3 w-3 ml-1.5" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 2. COMPÉTENCES & MATIÈRES */}
              <div>
                <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-base">Compétences & Matières préférées</h3>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Saisissez une compétence (ex: React, UI Design, Mathématiques...) puis Entrée"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newSkillInput.trim() && !formData.skills.includes(newSkillInput.trim())) {
                          setFormData((p) => ({ ...p, skills: [...p.skills, newSkillInput.trim()] }));
                          setNewSkillInput("");
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      if (newSkillInput.trim() && !formData.skills.includes(newSkillInput.trim())) {
                        setFormData((p) => ({ ...p, skills: [...p.skills, newSkillInput.trim()] }));
                        setNewSkillInput("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Suggestions en pilules */}
                {COMMON_SKILLS.filter((s) => !formData.skills.includes(s)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-xs text-muted-foreground w-full mb-1">Suggestions rapides :</span>
                    {COMMON_SKILLS.filter((s) => !formData.skills.includes(s))
                      .slice(0, 10)
                      .map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-xs font-normal"
                          onClick={() => setFormData((p) => ({ ...p, skills: [...p.skills, s] }))}
                        >
                          <Plus className="h-3 w-3 mr-1 opacity-50" /> {s}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Pilules sélectionnées */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {formData.skills.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors px-2.5 py-1 text-xs"
                      onClick={() => setFormData((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }))}
                    >
                      {s} <X className="h-3 w-3 ml-1.5" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 3. BIO COURTE */}
              <div>
                <h3 className="font-semibold text-foreground text-base border-b border-border/40 pb-2 mb-4">À propos de vous</h3>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Étudiant à l'IUC passionné par la tech et le design, toujours partant pour bosser sur des projets de groupe..."
                  className="min-h-[90px] bg-muted/20 focus-visible:ring-1 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Présentez-vous brièvement pour faciliter les connexions avec vos camarades de campus.
                </p>
              </div>

              {/* 4. LANGUES */}
              <div>
                <h3 className="font-semibold text-foreground text-base border-b border-border/40 pb-2 mb-4">Langues</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Saisissez une langue (ex: Français, Anglais...) puis Entrée"
                    value={newLanguageInput}
                    onChange={(e) => setNewLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newLanguageInput.trim() && !formData.languages.includes(newLanguageInput.trim())) {
                          setFormData((p) => ({ ...p, languages: [...p.languages, newLanguageInput.trim()] }));
                          setNewLanguageInput("");
                        }
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      if (newLanguageInput.trim() && !formData.languages.includes(newLanguageInput.trim())) {
                        setFormData((p) => ({ ...p, languages: [...p.languages, newLanguageInput.trim()] }));
                        setNewLanguageInput("");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {/* Suggestions en pilules */}
                {COMMON_LANGUAGES.filter((l) => !formData.languages.includes(l)).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {COMMON_LANGUAGES.filter((l) => !formData.languages.includes(l))
                      .slice(0, 6)
                      .map((l) => (
                        <Badge
                          key={l}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors text-xs font-normal"
                          onClick={() => setFormData((p) => ({ ...p, languages: [...p.languages, l] }))}
                        >
                          <Plus className="h-3 w-3 mr-1 opacity-50" /> {l}
                        </Badge>
                      ))}
                  </div>
                )}
                {/* Pilules sélectionnées */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {formData.languages.map((l) => (
                    <Badge
                      key={l}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors px-2.5 py-1 text-xs"
                      onClick={() => setFormData((p) => ({ ...p, languages: p.languages.filter((x) => x !== l) }))}
                    >
                      {l} <X className="h-3 w-3 ml-1.5" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 5. PORTFOLIO / LIENS */}
              <div>
                <h3 className="font-semibold text-foreground text-base border-b border-border/40 pb-2 mb-4">Liens & Réseaux</h3>
                <div className="flex gap-2 min-w-0 w-full">
                  <Input
                    maxLength={REGISTRATION_MAX_LENGTHS?.portfolioName || 50}
                    placeholder="Titre (ex: GitHub, LinkedIn)"
                    value={newLink.name}
                    onChange={(e) => setNewLink((p) => ({ ...p, name: e.target.value }))}
                    className="w-1/3 min-w-0"
                  />
                  <Input
                    maxLength={REGISTRATION_MAX_LENGTHS?.portfolioUrl || 200}
                    placeholder="https://..."
                    value={newLink.url}
                    onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))}
                    className="flex-1 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      if (newLink.name.trim() && newLink.url.trim()) {
                        setFormData((p) => ({
                          ...p,
                          portfolioLinks: [...p.portfolioLinks, { name: newLink.name.trim(), url: newLink.url.trim() }],
                        }));
                        setNewLink({ name: "", url: "" });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 mt-3 overflow-y-auto">
                  {formData.portfolioLinks.map((l, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 border border-border/40 rounded-lg bg-muted/15 group">
                      <div className="min-w-0 flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">
                            {l.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate" title={l.url}>
                            {l.url}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            portfolioLinks: p.portfolioLinks.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. EXPÉRIENCES & PARCOURS (Section repliable discrète) */}
              <div className="border border-dashed border-border/50 rounded-xl p-4 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setShowExperiencesSection((prev) => !prev)}
                  className="flex items-center justify-between w-full text-left font-normal text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    Expériences & Formations antérieures (optionnel)
                  </span>
                  <span className="text-xs text-primary">
                    {showExperiencesSection ? "Masquer" : "Afficher / Ajouter"}
                  </span>
                </button>

                {showExperiencesSection && (
                  <div className="mt-4 space-y-5 pt-4 border-t border-border/30 animate-in fade-in">
                    {/* EXPÉRIENCES */}
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2">
                        <h4 className="font-medium text-foreground text-xs">Expériences professionnelles</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-2.5 text-primary hover:bg-primary/10 text-xs font-normal"
                          onClick={() => setIsAddExperienceOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      {isAddExperienceOpen && (
                        <Suspense fallback={<ModalLoadingFallback />}>
                          <AddExperienceModal
                            open={isAddExperienceOpen}
                            onOpenChange={setIsAddExperienceOpen}
                            existingExperiences={formData.experiences}
                            onExperienceAdded={(exp) =>
                              setFormData((p) => ({ ...p, experiences: [...p.experiences, exp] }))
                            }
                          />
                        </Suspense>
                      )}
                      {formData.experiences.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Aucune expérience ajoutée</p>
                      ) : (
                        formData.experiences.map((exp, i) => (
                          <div
                            key={i}
                            className="border-l-2 border-primary/50 pl-3 py-2 bg-muted/20 rounded-r-md mb-2 flex justify-between gap-2 group"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">{exp.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {exp.company} • {exp.duration}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={() =>
                                setFormData((p) => ({
                                  ...p,
                                  experiences: p.experiences.filter((_, j) => j !== i),
                                }))
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* FORMATIONS */}
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2">
                        <h4 className="font-medium text-foreground text-xs">Parcours antérieur</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-2.5 text-primary hover:bg-primary/10 text-xs font-normal"
                          onClick={() => setIsAddEducationOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      </div>
                      {isAddEducationOpen && (
                        <Suspense fallback={<ModalLoadingFallback />}>
                          <AddEducationModal
                            open={isAddEducationOpen}
                            onOpenChange={setIsAddEducationOpen}
                            existingEducations={formData.previousEducation}
                            onEducationAdded={(edu) =>
                              setFormData((p) => ({
                                ...p,
                                previousEducation: [...p.previousEducation, edu],
                              }))
                            }
                          />
                        </Suspense>
                      )}
                      {formData.previousEducation.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Aucune formation ajoutée</p>
                      ) : (
                        formData.previousEducation.map((edu, i) => (
                          <div
                            key={i}
                            className="border-l-2 border-primary/50 pl-3 py-2 bg-muted/20 rounded-r-md mb-2 flex justify-between gap-2 group"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">{edu.degree}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {edu.school} • {edu.year}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={() =>
                                setFormData((p) => ({
                                  ...p,
                                  previousEducation: p.previousEducation.filter((_, j) => j !== i),
                                }))
                              }
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="order-2 sm:order-1 w-full sm:w-auto text-muted-foreground hover:text-foreground font-normal"
                >
                  Retour
                </Button>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                  <Button
                    variant="outline"
                    onClick={handleFinalSubmit}
                    disabled={isLoading}
                    className="w-full sm:w-auto font-normal"
                  >
                    Passer cette étape
                  </Button>
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={isLoading}
                    className="campus-gradient text-white hover:opacity-90 w-full sm:w-auto px-8"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Terminer mon profil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
