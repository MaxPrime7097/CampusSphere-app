import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Users, Trophy, Clock, ArrowRight, Play, Sparkles } from 'lucide-react'

export function SpheraLiveSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-sphera-surface/60 border-y border-sphera-border">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[radial-gradient(circle,rgba(34,197,94,0.08)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sphera-green/10 border border-sphera-green/30 text-sphera-green text-xs font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-sphera-green" />
              Nouveau &bull; Mode Multijoueur
            </div>

            <h2 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Sphera <span className="text-sphera-green">Live</span> : le quiz en direct sur grand écran
            </h2>

            <p className="text-base md:text-lg text-sphera-text-muted leading-relaxed">
              Ne révisez plus jamais seuls. Projetez un quiz en amphi, lancez un défi en promo ou improvisez une session culture gé entre potes. Vos amis rejoignent avec un simple code sur smartphone, sans aucune inscription.
            </p>

            {/* Quick bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sphera-surface-2 border border-sphera-border text-sphera-green shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Rejoindre en 5s</h4>
                  <p className="text-xs text-sphera-text-muted">Un code à 6 lettres et un pseudo suffisent.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sphera-surface-2 border border-sphera-border text-sphera-green shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Timer & Sons live</h4>
                  <p className="text-xs text-sphera-text-muted">Adrénaline garantie avec chrono synchronisé.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sphera-surface-2 border border-sphera-border text-sphera-green shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Podium & Confettis</h4>
                  <p className="text-xs text-sphera-text-muted">Classement instantané après chaque réponse.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sphera-surface-2 border border-sphera-border text-sphera-green shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tous les sujets</h4>
                  <p className="text-xs text-sphera-text-muted">Cours, culture gé, ciné, sport ou manga.</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                to="/live"
                className="sphera-primary-btn text-sm px-6 py-3 flex items-center gap-2 group"
              >
                <Play className="w-4 h-4 fill-black" />
                Lancer une partie
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/sphera-live"
                className="btn btn-outline border-sphera-border text-white hover:border-sphera-green/50 hover:bg-sphera-surface-2 text-sm px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                En savoir plus
              </Link>
            </div>
          </div>

          {/* Right Visual / Mockup Column */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl border border-sphera-green/30 bg-sphera-surface-2 p-4 sm:p-6 shadow-[0_0_50px_rgba(34,197,94,0.12)]">
              
              {/* Fake Room Header */}
              <div className="flex items-center justify-between border-b border-sphera-border pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sphera-green/20 border border-sphera-green/40 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-sphera-green" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-sphera-green font-bold block">Salle d'attente live</span>
                    <h3 className="text-sm font-bold text-white">Quiz Culture & Sciences</h3>
                  </div>
                </div>

                <div className="bg-sphera-bg border border-sphera-border px-3 py-1.5 rounded-xl text-right">
                  <span className="text-[10px] text-sphera-text-muted block uppercase font-mono">Code PIN</span>
                  <span className="font-mono text-base font-extrabold text-sphera-green tracking-widest">LIVE88</span>
                </div>
              </div>

              {/* Question Simulation */}
              <div className="bg-sphera-bg rounded-2xl border border-sphera-border p-5 mb-5 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-sphera-text-muted mb-3 font-mono">
                  <span>Question 4 / 10</span>
                  <span className="text-sphera-green font-bold animate-pulse">08s restantes</span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white mb-4">
                  Quelle molécule transporte l'oxygène dans les hématies ?
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-red-500/20 text-red-400 flex items-center justify-center text-[10px]">A</span>
                    Insuline
                  </div>
                  <div className="p-3 rounded-xl bg-sphera-green/20 border-2 border-sphera-green text-white flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    <span className="w-5 h-5 rounded-md bg-sphera-green text-black flex items-center justify-center text-[10px] font-bold">B</span>
                    Hémoglobine
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">C</span>
                    Myosine
                  </div>
                  <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px]">D</span>
                    Collagène
                  </div>
                </div>
              </div>

              {/* Live Leaderboard Teaser */}
              <div className="bg-sphera-bg rounded-2xl border border-sphera-border p-4">
                <div className="flex items-center justify-between text-xs text-sphera-text-muted mb-3">
                  <span className="font-bold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Leaderboard en direct
                  </span>
                  <span>14 participants connectés</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-sphera-surface border border-yellow-500/30">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 font-bold flex items-center justify-center text-[11px]">1</span>
                      <span className="font-bold text-white">Alexandre D.</span>
                    </div>
                    <span className="font-mono font-bold text-sphera-green">3 420 pts</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-sphera-surface border border-sphera-border">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-500/20 text-slate-300 font-bold flex items-center justify-center text-[11px]">2</span>
                      <span className="font-medium text-white">Sarah N.</span>
                    </div>
                    <span className="font-mono font-bold text-sphera-green">3 180 pts</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-sphera-surface border border-sphera-border">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-700/20 text-amber-500 font-bold flex items-center justify-center text-[11px]">3</span>
                      <span className="font-medium text-white">Kevin T.</span>
                    </div>
                    <span className="font-mono font-bold text-sphera-green">2 950 pts</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
