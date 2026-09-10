import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, BrainCircuit, Layers, PenTool, Zap, ArrowRight } from 'lucide-react'

export function Features() {
  const features = [
    {
      title: "Sphera Live (Multijoueur)",
      desc: "Lance des parties en direct avec tes camarades. Rejoins avec un code PIN, affronte le timer et monte sur le podium en temps réel.",
      icon: <Zap className="w-6 h-6 text-sphera-green" />,
      badge: "Nouveau",
      link: "/sphera-live",
      highlight: true
    },
    {
      title: "Fiches de révision structurées",
      desc: "Points clés, définitions, théorèmes et formules extraits automatiquement de tes PDFs en quelques secondes.",
      icon: <FileText className="w-6 h-6 text-sphera-green" />,
    },
    {
      title: "Quiz interactifs solo",
      desc: "Questions ciblées avec timer, score immédiat et explications détaillées pour combler chaque lacune.",
      icon: <BrainCircuit className="w-6 h-6 text-sphera-green" />,
    },
    {
      title: "Flashcards intelligentes",
      desc: "Cartes recto/verso optimisées pour l'Active Recall et la répétition espacée, prêtes à être révisées.",
      icon: <Layers className="w-6 h-6 text-sphera-green" />,
    },
    {
      title: "Correction d'annales",
      desc: "Mode complet ou rapide selon ton timing pour t'entraîner sur les vrais sujets des années précédentes.",
      icon: <PenTool className="w-6 h-6 text-sphera-green" />,
    }
  ]

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(34,197,94,0.03)_0%,transparent_60%)] blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Tout ce dont tu as besoin
          </h2>
          <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
            Génère exactement le format d'apprentissage qui correspond à tes besoins, seul ou en équipe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className={`sphera-card p-8 group transition-all duration-300 ${
                feat.highlight 
                  ? 'md:col-span-2 border-sphera-green/40 bg-gradient-to-br from-sphera-surface-2 to-sphera-surface hover:border-sphera-green shadow-[0_0_30px_rgba(34,197,94,0.08)]' 
                  : 'hover:border-sphera-green/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-sphera-green/50 transition-all">
                    {feat.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-xl font-bold text-white group-hover:text-sphera-green transition-colors">
                        {feat.title}
                      </h3>
                      {feat.badge && (
                        <span className="bg-sphera-green text-black font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {feat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sphera-text-muted leading-relaxed text-sm md:text-base">
                      {feat.desc}
                    </p>
                  </div>
                </div>

                {feat.link && (
                  <Link 
                    to={feat.link}
                    className="self-end sm:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-sphera-green hover:underline uppercase tracking-wider group-hover:translate-x-1 transition-transform"
                  >
                    Explorer <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
