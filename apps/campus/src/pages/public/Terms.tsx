import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ScrollText, AlertCircle, CheckCircle, XCircle, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown, User, BookLock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton }  from "@/components/layout/PoliciesButton"

export function Terms(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Conditions Générales d'Utilisation (CGU) | CampusSphere</title>
        <meta name="description" content="Conditions Générales d'Utilisation de CampusSphere régissant l'accès à la plateforme, les droits et devoirs des étudiants et des sphères." />
        <link rel="canonical" href="https://campussphere.app/cs-inc/policies/terms" />
        <meta property="og:title" content="Conditions Générales d'Utilisation - CampusSphere" />
        <meta property="og:description" content="Prenez connaissance des conditions d'utilisation et des règles d'engagement sur le réseau CampusSphere." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/policies/terms" />
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

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-automata leading-tight">
                <span className="campus-gradient bg-clip-text text-transparent">
                  Conditions d'
                </span>
                <br />
                <span className="text-foreground">Utilisation</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Découvrez les règles qui régissent l'utilisation de CampusSphere.
                Ensemble, nous maintenons une communauté respectueuse et productive.
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
              <div className="absolute inset-0 campus-gradient opacity-15 blur-3xl"></div>
              <div className="relative campus-glass flex justify-center align-items-center h-96 rounded-3xl p-8 shadow-sm">
              <img
                  src="/icons/termes.png"
                  alt="CampusSphere illustration"
                  loading="lazy"
                  className="w-auto h-full rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content Section */}
      <section id="terms-content" className="pt-10 pb-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="font-nunito font-semibold text-muted-foreground">
              Dernière mise à jour : 13/09/2026
            </p>
          </div>

          <div className="space-y-8">
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Acceptation des Conditions
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  En créant un compte ou en naviguant sur CampusSphere (et son module d'assistance IA Sphera), vous acceptez sans réserve les présentes Conditions Générales d'Utilisation.
                  Si vous n'adhérez pas à ces conditions, vous devez cesser toute utilisation de la plateforme.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Inscription, Âge Minimum & Compte
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Âge minimum requis :</strong> L'accès à CampusSphere est strictement réservé aux personnes âgées d'au moins <strong>16 ans révolus</strong>. Si vous avez entre 16 et 18 ans, vous déclarez disposer de l'autorisation préalable de vos parents ou tuteurs légaux.</li>
                  <li>CampusSphere est destiné en priorité aux étudiants inscrits en enseignement supérieur ou secondaire avancé.</li>
                  <li>Vous devez fournir une identité sincère et des informations exactes lors de votre inscription.</li>
                  <li>Vous êtes seul responsable du maintien de la confidentialité de vos identifiants d'accès.</li>
                  <li>Vous devez nous signaler sans délai toute connexion suspecte ou faille de sécurité constatée.</li>
                  <li>La création de comptes multiples automatisés (bots, faux profils) est formellement interdite.</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Utilisation de la Plateforme & Assistant IA Sphera
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>Vous vous engagez à :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Utiliser la plateforme de manière légale, bienveillante et conforme aux lois camerounaises et internationales</li>
                  <li>Respecter scrupuleusement la propriété intellectuelle des auteurs, enseignants et tiers</li>
                  <li>Ne pas publier de contenu injurieux, diffamatoire, violent ou illicite</li>
                  <li>Ne pas utiliser les services pour frauder lors d'épreuves officielles d'examen</li>
                  <li>Ne pas tenter d'altérer ou d'extraire frauduleusement les données des serveurs</li>
                </ul>
                <p>
                  CampusSphere intègre également l'assistante IA Sphera (alimentée par AWS Bedrock, Google AI et Groq). 
                  Les documents soumis sont traités exclusivement pour générer vos fiches, flashcards et quiz, et <strong>ne sont en aucun cas utilisés pour entraîner des modèles publics</strong>.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Contenu Utilisateur & Licence Technique d'Hébergement
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>Concernant les documents, résumés et publications que vous partagez :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Propriété préservée :</strong> Vous conservez l'entière propriété intellectuelle de vos contenus et documents originaux.</li>
                  <li><strong>Licence technique :</strong> Pour nous permettre d'opérer le service, vous concédez à CampusSphere une licence mondiale, gratuite et non-exclusive pour héberger, stocker sur nos serveurs sécurisés (Amazon Web Services S3), répliquer techniquement, indexer et afficher vos contenus dans le cadre exclusif du fonctionnement de la communauté et de l'assistant Sphera.</li>
                  <li><strong>Garantie de légalité :</strong> Vous certifiez détenir les droits ou autorisations nécessaires sur les supports que vous téléversez.</li>
                  <li>CampusSphere se réserve le droit de modérer ou supprimer sans préavis tout contenu contrevenant aux lois ou aux règles communautaires.</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Services Payants, Abonnements & Paiements Mobile Money
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  L'accès à certaines options avancées (crédits IA étendus de Sphera, Pass Examen, packs premium) peut faire l'objet d'une tarification en Francs CFA (XAF).
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Les paiements s'opèrent par <strong>Mobile Money (MTN MoMo, Orange Money)</strong> via des passerelles agréées chiffrées.</li>
                  <li>Les conditions de commande, d'exécution immédiate du service numérique et de résiliation sont définies dans nos <a href="/cs-inc/policies/terms-of-sale" className="text-primary hover:underline">Conditions Générales de Vente (CGV)</a>.</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Interdictions
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>Les comportements suivants sont strictement interdits :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Spam ou publicité non autorisée</li>
                  <li>Harcèlement, intimidation ou discrimination</li>
                  <li>Partage de contenu violent ou explicite</li>
                  <li>Usurpation d'identité</li>
                  <li>Collecte non autorisée de données d'utilisateurs</li>
                  <li>Utilisation de bots ou d'automatisation</li>
                  <li>Violation des droits d'auteur</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Propriété Intellectuelle
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  CampusSphere et son contenu original sont protégés par des droits d'auteur,
                  marques déposées et autres lois sur la propriété intellectuelle. Vous ne pouvez
                  pas copier, modifier ou distribuer notre contenu sans autorisation.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Limitation de Responsabilité
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  CampusSphere est fourni "tel quel". Nous ne garantissons pas que le service sera
                  ininterrompu ou sans erreur. Nous ne sommes pas responsables des dommages résultant
                  de l'utilisation de la plateforme.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Résiliation
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de
                  violation de ces conditions. Vous pouvez également supprimer votre compte à tout moment.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Modifications
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Nous nous réservons le droit de modifier ces conditions à tout moment.
                  Les modifications importantes vous seront notifiées par email ou sur la plateforme.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
                <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Contact
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground mt-4">
                <p>
                  Pour toute question relative aux présentes conditions générales d'utilisation, contactez :
                </p>
                <ul className="mt-4 space-y-2">
                  <li><p className="mt-4">
                  {" "}
                  <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">
                    policies@campussphere.app
                  </a>{" "}
                  ou{" "}
                  <a href="mailto:support@campussphere.app" className="text-primary hover:underline">
                    support@campussphere.app
                  </a>
                </p></li>
                  <li>Adresse : Douala, Cameroun</li>
                </ul>
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
