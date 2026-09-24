import React from 'react'
import { Helmet } from 'react-helmet-async'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function Privacy() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>Politique de Confidentialité — Sphera by CampusSphere</title>
        <meta
          name="description"
          content="Consultez la politique de confidentialité de Sphera : protection de vos données personnelles, utilisation sécurisée de vos documents et respect de votre vie privée."
        />
        <link rel="canonical" href="https://sphera.campussphere.app/privacy" />
        <meta property="og:title" content="Politique de Confidentialité — Sphera" />
        <meta property="og:description" content="Protection de vos données personnelles et utilisation sécurisée de vos documents de cours sur Sphera." />
        <meta property="og:url" content="https://sphera.campussphere.app/privacy" />
      </Helmet>

      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">Politique de Confidentialité</h1>
          <p className="mb-8">Dernière mise à jour : 13 Septembre 2026</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Introduction & Écosystème Unifié</h2>
              <p>
                Sphera est l'assistant académique d'intelligence artificielle intégré à <strong>CampusSphere</strong>. La protection de vos données personnelles et la confidentialité de vos supports d'études sont des priorités absolues.
                Cette politique vous informe sur la collecte, le traitement et la sécurisation de vos données lors de l'utilisation de Sphera.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Données collectées & Âge Minimum (16 ans)</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Âge minimum requis :</strong> L'utilisation de Sphera est réservée aux étudiants âgés d'au moins <strong>16 ans révolus</strong>. Si vous êtes mineur (16-18 ans), vous certifiez détenir l'autorisation de vos parents ou tuteurs.</li>
                <li><strong>Compte unifié (SSO CampusSphere) :</strong> Nom, prénom, email étudiant ou personnel et établissement d'enseignement supérieur.</li>
                <li><strong>Données de contenu & supports d'études :</strong> Fichiers PDF, photographies de cours, textes et documents téléversés pour générer vos fiches, flashcards et quiz.</li>
                <li><strong>Données d'utilisation :</strong> Statistiques d'apprentissage, historiques de quiz et interactions pédagogiques avec l'IA.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Utilisation de vos documents & Sécurité de l'IA</h2>
              <p>
                Vos supports de révision sont traités par des modèles d'Intelligence Artificielle de pointe via <strong>Amazon Web Services (AWS Bedrock)</strong>, complété par <strong>Google Gemini</strong> et <strong>Groq</strong>, dans le but strict et exclusif d'analyser vos cours et générer votre contenu pédagogique.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-sphera-surface border border-sphera-border font-semibold text-white">
                Engagement ferme : Vos documents personnels et requêtes d'étude ne sont JAMAIS vendus, ni utilisés pour ré-entraîner les modèles d'IA publics de nos fournisseurs d'infrastructure.
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Hébergement & Sous-Traitants Cloud</h2>
              <p>
                Vos informations ne sont jamais cédées à des régies publicitaires. Les seuls partages techniques indispensables concernent nos prestataires d'infrastructure :
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Serveurs Backend d'Application :</strong> Render Services, Inc. (avec migration progressive vers Microsoft Azure pour l'évolutivité haute performance).</li>
                <li><strong>Stockage Sécurisé :</strong> Amazon Web Services (AWS) - Amazon S3 (stockage chiffré au repos pour vos documents de cours).</li>
                <li><strong>Inférence IA :</strong> AWS Bedrock, Google AI et Groq Inc. (traitement temps réel sans rétention pour entraînement).</li>
                <li><strong>Hébergement Web & CDN :</strong> Vercel Inc.</li>
                <li><strong>Paiements Mobile Money :</strong> Passerelles agréées sécurisées (MTN MoMo, Orange Money) pour l'activation des pass d'étude.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures de sécurité techniques (chiffrement TLS, stockage sécurisé, mots de passe hashés) 
                et organisationnelles pour protéger vos données contre tout accès, altération, divulgation ou destruction non autorisés.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Vos droits</h2>
              <p>
                Conformément à la réglementation (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression 
                et de portabilité de vos données. Vous pouvez supprimer toutes vos sessions d'études, ou votre compte entier, directement depuis les paramètres de l'application. 
                Pour toute demande, contactez-nous à l'adresse suivante : <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
