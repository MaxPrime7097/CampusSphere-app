import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ResourceGuestCta() {
  const navigate = useNavigate();

  return (
    <Card className="mt-8 border-primary/50 bg-primary/5 campus-animate-slide-up overflow-hidden relative">
      <div className="absolute top-0 right-0 p-2 opacity-10">
        <Zap className="h-24 w-24 text-primary fill-current -rotate-12 translate-x-8 -translate-y-8" />
      </div>
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Zap className="h-7 w-7 text-primary fill-current" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Voulez-vous aller plus loin ?</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Inscrivez-vous pour télécharger cette ressource, la sauvegarder dans vos dossiers
                et accéder à des milliers d'autres documents partagés par la communauté.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Button
              onClick={() => navigate("/register")}
              className="campus-gradient text-white px-8 h-11"
            >
              S'inscrire gratuitement
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="h-11"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
