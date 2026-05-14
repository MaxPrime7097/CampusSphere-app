import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { exchangeSupabaseToken, getCurrentUser } from "@/services/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const REQUIRED_PROFILE_FIELDS = [
  "username",
  "university",
  "faculty",
  "study_year",
  "student_id",
] as const;

const isFieldFilled = (value: unknown) => {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return false;
};

const hasCompleteProfile = (profile: Record<string, unknown> | null | undefined) => {
  if (!profile) return false;

  return REQUIRED_PROFILE_FIELDS.every((field) => {
    if (field === "study_year") {
      return isFieldFilled(profile.study_year ?? profile.studyYear);
    }
    if (field === "student_id") {
      return isFieldFilled(profile.student_id ?? profile.studentId);
    }
    return isFieldFilled(profile[field]);
  });
};

const debugRoutingDecision = (details: Record<string, unknown>) => {
  if (!import.meta.env.DEV) return;
  console.debug("[AuthCallback] OAuth routing decision", details);
};

export function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("Finalisation...");

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
        setStatus("Un instant...");

        // Échanger le token Supabase contre un JWT Django
        const response = await exchangeSupabaseToken(session.access_token);
        await refreshUser();

        if (!isMounted) return;

        const data = response?.data;
        const needsProfileCompletion = data?.needs_profile_completion;
        const isNewUser = data?.is_new_user;

        console.debug("[AuthCallback] Exchange response:", { needsProfileCompletion, isNewUser, fullData: data });

        let shouldCompleteProfile = false;

        if (isNewUser === true) {
          shouldCompleteProfile = true;
          debugRoutingDecision({
            source: "is_new_user",
            isNewUser: true,
            destination: "/complete-profile",
          });
        } else if (typeof needsProfileCompletion === "boolean") {
          shouldCompleteProfile = needsProfileCompletion;
          debugRoutingDecision({
            source: "needs_profile_completion",
            needsProfileCompletion,
            destination: shouldCompleteProfile ? "/complete-profile" : "/",
          });
        } else {
          // Fallback: check profile data manually
          const profile = await getCurrentUser();
          shouldCompleteProfile = !hasCompleteProfile(profile as Record<string, unknown>);
          debugRoutingDecision({
            source: "fallback_profile_check",
            profile_completion_required: shouldCompleteProfile,
            profile_data: profile,
            destination: shouldCompleteProfile ? "/complete-profile" : "/",
          });
        }

        if (shouldCompleteProfile) {
          console.info("[AuthCallback] Redirecting to profile completion");
          navigate("/complete-profile", { replace: true });
        } else {
          console.info("[AuthCallback] Login successful, redirecting to home");
          toast({ title: "Connexion réussie !", duration: 2000 });
          navigate("/", { replace: true });
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('AuthCallback error:', err);
        toast({
          title: "Erreur de connexion",
          description: err?.message || "Impossible de finaliser la connexion",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      }
    })();

    return () => { isMounted = false; };
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}
