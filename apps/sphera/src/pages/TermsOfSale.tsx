import React from 'react'
import { Helmet } from 'react-helmet-async'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function TermsOfSale() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>Conditions Générales de Vente (CGV) — Sphera by CampusSphere</title>
        <meta
          name="description"
          content="Consultez les CGV de Sphera : abonnements d'assistance IA, pass d'examen, paiements Mobile Money via l'API Campay et conditions de rétractation."
        />
        <link rel="canonical" href="https://sphera.campussphere.app/terms-of-sale" />
        <meta property="og:title" content="Conditions Générales de Vente — Sphera" />
        <meta property="og:description" content="Conditions Générales de Vente et modalités de paiement Mobile Money sur Sphera." />
        <meta property="og:url" content="https://sphera.campussphere.app/terms-of-sale" />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">Conditions Générales de Vente</h1>
          <p className="mb-8">Dernière mise à jour : 13 Septembre 2026</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Objet & Éligibilité</h2>
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent les souscriptions aux offres payantes, Pass Révision / Examen et abonnements de l'assistant d'étude <strong>Sphera</strong>, édité par CampusSphere.
              </p>
              <p className="mt-2">
                L'utilisateur doit être âgé d'au moins <strong>16 ans révolus</strong> et avoir la capacité juridique requise pour contracter (avec accord préalable des parents ou tuteurs légaux pour les étudiants mineurs de 16 à 18 ans).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Formules d'accès & Tarification</h2>
              <p>
                Les prix des services sont affichés en <strong>Francs CFA (XAF)</strong> toutes taxes comprises.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Accès Bêta Ouverte (Actuel) :</strong> Gratuit (0 XAF) pendant toute la phase de test avec quotas équitables.</li>
                <li><strong>Pass d'Étude & Examen :</strong> Accès forfaitaire à durée fixe (sans tacite reconduction). Le pass expire automatiquement à sa date de fin sans facturation ultérieure.</li>
                <li><strong>Abonnements Récurrents :</strong> Formules avec renouvellement périodique, résiliables à tout moment en un clic depuis votre espace personnel.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Modalités de paiement Mobile Money via l'API Campay</h2>
              <p>
                Pour garantir un règlement instantané et accessible sur tout le continent, les transactions de paiement sont opérées via la passerelle certifiée <strong>Campay</strong> (API Campay).
              </p>
              <p className="mt-2">
                Les moyens de paiement supportés comprennent :
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>MTN Mobile Money</strong> (Cameroun et zone CEMAC)</li>
                <li><strong>Orange Money</strong> (Cameroun et zone CEMAC)</li>
              </ul>
              <p className="mt-3">
                L'API Campay assure un chiffrement bancaire de haut niveau et la sécurisation directe des flux financiers. À aucun moment Sphera ou CampusSphere ne détient, ne traite ni ne stocke votre code PIN confidentiel ou vos identifiants Mobile Money.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Exécution immédiate & Droit de rétractation</h2>
              <p>
                Les services Sphera consistent en la mise à disposition immédiate de puissance de calcul IA et de générations pédagogiques numériques personnalisées.
              </p>
              <p className="mt-2 font-semibold text-white">
                En confirmant votre paiement Mobile Money via Campay, vous demandez l'activation immédiate du service et vous renoncez expressément à votre droit de rétractation pour les unités de crédits ou périodes déjà consommées.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Réclamations & Service client</h2>
              <p>
                En cas d'anomalie de paiement (débit Mobile Money confirmé par SMS sans déblocage des fonctionnalités sous 2 heures), veuillez contacter immédiatement notre support en précisant la référence de transaction Campay :
              </p>
              <p className="mt-2">
                Courriel : <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a>
              </p>
              <p className="mt-1">Délai de traitement moyen : 24 à 48 heures ouvrées.</p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
