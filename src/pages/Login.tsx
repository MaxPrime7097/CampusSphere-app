import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });

  const loginSchema = z.object({
    email: z.string()
      .min(1, "L'email est requis")
      .email("Format d'email invalide"),
    password: z.string()
      .min(1, "Le mot de passe est requis")
      .min(6, "Le mot de passe doit contenir au moins 6 caractères")
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validation
    const validation = loginSchema.safeParse({
      email: formData.email,
      password: formData.password
    });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simuler la connexion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simuler une vérification des identifiants
      if (formData.email === "test@test.com" && formData.password === "password") {
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue sur CampusSphere",
          duration: 3000,
        });
        
        // Sauvegarder les préférences si "Se souvenir de moi" est coché
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('userEmail', formData.email);
        }
        
        navigate('/');
      } else {
        toast({
          variant: "destructive",
          title: "Identifiants incorrects",
          description: "Vérifiez votre email et mot de passe",
          duration: 4000,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Une erreur est survenue. Veuillez réessayer.",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Simuler la connexion Google
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Connexion Google réussie !",
        description: "Bienvenue sur CampusSphere",
        duration: 3000,
      });
      
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion Google",
        description: "Une erreur est survenue. Veuillez réessayer.",
        duration: 4000,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/CS.svg" alt="CampusSphere" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </h1>
          <p className="text-muted-foreground mt-2">
            Bon retour parmi nous !
          </p>
        </div>

        <Card className="campus-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Compte de test :</strong><br />
                Email: test@test.com<br />
                Mot de passe: password
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Social Login */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full" 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaGoogle className="text-primary mr-2 h-4 w-4" />
                )}
                Continuer avec Google
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Ou
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Veuillez corriger les erreurs ci-dessous
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email ou nom d'utilisateur</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="votre.email@universite.fr"
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleChange('rememberMe', !!checked)}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Se souvenir de moi
                  </Label>
                </div>
                <Button 
                  variant="link" 
                  className="px-0 text-primary"
                  onClick={() => navigate('/forgot-password')}
                >
                  Mot de passe oublié ?
                </Button>
              </div>

              <Button 
                type="submit" 
                className="w-full campus-gradient text-white hover:opacity-90"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="text-center">
              <span className="text-muted-foreground">
                Pas encore de compte ?{" "}
              </span>
              <Button 
                variant="link" 
                className="px-0 text-primary"
                onClick={() => navigate('/register')}
              >
                S'inscrire
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            En vous connectant, vous acceptez nos{" "}
            <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate('/cs-inc/policies/terms')}
            >
              Conditions d'utilisation
            </Button> et notre{" "}
            <Button variant="link" className="px-0 h-auto text-primary" onClick={() => navigate('/cs-inc/policies/privacy')}
            >
              Politique de confidentialité
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}