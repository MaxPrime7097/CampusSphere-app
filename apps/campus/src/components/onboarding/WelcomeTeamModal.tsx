import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("auth");
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(WELCOME_FLAG_KEY) === "1") {
      localStorage.removeItem(WELCOME_FLAG_KEY);
      setOpen(true);
    }
  }, []);

  const greetingName = user?.firstName ? ` ${user.firstName}` : "";

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
            {t("welcomeTeamModal.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("welcomeTeamModal.description")}
          </DialogDescription>
        </div>

        <div className="text-left text-sm sm:text-base leading-relaxed text-muted-foreground font-nunito space-y-3">
          <p className="font-semibold text-foreground">
            {t("welcomeTeamModal.greeting", { name: greetingName })}
          </p>
          <p>{t("welcomeTeamModal.proud")}</p>
          <p>{t("welcomeTeamModal.promise")}</p>
          <div className="space-y-2 pl-3 border-l-2 border-primary/40 text-xs sm:text-sm">
            <p>{t("welcomeTeamModal.connect")}</p>
            <p>{t("welcomeTeamModal.share")}</p>
            <p>{t("welcomeTeamModal.grow")}</p>
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
          <span className="font-semibold text-foreground text-sm font-poppins">
            {t("welcomeTeamModal.teamSignature")}
          </span>
        </div>

        <Button
          onClick={() => setOpen(false)}
          size="lg"
          className="campus-gradient text-white hover:opacity-90 w-full rounded-xl"
        >
          {t("welcomeTeamModal.cta")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
