import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/** Posé par l'onboarding à la fin du parcours ; consommé (une seule fois) par la pop-up. */
export const WELCOME_FLAG_KEY = "cs_show_welcome_modal";

const TEAM_MEMBERS = [
  { name: "Max", avatar: "/Team/Nlend.jpg" },
  { name: "Boris", avatar: "/Team/Boris.jpg" },
  { name: "Nathan", avatar: "/Team/Nathan.jpg" },
  { name: "Tommi", avatar: "/Team/Tommi.jpg" },
  { name: "Gwenaëlle", avatar: "/Team/Gwen.png" },
];

/**
 * Pop-up de bienvenue de l'équipe, affichée au centre de l'écran, une seule fois,
 * juste après la fin de l'onboarding (l'utilisateur voit déjà l'application derrière).
 */
export function WelcomeTeamModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(WELCOME_FLAG_KEY) === "1") {
      localStorage.removeItem(WELCOME_FLAG_KEY);
      setOpen(true);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <img src="/CS.svg" alt="CampusSphere" className="w-9 h-9 object-contain" />
            <span className="text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
              CampusSphere
            </span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold font-raleway text-foreground mb-2">
            Bienvenue dans l'aventure ! 🎉
          </DialogTitle>
          <DialogDescription className="sr-only">Message de bienvenue de l'équipe CampusSphere</DialogDescription>
        </div>

        <div className="text-left text-sm sm:text-base leading-relaxed text-muted-foreground font-nunito space-y-3">
          <p className="font-semibold text-foreground">Salut{user?.firstName ? ` ${user.firstName}` : ""} !</p>
          <p>
            Toute l'équipe de <strong className="text-foreground font-semibold">CampusSphere</strong> est ultra fière
            de t'accueillir sur la plateforme.
          </p>
          <p>
            On a créé cet espace autour d'une promesse simple :{" "}
            <strong className="text-foreground font-semibold">Connect. Share. Grow.</strong>
          </p>
          <div className="space-y-2 pl-3 border-l-2 border-primary/40 text-xs sm:text-sm">
            <p>
              <strong className="text-foreground font-medium">Connect :</strong> échange avec les étudiants de ton
              campus et rejoins tes premières Sphères.
            </p>
            <p>
              <strong className="text-foreground font-medium">Share :</strong> trouve et partage fiches, cours et
              annales en un clic.
            </p>
            <p>
              <strong className="text-foreground font-medium">Grow :</strong> avance sur tes projets à plusieurs et
              booste tes révisions avec Sphera.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex -space-x-3 p-0.5">
            {TEAM_MEMBERS.map((m) => (
              <img
                key={m.name}
                src={m.avatar}
                alt={m.name}
                title={m.name}
                className="inline-block h-10 w-10 rounded-full ring-2 ring-background object-cover shadow-sm"
              />
            ))}
          </div>
          <span className="font-semibold text-foreground text-sm font-poppins">— L'équipe CampusSphere 🧡</span>
        </div>

        <Button
          onClick={() => setOpen(false)}
          size="lg"
          className="campus-gradient text-white hover:opacity-90 w-full rounded-xl"
        >
          C'est parti, explorer CampusSphere 🚀
        </Button>
      </DialogContent>
    </Dialog>
  );
}
