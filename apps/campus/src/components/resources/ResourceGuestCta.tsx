import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ResourceGuestCta() {
  const navigate = useNavigate();

  return (
    <div className="mt-8 p-6 rounded-xl border border-border/40 bg-secondary/30 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Voulez-vous aller plus loin ?</h3>
        <p className="text-muted-foreground text-sm max-w-md mt-1">
          Inscrivez-vous pour télécharger cette ressource, la sauvegarder dans vos dossiers
          et accéder à des milliers d'autres documents partagés par la communauté.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
        <Button
          onClick={() => navigate("/register")}
          variant="secondary"
          className="px-6 h-10 font-medium"
        >
          S'inscrire gratuitement
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/login")}
          className="h-10"
        >
          Se connecter
        </Button>
      </div>
    </div>
  );
}

