import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Buildings,
  CheckCircle,
  XCircle,
  Clock,
  Envelope,
  Spinner as Loader2,
  ArrowClockwise as RefreshCw,
  ShieldCheck,
  Check,
  X,
  FileText,
} from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getPartnerApplications,
  approvePartnerApplication,
  rejectPartnerApplication,
} from "@/services/api";
import type { PartnerApplication } from "@/types";

export function AdminPartnerApplicationsPage(): JSX.Element {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<PartnerApplication | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const { data: applications = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-partner-applications"],
    queryFn: () => getPartnerApplications(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => approvePartnerApplication(id),
    onSuccess: (res) => {
      toast({
        title: "Candidature approuvée !",
        description: `Le compte Impact Partner a été activé. Mot de passe provisoire : ${res?.data?.tempPassword || "Envoyé par email"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partner-applications"] });
      setSelectedApp(null);
      setActionType(null);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Échec de l'approbation de la candidature.",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => rejectPartnerApplication(id),
    onSuccess: () => {
      toast({
        title: "Candidature rejetée",
        description: "Le statut de la candidature a été mis à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-partner-applications"] });
      setSelectedApp(null);
      setActionType(null);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err?.message || "Échec du rejet.",
      });
    },
  });

  const filteredApplications = applications.filter((app) => {
    if (filterStatus === "ALL") return true;
    return String(app.status).toUpperCase() === filterStatus;
  });

  const pendingCount = applications.filter((a) => String(a.status).toUpperCase() === "PENDING").length;

  const getStatusBadge = (status: string) => {
    switch (String(status).toUpperCase()) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approuvée
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejetée
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  const getOrgTypeLabel = (type: string) => {
    switch (String(type).toLowerCase()) {
      case "entreprise":
        return "Entreprise";
      case "club":
        return "Club étudiant";
      case "association":
        return "Association";
      case "institution":
        return "Institution";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-automata flex items-center gap-2">
            <Buildings className="h-6 w-6 text-primary" />
            Candidatures Impact Partners
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Examinez et validez les organisations candidates (IdemIA, CamerInd, AWS SBG, etc.).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">En attente de validation</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Partenaires validés</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {applications.filter((a) => String(a.status).toUpperCase() === "APPROVED").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Total des candidatures</CardDescription>
            <CardTitle className="text-2xl font-bold">{applications.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtres de statut */}
      <div className="flex gap-2">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((st) => (
          <Button
            key={st}
            size="sm"
            variant={filterStatus === st ? "default" : "outline"}
            onClick={() => setFilterStatus(st)}
          >
            {st === "ALL" && "Toutes"}
            {st === "PENDING" && `En attente (${pendingCount})`}
            {st === "APPROVED" && "Approuvées"}
            {st === "REJECTED" && "Rejetées"}
          </Button>
        ))}
      </div>

      {/* Liste des candidatures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Liste des demandes</CardTitle>
          <CardDescription className="text-xs">
            {filteredApplications.length} candidature(s) affichée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Aucune candidature trouvée pour ce filtre.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredApplications.map((app) => (
                <div key={app.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-base">{app.organizationName}</span>
                      <Badge variant="outline" className="text-xs">
                        {getOrgTypeLabel(app.organizationType)}
                      </Badge>
                      {getStatusBadge(app.status)}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Envelope className="h-3.5 w-3.5" />
                        {app.contactEmail}
                      </span>
                      <span>•</span>
                      <span>
                        Reçu le {new Date(app.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>

                    {app.description && (
                      <p className="text-sm text-foreground/80 bg-muted/30 p-2.5 rounded-lg border border-border/30 mt-2">
                        {app.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {String(app.status).toUpperCase() === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setSelectedApp(app);
                            setActionType("approve");
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApp(app);
                            setActionType("reject");
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de confirmation */}
      <Dialog open={selectedApp !== null} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Confirmer l'approbation" : "Confirmer le rejet"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? `Voulez-vous valider ${selectedApp?.organizationName} comme Impact Partner ? Un compte officiel sera créé et les identifiants d'accès lui seront transmis.`
                : `Voulez-vous rejeter la candidature de ${selectedApp?.organizationName} ?`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedApp(null)}>
              Annuler
            </Button>
            {actionType === "approve" && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={approveMutation.isPending}
                onClick={() => selectedApp && approveMutation.mutate(selectedApp.id)}
              >
                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Valider et Activer
              </Button>
            )}
            {actionType === "reject" && (
              <Button
                variant="destructive"
                disabled={rejectMutation.isPending}
                onClick={() => selectedApp && rejectMutation.mutate(selectedApp.id)}
              >
                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Rejeter la demande
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default AdminPartnerApplicationsPage;
