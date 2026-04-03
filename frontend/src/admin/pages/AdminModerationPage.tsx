import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportedContent } from "../hooks/useAdminData";

export function AdminModerationPage() {
  const { data, loading, error } = useReportedContent();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Modération contenu</CardTitle>
        <CardDescription>Signalements à traiter prioritairement.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm">Chargement…</p> : data.map((report) => (
          <div key={report.id} className="rounded-lg border p-3 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="destructive">{report.type}</Badge>
              <Badge variant="outline">{report.reason}</Badge>
            </div>
            <p className="text-muted-foreground">{report.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
