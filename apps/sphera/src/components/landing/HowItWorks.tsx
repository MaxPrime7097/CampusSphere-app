import React from 'react'
import { Upload, MousePointerClick, BookOpen } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: <Upload className="w-8 h-8 text-sphera-green" />,
      title: "Upload",
      desc: "Tu uploades ton cours PDF"
    },
    {
      number: "2",
      icon: <MousePointerClick className="w-8 h-8 text-sphera-green" />,
      title: "Choisis",
      desc: "Fiche, Quiz, Flashcards ou Annale"
    },
    {
      number: "3",
      icon: <BookOpen className="w-8 h-8 text-sphera-green" />,
      title: "Révise",
      desc: "Sphera génère en 30 secondes"
    }
  ]

  return (
    <section className="py-24 bg-sphera-surface relative">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Comment ça marche
          </h2>
          <p className="text-sphera-text-muted text-lg max-w-2xl mx-auto">
            Trois étapes simples pour transformer tes documents en outils de révision puissants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-sphera-border to-transparent" />
          
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center group">
              <div className="w-24 h-24 rounded-2xl bg-sphera-bg border border-sphera-border flex items-center justify-center relative mb-6 group-hover:border-sphera-green/50 transition-colors z-10 shadow-xl">
                {/* Number badge */}
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-sphera-green text-[#0A0A0A] font-bold flex items-center justify-center text-sm shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                  {step.number}
                </div>
                {step.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sphera-text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
