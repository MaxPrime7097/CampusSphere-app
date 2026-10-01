import { useEffect, useState } from "react";
import { Sparkle as Sparkles, Robot as Bot, Lightning as Zap, Warning as AlertTriangle, CheckCircle as CheckCircle2, CurrencyDollar as DollarSign, Stack as Layers, TrendDown as TrendingDown, Users, GraduationCap, Building, Clock, ArrowClockwise as RefreshCw, FileText, Question as HelpCircle, Brain as BrainCircuit, Cpu, ShieldCheck, ShieldWarning as ShieldAlert } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { getAdminSpheraStats, type AdminSpheraStats } from "@/services/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

const TOOL_COLORS: Record<string, string> = {
  fiche: "#3b82f6",
  quiz: "#10b981",
  flashcards: "#8b5cf6",
  annale: "#f59e0b",
  qa: "#ec4899",
  suggestions: "#06b6d4",
};

export function AdminSpheraPage() {
  const [data, setData] = useState<AdminSpheraStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const stats = await getAdminSpheraStats();
      setData(stats);
    } catch (err: any) {
      toast({
        title: "Erreur de chargement",
        description: err?.message || "Impossible de récupérer les statistiques de Sphera",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium">Chargement des données de télémétrie Sphera & Bedrock...</p>
      </div>
    );
  }

  const budget = data?.budget;
  const quotas = data?.quotas;
  const percentUsed = budget?.percentUsed || 0;
  const isBudgetCritical = percentUsed >= (budget?.safetyThresholdPercent || 90);
  const isBudgetWarning = percentUsed >= 70 && !isBudgetCritical;

  // Formatting helpers
  const formatCost = (val: number | undefined) => (val != null ? `$${val.toFixed(3)}` : "$0.000");
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground font-automata">
              Sphera IA — Pilotage & Bedrock
            </h1>
            <Badge
              variant={isBudgetCritical ? "destructive" : isBudgetWarning ? "outline" : "secondary"}
              className="text-xs"
            >
              {isBudgetCritical ? "Mode Protecteur (Fallback)" : "Nominal (Bedrock actif)"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Suivi des consommations AWS Bedrock, absorption du budget $90, saturation des quotas étudiants et démographie d'usage.
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
          Actualiser les métriques
        </Button>
      </div>

      {/* Alerte si seuil critique */}
      {isBudgetCritical && (
        <Card className="border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300">
          <CardContent className="py-3 px-4 flex items-center gap-3 text-xs">
            <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <strong>Seuil de sécurité atteint ({budget?.safetyThresholdPercent}%) :</strong> La consommation Bedrock (${budget?.spent.toFixed(2)}) a dépassé le seuil de réserve. Les requêtes sont automatiquement basculées vers Gemini/Groq pour préserver les crédits résiduels.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bento Grid des 6 KPIs Clés */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* KPI 1 : Budget Consommé */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Budget Crédits AWS</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold font-automata tracking-tight">
                {formatCost(budget?.spent)}
              </p>
              <div className="mt-1.5 space-y-1">
                <Progress
                  value={Math.min(100, percentUsed)}
                  className={`h-1.5 ${isBudgetCritical ? "[&>div]:bg-red-500" : isBudgetWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                />
                <p className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{percentUsed.toFixed(1)}% de ${budget?.totalBudget}</span>
                  <span className="font-semibold text-foreground">${budget?.remaining.toFixed(2)} restants</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 : Total Générations */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Total Générations</span>
              <Layers className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold font-automata tracking-tight text-foreground">
                {budget?.totalGenerationsAllProviders ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {budget?.totalBedrockGenerations ?? 0} via Bedrock Claude
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 : Étudiants Actifs Hebdo */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Étudiants Actifs (Semaine)</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold font-automata tracking-tight text-foreground">
                {quotas?.activeStudentsThisWeek ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                ~{quotas?.avgWeeklyGens ?? 0} gén. / étudiant actif
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4 : Saturation du Quota 5/5 */}
        <Card className={`shadow-sm ${(quotas?.saturatedCount || 0) > 0 ? "border-amber-500/40 bg-amber-500/[0.02]" : ""}`}>
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Plafond Atteint (5/5)</span>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold font-automata tracking-tight text-amber-600 dark:text-amber-400">
                {quotas?.saturatedCount ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {quotas?.saturatedPercent ?? 0}% des étudiants au max
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 5 : Burn Rate & Autonomie */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Burn Rate Hebdo</span>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold font-automata tracking-tight text-foreground">
                {formatCost(budget?.weeklyBurnRate)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {budget?.estimatedWeeksRemaining != null
                  ? `~${budget.estimatedWeeksRemaining} sem. d'autonomie`
                  : "Autonomie estimée : > 6 mois"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 6 : Modèle & Provider */}
        <Card className="shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">Moteur IA</span>
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold font-automata text-foreground truncate" title={budget?.model}>
                AWS Bedrock
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                AWS Bedrock ({budget?.model?.split(":")[0]?.split("-").slice(-2).join("-") || "us-east-1"})
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Fallback Gemini/Groq prêt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2 : Graphiques Principaux */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Timeline d'Activité sur 14 jours */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
                  <BrainCircuit className="h-4 w-4 text-primary" />
                  Activité des Générations (14 derniers jours)
                </CardTitle>
                <CardDescription className="text-xs">
                  Nombre de requêtes traitées quotidiennement par Sphera
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">14 jours</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
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
                    labelFormatter={(label) => `Date : ${formatDate(String(label))}`}
                    formatter={(value: any, name: string) => [
                      name === "Générations" ? `${value} requêtes` : `$${Number(value).toFixed(4)}`,
                      name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Générations"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorGens)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Outils d'Étude les Plus Populaires */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
              <Zap className="h-4 w-4 text-amber-500" />
              Outils d'Étude les Plus Utilisés
            </CardTitle>
            <CardDescription className="text-xs">
              Répartition des demandes d'aide pédagogique
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {(!data?.tools || data.tools.length === 0) ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                Aucune génération enregistrée pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.tools} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="toolType"
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
                        formatter={(value: any) => [`${value} gén.`, "Total"]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        {data.tools.map((entry) => (
                          <Cell key={entry.toolType} fill={TOOL_COLORS[entry.toolType] || "#6366f1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {data.tools.map((t) => (
                    <div key={t.toolType} className="p-2 rounded-lg border bg-muted/20 flex justify-between items-center">
                      <span className="capitalize font-medium">{t.toolType}</span>
                      <span className="font-bold font-automata">{t.count} ({formatCost(t.totalCostUSD)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 3 : Démographie Académique & Quotas */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        {/* Top Universités */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
              <Building className="h-4 w-4 text-blue-500" />
              Top Universités
            </CardTitle>
            <CardDescription className="text-xs">
              Établissements les plus actifs sur Sphera
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {(!data?.demographics.topUniversities || data.demographics.topUniversities.length === 0) ? (
              <p className="text-muted-foreground text-center py-6">Pas encore de données de profil</p>
            ) : (
              data.demographics.topUniversities.map((uni, idx) => (
                <div key={uni.name} className="flex items-center justify-between p-2 rounded-lg border bg-muted/10">
                  <span className="font-medium truncate pr-2">
                    <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                    {uni.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">{uni.count} gén.</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Filières */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
              <GraduationCap className="h-4 w-4 text-emerald-500" />
              Top Filières & Spécialités
            </CardTitle>
            <CardDescription className="text-xs">
              Disciplines générant le plus de fiches/quiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {(!data?.demographics.topFaculties || data.demographics.topFaculties.length === 0) ? (
              <p className="text-muted-foreground text-center py-6">Pas encore de données de filière</p>
            ) : (
              data.demographics.topFaculties.map((fac, idx) => (
                <div key={fac.name} className="flex items-center justify-between p-2 rounded-lg border bg-muted/10">
                  <span className="font-medium truncate pr-2">
                    <span className="text-muted-foreground mr-1.5">{idx + 1}.</span>
                    {fac.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">{fac.count} gén.</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Distribution des Quotas de la Semaine */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
              <ShieldCheck className="h-4 w-4 text-purple-500" />
              Absorption des Quotas (Semaine)
            </CardTitle>
            <CardDescription className="text-xs">
              Combien de générations les étudiants utilisent-ils ?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            <div className="p-3 rounded-xl border bg-muted/20 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Limite hebdomadaire :</span>
                <strong className="font-mono text-foreground">5 générations / étudiant</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Volume total consommé cette semaine :</span>
                <strong className="font-mono text-primary">{quotas?.totalWeeklyGenerations || 0} gén.</strong>
              </div>
            </div>

            <div className="space-y-2">
              {(quotas?.distribution || []).map((dist) => (
                <div key={dist.range} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{dist.range}</span>
                    <span className="font-semibold">{dist.count} étudiant(s)</span>
                  </div>
                  <Progress
                    value={quotas?.activeStudentsThisWeek ? (dist.count / quotas.activeStudentsThisWeek) * 100 : 0}
                    className="h-1.5"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 4 : Journal d'Activité Récent */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Journal des Dernières Générations Sphera
            </CardTitle>
            <CardDescription className="text-xs">
              Traçabilité en temps réel des requêtes traitées avec coût et tokens
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">Derniers 20 appels</Badge>
        </CardHeader>
        <CardContent>
          {(!data?.recentLogs || data.recentLogs.length === 0) ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Aucune activité récente enregistrée.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-border text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Date & Heure</th>
                    <th className="py-2.5 px-3">Outil</th>
                    <th className="py-2.5 px-3">Fournisseur</th>
                    <th className="py-2.5 px-3">Tokens In</th>
                    <th className="py-2.5 px-3">Tokens Out</th>
                    <th className="py-2.5 px-3 text-right">Coût Estimé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {log.toolType || "général"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={log.provider === "bedrock" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {log.provider}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{log.inputTokensEstimate?.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono">{log.outputTokensEstimate?.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">
                        {formatCost(log.estimatedCostUSD)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
