import React from 'react'
import { BookOpen, BrainCircuit, MessageSquare } from 'lucide-react'

export function SpheraAuthSidePanel() {
  return (
    <div className="hidden lg:flex relative h-full w-full flex-col items-center justify-between p-12 overflow-hidden border-l border-sphera-border bg-gradient-to-br from-sphera-bg via-sphera-surface to-[#0A0D0B]">
      
      {/* Background Blueprint Grid & Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(34,197,94,0.12)_0%,transparent_70%)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-[radial-gradient(circle,rgba(255,152,0,0.06)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      {/* Top Badge: Powered by CampusSphere (matching Hero) */}
      <div className="relative z-10 self-start">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sphera-border bg-sphera-surface/50 backdrop-blur-md text-xs shadow-sm">
          <span className="text-sphera-text-muted">Powered by</span>
          <a 
            href="https://campussphere.app" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-semibold text-white hover:text-cs-orange transition-colors"
          >
            CampusSphere
          </a>
        </div>
      </div>

      {/* Central Ethereal Sphera Core */}
      <div className="relative z-10 w-full max-w-md h-80 flex items-center justify-center my-auto">
        {/* Animated Concentric Rings */}
        <div className="absolute w-72 h-72 rounded-full border border-sphera-green/20 animate-[spin_20s_linear_infinite]" />
        <div className="absolute w-88 h-88 rounded-full border border-dashed border-sphera-green/15 animate-[spin_35s_linear_infinite_reverse]" />
        
        {/* Center Glowing Orb */}
        <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-sphera-green/30 via-emerald-500/20 to-transparent border border-sphera-green/40 backdrop-blur-md shadow-[0_0_60px_rgba(34,197,94,0.25)] flex items-center justify-center relative">
          <div className="w-20 h-20 rounded-full bg-sphera-bg/80 border border-sphera-green/50 flex items-center justify-center shadow-inner">
            <img src="/sphera-logo-dark.png" alt="Sphera Core" className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
          </div>
        </div>

        {/* ── Floating Card 1: Top Left (Fiches) ── */}
        <div className="absolute -top-4 -left-4 max-w-[220px] p-3.5 rounded-2xl border border-sphera-border/80 bg-sphera-surface/85 backdrop-blur-xl shadow-2xl animate-bounce" style={{ animationDuration: '6s' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sphera-green/15 text-sphera-green border border-sphera-green/30 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Fiches & Résumés</p>
              <p className="text-[11px] text-sphera-text-muted mt-0.5 leading-snug">
                Points clés, formules et définitions extraits de tes cours.
              </p>
            </div>
          </div>
        </div>

        {/* ── Floating Card 2: Right Middle (Quiz) ── */}
        <div className="absolute top-1/2 -right-6 -translate-y-1/2 max-w-[220px] p-3.5 rounded-2xl border border-sphera-border/80 bg-sphera-surface/85 backdrop-blur-xl shadow-2xl animate-bounce" style={{ animationDuration: '7s', animationDelay: '1.5s' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <BrainCircuit className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Quiz & Flashcards</p>
              <p className="text-[11px] text-sphera-text-muted mt-0.5 leading-snug">
                Entraînement ciblé avec corrections pour réussir tes partiels.
              </p>
            </div>
          </div>
        </div>

        {/* ── Floating Card 3: Bottom Left (Q&A Cours) ── */}
        <div className="absolute -bottom-6 left-6 max-w-[220px] p-3.5 rounded-2xl border border-sphera-border/80 bg-sphera-surface/85 backdrop-blur-xl shadow-2xl animate-bounce" style={{ animationDuration: '8s', animationDelay: '2.5s' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Q&A sur tes Documents</p>
              <p className="text-[11px] text-sphera-text-muted mt-0.5 leading-snug">
                Pose tes questions à l'IA pour éclaircir les chapitres flous.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Subtitle / Brand Pitch */}
      <div className="relative z-10 w-full text-center max-w-sm">
        <h3 className="font-display text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-sphera-green bg-clip-text text-transparent mb-2">
          Ton assistante au service de ta réussite
        </h3>
        <p className="text-xs text-sphera-text-muted leading-relaxed">
          Rejoins des milliers d'étudiants connectés. Révise plus vite, retiens mieux et maîtrise chacun de tes cours.
        </p>
      </div>

    </div>
  )
}
