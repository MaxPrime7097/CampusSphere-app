import React from 'react'
import { CheckCircle as CheckCircle2, CaretRight as ChevronRight, Warning as AlertTriangle } from "@phosphor-icons/react";

interface AnnaleResultProps {
  data: any;
  mode?: 'complete' | 'rapide';
}

export function AnnaleResult({ data, mode = 'complete' }: AnnaleResultProps) {
  const annale = data?.corrections ? data : {
    corrections: [
      {
        question: "Exercice 1 - Question 1.a : Démontrer que la fonction est continue.",
        reponse: "Pour démontrer la continuité, il faut vérifier que la limite de f(x) quand x tend vers a est égale à f(a).",
        explication: "Dans ce cas précis, on utilise le théorème des gendarmes car la fonction est encadrée par deux fonctions tendant vers la même limite.",
        points_cles: ["Théorème des gendarmes", "Limites à gauche et à droite"]
      },
      {
        question: "Exercice 1 - Question 1.b : Calculer la dérivée.",
        reponse: "f'(x) = 2x + cos(x)",
        explication: "On applique la règle de dérivation d'une somme : (u+v)' = u' + v'.",
        points_cles: ["Dérivée usuelles", "Linéarité"]
      }
    ]
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Info */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-sphera-surface-2 border border-sphera-border">
        <div className="w-10 h-10 rounded-full bg-sphera-green/10 flex items-center justify-center text-sphera-green">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-white font-medium">Correction générée</h3>
          <p className="text-sm text-sphera-text-muted">
            Mode : {mode === 'complete' ? 'Complète (avec explications)' : 'Rapide (réponses directes)'}
          </p>
        </div>
      </div>

      {/* Corrections List */}
      <div className="space-y-6">
        {annale.corrections.map((corr: any, idx: number) => (
          <div key={idx} className="rounded-2xl bg-sphera-surface border border-sphera-border overflow-hidden">
            
            {/* Question */}
            <div className="p-5 border-b border-sphera-border bg-sphera-surface-2/50">
              <h4 className="font-display font-semibold text-white flex items-start gap-3">
                <span className="text-sphera-green shrink-0 mt-0.5">Q{idx + 1}.</span>
                {corr.question}
              </h4>
            </div>

            {/* Answer */}
            <div className="p-5">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-sphera-text-muted mb-2 block">Réponse</span>
                <p className="text-white leading-relaxed">{corr.reponse}</p>
              </div>

              {mode === 'complete' && corr.explication && (
                <div className="mt-4 p-4 rounded-xl bg-sphera-bg border border-sphera-border/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-sphera-text-muted mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> Explication détaillée
                  </span>
                  <p className="text-sm text-sphera-text-muted leading-relaxed">{corr.explication}</p>
                  
                  {corr.points_cles && corr.points_cles.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {corr.points_cles.map((pt: string, i: number) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-sphera-surface-2 border border-sphera-border text-xs text-white">
                          {pt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
          </div>
        ))}
      </div>

    </div>
  )
}
