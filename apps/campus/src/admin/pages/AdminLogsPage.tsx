import { useEffect, useState, useMemo } from "react";
import { Pulse as Activity, MagnifyingGlass as Search, Spinner as Loader2, ArrowClockwise as RefreshCw, User, Shield, FileText, Prohibit as Ban, CheckCircle as CheckCircle2, Trash as Trash2, Eye, Calendar } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAdminLogs } from "@/services/api";

const ACTION_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  "users.bulk_ban": { label: "Bannissement", color: "text-red-500", bgColor: "bg-red-500/10 border-red-500/20" },
  "users.verify": { label: "Certification", color: "text-green-500", bgColor: "bg-green-500/10 border-green-500/20" },
  "resources.bulk_delete": { label: "Suppression Ressource", color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/20" },
  "reports.bulk_approve": { label: "Modération Traitée", color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/20" },
  "posts.bulk_delete": { label: "Suppression Post", color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20" },
};

export function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  const load = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const res = await getAdminLogs({ page: p, search: s });
      setLogs(res?.data || []);
      setMeta(res?.meta?.pagination || null);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load(1, search);
  };

  const filteredLogs = useMemo(() => {
    if (selectedActionFilter === "all") return logs;
    return logs.filter((log) => log.action?.includes(selectedActionFilter));
  }, [logs, selectedActionFilter]);

  const openLogDetail = (log: any) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-automata">
                <Activity className="h-4 w-4 text-primary" />
                Journal d'Audit & Sécurité
              </CardTitle>
              <CardDescription className="text-xs">
                {meta?.total_items ?? logs.length} action(s) administrative(s) enregistrée(s)
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setPage(1);
                void load(1, "");
              }}
              disabled={loading}
              className="h-8 gap-1.5 text-xs rounded-xl self-start md:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Recherche & Filtres rapides */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Administrateur, action, cible..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
              <Button type="submit" variant="default" size="sm" className="h-9 px-3 text-xs rounded-xl">
                Rechercher
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
              {[
                { key: "all", label: "Tous" },
                { key: "verify", label: "Certifications" },
                { key: "ban", label: "Bannissements" },
                { key: "approve", label: "Modération" },
                { key: "delete", label: "Suppressions" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={selectedActionFilter === tab.key ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs rounded-lg font-medium"
                  onClick={() => setSelectedActionFilter(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Liste des logs */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement du journal d'audit...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl">
              <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground font-automata">Aucun log disponible</p>
              <p className="text-xs text-muted-foreground mt-1">Ajustez vos filtres de recherche</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => {
                const conf = ACTION_CONFIG[log.action] || {
                  label: log.action,
                  color: "text-foreground",
                  bgColor: "bg-muted border-border",
                };
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`font-semibold px-2.5 py-1 rounded-lg border text-[11px] flex-shrink-0 ${conf.bgColor} ${conf.color}`}
                      >
                        {conf.label}
                      </span>

                      <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground truncate">{log.actor}</span>
                        <span className="text-muted-foreground">sur</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {log.targetType} #{log.targetId || "lot"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-muted-foreground">
                      <span className="text-[11px]">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => openLogDetail(log)}
                        title="Détails du log"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.has_previous}
                onClick={() => {
                  setPage((p) => p - 1);
                  void load(page - 1);
                }}
                className="h-8 text-xs rounded-xl"
              >
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {meta.page} sur {meta.total_pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.has_next}
                onClick={() => {
                  setPage((p) => p + 1);
                  void load(page + 1);
                }}
                className="h-8 text-xs rounded-xl"
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale d'inspection d'une entrée de log */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 font-automata">
              <Activity className="h-4 w-4 text-primary" />
              Détail de l'Action d'Audit
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enregistrement immuable de l'activité administrateur
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border text-xs">
                <div>
                  <span className="text-muted-foreground">Administrateur :</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedLog.actor}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date exacte :</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString("fr-FR") : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Action :</span>
                  <p className="font-mono font-bold text-primary mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cible :</span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selectedLog.targetType} #{selectedLog.targetId || "lot"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
                <Button variant="outline" className="rounded-xl text-xs h-8" onClick={() => setIsDetailOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

