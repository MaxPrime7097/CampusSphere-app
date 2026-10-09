import { Suspense, lazy, useState } from "react";
import { Plus, Shield, WarningCircle as AlertCircle, Spinner as Loader2, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard, type KanbanTask, type KanbanStatus } from "@/components/kanban/KanbanBoard";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";
import { openVerificationModal } from "@/lib/events";
import { useToast } from "@/hooks/use-toast";

const CreateTaskModal = lazy(() =>
  import("@/components/modals/CreateTaskModal").then((module) => ({
    default: module.CreateTaskModal,
  }))
);

interface SphereTasksTabProps {
  sphereId: string;
  hasKanban: boolean;
  taskState: "ready" | "forbidden" | "server_error";
  tasks: KanbanTask[];
  onTasksChange: (tasks: KanbanTask[]) => void;
  onDeleteTask: (taskId: string) => void;
  canModerate: boolean;
  isVerifiedUser: boolean;
  members: any[];
  onTaskCreated: () => void;
}

export function SphereTasksTab({
  sphereId,
  hasKanban,
  taskState,
  tasks,
  onTasksChange,
  onDeleteTask,
  canModerate,
  isVerifiedUser,
  members,
  onTaskCreated,
}: SphereTasksTabProps) {
  const { toast } = useToast();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskColumn, setCreateTaskColumn] = useState<KanbanStatus>("todo");
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentTaskSuccess, setRecentTaskSuccess] = useState<string | null>(null);

  const handleTaskCreatedInternal = async (createdTask?: any) => {
    setIsSyncing(true);
    const title = createdTask?.title || "Nouvelle tâche";
    setRecentTaskSuccess(title);
    try {
      await onTaskCreated();
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
      setTimeout(() => setRecentTaskSuccess(null), 4500);
    }
  };

  const handleOpenCreateTask = (col: KanbanStatus = "todo") => {
    if (!isVerifiedUser) {
      toast({
        title: "Compte non certifié",
        description: "Votre période d'accès découverte de 24h a expiré. Certifiez votre compte pour créer des tâches.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
            Vérifier
          </Button>
        ),
      });
      return;
    }
    setCreateTaskColumn(col);
    setIsCreateTaskOpen(true);
  };

  if (!hasKanban) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Le Kanban n'est pas disponible pour ce type de sphère.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center bg-card p-3 md:p-4 rounded-lg border mb-4">
        <h3 className="font-bold flex items-center gap-2">
          <span>Tableau Kanban</span>
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
          {isSyncing && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        </h3>
        <Button
          size="sm"
          className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
          onClick={() => handleOpenCreateTask("todo")}
        >
          <Plus className="mr-1 h-4 w-4" /> Tâche
        </Button>
        {isCreateTaskOpen && (
          <Suspense fallback={<ModalLoadingFallback />}>
            <CreateTaskModal
              open={isCreateTaskOpen}
              onOpenChange={setIsCreateTaskOpen}
              onTaskCreated={handleTaskCreatedInternal}
              sphereId={sphereId}
              sphereMembers={members}
              initialStatus={createTaskColumn}
            />
          </Suspense>
        )}
      </div>

      {isSyncing && (
        <div className="mb-4 p-3 border border-primary/40 bg-primary/5 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-primary font-medium animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span>Création & enregistrement de la tâche... Synchronisation du Kanban.</span>
        </div>
      )}

      {!isSyncing && recentTaskSuccess && (
        <div className="mb-4 p-3 border border-emerald-500/40 bg-emerald-500/10 rounded-xl flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Tâche &quot;{recentTaskSuccess}&quot; ajoutée avec succès au tableau !
          </span>
          <button
            type="button"
            onClick={() => setRecentTaskSuccess(null)}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {taskState === "forbidden" && (
        <EmptyState
          icon={Shield}
          title="Accès restreint"
          description="Vous devez être membre actif pour voir les tâches de cette sphère."
        />
      )}

      {taskState === "server_error" && (
        <EmptyState
          icon={AlertCircle}
          title="Erreur"
          description="Impossible de charger les tâches."
        />
      )}

      {taskState === "ready" && (
        <div className="-mx-4 md:mx-0 overflow-x-auto">
          <div className="px-4 md:px-0 min-w-0">
            <KanbanBoard
              tasks={tasks}
              onTasksChange={onTasksChange}
              onCreateTask={(col) => handleOpenCreateTask(col)}
              onDeleteTask={onDeleteTask}
              canModerate={canModerate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
