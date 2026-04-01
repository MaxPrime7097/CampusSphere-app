import React from "react";
import { useNavigate } from "react-router-dom";
import { BookLock, Lock, Eye, Database, UserCheck, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton }  from "@/components/layout/PoliciesButton"

export function Policies(): JSX.Element {
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
                  Support
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

      {/* Privacy Content Section */}
      <section id="privacy-content" className="pt-10 pb-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-5xl">
          
          

          <div className="space-y-8">
          <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/cs-inc/policies/privacy')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Politique de Confidentialité
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/cs-inc/policies/terms')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Conditions d'Utilisation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/cs-inc/policies/cookie-policy')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Politique de Cookies
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/cs-inc/policies/copyright')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Politique de Droits d'auteur
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/cs-inc/policies/community-guidelines')}
                  className="font-poppins border border-border text-foreground hover:bg-accent text-lg px-8 py-8 rounded-lg transition-all duration-300"
                >
                  Règles de la Communauté
                </Button>
              </div>

              <section className="py-20 px-4">
                <div className="container mx-auto max-w-4xl text-center">
                  <div className="campus-card p-8 campus-animate-fade-in">
                    <h2 className="font-raleway text-3xl font-bold mb-4">Nos <span className="campus-gradient bg-clip-text text-transparent">Politiques</span></h2>
                      <p>
                        Pour toute question concernant nos politiques ou pour exercer vos droits, contactez-nous à:
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
              </section>

            <div className="campus-animate-slide-up bg-input border border-border rounded-lg p-4">
                <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Contact
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground mt-4">
                <p>
                  
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
