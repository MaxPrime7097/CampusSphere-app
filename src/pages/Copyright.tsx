import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copyright as CopyrightIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Copyright() {
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
          <CopyrightIcon className="h-16 w-16 campus-gradient mx-auto mb-4 p-3 rounded-2xl text-white" />
          <h1 className="text-4xl font-bold campus-gradient bg-clip-text text-transparent mb-4">
            Politique de Droits d'Auteur
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Respect de la Propriété Intellectuelle</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                CampusSphere respecte les droits de propriété intellectuelle d'autrui et attend de ses utilisateurs 
                qu'ils fassent de même. Nous répondons aux notifications de violation présumée de droits d'auteur 
                conformément au Digital Millennium Copyright Act (DMCA).
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Signaler une Violation
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Si vous pensez que votre œuvre protégée par des droits d'auteur a été copiée d'une manière 
                constituant une violation, veuillez fournir les informations suivantes :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Signature électronique ou physique du titulaire des droits</li>
                <li>Description de l'œuvre protégée prétendument violée</li>
                <li>URL ou localisation du contenu litigieux sur CampusSphere</li>
                <li>Vos coordonnées (nom, adresse, téléphone, email)</li>
                <li>Déclaration de bonne foi attestant que l'utilisation n'est pas autorisée</li>
                <li>Déclaration sous peine de parjure que les informations sont exactes</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Procédure de Notification DMCA</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Envoyez votre notification de violation DMCA à notre agent désigné :
              </p>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold text-foreground">Agent DMCA CampusSphere</p>
                <p>Email: dmca@campussphere.com</p>
                <p>Adresse: CampusSphere, 123 Avenue de l'Université, Paris</p>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Contre-notification</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Si vous estimez que votre contenu a été supprimé par erreur, vous pouvez soumettre une contre-notification 
                contenant :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Votre signature électronique ou physique</li>
                <li>Identification du contenu supprimé et son emplacement avant suppression</li>
                <li>Déclaration sous peine de parjure que vous pensez que le contenu a été supprimé par erreur</li>
                <li>Vos nom, adresse et coordonnées complètes</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Récidive</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Conformément au DMCA et à d'autres lois applicables, CampusSphere a adopté une politique de résiliation, 
                dans des circonstances appropriées, des comptes d'utilisateurs considérés comme contrevenants récidivistes.
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Contenu Généré par les Utilisateurs</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                En publiant du contenu sur CampusSphere, vous :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Conservez tous vos droits de propriété sur votre contenu</li>
                <li>Accordez à CampusSphere une licence mondiale pour héberger, afficher et distribuer votre contenu</li>
                <li>Garantissez avoir les droits nécessaires sur le contenu partagé</li>
                <li>Acceptez que CampusSphere puisse supprimer du contenu violant des droits d'auteur</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Pour toute question concernant notre politique de droits d'auteur :
              </p>
              <ul className="mt-4 space-y-2">
                <li>Email: legal@campussphere.com</li>
                <li>DMCA: dmca@campussphere.com</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}