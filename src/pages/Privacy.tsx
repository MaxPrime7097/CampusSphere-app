import React from "react";
import { useNavigate } from "react-router-dom";
import { BookLock, Lock, Eye, Database, UserCheck, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function Privacy(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      {/* Navigation: brand + links + CTA */}
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 campus-gradient opacity-20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 campus-gradient opacity-20 blur-3xl rounded-full"></div>
        </div>

        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left space-y-8 campus-animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Vos données sont protégées</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'Automata Display' }}>
                <span className="campus-gradient bg-clip-text text-transparent">
                  Politique de
                </span>
                <br />
                <span className="text-foreground">Confidentialité</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Découvrez comment nous protégeons vos données personnelles et respectons votre vie privée.
                Votre confiance est notre priorité absolue.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => document.getElementById('privacy-content')?.scrollIntoView({ behavior: 'smooth' })}
                  className="campus-gradient text-white hover:opacity-90 text-lg px-8 py-6 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  En savoir plus
                </button>
                <button
                  onClick={() => navigate('/cs-inc/contact')}
                  className="border border-border text-foreground hover:bg-accent text-lg px-8 py-6 rounded-lg transition-all duration-300"
                >
                  Nous contacter
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block campus-animate-slide-up">
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 campus-glow">
                <img
                  src="/Illustrations/Privacy policy-amico.svg"
                  alt="Politique de Confidentialité CampusSphere"
                  loading="lazy"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Content Section */}
      <section id="privacy-content" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="space-y-8">
            <Card className="campus-card campus-animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 campus-gradient rounded-lg flex items-center justify-center">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  Collecte des Données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  CampusSphere collecte les informations suivantes :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Informations personnelles (nom, prénom, email universitaire)</li>
                  <li>Informations académiques (université, filière, niveau d'études)</li>
                  <li>Données d'utilisation de la plateforme</li>
                  <li>Contenu partagé (posts, commentaires, ressources)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 campus-gradient rounded-lg flex items-center justify-center">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  Utilisation des Données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>Vos données sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fournir et améliorer nos services</li>
                  <li>Personnaliser votre expérience</li>
                  <li>Communiquer avec vous sur la plateforme</li>
                  <li>Assurer la sécurité de la communauté</li>
                  <li>Analyser l'utilisation de la plateforme</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 campus-gradient rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  Partage des Données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Nous ne vendons jamais vos données personnelles. Vos informations peuvent être partagées :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Avec votre consentement explicite</li>
                  <li>Avec votre université (pour vérification académique)</li>
                  <li>Pour respecter nos obligations légales</li>
                  <li>En cas de fusion ou acquisition (avec notification préalable)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 campus-gradient rounded-lg flex items-center justify-center">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  Vos Droits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
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
                  <a href="mailto:privacy@campussphere.com" className="text-primary hover:underline">
                    privacy@campussphere.com
                  </a>
                </p>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 campus-gradient rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  Sécurité
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles
                  appropriées pour protéger vos données contre tout accès, modification, divulgation
                  ou destruction non autorisés.
                </p>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Pour toute question concernant cette politique de confidentialité, contactez-nous :
                </p>
                <ul className="mt-4 space-y-2">
                  <li>Email: privacy@campussphere.com</li>
                  <li>Adresse: Douala, Cameroun</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
