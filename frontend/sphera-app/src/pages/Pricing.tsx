import React from 'react'
import { Link } from 'react-router-dom'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Sparkles, Check, BrainCircuit, FileText, Layers, MessageSquare, Zap, Bell } from 'lucide-react'

const features = [
  { icon: FileText, label: "Fiches de révision", desc: "Résumé structuré + points clés + définitions générés automatiquement." },
  { icon: BrainCircuit, label: "Quiz interactif", desc: "20 QCM avec explications pour te tester avant l'examen." },
  { icon: Layers, label: "Flashcards", desc: "Cartes recto/verso pour mémoriser en mode actif." },
  { icon: MessageSquare, label: "Q&A avec l'IA", desc: "Pose n'importe quelle question sur ton cours, Sphera répond depuis le document." },
  { icon: Zap, label: "Correction d'annales", desc: "Upload ton épreuve, Sphera la corrige section par section avec explications." },
  { icon: Sparkles, label: "OCR pour scans", desc: "Sphera lit même les PDFs scannés et photos de cours." },
]

export default function Pricing() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-sphera-green/5 blur-[150px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-5xl relative z-10">

          {/* Hero */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-sphera-green/10 border border-sphera-green/20 text-sphera-green text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Bêta ouverte — accès 100% gratuit
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
              Gratuit pendant<br />
              <span className="text-sphera-green">toute la bêta</span>
            </h1>
            <p className="text-xl text-sphera-text-muted max-w-2xl mx-auto leading-relaxed">
              Sphera est en bêta ouverte. Toutes les fonctionnalités sont disponibles sans limite, sans carte bancaire, sans conditions.
              Le premium viendra plus tard — et tu seras le premier prévenu.
            </p>
          </div>

          {/* Big free card */}
          <div className="max-w-lg mx-auto mb-20">
            <div className="relative bg-sphera-surface rounded-3xl border border-sphera-green shadow-[0_0_60px_rgba(34,197,94,0.08)] p-10 text-center">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sphera-green text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                Actuellement disponible
              </div>

              <div className="mb-6">
                <span className="text-7xl font-black text-white">0 XAF</span>
                <span className="block text-sphera-text-muted mt-1 text-sm">pendant toute la durée de la bêta</span>
              </div>

              <ul className="text-left space-y-3 mb-8">
                {[
                  "Générations illimitées",
                  "Tous les outils — Fiche, Quiz, Flashcards, Annales",
                  "Q&A illimité avec l'IA sur tes cours",
                  "Partage de sessions",
                  "Support pour PDFs scannés (OCR)",
                  "Aucune carte bancaire requise",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-sphera-green/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-sphera-green" />
                    </div>
                    <span className="text-white text-sm">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="block w-full py-3.5 rounded-xl font-bold text-black bg-sphera-green hover:bg-green-400 transition-all text-sm shadow-[0_0_20px_rgba(34,197,94,0.25)]"
              >
                Commencer gratuitement →
              </Link>
            </div>
          </div>

          {/* Features grid */}
          <div className="mb-20">
            <h2 className="text-2xl font-display font-bold text-white text-center mb-10">
              Tout ce qui est inclus gratuitement
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="bg-sphera-surface rounded-2xl border border-sphera-border p-6 hover:border-sphera-green/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-sphera-green/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-sphera-green" />
                    </div>
                    <h3 className="text-white font-semibold text-sm mb-1">{f.label}</h3>
                    <p className="text-sphera-text-muted text-xs leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tally waitlist embed */}
          <div className="bg-sphera-surface rounded-3xl border border-sphera-border p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sphera-green/10 flex items-center justify-center mx-auto mb-5">
              <Bell className="w-6 h-6 text-sphera-green" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-3">
              Sois notifié à l'arrivée du Premium
            </h2>
            <p className="text-sphera-text-muted text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Laisse ton email. Quand le plan premium sortira, tu seras dans les premiers — avec une offre de lancement réservée aux bêta-testeurs.
            </p>

            {/* 
              ════════════════════════════════════════
              TALLY FORM — Remplace ce bloc par ton
              embed Tally une fois le formulaire créé.
              
              Exemple d'intégration :
              <iframe
                data-tally-src="https://tally.so/embed/XXXX?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="100%"
                height="300"
                frameBorder="0"
                title="Sphera Premium Waitlist"
              />
              ════════════════════════════════════════
            */}
            <div className="w-full min-h-[140px] rounded-xl border border-dashed border-sphera-border flex items-center justify-center text-sphera-text-muted text-sm">
              <iframe
                src="https://tally.so/embed/vGdQbl?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="90%"
                height="1000"
                frameBorder="0"
                marginHeight="0"
                marginWidth="0"
                title="Sphera Premium Waitlist"
              />  
            </div>

            <p className="text-xs text-sphera-text-muted/50 mt-6">
              Aucun spam. Désabonnement en un clic.
            </p>
          </div>

        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
