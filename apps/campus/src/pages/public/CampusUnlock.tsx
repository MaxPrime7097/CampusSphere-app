import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LockKey as Lock,
  LockKeyOpen as LockOpen,
  ShareNetwork,
  Copy,
  Check,
  WhatsappLogo,
  SignOut,
  GraduationCap,
  Sparkle,
  Books,
  Users,
  Trophy,
  ArrowRight,
  DeviceMobile,
  CheckCircle,
  WarningCircle,
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
import { CAMEROON_PRIVATE_UNIVERSITIES, UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { normalizeUniversity } from "@/lib/profileMetadata";

export function CampusUnlock(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  // Determine campus slug from query param or user profile
  const initialSlug = () => {
    const fromQuery = searchParams.get("campus") || searchParams.get("ref");
    if (fromQuery) return normalizeUniversity(fromQuery);
    if (user?.university) return normalizeUniversity(user.university);
    return "iug"; // Default non-pilot showcase campus
  };

  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(Boolean(user?.phoneNumber));
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSwitchingUniversity, setIsSwitchingUniversity] = useState(false);
  const [tempUniversity, setTempUniversity] = useState<string>(selectedSlug);

  useEffect(() => {
    if (user?.university && !searchParams.get("campus")) {
      const userNorm = normalizeUniversity(user.university);
      setSelectedSlug(userNorm);
      setTempUniversity(userNorm);
    }
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
      setPhoneSaved(true);
    }
  }, [user, searchParams]);

  // Query campus status from backend
  const { data: campusData, isLoading, refetch } = useQuery<CampusStatusData>({
    queryKey: ["campus-status", selectedSlug],
    queryFn: () => getCampusStatus(selectedSlug),
    staleTime: 60 * 1000,
  });

  const currentCount = campusData?.currentCount ?? 0;
  const targetCount = campusData?.targetCount ?? 50;
  const remainingCount = campusData?.remainingCount ?? Math.max(0, targetCount - currentCount);
  const percentage = campusData?.percentage ?? Math.min(100, Math.round((currentCount / targetCount) * 100));
  const isOpen = campusData?.isOpen ?? false;

  const campusName = campusData?.name || "Votre établissement";
  const referralUrl = `${window.location.origin}/register?campus=${selectedSlug}`;
  const shareMessage = `🚨 Les gars, CampusSphere arrive sur notre campus (${campusName}) !\n\nOn a besoin de 50 inscrits pour débloquer l'accès officiel (anciens examens avec corrigés, Sphera AI pour réviser, et les sphères privées de promo).\n\nInscrivez-vous gratuitement ici pour qu'on ouvre notre campus :\n${referralUrl}`;

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
    if (!phoneNumber.trim()) {
      toast({ title: "Numéro requis", description: "Veuillez entrer un numéro WhatsApp valide.", variant: "destructive" });
      return;
    }

    if (!isAuthenticated) {
      navigate(`/register?campus=${selectedSlug}`);
      return;
    }

    setIsSavingPhone(true);
    try {
      await updateUserProfile({ phone_number: phoneNumber.trim() });
      await refreshUser();
      setPhoneSaved(true);
      toast({
        title: "Numéro enregistré ✓",
        description: "Vous recevrez un message WhatsApp dès que votre promo aura atteint les 50 inscrits.",
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
    if (!tempUniversity || tempUniversity === selectedSlug) {
      setIsSwitchingUniversity(false);
      return;
    }

    setSelectedSlug(tempUniversity);
    setIsSwitchingUniversity(false);

    if (isAuthenticated) {
      try {
        await updateUserProfile({ university: tempUniversity });
        await refreshUser();
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
          content={`Plus que ${remainingCount} inscriptions pour ouvrir officiellement CampusSphere à ${campusName}. Partagez sur WhatsApp et débloquez votre promo !`}
        />
      </Helmet>

      {/* Navigation Top Bar */}
      <header className="border-b border-border/40 backdrop-blur-md bg-background/80 sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
          <Badge variant="outline" className="text-xs hidden sm:inline-flex border-primary/30 text-primary">
            {isOpen ? "Campus Débloqué" : "Liste d'Attente Active"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="text-right hidden sm:block mr-2">
                <p className="text-xs font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">En attente d'ouverture</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
              >
                <SignOut className="h-4 w-4" />
                <span className="hidden sm:inline">Se déconnecter</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-xs"
            >
              Se connecter
            </Button>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 flex-1">
        {/* Hero Card : Unlock Gauge & Campus State */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/95 shadow-xl p-6 sm:p-10 backdrop-blur">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6 text-center">
            {/* Status Icon */}
            <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-2xl bg-primary/10 text-primary mb-2 ring-8 ring-primary/5">
              {isOpen ? (
                <LockOpen className="h-10 w-10 sm:h-12 sm:w-12 text-emerald-500 animate-bounce" />
              ) : (
                <Lock className="h-10 w-10 sm:h-12 sm:w-12 text-primary animate-pulse" />
              )}
            </div>

            {/* University Title & City */}
            <div>
              <span className="inline-block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                {campusData?.city ? `Établissement Supérieur • ${campusData.city}` : "Établissement Supérieur Privé"}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {campusName}
              </h1>
            </div>

            {/* Change Campus Link */}
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsSwitchingUniversity(!isSwitchingUniversity)}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <ArrowsLeftRight className="h-3.5 w-3.5" />
                {isSwitchingUniversity ? "Annuler le changement" : "Ce n'est pas votre établissement ? Changer"}
              </button>
            </div>

            {/* Switch University Selector (Conditional) */}
            {isSwitchingUniversity && (
              <div className="max-w-md mx-auto p-4 rounded-xl border border-border/80 bg-background/80 space-y-3 animate-in fade-in">
                <p className="text-xs text-muted-foreground text-left font-medium">Sélectionnez votre véritable établissement :</p>
                <UniversityCombobox
                  value={tempUniversity}
                  onValueChange={setTempUniversity}
                />
                <Button
                  size="sm"
                  onClick={handleApplyCampusChange}
                  className="w-full text-xs"
                >
                  Confirmer et afficher mon campus
                </Button>
              </div>
            )}

            {/* Status Feedback */}
            {isOpen ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 space-y-3">
                <div className="flex items-center justify-center gap-2 font-semibold text-base sm:text-lg">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                  <span>Félicitations ! Votre campus est officiellement ouvert ! 🎉</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 max-w-xl mx-auto">
                  Votre établissement a franchi le palier des 50 étudiants inscrits. Vous pouvez désormais accéder à l'ensemble du réseau, aux annales et à Sphera AI.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-8 shadow-lg shadow-emerald-600/20"
                >
                  Entrer dans CampusSphere
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-w-xl mx-auto">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Pour garantir une communauté active avec assez d'annales de cours et d'interactions, nous ouvrons CampusSphere par campus dès que <strong className="text-foreground">50 étudiants</strong> d'un même établissement sont inscrits.
                </p>

                {/* Live Gauge Progress Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-end text-xs font-medium">
                    <span className="text-foreground flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" />
                      <strong className="text-primary text-base font-bold">{currentCount}</strong> / {targetCount} inscrits
                    </span>
                    <span className="text-primary font-bold text-sm">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-3 rounded-full bg-primary/10" />
                  <p className="text-xs text-muted-foreground italic text-right">
                    Plus que <strong className="text-foreground">{remainingCount}</strong> inscriptions pour débloquer votre promo !
                  </p>
                </div>
              </div>
            )}

            {/* Primary Viral CTA: WhatsApp Share */}
            {!isOpen && (
              <div className="pt-4 space-y-3 max-w-md mx-auto">
                <Button
                  size="lg"
                  onClick={handleWhatsAppShare}
                  className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm sm:text-base h-12 shadow-lg shadow-[#25D366]/25 transition-transform active:scale-[0.98] flex items-center justify-center gap-2.5"
                >
                  <FaWhatsapp className="h-5 w-5" />
                  Partager sur WhatsApp pour débloquer
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Partagez le lien dans le groupe WhatsApp de votre classe ou de votre filière.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    readOnly
                    value={referralUrl}
                    className="text-xs h-9 bg-background/60 font-mono text-muted-foreground"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-9 px-3 flex-shrink-0 text-xs gap-1.5"
                  >
                    {copySuccess ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    <span>{copySuccess ? "Copié !" : "Copier"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* WhatsApp Notification Number Capture Form */}
        {!isOpen && (
          <section className="rounded-2xl border border-border bg-card/80 p-6 sm:p-8 backdrop-blur shadow-sm">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <div className="inline-flex p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 mb-1">
                <DeviceMobile className="h-6 w-6" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Soyez alerté sur WhatsApp dès l'ouverture 📱
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Laissez votre numéro WhatsApp. Dès que votre campus franchit la barre des 50 inscrits, nous vous enverrons un message direct pour vous donner votre accès prioritaire.
              </p>

              <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <Input
                  type="tel"
                  placeholder="Ex: +237 6 99 00 00 00"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setPhoneSaved(false);
                  }}
                  className="flex-1 text-sm h-10"
                />
                <Button
                  type="submit"
                  disabled={isSavingPhone}
                  className="h-10 text-xs sm:text-sm whitespace-nowrap bg-primary hover:bg-primary/90 font-medium"
                >
                  {isSavingPhone ? "Enregistrement..." : phoneSaved ? "Numéro vérifié ✓" : "M'avertir sur WhatsApp"}
                </Button>
              </form>

              {phoneSaved && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium pt-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Votre numéro est enregistré ! Vous recevrez une alerte prioritaire.</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* FOMO Showcase: Ce que vous débloquez */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Ce que votre promotion débloque dès l'ouverture 🚀
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Déjà utilisé par les étudiants de l'IUC à Douala pour réviser et réussir leurs semestres.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Feature 1: Annales */}
            <div className="p-5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Books className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                Banque d'Annales & Corrigés d'Examens
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Accédez à tous les anciens sujets de partiels, rattrapages et TD de votre filière partagés et résolus par les étudiants des promos supérieures.
              </p>
            </div>

            {/* Feature 2: Sphera AI */}
            <div className="p-5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Sparkle className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                Sphera AI — Assistant de Cours Intelligent
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Posez vos questions sur vos cours, générez des résumés instantanés et entraînez-vous avec des quiz sur mesure adaptés au programme camerounais.
              </p>
            </div>

            {/* Feature 3: Sphères & Groupes */}
            <div className="p-5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                Sphères Privées de Promotion
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Échangez entre camarades de la même promo, organisez vos révisions collectives et partagez des documents de cours sans spam ni dispersion.
              </p>
            </div>

            {/* Feature 4: Certifications & Stages */}
            <div className="p-5 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all space-y-2.5">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                Badge Certifié & Opportunités de Stages
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Obtenez votre badge officiel d'étudiant certifié, développez votre Impact Score académique et accédez aux opportunités professionnelles partenaires.
              </p>
            </div>
          </div>
        </section>

        {/* Private Universities Challenge (Leaderboard) */}
        <section className="rounded-2xl border border-border bg-card/90 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Course au déblocage des campus privés
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quel établissement privé atteindra en premier les 50 inscriptions ?
              </p>
            </div>
            <Badge variant="secondary" className="w-fit text-xs">
              Palier : 50 étudiants / campus
            </Badge>
          </div>

          <div className="divide-y divide-border/50">
            {campusData?.campuses?.map((c) => {
              const isSelected = c.slug === selectedSlug;
              return (
                <div
                  key={c.slug}
                  onClick={() => {
                    setSelectedSlug(c.slug);
                    setTempUniversity(c.slug);
                  }}
                  className={`py-3.5 px-3 flex items-center justify-between gap-4 cursor-pointer rounded-lg transition-colors ${
                    isSelected ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        c.isOpen
                          ? "bg-emerald-500/20 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.shortName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate text-foreground flex items-center gap-1.5">
                        {c.name}
                        {isSelected && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-primary text-primary">
                            Mon campus
                          </Badge>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.city} • {c.isOpen ? "Campus Ouvert" : `${c.currentCount} / ${c.targetCount} inscrits`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <div className="hidden sm:block w-24">
                      <Progress value={c.percentage} className="h-1.5 bg-muted" />
                    </div>
                    <Badge
                      variant={c.isOpen ? "default" : "secondary"}
                      className={`text-xs ${
                        c.isOpen
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.isOpen ? "Ouvert ✓" : `${c.percentage}%`}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 px-4 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CampusSphere Cameroun. Tous droits réservés.</p>
        <p className="mt-1">
          Besoin d'aide ou d'enregistrer une association ? Contactez l'équipe sur WhatsApp au{" "}
          <a
            href="https://wa.me/237699000000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            +237 6 99 00 00 00
          </a>
        </p>
      </footer>
    </div>
  );
}
export default CampusUnlock;
