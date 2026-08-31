import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ZoomIn,
  RotateCw,
  Eye,
  UserCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
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
import { getAdminVerificationQueue, verifyAdminUser } from "@/services/api";

export function AdminVerificationPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [inspectingUser, setInspectingUser] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
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

  useEffect(() => {
    void load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load(1, search);
  };

  const handleVerify = async (userId: string, isVerified: boolean) => {
    setProcessingId(userId);
    try {
      await verifyAdminUser(userId, isVerified);
      toast({
        title: isVerified ? "Étudiant certifié" : "Demande rejetée",
        description: isVerified
          ? "L'étudiant a reçu son badge de certification et une notification."
          : "La demande a été refusée.",
      });
      if (inspectingUser && inspectingUser.id === userId) {
        setIsModalOpen(false);
      }
      void load(page);
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const openInspector = (u: any) => {
    setInspectingUser(u);
    setImageRotation(0);
    setIsZoomed(false);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 font-automata">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Centre de Vérification Étudiante
              </CardTitle>
              <CardDescription className="text-xs">
                {meta?.total_items ?? users.length} étudiant(s) en attente de validation de justificatif
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setPage(1);
                void load(1, "");
              }}
              disabled={loading}
              className="h-8 gap-1.5 text-xs rounded-xl self-start md:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par matricule ou nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>
            <Button type="submit" variant="default" size="sm" className="h-9 px-3 text-xs rounded-xl">
              Rechercher
            </Button>
          </form>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Chargement de la file d'attente...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2 opacity-70" />
              <p className="text-sm font-bold text-foreground font-automata">File de vérification vide</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Toutes les demandes de certification étudiante ont été traitées. Bon travail !
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map((u) => {
                const isProcessing = processingId === u.id;
                return (
                  <div
                    key={u.id}
                    className="flex flex-col justify-between p-4 border border-border rounded-2xl bg-card hover:border-primary/40 transition-all shadow-sm space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={u.avatar || undefined} />
                        <AvatarFallback className="font-bold text-xs">
                          {(u.fullName || u.username || "E")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-foreground truncate">{u.fullName || u.username}</p>
                        <p className="text-[11px] text-muted-foreground truncate">@{u.username}</p>
                        <p className="text-[11px] text-foreground font-mono font-semibold mt-0.5">
                          Matricule: <span className="text-primary">{u.studentId || "—"}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="border-amber-500 text-amber-600 text-[10px]">
                        En attente
                      </Badge>
                    </div>

                    {/* Aperçu interactif du justificatif */}
                    <div
                      className="relative aspect-video rounded-xl overflow-hidden border bg-muted/60 cursor-pointer group"
                      onClick={() => openInspector(u)}
                    >
                      {u.cardImage ? (
                        <>
                          <img
                            src={u.cardImage}
                            alt="Preuve d'étudiant"
                            className="w-full h-full object-contain transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                            <Eye className="h-4 w-4" /> Inspecter la carte
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>Image non fournie</span>
                        </div>
                      )}
                    </div>

                    {/* Actions de certification */}
                    <div className="flex gap-2 pt-1 border-t">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-8 gap-1.5"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleVerify(u.id, true)}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Valider
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-destructive hover:bg-destructive/10 rounded-xl text-xs h-8 gap-1.5"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleVerify(u.id, false)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
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
                Page {meta.page} sur {meta.total_pages}
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

      {/* Inspecteur haute définition de carte étudiante */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 font-automata">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Inspection du Justificatif Étudiant
            </DialogTitle>
            <DialogDescription className="text-xs">
              Vérifiez la concordance entre la carte et les informations déclarées
            </DialogDescription>
          </DialogHeader>

          {inspectingUser && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-muted/40 border text-xs">
                <div>
                  <span className="text-muted-foreground">Nom complet :</span>
                  <p className="font-bold text-foreground mt-0.5 truncate">
                    {inspectingUser.fullName || inspectingUser.username}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Matricule déclaré :</span>
                  <p className="font-mono font-bold text-primary mt-0.5">
                    {inspectingUser.studentId || "Non renseigné"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Compte :</span>
                  <p className="font-medium text-foreground mt-0.5 truncate">@{inspectingUser.username}</p>
                </div>
              </div>

              {/* Visualiseur avec contrôles de zoom et rotation */}
              <div className="relative">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs rounded-lg gap-1"
                    onClick={() => setImageRotation((r) => (r + 90) % 360)}
                  >
                    <RotateCw className="h-3 w-3" />
                    Pivoter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs rounded-lg gap-1"
                    onClick={() => setIsZoomed((z) => !z)}
                  >
                    <ZoomIn className="h-3 w-3" />
                    {isZoomed ? "Réinitialiser" : "Agrandir"}
                  </Button>
                  {inspectingUser.cardImage && (
                    <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs rounded-lg gap-1">
                      <a href={inspectingUser.cardImage} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3" />
                        Plein écran
                      </a>
                    </Button>
                  )}
                </div>

                <div
                  className={`relative rounded-xl border bg-black/90 overflow-hidden flex items-center justify-center transition-all ${
                    isZoomed ? "h-[450px]" : "h-[320px]"
                  }`}
                >
                  {inspectingUser.cardImage ? (
                    <img
                      src={inspectingUser.cardImage}
                      alt="Carte d'étudiant"
                      style={{ transform: `rotate(${imageRotation}deg)` }}
                      className={`max-h-full max-w-full object-contain transition-transform duration-200 ${
                        isZoomed ? "scale-125 cursor-zoom-out" : "cursor-zoom-in"
                      }`}
                      onClick={() => setIsZoomed((z) => !z)}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucune image disponible</p>
                  )}
                </div>
              </div>

              {/* Boutons d'arbitrage */}
              <div className="flex gap-3 pt-2 border-t">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs h-9 gap-1.5"
                  onClick={() => handleVerify(inspectingUser.id, true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider et Certifier le compte
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10 rounded-xl text-xs h-9 gap-1.5"
                  onClick={() => handleVerify(inspectingUser.id, false)}
                >
                  <XCircle className="h-4 w-4" />
                  Rejeter la demande
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

