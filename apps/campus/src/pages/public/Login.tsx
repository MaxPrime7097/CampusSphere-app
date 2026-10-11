import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Eye, EyeSlash as EyeOff, Envelope as Mail, Lock, Spinner as Loader2, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabaseSignIn, supabaseSignInWithGoogle, supabaseSignInWithFacebook, exchangeSupabaseToken, getCampusStatus } from "@/services/api";
import { AuthSidePanel } from "@/components/auth/AuthSidePanel";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export function Login() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "", rememberMe: false });

  const searchParams = new URLSearchParams(window.location.search);
  const nextUrl = searchParams.get("next") || "/";

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t('validation.emailRequired', { defaultValue: "L'email est requis" }))
      .email(t('validation.emailInvalid', { defaultValue: "Format d'email invalide" })),
    password: z
      .string()
      .min(1, t('validation.passwordRequired', { defaultValue: "Le mot de passe est requis" })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const fe: Record<string, string> = {};
      validation.error.errors.forEach(err => { if (err.path[0]) fe[err.path[0] as string] = err.message; });
      setErrors(fe);
      return;
    }

    setIsLoading(true);
    try {
      const data = await supabaseSignIn(formData.email, formData.password);
      if (!data.session) throw new Error("Session introuvable après connexion");

      const exchangeRes = await exchangeSupabaseToken(data.session.access_token);
      await refreshUser();

      if (formData.rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("userEmail", formData.email);
      }

      toast({ title: t('login.success', { defaultValue: "Connexion réussie !" }), duration: 2000 });

      const userData = exchangeRes?.data?.user;
      const university = (userData?.university || "").toLowerCase().trim();
      const isComplete = !exchangeRes?.data?.needs_profile_completion && Boolean(university && userData?.faculty && (userData?.study_year || userData?.studyYear));

      if (!isComplete || !university) {
        navigate("/onboarding", { replace: true });
        return;
      }

      const isPilot = university === "iuc" || university.includes("côte") || university.includes("cote");
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
      const msg = err?.message || t('login.defaultError', { defaultValue: "Une erreur est survenue" });
      toast({ title: t('login.errorTitle', { defaultValue: "Erreur de connexion" }), description: msg, variant: "destructive", duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      await supabaseSignInWithGoogle();
      // La redirection OAuth se fait automatiquement vers /auth/callback
    } catch (err: any) {
      toast({ title: "Google OAuth", description: err?.message, variant: "destructive" });
      setIsGoogleLoading(false);
    }
  };

  const handleFacebook = async () => {
    setIsFacebookLoading(true);
    try {
      await supabaseSignInWithFacebook();
    } catch (err: any) {
      toast({ title: "Facebook OAuth", description: err?.message, variant: "destructive" });
      setIsFacebookLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 grid lg:grid-cols-2 overflow-hidden">
      <Helmet>
        <title>{t('login.title', { defaultValue: "Connexion" })} - CampusSphere</title>
        <meta name="description" content="Connectez-vous à votre compte CampusSphere pour retrouver vos sphères, vos messages et vos ressources." />
        <link rel="canonical" href="https://campussphere.app/login" />
      </Helmet>
      <div className="flex items-center justify-center p-4 sm:px-20 overflow-y-auto">
        <div className="w-full max-w-md">
        <div className="text-center mb-8 mt-4 cursor-pointer" onClick={() => navigate("/cs-inc")}>
          <span className="text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">CampusSphere</span>
          <p className="text-muted-foreground mt-2">{t('login.welcomeBack', { defaultValue: "Bon retour parmi nous !" })}</p>
        </div>

        <div className="p-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('login.title', { defaultValue: "Connexion" })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OAuth */}
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={isGoogleLoading || isLoading || isFacebookLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FcGoogle className="mr-2 h-4 w-4" />}
                {t('login.google', { defaultValue: "Continuer avec Google" })}
              </Button>
              <Button variant="outline" className="hidden w-full" onClick={handleFacebook} disabled={isFacebookLoading || isLoading || isGoogleLoading}>
                {isFacebookLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />}
                {t('login.facebook', { defaultValue: "Continuer avec Facebook" })}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t('login.or', { defaultValue: "Ou" })}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{t('login.validationError', { defaultValue: "Veuillez corriger les erreurs ci-dessous" })}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('login.emailLabel', { defaultValue: "Email" })}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder={t('login.emailPlaceholder', { defaultValue: "votre.email@exemple.com" })} className={`pl-10 ${errors.email ? "border-destructive" : ""}`} value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.passwordLabel', { defaultValue: "Mot de passe" })}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder={t('login.passwordPlaceholder', { defaultValue: "••••••••" })} className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`} value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={formData.rememberMe} onCheckedChange={c => setFormData(p => ({ ...p, rememberMe: !!c }))} />
                  <Label htmlFor="remember" className="text-sm">{t('login.rememberMe', { defaultValue: "Se souvenir de moi" })}</Label>
                </div>
                <Button variant="link" className="px-0 text-primary" type="button" onClick={() => navigate("/forgot-password")}>
                  {t('login.forgotPassword', { defaultValue: "Mot de passe oublié ?" })}
                </Button>
              </div>

              <Button type="submit" className="w-full campus-gradient text-white hover:opacity-90" disabled={isLoading || isGoogleLoading || isFacebookLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('login.submittingButton', { defaultValue: "Connexion..." })}</> : t('login.submitButton', { defaultValue: "Se connecter" })}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-muted-foreground">{t('login.noAccount', { defaultValue: "Pas encore de compte ?" })}{" "}</span>
              <Button variant="link" className="px-0 text-primary" onClick={() => navigate("/register")}>{t('login.registerLink', { defaultValue: "S'inscrire" })}</Button>
            </div>
          </CardContent>
        </div>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            {t('legalAgreement.byContinuing', { defaultValue: "En continuant, vous acceptez nos" })}{" "}
            <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate("/cs-inc/policies/terms")}>{t('legalAgreement.terms', { defaultValue: "Conditions d'utilisation" })}</Button>
            {" "}{t('legalAgreement.and', { defaultValue: "et notre" })}{" "}
            <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate("/cs-inc/policies/privacy")}>{t('legalAgreement.privacy', { defaultValue: "Politique de confidentialité" })}</Button>
          </p>
        </div>
        </div>
      </div>
      <AuthSidePanel />
    </div>
  );
}
