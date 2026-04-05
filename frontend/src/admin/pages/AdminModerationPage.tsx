import { useEffect, useState } from "react";
import { AlertTriangle, Search, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAdminReports, approveAdminReports } from "@/services/api";

const STATUS_VARIANT: Record<string, "secondary" | "destructive" | "outline"> = {
  pending: "destructive",
  reviewed: "secondary",
  dismissed: "outline",
  action_taken: "outline",
};

export function AdminModerationPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [approving, setApproving] = useState(false);
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

  useEffect(() => { void load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void load(1, search); };
  const toggleSelect = (id: string) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleApprove = async () => {
    if (!selected.length) return;
    setApproving(true);
    try {
      await approveAdminReports(selected);
      toast({ title: "Signalements traités", description: `${selected.length} signalement(s) révisé(s)` });
      setSelected([]);
      void load(page);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Modération</CardTitle>
          <CardDescription>Signalements à traiter — {meta?.total_items ?? "…"} au total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Raison, contenu, auteur..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" variant="outline" size="sm">Chercher</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1); void load(1, ""); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>

          {selected.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <span className="text-sm font-medium">{selected.length} sélectionné(s)</span>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={handleApprove} disabled={approving}>
                {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Marquer révisé
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Annuler</Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun signalement</p>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selected.includes(r.id) ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"}`}
                  onClick={() => toggleSelect(r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={STATUS_VARIANT[r.status] || "outline"} className="text-xs">{r.status}</Badge>
                      <Badge variant="secondary" className="text-xs">{r.source}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{r.reason}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Par {r.reporter} · {r.createdAt ? new Date(r.createdAt).toLocaleDateString("fr-FR") : ""}
                    </p>
                  </div>
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
