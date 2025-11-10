import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function EditProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "Alex Dubois",
    username: "alex_dubois",
    bio: "Étudiant en informatique passionné par l'IA et le développement web. Toujours prêt à aider et à apprendre !",
    location: "Paris, France",
    website: "alexdubois.dev",
    university: "Université Paris-Saclay",
    field: "Informatique",
    year: "Master 2"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profil mis à jour",
      description: "Vos modifications ont été enregistrées avec succès.",
    });
    navigate("/profile");
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold campus-gradient bg-clip-text text-transparent">
            Modifier le profil
          </h1>
          <Button variant="outline" onClick={() => navigate("/profile")}>
            Annuler
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Photo de profil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="campus-gradient text-white text-2xl">
                    AD
                  </AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Changer la photo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card className="campus-card">
            <CardHeader>
              <CardTitle>Informations académiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">Université</Label>
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => handleChange("university", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field">Domaine d'études</Label>
                  <Input
                    id="field"
                    value={formData.field}
                    onChange={(e) => handleChange("field", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Année</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => handleChange("year", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile")}
            >
              Annuler
            </Button>
            <Button type="submit" className="campus-gradient text-white hover:opacity-90">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
