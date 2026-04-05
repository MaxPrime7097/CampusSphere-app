import { useEffect, useState } from "react";
import { CircleDashed, Search, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminSpheres } from "@/services/api";
import { useNavigate } from "react-router-dom";

export function AdminSpheresPage() {
  const [spheres, setSpheres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  useEffect(() => { void load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void load(1, search); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CircleDashed className="h-4 w-4" />Sphères</CardTitle>
          <CardDescription>Toutes les communautés — {meta?.total_items ?? "…"} au total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher une sphère..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" variant="outline" size="sm">Chercher</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1); void load(1, ""); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : spheres.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune sphère trouvée</p>
          ) : (
            <div className="space-y-2">
              {spheres.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR") : ""}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => navigate(`/spheres/${s.id}`)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button size="sm" variant="outline" disabled={!meta.has_previous} onClick={() => { setPage(p => p - 1); void load(page - 1); }}>Précédent</Button>
              <span className="text-xs text-muted-foreground">Page {meta.page} / {meta.total_pages}</span>
              <Button size="sm" variant="outline" disabled={!meta.has_next} onClick={() => { setPage(p => p + 1); void load(page + 1); }}>Suivant</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
