import { useState } from "react";
import { CaretRight as ChevronRight, Spinner as Loader2, UserCircle, Camera } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input, REGISTRATION_MAX_LENGTHS } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { completeSupabaseProfile, checkUserAvailability } from "@/services/api";
import { completeSupabaseProfilePayloadSchema, mapCompleteProfileErrors } from "@/schemas/completeProfilePayload";
import Sphere3D from "@/components/layout/Sphere3D";
import { useAuth } from "@/contexts/AuthContext";

const MINIMUM_AGE = 16;

const getBirthDateMax = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MINIMUM_AGE);
  return date.toISOString().split("T")[0];
};

const getAgeFromDate = (birthDate: Date, today: Date) => {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = today.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < birthDate.getUTCDate())) {
    age--;
  }
  return age;
};

const parseISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
};

export function CompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usernameCheck, setUsernameCheck] = useState({ checking: false, available: true, checkedValue: "" });
  
  const [formData, setFormData] = useState({
    firstName: "", lastName: "",
    username: "", phoneNumber: "", dateOfBirth: ""
  });

  const step1Schema = z.object({
    firstName: z.string().trim().min(2, "Le prénom est requis").max(60, "Maximum 60 caractères"),
    lastName: z.string().trim().min(2, "Le nom est requis").max(60, "Maximum 60 caractères"),
    username: z.string().trim()
      .min(3, "Au moins 3 caractères")
      .max(30, "Maximum 30 caractères")
      .regex(/^[a-zA-Z0-9_.-]+$/, "Seuls les lettres, chiffres, points, tirets et underscores sont autorisés"),
    phoneNumber: z.string().trim()
      .regex(/^(?:\+237\d{9}|\d{9})?$/, "Téléphone invalide (9 chiffres)")
      .optional().or(z.literal("")),
    dateOfBirth: z.string().min(1, "Date de naissance requise")
      .refine(val => parseISODate(val) !== null, "Date de naissance invalide")
      .refine(val => {
        const birthDate = parseISODate(val);
        if (!birthDate) return false;
        const today = new Date();
        const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        return getAgeFromDate(birthDate, todayUtc) >= MINIMUM_AGE;
      }, `Vous devez avoir au moins ${MINIMUM_AGE} ans.`),
  });

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameCheck({ checking: false, available: true, checkedValue: "" });
      return;
    }
    setUsernameCheck(prev => ({ ...prev, checking: true }));
    try {
      const res = await checkUserAvailability({ username });
      const isAvailable = res?.data?.username ? res.data.username.available : true;
      setUsernameCheck({ checking: false, available: isAvailable, checkedValue: username });
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, username: "Ce nom d'utilisateur est déjà pris" }));
      } else {
        setErrors(prev => ({ ...prev, username: "" }));
      }
    } catch {
      setUsernameCheck({ checking: false, available: true, checkedValue: username });
    }
  };

  const handleInput = (field: keyof typeof formData, value: any) => {
    setFormData(p => ({ ...p, [field]: value }));
    setErrors(p => { const newE = { ...p }; delete newE[field]; return newE; });
    if (field === "username") checkUsername(value);
  };

  const handleSubmit = async () => {
    const val = step1Schema.safeParse(formData);
    if (!val.success) {
      const fieldErrors: Record<string, string> = {};
      val.error.issues.forEach(issue => {
        fieldErrors[String(issue.path[0])] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (!usernameCheck.available) {
      setErrors(prev => ({ ...prev, username: "Ce nom d'utilisateur est déjà pris" }));
      return;
    }

    const normalizedPhoneNumber = formData.phoneNumber
      ? `+237${formData.phoneNumber.replace(/^\+?237/, "")}`
      : undefined;

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      username: formData.username,
      phone_number: normalizedPhoneNumber,
      date_of_birth: formData.dateOfBirth,
    };

    setIsLoading(true);
    setErrors({});
    
    try {
      await completeSupabaseProfile(payload);
      await refreshUser();
      toast({ title: "Profil mis à jour", description: "Veuillez maintenant compléter votre parcours académique." });
      navigate("/onboarding", { replace: true });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.response?.data?.message || err.message || "Impossible de mettre à jour le profil.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative bg-background">
      <div className="flex items-center justify-center p-6 lg:p-12 z-10 relative overflow-y-auto max-h-screen scrollbar-hide">
        <div className="w-full max-w-[500px] space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold font-automata campus-gradient bg-clip-text text-transparent">Bienvenue</h1>
            <p className="text-muted-foreground text-sm">Finalisez vos informations de base avant de continuer.</p>
          </div>

          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  <UserCircle className="w-16 h-16 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white font-medium">Bientôt</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <Label>Prénom *</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.firstName} value={formData.firstName} onChange={e => handleInput("firstName", e.target.value)} className={errors.firstName ? "border-destructive" : ""} />
                {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName}</p>}
              </div>
              <div className="min-w-0">
                <Label>Nom *</Label>
                <Input maxLength={REGISTRATION_MAX_LENGTHS.lastName} value={formData.lastName} onChange={e => handleInput("lastName", e.target.value)} className={errors.lastName ? "border-destructive" : ""} />
                {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="min-w-0">
              <Label>Nom d'utilisateur *</Label>
              <Input maxLength={REGISTRATION_MAX_LENGTHS.username} value={formData.username} onChange={e => handleInput("username", e.target.value)} className={errors.username ? "border-destructive" : ""} />
              {usernameCheck.checking && <p className="text-xs text-muted-foreground mt-1">Vérification...</p>}
              {errors.username && <p className="text-xs text-destructive mt-1">{errors.username}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="min-w-0">
                <Label>Date de naissance *</Label>
                <Input type="date" max={getBirthDateMax()} value={formData.dateOfBirth} onChange={e => handleInput("dateOfBirth", e.target.value)} className={errors.dateOfBirth ? "border-destructive" : ""} />
                {errors.dateOfBirth && <p className="text-xs text-destructive mt-1">{errors.dateOfBirth}</p>}
              </div>
              <div className="min-w-0">
                <Label>Téléphone</Label>
                <div className="flex min-w-0 w-full">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+237</span>
                  <Input maxLength={REGISTRATION_MAX_LENGTHS.phoneNumber} value={formData.phoneNumber} onChange={e => handleInput("phoneNumber", e.target.value)} className={`w-full min-w-0 rounded-l-none ${errors.phoneNumber ? "border-destructive" : ""}`} placeholder="6XXXXXXXX" />
                </div>
                {errors.phoneNumber && <p className="text-xs text-destructive mt-1">{errors.phoneNumber}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button onClick={handleSubmit} disabled={isLoading || usernameCheck.checking} className="campus-gradient text-white min-w-[140px]">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuer <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block"><Sphere3D /></div>
    </div>
  );
}
