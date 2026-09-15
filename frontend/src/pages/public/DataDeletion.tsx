import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton } from "@/components/layout/PoliciesButton";

export function DataDeletion(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Suppression de Compte & Données | CampusSphere</title>
        <meta
          name="description"
          content="Consultez les modalités de suppression définitive de votre compte et de vos données personnelles sur CampusSphere et Sphera."
        />
        <link rel="canonical" href="https://campussphere.app/cs-inc/policies/datadeletion" />
        <meta property="og:title" content="Suppression de Compte & Données - CampusSphere" />
        <meta property="og:description" content="Procédure d'exercice de votre droit à l'effacement sur CampusSphere." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/policies/datadeletion" />
      </Helmet>

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
                  Suppression
                </span>
                <br />
                <span className="text-foreground">de Données</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Contrôlez vos données personnelles et découvrez la démarche pour supprimer définitivement votre compte CampusSphere et Sphera.
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
                  src="/icons/datadeletion.png"
                  alt="Suppression de données CampusSphere"
                  loading="lazy"
                  className="h-full w-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="deletion-content" className="pt-10 pb-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="font-nunito font-semibold text-muted-foreground">
              Dernière mise à jour : 13/09/2026
            </p>
          </div>

          <div className="space-y-8">
            {/* 1. Cadre Légal & Droit à l'Effacement */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  1. Votre Droit à l'Effacement
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Conformément à la législation camerounaise (Loi n° 2010/012 sur la cybersécurité) et aux standards internationaux de protection de la vie privée (RGPD), tout étudiant ou utilisateur inscrit sur CampusSphere et Sphera bénéficie d'un droit fondamental à l'effacement complet de ses données personnelles (« droit à l'oubli »).
                </p>
                <p>
                  Vous pouvez exercer ce droit à tout moment, de manière autonome et sans frais.
                </p>
              </div>
            </div>

            {/* 2. Procédure de Suppression */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  2. Comment Supprimer votre Compte
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>Pour engager la suppression directe et irréversible de votre compte :</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Connectez-vous à votre espace sur <strong>campussphere.app</strong>.</li>
                  <li>Accédez aux <strong>Paramètres</strong> (icône d'engrenage), puis à la section <strong>Compte & Sécurité</strong>.</li>
                  <li>Sélectionnez l'option <strong>Supprimer mon compte</strong> située en bas de page.</li>
                  <li>Confirmez l'opération en saisissant votre mot de passe utilisateur.</li>
                </ol>
                <p className="mt-4">
                  Si vous rencontrez une difficulté pour vous connecter, vous pouvez adresser une demande formelle par courriel à{" "}
                  <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">
                    policies@campussphere.app
                  </a>{" "}
                  depuis l'adresse email rattachée à votre compte. Notre équipe traitera la purge sous 48 heures.
                </p>
              </div>
            </div>

            {/* 3. Données Immédiatement Supprimées */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  3. Données Supprimées Définitivement
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>La confirmation de la suppression entraîne la suppression immédiate et irréversible de :</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Votre profil (nom, prénom, photo, statut, établissement et filière).</li>
                  <li>Vos identifiants d'authentification et sessions ouvertes sur CampusSphere et Sphera.</li>
                  <li>Vos publications, commentaires, votes et messages privés.</li>
                  <li>Vos documents téléversés, fiches de révision générées, quiz et flashcards d'études hébergés sur AWS S3.</li>
                  <li>Vos abonnements aux sphères académiques et carnets d'amis.</li>
                </ul>
              </div>
            </div>

            {/* 4. Données Conservées Temporairement */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  4. Sauvegardes & Délais de Rétention Résiduelle
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  La suppression en base active est instantanée. Pour des impératifs stricts de continuité de service et de sécurité :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Copies de sauvegarde chiffrées :</strong> Les sauvegardes globales du système sont purgées cycliquement sous un délai maximum de 30 jours, date après laquelle aucune donnée résiduelle ne subsiste.</li>
                  <li><strong>Obligations légales et traçabilité Campay :</strong> Les pièces justificatives financières (références de paiement Mobile Money) sont archivées dans les limites et délais imposés par la réglementation fiscale et bancaire applicable.</li>
                </ul>
              </div>
            </div>

            {/* 5. Contact */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  5. Contact & Assistance
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Pour toute interrogation relative au traitement ou à la suppression de vos données :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Protection des Données & Politiques : <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">policies@campussphere.app</a></li>
                  <li>Support Technique : <a href="mailto:support@campussphere.app" className="text-primary hover:underline">support@campussphere.app</a></li>
                  <li>Localisation : Douala, Cameroun</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}