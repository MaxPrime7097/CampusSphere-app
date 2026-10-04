import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

const COOKIE_KEY = "campussphere_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-4 md:bottom-4 md:left-4 md:right-auto md:max-w-sm">
      <div className="bg-card border rounded-xl shadow-lg p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm font-semibold">Cookies</p>
          </div>
          <button onClick={decline} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Nous utilisons des cookies essentiels pour le fonctionnement de la plateforme et des cookies de performance pour améliorer votre expérience.{" "}
          <button
            onClick={() => navigate("/cs-inc/policies/cookiepolicy")}
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            En savoir plus
          </button>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={decline}>
            Refuser
          </Button>
          <Button size="sm" className="flex-1 text-xs campus-gradient text-white" onClick={accept}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
