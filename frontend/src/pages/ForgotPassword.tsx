import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password reset
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card className="campus-card">
          <CardHeader className="text-center">
            <div className="w-16 h-16 campus-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
              {sent ? (
                <Check className="h-8 w-8 text-white" />
              ) : (
                <Mail className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {sent ? "Email envoyé !" : "Mot de passe oublié ?"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {sent
                ? "Vérifiez votre boîte mail pour réinitialiser votre mot de passe"
                : "Entrez votre email pour recevoir un lien de réinitialisation"}
            </p>
            <div className="mt-6">
              <img src="/Illustrations/Forgot password-amico.svg" alt="Forgot password" className="mx-auto w-48" />
            </div>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email universitaire</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@universite.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full campus-gradient text-white hover:opacity-90"
                >
                  Envoyer le lien
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm">
                    Un email a été envoyé à <strong>{email}</strong>
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full"
                  variant="outline"
                >
                  Retour à la connexion
                </Button>
                <Button
                  onClick={() => setSent(false)}
                  variant="ghost"
                  className="w-full text-sm"
                >
                  Renvoyer l'email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
