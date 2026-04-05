import { useEffect, useState } from "react";
import { Activity, Search, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/services/api";

// Appel direct car pas encore dans api.ts
async function getAdminLogs(params?: { page?: number; search?: string }) {
  const { getAccessToken } = await import("@/services/api") as any;
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.search) q.set('search', params.search);
  const suffix = q.toString() ? `?${q}` : '';
  const token = localStorage.getItem('access') || undefined;
  const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const res = await fetch(`${API}/api/admin/v1/logs/${suffix}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return res.json();
}

const ACTION_COLOR: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
};

export function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
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

  useEffect(() => { void load(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); void load(1, search); };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" />Logs / Activité</CardTitle>
          <CardDescription>Historique des actions admin — {meta?.total_items ?? "…"} entrées</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Action, type, acteur..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" variant="outline" size="sm">Chercher</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1); void load(1, ""); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun log disponible</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ACTION_COLOR[log.action] || "bg-muted text-muted-foreground"}`}>
                    {log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate"><span className="font-medium">{log.actor}</span> · {log.targetType} #{log.targetId}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
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
