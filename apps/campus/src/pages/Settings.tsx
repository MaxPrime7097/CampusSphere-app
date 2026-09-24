import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import {
  blockUser,
  changeUserEmail,
  changeUserPassword,
  deleteUserAccount,
  getBlockedUsers,
  getPrivacySettings,
  logoutUser,
  requestUserDataExport,
  searchUsers,
  unblockUser,
  updatePrivacySettings,
  updateUserProfile,
} from "@/services/api";
import {
  SettingsAppearanceCard,
  SettingsNotificationsCard,
  SettingsAccountCard,
  SettingsPrivacyCard,
  SettingsDangerZoneCard,
  SettingsAboutCard,
  PasswordModal,
  EmailModal,
  ProfileVisibilityModal,
  PostVisibilityModal,
  DataExportModal,
  BlockListModal,
  DeleteAccountModal,
} from "@/components/settings";

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

  const privacyQuery = useQuery({
    queryKey: ["privacy-settings"],
    queryFn: () => getPrivacySettings(),
    staleTime: 60 * 1000,
  });

  const blockedUsersQuery = useQuery({
    queryKey: ["blocked-users"],
    queryFn: () => getBlockedUsers(),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (privacyQuery.data) {
      setPrivacySettings({
        profile_visibility: privacyQuery.data.profile_visibility || "public",
        post_visibility: privacyQuery.data.post_visibility || "public",
      });
    }
    if (blockedUsersQuery.data) {
      setBlockedUsers(blockedUsersQuery.data || []);
    }
    
    const error = privacyQuery.error || blockedUsersQuery.error;
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: (error as any)?.message || "Impossible de charger vos paramètres",
        duration: 3000,
      });
    }
  }, [privacyQuery.data, privacyQuery.error, blockedUsersQuery.data, blockedUsersQuery.error, toast]);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-6 md:py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="mb-6 campus-animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Paramètres
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Gérez vos préférences, vos options de confidentialité et votre compte
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:gap-6">
          {/* Notifications */}
          <SettingsNotificationsCard />

          {/* Apparence */}
          <SettingsAppearanceCard
            darkMode={darkMode}
            onToggleTheme={toggleTheme}
            language={language}
            onLanguageChange={handleLanguageChange}
          />

          {/* Confidentialité */}
          <SettingsPrivacyCard
            onOpenProfileVisibility={() => setShowProfileVisibilityModal(true)}
            onOpenPostVisibility={() => setShowPostVisibilityModal(true)}
            onOpenDataExport={() => setShowDataExportModal(true)}
            onOpenBlockList={() => setShowBlockListModal(true)}
          />

          {/* Compte */}
          <SettingsAccountCard
            personalInfo={personalInfo}
            isEditAccountOpen={isEditAccountOpen}
            onOpenEditAccount={setIsEditAccountOpen}
            onRefreshUser={refreshUser}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onOpenEmailModal={() => setShowEmailModal(true)}
            onToast={toast}
          />

          {/* Danger Zone */}
          <SettingsDangerZoneCard
            isLoading={isLoading}
            onLogout={handleLogout}
            onOpenDeleteModal={() => setShowDeleteConfirmModal(true)}
          />

          {/* À propos */}
          <SettingsAboutCard appVersion={appVersion} />
        </div>

        {/* Modales */}
        <PasswordModal
          open={showPasswordModal}
          onOpenChange={setShowPasswordModal}
          passwordForm={passwordForm}
          onFormChange={(field, value) => setPasswordForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleChangePassword}
          isLoading={isLoading}
        />

        <EmailModal
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
          emailForm={emailForm}
          onFormChange={(field, value) => setEmailForm((prev) => ({ ...prev, [field]: value }))}
          onSubmit={handleChangeEmail}
          isLoading={isLoading}
        />

        <ProfileVisibilityModal
          open={showProfileVisibilityModal}
          onOpenChange={setShowProfileVisibilityModal}
          visibility={privacySettings.profile_visibility}
          onVisibilityChange={(value) => setPrivacySettings((prev) => ({ ...prev, profile_visibility: value }))}
          onSave={handleSaveProfileVisibility}
          isLoading={isPrivacyLoading}
        />

        <PostVisibilityModal
          open={showPostVisibilityModal}
          onOpenChange={setShowPostVisibilityModal}
          visibility={privacySettings.post_visibility}
          onVisibilityChange={(value) => setPrivacySettings((prev) => ({ ...prev, post_visibility: value }))}
          onSave={handleSavePostVisibility}
          isLoading={isPrivacyLoading}
        />

        <DataExportModal
          open={showDataExportModal}
          onOpenChange={setShowDataExportModal}
          options={dataExportOptions}
          onOptionsChange={(field, value) => setDataExportOptions((prev) => ({ ...prev, [field]: value }))}
          onExport={handleDataExport}
          isLoading={isPrivacyLoading}
        />

        <BlockListModal
          open={showBlockListModal}
          onOpenChange={setShowBlockListModal}
          blockSearch={blockSearch}
          onBlockSearchChange={setBlockSearch}
          blockedUsers={blockedUsers}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          isLoading={isPrivacyLoading}
        />

        <DeleteAccountModal
          open={showDeleteConfirmModal}
          onOpenChange={setShowDeleteConfirmModal}
          confirmText={deleteConfirmationText}
          onConfirmTextChange={setDeleteConfirmationText}
          onDelete={handleDeleteAccount}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
