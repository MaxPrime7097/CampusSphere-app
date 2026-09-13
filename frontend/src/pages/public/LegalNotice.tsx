import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton } from "@/components/layout/PoliciesButton";

export function LegalNotice(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Mentions Légales | CampusSphere</title>
        <meta
          name="description"
          content="Consultez les mentions légales de la plateforme CampusSphere : éditeur, hébergement, infrastructure cloud et coordonnées officielles."
        />
        <link rel="canonical" href="https://campussphere.app/cs-inc/policies/legal-notice" />
        <meta property="og:title" content="Mentions Légales - CampusSphere" />
        <meta property="og:description" content="Informations juridiques, éditeur et hébergeurs de CampusSphere." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/policies/legal-notice" />
      </Helmet>

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
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-automata leading-tight">
                <span className="campus-gradient bg-clip-text text-transparent">
                  Mentions
                </span>
                <br />
                <span className="text-foreground">Légales</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Informations légales, identification de l'éditeur de la plateforme et détails de notre infrastructure cloud sécurisée.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <PoliciesButton />
                <Button
                  variant="secondary"
                  onClick={() => navigate('/cs-inc/contact')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Support
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block campus-animate-slide-up">
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass flex justify-center align-items-center h-96 rounded-3xl p-8 campus-glow">
                <img
                  src="/icons/legal-notice.png"
                  alt="CampusSphere mentions légales"
                  loading="lazy"
                  className="h-full w-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="legal-content" className="pt-10 pb-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="font-nunito font-semibold text-muted-foreground">
              Dernière mise à jour : 13/09/2026
            </p>
          </div>

          <div className="space-y-8">
            {/* 1. Éditeur de la plateforme */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  1. Éditeur de la Plateforme
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Le service numérique <strong>CampusSphere</strong> (accessible via le domaine <code>campussphere.app</code>) et son module d'intelligence artificielle académique <strong>Sphera</strong> (accessible via <code>sphera.campussphere.app</code>) sont édités par l'équipe fondatrice CampusSphere.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Nom du projet / Éditeur :</strong> CampusSphere Inc. (Équipe fondatrice & développement)</li>
                  <li><strong>Siège d'exploitation :</strong> Douala, Région du Littoral, République du Cameroun</li>
                  <li><strong>Partenariats, investisseurs & contact général :</strong> <a href="mailto:contact@campussphere.app" className="text-primary hover:underline">contact@campussphere.app</a></li>
                  <li><strong>Support technique & étudiants :</strong> <a href="mailto:support@campussphere.app" className="text-primary hover:underline">support@campussphere.app</a></li>
                  <li><strong>Affaires juridiques, données & politiques :</strong> <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">policies@campussphere.app</a></li>
                  <li><strong>Directeur de la publication :</strong> Le Responsable Éditorial & Technique CampusSphere</li>
                </ul>
              </div>
            </div>

            {/* 2. Hébergement & Infrastructure Cloud */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  2. Hébergement & Infrastructure Cloud
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Pour garantir une haute disponibilité, une rapidité optimale et une sécurité accrue de vos données étudiantes, l'architecture CampusSphere s'appuie sur des prestataires cloud de rang mondial :
                </p>
                <div className="space-y-4 ml-2">
                  <div className="p-4 rounded-xl border border-border bg-background/50">
                    <h4 className="text-foreground font-bold mb-1">Hébergement Frontend & Distribution (CDN)</h4>
                    <p className="text-sm">
                      <strong>Vercel Inc.</strong> — 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Réseau de diffusion de contenu sécurisé avec certificat SSL/TLS chiffré.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-background/50">
                    <h4 className="text-foreground font-bold mb-1">Hébergement Backend & APIs</h4>
                    <p className="text-sm">
                      <strong>Render Services, Inc.</strong> — 525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis. 
                      <em> Note d'évolution :</em> Une transition progressive des serveurs d'application vers l'infrastructure <strong>Microsoft Azure</strong> est activement menée pour répondre à la montée en charge.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-background/50">
                    <h4 className="text-foreground font-bold mb-1">Stockage Sécurisé des Fichiers & Documents Académiques</h4>
                    <p className="text-sm">
                      <strong>Amazon Web Services (AWS) - Amazon S3</strong> — Amazon Web Services, Inc., 410 Terry Avenue North, Seattle, WA 98109-5210, États-Unis. Stockage chiffré au repos (AES-256) des documents, cours et images d'utilisateurs.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-background/50">
                    <h4 className="text-foreground font-bold mb-1">Moteurs d'Intelligence Artificielle (Sphera)</h4>
                    <p className="text-sm">
                      <strong>Amazon Web Services (AWS Bedrock)</strong>, complété par les API sécurisées de <strong>Google AI (Gemini)</strong> et <strong>Groq Inc.</strong> Les données soumises aux modèles ne sont ni conservées pour l'entraînement public ni partagées à des tiers publicitaires.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Propriété intellectuelle */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  3. Propriété Intellectuelle
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  L'ensemble des éléments constituant la plateforme CampusSphere et le module Sphera (notamment les marques, logos, graphismes, logiciels, code source, interfaces et textes éditoriaux) sont protégés par la législation camerounaise (Loi n° 2000/011 sur le droit d'auteur), les conventions de l'Organisation Africaine de la Propriété Intellectuelle (OAPI - Accord de Bangui) et les conventions internationales de protection de la propriété intellectuelle.
                </p>
                <p>
                  Toute reproduction, représentation, diffusion ou exploitation totale ou partielle sans l'autorisation préalable écrite de CampusSphere est formellement interdite.
                </p>
              </div>
            </div>

            {/* 4. Contact & Notifications Légales */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  4. Contact & Notifications Légales
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Pour toute notification de contenu litigieux, réclamation relative à la propriété intellectuelle ou exercice de vos droits d'accès et de rectification :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email : <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">policies@campussphere.app</a> ou <a href="mailto:support@campussphere.app" className="text-primary hover:underline">support@campussphere.app</a></li>
                  <li>Localisation : Douala, République du Cameroun</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
