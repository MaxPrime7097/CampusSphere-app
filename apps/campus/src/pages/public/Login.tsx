import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Envelope,
  Eye,
  EyeSlash,
  Lock,
  Spinner,
  WarningCircle,
} from "@phosphor-icons/react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  supabaseSignIn,
  supabaseSignInWithGoogle,
  exchangeSupabaseToken,
  getCampusStatus,
  login as backendLogin,
} from "@/services/api";
import { AuthLanguageToggle, AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { useAuth } from "@/contexts/AuthContext";

export function Login() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });

  const searchParams = new URLSearchParams(window.location.search);
  const nextUrl = searchParams.get("next") || "/";

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired", { defaultValue: "L'email est requis" }))
      .email(t("validation.emailInvalid", { defaultValue: "Format d'email invalide" })),
    password: z
      .string()
      .min(1, t("validation.passwordRequired", { defaultValue: "Le mot de passe est requis" })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const fe: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) fe[err.path[0] as string] = err.message;
      });
      setErrors(fe);
      return;
    }

    setIsLoading(true);
    try {
      let exchangeRes: any = null;
      let userData: any = null;

      try {
        const data = await supabaseSignIn(formData.email, formData.password);
        if (data?.session?.access_token) {
          exchangeRes = await exchangeSupabaseToken(data.session.access_token);
          userData = exchangeRes?.data?.user;
        }
      } catch (sbErr: any) {
        // Fallback: Tentative de connexion directe via le backend API (Argon2)
        try {
          const directLoginRes = await backendLogin({
            email: formData.email,
            password: formData.password,
          });
          userData = (directLoginRes as any)?.data?.user ?? (directLoginRes as any)?.user;
        } catch {
          throw sbErr;
        }
      }

      await refreshUser();

      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("userEmail", formData.email);
      }

      toast({ title: t("login.success", { defaultValue: "Connexion réussie !" }), duration: 2000 });

      // Les comptes Impact Partner ne passent pas par l'onboarding étudiant ni par CampusGate
      const isPartner =
        (userData?.role || "").toLowerCase() === "impact_partner" ||
        Boolean(userData?.partnerProfile || userData?.partner_profile);

      if (isPartner) {
        navigate(userData?.username ? `/profile/partner/${userData.username}` : nextUrl, {
          replace: true,
        });
        return;
      }

      const university = (userData?.university || "").toLowerCase().trim();
      const isComplete =
        !exchangeRes?.data?.needs_profile_completion &&
        Boolean(university && userData?.faculty && (userData?.study_year || userData?.studyYear));

      if (!isComplete || !university) {
        navigate("/onboarding", { replace: true });
        return;
      }

      const isPilot =
        university === "iuc" || university.includes("côte") || university.includes("cote");
      if (!isPilot) {
        try {
          const status = await getCampusStatus(university);
          if (status && !status.isOpen) {
            navigate(`/campus-unlock?campus=${encodeURIComponent(university)}`, { replace: true });
            return;
          }
        } catch {
          navigate(`/campus-unlock?campus=${encodeURIComponent(university)}`, { replace: true });
          return;
        }
      }

      navigate(nextUrl);
    } catch (err: any) {
      const msg =
        err?.message || t("login.defaultError", { defaultValue: "Une erreur est survenue" });
      toast({
        title: t("login.errorTitle", { defaultValue: "Erreur de connexion" }),
        description: msg,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await supabaseSignInWithGoogle();
    } catch (err: any) {
      toast({ title: "Google OAuth", description: err?.message, variant: "destructive" });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="cs-pub-font min-h-screen bg-white text-[#18181b] grid lg:grid-cols-2">
      <Helmet>
        <title>{t("login.title", { defaultValue: "Connexion" })} — CampusSphere</title>
        <meta
          name="description"
          content={t("login.subtitle", {
            defaultValue: "Accède à ton espace campus, tes sphères et tes cours.",
          })}
        />
        <link rel="canonical" href="https://campussphere.app/login" />
      </Helmet>

      {/* Colonne Formulaire (Blanc pur) */}
      <div className="flex flex-col justify-between px-4 sm:px-10 lg:px-14 py-6 sm:py-8 overflow-y-auto">
        {/* Barre supérieure : logo cliquable → accueil + retour accueil (desktop) / langue (mobile) */}
        <div className="flex items-center justify-between max-w-md w-full mx-auto gap-2">
          <Link
            to="/cs"
            aria-label={`CampusSphere — ${t("sidePanel.backHome", { defaultValue: "Accueil" })}`}
            className="inline-flex items-center gap-2.5 group hover:opacity-90 transition-opacity"
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

        {/* Bloc formulaire centré */}
        <div className="w-full max-w-md mx-auto my-10">
          <div className="mb-7">
            <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-[#18181b] tracking-tight">
              {t("login.title", { defaultValue: "Connexion" })}
            </h1>
            <p className="font-nunito text-sm sm:text-base text-zinc-500 mt-1.5">
              {t("login.welcomeBack", { defaultValue: "Bon retour parmi nous !" })}
            </p>
          </div>

          <div className="space-y-5">
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
              {t("login.google", { defaultValue: "Continuer avec Google" })}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-black/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 font-poppins font-medium text-zinc-400">
                  {t("login.or", { defaultValue: "Ou" })}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <WarningCircle size={16} weight="duotone" className="h-4 w-4" />
                  <AlertDescription>
                    {t("login.validationError", {
                      defaultValue: "Veuillez corriger les erreurs ci-dessous",
                    })}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-poppins text-sm font-semibold text-[#18181b]">
                  {t("login.emailLabel", { defaultValue: "Email" })}
                </Label>
                <div className="relative">
                  <Envelope
                    size={17}
                    weight="duotone"
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("login.emailPlaceholder", {
                      defaultValue: "toi@exemple.com",
                    })}
                    className={`h-11 pl-10 bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                      errors.email ? "border-destructive" : ""
                    }`}
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="password"
                    className="font-poppins text-sm font-semibold text-[#18181b]"
                  >
                    {t("login.passwordLabel", { defaultValue: "Mot de passe" })}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="font-poppins text-xs font-semibold text-[#e65100] hover:underline"
                  >
                    {t("login.forgotPassword", { defaultValue: "Mot de passe oublié ?" })}
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={17}
                    weight="duotone"
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={t("login.passwordPlaceholder", { defaultValue: "••••••••" })}
                    className={`h-11 pl-10 pr-11 bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800] ${
                      errors.password ? "border-destructive" : ""
                    }`}
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? t("sidePanel.hidePassword", { defaultValue: "Masquer le mot de passe" })
                        : t("sidePanel.showPassword", { defaultValue: "Afficher le mot de passe" })
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-[#18181b] transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlash size={18} weight="duotone" aria-hidden="true" />
                    ) : (
                      <Eye size={18} weight="duotone" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(c) => setFormData((p) => ({ ...p, rememberMe: !!c }))}
                  className="border-black/25 data-[state=checked]:bg-[#ff9800] data-[state=checked]:border-[#ff9800]"
                />
                <Label
                  htmlFor="remember"
                  className="font-nunito text-sm text-zinc-600 font-normal cursor-pointer"
                >
                  {t("login.rememberMe", { defaultValue: "Se souvenir de moi" })}
                </Label>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full h-11 rounded-full bg-[#ff9800] hover:bg-[#f57c00] text-white font-poppins text-sm font-semibold shadow-md shadow-[#ff9800]/25 inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Spinner size={17} className="animate-spin" aria-hidden="true" />
                    {t("login.submittingButton", { defaultValue: "Connexion..." })}
                  </>
                ) : (
                  t("login.submitButton", { defaultValue: "Se connecter" })
                )}
              </button>
            </form>

            <p className="text-center font-nunito text-sm text-zinc-500">
              {t("login.noAccount", { defaultValue: "Pas encore de compte ?" })}{" "}
              <Link to="/register" className="font-poppins font-semibold text-[#e65100] hover:underline">
                {t("login.registerLink", { defaultValue: "S’inscrire" })}
              </Link>
            </p>
          </div>
        </div>

        {/* Mention légale en bas */}
        <p className="text-center font-nunito text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          {t("legalAgreement.byContinuing", { defaultValue: "En continuant, tu acceptes nos" })}{" "}
          <Link to="/cs/policies/terms" className="text-zinc-600 hover:text-[#e65100] underline">
            {t("legalAgreement.terms", { defaultValue: "Conditions d’utilisation" })}
          </Link>{" "}
          {t("legalAgreement.and", { defaultValue: "et notre" })}{" "}
          <Link to="/cs/policies/privacy" className="text-zinc-600 hover:text-[#e65100] underline">
            {t("legalAgreement.privacy", { defaultValue: "Politique de confidentialité" })}
          </Link>
          .
        </p>
      </div>

      {/* Panneau latéral Encre sombre */}
      <AuthSidePanel />
    </div>
  );
}
