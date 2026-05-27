import React from 'react'
import { Link } from 'react-router-dom'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Check, X, Sparkles } from 'lucide-react'

const pricingPlans = [
  {
    name: "Gratuit",
    price: "0€",
    period: "pour toujours",
    description: "Idéal pour tester l'assistant et réviser occasionnellement.",
    features: [
      { name: "5 générations par mois", included: true },
      { name: "Fiches de révision simples", included: true },
      { name: "Quiz (jusqu'à 10 questions)", included: true },
      { name: "Q&A basique avec l'IA", included: true },
      { name: "Support pour les Annales complexes", included: false },
      { name: "Croisement de plusieurs cours", included: false },
      { name: "Partage par lien public", included: false },
    ],
    buttonText: "Commencer gratuitement",
    buttonLink: "/register",
    popular: false
  },
  {
    name: "Premium",
    price: "4,99€",
    period: "par mois",
    description: "Pour les étudiants qui veulent exceller et gagner du temps.",
    features: [
      { name: "Générations illimitées", included: true },
      { name: "Fiches de révision structurées avancées", included: true },
      { name: "Quiz illimités et Flashcards", included: true },
      { name: "Q&A avancé (explications détaillées)", included: true },
      { name: "Support pour les Annales complexes", included: true },
      { name: "Croisement de plusieurs cours", included: true },
      { name: "Partage par lien public", included: true },
    ],
    buttonText: "Devenir Premium",
    buttonLink: "/register",
    popular: true
  },
  {
    name: "Campus",
    price: "Sur devis",
    period: "facturation annuelle",
    description: "Pour les BDE, associations et établissements scolaires.",
    features: [
      { name: "Toutes les fonctionnalités Premium", included: true },
      { name: "Sphères académiques illimitées", included: true },
      { name: "Statistiques d'apprentissage", included: true },
      { name: "Marque blanche (logo de l'école)", included: true },
      { name: "Gestionnaire de comptes", included: true },
      { name: "Accès API Sphera", included: true },
      { name: "Support prioritaire 24/7", included: true },
    ],
    buttonText: "Nous contacter",
    buttonLink: "mailto:contact@campussphere.app",
    popular: false
  }
];

export default function Pricing() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-sphera-green/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
              Investis dans ta réussite
            </h1>
            <p className="text-xl text-sphera-text-muted max-w-2xl mx-auto">
              Des tarifs simples et transparents. Commence gratuitement, passe à la vitesse supérieure quand tu en as besoin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative flex flex-col bg-sphera-surface rounded-2xl border ${plan.popular ? 'border-sphera-green shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-sphera-border'} p-8 transition-transform hover:-translate-y-1`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sphera-green text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Le plus choisi
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-sphera-text-muted text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-sphera-text-muted">{plan.description}</p>
                </div>

                <ul className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-sphera-green/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-sphera-green" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-red-500/70" />
                        </div>
                      )}
                      <span className={`text-sm ${feature.included ? 'text-white' : 'text-sphera-text-muted'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.buttonLink}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-center transition-all ${
                    plan.popular 
                      ? 'bg-sphera-green text-black hover:bg-green-400' 
                      : 'bg-sphera-surface-2 text-white border border-sphera-border hover:bg-sphera-border'
                  }`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
