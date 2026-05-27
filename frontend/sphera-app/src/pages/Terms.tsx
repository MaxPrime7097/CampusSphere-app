import React from 'react'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function Terms() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">Conditions d'Utilisation</h1>
          <p className="mb-8">Dernière mise à jour : 27 Mai 2026</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Acceptation des conditions</h2>
              <p>
                En accédant et en utilisant la plateforme Sphera (partie intégrante de CampusSphere), 
                vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation. 
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Description du service</h2>
              <p>
                Sphera est un outil d'assistance à l'apprentissage utilisant l'Intelligence Artificielle pour analyser des documents académiques 
                afin de générer des fiches de révision, des flashcards, des quiz, et de répondre à des questions sur ces documents. 
                Sphera ne remplace en aucun cas l'apprentissage régulier ni l'enseignement dispensé par vos professeurs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Utilisation acceptable</h2>
              <p>Vous vous engagez à utiliser Sphera de manière légale et éthique. Il est strictement interdit de :</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Téléverser des documents protégés par le droit d'auteur sans autorisation préalable.</li>
                <li>Utiliser la plateforme pour générer du contenu offensant, haineux, ou illégal.</li>
                <li>Tenter de contourner les limites d'utilisation (scraping, requêtes abusives, etc.).</li>
                <li>Utiliser Sphera pour tricher lors d'examens ou de contrôles de connaissances.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Fiabilité des résultats générés par l'IA</h2>
              <p>
                Bien que nous utilisions les technologies d'Intelligence Artificielle les plus avancées, Sphera peut occasionnellement 
                générer des informations incorrectes ("hallucinations"). L'utilisateur est seul responsable de la vérification 
                de l'exactitude des fiches et quiz générés en se référant à son cours original. CampusSphere décline toute responsabilité 
                en cas d'erreur de révision due à une inexactitude de l'IA.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Propriété intellectuelle</h2>
              <p>
                Vous conservez tous les droits sur les documents originaux que vous téléversez. 
                Les fiches de révision et quiz générés à partir de vos documents vous appartiennent. 
                Toutefois, le code source, le design, les algorithmes et la marque Sphera restent la propriété exclusive de CampusSphere.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Modification des conditions</h2>
              <p>
                CampusSphere se réserve le droit de modifier ces conditions à tout moment. 
                Les utilisateurs seront informés des modifications majeures. L'utilisation continue du service après modification 
                vaut acceptation des nouvelles conditions.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
