import { Suspense, lazy, useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import {
  ChevronRight,
  Check,
  Loader2,
  Plus,
  X,
  Camera,
  Info,
  ExternalLink,
  Sparkles,
  Briefcase,
  Heart,
  Zap,
} from "lucide-react";
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

type Step = 0 | 1 | 2 | 3;

interface NarrativeWord {
  text: string;
  highlight?: boolean;
}

interface NarrativeParagraph {
  isTitle?: boolean;
  isFinal?: boolean;
  words: NarrativeWord[];
}

const NARRATIVE_DATA: NarrativeParagraph[] = [
  {
    isTitle: true,
    words: [
      { text: "Imagine" },
      { text: "un" },
      { text: "espace..." },
    ],
  },
  {
    words: [
      { text: "..." },
      { text: "où" },
      { text: "toute", highlight: true },
      { text: "la", highlight: true },
      { text: "vie", highlight: true },
      { text: "de", highlight: true },
      { text: "ton", highlight: true },
      { text: "campus", highlight: true },
      { text: "tient" },
      { text: "enfin" },
      { text: "dans" },
      { text: "ta" },
      { text: "poche." },
    ],
  },
  {
    words: [
      { text: "..." },
      { text: "où" },
      { text: "tes" },
      { text: "exposés" },
      { text: "et" },
      { text: "projets" },
      { text: "avancent" },
      { text: "sans" },
      { text: "stress" },
      { text: "grâce" },
      { text: "à" },
      { text: "des" },
      { text: "Sphères", highlight: true },
      { text: "collaboratives", highlight: true },
      { text: "avec" },
      { text: "Kanban," },
      { text: "chat" },
      { text: "d'équipe" },
      { text: "et" },
      { text: "fichiers" },
      { text: "partagés." },
    ],
  },
  {
    words: [
      { text: "..." },
      { text: "où" },
      { text: "tu" },
      { text: "as" },
      { text: "accès" },
      { text: "en" },
      { text: "un" },
      { text: "instant" },
      { text: "aux" },
      { text: "fiches,", highlight: true },
      { text: "cours", highlight: true },
      { text: "et", highlight: true },
      { text: "annales", highlight: true },
      { text: "déposés" },
      { text: "par" },
      { text: "ceux" },
      { text: "qui" },
      { text: "ont" },
      { text: "déjà" },
      { text: "validé" },
      { text: "ta" },
      { text: "filière." },
    ],
  },
  {
    words: [
      { text: "..." },
      { text: "où" },
      { text: "Sphera,", highlight: true },
      { text: "ton" },
      { text: "assistante" },
      { text: "IA," },
      { text: "t'épaule" },
      { text: "pour" },
      { text: "comprendre" },
      { text: "n'importe" },
      { text: "quelle" },
      { text: "notion" },
      { text: "et" },
      { text: "transforme" },
      { text: "tes" },
      { text: "cours" },
      { text: "en" },
      { text: "quiz" },
      { text: "et" },
      { text: "fiches" },
      { text: "interactifs." },
    ],
  },
  {
    words: [
      { text: "..." },
      { text: "où" },
      { text: "ton" },
      { text: "fil" },
      { text: "d'actu" },
      { text: "est" },
      { text: "guidé" },
      { text: "par" },
      { text: "l'Impact", highlight: true },
      { text: "Score", highlight: true },
      { text: "⚡,", highlight: true },
      { text: "pour" },
      { text: "ne" },
      { text: "faire" },
      { text: "remonter" },
      { text: "que" },
      { text: "ce" },
      { text: "qui" },
      { text: "t'aide" },
      { text: "et" },
      { text: "t'inspire" },
      { text: "vraiment." },
    ],
  },
  {
    words: [
      { text: "..." },
      { text: "où" },
      { text: "tu" },
      { text: "ne" },
      { text: "rates" },
      { text: "plus" },
      { text: "aucun" },
      { text: "événement;", highlight: true },
      { text: "hackathon," },
      { text: "atelier" },
      { text: "ou" },
      { text: "soirée" },
      { text: "de" },
      { text: "ton" },
      { text: "université." },
    ],
  },
  {
    isFinal: true,
    words: [
      { text: "Cet" },
      { text: "espace" },
      { text: "existe." },
      { text: "Bienvenue" },
      { text: "sur" },
      { text: "CampusSphere.", highlight: true },
      { text: "🚀" },
    ],
  },
];

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

function TypewriterNarration({ onComplete }: { onComplete: () => void }) {
  const flattenedWords = useRef(
    NARRATIVE_DATA.flatMap((p, pIdx) =>
      p.words.map((w) => ({
        pIdx,
        text: w.text,
        highlight: !!w.highlight,
        isTitle: !!p.isTitle,
        isFinal: !!p.isFinal,
      }))
    )
  ).current;

  const [visibleCount, setVisibleCount] = useState(0);
  const isFinished = visibleCount >= flattenedWords.length;

  useEffect(() => {
    if (visibleCount >= flattenedWords.length) return;

    const currentWord = flattenedWords[visibleCount]?.text || "";
    let delay = 75; // cadence naturelle de base
    if (currentWord.endsWith("...") || currentWord.endsWith(".")) {
      delay = 240; // respiration humaine en fin de phrase
    } else if (currentWord.endsWith(",") || currentWord.endsWith(":")) {
      delay = 140; // légère pause sur ponctuation
    }

    const timer = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleCount, flattenedWords]);

  const getWordsForParagraph = (pIdx: number) => {
    const pWords = flattenedWords.filter((w) => w.pIdx === pIdx);
    const pStartIndex = flattenedWords.findIndex((w) => w.pIdx === pIdx);
    const visibleInThisP = Math.max(0, Math.min(pWords.length, visibleCount - pStartIndex));
    return pWords.slice(0, visibleInThisP);
  };

  return (
    <div className="w-full max-w-2xl py-2 sm:py-6">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/40">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          Spoiler alert 👀
        </span>
        {!isFinished && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setVisibleCount(flattenedWords.length)}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 font-normal"
          >
            Afficher tout
          </Button>
        )}
      </div>

      <div
        className="space-y-4 min-h-[320px] text-left leading-relaxed cursor-pointer"
        onClick={() => {
          if (!isFinished) setVisibleCount(flattenedWords.length);
        }}
        title={!isFinished ? "Cliquez pour afficher tout le texte" : undefined}
      >
        {NARRATIVE_DATA.map((p, pIdx) => {
          const wordsToShow = getWordsForParagraph(pIdx);
          if (wordsToShow.length === 0) return null;

          if (p.isTitle) {
            return (
              <h2 key={pIdx} className="text-2xl sm:text-3xl font-bold font-raleway text-foreground animate-in fade-in duration-300">
                {wordsToShow.map((w, wIdx) => (
                  <span key={wIdx} className="mr-1.5 inline-block">
                    {w.text}
                  </span>
                ))}
              </h2>
            );
          }

          if (p.isFinal) {
            return (
              <div key={pIdx} className="pt-4 border-t border-border/40 animate-in fade-in duration-300">
                <p className="text-lg sm:text-xl font-bold text-foreground font-poppins">
                  {wordsToShow.map((w, wIdx) => (
                    <span
                      key={wIdx}
                      className={cn(
                        "mr-1.5 inline-block",
                        w.highlight && "text-primary"
                      )}
                    >
                      {w.text}
                    </span>
                  ))}
                </p>
              </div>
            );
          }

          return (
            <p key={pIdx} className="text-base sm:text-lg text-muted-foreground font-nunito animate-in fade-in duration-200">
              {wordsToShow.map((w, wIdx) => (
                <span
                  key={wIdx}
                  className={cn(
                    "mr-1.5 inline-block transition-colors duration-200",
                    w.highlight ? "text-primary font-semibold" : "text-foreground/80"
                  )}
                >
                  {w.text}
                </span>
              ))}
              {visibleCount < flattenedWords.length && pIdx === flattenedWords[visibleCount]?.pIdx && (
                <span className="inline-block w-1.5 h-4 bg-primary animate-pulse align-middle" />
              )}
            </p>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground font-normal">
          1 minute pour personnaliser ton espace
        </span>
        <Button
          onClick={onComplete}
          className="campus-gradient text-white hover:opacity-90 w-full sm:w-auto px-6 py-5 text-base shadow-sm transition-transform hover:scale-[1.01]"
        >
          {isFinished ? "Configurer mon profil étudiant" : "Passer & Configurer"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

const TEAM_MEMBERS = [
  { name: "Max", avatar: "/Team/Nlend.jpg" },
  { name: "Boris", avatar: "/Team/Boris.jpg" },
  { name: "Nathan", avatar: "/Team/Nathan.jpg" },
  { name: "Tommi", avatar: "/Team/Tommi.jpg" },
  { name: "Gwenaëlle", avatar: "/Team/Gwen.png" },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isAddEducationOpen, setIsAddEducationOpen] = useState(false);
  const [isAddExperienceOpen, setIsAddExperienceOpen] = useState(false);
  const [showExperiencesSection, setShowExperiencesSection] = useState(false);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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

    const payload = {
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
      setStep(3);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getProgress = () => {
    switch (step) {
      case 0:
        return 20;
      case 1:
        return 50;
      case 2:
        return 80;
      case 3:
        return 100;
      default:
        return 20;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col items-center justify-center p-4 sm:p-8">
      <Helmet>
        <title>Onboarding - CampusSphere</title>
      </Helmet>

      <div className="w-full max-w-2xl">
        {/* Entête épurée pour les étapes 1 et 2 */}
        {step !== 0 && step !== 3 && (
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
        )}

        {/* Barre de progression épurée */}
        {step !== 3 && (
          <div className="mb-8">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-2 font-normal">
              <span>
                {step === 0 && "Étape 0/2 • Découverte"}
                {step === 1 && "Étape 1/2 • Établissement"}
                {step === 2 && "Étape 2/2 • Profil & Intérêts"}
              </span>
              <span>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-1.5" />
          </div>
        )}

        <div className="space-y-6">
          {/* ── ÉTAPE 0 : Narration progressive (sans boîte saturée) ── */}
          {step === 0 && (
            <div className="animate-in fade-in duration-500 flex justify-center">
              <TypewriterNarration
                onComplete={() => {
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}

          {/* ── ÉTAPE 1 : Infos académiques (design fluide sans carte lourde) ── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500 py-2">
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

              <div className="flex justify-between items-center pt-6 border-t border-border/40">
                <Button
                  variant="ghost"
                  onClick={() => setStep(0)}
                  className="text-muted-foreground hover:text-foreground font-normal"
                >
                  Intro
                </Button>
                <Button
                  onClick={() => {
                    const v = step1Schema.safeParse(formData);
                    if (!v.success) {
                      const fe: Record<string, string> = {};
                      v.error.errors.forEach((e) => {
                        if (e.path[0]) fe[e.path[0] as string] = e.message;
                      });
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

          {/* ── ÉTAPE 3 : Le Mot de l'équipe CampusSphere (design 100% épuré sans carte) ── */}
          {step === 3 && (
            <div className="w-full max-w-xl mx-auto py-4 text-center animate-in fade-in duration-400">
              <div className="flex items-center justify-center gap-3 mb-3">
                <img src="/CS.svg" alt="CampusSphere Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
                <span className="text-2xl sm:text-3xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
                  CampusSphere
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-raleway text-foreground mb-6">
                Bienvenue dans l'aventure ! 🎉
              </h2>

              <div className="text-left text-sm sm:text-base leading-relaxed text-muted-foreground font-nunito space-y-4">
                <p className="font-semibold text-foreground">Salut !</p>
                <p>
                  Toute l'équipe de <strong className="text-foreground font-semibold">CampusSphere</strong> est ultra fière de t'accueillir sur la plateforme.
                </p>

                <p>
                  On a créé cet espace autour d'une promesse simple : <strong className="text-foreground font-semibold">Connect. Share. Grow.</strong>
                </p>

                <div className="space-y-2.5 pl-3 border-l-2 border-primary/40 my-3 text-xs sm:text-sm">
                  <p>
                    <strong className="text-foreground font-medium">Connect :</strong> Échange avec les étudiants de ton campus, rejoins tes premières Sphères et ne sois plus jamais coupé de ce qui s'y passe.
                  </p>
                  <p>
                    <strong className="text-foreground font-medium">Share :</strong> Trouve et partage fiches, cours et annales d'examens en un clic pour faire avancer toute la communauté.
                  </p>
                  <p>
                    <strong className="text-foreground font-medium">Grow :</strong> Valide tes matières, avance sur tes projets à plusieurs et booste tes révisions au quotidien avec Sphera.
                  </p>
                </div>

                <p>
                  Rejoins tes premières Sphères, explore les ressources partagées, teste Sphera pour tes révisions et fais comme chez toi !
                </p>

                <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex -space-x-3 overflow-hidden p-0.5">
                    {TEAM_MEMBERS.map((m, i) => (
                      <img
                        key={i}
                        src={m.avatar}
                        alt={m.name}
                        title={m.name}
                        className="inline-block h-10 w-10 sm:h-11 sm:w-11 rounded-full ring-2 ring-background object-cover shadow-sm transition-transform hover:scale-110 hover:z-10"
                      />
                    ))}
                  </div>

                  <span className="font-semibold text-foreground text-sm sm:text-base font-poppins">
                    — L'équipe CampusSphere 🧡
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  onClick={() => {
                    toast({
                      title: "Ton espace est prêt ! 🎉",
                      description: "Bienvenue sur CampusSphere ! Connect. Share. Grow. 🚀",
                      duration: 4000,
                    });
                    navigate("/");
                  }}
                  size="lg"
                  className="campus-gradient text-white hover:opacity-90 w-full py-6 text-base rounded-xl shadow-md transition-transform hover:scale-[1.01]"
                >
                  Entrer dans mon espace 🚀
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
