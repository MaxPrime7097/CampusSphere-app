import { Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivityLogs } from "../hooks/useAdminData";

const statusVariant: Record<"success" | "warning" | "error", "secondary" | "destructive" | "outline"> = {
  success: "secondary",
  warning: "outline",
  error: "destructive",
};

export function AdminLogsPage() {
  const { data, loading, error } = useActivityLogs();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" />Logs / Activité</CardTitle>
        <CardDescription>Traçabilité des actions système.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm">Chargement…</p> : data.map((log) => (
          <div key={log.id} className="rounded-lg border p-3 text-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="font-medium">{log.action}</p>
              <Badge variant={statusVariant[log.status]}>{log.status}</Badge>
            </div>
            <p className="text-muted-foreground">{log.actor} · {log.target}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
