import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
  {
    key: "users",
    label: "Utilisateurs",
    status: "migrated",
    notes: "Module branché sur /admin/users.",
  },
  {
    key: "moderation",
    label: "Modération",
    status: "in_progress",
    notes: "Migration prioritaire après validation utilisateurs.",
  },
  {
    key: "spheres",
    label: "Sphères",
    status: "planned",
    notes: "Migration planifiée après modération.",
  },
  {
    key: "resources",
    label: "Ressources",
    status: "planned",
    notes: "Migration couplée avec les règles de revue contenu.",
  },
  {
    key: "logs",
    label: "Logs / Activité",
    status: "planned",
    notes: "Dernière phase avant retrait total du legacy.",
  },
] as const;

const statusLabel = {
  migrated: "Migré v2",
  in_progress: "En cours",
  planned: "Planifié",
} as const;

export function AdminDashboardV2() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel v2</CardTitle>
          <CardDescription>
            Les modules sont isolés par routes dédiées. Aucun rendu du dashboard legacy n&apos;est imbriqué dans v2.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {modules.map((module) => (
          <Card key={module.key}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{module.label}</CardTitle>
                <Badge variant={module.status === "migrated" ? "default" : "secondary"}>{statusLabel[module.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{module.notes}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
