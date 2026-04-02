import { CircleDashed } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminSummary } from "../hooks/useAdminData";

export function AdminSpheresPage() {
  const { data, loading } = useAdminSummary();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CircleDashed className="h-4 w-4" />Sphères</CardTitle>
        <CardDescription>Suivi des communautés et groupes actifs.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Groupes actifs: <strong>{loading ? "…" : data.activeGroups}</strong></p>
      </CardContent>
    </Card>
  );
}
