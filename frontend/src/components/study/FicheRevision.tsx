import React from "react";
import { CheckCircle2, BookOpen, Key, Calculator, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FicheData {
  titre: string;
  resume: string;
  points_cles: string[];
  definitions: { terme: string; definition: string }[];
  formules: string[];
  a_retenir: string[];
}

interface FicheRevisionProps {
  data: FicheData;
}

export const FicheRevision: React.FC<FicheRevisionProps> = ({ data }) => {
  const [openDef, setOpenDef] = React.useState<number | null>(null);

  return (
    <div className="space-y-5 text-sm">
      {/* Titre */}
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <BookOpen className="h-5 w-5 text-orange-500 flex-shrink-0" />
        <h2 className="font-bold text-base text-foreground leading-snug">{data.titre}</h2>
      </div>

      {/* Résumé */}
      {data.resume && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
          <p className="text-muted-foreground leading-relaxed">{data.resume}</p>
        </div>
      )}

      {/* Points clés */}
      {data.points_cles?.length > 0 && (
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-orange-500" />
            Points clés
          </h3>
          <ul className="space-y-2">
            {data.points_cles.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                <span className="text-muted-foreground leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Définitions */}
      {data.definitions?.length > 0 && (
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-orange-500" />
            Définitions
          </h3>
          <div className="space-y-2">
            {data.definitions.map((def, i) => (
              <div
                key={i}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenDef(openDef === i ? null : i)}
                >
                  <span className="font-medium text-foreground">{def.terme}</span>
                  <span className="text-orange-500 text-lg leading-none select-none">
                    {openDef === i ? "−" : "+"}
                  </span>
                </button>
                {openDef === i && (
                  <div className="px-4 pb-3 pt-1 bg-muted/20 border-t border-border text-muted-foreground leading-relaxed">
                    {def.definition}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formules */}
      {data.formules?.length > 0 && (
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-orange-500" />
            Formules
          </h3>
          <div className="space-y-2">
            {data.formules.map((formule, i) => (
              <div
                key={i}
                className="bg-zinc-900 dark:bg-zinc-950 text-orange-300 font-mono text-xs rounded-lg px-4 py-2.5 border border-zinc-700"
              >
                {formule}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* À retenir */}
      {data.a_retenir?.length > 0 && (
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-orange-500" />
            À retenir
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.a_retenir.map((tip, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20 px-3 py-1 text-xs font-normal"
              >
                💡 {tip}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
