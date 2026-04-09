import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Loader2, Plus, X, AlertCircle, Eye, EyeOff } from "lucide-react";
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
import { completeSupabaseProfile } from "@/services/api";
import { completeSupabaseProfilePayloadSchema, mapCompleteProfileErrors } from "@/schemas/completeProfilePayload";
import { AddEducationModal } from "@/components/modals/AddEducationModal";
import { AddExperienceModal } from "@/components/modals/AddExperienceModal";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";
import Sphere3D from "@/components/layout/Sphere3D";

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
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "", phoneNumber: "", dateOfBirth: "", password: "", confirmPassword: "", town: "", language: "",
    university: "", faculty: "", studyYear: "", studentId: "", campus: "",
    previousEducation: [] as Array<{degree: string; school: string; year: string}>,
    experiences: [] as Array<{title: string; company: string; duration: string; description: string}>,
    skills: [] as string[], interests: [] as string[],
    portfolioLinks: [] as Array<{name: string; url: string}>,
  });

  const [newLink, setNewLink] = useState({ name: "", url: "" });

  const minimumAgeMessage = `Vous devez avoir au moins ${MINIMUM_AGE} ans`;
  const step1Schema = z.object({
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
    studentId: z.string().min(1, "Requis"),
  });

  const handleInput = (field: string, value: string) => {
    const sensitiveFields = new Set(["username", "email", "phoneNumber"]);
    const sanitizedValue = sensitiveFields.has(field) ? value.trim() : value;
    setFormData(p => ({ ...p, [field]: sanitizedValue }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const validateAndNext = (schema: z.ZodTypeAny, nextStep: Step) => {
    const v = schema.safeParse(formData);
    if (!v.success) {
      const fe: Record<string, string> = {};
      v.error.errors.forEach(e => { if (e.path[0]) fe[e.path[0] as string] = e.message; });
      setErrors(fe);
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
      username: formData.username,
      phone_number: normalizedPhoneNumber,
      date_of_birth: formData.dateOfBirth,
      town: formData.town,
      language: formData.language || "Français",
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
      await completeSupabaseProfile(payload);
      toast({ title: "Profil complété ! 🎉", description: "Bienvenue sur CampusSphere", duration: 4000 });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
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
              <div>
                <Label>Nom d'utilisateur *</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.username} value={formData.username} onChange={e => handleInput("username", e.target.value)} placeholder="ex: john_doe" className={`w-full min-w-0 ${errors.username ? "border-destructive" : ""}`} />
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
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.town} value={formData.town} onChange={e => handleInput("town", e.target.value)} className="w-full min-w-0" />
                </div>
                <div className="min-w-0">
                  <Label>Langue</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.language} value={formData.language} onChange={e => handleInput("language", e.target.value)} placeholder="Français" className="w-full min-w-0" />
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
                <Button onClick={() => validateAndNext(step1Schema, 2)} className="campus-gradient text-white hover:opacity-90">
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
                <Label>Matricule *</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.studentId} value={formData.studentId} onChange={e => handleInput("studentId", e.target.value)} className={errors.studentId ? "border-destructive" : ""} />
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
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

          {/* ── ÉTAPE 3 : Compétences ── */}
          {step === 3 && (
            <div className="space-y-5">
              <CardTitle>Expérience & Compétences</CardTitle>

              {/* Formations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Formations précédentes</Label>
                  <AddEducationModal existingEducations={formData.previousEducation} onEducationAdded={edu => setFormData(p => ({ ...p, previousEducation: [...p.previousEducation, edu] }))}>
                    <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
                  </AddEducationModal>
                </div>
                {formData.previousEducation.map((edu, i) => (
                  <div key={i} className="flex justify-between items-center gap-2 border-l-2 border-primary/50 pl-3 py-1 mb-1 bg-muted/50 rounded-r">
                    <div className="min-w-0">
                      <p className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">{edu.degree}</p>
                      <p className="text-xs text-muted-foreground break-words">{edu.school} · {edu.year}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, previousEducation: p.previousEducation.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                {errors.previousEducation && <p className="text-xs text-red-500 mt-1">{errors.previousEducation}</p>}
              </div>

              {/* Expériences */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Expériences</Label>
                  <AddExperienceModal existingExperiences={formData.experiences} onExperienceAdded={exp => setFormData(p => ({ ...p, experiences: [...p.experiences, exp] }))}>
                    <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
                  </AddExperienceModal>
                </div>
                {formData.experiences.map((exp, i) => (
                  <div key={i} className="flex justify-between items-center gap-2 border-l-2 border-primary/50 pl-3 py-1 mb-1 bg-muted/50 rounded-r">
                    <div className="min-w-0">
                      <p className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">{exp.title}</p>
                      <p className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{exp.company} · {exp.duration}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, experiences: p.experiences.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                {errors.experiences && <p className="text-xs text-red-500 mt-1">{errors.experiences}</p>}
              </div>

              {/* Compétences */}
              <div>
                <Label>Compétences</Label>
                <SkillsCombobox
                  onSkillAdd={(skill) => {
                    if (!formData.skills.includes(skill)) {
                      setFormData(p => ({ ...p, skills: [...p.skills, skill] }));
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((s, i) => <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}>{s} ×</Badge>)}
                </div>
              </div>

              {/* Intérêts */}
              <div>
                <Label>Centres d'intérêt</Label>
                <InterestsCombobox
                  onInterestAdd={(interest) => {
                    if (!formData.interests.includes(interest)) {
                      setFormData(p => ({ ...p, interests: [...p.interests, interest] }));
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.interests.map((s, i) => <Badge key={i} variant="outline" className="cursor-pointer" onClick={() => setFormData(p => ({ ...p, interests: p.interests.filter((_, j) => j !== i) }))}>{s} ×</Badge>)}
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <Label>Portfolio / Liens</Label>
                <div className="flex gap-2 mt-1 min-w-0 w-full">
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.portfolioName} placeholder="Nom" value={newLink.name} onChange={e => setNewLink(p => ({ ...p, name: e.target.value }))} className="w-1/3 min-w-0" />
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.portfolioUrl} placeholder="URL" value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} className="w-full min-w-0" />
                  <Button type="button" variant="outline" onClick={() => { if (newLink.name && newLink.url) { setFormData(p => ({ ...p, portfolioLinks: [...p.portfolioLinks, newLink] })); setNewLink({ name: "", url: "" }); } }}>+</Button>
                </div>
                {errors.portfolioLinks && <p className="text-xs text-red-500 mt-1">{errors.portfolioLinks}</p>}
                {formData.portfolioLinks.map((l, i) => (
                  <div key={i} className="flex justify-between items-center gap-2 p-2 border rounded mt-1 bg-muted/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">{l.name}</p>
                      <p className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={l.url}>{l.url}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, portfolioLinks: p.portfolioLinks.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="mr-2 h-4 w-4" />Précédent</Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="campus-gradient text-white">
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
