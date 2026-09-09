import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle,rgba(34,197,94,0.06)_0%,transparent_70%)] blur-3xl -z-10 pointer-events-none" />
      
      <div className="container mx-auto max-w-5xl px-4 text-center flex flex-col items-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sphera-border bg-sphera-surface/50 backdrop-blur-md mb-8 animate-in" style={{ animationDelay: '0ms' }}>
          <span>Powered by</span>
          <a href="https://campussphere.app" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cs-orange transition-colors">
            CampusSphere
          </a>
        </div>

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 animate-in" style={{ animationDelay: '100ms' }}>
          Transforme n'importe quel cours en <br className="hidden md:block" />
          <span className="bg-gradient-to-br from-green-400 to-sphera-green bg-clip-text text-transparent">
            révision intelligente
          </span>
        </h1>

        <p className="text-lg md:text-xl text-sphera-text-muted max-w-2xl mb-10 leading-relaxed font-light animate-in" style={{ animationDelay: '200ms' }}>
          Upload ton cours PDF. Sphera génère ta fiche de révision, quiz, flashcards et corrige tes annales en secondes.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in" style={{ animationDelay: '300ms' }}>
          <Link to="/app" className="sphera-primary-btn text-lg px-8 py-3.5 w-full sm:w-auto flex items-center justify-center gap-2 group">
            Essayer gratuitement
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/login" className="btn btn-outline border-sphera-border text-white hover:bg-sphera-surface px-8 py-3.5 rounded-lg font-semibold w-full sm:w-auto">
            Se connecter
          </Link>
        </div>

        {/* Mockup Image Area */}
        <div className="mt-16 w-full max-w-5xl relative animate-in" style={{ animationDelay: '400ms' }}>
          <div className="absolute inset-0 bg-gradient-to-t from-sphera-bg via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-sphera-border bg-sphera-surface-2 p-2 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
            <div className="rounded-xl overflow-hidden bg-sphera-bg border border-sphera-border/50 h-[400px] md:h-[500px] relative text-left flex flex-col">
              
              {/* Fake UI Header */}
              <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-surface/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-sphera-surface border border-sphera-border text-xs text-sphera-text-muted">
                    <FileText className="w-3.5 h-3.5" /> neurobiologie_chap1.pdf
                  </div>
                </div>

                <div className="flex gap-1 bg-sphera-bg p-1 rounded-md border border-sphera-border">
                  <div className="px-3 py-1.5 rounded text-xs font-semibold bg-sphera-surface text-white shadow-sm">Fiche</div>
                  <div className="px-3 py-1.5 rounded text-xs font-semibold text-sphera-text-muted hidden sm:block">Quiz</div>
                  <div className="px-3 py-1.5 rounded text-xs font-semibold text-sphera-text-muted flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Q&A
                  </div>
                </div>
              </div>

              {/* Fake UI Content */}
              <div className="flex-1 relative flex">
                {/* Background grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
                
                {/* Left: PDF Preview (Hidden on mobile) */}
                <div className="hidden md:flex w-[35%] border-r border-sphera-border bg-sphera-bg/50 relative z-10 p-6 flex-col items-center">
                  <div className="w-full aspect-[1/1.4] bg-white rounded shadow-sm border border-gray-200 p-4 opacity-70">
                    <div className="h-4 w-3/4 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gray-100 rounded"></div>
                      <div className="h-2 w-full bg-gray-100 rounded"></div>
                      <div className="h-2 w-5/6 bg-gray-100 rounded"></div>
                      <div className="h-2 w-full bg-gray-100 rounded"></div>
                      <div className="h-2 w-4/5 bg-gray-100 rounded"></div>
                    </div>
                    <div className="mt-6 w-full h-24 bg-gray-100 rounded flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="h-2 w-full bg-gray-100 rounded"></div>
                      <div className="h-2 w-5/6 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Right: AI Output */}
                <div className="flex-1 p-6 md:p-8 relative z-10 overflow-hidden">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sphera-green/10 text-sphera-green border border-sphera-green/20 text-xs font-bold mb-4">
                      <Sparkles className="w-3.5 h-3.5" /> Fiche générée en 12s
                    </div>
                    
                    <h3 className="text-2xl font-display font-bold text-white mb-2">Le Système Nerveux Central</h3>
                    <p className="text-sm text-sphera-text-muted mb-6 leading-relaxed">
                      Centre d'intégration et de traitement de l'information. Il est composé de deux éléments principaux : l'encéphale et la moelle épinière.
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border border-l-4 border-l-sphera-green">
                        <h4 className="text-sm font-bold text-white mb-1">Concept Clé : Les Synapses</h4>
                        <p className="text-xs text-sphera-text-muted leading-relaxed">
                          Zone de communication entre deux neurones. Le signal électrique est converti en signal chimique (neurotransmetteurs) pour franchir la fente synaptique.
                        </p>
                      </div>

                      {/* Mock Formules */}
                      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <span className="text-[10px] font-bold">ƒ(x)</span>
                          </div>
                          <h4 className="text-sm font-bold text-blue-400">Potentiel d'action</h4>
                        </div>
                        <div className="bg-sphera-bg border border-sphera-border p-3 rounded-lg text-center font-mono text-sm text-white">
                          V_m(t) = V_rest + ΔV(t)
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Gradient overlay to fade bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-sphera-bg to-transparent z-20 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

import { FileText, MessageSquare } from 'lucide-react'
