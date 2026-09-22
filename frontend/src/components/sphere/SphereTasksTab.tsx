import { Suspense, lazy, useState } from "react";
import { Plus, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard, type KanbanTask } from "@/components/kanban/KanbanBoard";
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
        <h3 className="font-bold">Tableau Kanban</h3>
        {isVerifiedUser ? (
          <>
            <Button
              size="sm"
              className="campus-gradient text-white"
              onClick={() => setIsCreateTaskOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" /> Tâche
            </Button>
            {isCreateTaskOpen && (
              <Suspense fallback={<ModalLoadingFallback />}>
                <CreateTaskModal
                  open={isCreateTaskOpen}
                  onOpenChange={setIsCreateTaskOpen}
                  onTaskCreated={onTaskCreated}
                  sphereId={sphereId}
                  sphereMembers={members}
                />
              </Suspense>
            )}
          </>
        ) : (
          <Button
            size="sm"
            className="campus-gradient text-white"
            onClick={() => {
              toast({
                title: "Compte non certifié",
                description: "Certifiez votre compte pour créer des tâches.",
                variant: "destructive",
                action: (
                  <Button variant="outline" size="sm" onClick={() => openVerificationModal()}>
                    Vérifier
                  </Button>
                ),
              });
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Tâche
          </Button>
        )}
      </div>

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
              onCreateTask={() => {}}
              onDeleteTask={onDeleteTask}
              canModerate={canModerate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
