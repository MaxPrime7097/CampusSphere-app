import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Users, Heart, Zap, BookOpen, MessageCircle, Award, Globe, Star, Sparkles, Target, Eye, Users2, Trophy, ChevronDown, Bug, Linkedin, Github, Mail, ArrowRight, GraduationCap } from "lucide-react";

export function About(): JSX.Element {
  const navigate = useNavigate();
  const teamMembers = [
    {
      name: "Nlend Max",
      role: "CEO & Full-Stack Dev",
      description: "Étudiant et développeur, Max a conçu CampusSphere pour simplifier le quotidien universitaire. Il développe la plateforme et coordonne l'équipe.",
      avatar: "/Team/Nlend.jpg",
      initials: "NM",
      socials: {
        linkedin: "https://www.linkedin.com/in/max-prime-96b651239/",
        github: "https://github.com/MaxPrime7097",
        email: "mailto:contact@campussphere.app"
      }
    },
    {
      name: "Kana Tommi",
      role: "CMO & Graphic Designer",
      description: "Passionné de graphisme et de communication, Tommi a créé l'univers visuel de CampusSphere et anime la communauté étudiante.",
      avatar: "/Team/Tommi.jpg",
      initials: "KT",
      socials: {
        linkedin: "https://www.linkedin.com/",
        email: "mailto:contact@campussphere.app"
      }
    },
    {
      name: "Hussein Boris",
      role: "CTO & Full-Stack Dev",
      description: "Féru de code et d'architecture, Boris assure le bon fonctionnement technique de la plateforme pour qu'elle reste fluide et sécurisée.",
      avatar: "/Team/Boris.jpg",
      initials: "HB",
      socials: {
        github: "https://github.com/",
        email: "mailto:contact@campussphere.app"
      }
    },
    {
      name: "Nounga Nathan",
      role: "CPO & Head of Design",
      description: "Toujours à l'écoute des retours étudiants, Nathan façonne des interfaces claires et agréables pour rendre les révisions faciles.",
      avatar: "/Team/Nathan.jpg",
      initials: "NN",
      socials: {
        linkedin: "https://www.linkedin.com/",
        email: "mailto:contact@campussphere.app"
      }
    },
    {
      name: "Gwenaëlle Stelvana",
      role: "CFO & Community Manager",
      description: "Proche des étudiants sur les campus, Gwenaëlle gère les ressources du projet et veille à la convivialité au sein des sphères.",
      avatar: "/Team/Gwen.png",
      initials: "GS",
      socials: {
        linkedin: "https://www.linkedin.com/",
        email: "mailto:contact@campussphere.app"
      }
    }
  ];

  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "mainEntity": {
      "@type": "Organization",
      "name": "CampusSphere",
      "url": "https://campussphere.app",
      "logo": "https://campussphere.app/CS.svg",
      "description": "Le réseau social académique et collaboratif conçu pour les étudiants.",
      "founders": teamMembers.map((member) => ({
        "@type": "Person",
        "name": member.name,
        "jobTitle": member.role,
        "image": `https://campussphere.app${member.avatar}`,
        "description": member.description
      }))
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>À Propos - Notre Histoire & Vision | CampusSphere</title>
        <meta name="description" content="Découvrez l'histoire de CampusSphere, l'équipe fondatrice et notre mission : révolutionner la vie étudiante et l'entraide académique." />
        <link rel="canonical" href="https://campussphere.app/cs-inc/about" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="À Propos de CampusSphere - Notre Équipe et Vision" />
        <meta property="og:description" content="Découvrez les coulisses de CampusSphere, la plateforme qui connecte et dynamise les étudiants dans leur quotidien académique." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/about" />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="À Propos de CampusSphere - Notre Équipe et Vision" />
        <meta name="twitter:description" content="Découvrez les coulisses de CampusSphere, la plateforme qui connecte et dynamise les étudiants dans leur quotidien académique." />
        <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
        <script type="application/ld+json">
          {JSON.stringify(teamSchema)}
        </script>
      </Helmet>
      {/* Navigation: brand + links + CTA */}
      <Header />

      {/* Hero Section */}
      <section className="relative py-10 md:py-4 px-0 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 campus-gradient opacity-20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 campus-gradient opacity-20 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-9xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8 campus-animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                <span className="text-sm font-medium font-poppins">Notre histoire depuis 2025</span>
              </div>

              <h1 className="text-4xl font-automata md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="campus-gradient bg-clip-text text-transparent">
                  À Propos de
                </span>
                <br />
                <span className="text-foreground">CampusSphere</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                La plateforme qui révolutionne l'apprentissage collaboratif et connecte
                les étudiants dans une communauté d'entraide et d'excellence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => navigate('/register')}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Rejoindre la communauté
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/cs-inc/contact')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  En savoir plus
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block campus-animate-slide-up">
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 campus-glow">
                <img
                  src="/Illustrations/About us page-amico.svg"
                  alt="CampusSphere illustration"
                  loading="lazy"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Histoire */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-9xl">
          <div className="text-center mb-16">
            <h2 className="font-raleway text-3xl md:text-4xl font-bold mb-4 campus-animate-fade-in">
              <span className="text-foreground">Notre </span>
              <span className="campus-gradient bg-clip-text text-transparent">Histoire</span>
            </h2>
            <p className="text-xl text-muted-foreground font-nunito font-semibold">
              L'aventure qui a donné naissance à CampusSphere
            </p>
          </div>

          <div className="space-y-8"> 
            <div className="campus-animate-slide-up">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src="/icons/vision.png" alt="Vision" />
                </div>
                <div>
                  <h3 className="font-poppins font-semibold text-xl mb-3">La Vision Originelle (2025)</h3>
                  <p className="text-muted-foreground leading-relaxed font-nunito font-semibold">
                    CampusSphere est né en 2025 de la vision d'une communauté étudiante plus connectée et collaborative.
                    Fondée par des étudiants passionnés par l'innovation technologique et l'éducation, notre plateforme
                    est le fruit d'observations des défis auxquels font face les étudiants modernes.
                  </p>
                </div>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src="/icons/probleme.png" alt="Problème" />
                </div>
                <div>
                  <h3 className="font-poppins font-semibold text-xl mb-3">Le Problème Identifié</h3>
                  <p className="text-muted-foreground leading-relaxed font-nunito font-semibold">
                    Nous avons constaté que malgré la richesse du savoir disponible dans nos universités, il manquait
                    un espace numérique dédié au partage et à la collaboration entre étudiants. Les ressources restaient
                    souvent isolées et les opportunités d'entraide limitées par des contraintes géographiques.
                  </p>
                </div>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <img src="/icons/solution.png" alt="Solution" />
                </div>
                <div>
                  <h3 className="font-poppins font-semibold text-xl mb-3">La Solution CampusSphere</h3>
                  <p className="text-muted-foreground leading-relaxed font-nunito font-semibold">
                    C'est ainsi qu'est né CampusSphere : une plateforme qui brise ces barrières et crée un écosystème
                    numérique où chaque étudiant peut contribuer, partager et grandir ensemble. Une communauté
                    d'entraide et d'excellence académique.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Mission & Objectif */}
      <section className="py-10 px-0 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto max-w-9xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="campus-animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <img src="/icons/mission.png" alt="Mission" />
                </div>
                <h2 className="text-2xl font-semibold font-poppins">Notre Mission</h2>
              </div>
              <div className="space-y-4 text-muted-foreground font-nunito font-semibold">
                <p className="leading-relaxed">
                  <strong className="text-foreground">Notre mission est simple mais ambitieuse :</strong> démocratiser l'accès au savoir et créer
                  une communauté étudiante unie par la collaboration et l'entraide.
                </p>
                <p className="leading-relaxed">
                  Nous croyons que le partage de connaissances est la clé du succès académique et professionnel.
                  En connectant les étudiants, nous construisons un réseau d'intelligence collective bénéfique pour tous.
                </p>
                <p className="leading-relaxed">
                  CampusSphere n'est pas seulement une plateforme technologique, c'est un mouvement
                  qui transforme la façon dont les étudiants apprennent, partagent et grandissent.
                </p>
              </div>
            </div>

            {/* Objectif */}
            <div className="campus-animate-slide-up">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                  <img src="/icons/objectif.png" alt="Objectif" />
                </div>
                <h2 className="text-2xl font-semibold font-poppins">Notre Objectif</h2>
              </div>
              <div className="space-y-4 text-muted-foreground font-nunito font-semibold">
                <p className="leading-relaxed">
                  <strong className="text-foreground">Notre objectif pour l'avenir est ambitieux :</strong> faire de CampusSphere la référence
                  de l'éducation collaborative en Afrique francophone, avec des outils avancés et des partenariats
                  stratégiques pour l'insertion professionnelle.
                </p>
                <p className="leading-relaxed">
                  Nous imaginons un écosystème où chaque étudiant peut accéder aux meilleures ressources,
                  collaborer avec des pairs passionnés et développer les compétences nécessaires pour réussir
                  dans leur carrière future.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-9xl">
          <div className="text-center mb-16">
            <h2 className="font-raleway text-3xl md:text-4xl font-bold mb-4 campus-animate-fade-in">
              <span className="text-foreground">Nos </span>
              <span className="campus-gradient bg-clip-text text-transparent">Valeurs</span>
            </h2>
            <p className="text-xl text-muted-foreground font-nunito font-semibold">
              Les principes qui guident notre action
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="campus-card p-6 group hover:scale-105 transition-all duration-300 campus-animate-slide-up">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                  <img src="/icons/collaboration.png" alt="Collaboration" />
                </div>
                <h3 className="font-poppins font-semibold text-lg">Collaboration</h3>
              </div>
              <p className="text-muted-foreground font-nunito font-semibold">Nous croyons en la force du travail d'équipe et de l'entraide mutuelle.</p>
            </div>

            <div className="campus-card p-6 group hover:scale-105 transition-all duration-300 campus-animate-slide-up animation-delay-1s">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                  <img src="/icons/qualite.png" alt="Quality" />
                </div>
                <h3 className="font-poppins font-semibold text-lg">Qualité</h3>
              </div>
              <p className="text-muted-foreground font-nunito font-semibold">Nous maintenons des standards élevés pour toutes nos ressources partagées.</p>
            </div>

            <div className="campus-card p-6 group hover:scale-105 transition-all duration-300 campus-animate-slide-up animation-delay-2s">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                  <img src="/icons/inclusion.png" alt="Inclusion" />
                </div>
                <h3 className="font-poppins font-semibold text-lg">Inclusion</h3>
              </div>
              <p className="text-muted-foreground font-nunito font-semibold">Ouvert à tous les étudiants, peu importe leur filière ou niveau d'études.</p>
            </div>

            <div className="campus-card p-6 group hover:scale-105 transition-all duration-300 campus-animate-slide-up animation-delay-3s">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                  <img src="/icons/innovation.png" alt="Innovation" />
                </div>
                <h3 className="font-poppins font-semibold text-lg">Innovation</h3>
              </div>
              <p className="text-muted-foreground font-nunito font-semibold">Nous repoussons constamment les limites pour améliorer l'expérience utilisateur.</p>
            </div>

            <div className="campus-card p-6 group hover:scale-105 transition-all duration-300 campus-animate-slide-up animation-delay-4s">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                  <img src="/icons/le-respect.png" alt="Respect" />
                </div>
                <h3 className="font-poppins font-semibold text-lg">Respect</h3>
              </div>
              <p className="text-muted-foreground font-nunito font-semibold">Nous cultivons un environnement respectueux où chaque voix compte et est écoutée.</p>
            </div>

            <div className="campus-card p-6 group hover:scale-105 transition-all duration-300 campus-animate-slide-up animation-delay-5s">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:animate-pulse-glow">
                  <img src="/icons/excellence.png" alt="Excellence" />
                </div>
                <h3 className="font-poppins font-semibold text-lg">Excellence</h3>
              </div>
              <p className="text-muted-foreground font-nunito font-semibold">Nous visons l'excellence dans tout ce que nous entreprenons et proposons.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Notre Équipe */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-9xl">
          <div className="text-center mb-16">
            <h2 className="font-raleway text-3xl md:text-4xl font-bold mb-4 campus-animate-fade-in">
              <span className="text-foreground">Notre </span>
              <span className="campus-gradient bg-clip-text text-transparent">Équipe</span>
            </h2>
            <p className="text-xl text-muted-foreground font-nunito font-semibold">
              Les passionnés derrière CampusSphere
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="group bg-card border border-border/80 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5 overflow-hidden"
              >
                {/* Full-width photo */}
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-muted">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center text-3xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
                    {member.initials}
                  </div>
                  {/* Subtle bottom shadow overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>

                {/* Details (Name, Role, Socials) */}
                <div className="p-5 flex flex-col items-center text-center">
                  <h3 className="font-bold text-lg text-foreground font-poppins mb-1">
                    {member.name}
                  </h3>
                  <span className="text-xs font-semibold text-primary font-poppins mb-4 tracking-wide">
                    {member.role}
                  </span>

                  {/* Social links row */}
                  <div className="flex items-center justify-center gap-2">
                    {'linkedin' in member.socials && member.socials.linkedin && (
                      <a
                        href={member.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`LinkedIn de ${member.name}`}
                        className="w-9 h-9 rounded-xl bg-secondary/80 hover:bg-primary/15 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.github && (
                      <a
                        href={member.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`GitHub de ${member.name}`}
                        className="w-9 h-9 rounded-xl bg-secondary/80 hover:bg-primary/15 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {member.socials.email && (
                      <a
                        href={member.socials.email}
                        aria-label={`Envoyer un email à ${member.name}`}
                        className="w-9 h-9 rounded-xl bg-secondary/80 hover:bg-primary/15 hover:text-primary flex items-center justify-center transition-all text-muted-foreground"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Programme Campus Ambassadeurs */}
          <div className="mt-14 p-8 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-primary/5 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-semibold text-primary">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Programme Campus Ambassadeurs</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold font-poppins text-foreground">
                Envie de représenter CampusSphere dans votre université ?
              </h3>
              <p className="text-sm md:text-base text-muted-foreground font-nunito max-w-2xl">
                Rejoignez notre réseau d'étudiants ambassadeurs, animez les sphères de votre établissement, partagez vos retours et contribuez directement à l'expansion de la communauté.
              </p>
            </div>
            <Button
              onClick={() => navigate('/cs-inc/contact')}
              className="campus-gradient text-white font-poppins px-6 py-6 rounded-xl hover:scale-105 transition-all duration-300 shadow-md whitespace-nowrap"
            >
              Devenir Ambassadeur
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Rejoignez-nous CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="campus-animate-fade-in">
            <h2 className="font-raleway text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground">Rejoignez </span>
              <span className="campus-gradient bg-clip-text text-transparent">l'Aventure</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 font-nunito font-semibold">
              CampusSphere est plus qu'une plateforme, c'est un mouvement. Rejoignez des milliers d'étudiants
              qui transforment leur expérience universitaire.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => navigate('/register')}
                className="campus-gradient text-white hover:opacity-90 text-lg px-8 py-8 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Rejoindre la communauté
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/cs-inc/contact')}
                className="border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
              >
                Nous Contacter
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default About;

