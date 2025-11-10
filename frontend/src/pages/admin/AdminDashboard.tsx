import { useState } from "react";
import { Users, FileText, Flag, TrendingUp, Shield, AlertCircle, CheckCircle, XCircle, Search, Filter, BarChart3, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = {
    totalUsers: 1234,
    newUsersToday: 23,
    pendingResources: 12,
    reportedContent: 5,
    activeGroups: 89,
    totalResources: 456
  };

  const pendingResources = [
    {
      id: "1",
      title: "Notes Analyse Complexe M1",
      uploader: { name: "Marie D.", avatar: "/placeholder-avatar.jpg" },
      uploadDate: "il y a 2h",
      type: "Notes",
      subject: "Mathématiques",
      size: "4.2 MB"
    },
    {
      id: "2",
      title: "TD Corrigés Thermodynamique",
      uploader: { name: "Thomas M.", avatar: "/placeholder-avatar.jpg" },
      uploadDate: "il y a 5h",
      type: "Exercices",
      subject: "Physique",
      size: "2.8 MB"
    }
  ];

  const reportedContent = [
    {
      id: "1",
      type: "Post",
      content: "Message potentiellement offensant...",
      reporter: { name: "Alex C.", avatar: "/placeholder-avatar.jpg" },
      reason: "Contenu inapproprié",
      date: "il y a 1h",
      status: "pending"
    },
    {
      id: "2",
      type: "Commentaire",
      content: "Spam publicitaire...",
      reporter: { name: "Sophie L.", avatar: "/placeholder-avatar.jpg" },
      reason: "Spam",
      date: "il y a 3h",
      status: "pending"
    }
  ];

  const recentUsers = [
    {
      id: "1",
      name: "Emma Leroy",
      avatar: "/placeholder-avatar.jpg",
      email: "emma.l@example.com",
      joinDate: "il y a 2h",
      university: "Paris-Saclay",
      verified: false
    },
    {
      id: "2",
      name: "Lucas Moreau",
      avatar: "/placeholder-avatar.jpg",
      email: "lucas.m@example.com",
      joinDate: "il y a 5h",
      university: "Sorbonne",
      verified: true
    }
  ];

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
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistiques
              </Button>
              <Button className="campus-gradient text-white gap-2">
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
                  {stats.totalUsers}
                </span>
                <Badge className="mb-1 bg-green-100 text-green-800">
                  +{stats.newUsersToday} aujourd'hui
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
                  {stats.pendingResources}
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
                  {stats.reportedContent}
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
                <div className="text-2xl font-bold">{stats.activeGroups}</div>
                <p className="text-xs text-muted-foreground">Groupes actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardContent className="p-4">
              <div className="text-center">
                <FileText className="h-5 w-5 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{stats.totalResources}</div>
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
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
            <TabsTrigger value="reports">Signalements</TabsTrigger>
          </TabsList>

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
                    <Badge className="bg-green-100 text-green-800">+{stats.newUsersToday}</Badge>
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

            {/* Recent Users */}
            <Card className="campus-card">
              <CardHeader>
                <CardTitle>Nouveaux Utilisateurs</CardTitle>
                <CardDescription>Inscriptions récentes nécessitant une vérification</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            {user.verified && (
                              <Badge variant="secondary" className="text-xs">Vérifié</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.university}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <Button variant="outline" size="sm">Voir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                <div className="space-y-3">
                  {pendingResources.map((resource) => (
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
                              <AvatarImage src={resource.uploader.avatar} />
                              <AvatarFallback className="text-xs">
                                {resource.uploader.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{resource.uploader.name}</span>
                            <span>·</span>
                            <span>{resource.uploadDate}</span>
                            <span>·</span>
                            <span>{resource.size}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="campus-gradient text-white gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approuver
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 gap-1">
                            <XCircle className="h-3 w-3" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="space-y-3">
                  {reportedContent.map((report) => (
                    <div key={report.id} className="p-4 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="destructive">{report.type}</Badge>
                            <Badge variant="outline">{report.reason}</Badge>
                          </div>
                          <p className="text-sm mb-2 italic text-muted-foreground truncate">
                            "{report.content}"
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Signalé par</span>
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={report.reporter.avatar} />
                              <AvatarFallback className="text-xs">
                                {report.reporter.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{report.reporter.name}</span>
                            <span>·</span>
                            <span>{report.date}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Examiner</Button>
                          <Button size="sm" variant="destructive">Supprimer</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
