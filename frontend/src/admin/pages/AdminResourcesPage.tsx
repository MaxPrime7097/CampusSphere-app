import { CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useModerationQueue } from "../hooks/useAdminData";

export function AdminResourcesPage() {
  const { data, loading, error } = useModerationQueue();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Ressources</CardTitle>
        <CardDescription>Validation des ressources partagées.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm">Chargement…</p> : data.map((resource) => (
          <div key={resource.id} className="rounded-lg border p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{resource.title}</p>
              <Badge variant="secondary">{resource.type}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{resource.subject} · {resource.size}</p>
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Prêt pour revue
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
