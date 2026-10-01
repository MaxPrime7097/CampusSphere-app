import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Lightning as Zap,
  ArrowRight,
  UploadSimple,
  SlidersHorizontal,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Question,
  Sparkle as Sparkles,
  Trophy,
  FileText
} from "@phosphor-icons/react";
import { IMPACT_LEVELS } from "@/constants/profileConstants";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function ImpactScoreInfo(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const activeRules = [
    {
      title: "Upload d'une ressource",
      points: "+5 points",
      badge: "Automatique",
      description:
        "Attribué directement à votre compte chaque fois que vous partagez un document d'étude utile (fiche de révision, cours, annale d'examen ou synthèse) dans l'espace Ressources ou dans une Sphère.",
      icon: UploadSimple,
      highlightColor: "text-blue-500",
      bgLight: "bg-blue-500/10",
      borderLight: "border-blue-500/20"
    },
    {
      title: "Évaluation d'impact par un camarade",
      points: "+1 à +5 points",
      badge: "Vote des pairs",
      description:
        "Sur chaque publication du fil, les autres étudiants peuvent cliquer pour donner +1 ou maintenir appuyé pour choisir une note d'impact de 1 à 5 (« À quel point ce post m'a aidé ou inspiré ? »). La valeur attribuée est ajoutée à votre profil.",
      icon: Zap,
      highlightColor: "text-primary",
      bgLight: "bg-primary/10",
      borderLight: "border-primary/20"
    },
    {
      title: "Ajustement & Révocation automatique",
      points: "Recalcul dynamique",
      badge: "Intégrité",
      description:
        "Si un camarade modifie sa note (par exemple de 5 à 2) ou la retire, le delta est immédiatement ajusté. Le total reflète toujours la somme exacte et transparente des votes actifs.",
      icon: SlidersHorizontal,
      highlightColor: "text-emerald-500",
      bgLight: "bg-emerald-500/10",
      borderLight: "border-emerald-500/20"
    }
  ];

  const zeroPointRules = [
    {
      title: "Création d'un post simple",
      reason: "Favorise la qualité plutôt que la quantité de publications pour éliminer le spam sur le campus."
    },
    {
      title: "Création d'un commentaire",
      reason: "Empêche les messages superflus ou artificiels visant à gonfler son score."
    },
    {
      title: "Téléchargement d'un fichier",
      reason: "Seule la notation explicite par le camarade après consultation valide la vraie valeur pédagogique."
    },
    {
      title: "Auto-évaluation sur ses propres posts",
      reason: "Strictement impossible. Seuls les tiers peuvent évaluer et faire grandir votre score."
    }
  ];

  const faqs = [
    {
      q: "Comment noter l'impact d'un post sur le feed ?",
      a: "Chaque publication comporte un bouton avec un éclair. Un simple clic rapide lui attribue +1 point d'impact. En maintenant le clic enfoncé (ou appui long sur smartphone / survol sur ordinateur), une barre s'affiche pour choisir précisément votre note de 1 à 5."
    },
    {
      q: "Mon Impact Score peut-il diminuer ?",
      a: "Votre score augmente avec chaque ressource partagée et chaque note reçue. Il ne diminue pas avec le temps. La seule baisse intervient si un utilisateur retire sa note d'impact ou si une ressource non conforme est supprimée."
    },
    {
      q: "Quel est l'effet de l'Impact Score sur le fil d'actualité ?",
      a: "L'algorithme de tri de CampusSphere priorise les contenus ayant le score d'impact le plus élevé. Les cours, astuces et synthèses plébiscités par la communauté restent ainsi visibles en tête du feed."
    },
    {
      q: "Pourrai-je utiliser mes points d'Impact Score concrètement ?",
      a: "Oui, absolument ! L'équipe prépare une utilité directe et des avantages exclusifs pour vos points. Accumulez un maximum d'Impact Score dès maintenant en partageant vos fiches et en aidant vos camarades pour débloquer ces privilèges dès leur ouverture."
    },
    {
      q: "Où puis-je voir mon niveau et mes badges ?",
      a: "Votre Impact Score est visible sur votre en-tête de profil avec la barre de progression vers le palier supérieur, ainsi qu'à côté de votre nom sur vos publications."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Impact Score : Fonctionnement & Barème | CampusSphere</title>
        <meta
          name="description"
          content="Découvrez le fonctionnement officiel de l'Impact Score de CampusSphere : barème de points, notation par les pairs (+1 à +5), upload de ressources (+5) et paliers de progression."
        />
        <link rel="canonical" href="https://campussphere.app/cs-inc/impact-score" />
      </Helmet>

      <Header />

      <main>
        {/* ─── Hero Section ─── */}
        <section className="relative py-6 sm:py-10 md:py-16 px-0 overflow-hidden">
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 campus-gradient opacity-20 blur-3xl rounded-full" />
            <div className="absolute bottom-20 right-10 w-96 h-96 campus-gradient opacity-20 blur-3xl rounded-full" />
          </div>

          <div className="container mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 sm:space-y-6 campus-animate-fade-in">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full border border-primary/20 bg-primary/5">
                <span className="font-poppins text-xs sm:text-sm font-medium text-foreground">
                  Accumulez dès maintenant : utilité directe très prochainement !
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-automata leading-tight">
                <span className="campus-gradient bg-clip-text text-transparent">
                  L'Impact Score
                </span>
                <br />
                <span className="text-foreground">sur CampusSphere</span>
              </h1>

              <p className="font-nunito font-semibold text-sm sm:text-base md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Sur CampusSphere, la valeur ne dépend ni des likes artificiels ni du volume de posts.
                L'Impact Score récompense l'utilité réelle de vos partages et l'entraide concrète apportée à vos camarades.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={() => navigate(isAuthenticated ? "/" : "/register")}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-md h-auto"
                >
                  <span>{isAuthenticated ? "Accéder à mon espace" : "Rejoindre CampusSphere"}</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const el = document.getElementById("bareme-officiel");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 h-auto"
                >
                  Consulter les règles
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Barème Officiel des Points ─── */}
        <section id="bareme-officiel" className="py-8 sm:py-12 md:py-20 px-0">
          <div className="container mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
            <div className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto">
              <h2 className="font-raleway text-2xl sm:text-3xl md:text-4xl font-bold">
                <span className="text-foreground">Comment les points </span>
                <span className="campus-gradient bg-clip-text text-transparent">sont attribués</span>
              </h2>
              <p className="font-nunito font-semibold text-xs sm:text-sm md:text-base text-muted-foreground">
                Le système repose sur des règles précises pour garantir l'équité et récompenser le travail partagé.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3.5 sm:gap-6">
              {activeRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="cs-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border/60 bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-md flex flex-col justify-between space-y-3 sm:space-y-4"
                >
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0", rule.bgLight, rule.highlightColor)}>
                        <rule.icon className="h-5 w-5 sm:h-6 sm:w-6" weight="bold" />
                      </div>
                      <span className={cn("px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold font-poppins border shrink-0", rule.bgLight, rule.highlightColor, rule.borderLight)}>
                        {rule.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-poppins font-bold text-base sm:text-lg text-foreground">{rule.title}</h3>
                      <div className={cn("text-lg sm:text-xl font-bold font-automata", rule.highlightColor)}>
                        {rule.points}
                      </div>
                    </div>

                    <p className="font-nunito font-semibold text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {rule.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Ce qui ne donne volontairement pas de points ─── */}
        <section className="py-8 sm:py-12 md:py-20 px-0 bg-card/30 border-y border-border/40">
          <div className="container mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-8">
            <div className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto">
              <h2 className="font-raleway text-2xl sm:text-3xl md:text-4xl font-bold">
                <span className="text-foreground">Ce qui ne rapporte </span>
                <span className="campus-gradient bg-clip-text text-transparent">pas de points</span>
              </h2>
              <p className="font-nunito font-semibold text-xs sm:text-sm md:text-base text-muted-foreground">
                Ces actions ont été volontairement exclues du barème pour privilégier l'utilité réelle et prévenir le flood.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {zeroPointRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="cs-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/50 bg-card space-y-1 sm:space-y-1.5 flex items-start gap-2.5 sm:gap-4"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0 mt-0.5">
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5" weight="fill" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-poppins font-bold text-sm sm:text-base text-foreground leading-snug">{rule.title}</h4>
                      <span className="text-[11px] sm:text-xs font-bold text-muted-foreground font-poppins px-2 py-0.5 rounded-full bg-muted shrink-0">0 pt</span>
                    </div>
                    <p className="font-nunito font-semibold text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {rule.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Paliers de Progression ─── */}
        <section className="py-8 sm:py-12 md:py-20 px-0">
          <div className="container mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-8">
            <div className="text-center space-y-2 sm:space-y-3 max-w-3xl mx-auto">
              <h2 className="font-raleway text-2xl sm:text-3xl md:text-4xl font-bold">
                <span className="text-foreground">Les 5 Paliers de </span>
                <span className="campus-gradient bg-clip-text text-transparent">Progression</span>
              </h2>
              <p className="font-nunito font-semibold text-xs sm:text-sm md:text-base text-muted-foreground">
                Votre profil évolue automatiquement à chaque palier de points franchi avec un badge dédié.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
              {IMPACT_LEVELS.map((level, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "cs-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/60 bg-card flex flex-col items-center text-center space-y-1.5 sm:space-y-2.5 hover:border-primary/50 transition-all duration-300 group",
                    idx === 4 ? "col-span-2 sm:col-span-1" : ""
                  )}
                >
                  <div className={cn("w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-sm bg-gradient-to-tr", level.color)}>
                    <span className="group-hover:scale-110 transition-transform">{level.icon}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider font-poppins">
                      Dès {level.min} pts
                    </span>
                    <h4 className="font-poppins font-bold text-xs sm:text-sm md:text-base text-foreground">{level.label}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Teaser / Utilité Future Concrète ─── */}
        <section className="py-8 sm:py-12 md:py-20 px-0">
          <div className="container mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-xl sm:rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 sm:p-8 md:p-10 shadow-lg space-y-4 sm:space-y-6">
              <div className="absolute top-0 right-0 w-64 h-64 campus-gradient opacity-10 blur-2xl rounded-full pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary font-poppins text-[10px] sm:text-xs font-bold uppercase tracking-wider w-fit">
                  <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" weight="fill" />
                  <span>À venir très prochainement</span>
                </div>
                <span className="text-[11px] sm:text-xs font-poppins font-semibold text-muted-foreground">
                  Préparez votre réserve de points
                </span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-raleway text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground leading-snug">
                  Pourquoi accumuler le maximum d'Impact Score dès aujourd'hui ?
                </h3>
                <p className="font-nunito font-semibold text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                  L'Impact Score ne sera pas qu'un simple badge honorifique : une <strong>utilité concrète et directe</strong> arrive très prochainement sur CampusSphere ! Vos points cumulés vous serviront activement sur la plateforme.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-2.5 sm:gap-4 pt-1">
                <div className="cs-card rounded-xl sm:rounded-2xl border border-border/50 bg-card/80 p-3 sm:p-4 space-y-1 sm:space-y-1.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5" weight="bold" />
                  </div>
                  <h4 className="font-poppins font-bold text-sm sm:text-base text-foreground">Avantages & Privilèges</h4>
                  <p className="font-nunito font-semibold text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Débloquez des opportunités réservées, des statuts premium et des accès exclusifs au sein de votre université.
                  </p>
                </div>

                <div className="cs-card rounded-xl sm:rounded-2xl border border-border/50 bg-card/80 p-3 sm:p-4 space-y-1 sm:space-y-1.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" weight="fill" />
                  </div>
                  <h4 className="font-poppins font-bold text-sm sm:text-base text-foreground">Utilisation directe</h4>
                  <p className="font-nunito font-semibold text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Vos points deviendront utilisables pour booster votre apprentissage, vos outils d'étude et vos interactions.
                  </p>
                </div>

                <div className="cs-card rounded-xl sm:rounded-2xl border border-border/50 bg-card/80 p-3 sm:p-4 space-y-1 sm:space-y-1.5">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" weight="bold" />
                  </div>
                  <h4 className="font-poppins font-bold text-sm sm:text-base text-foreground">Prenez une longueur d'avance</h4>
                  <p className="font-nunito font-semibold text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Chaque fiche partagée et chaque note d'impact reçue aujourd'hui vous positionne en tête pour le lancement des nouvelles fonctionnalités.
                  </p>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-t border-border/40">
                <p className="text-xs sm:text-sm font-nunito font-semibold text-muted-foreground">
                  Partagez vos meilleures synthèses dès maintenant et faites décoller votre compteur.
                </p>
                <Button
                  onClick={() => navigate(isAuthenticated ? "/resources" : "/register")}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-md whitespace-nowrap w-full sm:w-auto h-auto"
                >
                  Faire grimper mon score
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-8 sm:py-12 md:py-20 px-0 bg-card/30 border-t border-border/40">
          <div className="container mx-auto max-w-4xl px-3 sm:px-6 lg:px-8 space-y-5 sm:space-y-8">
            <div className="text-center space-y-2 sm:space-y-3">
              <h2 className="font-raleway text-2xl sm:text-3xl md:text-4xl font-bold">
                <span className="text-foreground">Questions </span>
                <span className="campus-gradient bg-clip-text text-transparent">fréquentes</span>
              </h2>
              <p className="font-nunito font-semibold text-xs sm:text-sm md:text-base text-muted-foreground">
                Les réponses aux interrogations sur l'utilisation du score au quotidien
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="cs-card p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-border/60 bg-card space-y-1.5 sm:space-y-2">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <Question className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" weight="bold" />
                    <h4 className="font-poppins font-bold text-sm sm:text-base md:text-lg text-foreground leading-snug">{faq.q}</h4>
                  </div>
                  <p className="font-nunito font-semibold text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed pl-6 sm:pl-8">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Final ─── */}
        <section className="py-10 sm:py-16 md:py-20 px-3 sm:px-4 bg-gradient-to-r from-primary/10 to-primary/5 text-center">
          <div className="container mx-auto max-w-4xl space-y-4 sm:space-y-6">
            <div className="campus-animate-fade-in space-y-3 sm:space-y-4">
              <h2 className="font-raleway text-2xl sm:text-3xl md:text-4xl font-bold">
                <span className="text-foreground">Rejoignez vos camarades sur </span>
                <span className="campus-gradient bg-clip-text text-transparent">CampusSphere</span>
              </h2>
              <p className="text-xs sm:text-sm md:text-lg text-muted-foreground font-nunito font-semibold max-w-2xl mx-auto leading-relaxed">
                Partagez vos fiches de cours, répondez aux questions de votre promo et développez votre impact académique.
              </p>
              <div className="pt-2 flex justify-center">
                <Button
                  onClick={() => navigate(isAuthenticated ? "/resources" : "/register")}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-sm sm:text-base px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-md h-auto"
                >
                  <span>{isAuthenticated ? "Découvrir les ressources" : "Créer mon compte étudiant"}</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
