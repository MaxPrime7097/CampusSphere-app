import { useEffect, useState } from "react";
import { Sphere, MagnifyingGlass as Search, Spinner as Loader2, ArrowClockwise as RefreshCw, ArrowSquareOut as ExternalLink, UsersThree as Users, Calendar, Eye, Sparkle as Sparkles } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { getSphereUrl } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminSpheres } from "@/services/api";

export function AdminSpheresPage() {
  const [spheres, setSpheres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const { toast } = useToast();

  const load = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const res = await getAdminSpheres({ page: p, search: s });
      setSpheres(res?.data || []);
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

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-automata">
                <Sphere className="h-4 w-4 text-purple-500" />
                Gestion des Sphères Communautaires
              </CardTitle>
              <CardDescription className="text-xs">
                {meta?.total_items ?? spheres.length} sphère(s) et groupes d'échange
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
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
            <Button type="submit" variant="default" size="sm" className="h-9 px-3 text-xs rounded-xl">
              Rechercher
            </Button>
          </form>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement des sphères...</p>
            </div>
          ) : spheres.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-2xl">
              <Sphere className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground font-automata">Aucune sphère trouvée</p>
              <p className="text-xs text-muted-foreground mt-1">Ajustez vos termes de recherche</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {spheres.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col justify-between p-4 border border-border rounded-2xl bg-card hover:border-primary/40 transition-all shadow-sm space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                        <Sphere className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        ID #{s.id}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-foreground truncate">{s.name}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {s.description || "Aucune description renseignée."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t text-[11px] text-muted-foreground">
                    <span>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR") : ""}
                    </span>

                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary">
                      <Link to={getSphereUrl(s)}>
                        Voir la sphère
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
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
    </div>
  );
}

