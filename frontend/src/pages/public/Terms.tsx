import React from "react";
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
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass flex justify-center align-items-center h-96 rounded-3xl p-8 campus-glow">
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
              Dernière mise à jour : 05/04/2026
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
                  En utilisant CampusSphere, vous acceptez les présentes conditions d'utilisation.
                  Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Inscription et Compte
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>CampusSphere est destiné en priorité aux étudiants en établissement d'enseignement supérieur</li>
                  <li>Vous devez fournir des informations exactes et à jour</li>
                  <li>Vous êtes responsable de la confidentialité de votre compte</li>
                  <li>Vous devez nous informer immédiatement de toute utilisation non autorisée</li>
                  <li>Il est recommandé de n'utiliser qu'un seul compte par personne</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Utilisation de la Plateforme
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>Vous vous engagez à :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Utiliser la plateforme de manière légale et respectueuse</li>
                  <li>Respecter les droits de propriété intellectuelle</li>
                  <li>Ne pas publier de contenu offensant, diffamatoire ou illégal</li>
                  <li>Ne pas harceler ou menacer d'autres utilisateurs</li>
                  <li>Ne pas utiliser la plateforme à des fins commerciales sans autorisation</li>
                  <li>Ne pas tenter de contourner les mesures de sécurité</li>
                </ul>
                <p>
                  CampusSphere inclut également l’assistante IA Sphera. En utilisant cette fonctionnalité,
                  vous acceptez que les documents uploadés soient traités par l’IA pour générer des fiches,
                  quiz, flashcards et corrections d'annales.
                  Ces documents ne sont pas utilisés pour entraîner des modèles publics.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Contenu Utilisateur
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>Concernant le contenu que vous publiez :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Vous conservez la propriété de votre contenu</li>
                  <li>Vous accordez à CampusSphere une licence d'utilisation</li>
                  <li>Vous garantissez avoir les droits sur le contenu partagé</li>
                  <li>Nous pouvons supprimer du contenu inapproprié</li>
                  <li>Vous êtes responsable du contenu que vous partagez</li>
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
                  Pour toute question concernant ces conditions d'utilisation, contactez-nous :
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
