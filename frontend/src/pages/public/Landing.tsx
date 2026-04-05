import { useState, useEffect } from "react";
import { ArrowRight, Users, Calendar, BookOpen, Shield, Star, UserPlus, LogIn, Sparkles, Zap, Heart, FolderOpen, MessageSquare, Dot, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { FaBullseye } from "react-icons/fa";
import Countdown from "@/components/layout/Countdown"
import ScrollTriggered from "@/components/layout/ScrollTriggered"
import { sectionOneCard, sectionTwoCard, sectionThreeCard } from "@/components/layout/cardData"

export function Landing() {
  const navigate = useNavigate();

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
              onClick={() => navigate('/cs-inc/waitlist')}
            >
                <div className="absolute text-center inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <UserPlus className="hidden md:block h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10 font-poppins">
                  Rejoins la liste d'attente
                </span>
            </Button>
            </div>
                          
            <Countdown />
              
              <div className="text-center hidden">
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
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 campus-glow">
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
              <ScrollTriggered cardData={sectionOneCard}/>
            </div>
          </div>

          {/* Ressources Section */}
          <div className="flex grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Illustration Ressources */}
            <div className="order-2 lg:relative items-center justify-center">
              <ScrollTriggered cardData={sectionTwoCard}/>
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
                  <p><strong>Le concept : “Impact Score”</strong> : Un système de notation unique! Chaque post a un bouton <Zap className="inline-block w-4 h-4 text-primary fill-primary"/>, que les utilisateurs peuvent évaluer.  Ce score mesure la valeur perçue d’une publication : “À quel point ce post m’a été utile, m’a inspiré, m’a aidé, ou m’a marqué ?”. Plus un post a d'impact, plus il remonte dans le feed</p>
                </div>
                <div className="flex items-start gap-3">
                  <p><strong>Feed personnalisé</strong> : <br />Ton fil d'actualité s'adapte à tes centres d'intérêt, tes sphères et les contenus avec lesquels tu interagis, fini le bruit, place au contenu qui compte vraiment</p>
                </div>
              </div>
            </div>

            {/* Illustration Feed */}
            <div className="relative items-center justify-center">
              <ScrollTriggered cardData={sectionThreeCard}/>
            </div>
          </div>           

          {/* Fonctionnalités à venir */}
          <div className="text-center">
            <h2 className="font-raleway text-4xl md:text-5xl font-bold mb-6">
              ...Et beaucoup d'autres <span className="campus-gradient bg-clip-text text-transparent">fonctionnalités à venir</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-8 lg:grid-cols-3">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                    <img src="/icons/evenement.png" alt="Evenements" />
                  </div>
                  <h3 className="font-semibold font-poppins text-xl">Événements</h3>
                </div>
                <p className="text-muted-foreground font-nunito font-semibold">Découvrez, créez et rejoignez des événements étudiants : conférences, concours, soirées, hackathons ou ateliers. Restez connecté à la vie de campus.</p>
              </div>
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
                    <img src="/icons/tuteur-ai.png" alt="Assistant" />
                  </div>
                  <h3 className="font-semibold font-poppins text-xl">Assistant IA</h3>
                </div>
                <p className="text-muted-foreground font-nunito font-semibold">Votre compagnon intelligent pour apprendre et vous organiser. Il résume vos cours, génère des quiz, vous aide à réviser et offre un espace d’écoute et de soutien émotionnel.</p>
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
              onClick={() => navigate('/cs-inc/waitlist')}
            >
              Rejoindre la liste d'attente
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