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
        <BookOpen className="h-5 w-5 text-[#ff9800] flex-shrink-0" />
        <h2 className="font-bold text-base text-foreground leading-snug">{data.titre}</h2>
      </div>

      {/* Résumé */}
      {data.resume && (
        <div className="bg-[#ff9800]/5 border border-[#ff9800]/20 rounded-xl p-4">
          <p className="text-muted-foreground leading-relaxed">{data.resume}</p>
        </div>
      )}

      {/* Points clés */}
      {data.points_cles?.length > 0 && (
        <section>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#ff9800]" />
            Points clés
          </h3>
          <ul className="space-y-2">
            {data.points_cles.map((point, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-[#ff9800]/15 text-[#ff9800] dark:text-[#ff9800]/80 flex items-center justify-center text-[10px] font-bold">
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
            <Key className="h-4 w-4 text-[#ff9800]" />
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
                  <span className="text-[#ff9800] text-lg leading-none select-none">
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
            <Calculator className="h-4 w-4 text-[#ff9800]" />
            Formules
          </h3>
          <div className="space-y-2">
            {data.formules.map((formule, i) => (
              <div
                key={i}
                className="bg-zinc-900 dark:bg-zinc-950 text-[#ff9800]/70 font-mono text-xs rounded-lg px-4 py-2.5 border border-zinc-700"
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
            <Lightbulb className="h-4 w-4 text-[#ff9800]" />
            À retenir
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.a_retenir.map((tip, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-[#ff9800]/10 text-[#ff9800] dark:text-[#ff9800]/70 border-[#ff9800]/20 px-3 py-1 text-xs font-normal"
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
