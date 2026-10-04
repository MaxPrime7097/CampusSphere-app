import { useEffect, useState, useMemo } from "react";
import { ShieldWarning as ShieldAlert, MagnifyingGlass as Search, CheckCircle as CheckCircle2, Spinner as Loader2, ArrowClockwise as RefreshCw, FileText, ChatCircle as MessageSquare, Warning as AlertTriangle, Eye, Trash as Trash2, User, Calendar, ArrowSquareOut as ExternalLink } from "@phosphor-icons/react";
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
import { getAdminReports, approveAdminReports, deleteAdminResources } from "@/services/api";

type FilterType = "all" | "pending" | "reviewed" | "post" | "resource";

export function AdminModerationPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [approving, setApproving] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  const load = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const res = await getAdminReports({ page: p, search: s });
      setReports(res?.data || []);
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

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredReports.length) {
      setSelected([]);
    } else {
      setSelected(filteredReports.map((r) => r.id));
    }
  };

  const handleApprove = async (reportIds?: string[]) => {
    const targets = reportIds || selected;
    if (!targets.length) return;
    setApproving(true);
    try {
      await approveAdminReports(targets);
      toast({
        title: "Signalements traités",
        description: `${targets.length} signalement(s) marqué(s) comme révisé(s).`,
      });
      setSelected([]);
      if (selectedReport && targets.includes(selectedReport.id)) {
        setIsDetailOpen(false);
      }
      void load(page);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (filterType === "pending") return r.status === "pending";
      if (filterType === "reviewed") return r.status !== "pending";
      if (filterType === "post") return r.source === "post";
      if (filterType === "resource") return r.source === "resource";
      return true;
    });
  }, [reports, filterType]);

  const openReportDetail = (report: any) => {
    setSelectedReport(report);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-automata">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Centre de Modération & Signalements
              </CardTitle>
              <CardDescription className="text-xs">
                {meta?.total_items ?? reports.length} signalement(s) répertorié(s)
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
          {/* Recherche & Filtres */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Raison, motif, auteur, ID..."
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
                { key: "pending", label: "En attente" },
                { key: "reviewed", label: "Traités" },
                { key: "post", label: "Publications" },
                { key: "resource", label: "Ressources" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={filterType === tab.key ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs rounded-lg font-medium"
                  onClick={() => setFilterType(tab.key as FilterType)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action groupée */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                {selected.length} signalement(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove()}
                  disabled={approving}
                  className="h-7 gap-1.5 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  {approving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Marquer comme révisés
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected([])}
                  className="h-7 text-xs rounded-lg"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Liste des signalements */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement des signalements...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-bold text-foreground font-automata">Aucun signalement</p>
              <p className="text-xs text-muted-foreground mt-1">
                La file de modération est claire pour les filtres sélectionnés
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredReports.map((r) => {
                const isSelected = selected.includes(r.id);
                const isPending = r.status === "pending";
                return (
                  <div
                    key={r.id}
                    className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />

                      <div
                        className={`p-2 rounded-xl flex-shrink-0 ${
                          r.source === "post" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"
                        }`}
                      >
                        {r.source === "post" ? (
                          <MessageSquare className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={isPending ? "destructive" : "secondary"}
                            className="text-[10px] px-1.5 py-0 uppercase"
                          >
                            {r.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {r.source === "post" ? "Publication" : "Ressource"} #{r.targetId}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            Signalé par <span className="font-semibold text-foreground">{r.reporter}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-muted-foreground">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : ""}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-foreground/90">
                          Motif : <span className="font-normal text-muted-foreground">{r.reason}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                        onClick={() => openReportDetail(r)}
                      >
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        Examiner
                      </Button>

                      {isPending && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-[11px] rounded-lg bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => handleApprove([r.id])}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Résoudre
                        </Button>
                      )}
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

      {/* Modale d'examen complet du signalement */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 font-automata">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Examen du Signalement
            </DialogTitle>
            <DialogDescription className="text-xs">
              Détails du motif et actions de modération
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border text-xs">
                <div>
                  <span className="text-muted-foreground">Type de contenu :</span>
                  <p className="font-bold text-foreground mt-0.5 capitalize">{selectedReport.source}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Identifiant cible :</span>
                  <p className="font-mono font-bold text-primary mt-0.5">#{selectedReport.targetId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Rapporté par :</span>
                  <p className="font-semibold text-foreground mt-0.5">{selectedReport.reporter}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date :</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString("fr-FR") : "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Motif du signalement :</span>
                <div className="p-3.5 rounded-xl border bg-card text-xs font-medium text-destructive/90 bg-destructive/5">
                  {selectedReport.reason}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2 pt-2 border-t">
                {selectedReport.status === "pending" && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-9 gap-1.5"
                    onClick={() => handleApprove([selectedReport.id])}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Marquer comme Résolu / Traité
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="rounded-xl text-xs h-9"
                  onClick={() => setIsDetailOpen(false)}
                >
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

