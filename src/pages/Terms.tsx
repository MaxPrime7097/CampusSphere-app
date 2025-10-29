import React from "react";
import { useNavigate } from "react-router-dom";
import { ScrollText, AlertCircle, CheckCircle, XCircle, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function Terms(): JSX.Element {
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
                <ScrollText className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Règles d'utilisation</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'Automata Display' }}>
                <span className="campus-gradient bg-clip-text text-transparent">
                  Conditions d'
                </span>
                <br />
                <span className="text-foreground">Utilisation</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Découvrez les règles qui régissent l'utilisation de CampusSphere.
                Ensemble, nous maintenons une communauté respectueuse et productive.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => document.getElementById('terms-content')?.scrollIntoView({ behavior: 'smooth' })}
                  className="campus-gradient text-white hover:opacity-90 text-lg px-8 py-6 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Lire les conditions
                </button>
                <button
                  onClick={() => navigate('/cs-inc/contact')}
                  className="border border-border text-foreground hover:bg-accent text-lg px-8 py-6 rounded-lg transition-all duration-300"
                >
                  Support
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block campus-animate-slide-up">
              <div className="absolute inset-0 campus-gradient opacity-30 blur-3xl"></div>
              <div className="relative campus-glass rounded-3xl p-8 campus-glow">
                <img
                  src="/Illustrations/Accept terms-amico.svg"
                  alt="Conditions d'Utilisation CampusSphere"
                  loading="lazy"
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content Section */}
      <section id="terms-content" className="py-20 px-4 bg-card/30">
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
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  Acceptation des Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  En utilisant CampusSphere, vous acceptez les présentes conditions d'utilisation.
                  Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
                </p>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle>Inscription et Compte</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Vous devez être étudiant dans un établissement d'enseignement supérieur</li>
                  <li>Vous devez fournir des informations exactes et à jour</li>
                  <li>Vous êtes responsable de la confidentialité de votre compte</li>
                  <li>Vous devez nous informer immédiatement de toute utilisation non autorisée</li>
                  <li>Un seul compte par personne est autorisé</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 campus-gradient rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  Utilisation de la Plateforme
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>Vous vous engagez à :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Utiliser la plateforme de manière légale et respectueuse</li>
                  <li>Respecter les droits de propriété intellectuelle</li>
                  <li>Ne pas publier de contenu offensant, diffamatoire ou illégal</li>
                  <li>Ne pas harceler ou menacer d'autres utilisateurs</li>
                  <li>Ne pas utiliser la plateforme à des fins commerciales sans autorisation</li>
                  <li>Ne pas tenter de contourner les mesures de sécurité</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle>Contenu Utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>Concernant le contenu que vous publiez :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Vous conservez la propriété de votre contenu</li>
                  <li>Vous accordez à CampusSphere une licence d'utilisation</li>
                  <li>Vous garantissez avoir les droits sur le contenu partagé</li>
                  <li>Nous pouvons supprimer du contenu inapproprié</li>
                  <li>Vous êtes responsable du contenu que vous partagez</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive rounded-lg flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-white" />
                  </div>
                  Interdictions
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
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
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle>Propriété Intellectuelle</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  CampusSphere et son contenu original sont protégés par des droits d'auteur,
                  marques déposées et autres lois sur la propriété intellectuelle. Vous ne pouvez
                  pas copier, modifier ou distribuer notre contenu sans autorisation.
                </p>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <CardHeader>
                <CardTitle>Limitation de Responsabilité</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  CampusSphere est fourni "tel quel". Nous ne garantissons pas que le service sera
                  ininterrompu ou sans erreur. Nous ne sommes pas responsables des dommages résultant
                  de l'utilisation de la plateforme.
                </p>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <CardHeader>
                <CardTitle>Résiliation</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de
                  violation de ces conditions. Vous pouvez également supprimer votre compte à tout moment.
                </p>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <CardHeader>
                <CardTitle>Modifications</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  Nous nous réservons le droit de modifier ces conditions à tout moment.
                  Les modifications importantes vous seront notifiées par email ou sur la plateforme.
                </p>
              </CardContent>
            </Card>

            <Card className="campus-card campus-animate-slide-up" style={{ animationDelay: '0.9s' }}>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  Pour toute question concernant ces conditions, contactez-nous :
                </p>
                <ul className="mt-4 space-y-2">
                  <li>Email: legal@campussphere.com</li>
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
