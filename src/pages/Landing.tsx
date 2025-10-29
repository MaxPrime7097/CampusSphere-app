import { useState, useEffect } from "react";
import { ArrowRight, Users, Calendar, BookOpen, Shield, Star, UserPlus, LogIn, Sparkles, Zap, Heart, FolderOpen, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <section className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Particules de fond */}
        <div className="particles absolute inset-0 -z-10" id="particles"></div>

        <div className="hero-content text-center space-y-8 max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenu texte */}
          <div className="space-y-8">
            {/* Logo et titre */}
            <div className="campus-animate-fade-in">
            <img
              src="/CS.svg"
              alt="CampusSphere Logo"
                className="w-32 h-auto block mx-auto mb-6 mt-3"
            />
              <h1
                className="text-4xl md:text-5xl font-bold text-primary mb-4"
              style={{ fontFamily: 'Automata Display', letterSpacing: '1.5px' }}
            >
              CampusSphere
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
            <div className="campus-animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                Rejoins la sphère,<br />
                <span className="text-primary">partage, collabore</span><br />
                et grandis avec tes camarades
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Le réseau social qui connecte les étudiants. 
                Partage tes ressources, collabore sur des projets, et grandissez ensemble !
            </p>
          </div>

            {/* Éléments visuels engageants */}
            <div className="flex flex-wrap justify-center items-center gap-6 campus-animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Communauté active</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Ressources gratuites</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-blue-500" />
                <span>Projet collaboratifs</span>
              </div>
            </div>

            {/* Boutons CTA avec animation */}
            <div className="campus-animate-slide-up space-y-4" style={{ animationDelay: '0.4s' }}>
            <Button
              size="lg"
                className="campus-gradient text-white hover:opacity-90 text-xl px-12 py-6 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl gap-3 group relative overflow-hidden animate-pulse hover:animate-none"
              onClick={() => navigate('/register')}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <UserPlus className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10 font-semibold">Rejoindre CampusSphere</span>
            </Button>
              
              <div className="text-center">
            <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-primary transition-colors"
              onClick={() => navigate('/login')}
            >
                  Déjà un compte ? Se connecter
            </Button>
              </div>
            </div>
          </div>

          {/* Image de campus */}
          <div className="campus-animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="relative">
              {/* Image placeholder - remplacez par une vraie image de campus */}
              <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                {/* Illustration de campus avec des éléments étudiants */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10">
                <img
                  src="/Illustrations/Students-amico.svg"
                  alt="CampusSphere Logo"
                  className="w-full h-full object-cover"
                />
                </div>
                
                {/* Éléments décoratifs représentant la vie étudiante */}
                {/* Stickers flottants */}
                <div className="absolute top-4 right-4 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>📚</div>
                <div className="absolute bottom-4 left-4 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>💡</div>
                <div className="absolute top-1/2 right-4 text-2xl animate-bounce" style={{ animationDelay: '1s' }}>🎯</div>
              </div>
              
              {/* Badge de confiance */}
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fonctionnalités MVP Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Fonctionnalités MVP
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ce qui nous <span className="campus-gradient bg-clip-text text-transparent">différencie</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Une plateforme pensée par et pour les étudiants, avec des fonctionnalités uniques qui changent la donne
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Sphères Collaboratives */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Sphères Collaboratives</h3>
                  <p className="text-muted-foreground">Crée et rejoins des espaces de travail thématiques</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Projets d'équipe</strong> : Organise tes projets avec des tâches, deadlines et assignations</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Partage de fichiers</strong> : Fichiers partagés avec les membres de la sphère</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Chat intégré</strong> : Communication directe avec ton équipe</p>
                </div>
              </div>
            </div>
            
            {/* Illustration Sphères */}
            <div className="relative">
              <div className="w-full h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5">
                <img
                  src="/Illustrations/Team work-amico.svg"
                  alt="Sphères Collaboratives"
                  className="w-full h-full object-cover"
                />
                </div>
                
                {/* Particules */}
                <div className="absolute top-4 left-4 w-3 h-3 bg-blue-500/30 rounded-full animate-pulse"></div>
                <div className="absolute top-8 right-8 w-2 h-2 bg-purple-500/40 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-8 left-8 w-4 h-4 bg-pink-500/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Illustration Feed */}
            <div className="relative order-2 lg:order-1">
              <div className="w-full h-80 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-teal-500/5 to-blue-500/5">
                <img
                  src="/Illustrations/Feed-amico.svg"
                  alt="Feed Intelligent"
                  className="w-full h-full object-cover"
                />
                </div>
              </div>
            </div>

            {/* Feed Intelligent */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Feed Intelligent</h3>
                  <p className="text-muted-foreground">Contenu personnalisé selon tes centres d'intérêt</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Algorithmes adaptatifs</strong> : Découvre du contenu pertinent pour tes études</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Filtres intelligents</strong> : Par Université et Filière</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Recommandations</strong> : Ressources, Sphères et personnes qui matchent ton profil et tes centres d'intérêt</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ressources Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Partage de ressources */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <FolderOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Partage de ressources</h3>
                  <p className="text-muted-foreground">Partage des ressources avec les membres de la sphère</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Téléchargement direct</strong> : Télécharge des ressources gratuites utiles et pertinentes partagées par les membres de la communauté</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Upload de ressources</strong> : Partage des ressources utiles avec les membres de la communauté</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Filtres intelligents</strong> : Par type de fichier et filières</p>
                </div>
              </div>
            </div>
            {/* Illustration Ressources */}
            <div className="relative">
              <div className="w-full h-80 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-pink-500/5 to-blue-500/5">
                  <img
                    src="/Illustrations/Upload-amico.svg"
                    alt="Ressources"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Messagerie Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            {/* Illustration Messagerie */}
            <div className="relative">
              <div className="w-full h-80 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-3xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-pink-500/5">
                  <img
                    src="/Illustrations/Messages-amico.svg"
                    alt="Messagerie"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            {/* Messagerie */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Messagerie</h3>
                  <p className="text-muted-foreground">Système de messagerie instantanée dans la plateforme</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Conversations privées</strong> : Communication directe avec tes amis et camarades de classe</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Conversations de groupe</strong> : Communication groupée avec tes amis et camarades de classe</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <p><strong>Sécurisé</strong> : Toutes les conversations sont chiffrées et sécurisées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fonctionnalités à venir */}
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-8">🚀 Fonctionnalités à venir</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="text-4xl mb-4">🎓</div>
                <h4 className="text-xl font-bold mb-2">Système de Badges</h4>
                <p className="text-muted-foreground">Gagne des récompenses pour tes contributions et ton engagement</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="text-4xl mb-4">🤖</div>
                <h4 className="text-xl font-bold mb-2">Assistant IA</h4>
                <p className="text-muted-foreground">Aide personnalisée pour tes études et projets</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 border-2 border-dashed border-primary/30">
                <div className="text-4xl mb-4">📱</div>
                <h4 className="text-xl font-bold mb-2">App Mobile</h4>
                <p className="text-muted-foreground">Accès complet depuis ton smartphone</p>
              </div>
                </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 to-primary/10">
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
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="campus-gradient bg-clip-text text-transparent">
              Prêt à transformer vos études ?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Rejoignez CampusSphere dès aujourd'hui et découvrez une nouvelle façon d'étudier,
            collaborer et réussir votre parcours universitaire.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button
              size="lg"
              className="campus-gradient text-white hover:opacity-90 text-lg px-10 py-6"
              onClick={() => navigate('/register')}
            >
              Créer mon compte gratuit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-10 py-6"
              onClick={() => navigate('/about')}
            >
              En savoir plus
            </Button>
          </div>

          <div className="flex justify-center items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Données sécurisées
            </span>
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Communauté active
            </span>
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Ressources gratuites
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}