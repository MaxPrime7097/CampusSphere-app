import React, { useRef, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type Edge,
  type ReactFlowInstance,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { LocateFixed, GitFork, Sparkles } from "lucide-react";
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
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-bold text-sm sm:text-base text-foreground">
              {data.noeud_central || data.titre}
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
        padding: "14px 20px",
        boxShadow: "0 10px 25px -5px rgba(34, 197, 94, 0.2)",
        minWidth: 160,
        textAlign: "center",
      },
    });

    const branches = data.branches || [];
    const branchCount = branches.length;
    const angleStep = branchCount > 0 ? (2 * Math.PI) / branchCount : 0;
    const radius = 280;

    branches.forEach((branch, i) => {
      const angle = i * angleStep;
      const bx = centerX + radius * Math.cos(angle);
      const by = centerY + radius * Math.sin(angle);
      const branchId = `branch-${i}`;
      const color = COULEURS[branch.couleur?.toLowerCase()] || COULEURS.vert;

      nodesList.push({
        id: branchId,
        data: {
          label: (
            <div className="flex items-center gap-1.5 font-medium text-xs sm:text-sm text-foreground">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span>{branch.label}</span>
            </div>
          ),
        },
        position: { x: bx, y: by },
        style: {
          background: "var(--card)",
          border: `2px solid ${color}`,
          borderRadius: "10px",
          padding: "10px 16px",
          boxShadow: `0 4px 14px 0 ${color}25`,
          maxWidth: 220,
        },
      });

      edgesList.push({
        id: `e-central-${branchId}`,
        source: "central",
        target: branchId,
        animated: true,
        style: { stroke: color, strokeWidth: 2 },
      });

      // Sub-branches
      const subBranches = branch.sous_branches || [];
      const subCount = subBranches.length;
      const subSpread = 0.35;

      subBranches.forEach((sb, j) => {
        const subId = `${branchId}-sub-${j}`;
        const subAngle = angle + (j - (subCount - 1) / 2) * subSpread;
        const subRadius = radius + 170;
        const sx = centerX + subRadius * Math.cos(subAngle);
        const sy = centerY + subRadius * Math.sin(subAngle);

        nodesList.push({
          id: subId,
          data: {
            label: (
              <span className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
                {sb.label}
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
          },
        });

        edgesList.push({
          id: `e-${branchId}-${subId}`,
          source: branchId,
          target: subId,
          style: { stroke: `${color}66`, strokeWidth: 1.5 },
        });
      });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [data]);

  const handleRecenter = () => {
    reactFlowInstance.current?.fitView({ padding: 0.2, duration: 400 });
  };

  return (
    <div className="relative w-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Top action header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/60 backdrop-blur-sm z-10 relative">
        <div className="flex items-center gap-2">
          <GitFork className="w-5 h-5 text-emerald-500" />
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground leading-none">
              {data.titre || "Carte mentale"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Navigation libre (glisser pour déplacer, molette ou pincement pour zoomer)
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRecenter}
          className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          Centrer la vue
        </Button>
      </div>

      {/* Canvas container */}
      <div className="h-[650px] w-full bg-muted/20">
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
      </div>
    </div>
  );
};

export default MindMapView;
