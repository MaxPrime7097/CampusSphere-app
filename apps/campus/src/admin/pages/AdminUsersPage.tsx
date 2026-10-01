import { useEffect, useState, useMemo } from "react";
import { UsersThree as Users, MagnifyingGlass as Search, Prohibit as Ban, Spinner as Loader2, ArrowClockwise as RefreshCw, ShieldCheck, ShieldWarning as ShieldAlert, UserCheck, UserMinus as UserX, Envelope as Mail, Calendar, ArrowSquareOut as ExternalLink, Eye, CheckCircle as CheckCircle2, XCircle, Funnel as Filter } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAdminUsers, banAdminUsers, verifyAdminUser } from "@/services/api";

type FilterStatus = "all" | "verified" | "pending" | "banned" | "staff";

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [banning, setBanning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  const load = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ page: p, search: s });
      setUsers(res?.data || []);
      setMeta(res?.meta?.pagination || null);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load(1, search);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredUsers.length) {
      setSelected([]);
    } else {
      setSelected(filteredUsers.map((u) => u.id));
    }
  };

  const handleBan = async () => {
    if (!selected.length || !confirm(`Confirmer le bannissement de ${selected.length} compte(s) ?`)) return;
    setBanning(true);
    try {
      const res = await banAdminUsers(selected);
      toast({
        title: "Comptes désactivés",
        description: `${res?.data?.updated || selected.length} utilisateur(s) banni(s).`,
      });
      setSelected([]);
      void load(page);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setBanning(false);
    }
  };

  const handleVerify = async (userId: string, isVerified: boolean) => {
    try {
      await verifyAdminUser(userId, isVerified);
      toast({
        title: isVerified ? "Étudiant certifié" : "Certification révoquée",
        description: "Le statut de vérification a été mis à jour.",
      });
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, isVerified });
      }
      void load(page);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    }
  };

  // Filtrage côté client sur la page courante pour réactivité instantanée
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterStatus === "verified") return u.isVerified;
      if (filterStatus === "pending") return !u.isVerified && Boolean(u.studentId);
      if (filterStatus === "banned") return !u.isActive;
      if (filterStatus === "staff") return u.isStaff || u.isSuperuser;
      return true;
    });
  }, [users, filterStatus]);

  const openUserDetail = (u: any) => {
    setSelectedUser(u);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* En-tête et KPI rapides */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-automata">
                <Users className="h-4 w-4 text-primary" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription className="text-xs">
                {meta?.total_items ?? users.length} comptes enregistrés sur CampusSphere
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  void load(1, "");
                }}
                disabled={loading}
                className="h-8 gap-1.5 text-xs rounded-xl"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barre de recherche et Filtres */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Nom, @username, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl"
                />
              </div>
              <Button type="submit" variant="default" size="sm" className="h-9 px-3 text-xs rounded-xl">
                Rechercher
              </Button>
            </form>

            {/* Onglets de filtrage */}
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
              {[
                { key: "all", label: "Tous" },
                { key: "verified", label: "Certifiés" },
                { key: "pending", label: "En attente" },
                { key: "staff", label: "Staff/Admin" },
                { key: "banned", label: "Bannis" },
              ].map((tab) => (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={filterStatus === tab.key ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs rounded-lg font-medium"
                  onClick={() => setFilterStatus(tab.key as FilterStatus)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Barre d'action groupée (Bulk) */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl">
              <span className="text-xs font-semibold text-destructive">
                {selected.length} utilisateur(s) sélectionné(s)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBan}
                  disabled={banning}
                  className="h-7 gap-1.5 text-xs rounded-lg"
                >
                  {banning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                  Bannir les comptes
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected([])}
                  className="h-7 text-xs rounded-lg"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Liste des utilisateurs */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement des utilisateurs...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed">
              <UserX className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs font-semibold text-foreground">Aucun utilisateur trouvé</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Essayez d'ajuster votre recherche ou les filtres sélectionnés
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => {
                const isSelected = selected.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(u.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <Avatar className="h-10 w-10 flex-shrink-0 border border-border">
                        <AvatarImage src={u.avatar || undefined} />
                        <AvatarFallback className="text-xs font-bold">
                          {(u.firstName || u.username || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground truncate">
                            {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username}
                          </p>
                          <span className="text-xs text-muted-foreground truncate">@{u.username}</span>

                          {/* Badges de statut */}
                          {!u.isActive && (
                            <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                              Banni
                            </Badge>
                          )}
                          {u.isStaff && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                              Staff
                            </Badge>
                          )}
                          {u.isVerified ? (
                            <Badge className="bg-green-600 hover:bg-green-600 text-white px-1.5 py-0 text-[10px]">
                              Certifié
                            </Badge>
                          ) : u.studentId ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-600 px-1.5 py-0 text-[10px]">
                              En attente
                            </Badge>
                          ) : null}
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Actions sur l'utilisateur */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {u.cardImage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-primary gap-1"
                          onClick={() => openUserDetail(u)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Détails</span>
                        </Button>
                      )}

                      {u.studentId && !u.isVerified && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-[11px] bg-green-600 hover:bg-green-700 text-white rounded-lg gap-1"
                          onClick={() => handleVerify(u.id, true)}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="hidden sm:inline">Certifier</span>
                        </Button>
                      )}

                      {u.isVerified && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => handleVerify(u.id, false)}
                        >
                          Révoquer
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => openUserDetail(u)}
                        title="Voir la fiche complète"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.has_previous}
                onClick={() => {
                  setPage((p) => p - 1);
                  void load(page - 1);
                }}
                className="h-8 text-xs rounded-xl"
              >
                Précédent
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {meta.page} sur {meta.total_pages} ({meta.total_items} utilisateurs)
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.has_next}
                onClick={() => {
                  setPage((p) => p + 1);
                  void load(page + 1);
                }}
                className="h-8 text-xs rounded-xl"
              >
                Suivant
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modale Fiche Utilisateur Détaillée */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 font-automata">
              <Users className="h-4 w-4 text-primary" />
              Fiche Utilisateur
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informations détaillées et options d'administration
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={selectedUser.avatar || undefined} />
                  <AvatarFallback className="font-bold">
                    {(selectedUser.firstName || selectedUser.username || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground">
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.username}
                  </h3>
                  <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  {selectedUser.isVerified ? (
                    <Badge className="bg-green-600 text-white text-xs">Certifié</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Non certifié</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border bg-card">
                  <span className="text-muted-foreground">Matricule Étudiant :</span>
                  <p className="font-mono font-bold text-foreground mt-0.5">
                    {selectedUser.studentId || "Non renseigné"}
                  </p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <span className="text-muted-foreground">Date d'inscription :</span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedUser.dateJoined
                      ? new Date(selectedUser.dateJoined).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Inconnue"}
                  </p>
                </div>
              </div>

              {/* Aperçu de la carte d'étudiant */}
              {selectedUser.cardImage && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground">Justificatif Étudiant :</span>
                  <div className="relative aspect-video rounded-xl overflow-hidden border bg-muted group">
                    <img
                      src={selectedUser.cardImage}
                      alt="Preuve d'étudiant"
                      className="w-full h-full object-contain"
                    />
                    <a
                      href={selectedUser.cardImage}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2"
                    >
                      <ExternalLink className="h-4 w-4" /> Ouvrir en plein écran
                    </a>
                  </div>
                </div>
              )}

              {/* Boutons d'action dans la modale */}
              <div className="flex gap-2 pt-2 border-t">
                {selectedUser.studentId && !selectedUser.isVerified && (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs"
                    size="sm"
                    onClick={() => handleVerify(selectedUser.id, true)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Valider la certification
                  </Button>
                )}

                {selectedUser.isVerified && (
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:bg-destructive/10 rounded-xl text-xs"
                    size="sm"
                    onClick={() => handleVerify(selectedUser.id, false)}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Révoquer la certification
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={async () => {
                    if (confirm(`Confirmer le bannissement du compte @${selectedUser.username} ?`)) {
                      await banAdminUsers([selectedUser.id]);
                      toast({ title: "Utilisateur banni" });
                      setIsDetailOpen(false);
                      void load(page);
                    }
                  }}
                >
                  <Ban className="h-3.5 w-3.5 mr-1.5" />
                  Bannir
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

