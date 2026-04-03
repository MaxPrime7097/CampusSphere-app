import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { featureFlags } from "@/config/featureFlags";
import { AdminDashboard } from "./AdminDashboard";

type AdminModule = "users" | "moderation" | "spheres" | "stats";

const moduleOrder: Array<{ key: AdminModule; title: string; description: string }> = [
  {
    key: "users",
    title: "Utilisateurs",
    description: "Nouveau module prioritaire: gestion et supervision des comptes.",
  },
  {
    key: "moderation",
    title: "Modération",
    description: "Migration planifiée après validation du module utilisateurs.",
  },
  {
    key: "spheres",
    title: "Sphères",
    description: "Migration planifiée après modération.",
  },
  {
    key: "stats",
    title: "Statistiques",
    description: "Dernière étape de migration avant retrait du legacy.",
  },
];

const migratedModules = new Set<AdminModule>(["users"]);

export function AdminDashboardV2() {
  const [activeModule, setActiveModule] = useState<AdminModule>("users");

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">ADMIN_PANEL_V2</Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Feature flag active</Badge>
            </div>
            <CardTitle>Admin Panel v2 (transition)</CardTitle>
            <CardDescription>
              La route legacy <code>/admin</code> reste active durant la transition. La route <code>/admin-v2</code> permet
              une migration incrémentale des modules dans l&apos;ordre users → moderation → spheres → stats.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs value={activeModule} onValueChange={(value) => setActiveModule(value as AdminModule)}>
          <SharedTabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4" containerClassName="mb-6">
            {moduleOrder.map((module) => (
              <SharedTabsTrigger key={module.key} value={module.key} className="capitalize">
                {module.title}
              </SharedTabsTrigger>
            ))}
          </SharedTabsList>

          {moduleOrder.map((module) => {
            const isMigrated = migratedModules.has(module.key);

            return (
              <TabsContent key={module.key} value={module.key}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{module.title}</CardTitle>
                      <Badge variant={isMigrated ? "default" : "secondary"}>
                        {isMigrated ? "Migré dans v2" : "Encore en legacy"}
                      </Badge>
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isMigrated ? (
                      <div className="rounded-lg border p-2">
                        <AdminDashboard />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        Ce module n&apos;est pas encore migré en v2. Continuez à utiliser <code>/admin</code> pour ce périmètre
                        en attendant la validation fonctionnelle.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" disabled={!featureFlags.ADMIN_PANEL_V2}>
            Bascule finale (après validation)
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Note: la suppression du panel legacy sera faite uniquement après validation fonctionnelle complète.
        </p>
      </div>
    </div>
  );
}
