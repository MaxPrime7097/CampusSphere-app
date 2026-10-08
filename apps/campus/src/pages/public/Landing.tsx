import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowRight, UsersThree as Users, Calendar, BookOpen, Shield, Star, UserPlus, SignIn as LogIn, Sparkle as Sparkles, Lightning as Zap, Heart, FolderOpen, ChatCircle as MessageSquare, Dot, Circle, FileArrowDown as FileDown, Robot as Bot, NotePencil as FilePenLine, FileText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { FaBullseye } from "react-icons/fa";
import Countdown from "@/components/layout/Countdown"
import { lazy, Suspense } from "react"
const ScrollTriggered = lazy(() => import("@/components/layout/ScrollTriggered"))
import { sectionOneCard, sectionTwoCard, sectionThreeCard, sectionFourCard } from "@/components/layout/cardData"

export function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const canonicalUrl = location.pathname.startsWith("/cs-inc") ? "https://campussphere.app/cs-inc" : "https://campussphere.app/";

  const getSpheraUrl = () => {
    const envUrl = (import.meta.env.VITE_SPHERA_STANDALONE_URL as string)?.trim();
    const isLocal = ["localhost", "127.0.0.1"].some((host) => window.location.hostname.includes(host));
    const baseUrl = envUrl || (isLocal ? "http://localhost:5174" : "https://sphera.campussphere.app");
    const accessToken = localStorage.getItem("access") || localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh");
    const params = new URLSearchParams();
    if (accessToken) params.set("access_token", accessToken);
    if (refreshToken) params.set("refresh_token", refreshToken);
    const query = params.toString();
    return `${baseUrl.replace(/\/$/, "")}/app${query ? `?${query}` : ""}`;
  };

  useEffect(() => {
    // Création des particules
    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      if (!particlesContainer) return;

      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
          position: absolute;
          background: rgba(255, 152, 0, 0.3);
          border-radius: 50%;
          pointer-events: none;
        `;

        // Taille aléatoire
        const size = Math.random() * 6 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        // Position aléatoire
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Animation delay aléatoire
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        particle.style.animationName = 'float-particle';
        particle.style.animationIterationCount = 'infinite';
        particle.style.animationTimingFunction = 'ease-in-out';

        particlesContainer.appendChild(particle);
      }
    }

    // Animation au scroll
    function animateOnScroll() {
      const elements = document.querySelectorAll('.feature-card, .stat-card, .team-card');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.animation = 'fadeInUp 0.6s ease-out forwards';
          }
        });
      }, { threshold: 0.1 });

      elements.forEach(el => {
        const element = el as HTMLElement;
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
      });
    }

    // Initialisation
    createParticles();
    animateOnScroll();
  }, []);

  return (
    <div className="min-h-screen p-0 bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>CampusSphere - Le réseau social qui connecte les étudiants</title>
        <meta name="description" content="Découvrez CampusSphere, le réseau social qui révolutionne la vie étudiante : sphères collaboratives, partage de cours et ressources universitaires, feed intelligent et révisions avec Sphera IA." />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="CampusSphere - Le réseau social qui connecte les étudiants" />
        <meta property="og:description" content="Rejoignez la communauté étudiante, partagez vos cours, collaborez en groupes d'étude et révisez vos examens avec CampusSphere." />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="CampusSphere - Le réseau social qui connecte les étudiants" />
        <meta name="twitter:description" content="Rejoignez la communauté étudiante, partagez vos cours, collaborez en groupes d'étude et révisez vos examens avec CampusSphere." />
        <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://campussphere.app/#website",
                "name": "CampusSphere",
                "url": "https://campussphere.app",
                "description": "Le réseau social étudiant qui connecte la communauté universitaire.",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://campussphere.app/search?q={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              },
              {
                "@type": "EducationalOrganization",
                "@id": "https://campussphere.app/#organization",
                "name": "CampusSphere",
                "url": "https://campussphere.app",
                "logo": "https://campussphere.app/CS.svg",
                "sameAs": [
                  "https://web.facebook.com/campussphereofficial",
                  "https://www.linkedin.com/company/campussphere",
                  "https://www.instagram.com/campussphere"
                ]
              }
            ]
          })}
        </script>
      </Helmet>
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="relative py-10 md:py-4 px-0 overflow-hidden w-full">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 campus-gradient opacity-20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 campus-gradient opacity-20 blur-3xl rounded-full"></div>
        </div>

        <div className="container max-w-9xl justify-center">
          {/* Particules de fond */}
          <div className="particles absolute inset-0 -z-10" id="particles"></div>
          <div className="lg:grid grid-cols-2 gap-12 items-center">
            {/* Contenu texte */}
            <div className="space-y-4 md:space-y-8">
              {/* Logo et titre */}
              <div className="campus-animate-fade-in text-center">
                <h1
                  className="text-4xl md:text-5xl text-foreground mb-6 font-automata text-spacing-1"
                >
                  Le réseau social qui connecte les étudiants
                </h1>
                <div className="flex gap-6 mt-4 justify-center">
                  <span
                    className="text-xl font-semibold text-muted-foreground uppercase tracking-wider font-automata text-spacing-1"
                  >
                    Connect.
                  </span>
                  <span
                    className="text-xl font-semibold text-muted-foreground uppercase tracking-wider font-automata text-spacing-1"
                  >
                    Share.
                  </span>
                  <span
                    className="text-xl font-semibold text-muted-foreground uppercase tracking-wider font-automata text-spacing-1"
                  >
                    Grow.
                  </span>
                </div>
              </div>

              {/* Message principal dynamique */}
              <div className="campus-animate-slide-up animation-delay-2s text-center">
                <h2 className="text-3xl font-nunito md:text-4xl font-bold text-foreground mb-4 leading-tight">
                  Rejoins la sphère,<br />
                  <span className="text-primary">partage, collabore</span><br />
                  et grandis avec tes camarades
                </h2>
              </div>

              {/* Boutons CTA avec animation */}
              <div className="campus-animate-slide-up space-y-4 animation-delay-4s">
                <div className="text-center">
                  <Button
                    size="lg"
                    className="px-6 py-6 md:px-12 md:py-8 campus-gradient text-white justify-center hover:opacity-90 text-xl rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl gap-3 group relative overflow-hidden animate-pulse hover:animate-none"
                    onClick={() => navigate('/register')}
                  >
                    <div className="absolute text-center inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <UserPlus className="hidden md:block h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="relative z-10 font-poppins">
                      Rejoins CampusSphere
                    </span>
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center text-center pt-2">
                  <h1 className="text-3xl font-bold font-raleway text-primary mb-4">🚀 CampusSphere est là !</h1>
                </div>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    className="font-poppins text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => navigate('/login')}
                  >
                    Déjà un compte ? Se connecter
                  </Button>
                </div>
              </div>
            </div>
            {/* Image de campus */}
            <div className="relative hidden lg:block campus-animate-slide-up pb-5">
              <div className="absolute inset-0 campus-gradient opacity-15 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 shadow-sm">
                <img
                  src="/Illustrations/Students-amico.svg"
                  alt="CampusSphere illustration"
                  loading="lazy"
                  className="w-full h-auto rounded-2xl"
                />
                {/* Stickers flottants */}
                <div className="absolute top-4 right-4 text-2xl animate-bounce animation-delay-0s">📚</div>
                <div className="absolute bottom-4 left-4 text-2xl animate-bounce animation-delay-5s">💡</div>
                <div className="absolute top-1/2 right-4 text-2xl animate-bounce animation-delay-1s">🎯</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités MVP Section */}
      <section className="mt-0 py-10 md:py-20 px-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-raleway text-4xl md:text-5xl font-bold mb-6">
              Ce qui nous <span className="campus-gradient bg-clip-text text-transparent">différencie</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-9xl mx-auto font-nunito font-semibold">
              Une plateforme pensée par et pour les étudiants, avec des fonctionnalités uniques qui changent la donne
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Sphères Collaboratives */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img src="/icons/equipe.png" alt="Sphères Collaboratives" className="w-16 h-16" />
                <div>
                  <h3 className="text-2xl font-poppins font-semibold">Sphères Collaboratives</h3>
                  <p className="text-muted-foreground font-nunito font-semibold">Crée et rejoins des espaces de travail thématiques</p>
                </div>
              </div>
              <div className="space-y-4 font-nunito text-lg">
                <div className="flex items-start gap-3">
                  <p><strong>Tableau Kanban</strong> : <br />Visualise et pilote tes projets en temps réel, glisse les tâches de "À faire" à "Terminé", assigne des membres et fixe des deadlines sans jamais perdre le fil</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Espace fichiers partagé</strong> : <br />Centralise tous les documents de la sphère; cours, notes, slides, PDF, accessibles et téléchargeables par chaque membre en un clic</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Chat de groupe instantané</strong> : <br />Discute avec tous les membres directement dans la sphère, sans application tierce. Les messages arrivent en temps réel, même sur mobile</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Vue d'ensemble intelligente</strong> : <br />Un dashboard qui agrège progression des tâches, fichiers récents, activité des membres et messages non lus, tout ce dont tu as besoin en un coup d'œil</p>
                </div>
              </div>
            </div>

            {/* Illustration Sphères */}
            <div className="relative items-center justify-center">
              <Suspense fallback={<div>Loading animation...</div>}><ScrollTriggered cardData={sectionOneCard} /></Suspense>
            </div>
          </div>

          {/* Ressources Section */}
          <div className="flex grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Illustration Ressources */}
            <div className="order-2 lg:relative items-center justify-center">
              <Suspense fallback={<div>Loading animation...</div>}><ScrollTriggered cardData={sectionTwoCard} /></Suspense>
            </div>

            {/* Partage de ressources */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="flex items-center gap-4">
                <img src="/icons/partage-de-fichiers.png" alt="Ressources" className="w-16 h-16" />
                <div>
                  <h3 className="text-2xl font-poppins font-semibold">Partage de ressources</h3>
                  <p className="text-muted-foreground font-nunito font-semibold">Partage des ressources entre les membres de la sphère</p>
                </div>
              </div>
              <div className="space-y-4 font-nunito text-lg">
                <div className="flex items-start gap-3">
                  <p><strong>Bibliothèque communautaire</strong> : <br />Accède à des centaines de ressources gratuites; fiches de révision, annales, résumés de cours, etc. Partagées par des étudiants qui ont déjà traversé les mêmes épreuves</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Partage en quelques secondes</strong> : <br />Upload un fichier, ajoute un titre et une matière et après validation, ta ressource est immédiatement disponible pour toute la communauté</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Organisé par matière et niveau</strong> : <br />Filtre par discipline, type de document ou niveau d'études pour trouver exactement ce dont tu as besoin, sans perdre de temps</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feed Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Feed Intelligent */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img src="/icons/impact.png" alt="Feed Impact Score" className="w-16 h-16" />
                <div>
                  <h3 className="text-2xl font-poppins font-semibold">Feed avec Impact Score</h3>
                  <p className="text-muted-foreground font-nunito font-semibold">Contenu personnalisé selon tes centres d'intérêt avec un nouveau système de notation</p>
                </div>
              </div>
              <div className="space-y-4 font-nunito text-lg">
                <div className="flex items-start gap-3">
                  <p><strong>Le concept : “Impact Score”</strong> : Un système de notation unique! Chaque post a un bouton <Zap className="inline-block w-4 h-4 text-primary" weight="fill" />, que les utilisateurs peuvent évaluer.  Ce score mesure la valeur perçue d’une publication : “À quel point ce post m’a été utile, m’a inspiré, m’a aidé, ou m’a marqué ?”. Plus un post a d'impact, plus il remonte dans le feed</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Feed personnalisé</strong> : <br />Ton fil d'actualité s'adapte à tes centres d'intérêt, tes sphères et les contenus avec lesquels tu interagis, fini le bruit, place au contenu qui compte vraiment</p>
                </div>
                <div className="pt-2">
                  <Button
                    variant="link"
                    onClick={() => navigate('/cs-inc/impact-score')}
                    className="p-0 h-auto text-primary font-semibold inline-flex items-center gap-1.5 hover:gap-2.5 transition-all text-base"
                  >
                    <span>Comprendre l'Impact Score en détail</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Illustration Feed */}
            <div className="relative items-center justify-center">
              <Suspense fallback={<div>Loading animation...</div>}><ScrollTriggered cardData={sectionThreeCard} /></Suspense>
            </div>
          </div>

          {/* Événements Section */}
          <div className="flex grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Illustration Événements */}
            <div className="order-2 lg:relative items-center justify-center">
              <Suspense fallback={<div>Loading animation...</div>}><ScrollTriggered cardData={sectionFourCard} /></Suspense>
            </div>

            {/* Événements & Vie de Campus */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="flex items-center gap-4">
                <img src="/icons/evenement.png" alt="Événements" className="w-16 h-16" />
                <div>
                  <h3 className="text-2xl font-poppins font-semibold">Événements & Vie de Campus</h3>
                  <p className="text-muted-foreground font-nunito font-semibold">Ne manque aucun temps fort associatif ou académique de ton université</p>
                </div>
              </div>
              <div className="space-y-4 font-nunito text-lg">
                <div className="flex items-start gap-3">
                  <p><strong>Calendrier centralisé</strong> : <br />Découvre en un coup d'œil les conférences, soirées d'intégration, hackathons, tournois et ateliers organisés sur ton campus</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Création & Billetterie en 1 clic</strong> : <br />Organise un événement associatif ou étudiant, définis le lieu, la date, la jauge limite et gère facilement les inscriptions</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Gestion des participants & Rappels</strong> : <br />Suis la liste des participants en direct, reçois des rappels automatiques avant le début et échange avec la communauté</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sphera Section ─────────────────────────────────── */}
          <div className="relative mb-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(circle,rgba(34,197,94,0.03)_0%,transparent_70%)] blur-3xl -z-10 pointer-events-none" />

            <div className="rounded-3xl border border-border/50 bg-card overflow-hidden relative shadow-[0_0_50px_rgba(34,197,94,0.03)]">
              {/* Subtle Green Glow inside card */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e] opacity-5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Content Side */}
                <div className="p-10 md:p-12 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22c55e] border border-[#22c55e] text-xs font-bold text-white mb-6 self-start">
                    <Sparkles className="w-4 h-4" /> Nouveau - Powered by CampusSphere
                  </div>

                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                    Découvre Sphera
                  </h2>
                  <p className="text-sm font-semibold mb-6" style={{ color: '#22c55e' }}>Votre assistante académique personnelle</p>

                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Ton assistante académique dopée à l'IA. Génère des fiches de révision, corrige tes annales sujets d'examens, crée des quiz personnalisés et des flashcards — puis exporte tout en PDF premium en un clic.
                  </p>

                  {/* Feature pills (neutralized) */}
                  <div className="flex flex-wrap gap-2 mb-8">
                    {["Fiches de révision", "Flashcards", "Quiz adaptatifs", "Correction d'annales", "Chat IA en direct", "Export PDF premium"].map((feat) => (
                      <span
                        key={feat}
                        className="px-3 py-1.5 rounded-full text-xs font-medium font-poppins bg-muted/50 border border-border/50 text-muted-foreground"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => navigate('/sphera')}
                      className="group flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors duration-300 self-start bg-foreground text-background hover:bg-[#22c55e] hover:text-white"
                    >
                      Essayer Sphera
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                    <a
                      href={getSpheraUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-accent border border-border self-start text-foreground bg-transparent"
                    >
                      Ouvrir l'app Sphera
                    </a>
                  </div>
                </div>

                {/* Visual Side */}
                <div className="relative min-h-[350px] md:min-h-full bg-accent/20 border-t md:border-t-0 md:border-l border-border/50 flex flex-col items-center justify-center p-8 overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

                  {/* Sphera Logo Card */}
                  <div className="relative z-10 w-full max-w-[220px] aspect-square bg-card/80 backdrop-blur-md rounded-2xl border border-[#22c55e]/30 shadow-[0_0_50px_rgba(34,197,94,0.15)] flex flex-col items-center justify-center p-6 group hover:border-[#22c55e]/60 transition-colors duration-500">
                    <div className="absolute inset-0 bg-[#22c55e]/5 rounded-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                    
                    <img 
                      src="/sphera_logo.svg" 
                      alt="Sphera Logo" 
                      className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] group-hover:scale-110 transition-transform duration-500 z-10 rounded-2xl"
                    />
                    
                    <h3 className="font-display font-bold text-foreground mt-6 text-xl tracking-tight z-10">Sphera</h3>
                  </div>

                  {/* Decorative background elements */}
                  <div className="absolute z-0 w-32 h-32 rounded-full border border-[#22c55e]/20 -translate-x-20 translate-y-20 animate-[spin_10s_linear_infinite]" />
                  <div className="absolute z-0 w-48 h-48 rounded-full border border-dashed border-[#22c55e]/20 translate-x-20 -translate-y-20 animate-[spin_15s_linear_infinite_reverse]" />
                </div>
              </div>
            </div>
          </div>

          {/* Fonctionnalités à venir */}
          <div className="text-center">
            <h2 className="font-raleway text-4xl md:text-5xl font-bold mb-6">
              ...Et beaucoup d'autres <span className="campus-gradient bg-clip-text text-transparent">fonctionnalités à venir</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                    <img src="/icons/marketplace.png" alt="Marketplace" />
                  </div>
                  <h3 className="font-semibold font-poppins text-xl">Marketplace</h3>
                </div>
                <p className="text-muted-foreground font-nunito font-semibold">Achetez, vendez ou échangez facilement du matériel et services académique ou personnel entre étudiants. Un espace sûr et pratique pour tous vos besoins de campus.</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                    <img src="/icons/learn.png" alt="Learn" />
                  </div>
                  <h3 className="font-semibold font-poppins text-xl">Campus Learn</h3>
                </div>
                <p className="text-muted-foreground font-nunito font-semibold">Une bibliothèque numérique moderne regroupant livres, cours et formations gratuits ou premium, créés en partenariat avec des professeurs et experts pour rendre le savoir accessible à tous.</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                    <img src="/icons/talents.png" alt="Talents" />
                  </div>
                  <h3 className="font-semibold font-poppins text-xl">Pôle de talents</h3>
                </div>
                <p className="text-muted-foreground font-nunito font-semibold">Mettez en avant vos compétences, projets et réalisations. Connectez-vous à d’autres étudiants, clubs ou recruteurs à la recherche de talents comme vous.</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                    <img src="/icons/application-mobile.png" alt="App Mobile" />
                  </div>
                  <h3 className="font-semibold font-poppins text-xl">Application Mobile</h3>
                </div>
                <p className="text-muted-foreground font-nunito font-semibold">Retrouvez toute l’expérience CampusSphere dans votre poche : sphères collaboratives, événements, chat et notifications — accessibles à tout moment, où que vous soyez.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-primary/10 hidden">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Rejoignez des milliers d'étudiants
            </h2>
            <p className="text-xl text-muted-foreground">
              Ils ont déjà transformé leur expérience universitaire
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold campus-gradient bg-clip-text text-transparent mb-2">10K+</div>
              <p className="text-muted-foreground">Étudiants inscrits</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold campus-gradient bg-clip-text text-transparent mb-2">25+</div>
              <p className="text-muted-foreground">Universités partenaires</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold campus-gradient bg-clip-text text-transparent mb-2">4.9★</div>
              <p className="text-muted-foreground">Note moyenne</p>
            </div>
          </div>

          <div className="bg-card/50 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-primary fill-current" />
              ))}
            </div>
            <blockquote className="text-lg italic text-muted-foreground mb-4">
              "CampusSphere a révolutionné ma façon d'étudier. J'ai trouvé des groupes d'étude incroyables
              et accès à des ressources que je n'aurais jamais trouvées ailleurs."
            </blockquote>
            <cite className="text-foreground font-semibold">- Marie D., Étudiante en Informatique</cite>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-raleway text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Prêt à transformer </span>
            <span className="campus-gradient bg-clip-text text-transparent">
              vos études ?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-nunito font-semibold">
            Rejoignez CampusSphere dès aujourd'hui et découvrez une nouvelle façon d'étudier,
            collaborer et réussir votre parcours universitaire.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button
              size="lg"
              className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8"
              onClick={() => navigate('/register')}
            >
              Rejoindre la communauté
              <ArrowRight className="hidden ml-2 h-5 w-5 md:block" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-8 font-poppins"
              onClick={() => navigate('/cs-inc/about')}
            >
              En savoir plus
            </Button>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
      <CookieBanner />
    </div>
  );
}