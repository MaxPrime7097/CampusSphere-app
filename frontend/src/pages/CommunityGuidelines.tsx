import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Heart, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CommunityGuidelines() {
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
          <Users className="h-16 w-16 campus-gradient mx-auto mb-4 p-3 rounded-2xl text-white" />
          <h1 className="text-4xl font-bold campus-gradient bg-clip-text text-transparent mb-4">
            Règles de la Communauté
          </h1>
          <p className="text-muted-foreground">
            Ensemble, créons un environnement bienveillant et enrichissant
          </p>
        </div>

        <div className="space-y-6">
          <Card className="campus-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Respect et Bienveillance
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Traitez tous les membres avec respect et courtoisie</li>
                <li>Valorisez la diversité des opinions et des parcours</li>
                <li>Encouragez et soutenez vos pairs dans leurs projets</li>
                <li>Partagez vos connaissances de manière constructive</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Sécurité et Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ne partagez pas d'informations personnelles sensibles</li>
                <li>Signalez tout comportement inapproprié ou suspect</li>
                <li>Protégez votre vie privée et celle des autres</li>
                <li>N'utilisez pas la plateforme pour du harcèlement</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Contenu Approprié</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>Les contenus suivants sont strictement interdits :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contenu violent, haineux ou discriminatoire</li>
                <li>Nudité ou contenu sexuellement explicite</li>
                <li>Fausses informations ou désinformation délibérée</li>
                <li>Spam, arnaque ou contenu commercial non autorisé</li>
                <li>Violation de droits d'auteur ou propriété intellectuelle</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Collaboration et Partage</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Partagez des ressources académiques de qualité</li>
                <li>Citez toujours vos sources</li>
                <li>Contribuez activement aux Sphères Collaboratives</li>
                <li>Respectez le travail intellectuel de chacun</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Conséquences en cas de non-respect
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>Les violations de ces règles peuvent entraîner :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Un avertissement de la part de notre équipe</li>
                <li>Suppression de contenu inapproprié</li>
                <li>Suspension temporaire du compte</li>
                <li>Bannissement définitif dans les cas graves</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Signaler un problème</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Si vous constatez une violation de ces règles, signalez-la immédiatement :
              </p>
              <ul className="mt-4 space-y-2">
                <li>Via le bouton "Signaler" sur chaque publication</li>
                <li>Email: community@campussphere.com</li>
                <li>Formulaire de contact sur notre site</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}