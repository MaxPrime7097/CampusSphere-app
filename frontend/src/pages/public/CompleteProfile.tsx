import { Suspense, lazy, useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Check, Loader2, Plus, X, AlertCircle, Eye, EyeOff, Camera, Upload, Info, Briefcase, Languages, Smile, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { completeSupabaseProfile, checkUserAvailability, verifyStudentStatus } from "@/services/api";
import { completeSupabaseProfilePayloadSchema, mapCompleteProfileErrors } from "@/schemas/completeProfilePayload";
import { cn, formatSlugToLabel } from "@/lib/utils";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";
import { LanguageCombobox } from "@/components/forms/LanguageCombobox";
import { CityCombobox } from "@/components/forms/CityCombobox";
import Sphere3D from "@/components/layout/Sphere3D";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { useAuth } from "@/contexts/AuthContext";

const AddEducationModal = lazy(() => import("@/components/modals/AddEducationModal").then((module) => ({ default: module.AddEducationModal })));
const AddExperienceModal = lazy(() => import("@/components/modals/AddExperienceModal").then((module) => ({ default: module.AddExperienceModal })));

type Step = 1 | 2 | 3;
const MINIMUM_AGE = 16;

const parseISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isExactMatch =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  return isExactMatch ? parsed : null;
};

const getAgeFromDate = (birthDate: Date, today: Date) => {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() >= birthDate.getUTCDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};

