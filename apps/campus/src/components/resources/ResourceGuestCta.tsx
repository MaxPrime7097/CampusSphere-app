import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function ResourceGuestCta() {
  const navigate = useNavigate();
  const { t } = useTranslation("resources");

  return (
    <div className="mt-8 p-6 rounded-xl border border-border/40 bg-secondary/30 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">{t("detail.guestTitle")}</h3>
        <p className="text-muted-foreground text-sm max-w-md mt-1">
          {t("detail.guestDesc")}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
        <Button
          onClick={() => navigate("/register")}
          variant="secondary"
          className="px-6 h-10 font-medium"
        >
          {t("detail.registerFree")}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/login")}
          className="h-10"
        >
          {t("detail.login")}
        </Button>
      </div>
    </div>
  );
}
