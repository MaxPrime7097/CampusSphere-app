import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertCircle, CheckCircle, XCircle, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown, User, BookLock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton }  from "@/components/layout/PoliciesButton"

export function CommunityGuidelines(): JSX.Element {
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
                  Règles de 
                </span>
                <br />
                <span className="text-foreground">la Communauté</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
               Découvrez les règles qui régissent la communauté de CampusSphere.
               Respectez ces règles pour maintenir une communauté respectueuse et productive.
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
                  src="/icons/regles-communaute.png"
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
                  Respect et Bienveillance
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
               <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Traitez tous les membres avec respect et courtoisie</li>
                <li>Valorisez la diversité des opinions et des parcours</li>
                <li>Encouragez et soutenez vos pairs dans leurs projets</li>
                <li>Partagez vos connaissances de manière constructive</li>
               </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Sécurité et Protection
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ne partagez pas d'informations personnelles sensibles</li>
                <li>Signalez tout comportement inapproprié ou suspect</li>
                <li>Protégez votre vie privée et celle des autres</li>
                <li>N'utilisez pas la plateforme pour du harcèlement</li>
              </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Contenu Approprié                
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>Les contenus suivants sont strictement interdits :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contenu violent, haineux ou discriminatoire</li>
                <li>Nudité ou contenu sexuellement explicite</li>
                <li>Fausses informations ou désinformation délibérée</li>
                <li>Spam, arnaque ou contenu commercial non autorisé</li>
                <li>Violation de droits d'auteur ou propriété intellectuelle</li>
              </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                 Collaboration et Partage
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Partagez des ressources académiques de qualité</li>
                <li>Citez toujours vos sources</li>
                <li>Contribuez activement aux Sphères Collaboratives</li>
                <li>Respectez le travail intellectuel de chacun</li>
              </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Conséquences en cas de non-respect
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>Les violations de ces règles peuvent entraîner :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Un avertissement de la part de notre équipe</li>
                <li>Suppression de contenu inapproprié</li>
                <li>Suspension temporaire du compte</li>
                <li>Bannissement définitif dans les cas graves</li>
              </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                 Signaler un problème
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                Si vous constatez une violation de ces règles, signalez-la immédiatement :
              </p>
              <ul className="list-disc list-inside ml-4 mt-4 space-y-2">
                <li>Via le bouton "Signaler" sur chaque publication</li>
                <li>
                <a href="mailto:support@campussphere.app" className="text-primary hover:underline">
                    support@campussphere.app
                </a>
                </li>
                <li>Formulaire de contact sur notre site</li>
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
                  Pour toute question concernant les règles de la communauté, contactez-nous :
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