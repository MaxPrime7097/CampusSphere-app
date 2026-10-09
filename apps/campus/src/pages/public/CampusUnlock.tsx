import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LockKey as Lock,
  LockKeyOpen as LockOpen,
  Copy,
  Check,
  SignOut,
  Books,
  Sparkle,
  Users,
  Trophy,
  ArrowRight,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCampusStatus, updateUserProfile, type CampusStatusData } from "@/services/api";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { normalizeUniversity } from "@/lib/profileMetadata";

export function CampusUnlock(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  // Determine campus slug from query param or user profile
  const initialSlug = () => {
    const fromQuery = searchParams.get("campus") || searchParams.get("ref");
    if (fromQuery) return normalizeUniversity(fromQuery);
    if (user?.university) return normalizeUniversity(user.university);
    return "iug";
  };

  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(Boolean(user?.phoneNumber));
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSwitchingUniversity, setIsSwitchingUniversity] = useState(false);
  const [tempUniversity, setTempUniversity] = useState<string>(selectedSlug);
  const [customTempUniversity, setCustomTempUniversity] = useState<string>("");

  useEffect(() => {
    const fromQuery = searchParams.get("campus") || searchParams.get("ref");
    if (fromQuery) {
      const qNorm = normalizeUniversity(fromQuery);
      setSelectedSlug(qNorm);
      setTempUniversity(qNorm);
    } else if (user?.university) {
      const uNorm = normalizeUniversity(user.university);
      setSelectedSlug(uNorm);
      setTempUniversity(uNorm);
    }
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
      setPhoneSaved(true);
    }
  }, [user, searchParams]);

  // Live polling (every 5s) with staleTime: 0 so palier increments live without page refresh
  const { data: campusData, refetch } = useQuery<CampusStatusData>({
    queryKey: ["campus-status", selectedSlug],
    queryFn: () => getCampusStatus(selectedSlug),
    staleTime: 0,
    refetchInterval: 5000,
  });

  const currentCount = campusData?.currentCount ?? 0;
  const targetCount = campusData?.targetCount ?? 50;
  const remainingCount = campusData?.remainingCount ?? Math.max(0, targetCount - currentCount);
  const percentage = campusData?.percentage ?? Math.min(100, Math.round((currentCount / targetCount) * 100));
  const isOpen = campusData?.isOpen ?? false;

  const campusName = campusData?.name || "Votre établissement";
  const referralUrl = `${window.location.origin}/register?campus=${selectedSlug}`;
  const shareMessage = `🚨 Les gars, CampusSphere arrive sur notre campus (${campusName}) !\n\nOn a besoin de 50 inscrits pour débloquer l'accès officiel (anciens examens avec corrigés, Sphera AI pour réviser, et les sphères de notre promo).\n\nInscrivez-vous ici pour qu'on ouvre notre campus :\n${referralUrl}`;

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopySuccess(true);
      toast({
        title: "Lien copié !",
        description: "Partagez-le directement dans vos groupes WhatsApp de classe.",
      });
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      toast({ title: "Erreur", description: "Impossible de copier le lien.", variant: "destructive" });
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      toast({ title: "Numéro requis", description: "Veuillez entrer un numéro WhatsApp valide.", variant: "destructive" });
      return;
    }

    if (!isAuthenticated) {
      try {
        localStorage.setItem("pending_phone", cleanPhone);
      } catch {}
      navigate(`/register?campus=${selectedSlug}&phone=${encodeURIComponent(cleanPhone)}`);
      return;
    }

    setIsSavingPhone(true);
    try {
      await updateUserProfile({ phone_number: cleanPhone });
      await refreshUser();
      setPhoneSaved(true);
      toast({
        title: "Numéro enregistré ✓",
        description: "Vous recevrez une alerte WhatsApp dès que votre promo aura atteint les 50 inscrits.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible d'enregistrer le numéro. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleApplyCampusChange = async () => {
    const finalVal = tempUniversity === "other" ? customTempUniversity.trim() : tempUniversity;
    if (!finalVal) {
      toast({
        title: "Nom requis",
        description: "Veuillez renseigner le nom complet de votre établissement.",
        variant: "destructive",
      });
      return;
    }

    if (finalVal === selectedSlug) {
      setIsSwitchingUniversity(false);
      return;
    }

    setSelectedSlug(finalVal);
    setIsSwitchingUniversity(false);

    if (isAuthenticated) {
      try {
        await updateUserProfile({ university: finalVal });
        await refreshUser();
        await queryClient.invalidateQueries({ queryKey: ["campus-status"] });
        await refetch();
        toast({
          title: "Établissement mis à jour",
          description: "Votre campus a été mis à jour avec succès.",
        });
      } catch (err: any) {
        toast({
          title: "Erreur",
          description: err?.message || "Erreur de mise à jour.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex flex-col justify-between">
      <Helmet>
        <title>{`Débloquer ${campusName} - CampusSphere`}</title>
        <meta
          name="description"
          content={`Plus que ${remainingCount} inscriptions pour ouvrir CampusSphere à ${campusName}. Partagez sur WhatsApp et débloquez votre promo !`}
        />
      </Helmet>

      {/* Navigation Top Bar */}
      <header className="border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
            {isOpen ? "Campus Débloqué ✓" : "Liste d'attente"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="text-right hidden sm:block mr-2">
                <p className="text-xs font-semibold leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">En attente d'ouverture</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 h-8 px-2.5"
              >
                <SignOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-xs h-8"
            >
              Se connecter
            </Button>
          )}
        </div>
      </header>

      {/* Main Content: Sleek, compact, no heavy cards */}
      <main className="w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6 flex-1">
        {/* Campus Header & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-1">
            {isOpen ? (
              <LockOpen className="h-7 w-7 text-emerald-500 animate-bounce" />
            ) : (
              <Lock className="h-7 w-7 text-primary animate-pulse" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {campusName}
          </h1>

          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setIsSwitchingUniversity(!isSwitchingUniversity)}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
            >
              <ArrowsLeftRight className="h-3.5 w-3.5" />
              {isSwitchingUniversity ? "Annuler" : "Ce n'est pas votre établissement ? Changer"}
            </button>
          </div>

          {isSwitchingUniversity && (
            <div className="pt-2 max-w-sm mx-auto space-y-2 animate-in fade-in">
              <UniversityCombobox
                value={tempUniversity}
                onValueChange={setTempUniversity}
              />
              {tempUniversity === "other" && (
                <Input
                  type="text"
                  placeholder="Nom complet de votre établissement *"
                  value={customTempUniversity}
                  onChange={(e) => setCustomTempUniversity(e.target.value)}
                  className="text-xs h-9"
                />
              )}
              <Button
                size="sm"
                onClick={handleApplyCampusChange}
                className="w-full text-xs h-8 font-semibold text-white bg-primary hover:bg-primary/90"
              >
                Confirmer mon établissement
              </Button>
            </div>
          )}
        </div>

        {/* Status Section: Unlocked vs Locked Gauge */}
        {isOpen ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
              Félicitations ! Votre campus est officiellement ouvert ! 🎉
            </p>
            <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
              Votre établissement a franchi le palier des 50 étudiants inscrits. Vous pouvez désormais accéder à l'ensemble du réseau, aux annales et à Sphera AI.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 shadow-md"
            >
              Accéder à mon espace
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            {/* The explanation the user loves */}
            <p className="text-sm text-foreground/80 max-w-lg mx-auto leading-relaxed">
              Pour garantir des échanges actifs et assez d'annales d'examens avec corrigés dans votre filière, nous ouvrons CampusSphere dès que <strong className="text-foreground">50 étudiants</strong> de votre établissement sont inscrits.
            </p>

            {/* Compact Progress Gauge */}
            <div className="space-y-2 max-w-md mx-auto pt-1">
              <div className="flex justify-between items-end text-xs font-medium">
                <span className="text-foreground">
                  <strong className="text-primary text-xl font-extrabold">{currentCount}</strong>
                  <span className="text-muted-foreground text-sm font-semibold"> / {targetCount} inscrits</span>
                </span>
                <span className="text-primary font-bold text-sm">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2.5 rounded-full bg-primary/10" />
              <p className="text-xs text-muted-foreground text-right font-medium">
                Plus que <strong className="text-foreground">{remainingCount}</strong> inscriptions pour débloquer votre promo !
              </p>
            </div>

            {/* Primary Viral Action: WhatsApp Share */}
            <div className="pt-2 space-y-2.5 max-w-md mx-auto">
              <Button
                size="lg"
                onClick={handleWhatsAppShare}
                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm sm:text-base h-11 shadow-md shadow-[#25D366]/20 transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FaWhatsapp className="h-5 w-5 text-white" />
                Partager sur WhatsApp pour débloquer
              </Button>
              <p className="text-[11px] text-muted-foreground">
                Partagez le lien dans le groupe WhatsApp de votre classe ou de votre filière.
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <Input
                  readOnly
                  value={referralUrl}
                  className="text-xs h-8 bg-background/60 font-mono text-muted-foreground"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="h-8 px-3 shrink-0 text-xs gap-1.5"
                >
                  {copySuccess ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copySuccess ? "Copié !" : "Copier"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Notification Form (Compact, white text on orange button) */}
        {!isOpen && (
          <div className="pt-2 border-t border-border/50 max-w-md mx-auto text-center space-y-2.5">
            <div className="space-y-0.5">
              <h2 className="text-sm font-bold text-foreground">
                Être alerté sur WhatsApp dès l'ouverture 📱
              </h2>
              <p className="text-xs text-muted-foreground">
                Laissez votre numéro WhatsApp pour être prévenu dès que votre promo atteint les 50 inscrits.
              </p>
            </div>

            <form onSubmit={handleSavePhone} className="flex gap-2">
              <Input
                type="tel"
                placeholder="Ex: 699404759"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneSaved(false);
                }}
                className="text-xs h-9 flex-1"
              />
              <Button
                type="submit"
                disabled={isSavingPhone}
                className="h-9 px-4 text-xs font-bold whitespace-nowrap bg-primary hover:bg-primary/90 !text-white shadow-sm"
              >
                {isSavingPhone ? "Enregistrement..." : phoneSaved ? "Enregistré ✓" : "M'avertir"}
              </Button>
            </form>

            {phoneSaved && (
              <p className="text-xs text-emerald-600 font-medium">
                Numéro enregistré ✓ Vous recevrez une alerte prioritaire.
              </p>
            )}
          </div>
        )}

        {/* Ce que vous débloquez : Flat, clean, no card wrappers */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-muted-foreground text-center">
            Ce que votre promo débloque à 50 inscrits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                <Books className="h-4 w-4 text-primary shrink-0" />
                <span>Annales & corrigés</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Sujets d'examens et partiels résolus par les étudiants des promos supérieures.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                <Sparkle className="h-4 w-4 text-primary shrink-0" />
                <span>Sphera AI</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Assistant d'études pour résumer vos cours et s'entraîner aux examens.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span>Sphères de promo</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Espace d'entraide, partage de résumés et collaboration avec vos camarades.
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard / Course au déblocage (Compact list) */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" />
              <h2 className="text-xs uppercase tracking-wider font-bold text-foreground">
                Course au déblocage des campus
              </h2>
            </div>
            <span className="text-[11px] text-muted-foreground">Objectif : 50 inscrits</span>
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {campusData?.campuses?.map((c) => {
              const isSelected = c.slug === selectedSlug;
              return (
                <div
                  key={c.slug}
                  onClick={() => {
                    setSelectedSlug(c.slug);
                    setTempUniversity(c.slug);
                  }}
                  className={`py-2 px-3 rounded-md flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10 font-medium" : "hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold truncate text-foreground">
                      {c.name}
                    </span>
                    {isSelected && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary text-primary h-4">
                        Mon campus
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] text-muted-foreground">
                      {c.isOpen ? "Ouvert ✓" : `${c.currentCount} / ${c.targetCount}`}
                    </span>
                    <Badge
                      variant={c.isOpen ? "default" : "secondary"}
                      className={`text-[10px] py-0 px-1.5 h-4 ${
                        c.isOpen ? "bg-emerald-600 text-white" : ""
                      }`}
                    >
                      {c.isOpen ? "100%" : `${c.percentage}%`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer with user's verified contact phone */}
      <footer className="border-t border-border/40 py-4 px-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CampusSphere Cameroun.</p>
        <p className="mt-0.5">
          Besoin d'aide ? WhatsApp :{" "}
          <a
            href="https://wa.me/237699404759"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            +237 699 40 47 59
          </a>
        </p>
      </footer>
    </div>
  );
}
export default CampusUnlock;
