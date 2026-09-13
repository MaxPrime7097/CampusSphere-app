import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { BookLock, Lock, Eye, Database, UserCheck, Shield, Heart, Facebook, Twitter, Linkedin, Instagram, Youtube, ChevronDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton } from "@/components/layout/PoliciesButton"

export function Privacy(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Politique de Confidentialité (RGPD) | CampusSphere</title>
        <meta name="description" content="Politique de protection de la vie privée et conformité RGPD de CampusSphere : collecte, utilisation et sécurisation de vos données personnelles." />
        <link rel="canonical" href="https://campussphere.app/cs-inc/policies/privacy" />
        <meta property="og:title" content="Politique de Confidentialité - CampusSphere" />
        <meta property="og:description" content="Découvrez comment CampusSphere protège vos données personnelles et respecte votre vie privée." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/policies/privacy" />
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
              Dernière mise à jour : 13/09/2026
            </p>
          </div>

          <div className="space-y-8">
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Collecte des Données & Âge Minimum
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>
                  CampusSphere collecte uniquement les informations nécessaires au fonctionnement de la plateforme et à l'accompagnement pédagogique :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Informations personnelles :</strong> Nom, prénom, adresse email étudiante ou personnelle.</li>
                  <li><strong>Âge minimum requis (16 ans) :</strong> L'inscription est réservée aux personnes de 16 ans et plus. Pour les mineurs de 16 à 18 ans, l'autorisation d'un parent ou représentant légal est requise.</li>
                  <li><strong>Informations académiques :</strong> Université ou établissement scolaire, faculté, filière et niveau d'études.</li>
                  <li><strong>Données de contenu :</strong> Publications, résumés, commentaires et documents académiques partagés.</li>
                  <li><strong>Données de performance technique :</strong> Métriques d'affichage anonymisées via Vercel Speed Insights (sans aucun profilage publicitaire).</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Utilisation des Données & Écosystème Unifié Sphera
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>Vos données sont exploitées pour :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fournir, sécuriser et améliorer les fonctionnalités du réseau social étudiant CampusSphere</li>
                  <li>Alimenter l'assistant académique <strong>Sphera</strong> via un compte unifié (Single Sign-On / SSO)</li>
                  <li>Attribuer vos crédits de révision, vos pass d'étude et synchroniser vos cours et sessions</li>
                  <li>Assurer la sécurité de la communauté et modérer les comportements frauduleux ou toxiques</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Sous-Traitants Cloud & Infrastructure Sécurisée
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>
                  Nous ne commercialisons ni ne louons jamais vos données personnelles à des tiers. Les partages techniques indispensables s'opèrent avec des partenaires de référence assurant un haut niveau de chiffrement :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Hébergement Frontend & CDN :</strong> Vercel Inc. (distribution sécurisée TLS 1.3).</li>
                  <li><strong>Serveurs d'application Backend :</strong> Render Services, Inc. (avec transition programmée vers Microsoft Azure pour l'évolutivité des serveurs).</li>
                  <li><strong>Stockage Sécurisé des Documents :</strong> Amazon Web Services (AWS) - Amazon S3 (fichiers chiffrés au repos AES-256).</li>
                  <li><strong>Moteurs d'IA (Sphera) :</strong> Amazon Web Services (AWS Bedrock), Google AI (Gemini) et Groq Inc.</li>
                  <li><strong>Paiements Mobile Money :</strong> Passerelles agréées sécurisées (MTN MoMo, Orange Money) sans conservation de code PIN secret.</li>
                </ul>
              </div>
            </div>

            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  Traitement par l'Intelligence Artificielle (Sphera)
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold space-y-4 text-muted-foreground mt-4">
                <p>Dans le cadre de l'utilisation de Sphera :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Les documents soumis (PDF, scans de cours, notes) sont analysés uniquement pour produire vos fiches de révision, quiz ou corrections.</li>
                  <li><strong>Zéro entraînement public :</strong> Vos documents personnels ne sont jamais réutilisés pour entraîner les modèles d'IA publics généraux de nos fournisseurs (AWS Bedrock, Google, Groq).</li>
                  <li>Vos documents et sessions sont stockés sur AWS S3 sous votre contrôle et peuvent être supprimés en un clic depuis votre espace personnel.</li>
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
                  Contact & Délégué à la Protection des Données (DPO)
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground mt-4">
                <p>
                  Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits sur vos données :
                </p>
                <ul className="mt-4 space-y-2">
                  <li><p className="mt-4">
                    Courriel :{" "}
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
