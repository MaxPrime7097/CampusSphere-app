import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, FileWarning, Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAdminReportedContent, type AdminReportedContentItem } from "@/services/api";

type ModerationStatus = "new" | "reviewing" | "action_taken" | "closed";
type ModerationAction = "warn" | "hide_content" | "suspend_account" | "temporary_ban";

interface ModerationDecisionLog {
  id: string;
  actor: string;
  reason: string;
  timestamp: string;
  target: string;
  action: ModerationAction | "status_update";
  reportId: string;
}

interface ModerationQueueItem extends AdminReportedContentItem {
  workflowStatus: ModerationStatus;
}

const ACTION_LABELS: Record<ModerationAction, string> = {
  warn: "Avertir",
  hide_content: "Masquer contenu",
  suspend_account: "Suspendre compte",
  temporary_ban: "Bannir temporairement",
};

const STATUS_LABELS: Record<ModerationStatus, string> = {
  new: "new",
  reviewing: "reviewing",
  action_taken: "action_taken",
  closed: "closed",
};

const statusOrder: ModerationStatus[] = ["new", "reviewing", "action_taken", "closed"];

const actorName = "Admin CampusSphere";

function inferWorkflowStatus(status: string | null | undefined): ModerationStatus {
  if (!status) return "new";
  const normalized = status.toLowerCase().trim();
  if (normalized === "reviewing") return "reviewing";
  if (normalized === "action_taken" || normalized === "resolved") return "action_taken";
  if (normalized === "closed") return "closed";
  return "new";
}

export function AdminModerationQueue() {
  const [reports, setReports] = useState<ModerationQueueItem[]>([]);
  const [logs, setLogs] = useState<ModerationDecisionLog[]>([]);
  const [reasonsByReport, setReasonsByReport] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedReports = await getAdminReportedContent();
        if (!mounted) return;
        setReports(
          fetchedReports.map((report) => ({
            ...report,
            workflowStatus: inferWorkflowStatus(report.status),
          }))
        );
      } catch (err: any) {
        if (mounted) setError(err?.message || "Impossible de charger la file de modération.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) =>
      [report.type, report.content, report.reason, report.reporter.name, report.workflowStatus]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [reports, searchQuery]);

  const appendLog = (report: ModerationQueueItem, action: ModerationDecisionLog["action"], reason: string) => {
    const now = new Date().toISOString();
    const newLog: ModerationDecisionLog = {
      id: `${report.id}-${action}-${now}`,
      actor: actorName,
      reason,
      timestamp: now,
      target: `${report.type} #${report.id}`,
      action,
      reportId: report.id,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const updateStatus = (report: ModerationQueueItem) => {
    const currentIndex = statusOrder.indexOf(report.workflowStatus);
    const nextStatus = statusOrder[Math.min(currentIndex + 1, statusOrder.length - 1)];
    if (nextStatus === report.workflowStatus) return;

    setReports((prev) =>
      prev.map((item) => (item.id === report.id ? { ...item, workflowStatus: nextStatus } : item))
    );

    appendLog(report, "status_update", `Changement d'état: ${report.workflowStatus} -> ${nextStatus}`);
  };

  const applyAction = (report: ModerationQueueItem, action: ModerationAction) => {
    const reason = reasonsByReport[report.id]?.trim() || "Motif non renseigné";

    setReports((prev) =>
      prev.map((item) =>
        item.id === report.id
          ? {
              ...item,
              workflowStatus: item.workflowStatus === "closed" ? "closed" : "action_taken",
            }
          : item
      )
    );
    appendLog(report, action, reason);
  };

  const getInitials = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const formatDateTime = (value: string | null) => {
    if (!value) return "Date inconnue";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="container max-w-7xl mx-auto py-6 md:py-8 px-4 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            AdminModerationQueue
          </h1>
          <p className="text-muted-foreground">
            Gestion unifiée des signalements avec workflow explicite: new -&gt; reviewing -&gt; action_taken -&gt; closed.
          </p>
        </div>

        <Card className="campus-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              File de signalements
            </CardTitle>
            <CardDescription>Tous les signalements centralisés, actionnables et journalisés.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Rechercher dans les signalements..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {isLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des signalements...
              </div>
            ) : error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : filteredReports.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8">Aucun signalement trouvé.</div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="rounded-lg border p-4 bg-background/80 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="destructive">{report.type}</Badge>
                          <Badge variant="outline">{report.reason}</Badge>
                          <Badge variant="secondary">{STATUS_LABELS[report.workflowStatus]}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{report.content}"</p>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={report.reporter.avatar || undefined} />
                            <AvatarFallback className="text-xs">{getInitials(report.reporter.name)}</AvatarFallback>
                          </Avatar>
                          <span>{report.reporter.name}</span>
                          <span>·</span>
                          <span>{formatDateTime(report.date)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => updateStatus(report)}>
                          <Clock3 className="h-4 w-4 mr-1" />
                          Étape suivante
                        </Button>
                        {report.workflowStatus !== "closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setReports((prev) =>
                                prev.map((item) => (item.id === report.id ? { ...item, workflowStatus: "closed" } : item))
                              )
                            }
                          >
                            <FileWarning className="h-4 w-4 mr-1" />
                            Clore
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-[1fr_auto] gap-2">
                      <Input
                        placeholder="Motif de décision (obligatoire pour audit)..."
                        value={reasonsByReport[report.id] ?? ""}
                        onChange={(event) =>
                          setReasonsByReport((prev) => ({
                            ...prev,
                            [report.id]: event.target.value,
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(ACTION_LABELS) as ModerationAction[]).map((action) => (
                          <Button key={action} size="sm" onClick={() => applyAction(report, action)}>
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {ACTION_LABELS[action]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="campus-card">
          <CardHeader>
            <CardTitle>Journal des décisions</CardTitle>
            <CardDescription>Acteur, motif, horodatage et objet ciblé pour chaque décision.</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune décision journalisée pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((entry) => (
                  <div key={entry.id} className="text-sm rounded-md border p-3 bg-muted/30">
                    <span className="font-semibold">{entry.actor}</span>{" "}
                    <Badge variant="outline" className="mx-1">
                      {entry.action}
                    </Badge>
                    <span>sur {entry.target}</span>
                    <span className="text-muted-foreground"> · {formatDateTime(entry.timestamp)}</span>
                    <p className="text-muted-foreground mt-1">Motif: {entry.reason}</p>
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
