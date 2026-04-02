import { useEffect, useMemo, useState } from "react";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<AdminUserManagementSummary | null>(null);
  const [pendingResources, setPendingResources] = useState<AdminModerationQueueItem[]>([]);
  const [reportedContent, setReportedContent] = useState<AdminReportedContentItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingModeration, setIsLoadingModeration] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
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

    (async () => {
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
    })();

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
                Filtres
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

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="campus-card hover:campus-glow transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Utilisateurs Totaux</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold campus-gradient bg-clip-text text-transparent">
                  {isLoadingStats ? "…" : (stats?.totalUsers ?? "—")}
                </span>
                <Badge className="mb-1 bg-green-100 text-green-800">
                  +{isLoadingStats ? "…" : (stats?.newUsersToday ?? "—")} aujourd'hui
                </Badge>
              </div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                +12% par rapport au mois dernier
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card hover:campus-glow transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Contenus à Modérer</span>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-orange-600">
                  {isLoadingStats ? "…" : (stats?.pendingResources ?? "—")}
                </span>
                <Badge variant="outline" className="mb-1">
                  Ressources
                </Badge>
              </div>
              <Progress value={40} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Temps de traitement moyen: 2h
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card hover:campus-glow transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Signalements Actifs</span>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-red-600">
                  {isLoadingStats ? "…" : (stats?.reportedContent ?? "—")}
                </span>
                <Badge variant="destructive" className="mb-1">
                  Urgent
                </Badge>
              </div>
              <Progress value={15} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                2 nécessitent une attention immédiate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="campus-card">
            <CardContent className="p-4">
              <div className="text-center">
                <Users className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{isLoadingStats ? "…" : (stats?.activeGroups ?? "—")}</div>
                <p className="text-xs text-muted-foreground">Groupes actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardContent className="p-4">
              <div className="text-center">
                <FileText className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{isLoadingStats ? "…" : (stats?.totalResources ?? "—")}</div>
                <p className="text-xs text-muted-foreground">Ressources</p>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardContent className="p-4">
              <div className="text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-green-600">87%</div>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardContent className="p-4">
              <div className="text-center">
                <BarChart3 className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">2.4k</div>
                <p className="text-xs text-muted-foreground">Posts/jour</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
        </Tabs>
      </div>
    </div>
  );
}
