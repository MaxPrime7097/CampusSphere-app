import React from "react";
import { useNavigate } from "react-router-dom";
import { BookLock, Lock, Eye, Database, UserCheck, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton }  from "@/components/layout/PoliciesButton"

export function Privacy(): JSX.Element {
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
                  Politique de
                </span>
                <br />
                <span className="text-foreground">Confidentialité</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée.
                Votre confiance est notre priorité absolue.
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
                  src="/icons/politique-de-confidentialite.png"
                  alt="CampusSphere illustration"
                  loading="lazy"
                  className="h-full w-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Content Section */}
      <section id="privacy-content" className="pt-10 pb-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="font-nunito font-semibold text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Collecte des Données
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>
                  CampusSphere collecte les informations suivantes :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Informations personnelles (nom, prénom, email universitaire)</li>
                  <li>Informations académiques (université, filière, niveau d'études)</li>
                  <li>Données d'utilisation de la plateforme</li>
                  <li>Contenu partagé (posts, commentaires, ressources)</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Utilisation des Données
                </CardTitle>
              </div>
              <div className=" font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>Vos données sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fournir et améliorer nos services</li>
                  <li>Personnaliser votre expérience</li>
                  <li>Communiquer avec vous sur la plateforme</li>
                  <li>Assurer la sécurité de la communauté</li>
                  <li>Analyser l'utilisation de la plateforme</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Partage des Données
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>
                  Nous ne vendons jamais vos données personnelles. Vos informations peuvent être partagées :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Avec votre consentement explicite</li>
                  <li>Avec votre université (pour vérification académique)</li>
                  <li>Pour respecter nos obligations légales</li>
                  <li>En cas de fusion ou acquisition (avec notification préalable)</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Vos Droits
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>Vous avez le droit de :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Accéder à vos données personnelles</li>
                  <li>Corriger des informations inexactes</li>
                  <li>Demander la suppression de vos données</li>
                  <li>Exporter vos données</li>
                  <li>Vous opposer au traitement de vos données</li>
                  <li>Retirer votre consentement à tout moment</li>
                </ul>
                <p className="mt-4">
                  Pour exercer ces droits, contactez-nous à{" "}
                  <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">
                    policies@campussphere.app
                  </a>
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Sécurité
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground mt-4">
                <p>
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles
                  appropriées pour protéger vos données contre tout accès, modification, divulgation
                  ou destruction non autorisés.
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
                  Pour toute question concernant cette politique de confidentialité, contactez-nous :
                </p>
                <ul className="mt-4 space-y-2">
                  <li><p className="mt-4">
                  Pour exercer ces droits, contactez-nous à{" "}
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
