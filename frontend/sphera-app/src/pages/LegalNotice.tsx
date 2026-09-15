import React from 'react'
import { Helmet } from 'react-helmet-async'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function LegalNotice() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>Mentions Légales — Sphera by CampusSphere</title>
        <meta
          name="description"
          content="Mentions légales de Sphera : éditeur, hébergeur cloud Render, Microsoft Azure, AWS et coordonnées légales."
        />
        <link rel="canonical" href="https://sphera.campussphere.app/legal-notice" />
        <meta property="og:title" content="Mentions Légales — Sphera" />
        <meta property="og:description" content="Informations juridiques, éditeur et hébergement de Sphera." />
        <meta property="og:url" content="https://sphera.campussphere.app/legal-notice" />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">Mentions Légales</h1>
          <p className="mb-8">Dernière mise à jour : 13 Septembre 2026</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Éditeur du service</h2>
              <p>
                L'application d'assistance académique <strong>Sphera</strong> est un service conçu, développé et opéré par l'équipe fondatrice <strong>CampusSphere</strong>
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Service :</strong> Sphera (intégré à la plateforme CampusSphere)</li>
                <li><strong>Localisation :</strong> Douala, Cameroun</li>
                <li><strong>Partenariats & investisseurs :</strong> <a href="mailto:contact@campussphere.app" className="text-sphera-green hover:underline">contact@campussphere.app</a></li>
                <li><strong>Support technique & académique :</strong> <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a></li>
                <li><strong>Affaires juridiques & politiques :</strong> <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Hébergement & Infrastructure cloud</h2>
              <p>
                L'infrastructure technique de Sphera et de CampusSphere s'appuie sur des hébergeurs cloud de premier rang :
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Frontend & CDN :</strong> Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, États-Unis).</li>
                <li><strong>Backend d'application :</strong> Render Services, Inc. (525 Brannan St, San Francisco, CA 94107, États-Unis), avec une transition programmée vers <strong>Microsoft Azure</strong> pour accompagner l'augmentation du trafic.</li>
                <li><strong>Stockage sécurisé des fichiers :</strong> Amazon Web Services (AWS) - Amazon S3 (Seattle, WA, États-Unis), chiffré au repos (AES-256).</li>
                <li><strong>Fournisseurs d'intelligence artificielle :</strong> Amazon Web Services (AWS Bedrock), complété par Google AI (Gemini) et Groq Inc. Les données d'étude ne sont jamais exploitées pour l'entraînement public des modèles.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Propriété intellectuelle</h2>
              <p>
                Les composants logiciels, les algorithmes de prompt, la structure des fiches de révision et des quiz, la marque et l'identité graphique de Sphera sont la propriété exclusive de CampusSphere.
                L'étudiant conserve la pleine propriété de ses supports de cours originaux téléversés.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Contact & Réclamations</h2>
              <p>
                Pour toute réclamation, notification de contenu ou exercice de vos droits sur vos données personnelles :
              </p>
              <p className="mt-2">
                Courriel : <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a> ou <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
