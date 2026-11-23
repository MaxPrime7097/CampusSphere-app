import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, Spinner } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { completeSupabaseProfile } from "@/services/api";
import { cn } from "@/lib/utils";
import {
  UniversityCombobox,
  CAMEROON_PRIVATE_UNIVERSITIES,
} from "@/components/forms/UniversityCombobox";
import { DomainCombobox } from "@/components/forms/DomainCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { getDomainForFaculty } from "@/constants/academicData";
import { useAuth } from "@/contexts/AuthContext";
import { WELCOME_FLAG_KEY } from "@/components/onboarding/WelcomeTeamModal";
import { AuthLanguageToggle } from "@/components/auth/AuthSidePanel";

const MINIMUM_AGE = 16;

const parseISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
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

const validateDateOfBirth = (
  value: string,
  t: (key: string, opt?: any) => string
): string | null => {
  if (!value) return t("onboarding.errors.dobRequired");
  const birthDate = parseISODate(value);
  if (!birthDate) return t("onboarding.errors.dobInvalid");
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (birthDate > todayUtc) return t("onboarding.errors.dobFuture");
  if (getAgeFromDate(birthDate, todayUtc) < MINIMUM_AGE)
    return t("onboarding.errors.minAge", { age: MINIMUM_AGE });
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
    const campusRef =
      searchParams.get("campus") ||
      searchParams.get("ref") ||
      localStorage.getItem("campus_ref") ||
      "";
    if (user) {
      const isKnown = CAMEROON_PRIVATE_UNIVERSITIES.some((u) => u.value === user.university);
      const uniVal = user.university
        ? isKnown
          ? user.university
          : "other"
        : campusRef
        ? campusRef.toLowerCase().trim()
        : "iuc";
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

    const dobError = validateDateOfBirth(formData.dateOfBirth, t);
    if (dobError) {
      newErrors.dateOfBirth = dobError;
    }

    if (!formData.university.trim()) {
      newErrors.university = t("onboarding.errors.selectUniversity");
    } else if (formData.university === "other" && !customUniversity.trim()) {
      newErrors.customUniversity = t("onboarding.errors.enterCustomUniversity");
    }

    if (!formData.faculty.trim()) {
      newErrors.faculty = t("onboarding.errors.selectFaculty");
    }

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
      const finalUniversity =
        formData.university === "other" ? customUniversity.trim() : formData.university.trim();

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
    <div className="cs-pub-font min-h-screen bg-[#f6f4ee] text-[#18181b] flex flex-col font-nunito">
      <Helmet>
        <title>{t("onboarding.metaTitle")}</title>
      </Helmet>

      {/* Barre supérieure sombre cohérente */}
      <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/cs" className="inline-flex items-center gap-2.5">
            <img src="/CS.svg" alt="CampusSphere" className="w-8 h-8" />
            <span className="font-automata text-lg font-bold campus-gradient bg-clip-text text-transparent">
              CampusSphere
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-poppins text-xs font-medium text-zinc-400">
              {t("sidePanel.profileCompletion", { defaultValue: "Finalisation du profil" })}
            </span>
            <AuthLanguageToggle tone="dark" />
          </div>
        </div>
      </header>

      {/* Contenu centré */}
      <main className="flex-1 flex items-center justify-center px-3.5 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-[580px] rounded-3xl bg-white border border-black/10 p-5 sm:p-8 shadow-sm">
          {/* En-tête */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#fff7ed] text-[#ff9800] flex items-center justify-center mb-3.5">
              <GraduationCap size={24} weight="duotone" aria-hidden="true" />
            </div>
            <h1 className="font-poppins text-2xl sm:text-[1.65rem] font-extrabold text-[#18181b] tracking-tight">
              {t("onboarding.title")}
            </h1>
            <p className="text-zinc-500 mt-1.5 text-sm max-w-md mx-auto leading-relaxed">
              {t("onboarding.subtitle")}
            </p>
            {user?.firstName && (
              <p className="font-poppins text-xs font-semibold text-[#e65100] mt-2">
                {t("onboarding.welcomeBack", { name: user.firstName })}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Date de naissance */}
            <div className="space-y-1.5">
              <Label className="font-poppins text-xs font-semibold text-[#18181b]">
                {t("onboarding.birthDate")} <span className="text-[#ff9800]">*</span>
              </Label>
              <Input
                type="date"
                max={getBirthDateMax()}
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                className={cn(
                  "h-11 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]",
                  errors.dateOfBirth && "border-destructive"
                )}
              />
              {errors.dateOfBirth ? (
                <p className="text-xs text-destructive">{errors.dateOfBirth}</p>
              ) : (
                <p className="text-xs text-zinc-500">
                  {t("onboarding.ageRequirement", { age: MINIMUM_AGE })}
                </p>
              )}
            </div>

            {/* 2. Établissement */}
            <div className="space-y-1.5">
              <Label className="font-poppins text-xs font-semibold text-[#18181b]">
                {t("onboarding.university")} <span className="text-[#ff9800]">*</span>
              </Label>
              <UniversityCombobox
                value={formData.university}
                onValueChange={(v) => handleInputChange("university", v)}
              />
              {errors.university && <p className="text-xs text-destructive">{errors.university}</p>}
            </div>

            {/* Saisie explicite si autre établissement */}
            {formData.university === "other" && (
              <div className="space-y-1.5">
                <Label className="font-poppins text-xs font-semibold text-[#18181b]">
                  {t("onboarding.customUniversity")} <span className="text-[#ff9800]">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder={t("onboarding.customUniversityPlaceholder")}
                  value={customUniversity}
                  onChange={(e) => {
                    setCustomUniversity(e.target.value);
                    if (errors.customUniversity)
                      setErrors((prev) => ({ ...prev, customUniversity: "" }));
                  }}
                  className={cn(
                    "h-11 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]",
                    errors.customUniversity && "border-destructive"
                  )}
                />
                {errors.customUniversity ? (
                  <p className="text-xs text-destructive">{errors.customUniversity}</p>
                ) : (
                  <p className="text-xs text-zinc-500">{t("onboarding.customUniversityHint")}</p>
                )}
              </div>
            )}

            {/* 3. Domaine d'études */}
            <div className="space-y-1.5">
              <Label className="font-poppins text-xs font-semibold text-[#18181b]">
                {t("onboarding.fieldOfStudy")}{" "}
                <span className="text-zinc-400 font-normal">{t("onboarding.optional")}</span>
              </Label>
              <DomainCombobox
                value={academicDomain}
                onValueChange={(dom) => {
                  setAcademicDomain(dom);
                  if (formData.faculty && getDomainForFaculty(formData.faculty) !== dom) {
                    handleInputChange("faculty", "");
                  }
                }}
              />
            </div>

            {/* 4. Filière & Niveau */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-poppins text-xs font-semibold text-[#18181b]">
                  {t("onboarding.faculty")} <span className="text-[#ff9800]">*</span>
                </Label>
                <FacultyCombobox
                  domain={academicDomain}
                  onDomainChange={(dom) => {
                    if (dom && dom !== academicDomain) setAcademicDomain(dom);
                  }}
                  value={formData.faculty}
                  onValueChange={(v) => handleInputChange("faculty", v)}
                />
                {errors.faculty && <p className="text-xs text-destructive">{errors.faculty}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="font-poppins text-xs font-semibold text-[#18181b]">
                  {t("onboarding.studyYear")} <span className="text-[#ff9800]">*</span>
                </Label>
                <StudyLevelCombobox
                  value={formData.studyYear}
                  onValueChange={(v) => handleInputChange("studyYear", v)}
                />
                {errors.studyYear && <p className="text-xs text-destructive">{errors.studyYear}</p>}
              </div>
            </div>

            {/* Bouton de validation */}
            <div className="pt-4 border-t border-black/8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-full bg-[#ff9800] hover:bg-[#f57c00] text-white font-poppins text-sm font-semibold shadow-md shadow-[#ff9800]/25 inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Spinner size={17} className="animate-spin" aria-hidden="true" />
                    {t("onboarding.submitting")}
                  </>
                ) : (
                  <>
                    {t("onboarding.submit")}
                    <ArrowRight size={16} weight="bold" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
