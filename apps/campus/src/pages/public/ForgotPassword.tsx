import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Envelope as Mail, Check, Spinner as Loader2 } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabaseResetPassword } from "@/services/api";
import { useTranslation } from "react-i18next";

export function ForgotPassword() {
  const { t } = useTranslation('auth');
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
      toast({ title: t('login.errorTitle', { defaultValue: "Erreur" }), description: err?.message || "Impossible d'envoyer l'email", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button variant="ghost" onClick={() => navigate("/login")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />{t('forgotPassword.back', { defaultValue: "Retour" })}
        </Button>

        <Card className="cs-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 campus-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              {sent ? <Check className="h-8 w-8 text-white" /> : <Mail className="h-8 w-8 text-white" />}
            </div>
            <CardTitle className="text-2xl">
              {sent ? t('forgotPassword.emailSentTitle', { defaultValue: "Email envoyé !" }) : t('forgotPassword.title', { defaultValue: "Mot de passe oublié ?" })}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {sent
                ? t('forgotPassword.emailSentDesc', { defaultValue: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe" })
                : t('forgotPassword.subtitle', { defaultValue: "Entrez votre email pour recevoir un lien de réinitialisation" })}
            </p>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t('forgotPassword.emailLabel', { defaultValue: "Email" })}</Label>
                  <Input id="email" type="email" placeholder={t('forgotPassword.emailPlaceholder', { defaultValue: "votre.email@exemple.com" })} value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full campus-gradient text-white hover:opacity-90" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('forgotPassword.submittingButton', { defaultValue: "Envoi..." })}</> : t('forgotPassword.submitButton', { defaultValue: "Envoyer le lien" })}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm">{t('forgotPassword.emailSentTo', { defaultValue: "Un email a été envoyé à" })}{" "}<strong>{email}</strong></p>
                </div>
                <Button onClick={() => navigate("/login")} className="w-full" variant="outline">{t('forgotPassword.backToLogin', { defaultValue: "Retour à la connexion" })}</Button>
                <Button onClick={() => setSent(false)} variant="ghost" className="w-full text-sm">{t('forgotPassword.resend', { defaultValue: "Renvoyer l'email" })}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
