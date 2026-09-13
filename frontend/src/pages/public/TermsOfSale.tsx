import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PoliciesButton } from "@/components/layout/PoliciesButton";

export function TermsOfSale(): JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Conditions Générales de Vente (CGV) | CampusSphere</title>
        <meta
          name="description"
          content="Consultez les Conditions Générales de Vente (CGV) de CampusSphere et Sphera : modalités de paiement Mobile Money via l'API Campay, abonnements, pass d'étude et politique de rétractation."
        />
        <link rel="canonical" href="https://campussphere.app/cs-inc/policies/terms-of-sale" />
        <meta property="og:title" content="Conditions Générales de Vente (CGV) - CampusSphere" />
        <meta property="og:description" content="Modalités d'achat, abonnements et paiements Mobile Money via Campay sur CampusSphere." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/policies/terms-of-sale" />
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
                  Conditions Générales
                </span>
                <br />
                <span className="text-foreground">de Vente (CGV)</span>
              </h1>

              <p className="font-nunito font-semibold text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Modalités tarifaires, fonctionnement des abonnements et pass d'étude Sphera, et paiements sécurisés Mobile Money par l'API Campay.
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
                  src="/icons/terms-of-sale.png"
                  alt="CampusSphere CGV illustration"
                  loading="lazy"
                  className="h-full w-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="cgv-content" className="pt-10 pb-20 px-0 bg-card/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="font-nunito font-semibold text-muted-foreground">
              Dernière mise à jour : 13/09/2026
            </p>
          </div>

          <div className="space-y-8">
            {/* 1. Champ d'application */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  1. Champ d'Application & Objet
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent sans restriction ni réserve l'ensemble des achats de services numériques, d'abonnements et de crédits d'intelligence artificielle proposés par <strong>CampusSphere</strong> et son service associé <strong>Sphera</strong>.
                </p>
                <p>
                  Toute souscription à un service payant implique l'acceptation pleine et entière des présentes CGV ainsi que des Conditions Générales d'Utilisation (CGU). L'utilisateur déclare être âgé d'au moins <strong>16 ans révolus</strong> et disposer de la capacité juridique (ou de l'accord d'un représentant légal) pour contracter.
                </p>
              </div>
            </div>

            {/* 2. Services, Formules & Tarifs */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  2. Services Proposés, Formules & Tarification
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  CampusSphere propose des services numériques d'assistance pédagogique, de génération de fiches de révision, quiz, flashcards, corrections d'épreuves et accès prioritaires aux modèles d'IA Sphera.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Phase de Bêta :</strong> Durant les phases de test ou bêta ouverte, les services peuvent être mis à disposition gratuitement (0 XAF) avec quotas d'usage équitables.</li>
                  <li><strong>Pass Ponctuels (ex: Pass Examen) :</strong> Accès temporaire d'une durée déterminée (7 jours, 30 jours, etc.) sans tacite reconduction. Le pass expire à son terme sans facturation ultérieure.</li>
                  <li><strong>Abonnements Récurrents :</strong> Accès continu avec renouvellement périodique résiliable à tout moment depuis les réglages de compte.</li>
                </ul>
                <p>
                  Tous les prix sont libellés en <strong>Francs CFA (XAF)</strong> toutes taxes comprises (TTC). CampusSphere se réserve le droit de faire évoluer ses tarifs, les montants applicables étant ceux affichés lors de la validation de la transaction.
                </p>
              </div>
            </div>

            {/* 3. Moyens de Paiement (API Campay) */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  3. Modalités de Paiement Sécurisé (Mobile Money via l'API Campay)
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Afin d'offrir une expérience de paiement fluide et adaptée aux réalités locales des campus africains, les règlements Mobile Money s'effectuent via l'agrégateur de paiement certifié <strong>Campay</strong> (API Campay).
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>MTN Mobile Money :</strong> Règlement direct avec prompt USSD et confirmation sur le mobile de l'étudiant.</li>
                  <li><strong>Orange Money :</strong> Validation sécurisée par code d'autorisation ou confirmation mobile.</li>
                </ul>
                <p className="mt-3">
                  L'API Campay garantit la protection chiffrée de bout en bout des paiements. CampusSphere ne collecte, ne visualise ni ne conserve aucun code PIN ou mot de passe bancaire secret.
                </p>
              </div>
            </div>

            {/* 4. Exécution Immédiate & Droit de Rétractation */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  4. Exécution Immédiate du Service & Droit de Rétractation
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Les services vendus constituent la fourniture d'un contenu numérique non fourni sur un support matériel et de prestations d'assistance par intelligence artificielle dont l'exécution commence immédiatement après confirmation du paiement.
                </p>
                <p className="font-semibold text-foreground">
                  En validant votre transaction Mobile Money via Campay, vous demandez expressément l'activation immédiate des fonctionnalités payantes et reconnaissez renoncer expressément à votre droit de rétractation dès lors que le service a commencé à être exécuté ou que des crédits IA ont été consommés.
                </p>
              </div>
            </div>

            {/* 5. Politique de Remboursement */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  5. Politique de Remboursement & Réclamations
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Aucun remboursement rétroactif n'est accordé pour les périodes consommées, les pass arrivés à expiration ou les générations IA déjà utilisées.
                </p>
                <p>
                  En cas d'incident technique avéré (ex. : double débit Mobile Money, compte débité sans activation des fonctionnalités dans un délai de 2 heures), l'utilisateur doit contacter immédiatement le support muni de sa référence de transaction Campay :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Support : <a href="mailto:support@campussphere.app" className="text-primary hover:underline">support@campussphere.app</a> ou <a href="mailto:policies@campussphere.app" className="text-primary hover:underline">policies@campussphere.app</a></li>
                  <li>Délai de traitement : Réponse et régularisation sous 24 à 48 heures ouvrées.</li>
                </ul>
              </div>
            </div>

            {/* 6. Droit Applicable & Règlement des Litiges */}
            <div className="campus-animate-slide-up">
              <div className="p-0">
                <CardTitle className="font-poppins flex items-center gap-3 p-0">
                  6. Droit Applicable & Règlement des Différends
                </CardTitle>
              </div>
              <div className="font-nunito font-semibold text-muted-foreground space-y-4 mt-4">
                <p>
                  Les présentes CGV sont soumises à la législation de la République du Cameroun et aux règles régissant le commerce électronique dans l'espace CEMAC.
                </p>
                <p>
                  En cas de différend, une solution amiable est privilégiée. À défaut d'accord amiable sous trente (30) jours, tout litige sera soumis aux tribunaux compétents du ressort de Douala, Cameroun.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
