import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  const { t } = useTranslation("navigation");
  const navigate = useNavigate();

  return (
     <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <img src="/Illustrations/403 Error Forbidden-amico.svg" 
             alt="403"
             className="w-96 h-96 center" />
        <h1 className="text-2xl font-bold">{t("forbidden.title")}</h1>
        <p className="mb-4 text-xl text-gray-600">{t("forbidden.description")}</p>
        <Button variant="link" className="px-0 h-auto text-s text-primary" onClick={() => navigate('/')}
            >
              {t("forbidden.returnHome")}
        </Button>
      </div>
    </div>
  );
}
