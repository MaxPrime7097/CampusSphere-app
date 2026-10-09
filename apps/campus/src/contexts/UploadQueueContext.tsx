import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { createResource } from "@/services/api/resources.api";
import type { CanonicalResourceType } from "@/constants/resourceTypes";

export interface UploadQueueItem {
  id: string;
  file: File;
  title: string;
  description?: string;
  type: CanonicalResourceType;
  subject?: string;
  tags?: string[];
  visibility?: string;
  audience?: string;
  folderId?: string;
  progress: number; // 0 - 100
  status: "queued" | "uploading" | "completed" | "error";
  error?: string;
  createdAt: number;
}

export type EnqueuePayload = Omit<UploadQueueItem, "id" | "progress" | "status" | "createdAt" | "error">;

interface UploadQueueContextValue {
  items: UploadQueueItem[];
  isDockOpen: boolean;
  setIsDockOpen: (open: boolean) => void;
  toggleDock: () => void;
  enqueueItems: (newItems: EnqueuePayload[]) => void;
  cancelItem: (id: string) => void;
  retryItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
  isProcessing: boolean;
  activeCount: number;
  completedCount: number;
  errorCount: number;
  overallProgress: number;
}

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

const MAX_CONCURRENT_UPLOADS = 2;

export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Map des XHR actifs pour permettre l'annulation
  const activeXhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  // Set des IDs en cours de traitement pour éviter les doublons
  const processingIdsRef = useRef<Set<string>>(new Set());

  const toggleDock = useCallback(() => {
    setIsDockOpen((prev) => !prev);
  }, []);

  const enqueueItems = useCallback((newItems: EnqueuePayload[]) => {
    if (newItems.length === 0) return;

    const queuedItems: UploadQueueItem[] = newItems.map((item, idx) => ({
      ...item,
      id: `upload-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      progress: 0,
      status: "queued",
      createdAt: Date.now() + idx,
    }));

    setItems((prev) => [...prev, ...queuedItems]);
    // Ouvre le dock s'il n'y a pas d'autres uploads en cours pour donner un feedback clair
    setIsDockOpen(true);

    toast({
      title: queuedItems.length === 1 ? "Téléversement lancé" : `${queuedItems.length} téléversements lancés`,
      description: "Le transfert continue en arrière-plan. Vous pouvez naviguer librement.",
    });
  }, [toast]);

  const cancelItem = useCallback((id: string) => {
    const xhr = activeXhrsRef.current.get(id);
    if (xhr) {
      xhr.abort();
      activeXhrsRef.current.delete(id);
    }
    processingIdsRef.current.delete(id);

    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const removeItem = useCallback((id: string) => {
    cancelItem(id);
  }, [cancelItem]);

  const retryItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: "queued",
            progress: 0,
            error: undefined,
          };
        }
        return item;
      })
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.status !== "completed"));
  }, []);

  // Worker effect qui traite la file d'attente
  useEffect(() => {
    const activeUploadsCount = processingIdsRef.current.size;
    const availableSlots = MAX_CONCURRENT_UPLOADS - activeUploadsCount;

    if (availableSlots <= 0) return;

    const nextQueued = items.filter(
      (item) => item.status === "queued" && !processingIdsRef.current.has(item.id)
    ).slice(0, availableSlots);

    if (nextQueued.length === 0) return;

    for (const item of nextQueued) {
      const itemId = item.id;
      processingIdsRef.current.add(itemId);

      // Met l'état à "uploading"
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, status: "uploading", progress: 0 } : it))
      );

      const formData = new FormData();
      formData.append("title", item.title);
      formData.append("description", item.description || "");
      formData.append("type", item.type);
      formData.append("file", item.file);
      formData.append("tags", JSON.stringify(item.tags || []));
      formData.append("visibility", item.visibility || "public");
      formData.append("audience", item.audience || "all");
      if (item.subject) formData.append("subject", item.subject);
      if (item.folderId && item.folderId !== "none") formData.append("folder_id", item.folderId);

      createResource(
        formData,
        undefined,
        (progress) => {
          setItems((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, progress } : it))
          );
        },
        (xhr) => {
          activeXhrsRef.current.set(itemId, xhr);
        }
      )
        .then(() => {
          activeXhrsRef.current.delete(itemId);
          processingIdsRef.current.delete(itemId);

          setItems((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, status: "completed", progress: 100 } : it))
          );

          // Invalider le cache des ressources pour que l'interface se mette à jour instantanément
          void queryClient.invalidateQueries({ queryKey: ["resources"] });
          void queryClient.invalidateQueries({ queryKey: ["home", "recent-resources"] });
          void queryClient.invalidateQueries({ queryKey: ["sidebar", "recent-resources"] });

          toast({
            title: "Publication réussie !",
            description: `"${item.title}" est maintenant disponible.`,
            duration: 3000,
          });
        })
        .catch((err: any) => {
          activeXhrsRef.current.delete(itemId);
          processingIdsRef.current.delete(itemId);

          const errorMessage = err?.message || "Erreur de téléversement";

          setItems((prev) =>
            prev.map((it) =>
              it.id === itemId ? { ...it, status: "error", error: errorMessage } : it
            )
          );

          toast({
            title: "Échec du téléversement",
            description: `Impossible de publier "${item.title}": ${errorMessage}`,
            variant: "destructive",
            duration: 4000,
          });
        });
    }
  }, [items, queryClient, toast]);

  const activeCount = items.filter((i) => i.status === "uploading" || i.status === "queued").length;
  const completedCount = items.filter((i) => i.status === "completed").length;
  const errorCount = items.filter((i) => i.status === "error").length;
  const isProcessing = activeCount > 0;

  const overallProgress = items.length > 0
    ? Math.round(items.reduce((acc, curr) => acc + curr.progress, 0) / items.length)
    : 0;

  const value: UploadQueueContextValue = {
    items,
    isDockOpen,
    setIsDockOpen,
    toggleDock,
    enqueueItems,
    cancelItem,
    retryItem,
    removeItem,
    clearCompleted,
    isProcessing,
    activeCount,
    completedCount,
    errorCount,
    overallProgress,
  };

  return <UploadQueueContext.Provider value={value}>{children}</UploadQueueContext.Provider>;
}

export function useUploadQueue(): UploadQueueContextValue {
  const context = useContext(UploadQueueContext);
  if (!context) {
    throw new Error("useUploadQueue must be used within an UploadQueueProvider");
  }
  return context;
}
