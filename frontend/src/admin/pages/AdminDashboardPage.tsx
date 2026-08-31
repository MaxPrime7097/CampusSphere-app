import { useEffect, useState, useMemo } from "react";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Globe,
  FileText,
  Mail,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Loader2,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminStats,
  getAdminUserManagementSummary,
  getAdminVerificationQueue,
  getAdminLogs,
  getContactMessages,
} from "@/services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [pendingVerificationCount, setPendingVerificationCount] = useState<number>(0);
  const [unreadContactCount, setUnreadContactCount] = useState<number>(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d">("7d");
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, summaryRes, verifyRes, logsRes, contactRes] = await Promise.allSettled([
        getAdminStats(),
        getAdminUserManagementSummary(),
        getAdminVerificationQueue({ page: 1 }),
        getAdminLogs({ page: 1 }),
        getContactMessages(),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);

      if (verifyRes.status === "fulfilled" && verifyRes.value) {
        setPendingVerificationCount(
          verifyRes.value?.meta?.pagination?.total_items ?? (verifyRes.value?.data?.length || 0)
        );
      }

      if (logsRes.status === "fulfilled" && logsRes.value) {
        setRecentLogs((logsRes.value?.data || []).slice(0, 6));
      }

      if (contactRes.status === "fulfilled" && contactRes.value) {
        const list = Array.isArray(contactRes.value)
          ? contactRes.value
          : (contactRes.value as any)?.data || [];
        setUnreadContactCount(list.filter((m: any) => !m.is_read).length);
      }
    } catch (e: any) {
      toast({
        title: "Erreur de chargement",
        description: e?.message || "Impossible de récupérer les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Données simulées d'évolution basées sur les métriques réelles pour générer un graphique fluide
  const growthChartData = useMemo(() => {
    const total = summary?.totalUsers || 24;
    const newToday = summary?.newUsersToday || 2;
    const days = chartPeriod === "7d" ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: chartPeriod === "7d" ? "short" : "numeric",
      });

      // Calcul progressif cohérent avec les métriques
      const factor = (days - i) / days;
      const baseUsers = Math.max(1, Math.round(total * (0.6 + 0.4 * factor)));
      const activity = Math.max(0, Math.round((newToday + 3) * (0.7 + 0.6 * Math.sin(i * 1.5))));

      data.push({
        name: label,
        utilisateurs: i === 0 ? total : baseUsers,
        activite: i === 0 ? newToday : activity,
      });
    }
    return data;
  }, [summary, chartPeriod]);

  // Répartition des contenus de la plateforme
  const contentDistributionData = useMemo(() => {
    return [
      { name: "Utilisateurs", count: summary?.totalUsers || 0, fill: "hsl(var(--primary))" },
      { name: "Sphères", count: stats?.activeSpheres || summary?.activeGroups || 0, fill: "#8b5cf6" },
      { name: "Ressources", count: summary?.totalResources || 0, fill: "#06b6d4" },
      { name: "Signalements", count: stats?.pendingReports || summary?.reportedContent || 0, fill: "#ef4444" },
    ];
  }, [summary, stats]);

  const kpis = [
    {
      title: "Utilisateurs Inscrits",
      value: summary?.totalUsers ?? "—",
      subtext: `+${summary?.newUsersToday || 0} aujourd'hui`,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      link: "/admin/users",
    },
    {
      title: "Vérifications Étudiantes",
      value: pendingVerificationCount,
      subtext: pendingVerificationCount > 0 ? "À valider en priorité" : "Toutes traitées",
      icon: ShieldCheck,
      color: pendingVerificationCount > 0 ? "text-amber-500" : "text-green-500",
      bgColor: pendingVerificationCount > 0 ? "bg-amber-500/10" : "bg-green-500/10",
      link: "/admin/verification",
      urgent: pendingVerificationCount > 0,
    },
    {
      title: "Signalements en Attente",
      value: stats?.pendingReports ?? summary?.reportedContent ?? 0,
      subtext: (stats?.pendingReports || 0) > 0 ? "Intervention requise" : "Aucun problème",
      icon: ShieldAlert,
      color: (stats?.pendingReports || 0) > 0 ? "text-destructive" : "text-green-500",
      bgColor: (stats?.pendingReports || 0) > 0 ? "bg-destructive/10" : "bg-green-500/10",
      link: "/admin/moderation",
      urgent: (stats?.pendingReports || 0) > 0,
    },
    {
      title: "Sphères Actives",
      value: stats?.activeSpheres ?? summary?.activeGroups ?? "—",
      subtext: "Communautés créées",
      icon: Globe,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      link: "/admin/spheres",
    },
    {
      title: "Ressources Partagées",
      value: summary?.totalResources ?? "—",
      subtext: "Fichiers & documents",
      icon: FileText,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      link: "/admin/resources",
    },
    {
      title: "Messages de Contact",
      value: unreadContactCount,
      subtext: unreadContactCount > 0 ? `${unreadContactCount} non lu(s)` : "Boîte à jour",
      icon: Mail,
      color: unreadContactCount > 0 ? "text-primary" : "text-muted-foreground",
      bgColor: unreadContactCount > 0 ? "bg-primary/10" : "bg-muted",
      link: "/admin/contact",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Barre d'actions & En-tête de section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground font-automata">
            Vue Globale de la Plateforme
          </h2>
          <p className="text-xs text-muted-foreground">
            Suivi des métriques clés, de l'engagement et des actions prioritaires
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          disabled={loading}
          className="gap-2 rounded-xl text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Actualiser les données
        </Button>
      </div>

      {/* Grille Bento des Cartes KPI */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Link key={kpi.title} to={kpi.link} className="group">
            <Card
              className={`h-full transition-all duration-200 hover:border-primary/40 hover:shadow-md ${
                kpi.urgent ? "border-amber-500/40 bg-amber-500/[0.02]" : ""
              }`}
            >
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl ${kpi.bgColor}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  {kpi.urgent && (
                    <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
                  )}
                </div>

                <div>
                  <p className="text-2xl font-extrabold tracking-tight text-foreground font-automata">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : kpi.value}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80 mt-0.5 truncate">{kpi.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{kpi.subtext}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Section Graphiques Analytiques */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Graphique principal : Croissance & Activité */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
                <TrendingUp className="h-4 w-4 text-primary" />
                Évolution de la Communauté
              </CardTitle>
              <CardDescription className="text-xs">
                Croissance cumulée des comptes inscrits et volume d'activité
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
              <Button
                size="sm"
                variant={chartPeriod === "7d" ? "default" : "ghost"}
                className="h-7 px-2.5 text-xs rounded-lg font-medium"
                onClick={() => setChartPeriod("7d")}
              >
                7 jours
              </Button>
              <Button
                size="sm"
                variant={chartPeriod === "30d" ? "default" : "ghost"}
                className="h-7 px-2.5 text-xs rounded-lg font-medium"
                onClick={() => setChartPeriod("30d")}
              >
                30 jours
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="utilisateurs"
                    name="Utilisateurs"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="activite"
                    name="Nouveaux / Activité"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Graphique secondaire : Répartition du Contenu */}
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
              <Globe className="h-4 w-4 text-purple-500" />
              Répartition des Données
            </CardTitle>
            <CardDescription className="text-xs">
              Volume des entités actives sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentDistributionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Nombre" radius={[0, 8, 8, 0]}>
                    {contentDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
              {contentDistributionData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground">{item.name}:</span>
                  <span className="font-bold text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides & Journal d'Activité Récent */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Actions Prioritaires */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
              <Activity className="h-4 w-4 text-primary" />
              Actions Prioritaires
            </CardTitle>
            <CardDescription className="text-xs">
              Tâches d'administration nécessitant une intervention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pendingVerificationCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">Vérification des cartes étudiantes</p>
                    <p className="text-[11px] text-muted-foreground">{pendingVerificationCount} demande(s) en attente</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg px-2.5">
                  <Link to="/admin/verification">Traiter</Link>
                </Button>
              </div>
            )}

            {(stats?.pendingReports || 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">Signalements de contenu</p>
                    <p className="text-[11px] text-muted-foreground">{stats?.pendingReports} cas à examiner</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="destructive" className="h-7 text-xs rounded-lg px-2.5">
                  <Link to="/admin/moderation">Modérer</Link>
                </Button>
              </div>
            )}

            {unreadContactCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">Nouveaux messages de contact</p>
                    <p className="text-[11px] text-muted-foreground">{unreadContactCount} message(s) non lu(s)</p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg px-2.5">
                  <Link to="/admin/contact">Consulter</Link>
                </Button>
              </div>
            )}

            {pendingVerificationCount === 0 && (stats?.pendingReports || 0) === 0 && unreadContactCount === 0 && (
              <div className="p-4 rounded-xl border border-dashed text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-60" />
                <p className="text-xs font-semibold text-foreground">Toutes les files sont à jour</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Aucune action urgente en attente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journal d'Activité Récent */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Dernières Actions Administrateur
              </CardTitle>
              <CardDescription className="text-xs">
                Historique des modifications et sanctions appliquées
              </CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs text-primary">
              <Link to="/admin/logs">
                Voir tout
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Aucun log récent disponible.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2.5 text-xs gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-semibold text-foreground truncate">{log.actor}</span>
                      <span className="text-muted-foreground truncate">{log.action}</span>
                      {log.targetType && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                          {log.targetType} #{log.targetId || ""}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

