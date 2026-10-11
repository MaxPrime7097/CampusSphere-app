import { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
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
const RESEND_COOLDOWN_SECONDS = 60;
const SUBMIT_DEBOUNCE_MS = 1000;

export function Register() {
  const { t } = useTranslation("auth");
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
    password: "", confirmPassword: "",
  });

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: t("register.strengthWeak"), color: "text-muted-foreground" };

    let score = 0;
    if (password.length >= 8) score += 35;
    else if (password.length >= 6) score += 20;
    else score += 10;

    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    const cappedScore = Math.min(score, 100);

    if (cappedScore >= 75) return { score: cappedScore, label: t("register.strengthStrong"), color: "text-emerald-600" };
    if (cappedScore >= 45) return { score: cappedScore, label: t("register.strengthMedium"), color: "text-amber-600" };
    return { score: cappedScore, label: t("register.strengthWeak"), color: "text-red-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = !!formData.password && !!formData.confirmPassword && formData.password === formData.confirmPassword;
  const hasConfirmInput = formData.confirmPassword.length > 0;

  const { refreshUser } = useAuth();

  useEffect(() => {
    const campusParam = searchParams.get('campus') || searchParams.get('ref');
    if (campusParam) {
      try {
        localStorage.setItem('campus_ref', campusParam.toLowerCase().trim());
      } catch {}
    }

    const verified = searchParams.get('verified');
    if (verified === 'true') {
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await exchangeSupabaseToken(session.access_token);
            await refreshUser();
            navigate("/onboarding");
            toast({ title: t("register.toast.emailVerifiedTitle"), description: t("register.toast.continueRegistrationDesc"), duration: 3000 });
          }
        } catch (err: any) {
          toast({ title: t("register.toast.error"), description: err?.message, variant: "destructive" });
        }
      })();
    }
  }, [searchParams, toast, navigate, refreshUser, t]);

  useEffect(() => {
    if (step !== "verify") return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          await exchangeSupabaseToken(session.access_token);
          await refreshUser();
          navigate("/onboarding");
          toast({ title: t("register.toast.emailVerifiedTitle"), description: t("register.toast.continueRegistrationDesc"), duration: 3000 });
        } catch (err: any) {
          toast({ title: t("register.toast.error"), description: err?.message, variant: "destructive" });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [step, navigate, toast, refreshUser, t]);

  useEffect(() => {
    if (resendCooldownRemaining <= 0) return;
    const timeoutId = window.setTimeout(() => {
      setResendCooldownRemaining((previous) => Math.max(previous - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [resendCooldownRemaining]);

  const step1Schema = z.object({
    firstName: z.string().trim().min(2, t("validation.minChars", { count: 2 })),
    lastName: z.string().trim().min(2, t("validation.minChars", { count: 2 })),
    username: z.string().trim().min(3, t("validation.minChars", { count: 3 })),
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string().min(8, t("validation.passwordMinChars", { count: 8 })),
    confirmPassword: z.string(),
  }).refine(d => d.password === d.confirmPassword, {
    message: t("validation.passwordsMismatch"),
    path: ["confirmPassword"],
  });

  const handleInputChange = (field: string, value: string) => {
    const sensitiveFields = new Set(["username", "email"]);
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
          setErrors(prev => ({ ...prev, username: t("register.usernameTaken") }));
        } else if (errors.username === t("register.usernameTaken")) {
          setErrors(prev => { const e = { ...prev }; delete e.username; return e; });
        }
      } catch {
        setAvailability(prev => ({ ...prev, username: { ...prev.username, checking: false } }));
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.username, step, t, errors.username]);

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
          setErrors(prev => ({ ...prev, email: t("register.emailTaken") }));
        } else if (errors.email === t("register.emailTaken")) {
          setErrors(prev => { const e = { ...prev }; delete e.email; return e; });
        }
      } catch {
        setAvailability(prev => ({ ...prev, email: { ...prev.email, checking: false } }));
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.email, step, t, errors.email]);

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await supabaseSignInWithGoogle();
    } catch (err: any) {
      toast({ title: t("register.toast.error"), description: err?.message, variant: "destructive" });
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
      setErrors(prev => ({ ...prev, username: t("register.usernameTaken") }));
      return;
    }

    if (!availability.email.available) {
      setErrors(prev => ({ ...prev, email: t("register.emailTaken") }));
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await supabaseSignUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
      });

      setResendCooldownRemaining(RESEND_COOLDOWN_SECONDS);
      setStep("verify");
      toast({ title: t("register.toast.accountCreatedTitle"), description: t("register.toast.accountCreatedDesc"), duration: 3000 });
    } catch (err: any) {
      const rateLimit = getSupabaseRateLimitMetadata(err);
      if (rateLimit) {
        const waitSeconds = rateLimit.waitSeconds ?? RESEND_COOLDOWN_SECONDS;
        setResendCooldownRemaining(waitSeconds);
        toast({
          title: t("register.toast.rateLimitTitle"),
          description: t("register.toast.rateLimitDesc", { seconds: waitSeconds }),
          variant: "destructive",
        });
      } else {
        toast({ title: t("register.toast.error"), description: err?.message, variant: "destructive" });
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
      toast({ title: t("register.toast.emailResent"), duration: 2000 });
    } catch (err: any) {
      const rateLimit = getSupabaseRateLimitMetadata(err);
      if (rateLimit) {
        const waitSeconds = rateLimit.waitSeconds ?? RESEND_COOLDOWN_SECONDS;
        setResendCooldownRemaining(waitSeconds);
        toast({
          title: t("register.toast.rateLimitTitle"),
          description: t("register.toast.rateLimitResendDesc", { seconds: waitSeconds }),
          variant: "destructive",
        });
      } else {
        toast({ title: t("register.toast.error"), description: err?.message, variant: "destructive" });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 grid lg:grid-cols-2 overflow-hidden">
      <Helmet>
        <title>{t("register.metaTitle")}</title>
        <meta name="description" content={t("register.metaDesc")} />
        <link rel="canonical" href="https://campussphere.app/register" />
      </Helmet>
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-xl">
        <div className="text-center mb-8 cursor-pointer" onClick={() => navigate("/cs-inc")}>
          <span className="text-2xl font-bold font-automata text-primary">CampusSphere</span>
          <p className="text-muted-foreground mt-2">
            {step === "verify" ? t("register.verifyEmailTitle") : t("register.joinCampusSphere")}
          </p>
        </div>

        <div className="space-y-6 p-5 pt-0 mt-4">
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("register.validationError")}</AlertDescription>
            </Alert>
          )}

          {/* ── ÉTAPE 1 : Infos personnelles ── */}
          {step === 1 && (
            <div className="space-y-4">
              <CardTitle className="text-center text-2xl">{t("register.createAccount")}</CardTitle>

              {/* Boutons OAuth */}
              <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={isGoogleLoading || isLoading} type="button">
                  {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FcGoogle className="mr-2 h-4 w-4" />}
                  {t("login.google")}
                </Button>
                <Button variant="outline" className="hidden w-full disabled" onClick={() => supabaseSignInWithFacebook()} type="button">
                  <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                  {t("login.facebook")}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><Separator /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("register.orWithEmail")}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>{t("register.lastNameLabel")} *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.firstName} value={formData.firstName} onChange={e => handleInputChange("firstName", e.target.value)} className={`w-full min-w-0 ${errors.firstName ? "border-destructive" : ""}`} />
                  {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div className="min-w-0">
                  <Label>{t("register.firstNameLabel")} *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.lastName} value={formData.lastName} onChange={e => handleInputChange("lastName", e.target.value)} className={`w-full min-w-0 ${errors.lastName ? "border-destructive" : ""}`} />
                  {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>{t("register.usernameLabel")} *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.username} value={formData.username} onChange={e => handleInputChange("username", e.target.value)} className={`w-full min-w-0 ${errors.username ? "border-destructive" : ""}`} />
                  {availability.username.checking && <p className="text-xs text-muted-foreground mt-1">{t("register.checkingUsername")}</p>}
                  {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
                </div>
                <div className="min-w-0">
                  <Label>{t("register.emailLabel")} *</Label>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.email} type="email" value={formData.email} onChange={e => handleInputChange("email", e.target.value)} className={`w-full min-w-0 ${errors.email ? "border-destructive" : ""}`} />
                  {availability.email.checking && <p className="text-xs text-muted-foreground mt-1">{t("register.checkingEmail")}</p>}
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="min-w-0">
                  <Label>{t("register.passwordLabel")} *</Label>
                  <div className="relative">
                    <Input maxLength={REGISTRATION_MAX_LENGTHS.password} type={showPassword ? "text" : "password"} value={formData.password} onChange={e => handleInputChange("password", e.target.value)} className={`w-full min-w-0 pr-10 ${errors.password ? "border-destructive" : ""}`} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t("register.passwordStrength")}</span>
                      <span className={`font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </div>
                    <Progress value={passwordStrength.score} className="h-1.5" />
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>
                <div className="min-w-0">
                  <Label>{t("register.confirmLabel")} *</Label>
                  <div className="relative">
                    <Input maxLength={REGISTRATION_MAX_LENGTHS.password} type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={e => handleInputChange("confirmPassword", e.target.value)} className={`w-full min-w-0 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`} />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {hasConfirmInput && (
                    <p className={`mt-1 flex items-center gap-1 text-xs ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                      {passwordsMatch ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      {passwordsMatch ? t("register.passwordsMatch") : t("register.passwordsDoNotMatch")}
                    </p>
                  )}
                  {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleStep1Submit} disabled={isLoading || availability.email.checking || availability.username.checking} className="campus-gradient text-white hover:opacity-90">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("register.next")} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="text-center mt-8 text-sm text-muted-foreground">
                <p>
                  {t("legalAgreement.byContinuing")}{" "}
                  <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate("/cs-inc/policies/terms")}>{t("legalAgreement.terms")}</Button>
                  {" "}{t("legalAgreement.and")}{" "}
                  <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate("/cs-inc/policies/privacy")}>{t("legalAgreement.privacy")}</Button>
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
                <h2 className="text-xl font-bold mb-2">{t("register.verifyStep.title")}</h2>
                <p className="text-muted-foreground text-sm">
                  {t("register.verifyStep.sentTo")}<br />
                  <strong className="text-foreground">{formData.email}</strong>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p>{t("register.verifyStep.clickLink")}</p>
                <p className="mt-1">{t("register.verifyStep.autoUpdate")}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={handleResendEmail} disabled={isResending || resendCooldownRemaining > 0}>
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {resendCooldownRemaining > 0 ? t("register.verifyStep.resendCooldown", { seconds: resendCooldownRemaining }) : t("register.verifyStep.resend")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  {t("register.verifyStep.changeEmail")}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-muted-foreground text-sm">
            {t("register.alreadyHaveAccount")}{" "}
            <Button variant="link" className="p-0 text-primary" onClick={() => navigate("/login")}>
              {t("register.signIn")}
            </Button>
          </p>
        </div>
      </div>
      </div>
      <AuthSidePanel />
    </div>
  );
}
