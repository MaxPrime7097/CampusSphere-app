import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Forbidden() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Accès interdit</h1>
        <p className="text-muted-foreground text-sm">
          Vous n&apos;avez pas les permissions administrateur requises pour accéder à cette page.
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link to="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
