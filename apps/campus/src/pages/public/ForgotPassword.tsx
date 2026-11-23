import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Envelope, Spinner } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabaseResetPassword } from "@/services/api";
import { AuthLanguageToggle, AuthSidePanel } from "@/components/auth/AuthSidePanel";

export function ForgotPassword() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await supabaseResetPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      toast({
        title: t("login.errorTitle", { defaultValue: "Erreur" }),
        description: err?.message || "Impossible d’envoyer l’email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cs-pub-font min-h-screen bg-white text-[#18181b] grid lg:grid-cols-2">
      <Helmet>
        <title>
          {t("forgotPassword.title", { defaultValue: "Mot de passe oublié" })} — CampusSphere
        </title>
        <meta
          name="description"
          content={t("forgotPassword.subtitle", {
            defaultValue: "Entre ton adresse email pour recevoir un lien de réinitialisation.",
          })}
        />
        <link rel="canonical" href="https://campussphere.app/forgot-password" />
      </Helmet>

      {/* Colonne Formulaire (Blanc pur) */}
      <div className="flex flex-col justify-between px-4 sm:px-10 lg:px-14 py-6 sm:py-8 overflow-y-auto">
        <div className="flex items-center justify-between max-w-md w-full mx-auto gap-2">
          <Link to="/cs" className="inline-flex items-center gap-2.5">
            <img src="/CS.svg" alt="CampusSphere" className="w-8 h-8" />
            <span className="font-automata text-lg font-bold campus-gradient bg-clip-text text-transparent">
              CampusSphere
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
            <AuthLanguageToggle tone="light" className="lg:hidden" />
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-poppins text-xs font-semibold text-zinc-500 hover:text-[#18181b] transition-colors"
            >
              <ArrowLeft size={14} weight="bold" aria-hidden="true" />
              {t("forgotPassword.back", { defaultValue: "Connexion" })}
            </Link>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-10">
          {!sent ? (
            <>
              <div className="mb-7">
                <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] text-[#ff9800] flex items-center justify-center mb-4">
                  <Envelope size={24} weight="duotone" aria-hidden="true" />
                </div>
                <h1 className="font-poppins text-2xl sm:text-3xl font-bold text-[#18181b] tracking-tight">
                  {t("forgotPassword.title", { defaultValue: "Mot de passe oublié ?" })}
                </h1>
                <p className="font-nunito text-sm sm:text-base text-zinc-500 mt-1.5 leading-relaxed">
                  {t("forgotPassword.subtitle", {
                    defaultValue: "Entre ton adresse email pour recevoir un lien de réinitialisation.",
                  })}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="forgot-email"
                    className="font-poppins text-sm font-semibold text-[#18181b]"
                  >
                    {t("forgotPassword.emailLabel", { defaultValue: "Adresse email" })}
                  </Label>
                  <div className="relative">
                    <Envelope
                      size={17}
                      weight="duotone"
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <Input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      placeholder={t("forgotPassword.emailPlaceholder", {
                        defaultValue: "toi@exemple.com",
                      })}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-11 pl-10 bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-full bg-[#ff9800] hover:bg-[#f57c00] text-white font-poppins text-sm font-semibold shadow-md shadow-[#ff9800]/25 inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <>
                      <Spinner size={17} className="animate-spin" aria-hidden="true" />
                      {t("forgotPassword.submittingButton", { defaultValue: "Envoi..." })}
                    </>
                  ) : (
                    t("forgotPassword.submitButton", { defaultValue: "Envoyer le lien" })
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-5 rounded-3xl bg-[#faf8f5] border border-black/8 p-6 sm:p-8">
              <div className="w-16 h-16 rounded-2xl bg-[#fff7ed] text-[#ff9800] flex items-center justify-center mx-auto">
                <CheckCircle size={32} weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-poppins text-2xl font-bold text-[#18181b] mb-2">
                  {t("forgotPassword.emailSentTitle", { defaultValue: "Email envoyé !" })}
                </h1>
                <p className="font-nunito text-sm text-zinc-600 leading-relaxed">
                  {t("forgotPassword.emailSentTo", { defaultValue: "Un lien a été envoyé à" })}{" "}
                  <strong className="text-[#18181b]">{email}</strong>.{" "}
                  {t("forgotPassword.emailSentDesc", {
                    defaultValue: "Vérifie ta boîte mail (et tes spams) pour définir un nouveau mot de passe.",
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="w-full h-11 rounded-full bg-[#09090b] hover:bg-zinc-800 text-white font-poppins text-sm font-semibold transition-colors"
                >
                  {t("forgotPassword.backToLogin", { defaultValue: "Retour à la connexion" })}
                </button>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="font-poppins text-xs font-semibold text-zinc-500 hover:text-[#18181b] py-2 transition-colors"
                >
                  {t("forgotPassword.resend", { defaultValue: "Renvoyer l’email" })}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center font-nunito text-xs text-zinc-400 max-w-md mx-auto">
          {t("sidePanel.needHelp", { defaultValue: "Besoin d’aide ?" })}{" "}
          <Link to="/cs/contact" className="text-zinc-600 hover:text-[#e65100] underline">
            {t("sidePanel.contactSupport", { defaultValue: "Contacter le support" })}
          </Link>
        </p>
      </div>

      {/* Panneau latéral Encre sombre */}
      <AuthSidePanel />
    </div>
  );
}
