import React from 'react'

export function SocialProof() {
  return (
    <section className="py-24 bg-sphera-surface relative overflow-hidden border-t border-sphera-border">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        
        <div className="inline-flex flex-col items-center mb-12">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Rejoins les Spherians
          </h2>
          <p className="text-sphera-text-muted text-lg">
            Des milliers d'étudiants de l'IUC Douala et d'ailleurs l'utilisent déjà.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">12K+</div>
            <div className="text-sm text-sphera-text-muted">Sessions générées</div>
          </div>
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">4.8/5</div>
            <div className="text-sm text-sphera-text-muted">Note moyenne</div>
          </div>
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">50+</div>
            <div className="text-sm text-sphera-text-muted">Filières couvertes</div>
          </div>
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">30s</div>
            <div className="text-sm text-sphera-text-muted">Temps moyen</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              text: "Je mettais des heures à ficher mes cours de droit. Avec Sphera, c'est fait pendant que je vais me chercher un café.",
              author: "Marc B.",
              role: "L3 Droit"
            },
            {
              text: "Les quiz générés m'ont littéralement sauvé pour mes partiels de biologie. C'est le meilleur outil d'apprentissage.",
              author: "Sarah N.",
              role: "Master 1"
            },
            {
              text: "Corriger les annales de l'année dernière en un clic, c'est un cheat code absolu pour les révisions.",
              author: "Kevin T.",
              role: "Prépa Ingé"
            }
          ].map((quote, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-sphera-surface-2 border border-sphera-border relative">
              <div className="text-4xl text-sphera-green/20 absolute top-4 right-4 font-serif">"</div>
              <p className="text-white text-sm leading-relaxed mb-6 relative z-10">"{quote.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sphera-border flex items-center justify-center text-xs font-bold text-white">
                  {quote.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{quote.author}</div>
                  <div className="text-xs text-sphera-text-muted">{quote.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
