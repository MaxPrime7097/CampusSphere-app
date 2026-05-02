import { useEffect, useState } from "react";
import { Users, Search, Ban, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getAdminUsers, banAdminUsers, verifyAdminUser } from "@/services/api";

export function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [banning, setBanning] = useState(false);
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

  useEffect(() => { void load(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load(1, search);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleBan = async () => {
    if (!selected.length || !confirm(`Bannir ${selected.length} utilisateur(s) ?`)) return;
    setBanning(true);
    try {
      const res = await banAdminUsers(selected);
      toast({ title: "Utilisateurs bannis", description: `${res?.data?.updated || selected.length} compte(s) désactivé(s)` });
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
        title: isVerified ? "Utilisateur certifié" : "Certification révoquée", 
        description: "Les privilèges de l'utilisateur ont été mis à jour." 
      });
      void load(page);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" />Utilisateurs</CardTitle>
          <CardDescription>Gestion des comptes — {meta?.total_items ?? "…"} au total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par nom, email, username..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" variant="outline" size="sm">Chercher</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1); void load(1, ""); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>

          {selected.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded-lg">
              <span className="text-sm font-medium">{selected.length} sélectionné(s)</span>
              <Button size="sm" variant="destructive" onClick={handleBan} disabled={banning} className="gap-1">
                {banning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                Bannir
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Annuler</Button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur trouvé</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selected.includes(u.id) ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50"}`}
                  onClick={() => toggleSelect(u.id)}
                >
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={u.avatar} />
                    <AvatarFallback className="text-xs">{(u.firstName || u.username || "U")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.firstName} {u.lastName} <span className="text-muted-foreground">@{u.username}</span></p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.cardImage && (
                      <a 
                        href={u.cardImage} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={(e) => e.stopPropagation()}
                        className="h-9 w-14 rounded border bg-muted overflow-hidden hover:opacity-80 transition-opacity"
                        title="Voir la carte d'étudiant"
                      >
                        <img src={u.cardImage} alt="Carte" className="w-full h-full object-cover" />
                      </a>
                    )}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {!u.isActive && <Badge variant="destructive" className="text-xs">Banni</Badge>}
                        {u.isStaff && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                        {u.isVerified ? (
                          <Badge className="bg-green-500 hover:bg-green-600 text-xs text-white">Certifié</Badge>
                        ) : u.studentId ? (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">En attente</Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        {u.studentId && !u.isVerified && (
                          <Button 
                            size="sm" 
                            className="h-6 px-2 text-[10px] bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => { e.stopPropagation(); handleVerify(u.id, true); }}
                          >
                            Certifier
                          </Button>
                        )}
                        {u.isVerified && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleVerify(u.id, false); }}
                          >
                            Révoquer
                          </Button>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {u.dateJoined ? new Date(u.dateJoined).toLocaleDateString("fr-FR") : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button size="sm" variant="outline" disabled={!meta.has_previous} onClick={() => { setPage(p => p - 1); void load(page - 1); }}>Précédent</Button>
              <span className="text-xs text-muted-foreground">Page {meta.page} / {meta.total_pages}</span>
              <Button size="sm" variant="outline" disabled={!meta.has_next} onClick={() => { setPage(p => p + 1); void load(page + 1); }}>Suivant</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
