import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listSphereMembers, updateSphereMember, removeSphereMember } from "@/services/api";
import { formatRelativeTime } from "@/lib/date";
import { Users, Search, Loader2, CheckCircle, Crown, Shield, User, UserMinus, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  children?: React.ReactNode;
  sphereId?: string;
  sphereName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Member {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: "admin" | "moderator" | "member";
  joinedAt: string;
  status: string;
}

export function ManageMembersModal({ children, sphereId, sphereName, open: controlledOpen, onOpenChange: setControlledOpen }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<"members" | "pending">("members");
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = setControlledOpen ?? setIsOpen;

  const loadMembers = async () => {
    if (!sphereId) return;
    setIsLoading(true);
    try {
      const data = await listSphereMembers(sphereId);
      setMembers((data || []).map((m: any) => ({
        id: String(m.id ?? m.user),
        name: m.user_info?.name || "Utilisateur",
        username: m.user_info?.username || "unknown",
        avatar: m.user_info?.avatar || undefined,
        role: (m.role || "member") as Member["role"],
        joinedAt: m.joined_at || new Date().toISOString(),
        status: m.status || "active",
      })));
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e?.message || "Impossible de charger les membres" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (open) void loadMembers(); }, [open, sphereId]);

  const activeMembers = useMemo(() =>
    members.filter((m) => m.status === "active" && (
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase())
    )), [members, searchQuery]);

  const pendingMembers = useMemo(() => members.filter((m) => m.status === "pending"), [members]);

  const setProc = (id: string, val: boolean) => setProcessing((p) => ({ ...p, [id]: val }));

  const handleRoleChange = async (memberId: string, role: string) => {
    if (!sphereId) return;
    setProc(memberId, true);
    try {
      await updateSphereMember(sphereId, memberId, { role: role as any });
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: role as Member["role"] } : m));
      toast({ title: "Rôle mis à jour" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e?.message });
    } finally { setProc(memberId, false); }
  };

  const handleRemove = async (memberId: string, name: string) => {
    if (!sphereId || !confirm(`Retirer ${name} de la sphère ?`)) return;
    setProc(memberId, true);
    try {
      await removeSphereMember(sphereId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast({ title: "Membre retiré" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e?.message });
    } finally { setProc(memberId, false); }
  };

  const handleApprove = async (memberId: string) => {
    if (!sphereId) return;
    setProc(memberId, true);
    try {
      await updateSphereMember(sphereId, memberId, { status: "active" });
      await loadMembers();
      toast({ title: "Membre approuvé" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e?.message });
    } finally { setProc(memberId, false); }
  };

  const handleReject = async (memberId: string) => {
    if (!sphereId) return;
    setProc(memberId, true);
    try {
      await removeSphereMember(sphereId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast({ title: "Demande rejetée" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e?.message });
    } finally { setProc(memberId, false); }
  };

  const roleIcon = (role: string) =>
    role === "admin" ? <Crown className="h-3.5 w-3.5 text-yellow-500" /> :
    role === "moderator" ? <Shield className="h-3.5 w-3.5 text-blue-500" /> :
    <User className="h-3.5 w-3.5 text-muted-foreground" />;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Membres{sphereName ? ` · ${sphereName}` : ""}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b">
          {(["members", "pending"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {tab === "members"
                ? `Membres (${members.filter((m) => m.status === "active").length})`
                : `En attente (${pendingMembers.length})`}
            </button>
          ))}
        </div>

        {activeTab === "members" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {activeTab === "members" && (
              activeMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Aucun membre trouvé</div>
              ) : activeMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 border rounded-lg">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className="text-xs">{m.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {roleIcon(m.role)}
                      <p className="text-sm font-medium truncate">{m.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">@{m.username} · {formatRelativeTime(m.joinedAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Select value={m.role} onValueChange={(val) => handleRoleChange(m.id, val)} disabled={processing[m.id]}>
                      <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Membre</SelectItem>
                        <SelectItem value="moderator">Modérateur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(m.id, m.name)} disabled={processing[m.id]}>
                      {processing[m.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserMinus className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))
            )}

            {activeTab === "pending" && (
              pendingMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucune demande en attente
                </div>
              ) : pendingMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2.5 border rounded-lg">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={m.avatar} />
                    <AvatarFallback className="text-xs">{m.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">@{m.username} · {formatRelativeTime(m.joinedAt)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white gap-1 px-2"
                      onClick={() => handleApprove(m.id)} disabled={processing[m.id]}>
                      {processing[m.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline text-xs">Approuver</span>
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-red-600 gap-1 px-2"
                      onClick={() => handleReject(m.id)} disabled={processing[m.id]}>
                      <UserX className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline text-xs">Rejeter</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
