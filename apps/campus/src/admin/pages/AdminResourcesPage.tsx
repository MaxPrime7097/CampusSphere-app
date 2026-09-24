import { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Search,
  Trash2,
  Loader2,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Eye,
  Calendar,
  User,
  FileCode,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { getAdminResources, deleteAdminResources } from "@/services/api";

export function AdminResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [inspectingResource, setInspectingResource] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  const load = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const res = await getAdminResources({ page: p, search: s });
      setResources(res?.data || []);
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
    if (selected.length === filteredResources.length) {
      setSelected([]);
    } else {
      setSelected(filteredResources.map((r) => r.id));
    }
  };

  const handleDelete = async (resourceIds?: string[]) => {
    const targets = resourceIds || selected;
    if (!targets.length || !confirm(`Supprimer définitivement ${targets.length} ressource(s) ?`)) return;
    setDeleting(true);
    try {
      const res = await deleteAdminResources(targets);
      toast({
        title: "Ressources supprimées",
        description: `${res?.data?.deleted || targets.length} fichier(s) supprimé(s).`,
      });
      setSelected([]);
      if (inspectingResource && targets.includes(inspectingResource.id)) {
        setIsDetailOpen(false);
      }
      void load(page);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const filteredResources = useMemo(() => {
    if (selectedType === "all") return resources;
    return resources.filter((r) => r.type?.toLowerCase() === selectedType.toLowerCase());
  }, [resources, selectedType]);

  const openDetail = (res: any) => {
    setInspectingResource(res);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-automata">
                <FileText className="h-4 w-4 text-cyan-500" />
                Gestion des Ressources Académiques
              </CardTitle>
              <CardDescription className="text-xs">
                {meta?.total_items ?? resources.length} document(s) partagé(s) sur la plateforme
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
                  placeholder="Titre, matière, auteur..."
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
                { key: "pdf", label: "PDF" },
                { key: "cours", label: "Cours" },
                { key: "annale", label: "Annales" },
                { key: "resume", label: "Fiches" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={selectedType === tab.key ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs rounded-lg font-medium"
                  onClick={() => setSelectedType(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Action groupée */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl">
              <span className="text-xs font-semibold text-destructive">
                {selected.length} ressource(s) sélectionnée(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete()}
                  disabled={deleting}
                  className="h-7 gap-1.5 text-xs rounded-lg"
                >
                  {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Supprimer
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

          {/* Liste des ressources */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement des ressources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground font-automata">Aucune ressource trouvée</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajustez votre recherche ou les filtres de type
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredResources.map((r) => {
                const isSelected = selected.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground truncate">{r.title}</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase font-semibold">
                            {r.type || "Document"}
                          </Badge>
                          {r.subject && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {r.subject}
                            </Badge>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate">
                          Par <span className="text-foreground font-medium">{r.author || "Anonyme"}</span>
                          {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString("fr-FR")}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg" title="Voir sur l'application">
                        <Link to={`/resources/${r.id}`}>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-[11px] rounded-lg gap-1"
                        onClick={() => openDetail(r)}
                      >
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        Détails
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => handleDelete([r.id])}
                        title="Supprimer la ressource"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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

      {/* Modale de Détails Ressource */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 font-automata">
              <FileText className="h-4 w-4 text-cyan-500" />
              Fiche Ressource
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informations sur le fichier partagé
            </DialogDescription>
          </DialogHeader>

          {inspectingResource && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl border bg-muted/30 space-y-1">
                <h4 className="text-sm font-bold text-foreground">{inspectingResource.title}</h4>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary" className="text-xs uppercase">{inspectingResource.type}</Badge>
                  <Badge variant="outline" className="text-xs">{inspectingResource.subject}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border bg-card">
                  <span className="text-muted-foreground">Auteur / Déposant :</span>
                  <p className="font-semibold text-foreground mt-0.5">{inspectingResource.author}</p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <span className="text-muted-foreground">Date d'ajout :</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {inspectingResource.createdAt
                      ? new Date(inspectingResource.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button asChild className="flex-1 rounded-xl text-xs h-9 gap-1.5">
                  <Link to={`/resources/${inspectingResource.id}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ouvrir la ressource
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl text-xs h-9 gap-1.5"
                  onClick={() => handleDelete([inspectingResource.id])}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

