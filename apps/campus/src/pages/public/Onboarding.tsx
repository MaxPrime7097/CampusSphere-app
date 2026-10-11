import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Spinner as Loader2, ArrowRight } from "@phosphor-icons/react";
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

const validateDateOfBirth = (value: string, t: (key: string, opt?: any) => string): string | null => {
  if (!value) return t("onboarding.errors.dobRequired");
  const birthDate = parseISODate(value);
  if (!birthDate) return t("onboarding.errors.dobInvalid");
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (birthDate > todayUtc) return t("onboarding.errors.dobFuture");
  if (getAgeFromDate(birthDate, todayUtc) < MINIMUM_AGE) return t("onboarding.errors.minAge", { age: MINIMUM_AGE });
  return null;
};

export function Onboarding() {
  const { t } = useTranslation("auth");
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
    const dobError = validateDateOfBirth(formData.dateOfBirth, t);
    if (dobError) {
      newErrors.dateOfBirth = dobError;
    }

    // Validation université
    if (!formData.university.trim()) {
      newErrors.university = t("onboarding.errors.selectUniversity");
    } else if (formData.university === "other" && !customUniversity.trim()) {
      newErrors.customUniversity = t("onboarding.errors.enterCustomUniversity");
    }

    // Validation filière
    if (!formData.faculty.trim()) {
      newErrors.faculty = t("onboarding.errors.selectFaculty");
    }

    // Validation niveau
    if (!formData.studyYear.trim()) {
      newErrors.studyYear = t("onboarding.errors.selectStudyYear");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: t("onboarding.errors.incompleteInfo"),
        description: t("onboarding.errors.fillAllFields"),
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
          title: t("onboarding.toast.welcomeTitle"),
          description: t("onboarding.toast.welcomeDesc"),
        });

        navigate("/", { replace: true });
      } else {
        toast({
          title: t("onboarding.toast.registeredTitle"),
          description: t("onboarding.toast.registeredDesc"),
        });

        navigate(`/campus-unlock?campus=${encodeURIComponent(finalUniversity)}`, { replace: true });
      }
    } catch (err: any) {
      toast({
        title: t("onboarding.toast.saveError"),
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
        <title>{t("onboarding.metaTitle")}</title>
      </Helmet>

      <div className="w-full max-w-lg mx-auto">
        {/* Entête */}
        <div className="text-center mb-6">
          <span className="text-2xl sm:text-3xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-3">
            {t("onboarding.title")}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm max-w-md mx-auto">
            {t("onboarding.subtitle")}
          </p>
        </div>

        {user?.firstName && (
          <p className="text-xs text-center text-muted-foreground mb-5">
            {t("onboarding.welcomeBack", { name: user.firstName })}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Date de naissance */}
          <div>
            <Label className="text-xs font-semibold">
              {t("onboarding.birthDate")} <span className="text-primary">*</span>
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
                {t("onboarding.ageRequirement", { age: MINIMUM_AGE })}
              </p>
            )}
          </div>

          {/* 2. Université / Établissement */}
          <div>
            <Label className="text-xs font-semibold">
              {t("onboarding.university")} <span className="text-primary">*</span>
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
                {t("onboarding.customUniversity")} <span className="text-primary">*</span>
              </Label>
              <Input
                type="text"
                placeholder={t("onboarding.customUniversityPlaceholder")}
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
                  {t("onboarding.customUniversityHint")}
                </p>
              )}
            </div>
          )}

          {/* 3. Domaine d'études */}
          <div>
            <Label className="text-xs font-semibold">
              {t("onboarding.fieldOfStudy")} <span className="text-muted-foreground text-[11px] font-normal">{t("onboarding.optional")}</span>
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
                {t("onboarding.faculty")} <span className="text-primary">*</span>
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
                {t("onboarding.studyYear")} <span className="text-primary">*</span>
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
                  {t("onboarding.submitting")}
                </>
              ) : (
                <>
                  {t("onboarding.submit")}
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
