import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Folder,
  FolderPlus,
  Plus,
  Spinner as Loader2,
  Check,
  Lock,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  listFolders,
  createFolder,
  addResourceToFolder,
  removeResourceFromFolder,
  getUserResourceFolders,
  type ResourceFolder,
} from "@/services/api";
import { cn } from "@/lib/utils";

const MAX_FOLDERS = 10;
const MAX_RESOURCES_PER_FOLDER = 50;

interface AddToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string | number;
  resourceTitle?: string;
}

export function AddToFolderModal({
  isOpen,
  onClose,
  resourceId,
  resourceTitle,
}: AddToFolderModalProps) {
  const { t } = useTranslation("resources");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<number>>(new Set());
  const [togglingFolderId, setTogglingFolderId] = useState<number | null>(null);

  // Quick inline creation state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // 1. Fetch user's folders
  const foldersQuery = useQuery({
    queryKey: ["resource-folders"],
    queryFn: () => listFolders(),
    enabled: isOpen && Boolean(user?.id),
    staleTime: 60 * 1000,
  });

  // 2. Fetch which of the user's folders currently contain this resource
  const resourceFoldersQuery = useQuery({
    queryKey: ["user-resource-folders", String(resourceId)],
    queryFn: () => getUserResourceFolders(resourceId),
    enabled: isOpen && Boolean(user?.id) && Boolean(resourceId),
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (resourceFoldersQuery.data) {
      setSelectedFolderIds(new Set(resourceFoldersQuery.data));
    }
  }, [resourceFoldersQuery.data]);

  const folders: ResourceFolder[] = foldersQuery.data || [];
  const isLoading = foldersQuery.isLoading || resourceFoldersQuery.isLoading;

  const handleToggle = async (folder: ResourceFolder) => {
    const fId = Number(folder.id);
    const isCurrentlyIn = selectedFolderIds.has(fId);

    if (!isCurrentlyIn && (folder.resource_count || 0) >= MAX_RESOURCES_PER_FOLDER) {
      toast({
        title: "Dossier plein",
        description: `Ce dossier contient déjà le maximum de ${MAX_RESOURCES_PER_FOLDER} ressources.`,
        variant: "destructive",
      });
      return;
    }

    setTogglingFolderId(fId);
    try {
      if (isCurrentlyIn) {
        await removeResourceFromFolder(fId, resourceId);
        setSelectedFolderIds((prev) => {
          const next = new Set(prev);
          next.delete(fId);
          return next;
        });
        toast({
          title: "Retiré du dossier",
          description: `La ressource a été retirée de "${folder.name}".`,
        });
      } else {
        await addResourceToFolder(fId, resourceId);
        setSelectedFolderIds((prev) => {
          const next = new Set(prev);
          next.add(fId);
          return next;
        });
        toast({
          title: "Ajouté au dossier",
          description: `La ressource a été ajoutée à "${folder.name}".`,
        });
      }

      // Invalidate relevant queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resource-folders"] }),
        queryClient.invalidateQueries({ queryKey: ["resource-folder", String(fId)] }),
        queryClient.invalidateQueries({ queryKey: ["user-resource-folders", String(resourceId)] }),
      ]);
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de mettre à jour le dossier.",
        variant: "destructive",
      });
    } finally {
      setTogglingFolderId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    if (folders.length >= MAX_FOLDERS) {
      toast({
        title: "Limite de dossiers atteinte",
        description: `Vous possédez déjà ${MAX_FOLDERS} dossiers. Supprimez-en un pour en créer un nouveau.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingNew(true);
    try {
      const created = await createFolder({ name: trimmed });
      await addResourceToFolder(created.id, resourceId);

      setSelectedFolderIds((prev) => new Set(prev).add(Number(created.id)));
      setNewFolderName("");
      setIsCreatingNew(false);

      toast({
        title: "Dossier créé et ressource ajoutée",
        description: `"${created.name}" créé avec succès !`,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["resource-folders"] }),
        queryClient.invalidateQueries({ queryKey: ["user-resource-folders", String(resourceId)] }),
      ]);
    } catch (e: any) {
      toast({
        title: "Erreur lors de la création",
        description: e?.message || "Impossible de créer le dossier.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FolderPlus className="h-5 w-5 text-primary" />
            <span>Ajouter à un dossier</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
            {resourceTitle ? `Ressource : ${resourceTitle}` : "Choisissez vos dossiers de collection"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Chargement de vos dossiers...</span>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* List of Folders */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 -mr-1">
              {folders.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl p-4">
                  <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Vous n'avez pas encore de dossier.</p>
                  <p className="text-[11px] mt-0.5">Créez-en un ci-dessous pour regrouper vos ressources !</p>
                </div>
              ) : (
                folders.map((folder) => {
                  const fId = Number(folder.id);
                  const isSelected = selectedFolderIds.has(fId);
                  const isToggling = togglingFolderId === fId;
                  const isFull = !isSelected && (folder.resource_count || 0) >= MAX_RESOURCES_PER_FOLDER;

                  return (
                    <div
                      key={folder.id}
                      onClick={() => !isToggling && !isFull && handleToggle(folder)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                          : "border-border/60 hover:bg-muted/40 hover:border-border",
                        isFull && "opacity-50 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isToggling ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            disabled={isFull}
                            onCheckedChange={() => handleToggle(folder)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {folder.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>
                              {folder.resource_count || 0}/{MAX_RESOURCES_PER_FOLDER} ressources
                            </span>
                            {folder.total_size_formatted && (
                              <>
                                <span>·</span>
                                <span>{folder.total_size_formatted}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isFull ? (
                        <Badge variant="outline" className="text-[10px] text-destructive shrink-0">
                          Plein
                        </Badge>
                      ) : isSelected ? (
                        <span className="text-xs font-medium text-primary shrink-0">
                          Ajouté
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick create inline form */}
            {isCreatingNew ? (
              <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-2.5 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Nouveau dossier</span>
                  <span className="text-[10px] text-muted-foreground">
                    {folders.length}/{MAX_FOLDERS}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Nom du dossier..."
                    className="h-8 text-xs"
                    maxLength={80}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateAndAdd();
                      if (e.key === "Escape") setIsCreatingNew(false);
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs shrink-0"
                    onClick={handleCreateAndAdd}
                    disabled={!newFolderName.trim() || isSubmittingNew}
                  >
                    {isSubmittingNew ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Créer"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2 text-xs font-medium gap-1 text-muted-foreground hover:text-foreground",
                    folders.length >= MAX_FOLDERS && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => setIsCreatingNew(true)}
                  disabled={folders.length >= MAX_FOLDERS}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Nouveau dossier</span>
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {folders.length}/{MAX_FOLDERS} dossiers
                </span>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
