import { useState } from "react";
import { User, Bell, Shield, Globe, Moon, Sun, ChevronRight, TriangleAlert, UserX, LogOut, Loader2, Mail, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useParams, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { NotificationSettings } from "@/components/NotificationSettings";

export function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  
  // États pour les formulaires
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "Max",
    lastName: "Prime",
    username: "cypher",
    bio: "Recherche en machine learning et traitement du langage naturel"
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [emailForm, setEmailForm] = useState({
    currentEmail: "cypher@university.cm",
    newEmail: "",
    confirmEmail: ""
  });
  
  const [marketingNotifications, setMarketingNotifications] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    toast({
      title: "Thème modifié",
      description: `Passage au thème ${!darkMode ? 'sombre' : 'clair'}`,
      duration: 2000,
    });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast({
      title: "Langue modifiée",
      description: `Interface changée en ${value === 'fr' ? 'Français' : 'English'}`,
      duration: 2000,
    });
  };

  const handleMarketingNotificationChange = (value: boolean) => {
    setMarketingNotifications(value);
    toast({
      title: "Notification modifiée",
      description: `Communications marketing ${value ? 'activées' : 'désactivées'}`,
      duration: 2000,
    });
  };

  const handleLogout = async () => {
    setIsLoading(true);
    // Simuler la déconnexion
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
      duration: 2000,
    });
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    // Simuler la suppression du compte
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      variant: "destructive",
      title: "Compte supprimé",
      description: "Votre compte a été supprimé avec succès",
      duration: 3000,
    });
    setShowDeleteConfirmModal(false);
    navigate("/login");
  };

  const handleSavePersonalInfo = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Informations mises à jour",
      description: "Vos informations personnelles ont été sauvegardées",
      duration: 2000,
    });
    setShowPersonalInfoModal(false);
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        duration: 3000,
      });
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été mis à jour avec succès",
      duration: 2000,
    });
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordModal(false);
    setIsLoading(false);
  };

  const handleChangeEmail = async () => {
    if (emailForm.newEmail !== emailForm.confirmEmail) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les emails ne correspondent pas",
        duration: 3000,
      });
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Email modifié",
      description: "Votre email a été mis à jour avec succès",
      duration: 2000,
    });
    setEmailForm({ ...emailForm, currentEmail: emailForm.newEmail, newEmail: "", confirmEmail: "" });
    setShowEmailModal(false);
    setIsLoading(false);
  };

  const settingsSections = [
    {
      title: "Confidentialité",
      icon: Shield,
      items: [
        { label: "Qui peut voir mon profil", action: () => toast({ title: "Fonctionnalité à venir", description: "Cette fonctionnalité sera disponible prochainement" }) },
        { label: "Visibilité des posts", action: () => toast({ title: "Fonctionnalité à venir", description: "Cette fonctionnalité sera disponible prochainement" }) },
        { label: "Données et téléchargements", action: () => toast({ title: "Fonctionnalité à venir", description: "Cette fonctionnalité sera disponible prochainement" }) },
        { label: "Blocages", action: () => toast({ title: "Fonctionnalité à venir", description: "Cette fonctionnalité sera disponible prochainement" }) }
      ]
    },
    {
      title: "Compte",
      icon: User,
      items: [
        { label: "Informations personnelles", action: () => setShowPersonalInfoModal(true) },
        { label: "Mot de passe", action: () => setShowPasswordModal(true) },
        { label: "Email et authentification", action: () => setShowEmailModal(true) },
      ]
    }
  ];
  const dangerZone = [
    {
      title: "Danger Zone", 
      icon: TriangleAlert,
      items: [
        { label: "Déconnexion", button: LogOut, action: handleLogout, danger: true },
        { label: "Supprimer le compte", button: UserX, action: () => setShowDeleteConfirmModal(true), danger: true },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-4 md:py-6 px-3 md:px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8 campus-animate-fade-in">
          <div className="mb-2">
            <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground">
              Paramètres
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Gérez vos préférences et votre compte
          </p>
        </div>

        <div className="grid gap-4 md:gap-6">
          {/* Notifications */}
          <Card className="campus-card">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center justify-between text-lg md:text-xl">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 md:h-5 md:w-5" />
                  Notifications
                </div>
                <NotificationSettings />
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Apparence */}
          <Card className="campus-card">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Globe className="h-4 w-4 md:h-5 md:w-5" />
                Apparence et langue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <Label className="text-sm md:text-base">Thème sombre</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Basculer entre le thème clair et sombre
                  </p>
                </div>
                <Button variant="outline" onClick={toggleTheme} size="sm" className="w-full sm:w-auto">
                  {darkMode ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      Clair
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      Sombre
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm md:text-base">Langue de l'interface</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English (Coming soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Autres paramètres */}
          {settingsSections.map((section, index) => (
            <Card key={index} className="campus-card">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <section.icon className="h-4 w-4 md:h-5 md:w-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-4 md:p-6 pt-0">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <Button
                      variant="ghost"
                      className={"w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base"}
                      onClick={item.action}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                    {itemIndex < section.items.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {dangerZone.map((section, index) => (
            <Card key={index} className="campus-card">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-destructive hover:text-destructive text-lg md:text-xl">
                  <section.icon className="h-4 w-4 md:h-5 md:w-5" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-4 md:p-6 pt-0">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base ${
                        item.danger ? 'text-destructive hover:text-destructive' : ''
                      }`}
                      onClick={item.action}
                      disabled={isLoading}
                    >
                      <span>{item.label}</span>
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                      ) : (
                        <item.button className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                    </Button>
                    {itemIndex < section.items.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* À propos */}
          <Card className="campus-card">
            <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="font-automata text-lg md:text-xl">CampusSphere</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Version 1.0.0</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs md:text-sm">
                  <Button variant="link" className="px-0 h-auto">
                    Conditions d'utilisation
                  </Button>
                  <Button variant="link" className="px-0 h-auto">
                    Politique de confidentialité
                  </Button>
                  <Button variant="link" className="px-0 h-auto">
                    Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        
        {/* Modal Informations Personnelles */}
        <Dialog open={showPersonalInfoModal} onOpenChange={setShowPersonalInfoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Informations Personnelles
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={personalInfo.firstName}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={personalInfo.lastName}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={personalInfo.username}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={personalInfo.bio}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPersonalInfoModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSavePersonalInfo} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    "Sauvegarder"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Mot de Passe */}
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Changer le Mot de Passe
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    "Modifier"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Email */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Changer l'Email
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentEmail">Email actuel</Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={emailForm.currentEmail}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="newEmail">Nouvel email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="confirmEmail">Confirmer le nouvel email</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  value={emailForm.confirmEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, confirmEmail: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                  Annuler
                </Button>
                <Button onClick={handleChangeEmail} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    "Modifier"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Confirmation Suppression */}
        <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <TriangleAlert className="h-5 w-5" />
                Supprimer le Compte
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium mb-2">⚠️ Attention !</p>
                <p className="text-sm text-muted-foreground">
                  Cette action est irréversible. Toutes vos données, posts, connexions et contributions seront définitivement supprimées.
                </p>
              </div>
              <div>
                <Label htmlFor="confirmText">Tapez "SUPPRIMER" pour confirmer</Label>
                <Input
                  id="confirmText"
                  placeholder="SUPPRIMER"
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeleteConfirmModal(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Supprimer le Compte
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}