export function CompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState({ checking: false, available: true, checkedValue: "" });
  const [isAddExperienceOpen, setIsAddExperienceOpen] = useState(false);
  const [isAddEducationOpen, setIsAddEducationOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "",
    username: "", phoneNumber: "", dateOfBirth: "", password: "", confirmPassword: "", town: "", languages: [] as string[],
    university: "", faculty: "", studyYear: "", studentId: "", campus: "",
    previousEducation: [] as Array<{degree: string; school: string; year: string}>,
    experiences: [] as Array<{title: string; company: string; duration: string; description: string}>,
    skills: [] as string[], interests: [] as string[],
    portfolioLinks: [] as Array<{name: string; url: string}>,
  });

  const [newLanguageInput, setNewLanguageInput] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newInterestInput, setNewInterestInput] = useState("");

  const [newLink, setNewLink] = useState({ name: "", url: "" });
  const cardInputRef = useRef<HTMLInputElement>(null);
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [cardPreview, setCardPreview] = useState<string | null>(null);

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
      reader.onload = (e) => setCardPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const minimumAgeMessage = `Vous devez avoir au moins ${MINIMUM_AGE} ans`;
  const step1Schema = z.object({
    firstName: z.string().trim().min(1, "Prénom requis"),
    lastName: z.string().trim().min(1, "Nom requis"),
    username: z.string().trim().min(3, "Au moins 3 caractères"),
    phoneNumber: z.string().optional(),
    dateOfBirth: z.string()
      .min(1, "Requis")
      .refine((value) => parseISODate(value) !== null, "Date de naissance invalide")
      .refine((value) => {
        const birthDate = parseISODate(value);
        if (!birthDate) return false;
        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        return birthDate <= todayUtc;
      }, "La date de naissance ne peut pas être dans le futur")
      .refine((value) => {
        const birthDate = parseISODate(value);
        if (!birthDate) return false;
        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        return getAgeFromDate(birthDate, todayUtc) >= MINIMUM_AGE;
      }, minimumAgeMessage),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.password && data.password.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Au moins 6 caractères",
        path: ["password"],
      });
    }

    if ((data.password || data.confirmPassword) && data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
      });
    }
  });

  const step2Schema = z.object({
    university: z.string().min(1, "Requis"),
    faculty: z.string().min(1, "Requis"),
    studyYear: z.string().min(1, "Requis"),
    studentId: z.string().optional(),
  });

  const handleInput = (field: string, value: string) => {
    const sensitiveFields = new Set(["username", "email", "phoneNumber"]);
    const sanitizedValue = sensitiveFields.has(field) ? value.trim() : value;
    setFormData(p => ({ ...p, [field]: sanitizedValue }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  useEffect(() => {
    const username = formData.username.trim();
    if (step !== 1 || username.length < 3) {
      setUsernameCheck({ checking: false, available: true, checkedValue: "" });
      return;
    }

    const timeout = setTimeout(async () => {
      setUsernameCheck((prev) => ({ ...prev, checking: true }));
      try {
        const response = await checkUserAvailability({ username });
        const isAvailable = response?.data?.username?.available ?? true;
        setUsernameCheck({ checking: false, available: isAvailable, checkedValue: username });
        setErrors((prev) => ({ ...prev, username: isAvailable ? "" : "Ce nom d'utilisateur est déjà pris" }));
      } catch {
        setUsernameCheck((prev) => ({ ...prev, checking: false }));
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.username, step]);

  useEffect(() => {
    if (!user) return;
    setFormData(prev => ({
      ...prev,
      firstName: user.first_name || user.firstName || "",
      lastName: user.last_name || user.lastName || "",
      username: user.username || prev.username,
    }));
  }, [user]);

  const validateAndNext = (schema: z.ZodTypeAny, nextStep: Step) => {
    const v = schema.safeParse(formData);
    if (!v.success) {
      const fe: Record<string, string> = {};
      v.error.errors.forEach(e => { if (e.path[0]) fe[e.path[0] as string] = e.message; });
      setErrors(fe);
      return;
    }
    const normalizedUsername = formData.username.trim();
    if (
      step === 1 &&
      usernameCheck.checkedValue === normalizedUsername &&
      !usernameCheck.available
    ) {
      setErrors((prev) => ({ ...prev, username: "Ce nom d'utilisateur est déjà pris" }));
      return;
    }
    setErrors({});
    setStep(nextStep);
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "Faible", color: "text-muted-foreground" };

    let score = 0;
    if (password.length >= 8) score += 35;
    else if (password.length >= 6) score += 20;
    else score += 10;

    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    const cappedScore = Math.min(score, 100);

    if (cappedScore >= 75) return { score: cappedScore, label: "Fort", color: "text-emerald-600" };
    if (cappedScore >= 45) return { score: cappedScore, label: "Moyen", color: "text-amber-600" };
    return { score: cappedScore, label: "Faible", color: "text-red-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = !!formData.password && !!formData.confirmPassword && formData.password === formData.confirmPassword;
  const hasConfirmInput = formData.confirmPassword.length > 0;

  const handleSubmit = async () => {
    const normalizedPhoneNumber = formData.phoneNumber
      ? `+237${formData.phoneNumber.replace(/^\+?237/, "")}`
      : undefined;

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      username: formData.username,
      phone_number: normalizedPhoneNumber,
      date_of_birth: formData.dateOfBirth,
      town: formData.town,
      language: formData.languages.length > 0 ? formData.languages : ["Français"],
      university: formData.university,
      faculty: formData.faculty,
      study_year: formData.studyYear,
      student_id: formData.studentId,
      campus: formData.campus,
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
      // 1. Envoi des informations textuelles
      await completeSupabaseProfile(payload);

      // 2. Envoi de la pièce jointe (Carte d'étudiant / Acte)
      if (cardImage) {
        try {
          const verifyResult = await verifyStudentStatus(formData.studentId || "Inconnu", cardImage);
          if (verifyResult?.success === false) {
             console.warn("Vérification rejetée par le serveur, mais profil créé.");
          }
        } catch (verifyErr: any) {
          console.error("Erreur critique lors de l'upload de la pièce jointe:", verifyErr);
          // On informe l'utilisateur que le texte est bon mais pas l'image
          toast({ 
            title: "Profil créé, mais image manquante", 
            description: "Tes infos sont enregistrées, mais nous n'avons pas pu recevoir ton acte de naissance. Tu pourras le renvoyer plus tard.", 
            variant: "default" 
          });
        }
      }

      toast({ title: "Inscription terminée ! 🎉", description: "Bienvenue sur CampusSphere! Connect. Share. Grow. 🚀", duration: 4000 });
      
      // On attend un tout petit peu pour laisser les transactions DB se finir
      setTimeout(() => navigate("/"), 500);
    } catch (err: any) {
      if (err?.status === 401) {
        toast({ 
          title: "Session expirée", 
          description: "Votre session a expiré. Veuillez vous reconnecter.", 
          variant: "destructive" 
        });
        localStorage.clear();
        navigate("/login");
      } else {
        toast({ title: "Erreur", description: err?.message || "Une erreur est survenue", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-4 mx-auto grid lg:grid-cols-2 gap-12 items-center">
      <div className="px-0 sm:px-20">
        <div className="text-center mb-8 cursor-pointer" onClick={() => navigate("/cs-inc")}>
          <span className="text-2xl font-bold font-automata text-primary">CampusSphere</span>
          <p className="text-muted-foreground mt-2">Complétez votre profil — Étape {step} sur 3</p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Infos de base</span>
            <span>Académique</span>
            <span>Compétences</span>
          </div>
        </div>

        <div className="space-y-6 p-5 pt-0 mt-4">
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Veuillez corriger les erreurs ci-dessous</AlertDescription>
            </Alert>
          )}

          {/* ── ÉTAPE 1 : Infos de base ── */}
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle>Informations de base</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Prénom *</Label>
                  <Input 
                    value={formData.firstName} 
                    onChange={e => handleInput("firstName", e.target.value)} 
                    placeholder="ex: John" 
                    className={`w-full min-w-0 ${errors.firstName ? "border-destructive" : ""}`} 
                  />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div className="min-w-0">
                  <Label>Nom *</Label>
                  <Input 
                    value={formData.lastName} 
                    onChange={e => handleInput("lastName", e.target.value)} 
                    placeholder="ex: Doe" 
                    className={`w-full min-w-0 ${errors.lastName ? "border-destructive" : ""}`} 
                  />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <Label>Nom d'utilisateur *</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.username} value={formData.username} onChange={e => handleInput("username", e.target.value)} placeholder="ex: john_doe" className={`w-full min-w-0 ${errors.username ? "border-destructive" : ""}`} />
                {usernameCheck.checking && <p className="text-xs text-muted-foreground mt-1">Vérification du nom d'utilisateur…</p>}
                {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Date de naissance *</Label>
                  <Input type="date" value={formData.dateOfBirth} onChange={e => handleInput("dateOfBirth", e.target.value)} className={`w-full min-w-0 ${errors.dateOfBirth ? "border-destructive" : ""}`} />
                  {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div className="min-w-0">
                  <Label>Téléphone</Label>
                  <div className="flex min-w-0 w-full">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+237</span>
                    <Input maxLength={REGISTRATION_MAX_LENGTHS.phoneNumber} value={formData.phoneNumber} onChange={e => handleInput("phoneNumber", e.target.value)} className={`w-full min-w-0 rounded-l-none ${errors.phoneNumber ? "border-destructive" : ""}`} placeholder="6XXXXXXXX" />
                  </div>
                  {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Ville</Label>
                  <CityCombobox 
                    value={formData.town} 
                    onValueChange={v => handleInput("town", v)} 
                    className="mt-1"
                  />
                </div>
                <div className="min-w-0 flex items-end">
                  <p className="text-[10px] text-muted-foreground italic pb-2">
                    La ville aide à vous connecter aux étudiants proches de vous.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mot de passe</Label>
                  <div className="relative">
                    <Input
                      maxLength={REGISTRATION_MAX_LENGTHS.password}
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => handleInput("password", e.target.value)}
                      className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Force du mot de passe</span>
                      <span className={`font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </div>
                    <Progress value={passwordStrength.score} className="h-1.5" />
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>
                <div>
                  <Label>Confirmer</Label>
                  <div className="relative">
                    <Input
                      maxLength={REGISTRATION_MAX_LENGTHS.password}
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={e => handleInput("confirmPassword", e.target.value)}
                      className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {hasConfirmInput && (
                    <p className={`mt-1 flex items-center gap-1 text-xs ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                      {passwordsMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      {passwordsMatch ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                    </p>
                  )}
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => validateAndNext(step1Schema, 2)} disabled={usernameCheck.checking} className="campus-gradient text-white hover:opacity-90">
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Académique ── */}
          {step === 2 && (
            <div className="space-y-4">
              <CardTitle>Informations académiques</CardTitle>
              <div>
                <Label>Université/Institut *</Label>
                <UniversityCombobox value={formData.university} onValueChange={v => handleInput("university", v)} className="mt-2" />
                {errors.university && <p className="text-xs text-red-500 mt-1">{errors.university}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Filière *</Label>
                  <FacultyCombobox value={formData.faculty} onValueChange={v => handleInput("faculty", v)} className="mt-2" />
                  {errors.faculty && <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>}
                </div>
                <div className="min-w-0">
                  <Label>Niveau *</Label>
                  <StudyLevelCombobox value={formData.studyYear} onValueChange={v => handleInput("studyYear", v)} className="mt-2" />
                  {errors.studyYear && <p className="text-xs text-red-500 mt-1">{errors.studyYear}</p>}
                </div>
              </div>
              <div>
                <Label>Matricule <span className="text-muted-foreground">(optionnel)</span></Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.studentId} value={formData.studentId} onChange={e => handleInput("studentId", e.target.value)} className={errors.studentId ? "border-destructive" : ""} />
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
              </div>

              <div>
                <Label>Preuve de statut étudiant <span className="text-muted-foreground">(carte, reçu, certificat... - optionnel pour certification)</span></Label>
                <div 
                  onClick={() => cardInputRef.current?.click()}
                  className={cn(
                    "mt-2 relative h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/30 hover:bg-muted/50",
                    cardPreview ? "border-primary/50" : "border-muted-foreground/30"
                  )}
                >
                  {cardPreview ? (
                    <div className="relative w-full h-full">
                      <img src={cardPreview} alt="Aperçu preuve" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Changer la photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-2 bg-primary/10 rounded-full mb-2">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-xs font-medium">Uploader une preuve pour certification</p>
                      <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG (Max 10Mo)</p>
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
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-500/5 text-blue-600 rounded-lg text-[10px]">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  La certification est requise pour avoir accès à toutes les fonctionnalités et opportunités de la plateforme.
                </div>
              </div>
              <div>
                <Label>Campus</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.campus} value={formData.campus} onChange={e => handleInput("campus", e.target.value)} placeholder="Si plusieurs campus" />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4" />Précédent</Button>
                <Button onClick={() => validateAndNext(step2Schema, 3)} className="campus-gradient text-white hover:opacity-90">
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Expérience & Compétences ── */}
          {step === 3 && (
            <div className="space-y-6">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Compétences & Expériences
              </CardTitle>

              {/* SECTION: PROFESSIONNEL */}
              <div className="space-y-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold tracking-wider">Professionnel</h3>
                </div>

                {/* Expériences */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Parcours Professionnel</Label>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-primary hover:bg-primary/10" onClick={() => setIsAddExperienceOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Ajouter
                    </Button>
                    {isAddExperienceOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <AddExperienceModal
                          open={isAddExperienceOpen}
                          onOpenChange={setIsAddExperienceOpen}
                          existingExperiences={formData.experiences}
                          onExperienceAdded={exp => setFormData(p => ({ ...p, experiences: [...p.experiences, exp] }))}
                        />
                      </Suspense>
                    )}
                  </div>
                  <div className="grid gap-2">
                    {formData.experiences.map((exp, i) => (
                      <div key={i} className="flex justify-between items-center gap-2 p-3 bg-background border rounded-xl shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">{exp.company} · {exp.duration}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setFormData(p => ({ ...p, experiences: p.experiences.filter((_, j) => j !== i) }))}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compétences */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Compétences Techniques</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SkillsCombobox
                        value={newSkillInput}
                        onValueChange={setNewSkillInput}
                        onSearchValueChange={setNewSkillInput}
                        onSkillAdd={(skill) => {
                          if (!formData.skills.includes(skill)) {
                            setFormData(p => ({ ...p, skills: [...p.skills, skill] }));
                            setNewSkillInput("");
                          }
                        }}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0"
                      onClick={() => {
                        if (newSkillInput.trim() && !formData.skills.includes(newSkillInput.trim())) {
                          setFormData(p => ({ ...p, skills: [...p.skills, newSkillInput.trim()] }));
                          setNewSkillInput("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((s, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="gap-1 pl-2 pr-1 py-1 capitalize animate-in zoom-in duration-200"
                      >
                        {formatSlugToLabel(s)}
                        <button onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))} className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: PERSONNEL & LANGUES */}
              <div className="space-y-6 p-4 rounded-2xl bg-accent/5 border border-accent/10">
                <div className="flex items-center gap-2 mb-2">
                  <Smile className="h-4 w-4 text-accent-foreground" />
                  <h3 className="text-sm font-semibold tracking-wider">Personnel & Langues</h3>
                </div>

                {/* Langues */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Langues parlées</Label>
                    <Languages className="h-4 w-4 text-muted-foreground opacity-50" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <LanguageCombobox
                        value={newLanguageInput}
                        onValueChange={setNewLanguageInput}
                        onSearchValueChange={setNewLanguageInput}
                        onLanguageAdd={(lang) => {
                          if (!formData.languages.includes(lang)) {
                            setFormData(p => ({ ...p, languages: [...p.languages, lang] }));
                            setNewLanguageInput("");
                          }
                        }}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0"
                      onClick={() => {
                        if (newLanguageInput.trim() && !formData.languages.includes(newLanguageInput.trim())) {
                          setFormData(p => ({ ...p, languages: [...p.languages, newLanguageInput.trim()] }));
                          setNewLanguageInput("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((l, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="gap-1 pl-2 pr-1 py-1 border-primary/30 bg-primary/5 animate-in zoom-in duration-200"
                      >
                        {formatSlugToLabel(l)}
                        <button onClick={() => setFormData(p => ({ ...p, languages: p.languages.filter((_, j) => j !== i) }))} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Intérêts */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Centres d'intérêt</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <InterestsCombobox
                        value={newInterestInput}
                        onValueChange={setNewInterestInput}
                        onSearchValueChange={setNewInterestInput}
                        onInterestAdd={(interest) => {
                          if (!formData.interests.includes(interest)) {
                            setFormData(p => ({ ...p, interests: [...p.interests, interest] }));
                            setNewInterestInput("");
                          }
                        }}
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0"
                      onClick={() => {
                        if (newInterestInput.trim() && !formData.interests.includes(newInterestInput.trim())) {
                          setFormData(p => ({ ...p, interests: [...p.interests, newInterestInput.trim()] }));
                          setNewInterestInput("");
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.interests.map((s, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="gap-1 pl-2 pr-1 py-1 border-accent-foreground/20 animate-in zoom-in duration-200 capitalize"
                      >
                        {formatSlugToLabel(s)}
                        <button onClick={() => setFormData(p => ({ ...p, interests: p.interests.filter((_, j) => j !== i) }))} className="ml-1 hover:bg-accent-foreground/10 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: ACADÉMIQUE PRÉCÉDENT & PORTFOLIO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Formations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Cursus Antérieur</Label>
                    <Button size="sm" variant="ghost" className="h-7 p-0 text-primary hover:bg-transparent" onClick={() => setIsAddEducationOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Ajouter
                    </Button>
                    {isAddEducationOpen && (
                      <Suspense fallback={<ModalLoadingFallback />}>
                        <AddEducationModal
                          open={isAddEducationOpen}
                          onOpenChange={setIsAddEducationOpen}
                          existingEducations={formData.previousEducation}
                          onEducationAdded={edu => setFormData(p => ({ ...p, previousEducation: [...p.previousEducation, edu] }))}
                        />
                      </Suspense>
                    )}
                  </div>
                  <div className="grid gap-2">
                    {formData.previousEducation.map((edu, i) => (
                      <div key={i} className="flex justify-between items-center gap-2 p-2 bg-muted/30 border rounded-lg text-[10px]">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{formatSlugToLabel(edu.degree)}</p>
                          <p className="text-muted-foreground truncate">{formatSlugToLabel(edu.school)} · {edu.year}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFormData(p => ({ ...p, previousEducation: p.previousEducation.filter((_, j) => j !== i) }))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Portfolio / Liens</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input placeholder="Nom" value={newLink.name} onChange={e => setNewLink(p => ({ ...p, name: e.target.value }))} className="text-xs h-8" />
                      <Input placeholder="URL" value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} className="text-xs h-8" />
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => { if (newLink.name && newLink.url) { setFormData(p => ({ ...p, portfolioLinks: [...p.portfolioLinks, newLink] })); setNewLink({ name: "", url: "" }); } }}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid gap-2">
                      {formData.portfolioLinks.map((l, i) => (
                        <div key={i} className="flex justify-between items-center gap-2 p-2 bg-muted/30 border rounded-lg text-[10px]">
                          <p className="font-medium truncate">{l.name}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFormData(p => ({ ...p, portfolioLinks: p.portfolioLinks.filter((_, j) => j !== i) }))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="mr-2 h-4 w-4" />Précédent</Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="campus-gradient text-white min-w-[140px]">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finalisation...</> : <><Check className="mr-2 h-4 w-4" />Terminer</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block"><Sphere3D /></div>
    </div>
  );
}
