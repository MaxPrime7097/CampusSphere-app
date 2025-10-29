import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CookiePolicy() {
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
          <Cookie className="h-16 w-16 campus-gradient mx-auto mb-4 p-3 rounded-2xl text-white" />
          <h1 className="text-4xl font-bold campus-gradient bg-clip-text text-transparent mb-4">
            Politique de Cookies
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Qu'est-ce qu'un cookie ?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite sur CampusSphere. 
                Il nous permet de reconnaître votre navigateur et de personnaliser votre expérience.
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Types de cookies utilisés</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cookies essentiels</h3>
                  <p>Nécessaires au fonctionnement de la plateforme (authentification, sécurité)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cookies de performance</h3>
                  <p>Nous aident à comprendre comment vous utilisez CampusSphere</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Cookies de personnalisation</h3>
                  <p>Mémorisent vos préférences (langue, thème, notifications)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Gestion des cookies</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              <p>
                Vous pouvez contrôler et gérer les cookies dans les paramètres de votre navigateur. 
                Notez que bloquer certains cookies peut affecter le fonctionnement de CampusSphere.
              </p>
              <p className="mt-4">
                Pour gérer vos préférences de cookies sur CampusSphere, rendez-vous dans{" "}
                <a href="/settings" className="text-primary hover:underline">
                  Paramètres → Confidentialité
                </a>
              </p>
            </CardContent>
          </Card>

          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                Pour toute question concernant notre utilisation des cookies :
              </p>
              <ul className="mt-4 space-y-2">
                <li>Email: privacy@campussphere.com</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}