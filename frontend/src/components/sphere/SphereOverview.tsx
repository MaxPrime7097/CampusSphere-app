import { useEffect, useState } from "react";
import { getSphereOverview } from "@/services/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, FileText, MessageSquare, RefreshCw, Users, Zap, Clock, Loader2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  sphereId: string;
  onTabChange: (tab: string) => void;
}

const PRI: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
const PRI_LABEL: Record<string, string> = { high: "Haute", medium: "Moyenne", low: "Basse" };
const KAN: Record<string, string> = { todo: "À faire", in_progress: "En cours", review: "Révision", done: "Terminé" };

export function SphereOverview({ sphereId, onTabChange }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setData(await getSphereOverview(sphereId)); }
    catch (e: any) { setError(e?.message || "Erreur de chargement."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [sphereId]);

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : null;

  if (loading) return (
    <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <p className="text-sm text-destructive">{error}</p>
      <Button variant="outline" size="sm" onClick={load} className="gap-2">
        <RefreshCw className="h-4 w-4" /> Réessayer
      </Button>
    </div>
  );

  const prog = data?.progression ?? 0;

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, label: "Terminées", value: data?.done_tasks ?? 0, sub: `/ ${data?.total_tasks ?? 0} tâches` },
          { icon: <AlertTriangle className="h-5 w-5 text-red-500" />,  label: "En retard",  value: data?.overdue_tasks?.length ?? 0, sub: "tâches" },
          { icon: <MessageSquare className="h-5 w-5 text-blue-500" />, label: "Non lus",    value: data?.unread_messages ?? 0, sub: "messages" },
          { icon: <Users className="h-5 w-5 text-primary" />,          label: "Membres",    value: data?.member_count ?? 0, sub: "actifs" },
        ].map((s) => (
          <div key={s.label} className="bg-card border rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-2">{s.icon}<span className="text-xs text-muted-foreground">{s.label}</span></div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Objective & Progress */}
      <div className="bg-card border rounded-xl p-4 space-y-4">
        {data?.objective && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
              <Target className="h-4 w-4" /> Objectif de la sphère
            </h3>
            <p className="text-sm text-foreground/80 bg-primary/5 p-3 rounded-lg border border-primary/10 italic">
              "{data.objective}"
            </p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Progression du projet</span>
            <span className={cn("text-2xl font-bold", prog >= 75 ? "text-green-600" : prog >= 40 ? "text-amber-600" : "text-blue-600")}>{prog}%</span>
          </div>
          <Progress value={prog} className="h-3" />
          <p className="text-xs text-muted-foreground">{data?.done_tasks ?? 0} tâche{(data?.done_tasks ?? 0) !== 1 ? "s" : ""} terminée{(data?.done_tasks ?? 0) !== 1 ? "s" : ""} sur {data?.total_tasks ?? 0}</p>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overdue */}
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Tâches en retard</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("tasks")}>Voir tout</Button>
          </div>
          {!(data?.overdue_tasks?.length) ? (
            <p className="text-xs text-muted-foreground text-center py-3">Aucune tâche en retard 🎉</p>
          ) : (data.overdue_tasks as any[]).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <div className="flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3 text-red-500" /><span className="text-xs text-red-500">{fmt(t.due_date)}</span></div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", PRI[t.priority] || PRI.medium)}>{PRI_LABEL[t.priority] || "Moyenne"}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{KAN[t.kanban_status] || t.kanban_status}</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* My tasks */}
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Mes tâches</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("tasks")}>Voir tout</Button>
          </div>
          {!(data?.my_tasks?.length) ? (
            <p className="text-xs text-muted-foreground text-center py-3">Aucune tâche assignée</p>
          ) : (data.my_tasks as any[]).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                {t.due_date && <div className="flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{fmt(t.due_date)}</span></div>}
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">{KAN[t.kanban_status] || t.kanban_status}</Badge>
            </div>
          ))}
        </div>

        {/* Recent files */}
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-purple-500" />Fichiers récents</h3>
          {!(data?.recent_resources?.length) ? (
            <p className="text-xs text-muted-foreground text-center py-3">Aucun fichier partagé</p>
          ) : (data.recent_resources as any[]).map((r: any) => (
            <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm truncate">{r.title}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
                <span className="text-xs text-muted-foreground">{fmt(r.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-blue-500" />Discussion</h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("chat")}>Ouvrir</Button>
          </div>
          <div className="flex flex-col items-center justify-center py-4 gap-2">
            {(data?.unread_messages ?? 0) > 0 ? (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm font-semibold">{data.unread_messages} message{data.unread_messages > 1 ? "s" : ""} non lu{data.unread_messages > 1 ? "s" : ""}</p>
                <Button size="sm" className="campus-gradient text-white" onClick={() => onTabChange("chat")}>Voir les messages</Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Vous êtes à jour ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
