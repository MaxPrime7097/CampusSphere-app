import React from 'react'
import { Helmet } from 'react-helmet-async'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function Terms() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>Conditions Générales d'Utilisation — Sphera by CampusSphere</title>
        <meta
          name="description"
          content="Consultez les conditions générales d'utilisation de Sphera : règles de la plateforme, utilisation éthique de l'IA et engagements de service."
        />
        <link rel="canonical" href="https://sphera.campussphere.app/terms" />
        <meta property="og:title" content="Conditions d'Utilisation — Sphera" />
        <meta property="og:description" content="Conditions générales d'utilisation et règles de la plateforme de révision Sphera." />
        <meta property="og:url" content="https://sphera.campussphere.app/terms" />
      </Helmet>

      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">Conditions d'Utilisation</h1>
          <p className="mb-8">Dernière mise à jour : 13 Septembre 2026</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Acceptation des conditions & Âge Minimum (16 ans)</h2>
              <p>
                En accédant et en utilisant la plateforme Sphera (partie intégrante de l'écosystème CampusSphere), 
                vous acceptez sans réserve les présentes Conditions Générales d'Utilisation. 
                L'utilisation de Sphera est strictement réservée aux étudiants âgés d'au moins <strong>16 ans révolus</strong>. Si vous avez entre 16 et 18 ans, vous confirmez avoir reçu l'accord préalable de vos parents ou représentants légaux.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Description du service</h2>
              <p>
                Sphera est un outil d'assistance à l'apprentissage utilisant des modèles avancés d'Intelligence Artificielle pour analyser des documents académiques 
                afin de générer des fiches de révision structurées, des flashcards, des quiz interactifs, et de répondre à des questions ciblées sur vos cours. 
                Sphera constitue un support méthodologique et ne remplace en aucun cas vos cours magistraux, travaux dirigés ou directives de vos professeurs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Utilisation acceptable & Licence de Traitement</h2>
              <p>Vous vous engagez à utiliser Sphera de manière légale et éthique. Il est strictement interdit de :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Téléverser des documents protégés par le droit d'auteur sans disposer des autorisations requises.</li>
                <li>Utiliser la plateforme pour tricher lors d'examens officiels ou de contrôles de connaissances en direct.</li>
                <li>Tenter de contourner les quotas d'utilisation, faire du scraping ou surcharger intentionnellement les API d'inférence.</li>
              </ul>
              <p className="mt-3">
                Pour permettre la lecture et le parsing de vos fichiers, vous concédez à Sphera et CampusSphere une licence technique pour héberger et stocker temporairement vos documents sur Amazon Web Services (AWS S3).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Fiabilité des résultats générés par l'IA</h2>
              <p>
                Bien que nous utilisions les technologies les plus rigoureuses (AWS Bedrock, Google Gemini, Groq), l'IA peut occasionnellement produire des erreurs ou inexactitudes (« hallucinations »). 
                L'étudiant demeure seul responsable de la vérification de ses connaissances à partir de ses cours officiels. CampusSphere décline toute responsabilité en cas de mauvaise note, d'échec à un examen ou de décision académique défavorable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Propriété intellectuelle</h2>
              <p>
                Vous conservez tous les droits d'auteur sur vos documents de cours originaux. 
                Les fiches de révision et quiz générés vous appartiennent pour votre usage personnel d'étude. 
                Toutefois, le code source, le design, les algorithmes de prompt et la marque Sphera restent la propriété exclusive de CampusSphere.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Pass d'Étude, Abonnements & Mobile Money</h2>
              <p>
                En phase bêta, les fonctionnalités sont mises à disposition gratuitement. Les futures formules payantes (Pass Examen, abonnements récurrents) sont réglées en Francs CFA via <strong>Mobile Money (MTN MoMo, Orange Money)</strong>. 
                Les conditions de vente, d'exécution immédiate et de non-rétractation après génération sont régies par nos <a href="/terms-of-sale" className="text-sphera-green hover:underline">Conditions Générales de Vente (CGV)</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">7. Modification des conditions & Juridiction</h2>
              <p>
                CampusSphere se réserve le droit de faire évoluer les présentes conditions à tout moment. Les présentes CGU sont soumises à la législation de la Cameroun. Tout litige non résolu à l'amiable sera soumis aux juridictions compétentes de Douala.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">8. Contact</h2>
              <p>
                Pour toute question relative aux présentes conditions ou pour toute demande d'assistance, contactez-nous : <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a> ou <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
