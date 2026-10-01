import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Scroll as ScrollText, WarningCircle as AlertCircle, CheckCircle, XCircle, Shield, Heart, FacebookLogo as Facebook, TwitterLogo as Twitter, LinkedinLogo as Linkedin, InstagramLogo as Instagram, YoutubeLogo as Youtube, CaretDown as ChevronDown, User, LockKey as BookLock, Envelope as Mail } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton }  from "@/components/layout/PoliciesButton"

export function Copyright(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Propriété Intellectuelle & Droits d'Auteur | CampusSphere</title>
        <meta name="description" content="Consultez la politique de respect du droit d'auteur, de la propriété intellectuelle et les procédures de signalement DMCA sur CampusSphere." />
        <link rel="canonical" href="https://campussphere.app/cs-inc/policies/copyright" />
        <meta property="og:title" content="Droits d'Auteur & Propriété Intellectuelle - CampusSphere" />
        <meta property="og:description" content="Protection des auteurs, respect des droits intellectuels et signalement de contenus sur CampusSphere." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/policies/copyright" />
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
                  Politique de 
                </span>
                <br />
                <span className="text-foreground">Droits d'Auteur</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Découvrez comment nous protégeons vos droits d'auteur et respectons les droits de propriété intellectuelle.
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
                  src="/icons/droits-dauteur.png"
                  alt="CampusSphere illustration"
                  loading="lazy"
                  className="h-full w-auto rounded-2xl"
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
              Dernière mise à jour : 05/04/2026
            </p>
          </div>

          <div className="space-y-8">
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Respect de la Propriété Intellectuelle
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                CampusSphere respecte les droits de propriété intellectuelle d'autrui et attend de ses utilisateurs 
                qu'ils fassent de même. Nous répondons aux notifications de violation présumée de droits d'auteur 
                conformément au droit camerounais applicable, notamment la loi n°2010/012 relative à la cybersécurité 
                et à la cybercriminalité, ainsi qu'aux règles de l'OAPI (Organisation Africaine de la Propriété Intellectuelle).
              </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Signaler une Violation
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                Si vous pensez que votre œuvre protégée par des droits d'auteur a été copiée d'une manière 
                constituant une violation, veuillez fournir les informations suivantes :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Signature électronique ou physique du titulaire des droits</li>
                <li>Description de l'œuvre protégée prétendument violée</li>
                <li>URL ou localisation du contenu litigieux sur CampusSphere</li>
                <li>Vos coordonnées (nom, adresse, téléphone, email)</li>
                <li>Déclaration de bonne foi attestant que l'utilisation n'est pas autorisée</li>
                <li>Déclaration sous peine de parjure que les informations sont exactes</li>
              </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Procédure de Notification
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                Envoyez votre notification de violation à notre équipe à l'adresse suivante :
              </p>
              <ul className="mt-4 space-y-2">
                <li><p className="mt-4">
                {" "}
                <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">
                  policies@campussphere.app
                </a>
              </p></li>
                <li>Adresse: Douala, Cameroun</li>
              </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Contre-notification
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                Si vous estimez que votre contenu a été supprimé par erreur, vous pouvez soumettre une contre-notification 
                contenant :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Votre signature électronique ou physique</li>
                <li>Identification du contenu supprimé et son emplacement avant suppression</li>
                <li>Déclaration sous peine de parjure que vous pensez que le contenu a été supprimé par erreur</li>
                <li>Vos nom, adresse et coordonnées complètes</li>
              </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Récidive
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                Conformément au droit applicable, CampusSphere a adopté une politique de résiliation, 
                dans des circonstances appropriées, des comptes d'utilisateurs considérés comme contrevenants récidivistes.
              </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Contenu Généré par les Utilisateurs
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                En publiant du contenu sur CampusSphere, vous :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Conservez tous vos droits de propriété sur votre contenu</li>
                <li>Accordez à CampusSphere une licence mondiale pour héberger, afficher et distribuer votre contenu</li>
                <li>Garantissez avoir les droits nécessaires sur le contenu partagé</li>
                <li>Acceptez que CampusSphere puisse supprimer du contenu violant des droits d'auteur</li>
              </ul>
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
                  Pour toute question concernant notre politique de droits d'auteur, contactez-nous :
                </p>
                <ul className="mt-4 space-y-2">
                  <li><p className="mt-4">
                  {" "}
                  <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">
                    policies@campussphere.app
                  </a>
                </p></li>
                  <li>Adresse: Douala, Cameroun</li>
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