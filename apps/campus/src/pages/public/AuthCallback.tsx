import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { exchangeSupabaseToken } from "@/services/api";
import { Spinner as Loader2 } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// [BE-MIGRATION FE-09] This local list diverges from the backend's definition of a complete profile,
// which is university + faculty + study_year only. Drop "username" and "student_id" so the client-side
// fallback matches needs_profile_completion. — documentation/FRONTEND_CHANGES.md
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
  const { refreshUser, user } = useAuth();
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
            destination: "/onboarding",
          });
        } else if (typeof needsProfileCompletion === "boolean") {
          shouldCompleteProfile = needsProfileCompletion;
          debugRoutingDecision({
            source: "needs_profile_completion",
            needsProfileCompletion,
            destination: shouldCompleteProfile ? "/onboarding" : "/",
          });
        } else {
          // Fallback: check profile data manually
          shouldCompleteProfile = !hasCompleteProfile(user as Record<string, unknown>);
          debugRoutingDecision({
            source: "fallback_profile_check",
            profile_completion_required: shouldCompleteProfile,
            profile_data: user,
            destination: shouldCompleteProfile ? "/onboarding" : "/",
          });
        }

        if (shouldCompleteProfile) {
          console.info("[AuthCallback] Redirecting to onboarding");
          navigate("/onboarding", { replace: true });
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-accent/20">
      <div className="relative flex flex-col items-center gap-6 animate-in fade-in duration-700">
        <div className="relative">
          {/* Pulsating glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
          <img
            src="/CS.svg"
            alt="CampusSphere"
            className="w-16 h-16 md:w-20 md:h-20 relative animate-bounce duration-[2000ms]"
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-2xl md:text-3xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
