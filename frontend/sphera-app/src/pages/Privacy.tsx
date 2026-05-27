import React from 'react'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function Privacy() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">Politique de Confidentialité</h1>
          <p className="mb-8">Dernière mise à jour : 27 Mai 2026</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Chez CampusSphere et Sphera, la protection de vos données personnelles est une priorité absolue. 
                Cette politique de confidentialité vous explique quelles données nous collectons, comment nous les utilisons, 
                et quels sont vos droits concernant vos informations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Données collectées</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Informations de compte :</strong> Votre nom, prénom, adresse email et établissement scolaire lors de votre inscription.</li>
                <li><strong>Données de contenu :</strong> Les documents, textes, PDF et images que vous téléversez pour générer des fiches de révision et des quiz.</li>
                <li><strong>Données d'utilisation :</strong> Les statistiques liées à vos sessions d'apprentissage, vos résultats aux quiz, et vos interactions avec l'IA.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Utilisation de vos documents et de l'IA</h2>
              <p>
                Les documents que vous soumettez à Sphera sont traités par nos fournisseurs de modèles d'Intelligence Artificielle (Google Gemini, Groq, Anthropic) <strong>uniquement</strong> dans le but de générer vos fiches et quiz.
              </p>
              <p className="mt-4 font-semibold text-white">
                Nous garantissons que vos documents personnels ne sont jamais vendus, rendus publics, ni utilisés pour entraîner des modèles publics sans votre consentement explicite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Partage des données</h2>
              <p>
                Nous ne partageons vos données avec aucun tiers à des fins publicitaires. Les seuls partages s'effectuent avec :
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Nos prestataires d'hébergement (ex: Render, AWS).</li>
                <li>Nos fournisseurs d'API d'Intelligence Artificielle, dans le cadre strict de l'exécution de vos requêtes.</li>
                <li>D'autres étudiants <strong>uniquement</strong> si vous décidez de partager explicitement une session ou de la publier dans une "Sphère" publique.</li>
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
                Pour toute demande, contactez-nous à l'adresse suivante : <strong>privacy@campussphere.app</strong>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
