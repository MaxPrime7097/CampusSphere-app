import { Suspense, lazy, useEffect, useState } from "react";
import { User, Bell, Shield, Globe, Moon, Sun, ChevronRight, TriangleAlert, UserX, LogOut, Loader2, Mail, Lock, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  blockUser,
  changeUserEmail,
  changeUserPassword,
  deleteUserAccount,
  getBlockedUsers,
  getCurrentUser,
  getPrivacySettings,
  logoutUser,
  requestUserDataExport,
  searchUsers,
  unblockUser,
  updatePrivacySettings,
  updateUserProfile,
} from "@/services/api";
import ModalLoadingFallback from "@/components/shared/ModalLoadingFallback";

const EditAccountModal = lazy(() => import("@/components/modals/EditAccountModal").then((module) => ({ default: module.EditAccountModal })));

export function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser, refreshUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState("fr");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else if (storedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      setDarkMode(prefersDark);
    }
  }, [setDarkMode]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showProfileVisibilityModal, setShowProfileVisibilityModal] = useState(false);
  const [showPostVisibilityModal, setShowPostVisibilityModal] = useState(false);
  const [showDataExportModal, setShowDataExportModal] = useState(false);
  const [showBlockListModal, setShowBlockListModal] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  
  // États pour les formulaires
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    username: "",
    bio: "",
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [emailForm, setEmailForm] = useState({
    currentEmail: "",
    newEmail: "",
    confirmEmail: "",
    phoneNumber: ""
  });
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public",
    post_visibility: "public",
  });
  const [dataExportOptions, setDataExportOptions] = useState({
    include_connections: true,
    include_posts: true,
  });
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockSearch, setBlockSearch] = useState("");
  const [isPrivacyLoading, setIsPrivacyLoading] = useState(false);
  const appVersion = import.meta.env.VITE_APP_VERSION || "2.0.0";
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const blockSearchKey = blockSearch.trim().toLowerCase();
  const blockSearchQuery = useQuery({
    queryKey: ["settings", "block-search", blockSearchKey],
    queryFn: () => searchUsers(blockSearch.trim()),
    enabled: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (currentUser) {
      setPersonalInfo({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        username: currentUser.username || "",
        bio: currentUser.bio || "",
      });
      setEmailForm((prev) => ({
        ...prev,
        currentEmail: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;

    const hydrateSettingsFromUser = async () => {
      try {
        const [privacy, blocks] = await Promise.all([
          getPrivacySettings(),
          getBlockedUsers(),
        ]);
        if (!isMounted) return;

        if (privacy) {
          setPrivacySettings({
            profile_visibility: privacy.profile_visibility || "public",
            post_visibility: privacy.post_visibility || "public",
          });
        }
        setBlockedUsers(blocks || []);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.message || "Impossible de charger vos paramètres",
          duration: 3000,
        });
      }
    };

    hydrateSettingsFromUser();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    setDarkMode(nextDarkMode);
    document.documentElement.classList.toggle('dark', nextDarkMode);
    localStorage.setItem('theme', nextDarkMode ? 'dark' : 'light');
    toast({
      title: "Thème modifié",
      description: `Passage au thème ${nextDarkMode ? 'sombre' : 'clair'}`,
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
    try {
      await logoutUser();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès",
        duration: 2000,
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de vous déconnecter",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "SUPPRIMER") {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez saisir SUPPRIMER pour confirmer",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await deleteUserAccount(deleteConfirmationText);
      toast({
        variant: "destructive",
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès",
        duration: 3000,
      });
      setShowDeleteConfirmModal(false);
      navigate("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de supprimer votre compte",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
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
    try {
      await changeUserPassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès",
        duration: 2000,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordModal(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de modifier votre mot de passe",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    setIsLoading(true);
    try {
      // Email update
      if (emailForm.newEmail) {
        if (emailForm.newEmail !== emailForm.confirmEmail) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Les emails ne correspondent pas",
            duration: 3000,
          });
          setIsLoading(false);
          return;
        }
        
        await changeUserEmail({
          current_email: emailForm.currentEmail,
          new_email: emailForm.newEmail,
        });
      }

      // Phone update
      await updateUserProfile({
        phone_number: emailForm.phoneNumber,
      });

      toast({
        title: "Informations mises à jour",
        description: "Vos informations d'authentification ont été mises à jour",
        duration: 2000,
      });
      
      setEmailForm((prev) => ({
        ...prev,
        currentEmail: emailForm.newEmail || prev.currentEmail,
        newEmail: "",
        confirmEmail: "",
      }));
      setShowEmailModal(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error?.message || "Impossible de modifier vos informations",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfileVisibility = async () => {
    setIsPrivacyLoading(true);
    try {
      await updatePrivacySettings({ profile_visibility: privacySettings.profile_visibility });
      toast({ title: "Confidentialité mise à jour", description: "La visibilité du profil a été enregistrée", duration: 2000 });
      setShowProfileVisibilityModal(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error?.message || "Impossible de mettre à jour la visibilité du profil", duration: 3000 });
    } finally {
      setIsPrivacyLoading(false);
    }
  };

  const handleSavePostVisibility = async () => {
    setIsPrivacyLoading(true);
    try {
      await updatePrivacySettings({ post_visibility: privacySettings.post_visibility });
      toast({ title: "Confidentialité mise à jour", description: "La visibilité des posts a été enregistrée", duration: 2000 });
      setShowPostVisibilityModal(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error?.message || "Impossible de mettre à jour la visibilité des posts", duration: 3000 });
    } finally {
      setIsPrivacyLoading(false);
    }
  };

  const handleDataExport = async () => {
    setIsPrivacyLoading(true);
    try {
      const data = await requestUserDataExport(dataExportOptions);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campussphere-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "Export généré", description: "Votre fichier de données a été téléchargé", duration: 2500 });
      setShowDataExportModal(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error?.message || "Impossible de générer l'export des données", duration: 3000 });
    } finally {
      setIsPrivacyLoading(false);
    }
  };

  const refreshBlockList = async () => {
    const blocks = await getBlockedUsers();
    setBlockedUsers(blocks || []);
  };

  const handleBlockUser = async () => {
    if (!blockSearch.trim()) return;
    setIsPrivacyLoading(true);
    try {
      const result = await blockSearchQuery.refetch();
      const users = result.data || [];
      const target = users?.[0];
      if (!target?.id) {
        toast({ variant: "destructive", title: "Utilisateur introuvable", description: "Aucun utilisateur trouvé avec cette recherche", duration: 2500 });
        return;
      }
      await blockUser(Number(target.id));
      await refreshBlockList();
      setBlockSearch("");
      toast({ title: "Utilisateur bloqué", description: `${target.username} a été ajouté à votre liste de blocage`, duration: 2500 });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error?.message || "Impossible de bloquer cet utilisateur", duration: 3000 });
    } finally {
      setIsPrivacyLoading(false);
    }
  };

  const handleUnblockUser = async (blockId: number) => {
    setIsPrivacyLoading(true);
    try {
      await unblockUser(blockId);
      await refreshBlockList();
      toast({ title: "Utilisateur débloqué", description: "Le blocage a été supprimé", duration: 2000 });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erreur", description: error?.message || "Impossible de débloquer cet utilisateur", duration: 3000 });
    } finally {
      setIsPrivacyLoading(false);
    }
  };

  const settingsSections = [
    {
      title: "Confidentialité",
      icon: Shield,
      items: [
        { label: "Qui peut voir mon profil", action: () => setShowProfileVisibilityModal(true) },
        { label: "Visibilité des posts", action: () => setShowPostVisibilityModal(true) },
        { label: "Données et téléchargements", action: () => setShowDataExportModal(true) },
        { label: "Blocages", action: () => setShowBlockListModal(true) }
      ]
    },
    {
      title: "Compte",
      icon: User,
      items: [
        { label: "Informations personnelles", action: () => {} },
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
                    {item.label === "Informations personnelles" ? (
                      <>
                        <Button
                          variant="ghost"
                          className={"w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base"}
                          onClick={() => setIsEditAccountOpen(true)}
                        >
                          <span>{item.label}</span>
                          <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        {isEditAccountOpen && (
                          <Suspense fallback={<ModalLoadingFallback />}>
                            <EditAccountModal
                              open={isEditAccountOpen}
                              onOpenChange={setIsEditAccountOpen}
                              initialData={personalInfo}
                              onSuccess={async () => {
                                await refreshUser();
                                toast({ title: "Informations mises à jour" });
                              }}
                            />
                          </Suspense>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        className={"w-full justify-between h-auto p-3 md:p-4 text-sm md:text-base"}
                        onClick={item.action}
                      >
                        <span>{item.label}</span>
                        <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    )}
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
                  <h3 className="font-automata text-primary text-lg md:text-xl">CampusSphere</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">Version {appVersion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other Modals */}

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
                Email et authentification
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                <Input
                  id="phoneNumber"
                  placeholder="6XXXXXXXX"
                  value={emailForm.phoneNumber}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              <Separator className="my-2" />
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
                      Mise à jour...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showProfileVisibilityModal} onOpenChange={setShowProfileVisibilityModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Visibilité du profil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Qui peut voir mon profil</Label>
              <Select
                value={privacySettings.profile_visibility}
                onValueChange={(value) => setPrivacySettings((prev) => ({ ...prev, profile_visibility: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Tout le monde</SelectItem>
                  <SelectItem value="connections">Mes connexions uniquement</SelectItem>
                  <SelectItem value="private">Moi uniquement</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Cette option est active et synchronisée avec votre compte.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowProfileVisibilityModal(false)}>Annuler</Button>
                <Button onClick={handleSaveProfileVisibility} disabled={isPrivacyLoading}>Enregistrer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPostVisibilityModal} onOpenChange={setShowPostVisibilityModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Visibilité des posts</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Label>Qui peut voir mes nouveaux posts</Label>
              <Select
                value={privacySettings.post_visibility}
                onValueChange={(value) => setPrivacySettings((prev) => ({ ...prev, post_visibility: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Tout le monde</SelectItem>
                  <SelectItem value="connections">Mes connexions uniquement</SelectItem>
                  <SelectItem value="private">Moi uniquement</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Cette option est active et sera utilisée par défaut sur vos prochaines publications.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowPostVisibilityModal(false)}>Annuler</Button>
                <Button onClick={handleSavePostVisibility} disabled={isPrivacyLoading}>Enregistrer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDataExportModal} onOpenChange={setShowDataExportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Export des données</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-connections">Inclure les connexions</Label>
                <Switch
                  id="include-connections"
                  checked={dataExportOptions.include_connections}
                  onCheckedChange={(value) => setDataExportOptions((prev) => ({ ...prev, include_connections: value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-posts">Inclure les posts</Label>
                <Switch
                  id="include-posts"
                  checked={dataExportOptions.include_posts}
                  onCheckedChange={(value) => setDataExportOptions((prev) => ({ ...prev, include_posts: value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">Fonctionnalité disponible : un fichier JSON est généré et téléchargé immédiatement.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDataExportModal(false)}>Annuler</Button>
                <Button onClick={handleDataExport} disabled={isPrivacyLoading}>Télécharger mes données</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBlockListModal} onOpenChange={setShowBlockListModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Liste de blocage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom d'utilisateur à bloquer"
                  value={blockSearch}
                  onChange={(e) => setBlockSearch(e.target.value)}
                />
                <Button onClick={handleBlockUser} disabled={isPrivacyLoading || !blockSearch.trim()}>Bloquer</Button>
              </div>
              <p className="text-xs text-muted-foreground">Fonctionnalité disponible : blocage et déblocage en temps réel.</p>
              <div className="space-y-2 max-h-60 overflow-auto">
                {blockedUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun utilisateur bloqué.</p>
                ) : blockedUsers.map((block: any) => (
                  <div key={block.id} className="flex items-center justify-between border rounded-md p-2">
                    <span className="text-sm">@{block.blocked_user?.username || block.blocked}</span>
                    <Button variant="outline" size="sm" onClick={() => handleUnblockUser(block.id)} disabled={isPrivacyLoading}>
                      Débloquer
                    </Button>
                  </div>
                ))}
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
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
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
