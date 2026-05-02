import { useEffect, useState } from "react";
import { ShieldCheck, Search, Loader2, RefreshCw, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getAdminVerificationQueue, verifyAdminUser } from "@/services/api";

export function AdminVerificationPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const { toast } = useToast();

  const load = async (p = 1, s = search) => {
    setLoading(true);
    try {
      const res = await getAdminVerificationQueue({ page: p, search: s });
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

  const handleVerify = async (userId: string, isVerified: boolean) => {
    try {
      await verifyAdminUser(userId, isVerified);
      toast({ 
        title: isVerified ? "Utilisateur certifié" : "Demande rejetée", 
        description: "Le statut a été mis à jour avec succès." 
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
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />File de Vérification</CardTitle>
          <CardDescription>Étudiants en attente de certification — {meta?.total_items ?? users.length} en attente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher par matricule ou username..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button type="submit" variant="outline" size="sm">Chercher</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSearch(""); setPage(1); void load(1, ""); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground">Aucune demande en attente</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {users.map((u) => (
                <div key={u.id} className="flex flex-col gap-3 p-4 border rounded-xl bg-card hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatar} />
                      <AvatarFallback>{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{u.fullName || u.username}</p>
                      <p className="text-xs text-muted-foreground">Matricule: <span className="text-foreground font-mono">{u.studentId}</span></p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">Attente</Badge>
                  </div>

                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted group">
                    {u.cardImage ? (
                      <>
                        <img src={u.cardImage} alt="Carte Étudiant" className="w-full h-full object-contain" />
                        <a 
                          href={u.cardImage} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-2"
                        >
                          <ExternalLink className="h-4 w-4" /> Voir en grand
                        </a>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground italic text-xs">
                        Image non disponible
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" 
                      size="sm"
                      onClick={() => handleVerify(u.id, true)}
                    >
                      <CheckCircle className="h-4 w-4" /> Valider
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-destructive hover:bg-destructive/10 gap-2" 
                      size="sm"
                      onClick={() => handleVerify(u.id, false)}
                    >
                      <XCircle className="h-4 w-4" /> Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4">
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
