import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DataDeletion() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="text-center mb-12">
          <Trash2 className="h-16 w-16 campus-gradient mx-auto mb-4 p-3 rounded-2xl text-white" />
          <h1 className="text-4xl font-bold campus-gradient bg-clip-text text-transparent mb-4">
            Suppression de Données
          </h1>
          <p className="text-muted-foreground">
            Contrôlez vos données personnelles sur CampusSphere
          </p>
        </div>

        <div className="space-y-6">
          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Votre Droit à l'Effacement</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Conformément au RGPD et à d'autres réglementations sur la protection des données, vous avez le droit 
                de demander la suppression de vos données personnelles de CampusSphere. Ce droit est également connu 
                sous le nom de "droit à l'oubli".
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Avant de Supprimer : Téléchargez vos Données
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Avant de supprimer votre compte, nous vous recommandons de télécharger une copie de vos données :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Vos publications et commentaires</li>
                <li>Vos ressources partagées</li>
                <li>Vos messages privés</li>
                <li>Vos paramètres et préférences</li>
              </ul>
              <p className="mt-4">
                Rendez-vous dans{" "}
                <a href="/settings" className="text-primary hover:underline">
                  Paramètres → Télécharger mes données
                </a>
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                Comment Supprimer votre Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>Pour supprimer définitivement votre compte CampusSphere :</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Connectez-vous à votre compte</li>
                <li>Allez dans Paramètres → Compte</li>
                <li>Cliquez sur "Supprimer mon compte"</li>
                <li>Confirmez votre choix en saisissant votre mot de passe</li>
                <li>Cliquez sur "Supprimer définitivement"</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Ce qui Sera Supprimé
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>La suppression de votre compte entraînera la suppression permanente de :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Votre profil et informations personnelles</li>
                <li>Toutes vos publications et commentaires</li>
                <li>Vos messages privés</li>
                <li>Vos abonnements et connexions</li>
                <li>Vos données d'activité et préférences</li>
              </ul>
              <p className="mt-4 font-semibold text-destructive">
                ⚠️ Cette action est irréversible et ne peut pas être annulée.
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Données Conservées</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Certaines données peuvent être conservées pour des raisons légales ou de sécurité :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Logs de sécurité (30 jours)</li>
                <li>Données nécessaires pour respecter nos obligations légales</li>
                <li>Informations anonymisées utilisées pour des statistiques</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Délai de Traitement</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                La suppression de votre compte est effective immédiatement. Cependant, certaines données peuvent 
                persister dans nos systèmes de sauvegarde pendant 30 jours maximum avant d'être définitivement supprimées.
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Alternatives à la Suppression</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>Si vous ne souhaitez pas supprimer définitivement votre compte, vous pouvez :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Désactiver temporairement votre compte</li>
                <li>Modifier vos paramètres de confidentialité</li>
                <li>Supprimer uniquement certaines publications</li>
                <li>Gérer vos préférences de notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Pour toute question concernant la suppression de vos données :
              </p>
              <ul className="mt-4 space-y-2">
                <li>Email: privacy@campussphere.com</li>
                <li>Formulaire de contact disponible dans les Paramètres</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}