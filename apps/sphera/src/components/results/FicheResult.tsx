import React, { useState } from 'react'
import { CaretDown as ChevronDown, FileText } from "@phosphor-icons/react";

interface FicheResultProps {
  data: any;
}

export function FicheResult({ data }: FicheResultProps) {
  // Assuming a generic structure for now: 
  // { resume: string, points_cles: string[], definitions: {term: string, desc: string}[], a_retenir: string }
  
  const [openDefs, setOpenDefs] = useState<number[]>([])

  const toggleDef = (idx: number) => {
    setOpenDefs(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  // Fallback data if data is empty (for UI testing)
  const fiche = data?.resume ? data : {
    resume: "Ce document aborde les concepts fondamentaux de la matière, en mettant l'accent sur les mécanismes principaux et leurs applications pratiques.",
    points_cles: [
      "Comprendre les bases du système",
      "Identifier les variables critiques",
      "Savoir appliquer les formules dans un contexte réel"
    ],
    definitions: [
      { term: "Concept A", desc: "Définition détaillée du concept A avec ses implications." },
      { term: "Concept B", desc: "Principe fondamental régissant le comportement du système." }
    ],
    a_retenir: "La maîtrise des définitions est essentielle pour réussir l'examen final."
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Résumé section */}
      <section>
        <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-sphera-green" /> Résumé
        </h3>
        <div className="p-5 rounded-xl bg-sphera-surface border border-sphera-border text-sphera-text-muted leading-relaxed">
          {fiche.resume}
        </div>
      </section>

      {/* Points Clés */}
      <section>
        <h3 className="font-display text-xl font-bold text-white mb-4">Points clés</h3>
        <ul className="space-y-3">
          {fiche.points_cles.map((pt: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-sphera-surface-2 border border-sphera-border">
              <div className="w-6 h-6 rounded-full bg-sphera-green/10 text-sphera-green flex items-center justify-center shrink-0 font-bold text-sm">
                {idx + 1}
              </div>
              <span className="text-white/90">{pt}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Définitions (Accordion style) */}
      <section>
        <h3 className="font-display text-xl font-bold text-white mb-4">Définitions importantes</h3>
        <div className="space-y-2">
          {fiche.definitions.map((def: any, idx: number) => (
            <div key={idx} className="rounded-xl border border-sphera-border overflow-hidden bg-sphera-surface transition-all">
              <button 
                onClick={() => toggleDef(idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-sphera-surface-2 transition-colors"
              >
                <span className="font-semibold text-white">{def.term}</span>
                <ChevronDown className={`w-5 h-5 text-sphera-text-muted transition-transform ${openDefs.includes(idx) ? 'rotate-180' : ''}`} />
              </button>
              {openDefs.includes(idx) && (
                <div className="p-4 pt-0 text-sphera-text-muted border-t border-sphera-border/50 bg-sphera-bg/50">
                  <p className="mt-4">{def.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* À retenir */}
      <section>
        <div className="p-6 rounded-xl bg-gradient-to-br from-sphera-green/20 to-sphera-green/5 border border-sphera-green/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <SparklesIcon className="w-24 h-24 text-sphera-green" />
          </div>
          <h3 className="font-display text-lg font-bold text-sphera-green mb-2 relative z-10">À retenir</h3>
          <p className="text-white/90 relative z-10 leading-relaxed font-medium">
            {fiche.a_retenir}
          </p>
        </div>
      </section>

    </div>
  )
}

function SparklesIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19"/>
    </svg>
  )
}
