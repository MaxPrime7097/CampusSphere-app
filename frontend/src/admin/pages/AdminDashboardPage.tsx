import { useEffect, useState } from "react";
import { AlertCircle, FileText, TrendingUp, Users, Globe, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAdminStats, getAdminUserManagementSummary } from "@/services/api";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [s, sum] = await Promise.all([getAdminStats(), getAdminUserManagementSummary()]);
      setStats(s);
      setSummary(sum);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const cards = [
    { title: "Utilisateurs total", value: summary?.totalUsers, icon: Users, color: "text-blue-500" },
    { title: "Nouveaux aujourd'hui", value: summary?.newUsersToday, icon: TrendingUp, color: "text-green-500" },
    { title: "Sphères actives", value: stats?.activeSpheres, icon: Globe, color: "text-purple-500" },
    { title: "Ressources", value: summary?.totalResources, icon: FileText, color: "text-orange-500" },
    { title: "Signalements en attente", value: stats?.pendingReports, icon: AlertCircle, color: "text-red-500" },
    { title: "Tâches en retard", value: stats?.overdueTasks, icon: Clock, color: "text-amber-500" },
    { title: "Notifs non lues", value: stats?.failedNotifications, icon: CheckCircle2, color: "text-muted-foreground" },
    { title: "Contenus signalés", value: summary?.reportedContent, icon: AlertCircle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Vue globale de la plateforme</p>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                {card.title}
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (card.value ?? "—")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
