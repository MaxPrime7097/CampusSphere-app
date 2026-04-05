import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { exchangeSupabaseToken } from "@/services/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState("Finalisation de la connexion...");

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // Supabase lit automatiquement le hash/code dans l'URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          throw new Error(error?.message || "Session introuvable");
        }

        if (!isMounted) return;
        setStatus("Connexion à CampusSphere...");

        // Échanger le token Supabase contre un JWT Django
        const response = await exchangeSupabaseToken(session.access_token);

        if (!isMounted) return;

        const user = response?.data?.user;
        const isFullyOnboarded = Boolean(
          user?.is_fully_onboarded ??
          user?.isFullyOnboarded ??
          user?.profile_completed ??
          user?.profileCompleted
        );

        if (!isFullyOnboarded) {
          navigate("/register/complete", { replace: true });
        } else {
          toast({ title: "Connexion réussie !", duration: 2000 });
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        if (!isMounted) return;
        toast({
          title: "Erreur de connexion",
          description: err?.message || "Impossible de finaliser la connexion",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      }
    })();

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
