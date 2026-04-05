import { useState, useRef } from "react";
import { moveTask } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Zap, AlertTriangle, GripVertical, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type KanbanStatus = "todo" | "in_progress" | "review" | "done";

export interface KanbanTask {
  id: string;
  title: string;
  kanban_status: KanbanStatus;
  priority: "low" | "medium" | "high";
  due_date?: string | null;
  is_completed: boolean;
  isCompleted?: boolean;
  impact_points?: number;
  impactPoints?: number;
  assigned_to_info?: any;
  assignedTo?: string;
  assignedToAvatar?: string | null;
  is_overdue?: boolean;
  isOverdue?: boolean;
}

interface KanbanBoardProps {
  tasks: KanbanTask[];
  onTasksChange: (tasks: KanbanTask[]) => void;
  onCreateTask?: (col: KanbanStatus) => void;
  canModerate?: boolean;
}

const COLS: { id: KanbanStatus; label: string; color: string; bg: string; border: string }[] = [
  { id: "todo",        label: "À faire",     color: "text-slate-600",  bg: "bg-slate-50 dark:bg-slate-900/40",  border: "border-slate-200 dark:border-slate-700" },
  { id: "in_progress", label: "En cours",    color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20",    border: "border-blue-200 dark:border-blue-800"   },
  { id: "review",      label: "Révision",    color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/20",  border: "border-amber-200 dark:border-amber-800" },
  { id: "done",        label: "Terminé",     color: "text-green-600",  bg: "bg-green-50 dark:bg-green-900/20",  border: "border-green-200 dark:border-green-800" },
];

const PRIORITY: Record<string, { label: string; cls: string }> = {
  high:   { label: "Haute",   cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Moyenne", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  low:    { label: "Basse",   cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

export function KanbanBoard({ tasks, onTasksChange, onCreateTask, canModerate }: KanbanBoardProps) {
  const { toast } = useToast();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanStatus | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const dragRef = useRef<KanbanTask | null>(null);

  const colTasks = (id: KanbanStatus) => tasks.filter((t) => (t.kanban_status || "todo") === id);

  const handleDrop = async (target: KanbanStatus) => {
    const task = dragRef.current;
    setDraggingId(null);
    setDragOverCol(null);
    dragRef.current = null;
    if (!task || task.kanban_status === target) return;

    onTasksChange(tasks.map((t) =>
      t.id === task.id ? { ...t, kanban_status: target, is_completed: target === "done", isCompleted: target === "done" } : t
    ));

    setLoading((p) => ({ ...p, [task.id]: true }));
    try {
      await moveTask(task.id, target);
    } catch (e: any) {
      onTasksChange(tasks);
      toast({ title: "Erreur", description: e?.message || "Impossible de déplacer la tâche", variant: "destructive" });
    } finally {
      setLoading((p) => ({ ...p, [task.id]: false }));
    }
  };

  const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[480px] -mx-1 px-1">
      {COLS.map((col) => {
        const items = colTasks(col.id);
        const over = dragOverCol === col.id;
        return (
          <div
            key={col.id}
            className={cn("flex flex-col rounded-xl border flex-shrink-0 w-[260px] sm:w-72 transition-all", col.bg, col.border, over && "ring-2 ring-primary/40 scale-[1.01]")}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.id); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Header */}
            <div className={cn("flex items-center justify-between px-3 py-2 border-b", col.border)}>
              <div className="flex items-center gap-2">
                <span className={cn("font-semibold text-sm", col.color)}>{col.label}</span>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full border font-medium", col.color, col.border)}>{items.length}</span>
              </div>
              {onCreateTask && canModerate && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50 hover:opacity-100" onClick={() => onCreateTask(col.id)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Cards */}
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {items.length === 0 && (
                <div className={cn("rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground", col.border, over && "border-primary/50 bg-primary/5")}>
                  {over ? "Déposer ici" : "Vide"}
                </div>
              )}
              {items.map((task) => {
                const overdue = (task.is_overdue || task.isOverdue) && col.id !== "done";
                const name = task.assigned_to_info?.name || task.assigned_to_info?.full_name || task.assignedTo || null;
                const avatar = task.assigned_to_info?.avatar || task.assignedToAvatar || null;
                const pts = task.impact_points ?? task.impactPoints ?? 0;
                const pri = PRIORITY[task.priority] || PRIORITY.medium;

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => { setDraggingId(task.id); dragRef.current = task; }}
                    onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                    className={cn(
                      "bg-card rounded-lg border p-2.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all group",
                      draggingId === task.id && "opacity-40 scale-95",
                      loading[task.id] && "opacity-60 pointer-events-none",
                      overdue && "border-red-300 dark:border-red-800"
                    )}
                  >
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 mt-0.5 flex-shrink-0 group-hover:text-muted-foreground/60" />
                      <p className={cn("text-sm font-medium leading-snug flex-1", col.id === "done" && "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", pri.cls)}>{pri.label}</span>
                      {overdue && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />En retard
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      {name && (
                        <div className="flex items-center gap-1 min-w-0">
                          <Avatar className="h-5 w-5 flex-shrink-0">
                            <AvatarImage src={avatar ?? undefined} />
                            <AvatarFallback className="text-[9px]">{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">{name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                        {task.due_date && (
                          <span className={cn("text-[10px] flex items-center gap-0.5", overdue ? "text-red-500" : "text-muted-foreground")}>
                            <Calendar className="h-2.5 w-2.5" />{fmt(task.due_date)}
                          </span>
                        )}
                        {pts > 0 && (
                          <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                            <Zap className="h-2.5 w-2.5" />{pts}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
