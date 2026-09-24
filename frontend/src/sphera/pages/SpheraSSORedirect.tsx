import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";

export function SpheraSSORedirect() {
  useEffect(() => {
    const envUrl = (import.meta.env.VITE_SPHERA_STANDALONE_URL as string)?.trim();
    const isLocal = ["localhost", "127.0.0.1"].some((host) => window.location.hostname.includes(host));
    const baseUrl = envUrl || (isLocal ? "http://localhost:4173" : "https://sphera.campussphere.app");
    
    const accessToken = localStorage.getItem("access") || localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh");
    
    const params = new URLSearchParams();
    if (accessToken) params.set("access_token", accessToken);
    if (refreshToken) params.set("refresh_token", refreshToken);

    const fragment = params.toString();
    window.location.replace(`${baseUrl.replace(/\/$/, "")}/app${fragment ? `#${fragment}` : ""}`);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-[#ff9800]" />
      <p className="text-muted-foreground font-medium">Connexion automatique à Sphera en cours...</p>
    </div>
  );
}

