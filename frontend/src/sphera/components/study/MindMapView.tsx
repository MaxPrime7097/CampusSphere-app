import React, { useRef, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type ReactFlowInstance,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { LocateFixed, GitFork, Sparkles, FolderPlus, FolderMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MindMapContent } from "../../types/sphera.types";

interface MindMapViewProps {
  data: MindMapContent;
}

const COULEURS: Record<string, string> = {
  vert: "#22C55E",
  bleu: "#3B82F6",
  orange: "#F97316",
  violet: "#A855F7",
  rose: "#EC4899",
};

export const MindMapView: React.FC<MindMapViewProps> = ({ data }) => {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [collapsedBranches, setCollapsedBranches] = useState<Record<number, boolean>>({});

  const branches = data?.branches || [];

  const toggleBranch = (idx: number) => {
    setCollapsedBranches((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const expandAll = () => {
    setCollapsedBranches({});
    setTimeout(() => {
      reactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
    }, 50);
  };

  const collapseAll = () => {
    const all: Record<number, boolean> = {};
    branches.forEach((_, i) => {
      all[i] = true;
    });
    setCollapsedBranches(all);
    setTimeout(() => {
      reactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
    }, 50);
  };

  const handleRecenter = () => {
    reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 });
  };

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (node.id.startsWith("branch-")) {
      const idx = parseInt(node.id.replace("branch-", ""), 10);
      if (!isNaN(idx)) {
        toggleBranch(idx);
      }
    } else if (node.id === "central") {
      const anyCollapsed = branches.some((_, i) => collapsedBranches[i]);
      if (anyCollapsed) {
        expandAll();
      } else {
        collapseAll();
      }
    }
  };

  const { nodes, edges } = useMemo(() => {
    const nodesList: Node[] = [];
    const edgesList: Edge[] = [];

    const centerX = 500;
    const centerY = 350;

    // Central Node
    nodesList.push({
      id: "central",
      data: {
        label: (
          <div className="flex flex-col items-center justify-center p-2 text-center select-none cursor-pointer">
            <span className="font-bold text-sm sm:text-base text-foreground leading-snug">
              {data.noeud_central || data.titre}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">
              {branches.length} thèmes · Cliquer pour tout plier/déplier
            </span>
          </div>
        ),
      },
      position: { x: centerX, y: centerY },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: "var(--card)",
        border: "2px solid #22C55E",
        borderRadius: "14px",
        padding: "10px 16px",
        boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.25)",
        minWidth: 170,
        maxWidth: 260,
        textAlign: "center",
        cursor: "pointer",
        zIndex: 10,
      },
    });

    const branchCount = branches.length;
    if (branchCount === 0) return { nodes: nodesList, edges: edgesList };

    const angleStep = (2 * Math.PI) / branchCount;
    const radius = Math.max(280, 240 + branchCount * 10);

    branches.forEach((branch, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const bx = centerX + radius * Math.cos(angle);
      const by = centerY + radius * Math.sin(angle);
      const branchId = `branch-${i}`;
      const color = COULEURS[branch.couleur?.toLowerCase()] || COULEURS.vert;

      const subBranches = branch.sous_branches || [];
      const subCount = subBranches.length;
      const isCollapsed = Boolean(collapsedBranches[i]);

      nodesList.push({
        id: branchId,
        data: {
          label: (
            <div className="flex flex-col gap-1 select-none cursor-pointer">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-xs sm:text-sm text-foreground leading-tight truncate">
                    {branch.label}
                  </span>
                </div>
                {subCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBranch(i);
                    }}
                    className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-bold transition-all border flex items-center gap-1 ${
                      isCollapsed
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                    title={isCollapsed ? "Déplier les sous-concepts" : "Replier les sous-concepts"}
                  >
                    <span>{isCollapsed ? `+ ${subCount}` : `- ${subCount}`}</span>
                  </button>
                )}
              </div>
              {subCount > 0 && (
                <div className="text-[10px] text-muted-foreground pl-4 font-mono">
                  {isCollapsed ? "Cliquer pour déplier" : `${subCount} sous-concepts`}
                </div>
              )}
            </div>
          ),
        },
        position: { x: bx, y: by },
        style: {
          background: "var(--card)",
          border: `2px solid ${color}`,
          borderRadius: "12px",
          padding: "10px 14px",
          boxShadow: isCollapsed ? `0 4px 14px 0 ${color}25` : `0 6px 20px 0 ${color}35`,
          minWidth: 170,
          maxWidth: 240,
          cursor: "pointer",
          zIndex: 5,
        },
      });

      edgesList.push({
        id: `e-central-${branchId}`,
        source: "central",
        target: branchId,
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
      });

      // Sub-branches (rendered only if not collapsed)
      if (!isCollapsed && subCount > 0) {
        const subRadius = radius + 175;
        const subSpread = 0.35;

        subBranches.forEach((sb: any, j: number) => {
          const subId = `${branchId}-sub-${j}`;
          const subAngle = angle + (j - (subCount - 1) / 2) * subSpread;
          const sx = centerX + subRadius * Math.cos(subAngle);
          const sy = centerY + subRadius * Math.sin(subAngle);
          const subLabel = typeof sb === "string" ? sb : sb?.label || "";

          nodesList.push({
            id: subId,
            data: {
              label: (
                <span className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                  {subLabel}
                </span>
              ),
            },
            position: { x: sx, y: sy },
            style: {
              background: "var(--muted)",
              border: `1px solid ${color}66`,
              borderRadius: "8px",
              padding: "8px 12px",
              maxWidth: 190,
              zIndex: 2,
            },
          });

          edgesList.push({
            id: `e-${branchId}-${subId}`,
            source: branchId,
            target: subId,
            style: { stroke: `${color}66`, strokeWidth: 1.5 },
          });
        });
      }
    });

    return { nodes: nodesList, edges: edgesList };
  }, [data, collapsedBranches]);

  return (
    <div className="relative w-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Top action header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border bg-card/60 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-2">
          <GitFork className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-none">
              {data.titre || "Carte mentale"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Cliquer sur un nœud pour le plier/déplier · Molette ou glisser pour naviguer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="gap-1 text-xs text-muted-foreground hover:text-foreground border-border"
            title="Tout déplier"
          >
            <FolderPlus className="w-3.5 h-3.5 text-emerald-500" />
            Tout déplier
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="gap-1 text-xs text-muted-foreground hover:text-foreground border-border"
            title="Tout replier"
          >
            <FolderMinus className="w-3.5 h-3.5 text-orange-500" />
            Tout replier
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRecenter}
            className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            title="Recentrer la carte mentale"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            Centrer la vue
          </Button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative h-[650px] w-full bg-muted/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          onInit={(instance) => {
            reactFlowInstance.current = instance;
          }}
          panOnDrag={true}
          zoomOnPinch={true}
          zoomOnScroll={true}
          zoomOnDoubleClick={true}
          minZoom={0.2}
          maxZoom={2.5}
          preventScrolling={true}
        >
          <Background color="currentColor" className="text-border/40" gap={20} size={1} />
          <Controls showInteractive={false} className="bg-card border-border rounded-lg" />
        </ReactFlow>

        {/* Floating guidance helper pill */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-[11px] text-muted-foreground bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Cliquer sur un nœud pour le plier ou le déplier</span>
        </div>
      </div>
    </div>
  );
};

export default MindMapView;
