import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton } from "@/components/layout/PoliciesButton";

interface PolicyItem {
  title: string;
  slug: string;
  description: string;
}

export function Policies(): JSX.Element {
  const navigate = useNavigate();

  const policyList: PolicyItem[] = [
    {
      title: "Politique de Confidentialité",
      slug: "/cs-inc/policies/privacy",
      description: "Collecte, traitement et sécurisation de vos données personnelles, respect du RGPD et protection de votre vie privée.",
    },
    {
      title: "Conditions Générales d'Utilisation (CGU)",
      slug: "/cs-inc/policies/terms",
      description: "Règles régissant l'accès à la plateforme, âge minimum requis de 16 ans et responsabilités des membres au sein du réseau.",
    },
    {
      title: "Conditions Générales de Vente (CGV)",
      slug: "/cs-inc/policies/terms-of-sale",
      description: "Modalités de souscription aux services et crédits Sphera IA, paiements Mobile Money via Campay et conditions de rétractation.",
    },
    {
      title: "Mentions Légales",
      slug: "/cs-inc/policies/legal-notice",
      description: "Informations juridiques sur l'éditeur CampusSphere, nos hébergeurs cloud et nos partenaires d'infrastructure.",
    },
    {
      title: "Suppression de Compte & des Données",
      slug: "/cs-inc/policies/datadeletion",
      description: "Procédure pas-à-pas pour demander l'effacement complet, définitif et irréversible de votre compte et de vos données associées.",
    },
    {
      title: "Règles de la Communauté",
      slug: "/cs-inc/policies/community-guidelines",
      description: "Principes de respect mutuel, d'entraide et règles de modération appliquées au sein des Sphères étudiantes.",
    },
    {
      title: "Politique de Cookies & Traceurs",
      slug: "/cs-inc/policies/cookiepolicy",
      description: "Utilisation exclusive de cookies strictement fonctionnels nécessaires à la navigation, sans profilage publicitaire.",
    },
    {
      title: "Politique de Droits d'Auteur",
      slug: "/cs-inc/policies/copyright",
      description: "Protection de la propriété intellectuelle des cours partagés, droits des auteurs et procédure de signalement DMCA.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Politiques & Conformité Juridique | CampusSphere</title>
        <meta name="description" content="Consultez l'ensemble des politiques, mentions légales, CGU, CGV et règles d'utilisation de la plateforme CampusSphere." />
        <link rel="canonical" href="https://campussphere.app/cs-inc/policies" />
        <meta property="og:title" content="Politiques & Mentions Légales - CampusSphere" />
        <meta property="og:description" content="Toutes les informations sur la confidentialité, les conditions d'utilisation et les règles communautaires de CampusSphere." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/policies" />
      </Helmet>

      {/* Navigation: brand + links + CTA */}
      <Header />

      {/* Hero Section */}
      <section className="relative py-10 md:py-4 px-0 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 campus-gradient opacity-20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 campus-gradient opacity-20 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-9xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8 campus-animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                <span className="font-poppins text-sm font-medium">Cadre légal et conformité</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-automata leading-tight">
                <span className="campus-gradient bg-clip-text text-transparent">
                  Politiques de 
                </span>
                <br />
                <span className="text-foreground">CampusSphere</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Découvrez les politiques de CampusSphere qui régissent l'utilisation de la plateforme et la protection de vos données personnelles.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <PoliciesButton />
                <Button
                  variant="secondary"
                  onClick={() => navigate('/cs-inc/contact')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Nous contacter
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block campus-animate-slide-up">
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 campus-glow">
                <img
                  src="/Illustrations/Policies-amico.svg"
                  alt="CampusSphere illustration"
                  loading="lazy"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policies List Section */}
      <section id="privacy-content" className="py-12 md:py-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-9xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Linear List of Policies */}
          <div className="space-y-4">
            {policyList.map((policy) => (
              <div
                key={policy.slug}
                onClick={() => navigate(policy.slug)}
                className="campus-card group p-5 sm:p-6 rounded-2xl border border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-md cursor-pointer flex items-center justify-between gap-4 sm:gap-6"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h2 className="font-raleway text-lg sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {policy.title}
                  </h2>
                  <p className="font-nunito font-semibold text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {policy.description}
                  </p>
                </div>
                <div className="flex items-center text-primary font-poppins font-semibold text-sm gap-1.5 shrink-0 group-hover:translate-x-1 transition-transform">
                  <span className="hidden sm:inline">Consulter</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>

          {/* Piliers & Engagements Fondamentaux (sans emojis, avec icônes Lucide) */}
          <div className="pt-4">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="font-raleway text-2xl sm:text-3xl font-bold mb-3">
                Nos Piliers & <span className="campus-gradient bg-clip-text text-transparent">Engagements</span>
              </h2>
              <p className="font-nunito font-semibold text-muted-foreground text-sm sm:text-base">
                Les principes fondamentaux qui garantissent la protection et l'intégrité de vos données sur CampusSphere et Sphera.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="campus-card p-6 sm:p-8 rounded-2xl border border-border/60 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-raleway font-bold text-lg text-foreground">Chiffrement & Sécurité</h3>
                <p className="font-nunito font-semibold text-sm text-muted-foreground leading-relaxed">
                  Communications chiffrées en transit via TLS 1.3 et stockage sécurisé AES-256 sur nos infrastructures cloud et AWS S3.
                </p>
              </div>

              <div className="campus-card p-6 sm:p-8 rounded-2xl border border-border/60 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-raleway font-bold text-lg text-foreground">Zéro Revente Publicitaire</h3>
                <p className="font-nunito font-semibold text-sm text-muted-foreground leading-relaxed">
                  Vos données académiques et personnelles ne sont jamais revendues, louées ni cédées à des régies publicitaires.
                </p>
              </div>

              <div className="campus-card p-6 sm:p-8 rounded-2xl border border-border/60 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-raleway font-bold text-lg text-foreground">IA Éthique & Confidentielle</h3>
                <p className="font-nunito font-semibold text-sm text-muted-foreground leading-relaxed">
                  Vos cours analysés sur Sphera restent strictement votre propriété et ne servent à aucun entraînement de modèle public.
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA Section */}
          <div className="text-center">
            <div className="campus-card p-6 sm:p-10 md:p-12 rounded-3xl border border-border/60 campus-animate-fade-in">
              <h2 className="font-raleway text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                Une question sur nos <span className="campus-gradient bg-clip-text text-transparent">politiques ?</span>
              </h2>
              <p className="font-nunito font-semibold text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Pour toute question concernant nos politiques ou pour exercer vos droits, notre équipe est à votre disposition.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate('/cs-inc/contact')}
                  className="font-poppins campus-gradient text-white hover:opacity-90 text-base sm:text-lg px-8 py-6 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Contactez-nous
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.href = "mailto:policies@campussphere.app"}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-base sm:text-lg px-8 py-6 rounded-lg transition-all duration-300"
                >
                  policies@campussphere.app
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
