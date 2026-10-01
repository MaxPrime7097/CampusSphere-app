import React from "react";
import { Question as HelpCircle, AlignLeft, Sparkle as Sparkles, Brain as BrainCircuit, type Icon as LucideIcon } from "@phosphor-icons/react";

export interface ChatCommand {
  trigger: string;
  label: string;
  icon: LucideIcon;
  description: string;
  template: string;
  prefix: string;
}

export const CHAT_COMMANDS: ChatCommand[] = [
  {
    trigger: "@expliquer",
    label: "Expliquer une notion",
    icon: HelpCircle,
    description: "Explication pédagogique et détaillée pas à pas",
    template: "@expliquer ",
    prefix: "Explique-moi de façon très claire, structurée et pédagogique : ",
  },
  {
    trigger: "@résumer",
    label: "Résumer un point",
    icon: AlignLeft,
    description: "Synthèse concise et structurée",
    template: "@résumer ",
    prefix: "Fais-moi un résumé concis et percutant de : ",
  },
  {
    trigger: "@exemple",
    label: "Exemple concret",
    icon: Sparkles,
    description: "Cas pratique ou mise en situation d'examen",
    template: "@exemple ",
    prefix: "Donne-moi un exemple concret et parlant pour illustrer : ",
  },
  {
    trigger: "@quiz",
    label: "Question de test",
    icon: BrainCircuit,
    description: "Pose-moi une question pour tester ma compréhension",
    template: "@quiz ",
    prefix: "Pose-moi une question d'entraînement sur le cours concernant : ",
  },
];

interface CommandMenuProps {
  isVisible: boolean;
  filter: string;
  activeIndex: number;
  onSelect: (command: ChatCommand) => void;
  onClose: () => void;
}

export function CommandMenu({ isVisible, filter, activeIndex, onSelect, onClose }: CommandMenuProps) {
  if (!isVisible) return null;

  const search = filter.toLowerCase().trim();
  const filtered = CHAT_COMMANDS.filter(
    (cmd) =>
      cmd.trigger.toLowerCase().includes(search) ||
      cmd.label.toLowerCase().includes(search) ||
      cmd.description.toLowerCase().includes(search)
  );

  if (!filtered.length) return null;

  return (
    <div className="absolute bottom-full left-3 sm:left-5 right-3 sm:right-auto sm:w-80 mb-2 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between bg-muted/40">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
          Commandes Rapides
        </p>
        <span className="text-[10px] text-muted-foreground/60">
          ↑↓ naviguer • Entrée valider
        </span>
      </div>
      <div className="max-h-60 overflow-y-auto divide-y divide-border/30">
        {filtered.map((cmd, idx) => {
          const Icon = cmd.icon;
          const isActive = idx === activeIndex;
          return (
            <button
              key={cmd.trigger}
              type="button"
              onClick={() => {
                onSelect(cmd);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${
                isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{cmd.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{cmd.description}</p>
              </div>
              <span className="text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {cmd.trigger}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
