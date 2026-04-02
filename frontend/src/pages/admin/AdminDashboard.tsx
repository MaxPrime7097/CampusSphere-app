import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, FileText, TrendingUp, Shield, AlertCircle, CheckCircle, XCircle, Search, Filter, BarChart3, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  getAdminModerationQueue,
  getAdminReportedContent,
  getAdminUserManagementSummary,
  getCurrentUser,
  getAdminPermissions,
  type AdminModerationQueueItem,
  type AdminReportedContentItem,
  type AdminUserManagementSummary,
  type AdminPermissions,
} from "@/services/api";
import { canAdmin } from "@/lib/adminPermissions";

export function AdminDashboard() {
  const [statsRange, setStatsRange] = useState<AdminStatsRange>("24h");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<AdminUserManagementSummary | null>(null);
  const [kpiStats, setKpiStats] = useState<AdminKpiStats | null>(null);
  const [pendingResources, setPendingResources] = useState<AdminModerationQueueItem[]>([]);
  const [reportedContent, setReportedContent] = useState<AdminReportedContentItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingKpis, setIsLoadingKpis] = useState(true);
  const [isLoadingModeration, setIsLoadingModeration] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissions | null>(null);

  const filteredPendingResources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return pendingResources;
    return pendingResources.filter((resource) =>
      [resource.title, resource.type, resource.subject, resource.uploader.name]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [pendingResources, searchQuery]);

  const filteredAuditLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return auditLogs.filter((log) => {
      const matchesAction = auditActionFilter === "all" || log.action === auditActionFilter;
      const haystack = [log.actor ?? "", log.action, log.targetType, log.targetId, JSON.stringify(log.payloadDiff)].join(" ").toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      return matchesAction && matchesSearch;
    });
  }, [auditLogs, searchQuery, auditActionFilter]);

  const filteredReportedContent = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reportedContent;
    return reportedContent.filter((report) =>
      [report.type, report.content, report.reason, report.reporter.name]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [reportedContent, searchQuery]);

  useEffect(() => {
    let isMounted = true;

    const loadAdminStats = async () => {
      try {
        const me = await getCurrentUser();
        if (isMounted) setCurrentUser(me);
        const perms = await getAdminPermissions();
        if (isMounted) setAdminPermissions(perms.permissions);
      } catch {
        if (isMounted) {
          setCurrentUser(null);
          setAdminPermissions(null);
        }
      }
    })();

    (async () => {
      try {
        setIsLoadingStats(true);
        setStatsError(null);
        const summary = await getAdminUserManagementSummary();
        if (isMounted) setStats(summary);
      } catch (error: any) {
        if (isMounted) setStatsError(error?.message || "Impossible de charger les statistiques admin.");
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    };

    loadAdminStats();

    (async () => {
      try {
        setIsLoadingModeration(true);
        setModerationError(null);
        const queue = await getAdminModerationQueue();
        if (isMounted) setPendingResources(queue);
      } catch (error: any) {
        if (isMounted) setModerationError(error?.message || "Impossible de charger la file de modération.");
      } finally {
        if (isMounted) setIsLoadingModeration(false);
      }
    })();

    (async () => {
      try {
        setIsLoadingAudit(true);
        setAuditError(null);
        const logs = await getAdminAuditLogs();
        if (isMounted) setAuditLogs(logs);
      } catch (error: any) {
        if (isMounted) setAuditError(error?.message || "Impossible de charger les logs d'audit.");
      } finally {
        if (isMounted) setIsLoadingAudit(false);
      }
    })();

    (async () => {
      try {
        setIsLoadingReports(true);
        setReportsError(null);
        const reports = await getAdminReportedContent();
        if (isMounted) setReportedContent(reports);
      } catch (error: any) {
        if (isMounted) setReportsError(error?.message || "Impossible de charger les contenus signalés.");
      } finally {
        if (isMounted) setIsLoadingReports(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadKpiStats = async () => {
      if (statsRange === "custom" && (!customStartDate || !customEndDate)) {
        setKpiStats(null);
        setIsLoadingKpis(false);
        setKpiError("Sélectionnez une période personnalisée complète.");
        return;
      }

      try {
        setIsLoadingKpis(true);
        setKpiError(null);

        const payload = await getAdminKpiStats({
          range: statsRange,
          startDate: customStartDate ? new Date(customStartDate).toISOString() : undefined,
          endDate: customEndDate ? new Date(customEndDate).toISOString() : undefined,
        });

        if (isMounted) setKpiStats(payload);
      } catch (error: any) {
        if (isMounted) {
          setKpiStats(null);
          setKpiError(error?.message || "Impossible de charger les KPI dédiés.");
        }
      } finally {
        if (isMounted) setIsLoadingKpis(false);
      }
    };

    loadKpiStats();
    return () => {
      isMounted = false;
    };
  }, [statsRange, customStartDate, customEndDate]);

  const handleQuickAction = async (action: "suspend" | "close" | "archive") => {
    try {
      setIsExecutingAction(true);
      setActionError(null);
      setActionSuccess(null);

      if (action === "suspend") {
        if (!suspendUserId.trim()) throw new Error("Renseignez un ID utilisateur.");
        const result = await adminSuspendUser(suspendUserId.trim());
        setActionSuccess(result.message);
      }

      if (action === "close") {
        if (!closeReportId.trim()) throw new Error("Renseignez un ID de signalement.");
        const result = await adminCloseReport(closeReportId.trim());
        setActionSuccess(result.message);
      }

      if (action === "archive") {
        if (!archiveSphereId.trim()) throw new Error("Renseignez un ID de sphère.");
        const result = await adminArchiveExpiredSphere(archiveSphereId.trim());
        setActionSuccess(result.message);
      }
    } catch (error: any) {
      setActionError(error?.message || "Impossible d'exécuter l'action rapide.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  const getInitials = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const formatRelativeDate = (value: string | null) => {
    if (!value) return "Date inconnue";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  };

  const canCreate = canAdmin(currentUser, "create", adminPermissions);
  const canUpdate = canAdmin(currentUser, "update", adminPermissions);
  const canDelete = canAdmin(currentUser, "delete", adminPermissions);
  const canExport = canAdmin(currentUser, "export", adminPermissions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="container max-w-7xl mx-auto py-6 md:py-8 px-4">
        {/* Header with Search */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 campus-gradient rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
                  Panel Admin
                </h1>
              </div>
              <p className="text-base text-muted-foreground">
                Gérez et surveillez l'activité de la plateforme CampusSphere
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" disabled={!canExport}>
                <BarChart3 className="h-4 w-4" />
                Statistiques
              </Button>
              <Button className="campus-gradient text-white gap-2" disabled={!canUpdate}>
                <Filter className="h-4 w-4" />
                Moderation Queue
                </Link>
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur, contenu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* KPI Cards (dedicated stats endpoint) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Nouveaux users", value: kpiStats?.newUsers, icon: TrendingUp, tone: "text-green-600" },
            { label: "Sphères actives", value: kpiStats?.activeSpheres, icon: Users, tone: "text-blue-600" },
            { label: "Signalements en attente", value: kpiStats?.pendingReports, icon: AlertCircle, tone: "text-red-600" },
            { label: "Tâches en retard", value: kpiStats?.overdueTasks, icon: Clock, tone: "text-orange-600" },
            { label: "Notifications échouées", value: kpiStats?.failedNotifications, icon: BellOff, tone: "text-amber-600" },
          ].map((kpi) => (
            <Card key={kpi.label} className="campus-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <kpi.icon className={`h-4 w-4 ${kpi.tone}`} />
                </div>
                <div className={`text-3xl font-bold ${kpi.tone}`}>
                  {isLoadingKpis ? "…" : kpiStats ? kpi.value : "—"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(kpiError || !isLoadingKpis && !kpiStats) && (
          <Card className="campus-card border-destructive/40 mb-6">
            <CardContent className="py-4 text-sm text-destructive">{kpiError || "Aucune donnée KPI pour ce filtre."}</CardContent>
          </Card>
        )}

        <Card className="campus-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-primary" />
              Actions rapides
            </CardTitle>
            <CardDescription>Suspendre utilisateur, clôturer signalement, archiver sphère expirée.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Suspendre utilisateur</p>
              <Input placeholder="ID utilisateur" value={suspendUserId} onChange={(e) => setSuspendUserId(e.target.value)} />
              <Button size="sm" className="w-full" onClick={() => handleQuickAction("suspend")} disabled={isExecutingAction}>
                <UserX className="h-4 w-4 mr-1" /> Suspendre
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Clôturer signalement</p>
              <Input placeholder="ID signalement" value={closeReportId} onChange={(e) => setCloseReportId(e.target.value)} />
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleQuickAction("close")} disabled={isExecutingAction}>
                <CheckCircle className="h-4 w-4 mr-1" /> Clôturer
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Archiver sphère expirée</p>
              <Input placeholder="ID sphère" value={archiveSphereId} onChange={(e) => setArchiveSphereId(e.target.value)} />
              <Button size="sm" variant="secondary" className="w-full" onClick={() => handleQuickAction("archive")} disabled={isExecutingAction}>
                <Archive className="h-4 w-4 mr-1" /> Archiver
              </Button>
            </div>
          </CardContent>
          {(actionError || actionSuccess) && (
            <CardContent className="pt-0">
              {actionError && <p className="text-sm text-destructive">{actionError}</p>}
              {actionSuccess && <p className="text-sm text-green-600">{actionSuccess}</p>}
            </CardContent>
          )}
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <SharedTabsList className="mb-6">
            <SharedTabsTrigger value="overview">Aperçu</SharedTabsTrigger>
            <SharedTabsTrigger value="users">Utilisateurs</SharedTabsTrigger>
            <SharedTabsTrigger value="resources">Ressources</SharedTabsTrigger>
            <SharedTabsTrigger value="reports">Signalements</SharedTabsTrigger>
          </SharedTabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Activity Overview */}
              <Card className="campus-card">
                <CardHeader>
                  <CardTitle>Activité Récente</CardTitle>
                  <CardDescription>Aperçu des dernières 24 heures</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Nouveaux posts</span>
                    <Badge className="campus-gradient text-white">+156</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Inscriptions</span>
                    <Badge className="bg-green-100 text-green-800">+{isLoadingStats ? "…" : (stats?.newUsersToday ?? "—")}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Groupes créés</span>
                    <Badge variant="secondary">+8</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm">Ressources partagées</span>
                    <Badge variant="outline">+12</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="campus-card">
                <CardHeader>
                  <CardTitle>Santé du Système</CardTitle>
                  <CardDescription>État des services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Performance serveur</span>
                      <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Base de données</span>
                      <Badge className="bg-green-100 text-green-800">Opérationnel</Badge>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Stockage utilisé</span>
                      <Badge variant="outline">67%</Badge>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {statsError && (
              <Card className="campus-card border-destructive/40">
                <CardContent className="py-6 text-sm text-destructive">{statsError}</CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="campus-card">
              <CardHeader>
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <CardDescription>Vue d'ensemble de tous les utilisateurs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Module de gestion des utilisateurs</h3>
                  <p className="text-muted-foreground">
                    Fonctionnalités à venir: recherche avancée, gestion des rôles, historique
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card className="campus-card">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Ressources en Attente de Validation</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingModeration ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement de la file de modération...
                  </div>
                ) : moderationError ? (
                  <div className="py-4 text-sm text-destructive">{moderationError}</div>
                ) : filteredPendingResources.length === 0 ? (
                  <div className="py-8 text-sm text-muted-foreground">Aucune ressource en attente de modération.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredPendingResources.map((resource) => (
                      <div key={resource.id} className="p-4 rounded-lg border">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="outline">{resource.type}</Badge>
                              <Badge variant="secondary">{resource.subject}</Badge>
                            </div>
                            <h4 className="font-medium text-sm md:text-base mb-1">{resource.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={resource.uploader.avatar || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(resource.uploader.name)}</AvatarFallback>
                              </Avatar>
                              <span>{resource.uploader.name}</span>
                              <span>·</span>
                              <span>{formatRelativeDate(resource.uploadDate)}</span>
                              <span>·</span>
                              <span>{resource.size}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="campus-gradient text-white gap-1" disabled={!canUpdate}>
                              <CheckCircle className="h-3 w-3" />
                              Approuver
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 gap-1" disabled={!canDelete}>
                              <XCircle className="h-3 w-3" />
                              Rejeter
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="campus-card">
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Contenus Signalés
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingReports ? (
                  <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Chargement des signalements...
                  </div>
                ) : reportsError ? (
                  <div className="py-4 text-sm text-destructive">{reportsError}</div>
                ) : filteredReportedContent.length === 0 ? (
                  <div className="py-8 text-sm text-muted-foreground">Aucun contenu signalé pour le moment.</div>
                ) : (
                  <div className="space-y-3">
                    {filteredReportedContent.map((report) => (
                      <div key={report.id} className="p-4 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant="destructive">{report.type}</Badge>
                              <Badge variant="outline">{report.reason}</Badge>
                            </div>
                            <p className="text-sm mb-2 italic text-muted-foreground truncate">"{report.content}"</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Signalé par</span>
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={report.reporter.avatar || undefined} />
                                <AvatarFallback className="text-xs">{getInitials(report.reporter.name)}</AvatarFallback>
                              </Avatar>
                              <span>{report.reporter.name}</span>
                              <span>·</span>
                              <span>{formatRelativeDate(report.date)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={!canUpdate}>Examiner</Button>
                            <Button size="sm" variant="destructive" disabled={!canDelete}>Supprimer</Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="campus-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Journal d'audit admin</CardTitle>
                  <CardDescription>Recherche, filtres et exports conformité</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={async () => {
                    const blob = await exportAdminAuditLogs('csv', { q: searchQuery, action: auditActionFilter === 'all' ? undefined : auditActionFilter });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'admin-audit-logs.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}><Download className="h-4 w-4 mr-2" />CSV</Button>
                  <Button variant="outline" onClick={async () => {
                    const blob = await exportAdminAuditLogs('json', { q: searchQuery, action: auditActionFilter === 'all' ? undefined : auditActionFilter });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'admin-audit-logs.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}><Download className="h-4 w-4 mr-2" />JSON</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <select className="border rounded px-2 py-1" value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)}>
                    <option value="all">Toutes actions</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                    <option value="ban">Ban</option>
                    <option value="role-change">Role change</option>
                  </select>
                </div>
                {isLoadingAudit ? <p>Chargement…</p> : auditError ? <p className="text-red-500">{auditError}</p> : (
                  <div className="space-y-2">
                    {filteredAuditLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded border bg-muted/20">
                        <div className="flex items-center justify-between text-sm">
                          <span><strong>{log.action}</strong> · {log.targetType}#{log.targetId}</span>
                          <span>{formatRelativeDate(log.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Actor: {log.actor ?? 'Inconnu'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
