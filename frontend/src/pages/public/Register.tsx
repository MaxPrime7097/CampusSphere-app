import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Upload, Check, Loader2, AlertCircle, Eye, EyeOff, X, ExternalLink, Plus, FileText, Mail, RefreshCw } from "lucide-react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabaseSignUp, supabaseSignInWithGoogle, supabaseSignInWithFacebook, exchangeSupabaseToken, completeSupabaseProfile } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { completeSupabaseProfilePayloadSchema, mapCompleteProfileErrors } from "@/schemas/completeProfilePayload";
import { AddEducationModal } from "@/components/modals/AddEducationModal";
import { AddExperienceModal } from "@/components/modals/AddExperienceModal";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { FacultyCombobox } from "@/components/forms/FacultyCombobox";
import { StudyLevelCombobox } from "@/components/forms/StudyLevelCombobox";
import { SkillsCombobox } from "@/components/forms/SkillsCombobox";
import { InterestsCombobox } from "@/components/forms/InterestsCombobox";
import Sphere3D from "@/components/layout/Sphere3D";

// Étapes : 1=infos perso, "verify"=attente email, 2=académique, 3=compétences
type Step = 1 | "verify" | 2 | 3;

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", username: "", email: "",
    phoneNumber: "", dateOfBirth: "", password: "", confirmPassword: "",
    avatar: null as File | null, bio: "", town: "", language: "",
    university: "", faculty: "", studyYear: "", studentId: "", campus: "",
    previousEducation: [] as Array<{degree: string; school: string; year: string}>,
    experiences: [] as Array<{title: string; company: string; duration: string; description: string}>,
    skills: [] as string[], interests: [] as string[],
    portfolioLinks: [] as Array<{name: string; url: string}>,
  });

  const [newLink, setNewLink] = useState({ name: "", url: "" });

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

  // Vérifier si l'utilisateur revient après vérification email
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      // L'utilisateur a vérifié son email, échanger le token et continuer
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await exchangeSupabaseToken(session.access_token);
            setStep(2);
            toast({ title: "Email vérifié ✓", description: "Continuez votre inscription", duration: 3000 });
          }
        } catch (err: any) {
          toast({ title: "Erreur", description: err?.message, variant: "destructive" });
        }
      })();
    }
  }, [searchParams, toast]);

  // Écouter la confirmation email Supabase
  useEffect(() => {
    if (step !== "verify") return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Email confirmé → échanger le token avec Django
        try {
          const response = await exchangeSupabaseToken(session.access_token);
          
          // Pour l'inscription par email, on continue toujours avec les étapes 2-3
          // car l'utilisateur a déjà rempli l'étape 1 avec ses infos
          setStep(2);
          toast({ title: "Email vérifié ✓", description: "Continuez votre inscription", duration: 3000 });
        } catch (err: any) {
          toast({ title: "Erreur", description: err?.message, variant: "destructive" });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [step, navigate, toast]);

  const step1Schema = z.object({
    firstName: z.string().min(2, "Au moins 2 caractères"),
    lastName: z.string().min(2, "Au moins 2 caractères"),
    username: z.string().min(3, "Au moins 3 caractères"),
    email: z.string().email("Email invalide"),
    phoneNumber: z.string().optional(),
    dateOfBirth: z.string().min(1, "Requis"),
    password: z.string().min(6, "Au moins 6 caractères"),
    confirmPassword: z.string(),
  }).refine(d => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

  const step2Schema = z.object({
    university: z.string().min(1, "Requis"),
    faculty: z.string().min(1, "Requis"),
    studyYear: z.string().min(1, "Requis"),
    studentId: z.string().min(1, "Requis"),
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  // Étape 1 → Supabase signUp → écran de vérification email
  const handleStep1Submit = async () => {
    const validation = step1Schema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(e => { if (e.path[0]) fieldErrors[e.path[0] as string] = e.message; });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await supabaseSignUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
      });
      setStep("verify");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: formData.email });
      if (error) throw error;
      toast({ title: "Email renvoyé !", duration: 2000 });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  // Étape 3 → compléter le profil Django
  const handleFinalSubmit = async () => {
    const normalizedPhoneNumber = formData.phoneNumber
      ? `+237${formData.phoneNumber.replace(/^\+?237/, "")}`
      : undefined;

    const payload = {
      username: formData.username,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone_number: normalizedPhoneNumber,
      date_of_birth: formData.dateOfBirth,
      university: formData.university,
      faculty: formData.faculty,
      study_year: formData.studyYear,
      student_id: formData.studentId,
      campus: formData.campus,
      town: formData.town,
      language: formData.language || "fr",
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
      toast({ title: "Inscription terminée !", description: "Bienvenue sur CampusSphere 🎉", duration: 4000 });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const stepNumber = step === "verify" ? 1 : step === 1 ? 1 : step === 2 ? 2 : 3;
  const progress = step === "verify" ? 33 : step === 1 ? 0 : step === 2 ? 33 : 66;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-4 mx-auto grid lg:grid-cols-2 gap-12 items-center">
      <div className="px-0 sm:px-20">
        <div className="text-center mb-8 cursor-pointer" onClick={() => navigate("/cs-inc")}>
          <span className="text-2xl font-bold font-automata text-primary">CampusSphere</span>
          <p className="text-muted-foreground mt-2">
            {step === "verify" ? "Vérification de l'email" : `Étape ${stepNumber} sur 3`}
          </p>
        </div>

        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Infos personnelles</span>
            <span>Infos académiques</span>
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

          {/* ── ÉTAPE 1 : Infos personnelles ── */}
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle>Créer votre compte</CardTitle>

              {/* Boutons OAuth */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={() => supabaseSignInWithGoogle()} type="button">
                  <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
                  Continuer avec Google
                </Button>
                <Button variant="outline" className="w-full disabled" onClick={() => supabaseSignInWithFacebook()} type="button">
                  <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                  Continuer avec Facebook
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou avec email</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Nom *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.firstName} value={formData.firstName} onChange={e => handleInputChange("firstName", e.target.value)} className={`w-full min-w-0 ${errors.firstName ? "border-destructive" : ""}`} />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div className="min-w-0">
                  <Label>Prénom *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.lastName} value={formData.lastName} onChange={e => handleInputChange("lastName", e.target.value)} className={`w-full min-w-0 ${errors.lastName ? "border-destructive" : ""}`} />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Nom d'utilisateur *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.username} value={formData.username} onChange={e => handleInputChange("username", e.target.value)} className={`w-full min-w-0 ${errors.username ? "border-destructive" : ""}`} />
                  {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
                </div>
                <div className="min-w-0">
                  <Label>Email *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.email} type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} className={`w-full min-w-0 ${errors.email ? "border-destructive" : ""}`} />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Date de naissance *</Label>
                  <Input type="date" value={formData.dateOfBirth} onChange={e => handleInputChange("dateOfBirth", e.target.value)} className={`w-full min-w-0 ${errors.dateOfBirth ? "border-destructive" : ""}`} />
                  {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div className="min-w-0">
                  <Label>Téléphone</Label>
                  <div className="flex min-w-0 w-full">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+237</span>
                    <Input maxLength={REGISTRATION_MAX_LENGTHS.phoneNumber} value={formData.phoneNumber} onChange={e => handleInputChange("phoneNumber", e.target.value)} className={`w-full min-w-0 rounded-l-none ${errors.phoneNumber ? "border-destructive" : ""}`} placeholder="6XXXXXXXX" />
                  </div>
                  {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Mot de passe *</Label>
                  <div className="relative">
                    <Input maxLength={REGISTRATION_MAX_LENGTHS.password} type={showPassword ? "text" : "password"} value={formData.password} onChange={e => handleInputChange("password", e.target.value)} className={`w-full min-w-0 pr-10 ${errors.password ? "border-destructive" : ""}`} />
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
                <div className="min-w-0">
                  <Label>Confirmer *</Label>
                  <div className="relative">
                    <Input maxLength={REGISTRATION_MAX_LENGTHS.password} type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={e => handleInputChange("confirmPassword", e.target.value)} className={`w-full min-w-0 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`} />
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
                <Button onClick={handleStep1Submit} disabled={isLoading} className="campus-gradient text-white hover:opacity-90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉCRAN VÉRIFICATION EMAIL ── */}
          {step === "verify" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 campus-gradient rounded-full flex items-center justify-center mx-auto">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Vérifiez votre email</h2>
                <p className="text-muted-foreground text-sm">
                  Un lien de confirmation a été envoyé à<br />
                  <strong className="text-foreground">{formData.email}</strong>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>Cliquez sur le lien dans l'email pour continuer votre inscription.</p>
                <p className="mt-1">Cette page se mettra à jour automatiquement.</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleResendEmail} disabled={isResending}>
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Renvoyer l'email
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Modifier l'email
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Infos académiques ── */}
          {step === 2 && (
            <div className="space-y-4">
              <CardTitle>Informations académiques</CardTitle>
              <div>
                <Label>Université/Institut *</Label>
                <UniversityCombobox value={formData.university} onValueChange={v => handleInputChange("university", v)} className="mt-2" />
                {errors.university && <p className="text-xs text-red-500 mt-1">{errors.university}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Filière *</Label>
                  <FacultyCombobox value={formData.faculty} onValueChange={v => handleInputChange("faculty", v)} className="mt-2" />
                  {errors.faculty && <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>}
                </div>
                <div>
                  <Label>Niveau *</Label>
                  <StudyLevelCombobox value={formData.studyYear} onValueChange={v => handleInputChange("studyYear", v)} className="mt-2" />
                  {errors.studyYear && <p className="text-xs text-red-500 mt-1">{errors.studyYear}</p>}
                </div>
              </div>
              <div>
                <Label>Matricule *</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.studentId} value={formData.studentId} onChange={e => handleInputChange("studentId", e.target.value)} />
                {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
              </div>
              <div>
                <Label>Campus</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.campus} value={formData.campus} onChange={e => handleInputChange("campus", e.target.value)} placeholder="Si plusieurs campus" />
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="mr-2 h-4 w-4" />Précédent</Button>
                <Button onClick={() => {
                  const v = step2Schema.safeParse(formData);
                  if (!v.success) {
                    const fe: Record<string, string> = {};
                    v.error.errors.forEach(e => { if (e.path[0]) fe[e.path[0] as string] = e.message; });
                    setErrors(fe); return;
                  }
                  setErrors({}); setStep(3);
                }} className="campus-gradient text-white hover:opacity-90">
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Compétences & expériences ── */}
          {step === 3 && (
            <div className="space-y-6">
              <CardTitle>Expérience & Compétences</CardTitle>

              {/* Formations */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Formations précédentes</Label>
                  <AddEducationModal existingEducations={formData.previousEducation} onEducationAdded={edu => setFormData(p => ({ ...p, previousEducation: [...p.previousEducation, edu] }))}>
                    <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
                  </AddEducationModal>
                </div>
                {formData.previousEducation.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg text-sm">Aucune formation ajoutée</div>
                ) : formData.previousEducation.map((edu, i) => (
                  <div key={i} className="border-l-2 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md mb-2 flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm overflow-hidden text-ellipsis whitespace-nowrap">{edu.degree}</p>
                      <p className="text-xs text-muted-foreground break-words">{edu.school} · {edu.year}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, previousEducation: p.previousEducation.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                {errors.previousEducation && <p className="text-xs text-red-500 mt-1">{errors.previousEducation}</p>}
              </div>

              {/* Expériences */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Expériences</Label>
                  <AddExperienceModal existingExperiences={formData.experiences} onExperienceAdded={exp => setFormData(p => ({ ...p, experiences: [...p.experiences, exp] }))}>
                    <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>
                  </AddExperienceModal>
                </div>
                {formData.experiences.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg text-sm">Aucune expérience ajoutée</div>
                ) : formData.experiences.map((exp, i) => (
                  <div key={i} className="border-l-2 border-primary/50 pl-4 py-2 bg-muted/50 rounded-r-md mb-2 flex justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm overflow-hidden text-ellipsis whitespace-nowrap">{exp.title}</p>
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
                    if (!formData.skills.includes(skill)) setFormData(p => ({ ...p, skills: [...p.skills, skill] }));
                  }}
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map(s => <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))}>{s} ×</Badge>)}
                </div>
              </div>

              {/* Intérêts */}
              <div>
                <Label>Centres d'intérêt</Label>
                <InterestsCombobox
                  onInterestAdd={(interest) => {
                    if (!formData.interests.includes(interest)) setFormData(p => ({ ...p, interests: [...p.interests, interest] }));
                  }}
                  className="mt-2"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.interests.map(s => <Badge key={s} variant="outline" className="cursor-pointer" onClick={() => setFormData(p => ({ ...p, interests: p.interests.filter(x => x !== s) }))}>{s} ×</Badge>)}
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <Label>Portfolio / Liens</Label>
                <div className="flex gap-2 mt-2 min-w-0 w-full">
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.portfolioName} placeholder="Nom (ex: GitHub)" value={newLink.name} onChange={e => setNewLink(p => ({ ...p, name: e.target.value }))} className="w-1/3 min-w-0" />
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.portfolioUrl} placeholder="URL" value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))} className="w-full min-w-0" />
                  <Button type="button" variant="outline" onClick={() => { if (newLink.name.trim() && newLink.url.trim()) { setFormData(p => ({ ...p, portfolioLinks: [...p.portfolioLinks, { name: newLink.name.trim(), url: newLink.url.trim() }] })); setNewLink({ name: "", url: "" }); } }}>+</Button>
                </div>
                {errors.portfolioLinks && <p className="text-xs text-red-500 mt-1">{errors.portfolioLinks}</p>}
                {formData.portfolioLinks.map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 border rounded-lg mt-2 bg-muted/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap">{l.name}</p>
                      <p className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap" title={l.url}>{l.url}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFormData(p => ({ ...p, portfolioLinks: p.portfolioLinks.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}><ChevronLeft className="mr-2 h-4 w-4" />Précédent</Button>
                <Button onClick={handleFinalSubmit} disabled={isLoading} className="campus-gradient text-white hover:opacity-90">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Finalisation...</> : <><Check className="mr-2 h-4 w-4" />Terminer l'inscription</>}
                </Button>
              </div>
            </div>
          )}

          {step !== "verify" && (
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Button variant="link" className="px-0 text-primary" onClick={() => navigate("/login")}>Se connecter</Button>
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block"><Sphere3D /></div>
    </div>
  );
}
