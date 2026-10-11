import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { t } = useTranslation("navigation");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <img src="/Illustrations/404 Error-amico.svg" 
             alt="404"
             className="w-96 h-96" />
        <p className="mb-4 text-xl text-gray-600">{t("notFound.title")}</p>
        <Button variant="link" className="px-0 h-auto text-s text-primary" onClick={() => navigate('/')}
            >
              {t("notFound.returnHome")}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
