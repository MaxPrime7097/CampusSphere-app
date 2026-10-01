import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { CaretRight as ChevronRight, Check, Spinner as Loader2, WarningCircle as AlertCircle, Eye, EyeSlash as EyeOff, X, Envelope as Mail, ArrowClockwise as RefreshCw } from "@phosphor-icons/react";
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  supabaseSignUp,
  supabaseSignInWithGoogle,
  supabaseSignInWithFacebook,
  exchangeSupabaseToken,
  getSupabaseRateLimitMetadata,
  supabaseResendSignupEmail,
  checkUserAvailability,
} from "@/services/api";
import { supabase } from "@/lib/supabase";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { useAuth } from "@/contexts/AuthContext";

type Step = 1 | "verify";
const MINIMUM_AGE = 16;
const RESEND_COOLDOWN_SECONDS = 60;
const SUBMIT_DEBOUNCE_MS = 1000;

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

const getBirthDateMax = () => {
  const now = new Date();
  const maxDate = new Date(Date.UTC(now.getUTCFullYear() - MINIMUM_AGE, now.getUTCMonth(), now.getUTCDate()));
  return maxDate.toISOString().split("T")[0];
};

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldownRemaining, setResendCooldownRemaining] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [availability, setAvailability] = useState({
    email: { checking: false, available: true, checkedValue: "" },
    username: { checking: false, available: true, checkedValue: "" },
  });
  const signupLastSubmitAtRef = useRef(0);
  const resendLastSubmitAtRef = useRef(0);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", username: "", email: "",
    phoneNumber: "", dateOfBirth: "", password: "", confirmPassword: "",
  });

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

  const { refreshUser } = useAuth();

  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await exchangeSupabaseToken(session.access_token);
            await refreshUser();
            navigate("/onboarding");
            toast({ title: "Email vérifié ✓", description: "Continuez votre inscription", duration: 3000 });
          }
        } catch (err: any) {
          toast({ title: "Erreur", description: err?.message, variant: "destructive" });
        }
      })();
    }
  }, [searchParams, toast, navigate, refreshUser]);

  useEffect(() => {
    if (step !== "verify") return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          await exchangeSupabaseToken(session.access_token);
          await refreshUser();
          navigate("/onboarding");
          toast({ title: "Email vérifié ✓", description: "Continuez votre inscription", duration: 3000 });
        } catch (err: any) {
          toast({ title: "Erreur", description: err?.message, variant: "destructive" });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [step, navigate, toast, refreshUser]);

  useEffect(() => {
    if (resendCooldownRemaining <= 0) return;
    const timeoutId = window.setTimeout(() => {
      setResendCooldownRemaining((previous) => Math.max(previous - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [resendCooldownRemaining]);

  const minimumAgeMessage = `Vous devez avoir au moins ${MINIMUM_AGE} ans`;
  const step1Schema = z.object({
    firstName: z.string().trim().min(2, "Au moins 2 caractères"),
    lastName: z.string().trim().min(2, "Au moins 2 caractères"),
    username: z.string().trim().min(3, "Au moins 3 caractères"),
    email: z.string().email("Email invalide"),
    phoneNumber: z.string()
      .regex(/^(?:\d{9})?$/, "Le numéro doit contenir 9 chiffres")
      .optional()
      .or(z.literal("")),
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
    password: z.string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  }).refine(d => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

  const handleInputChange = (field: string, value: string) => {
    const sensitiveFields = new Set(["username", "email", "phoneNumber"]);
    const sanitizedValue = sensitiveFields.has(field) ? value.trim() : value;
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    const username = formData.username.trim();
    if (step !== 1 || username.length < 3) {
      setAvailability(prev => ({ ...prev, username: { checking: false, available: true, checkedValue: "" } }));
      return;
    }

    const timeout = setTimeout(async () => {
      setAvailability(prev => ({ ...prev, username: { ...prev.username, checking: true } }));
      try {
        const response = await checkUserAvailability({ username });
        const isAvailable = response?.data?.username?.available ?? true;
        setAvailability(prev => ({ ...prev, username: { checking: false, available: isAvailable, checkedValue: username } }));
        
        if (!isAvailable) {
          setErrors(prev => ({ ...prev, username: "Ce nom d'utilisateur est déjà pris" }));
        } else if (errors.username === "Ce nom d'utilisateur est déjà pris") {
          setErrors(prev => { const e = { ...prev }; delete e.username; return e; });
        }
      } catch {
        setAvailability(prev => ({ ...prev, username: { ...prev.username, checking: false } }));
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.username, step]);

  useEffect(() => {
    const email = formData.email.trim().toLowerCase();
    if (step !== 1 || !email || !z.string().email().safeParse(email).success) {
      setAvailability(prev => ({ ...prev, email: { checking: false, available: true, checkedValue: "" } }));
      return;
    }

    const timeout = setTimeout(async () => {
      setAvailability(prev => ({ ...prev, email: { ...prev.email, checking: true } }));
      try {
        const response = await checkUserAvailability({ email });
        const isAvailable = response?.data?.email?.available ?? true;
        setAvailability(prev => ({ ...prev, email: { checking: false, available: isAvailable, checkedValue: email } }));
        
        if (!isAvailable) {
          setErrors(prev => ({ ...prev, email: "Cet email est déjà utilisé" }));
        } else if (errors.email === "Cet email est déjà utilisé") {
          setErrors(prev => { const e = { ...prev }; delete e.email; return e; });
        }
      } catch {
        setAvailability(prev => ({ ...prev, email: { ...prev.email, checking: false } }));
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.email, step]);

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await supabaseSignInWithGoogle();
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
      setIsGoogleLoading(false);
    }
  };

  const handleStep1Submit = async () => {
    const now = Date.now();
    if (now - signupLastSubmitAtRef.current < SUBMIT_DEBOUNCE_MS || isLoading) {
      return;
    }
    signupLastSubmitAtRef.current = now;

    const validation = step1Schema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!availability.username.available) {
      setErrors(prev => ({ ...prev, username: "Ce nom d'utilisateur est déjà pris" }));
      return;
    }

    if (!availability.email.available) {
      setErrors(prev => ({ ...prev, email: "Cet email est déjà utilisé" }));
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await supabaseSignUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        date_of_birth: formData.dateOfBirth,
      });

      setResendCooldownRemaining(RESEND_COOLDOWN_SECONDS);
      setStep("verify");
      toast({ title: "Compte créé !", description: "Veuillez vérifier votre email.", duration: 3000 });
    } catch (err: any) {
      const rateLimit = getSupabaseRateLimitMetadata(err);
      if (rateLimit) {
        const waitSeconds = rateLimit.waitSeconds ?? RESEND_COOLDOWN_SECONDS;
        setResendCooldownRemaining(waitSeconds);
        toast({
          title: "Limite atteinte",
          description: `Veuillez patienter ${waitSeconds}s avant de réessayer.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Erreur", description: err?.message, variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    const now = Date.now();
    if (
      resendCooldownRemaining > 0 ||
      isResending ||
      now - resendLastSubmitAtRef.current < SUBMIT_DEBOUNCE_MS
    ) {
      return;
    }
    resendLastSubmitAtRef.current = now;

    setIsResending(true);
    try {
      await supabaseResendSignupEmail(formData.email);
      setResendCooldownRemaining(RESEND_COOLDOWN_SECONDS);
      toast({ title: "Email renvoyé !", duration: 2000 });
    } catch (err: any) {
      const rateLimit = getSupabaseRateLimitMetadata(err);
      if (rateLimit) {
        const waitSeconds = rateLimit.waitSeconds ?? RESEND_COOLDOWN_SECONDS;
        setResendCooldownRemaining(waitSeconds);
        toast({
          title: "Envoi limité temporairement",
          description: `Merci de patienter ${waitSeconds}s avant de renvoyer l'email.`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Erreur", description: err?.message, variant: "destructive" });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 grid lg:grid-cols-2 overflow-hidden">
      <Helmet>
        <title>Inscription - CampusSphere</title>
        <meta name="description" content="Rejoignez CampusSphere et connectez-vous avec des milliers d'étudiants. Créez votre profil, rejoignez des sphères et partagez vos ressources." />
        <link rel="canonical" href="https://campussphere.app/register" />
      </Helmet>
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-xl">
        <div className="text-center mb-8 cursor-pointer" onClick={() => navigate("/cs-inc")}>
          <span className="text-2xl font-bold font-automata text-primary">CampusSphere</span>
          <p className="text-muted-foreground mt-2">
            {step === "verify" ? "Vérification de l'email" : `Rejoignez CampusSphere !`}
          </p>
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
              <CardTitle className="text-center text-2xl">Créer votre compte</CardTitle>

              {/* Boutons OAuth */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={isGoogleLoading || isLoading} type="button">
                  {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FcGoogle className="mr-2 h-4 w-4" />}
                  Continuer avec Google
                </Button>
                <Button variant="outline" className="hidden w-full disabled" onClick={() => supabaseSignInWithFacebook()} type="button">
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
                  {availability.username.checking && <p className="text-xs text-muted-foreground mt-1">Vérification du nom d'utilisateur…</p>}
                  {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
                </div>
                <div className="min-w-0">
                  <Label>Email *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.email} type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} className={`w-full min-w-0 ${errors.email ? "border-destructive" : ""}`} />
                  {availability.email.checking && <p className="text-xs text-muted-foreground mt-1">Vérification de l'email…</p>}
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>Date de naissance *</Label>
                  <Input type="date" max={getBirthDateMax()} value={formData.dateOfBirth} onChange={e => handleInputChange("dateOfBirth", e.target.value)} className={`w-full min-w-0 ${errors.dateOfBirth ? "border-destructive" : ""}`} />
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
                <Button onClick={handleStep1Submit} disabled={isLoading || availability.email.checking || availability.username.checking} className="campus-gradient text-white hover:opacity-90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Suivant <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                <p>
                  En continuant, vous acceptez nos{" "}
                  <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate("/cs-inc/policies/terms")}>Conditions d'utilisation</Button>
                  {" "}et notre{" "}
                  <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate("/cs-inc/policies/privacy")}>Politique de confidentialité</Button>
                </p>
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
                <Button variant="outline" onClick={handleResendEmail} disabled={isResending || resendCooldownRemaining > 0}>
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {resendCooldownRemaining > 0 ? `Renvoyer l'email (${resendCooldownRemaining}s)` : "Renvoyer l'email"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Modifier l'email
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm">
            Déjà un compte ?{" "}
            <Button variant="link" className="p-0 text-primary" onClick={() => navigate("/login")}>
              Se connecter
            </Button>
          </p>
        </div>
      </div>
      </div>
      <AuthSidePanel />
    </div>
  );
}
