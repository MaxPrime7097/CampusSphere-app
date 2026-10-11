import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { WifiSlash as WifiOff, ArrowClockwise as RefreshCw } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function OfflineBanner() {
  const { t } = useTranslation("navigation");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-card text-foreground border border-border shadow-md text-xs font-medium campus-animate-slide-up"
    >
      <WifiOff className="h-4 w-4 text-destructive shrink-0" />
      <span>{t("offline.connectionLost")}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[11px] text-foreground hover:bg-muted rounded-full"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="h-3 w-3 mr-1" />
        {t("offline.refresh")}
      </Button>
    </div>
  );
}
