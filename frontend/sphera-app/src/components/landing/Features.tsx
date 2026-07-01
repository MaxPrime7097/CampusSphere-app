import React from 'react'
import { FileText, BrainCircuit, Columns, PenTool } from 'lucide-react'

export function Features() {
  const features = [
    {
      title: "Fiche de révision",
      desc: "Points clés, définitions, formules extraits automatiquement",
      icon: <FileText className="w-6 h-6 text-[#F5F5F5]" />,
      emoji: "✨"
    },
    {
      title: "Quiz interactif",
      desc: "Questions avec timer, score et explications",
      icon: <BrainCircuit className="w-6 h-6 text-[#F5F5F5]" />,
      emoji: "🎯"
    },
    {
      title: "Flashcards",
      desc: "Cartes recto/verso style pour mémoriser",
      icon: <Columns className="w-6 h-6 text-[#F5F5F5]" />,
      emoji: "📚"
    },
    {
      title: "Correction d'annales",
      desc: "Mode complet ou rapide selon ton besoin",
      icon: <PenTool className="w-6 h-6 text-[#F5F5F5]" />,
      emoji: "📝"
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
            Génère exactement le format d'apprentissage qui correspond à ta méthode.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => (
            <div key={idx} className="sphera-card p-8 group hover:border-sphera-green/50 cursor-default">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-xl">{feat.emoji}</span>
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white mb-2 group-hover:text-sphera-green transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-sphera-text-muted leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
