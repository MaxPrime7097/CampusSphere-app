import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowClockwise,
  ArrowLeft,
  ArrowRight,
  Check,
  Envelope,
  Eye,
  EyeSlash,
  Spinner,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { FcGoogle } from "react-icons/fc";
import { z } from "zod";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  supabaseSignUp,
  supabaseSignInWithGoogle,
  exchangeSupabaseToken,
  getSupabaseRateLimitMetadata,
  supabaseResendSignupEmail,
  checkUserAvailability,
} from "@/services/api";
import { supabase } from "@/lib/supabase";
import { AuthLanguageToggle, AuthSidePanel } from "@/components/auth/AuthSidePanel";
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
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const getPasswordStrength = (password: string) => {
    if (!password)
      return { score: 0, label: t("register.strengthWeak"), color: "text-zinc-400" };

    let score = 0;
    if (password.length >= 8) score += 35;
    else if (password.length >= 6) score += 20;
    else score += 10;

    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    const cappedScore = Math.min(score, 100);

    if (cappedScore >= 75)
      return { score: cappedScore, label: t("register.strengthStrong"), color: "text-emerald-600" };
    if (cappedScore >= 45)
      return { score: cappedScore, label: t("register.strengthMedium"), color: "text-amber-600" };
    return { score: cappedScore, label: t("register.strengthWeak"), color: "text-red-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch =
    !!formData.password &&
    !!formData.confirmPassword &&
    formData.password === formData.confirmPassword;
  const hasConfirmInput = formData.confirmPassword.length > 0;

  const { refreshUser } = useAuth();

  useEffect(() => {
    const campusParam = searchParams.get("campus") || searchParams.get("ref");
    if (campusParam) {
      try {
        localStorage.setItem("campus_ref", campusParam.toLowerCase().trim());
      } catch {}
    }

    const verified = searchParams.get("verified");
    if (verified === "true") {
      (async () => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            await exchangeSupabaseToken(session.access_token);
            await refreshUser();
            navigate("/onboarding");
            toast({
              title: t("register.toast.emailVerifiedTitle"),
              description: t("register.toast.continueRegistrationDesc"),
              duration: 3000,
            });
          }
        } catch (err: any) {
          toast({
            title: t("register.toast.error"),
            description: err?.message,
            variant: "destructive",
          });
        }
      })();
    }
  }, [searchParams, toast, navigate, refreshUser, t]);

  useEffect(() => {
    if (step !== "verify") return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          await exchangeSupabaseToken(session.access_token);
          await refreshUser();
          navigate("/onboarding");
          toast({
            title: t("register.toast.emailVerifiedTitle"),
            description: t("register.toast.continueRegistrationDesc"),
            duration: 3000,
          });
        } catch (err: any) {
          toast({
            title: t("register.toast.error"),
            description: err?.message,
            variant: "destructive",
          });
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

  const step1Schema = z
    .object({
      firstName: z.string().trim().min(2, t("validation.minChars", { count: 2 })),
      lastName: z.string().trim().min(2, t("validation.minChars", { count: 2 })),
      username: z.string().trim().min(3, t("validation.minChars", { count: 3 })),
      email: z.string().email(t("validation.emailInvalid")),
      password: z.string().min(8, t("validation.passwordMinChars", { count: 8 })),
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    });

  const handleInputChange = (field: string, value: string) => {
    const sensitiveFields = new Set(["username", "email"]);
    const sanitizedValue = sensitiveFields.has(field) ? value.trim() : value;
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    const username = formData.username.trim();
    if (step !== 1 || username.length < 3) {
      setAvailability((prev) => ({
        ...prev,
        username: { checking: false, available: true, checkedValue: "" },
      }));
      return;
    }

    const timeout = setTimeout(async () => {
      setAvailability((prev) => ({ ...prev, username: { ...prev.username, checking: true } }));
      try {
        const response = await checkUserAvailability({ username });
        const isAvailable = response?.data?.username?.available ?? true;
        setAvailability((prev) => ({
          ...prev,
          username: { checking: false, available: isAvailable, checkedValue: username },
        }));

        if (!isAvailable) {
          setErrors((prev) => ({ ...prev, username: t("register.usernameTaken") }));
        } else if (errors.username === t("register.usernameTaken")) {
          setErrors((prev) => {
            const e = { ...prev };
            delete e.username;
            return e;
          });
        }
      } catch {
        setAvailability((prev) => ({ ...prev, username: { ...prev.username, checking: false } }));
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.username, step, t, errors.username]);

  useEffect(() => {
    const email = formData.email.trim().toLowerCase();
    if (step !== 1 || !email || !z.string().email().safeParse(email).success) {
      setAvailability((prev) => ({
        ...prev,
        email: { checking: false, available: true, checkedValue: "" },
      }));
      return;
    }

    const timeout = setTimeout(async () => {
      setAvailability((prev) => ({ ...prev, email: { ...prev.email, checking: true } }));
      try {
        const response = await checkUserAvailability({ email });
        const isAvailable = response?.data?.email?.available ?? true;
        setAvailability((prev) => ({
          ...prev,
          email: { checking: false, available: isAvailable, checkedValue: email },
        }));

        if (!isAvailable) {
          setErrors((prev) => ({ ...prev, email: t("register.emailTaken") }));
        } else if (errors.email === t("register.emailTaken")) {
          setErrors((prev) => {
            const e = { ...prev };
            delete e.email;
            return e;
          });
        }
      } catch {
        setAvailability((prev) => ({ ...prev, email: { ...prev.email, checking: false } }));
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData.email, step, t, errors.email]);

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await supabaseSignInWithGoogle();
    } catch (err: any) {
      toast({
        title: t("register.toast.error"),
        description: err?.message,
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleStep1Submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const now = Date.now();
    if (now - signupLastSubmitAtRef.current < SUBMIT_DEBOUNCE_MS || isLoading) {
      return;
    }
    signupLastSubmitAtRef.current = now;

    const validation = step1Schema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!availability.username.available) {
      setErrors((prev) => ({ ...prev, username: t("register.usernameTaken") }));
      return;
    }

    if (!availability.email.available) {
      setErrors((prev) => ({ ...prev, email: t("register.emailTaken") }));
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
      toast({
        title: t("register.toast.accountCreatedTitle"),
        description: t("register.toast.accountCreatedDesc"),
        duration: 3000,
      });
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
        toast({
          title: t("register.toast.error"),
          description: err?.message,
          variant: "destructive",
        });
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
        toast({
          title: t("register.toast.error"),
          description: err?.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="cs-pub-font min-h-screen bg-white text-[#18181b] grid lg:grid-cols-2">
      <Helmet>
        <title>{t("register.metaTitle")}</title>
        <meta name="description" content={t("register.metaDesc")} />
        <link rel="canonical" href="https://campussphere.app/register" />
      </Helmet>

      {/* Colonne Formulaire (Blanc pur) */}
      <div className="flex flex-col justify-between px-4 sm:px-10 lg:px-14 py-6 sm:py-8 overflow-y-auto">
        {/* Barre supérieure : logo cliquable → accueil + retour accueil (desktop) / langue (mobile) */}
        <div className="flex items-center justify-between max-w-lg w-full mx-auto gap-2">
          <Link
            to="/cs"
            aria-label={`CampusSphere — ${t("sidePanel.backHome", { defaultValue: "Accueil" })}`}
            className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <img src="/CS.svg" alt="CampusSphere" className="w-8 h-8" />
            <span className="font-automata text-lg font-bold campus-gradient bg-clip-text text-transparent">
              CampusSphere
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <AuthLanguageToggle tone="light" className="lg:hidden" />
            <Link
              to="/cs"
              className="hidden lg:inline-flex items-center gap-1.5 font-poppins text-xs font-semibold text-zinc-500 hover:text-[#18181b] transition-colors"
            >
              <ArrowLeft size={14} weight="bold" aria-hidden="true" />
              {t("sidePanel.backHome", { defaultValue: "Accueil" })}
            </Link>
          </div>
        </div>

        {/* Bloc inscription */}
        <div className="w-full max-w-lg mx-auto my-8">
          {step === 1 && (
            <>
              <div className="mb-6">
                <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-[#18181b] tracking-tight">
                  {t("register.createAccount")}
                </h1>
                <p className="font-nunito text-sm sm:text-base text-zinc-500 mt-1.5">
                  {t("register.joinCampusSphere")}
                </p>
              </div>

              <div className="space-y-5">
                {Object.keys(errors).length > 0 && (
                  <Alert variant="destructive">
                    <WarningCircle size={16} weight="duotone" className="h-4 w-4" />
                    <AlertDescription>{t("register.validationError")}</AlertDescription>
                  </Alert>
                )}

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full h-11 px-4 rounded-xl border border-black/15 bg-white hover:bg-[#faf8f5] hover:border-black/25 text-[#18181b] font-poppins text-sm font-semibold inline-flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isGoogleLoading ? (
                    <Spinner size={18} className="animate-spin text-[#ff9800]" aria-hidden="true" />
                  ) : (
                    <FcGoogle className="h-5 w-5" aria-hidden="true" />
                  )}
                  {t("login.google")}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-black/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 font-poppins font-medium text-zinc-400">
                      {t("register.orWithEmail")}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5 min-w-0">
                      <Label
                        htmlFor="reg-firstName"
                        className="font-poppins text-sm font-semibold text-[#18181b]"
                      >
                        {t("register.firstNameLabel")} *
                      </Label>
                      <Input
                        id="reg-firstName"
                        autoComplete="given-name"
                        maxLength={REGISTRATION_MAX_LENGTHS.firstName}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        className={`h-11 w-full min-w-0 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                          errors.firstName ? "border-destructive" : ""
                        }`}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-destructive">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label
                        htmlFor="reg-lastName"
                        className="font-poppins text-sm font-semibold text-[#18181b]"
                      >
                        {t("register.lastNameLabel")} *
                      </Label>
                      <Input
                        id="reg-lastName"
                        autoComplete="family-name"
                        maxLength={REGISTRATION_MAX_LENGTHS.lastName}
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        className={`h-11 w-full min-w-0 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                          errors.lastName ? "border-destructive" : ""
                        }`}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-destructive">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5 min-w-0">
                      <Label
                        htmlFor="reg-username"
                        className="font-poppins text-sm font-semibold text-[#18181b]"
                      >
                        {t("register.usernameLabel")} *
                      </Label>
                      <Input
                        id="reg-username"
                        autoComplete="username"
                        maxLength={REGISTRATION_MAX_LENGTHS.username}
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className={`h-11 w-full min-w-0 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                          errors.username ? "border-destructive" : ""
                        }`}
                      />
                      {availability.username.checking && (
                        <p className="text-xs text-zinc-500">{t("register.checkingUsername")}</p>
                      )}
                      {errors.username && (
                        <p className="text-xs text-destructive">{errors.username}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label
                        htmlFor="reg-email"
                        className="font-poppins text-sm font-semibold text-[#18181b]"
                      >
                        {t("register.emailLabel")} *
                      </Label>
                      <Input
                        id="reg-email"
                        type="email"
                        autoComplete="email"
                        maxLength={REGISTRATION_MAX_LENGTHS.email}
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`h-11 w-full min-w-0 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                          errors.email ? "border-destructive" : ""
                        }`}
                      />
                      {availability.email.checking && (
                        <p className="text-xs text-zinc-500">{t("register.checkingEmail")}</p>
                      )}
                      {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5 min-w-0">
                      <Label
                        htmlFor="reg-password"
                        className="font-poppins text-sm font-semibold text-[#18181b]"
                      >
                        {t("register.passwordLabel")} *
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          maxLength={REGISTRATION_MAX_LENGTHS.password}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={`h-11 w-full min-w-0 pr-10 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                            errors.password ? "border-destructive" : ""
                          }`}
                        />
                        <button
                          type="button"
                          aria-label={
                            showPassword
                              ? t("sidePanel.hidePassword", { defaultValue: "Masquer le mot de passe" })
                              : t("sidePanel.showPassword", { defaultValue: "Afficher le mot de passe" })
                          }
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#18181b] transition-colors"
                        >
                          {showPassword ? (
                            <EyeSlash size={18} weight="duotone" aria-hidden="true" />
                          ) : (
                            <Eye size={18} weight="duotone" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <div className="pt-1 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">{t("register.passwordStrength")}</span>
                          <span className={`font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <Progress value={passwordStrength.score} className="h-1.5" />
                      </div>
                      {errors.password && (
                        <p className="text-xs text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label
                        htmlFor="reg-confirmPassword"
                        className="font-poppins text-sm font-semibold text-[#18181b]"
                      >
                        {t("register.confirmLabel")} *
                      </Label>
                      <div className="relative">
                        <Input
                          id="reg-confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          maxLength={REGISTRATION_MAX_LENGTHS.password}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          className={`h-11 w-full min-w-0 pr-10 bg-white border-black/15 text-[#18181b] focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                            errors.confirmPassword ? "border-destructive" : ""
                          }`}
                        />
                        <button
                          type="button"
                          aria-label={
                            showConfirmPassword
                              ? t("sidePanel.hidePassword", { defaultValue: "Masquer le mot de passe" })
                              : t("sidePanel.showPassword", { defaultValue: "Afficher le mot de passe" })
                          }
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#18181b] transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeSlash size={18} weight="duotone" aria-hidden="true" />
                          ) : (
                            <Eye size={18} weight="duotone" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {hasConfirmInput && (
                        <p
                          className={`flex items-center gap-1 text-xs ${
                            passwordsMatch ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {passwordsMatch ? (
                            <Check size={14} weight="bold" aria-hidden="true" />
                          ) : (
                            <X size={14} weight="bold" aria-hidden="true" />
                          )}
                          {passwordsMatch
                            ? t("register.passwordsMatch")
                            : t("register.passwordsDoNotMatch")}
                        </p>
                      )}
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isLoading || availability.email.checking || availability.username.checking
                    }
                    className="w-full h-11 mt-2 rounded-full bg-[#ff9800] hover:bg-[#f57c00] text-white font-poppins text-sm font-semibold shadow-md shadow-[#ff9800]/25 inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isLoading ? (
                      <Spinner size={17} className="animate-spin" aria-hidden="true" />
                    ) : null}
                    <span>{t("register.next")}</span>
                    <ArrowRight size={16} weight="bold" aria-hidden="true" />
                  </button>
                </form>

                <p className="text-center font-nunito text-sm text-zinc-500">
                  {t("register.alreadyHaveAccount")}{" "}
                  <Link
                    to="/login"
                    className="font-poppins font-semibold text-[#e65100] hover:underline"
                  >
                    {t("register.signIn")}
                  </Link>
                </p>
              </div>
            </>
          )}

          {/* ── ÉCRAN VÉRIFICATION EMAIL ── */}
          {step === "verify" && (
            <div className="text-center space-y-6 py-6 rounded-3xl bg-[#faf8f5] border border-black/8 p-6 sm:p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#fff7ed] text-[#ff9800] flex items-center justify-center mx-auto">
                <Envelope size={32} weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-poppins text-2xl font-bold text-[#18181b] mb-2">
                  {t("register.verifyStep.title")}
                </h1>
                <p className="font-nunito text-zinc-600 text-sm">
                  {t("register.verifyStep.sentTo")}
                  <br />
                  <strong className="text-[#18181b]">{formData.email}</strong>
                </p>
              </div>
              <div className="bg-white border border-black/8 rounded-2xl p-4 text-sm text-zinc-600 space-y-1">
                <p>{t("register.verifyStep.clickLink")}</p>
                <p>{t("register.verifyStep.autoUpdate")}</p>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending || resendCooldownRemaining > 0}
                  className="w-full h-11 rounded-full bg-[#09090b] hover:bg-zinc-800 text-white font-poppins text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isResending ? (
                    <Spinner size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowClockwise size={16} weight="bold" aria-hidden="true" />
                  )}
                  {resendCooldownRemaining > 0
                    ? t("register.verifyStep.resendCooldown", { seconds: resendCooldownRemaining })
                    : t("register.verifyStep.resend")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-poppins text-xs font-semibold text-zinc-500 hover:text-[#18181b] py-2 transition-colors"
                >
                  {t("register.verifyStep.changeEmail")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mention légale en bas */}
        <p className="text-center font-nunito text-xs text-zinc-400 max-w-lg mx-auto leading-relaxed">
          {t("legalAgreement.byContinuing")}{" "}
          <Link to="/cs/policies/terms" className="text-zinc-600 hover:text-[#e65100] underline">
            {t("legalAgreement.terms")}
          </Link>{" "}
          {t("legalAgreement.and")}{" "}
          <Link
            to="/cs/policies/privacy"
            className="text-zinc-600 hover:text-[#e65100] underline"
          >
            {t("legalAgreement.privacy")}
          </Link>
          .
        </p>
      </div>

      {/* Panneau latéral Encre sombre */}
      <AuthSidePanel />
    </div>
  );
}
