import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Spinner as Loader2, Info, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { completeSupabaseProfile } from "@/services/api";
import { cn } from "@/lib/utils";
import { UniversityCombobox, CAMEROON_PRIVATE_UNIVERSITIES } from "@/components/forms/UniversityCombobox";
import { DomainCombobox } from "@/components/forms/DomainCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { getDomainForFaculty } from "@/constants/academicData";
import { useAuth } from "@/contexts/AuthContext";
import { WELCOME_FLAG_KEY } from "@/components/onboarding/WelcomeTeamModal";

const MINIMUM_AGE = 16;

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

export function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refreshUser, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialCampus = () => {
    const fromQuery = searchParams.get("campus") || searchParams.get("ref");
    if (fromQuery) return fromQuery.toLowerCase().trim();
    const fromStorage = localStorage.getItem("campus_ref");
    if (fromStorage) return fromStorage.toLowerCase().trim();
    if (user?.university) {
      const isKnown = CAMEROON_PRIVATE_UNIVERSITIES.some((u) => u.value === user.university);
      return isKnown ? user.university : "other";
    }
    return "iuc";
  };

  const [formData, setFormData] = useState({
    dateOfBirth: "",
    university: initialCampus(),
    faculty: "",
    studyYear: "",
  });

  const [customUniversity, setCustomUniversity] = useState(() => {
    if (user?.university) {
      const isKnown = CAMEROON_PRIVATE_UNIVERSITIES.some((u) => u.value === user.university);
      if (!isKnown && user.university !== "other") {
        return user.university;
      }
    }
    return "";
  });

  const [academicDomain, setAcademicDomain] = useState<string>("");

  // Pré-remplissage avec les informations déjà connues de l'utilisateur
  useEffect(() => {
    const campusRef = searchParams.get("campus") || searchParams.get("ref") || localStorage.getItem("campus_ref") || "";
    if (user) {
      const isKnown = CAMEROON_PRIVATE_UNIVERSITIES.some((u) => u.value === user.university);
      const uniVal = user.university ? (isKnown ? user.university : "other") : (campusRef ? campusRef.toLowerCase().trim() : "iuc");
      if (!isKnown && user.university) {
        setCustomUniversity(user.university);
      }
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: user.dateOfBirth || prev.dateOfBirth,
        university: uniVal,
        faculty: user.faculty || prev.faculty,
        studyYear: user.studyYear || prev.studyYear,
      }));
      if (user.faculty) {
        const dom = getDomainForFaculty(user.faculty);
        if (dom) setAcademicDomain(dom);
      }
    } else if (campusRef) {
      setFormData((prev) => ({ ...prev, university: campusRef.toLowerCase().trim() }));
    }
  }, [user, searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    const newErrors: Record<string, string> = {};

    // Validation date de naissance
    const dobError = validateDateOfBirth(formData.dateOfBirth);
    if (dobError) {
      newErrors.dateOfBirth = dobError;
    }

    // Validation université
    if (!formData.university.trim()) {
      newErrors.university = "Veuillez sélectionner votre université";
    } else if (formData.university === "other" && !customUniversity.trim()) {
      newErrors.customUniversity = "Veuillez indiquer le nom complet de votre établissement";
    }

    // Validation filière
    if (!formData.faculty.trim()) {
      newErrors.faculty = "Veuillez sélectionner votre filière";
    }

    // Validation niveau
    if (!formData.studyYear.trim()) {
      newErrors.studyYear = "Veuillez sélectionner votre niveau d'études";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "Informations incomplètes",
        description: "Veuillez renseigner tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const finalUniversity = formData.university === "other"
        ? customUniversity.trim()
        : formData.university.trim();

      const payload = {
        date_of_birth: formData.dateOfBirth,
        university: finalUniversity,
        faculty: formData.faculty,
        study_year: formData.studyYear,
      };

      await completeSupabaseProfile(payload);
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["campus-status"] });

      try {
        localStorage.removeItem("campus_ref");
      } catch {}

      const normUni = finalUniversity.toLowerCase();
      const isPilot = normUni === "iuc" || normUni.includes("côte") || normUni.includes("cote");

      if (isPilot) {
        // Déclencheurs pour la bienvenue et la modale de certification sur le feed
        localStorage.setItem(WELCOME_FLAG_KEY, "1");
        localStorage.setItem("cs_just_onboarded", "1");

        toast({
          title: "Bienvenue sur CampusSphere ! 🎓",
          description: "Votre profil campus a été configuré avec succès.",
        });

        navigate("/", { replace: true });
      } else {
        toast({
          title: "Inscription enregistrée ! ⏳",
          description: "Partagez avec votre promo pour débloquer votre établissement.",
        });

        navigate(`/campus-unlock?campus=${encodeURIComponent(finalUniversity)}`, { replace: true });
      }
    } catch (err: any) {
      toast({
        title: "Erreur lors de l'enregistrement",
        description: err?.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col items-center justify-center p-4 sm:p-8">
      <Helmet>
        <title>Configuration Campus - CampusSphere</title>
      </Helmet>

      <div className="w-full max-w-lg mx-auto">
        {/* Entête */}
        <div className="text-center mb-6">
          <span className="text-2xl sm:text-3xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-3">
            Où étudiez-vous ? 🎓
          </h1>
          <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm max-w-md mx-auto">
            Renseignez votre établissement pour être directement connecté aux cours, ressources et étudiants de votre campus.
          </p>
        </div>

        {user?.firstName && (
          <p className="text-xs text-center text-muted-foreground mb-5">
            Ravi de vous compter parmi nous, <strong className="text-foreground">{user.firstName}</strong> !
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Date de naissance */}
          <div>
            <Label className="text-xs font-semibold">
              Date de naissance <span className="text-primary">*</span>
            </Label>
            <Input
              type="date"
              max={getBirthDateMax()}
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              className={cn("mt-1.5", errors.dateOfBirth && "border-destructive")}
            />
            {errors.dateOfBirth ? (
              <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                CampusSphere est réservé aux personnes de {MINIMUM_AGE} ans et plus.
              </p>
            )}
          </div>

          {/* 2. Université / Établissement */}
          <div>
            <Label className="text-xs font-semibold">
              Université / Établissement <span className="text-primary">*</span>
            </Label>
            <UniversityCombobox
              value={formData.university}
              onValueChange={(v) => handleInputChange("university", v)}
              className="mt-1.5"
            />
            {errors.university && (
              <p className="text-xs text-destructive mt-1">{errors.university}</p>
            )}
          </div>

          {/* Saisie explicite du nom complet si autre établissement */}
          {formData.university === "other" && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Nom complet de votre établissement <span className="text-primary">*</span>
              </Label>
              <Input
                type="text"
                placeholder="Ex : Université des Montagnes, ISTDI, ESMT..."
                value={customUniversity}
                onChange={(e) => {
                  setCustomUniversity(e.target.value);
                  if (errors.customUniversity) setErrors((prev) => ({ ...prev, customUniversity: "" }));
                }}
                className={cn("mt-1.5", errors.customUniversity && "border-destructive")}
              />
              {errors.customUniversity ? (
                <p className="text-xs text-destructive mt-1">{errors.customUniversity}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Indiquez le nom complet ou le sigle officiel de votre établissement au Cameroun.
                </p>
              )}
            </div>
          )}

          {/* 3. Domaine d'études */}
          <div>
            <Label className="text-xs font-semibold">
              Domaine d'études <span className="text-muted-foreground text-[11px] font-normal">(optionnel)</span>
            </Label>
            <DomainCombobox
              value={academicDomain}
              onValueChange={(dom) => {
                setAcademicDomain(dom);
                if (formData.faculty && getDomainForFaculty(formData.faculty) !== dom) {
                  handleInputChange("faculty", "");
                }
              }}
              className="mt-1.5"
            />
          </div>

          {/* 4. Filière & Niveau */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold">
                Filière <span className="text-primary">*</span>
              </Label>
              <FacultyCombobox
                domain={academicDomain}
                onDomainChange={(dom) => {
                  if (dom && dom !== academicDomain) setAcademicDomain(dom);
                }}
                value={formData.faculty}
                onValueChange={(v) => handleInputChange("faculty", v)}
                className="mt-1.5"
              />
              {errors.faculty && (
                <p className="text-xs text-destructive mt-1">{errors.faculty}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold">
                Niveau d'études <span className="text-primary">*</span>
              </Label>
              <StudyLevelCombobox
                value={formData.studyYear}
                onValueChange={(v) => handleInputChange("studyYear", v)}
                className="mt-1.5"
              />
              {errors.studyYear && (
                <p className="text-xs text-destructive mt-1">{errors.studyYear}</p>
              )}
            </div>
          </div>

          {/* Bouton de validation */}
          <div className="pt-3 border-t border-border/50">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full campus-gradient text-white hover:opacity-90 h-11 text-sm font-semibold shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Configuration de votre espace...
                </>
              ) : (
                <>
                  Accéder à mon espace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
