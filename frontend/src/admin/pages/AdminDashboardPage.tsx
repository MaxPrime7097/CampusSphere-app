import { AlertCircle, FileText, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSummary } from "../hooks/useAdminData";

export function AdminDashboardPage() {
  const { data: stats, loading, error } = useAdminSummary();

  const cards = [
    { title: "Utilisateurs", value: stats.totalUsers, icon: Users },
    { title: "Nouveaux aujourd'hui", value: stats.newUsersToday, icon: TrendingUp },
    { title: "Ressources", value: stats.totalResources, icon: FileText },
    { title: "Signalements", value: stats.reportedContent, icon: AlertCircle },
  ];

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                {card.title}
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{loading ? "…" : card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
