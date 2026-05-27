import React from 'react'
import { ArrowRight, GraduationCap } from 'lucide-react'

export function CampusSphereSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-[radial-gradient(circle,rgba(255,152,0,0.05)_0%,transparent_70%)] blur-3xl -z-10 pointer-events-none" />

      <div className="container mx-auto max-w-4xl px-4">
        <div className="rounded-3xl border border-cs-orange bg-sphera-surface-2 overflow-hidden relative shadow-[0_0_50px_rgba(255,152,0,0.05)]">

          {/* Subtle Orange Glow inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cs-orange opacity-10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Content Side */}
            <div className="p-10 md:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cs-orange border border-cs-orange text-xs font-bold text-white mb-6 self-start">
                <GraduationCap className="w-4 h-4" /> Pour les étudiants
              </div>

              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                Découvre l'écosystème complet
              </h2>

              <p className="text-sphera-text-muted mb-8 leading-relaxed">
                Sphera n'est que la pointe de l'iceberg. <strong className="text-white">CampusSphere</strong> est le premier réseau social académique pour les étudiants. Retrouve tes camarades de l'IUC et d'ailleurs, accède à tes cours, partage tes notes et booste ta vie étudiante sur une seule plateforme.
              </p>

              <a
                href="https://campussphere.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] font-semibold px-6 py-3 rounded-lg hover:bg-cs-orange hover:text-white transition-colors duration-300 self-start group"
              >
                Explorer CampusSphere
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Visual Side */}
            <div className="relative min-h-[250px] md:min-h-full bg-sphera-bg border-l border-sphera-border/50 flex flex-col items-center justify-center p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

              {/* Fake UI cards drifting */}
              <div className="relative z-10 w-full max-w-[200px] aspect-[4/5] bg-sphera-surface rounded-xl border border-sphera-border shadow-2xl -rotate-6 translate-x-4 flex flex-col p-4">
                <div className="w-8 h-8 rounded-full bg-cs-orange/20 mb-4" />
                <div className="h-3 bg-sphera-text-muted/20 rounded-full w-3/4 mb-2" />
                <div className="h-2 bg-sphera-text-muted/10 rounded-full w-full mb-4" />
                <div className="mt-auto h-8 bg-sphera-surface-2 rounded-md border border-sphera-border" />
              </div>

              <div className="absolute z-0 w-full max-w-[200px] aspect-[4/5] bg-sphera-surface/50 backdrop-blur-sm rounded-xl border border-sphera-border shadow-xl rotate-12 -translate-x-12 translate-y-8" />
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
