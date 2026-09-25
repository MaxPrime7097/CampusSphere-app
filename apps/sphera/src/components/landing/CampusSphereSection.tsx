import React from 'react'
import { useTranslation } from '@cs/i18n'
import { ArrowRight, GraduationCap } from 'lucide-react'

export function CampusSphereSection() {
  const { t } = useTranslation('landing')

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
                <GraduationCap className="w-4 h-4" /> {t('campusSphere.badge')}
              </div>

              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                {t('campusSphere.title')}
              </h2>

              <p className="text-sphera-text-muted mb-8 leading-relaxed">
                {t('campusSphere.description')}
              </p>

              <a
                href="https://campussphere.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#0A0A0A] font-semibold px-6 py-3 rounded-lg hover:bg-cs-orange hover:text-white transition-colors duration-300 self-start group"
              >
                {t('campusSphere.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Visual Side */}
            <div className="relative min-h-[250px] md:min-h-full bg-sphera-bg border-l border-sphera-border/50 flex flex-col items-center justify-center p-8 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

              {/* CampusSphere Logo Card */}
              <div className="relative z-10 w-full max-w-[220px] aspect-square bg-sphera-surface/80 backdrop-blur-md rounded-2xl border border-cs-orange/30 shadow-[0_0_50px_rgba(255,152,0,0.15)] flex flex-col items-center justify-center p-6 group hover:border-cs-orange/60 transition-colors duration-500">
                <div className="absolute inset-0 bg-cs-orange/5 rounded-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                
                <img 
                  src="https://campussphere.app/CS.svg" 
                  alt="CampusSphere Logo" 
                  className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,152,0,0.5)] group-hover:scale-110 transition-transform duration-500 z-10"
                  onError={(e) => {
                    // Fallback if the logo fails to load remotely
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden z-10 w-24 h-24 rounded-full bg-cs-orange/20 border border-cs-orange/50 flex items-center justify-center">
                  <GraduationCap className="w-10 h-10 text-cs-orange" />
                </div>
                
                <h3 className="font-display font-bold text-white mt-6 text-xl tracking-tight z-10">CampusSphere</h3>
              </div>

              {/* Decorative background elements */}
              <div className="absolute z-0 w-32 h-32 rounded-full border border-cs-orange/20 -translate-x-20 translate-y-20 animate-[spin_10s_linear_infinite]" />
              <div className="absolute z-0 w-48 h-48 rounded-full border border-dashed border-cs-orange/20 translate-x-20 -translate-y-20 animate-[spin_15s_linear_infinite_reverse]" />
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
