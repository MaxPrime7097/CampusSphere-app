import React from "react";
import { useNavigate } from "react-router-dom";
import { Cookie, AlertCircle, CheckCircle, XCircle, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown, User, BookLock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton }  from "@/components/layout/PoliciesButton"

export function CookiePolicy(): JSX.Element {
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
                 Politique 
                </span>
                <br />
                <span className="text-foreground">de Cookies</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Découvrez comment nous utilisons les cookies pour améliorer votre expérience sur CampusSphere.
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
                  src="/icons/cookies.png"
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
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Qu'est-ce qu'un cookie ?
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite sur CampusSphere. 
                Il nous permet de reconnaître votre navigateur et de personnaliser votre expérience.
                </p>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Types de cookies utilisés
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cookies essentiels</h3>
                  <p>Nécessaires au fonctionnement de la plateforme (authentification, sécurité)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cookies de performance</h3>
                  <p>Nous aident à comprendre comment vous utilisez CampusSphere</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cookies de personnalisation</h3>
                  <p>Mémorisent vos préférences (langue, thème, notifications)</p>
                </div>
              </div>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Gestion des cookies
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
              <p>
                Vous pouvez contrôler et gérer les cookies dans les paramètres de votre navigateur. 
                Notez que bloquer certains cookies peut affecter le fonctionnement de CampusSphere.
              </p>
              <p className="mt-4">
                Pour gérer vos préférences de cookies sur CampusSphere, rendez-vous dans{" "}
                <a href="/settings" className="text-primary hover:underline">
                  Paramètres → Confidentialité
                </a>
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
                  Pour toute question concernant notre utilisation des cookies, contactez-nous :
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