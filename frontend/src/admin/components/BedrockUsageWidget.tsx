import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, AlertTriangle, CheckCircle2, TrendingDown, Cpu, Sparkles, DollarSign, Layers, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getAdminAiUsageSummary, type AdminAiUsageSummary } from "@/services/api";

export function BedrockUsageWidget() {
  const [data, setData] = useState<AdminAiUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getAdminAiUsageSummary();
        if (isMounted) setData(res);
      } catch (err: any) {
        if (isMounted) setError(err?.message || "Impossible de charger le suivi Bedrock");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card className="shadow-sm border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 font-automata">
            <Bot className="h-4 w-4 text-primary animate-pulse" />
            Suivi Consommation AWS Bedrock
          </CardTitle>
          <CardDescription className="text-xs">Chargement des données de facturation...</CardDescription>
        </CardHeader>
        <CardContent className="py-6 flex justify-center text-xs text-muted-foreground">
          Calcul des tokens et projection budgétaire en cours...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="shadow-sm border border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive font-automata">
            <AlertTriangle className="h-4 w-4" />
            Suivi Consommation AWS Bedrock
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-destructive">
          {error || "Données indisponibles"}
        </CardContent>
      </Card>
    );
  }

  const percent = data.percentUsed;
  const isDanger = percent >= (data.safetyThresholdPercent || 90);
  const isWarning = percent >= 70 && !isDanger;

  return (
    <Card className={`shadow-sm border transition-all ${isDanger ? "border-red-500/50 bg-red-500/[0.02]" : isWarning ? "border-amber-500/50" : "border-border"}`}>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold font-automata flex items-center gap-2">
              Suivi Consommation AWS Bedrock
              <Badge variant={isDanger ? "destructive" : isWarning ? "outline" : "secondary"} className="text-[10px]">
                {data.model.split(".")[1] || "Claude Haiku"}
              </Badge>
            </CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Budget alloué : <strong>${data.totalBudget.toFixed(2)} USD</strong> (Crédits AWS) · Seuil d'alerte : {data.safetyThresholdPercent}% (${data.safetyThresholdUSD.toFixed(2)})
          </CardDescription>
        </div>

        {isDanger ? (
          <Badge variant="destructive" className="gap-1 text-xs self-start sm:self-auto animate-pulse">
            <AlertTriangle className="h-3 w-3" />
            Seuil critique atteint (&gt;{data.safetyThresholdPercent}%) — Bascule Gemini/Groq
          </Badge>
        ) : isWarning ? (
          <Badge variant="outline" className="gap-1 text-xs text-amber-600 border-amber-500/50 self-start sm:self-auto">
            <AlertTriangle className="h-3 w-3" />
            Attention : {percent}% consommés
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-xs text-emerald-600 bg-emerald-500/10 self-start sm:self-auto">
            <CheckCircle2 className="h-3 w-3" />
            Budget nominal
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Barre de progression budget */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Consommation totale : <strong>${data.spent.toFixed(3)}</strong> / ${data.totalBudget.toFixed(2)}
            </span>
            <span className={`font-bold font-automata ${isDanger ? "text-red-600" : isWarning ? "text-amber-600" : "text-foreground"}`}>
              {percent.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={Math.min(100, percent)}
            className={`h-2.5 ${isDanger ? "[&>div]:bg-red-500" : isWarning ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
          />
        </div>

        {/* 4 Métriques Bento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border bg-muted/20">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Crédits restants
            </p>
            <p className="text-lg font-bold font-automata text-foreground mt-0.5">
              ${data.remaining.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">sur ${data.totalBudget}</p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-amber-500" />
              Burn rate hebdo
            </p>
            <p className="text-lg font-bold font-automata text-foreground mt-0.5">
              ${data.weeklyBurnRate.toFixed(3)}
            </p>
            <p className="text-[10px] text-muted-foreground">sur les 7 derniers jours</p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Cpu className="h-3 w-3 text-blue-500" />
              Tenue estimée
            </p>
            <p className="text-lg font-bold font-automata text-foreground mt-0.5">
              {data.estimatedWeeksRemaining != null ? `${data.estimatedWeeksRemaining} sem.` : "N/A"}
            </p>
            <p className="text-[10px] text-muted-foreground">au rythme actuel</p>
          </div>

          <div className="p-3 rounded-xl border bg-muted/20">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Layers className="h-3 w-3 text-emerald-500" />
              Total requêtes
            </p>
            <p className="text-lg font-bold font-automata text-foreground mt-0.5">
              {data.totalGenerations}
            </p>
            <p className="text-[10px] text-muted-foreground">{data.recentGenerations7d} cette semaine</p>
          </div>
        </div>

        {/* Détail par type d'outil */}
        {data.breakdownByTool && data.breakdownByTool.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-foreground mb-2">Répartition des appels par outil :</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {data.breakdownByTool.map((b) => (
                <div key={b.toolType} className="p-2 rounded-lg border bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold capitalize text-[11px]">{b.toolType || "Autre"}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">{b.count}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ${b.totalCostUSD.toFixed(3)} USD
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {(b.inputTokens + b.outputTokens).toLocaleString()} tokens
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lien vers le pilotage complet Sphera */}
        <div className="pt-2 flex justify-end">
          <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary gap-1 px-2.5">
            <Link to="/admin/sphera">
              Ouvrir le tableau de bord Sphera complet
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>

  );
}
