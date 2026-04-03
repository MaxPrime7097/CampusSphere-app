import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSummary } from "../hooks/useAdminData";

export function AdminUsersPage() {
  const { data, loading } = useAdminSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Utilisateurs</CardTitle>
        <CardDescription>Gestion des comptes et de la croissance utilisateur.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Total utilisateurs: <strong>{loading ? "…" : data.totalUsers}</strong></p>
        <p>Nouveaux inscrits aujourd'hui: <strong>{loading ? "…" : data.newUsersToday}</strong></p>
      </CardContent>
    </Card>
  );
}
