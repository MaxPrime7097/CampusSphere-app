import Sphere3D from "@/components/layout/Sphere3D";
import { Users, BookOpen, MessageSquare, Zap } from "lucide-react";

export function AuthSidePanel() {
  return (
    <div className="hidden lg:flex relative h-full w-full flex-col items-center justify-center overflow-hidden border-l border-border/50 bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Pattern background pour donner un effet de grille high-tech */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwgMCwgMCwgMC4wNSkiLz48L3N2Zz4=')] opacity-50 dark:opacity-30 mask-image:linear-gradient(to_bottom,white,transparent)]" />
      
      {/* La sphère au centre */}
      <div className="absolute inset-0 flex items-center justify-center opacity-80 mix-blend-luminosity dark:mix-blend-normal">
        <Sphere3D />
      </div>

      {/* Cartes flottantes avec informations */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Carte Haut Gauche */}
        <div className="absolute top-[20%] left-[15%] max-w-[220px] p-4 rounded-xl border border-white/20 bg-background/60 backdrop-blur-md shadow-xl animate-bounce" style={{ animationDuration: '4s' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Réseau Étudiant</p>
              <p className="text-xs text-muted-foreground mt-1">Connectez-vous avec vos pairs de votre université.</p>
            </div>
          </div>
        </div>

        {/* Carte Droite Milieu */}
        <div className="absolute top-[45%] right-[10%] max-w-[240px] p-4 rounded-xl border border-white/20 bg-background/60 backdrop-blur-md shadow-xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ressources Illimitées</p>
              <p className="text-xs text-muted-foreground mt-1">Partagez et accédez à des milliers de documents de cours.</p>
            </div>
          </div>
        </div>

        {/* Carte Bas Gauche */}
        <div className="absolute bottom-[25%] left-[20%] max-w-[200px] p-4 rounded-xl border border-white/20 bg-background/60 backdrop-blur-md shadow-xl animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Impact Score</p>
              <p className="text-xs text-muted-foreground mt-1">Contribuez et faites évoluer votre profil académique.</p>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Texte de bas de page ou overlay subtil */}
      <div className="absolute bottom-10 text-center z-10 w-full px-8">
        <h3 className="text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent mb-2 drop-shadow-sm">
          L'écosystème étudiant nouvelle génération
        </h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Rejoignez la plus grande communauté académique. 
          Apprenez, partagez et réussissez ensemble.
        </p>
      </div>
    </div>
  );
}
