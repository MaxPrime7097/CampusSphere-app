import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SealCheck as BadgeCheck,
  Crown,
  DotsThreeVertical as MoreVertical,
  MagnifyingGlass as Search,
  GraduationCap,
  ShieldCheck,
  UsersThree as Users,
} from "@phosphor-icons/react";

export interface SphereMemberItem {
  id: string;
  userId: string;
  name: string;
  username?: string;
  avatar?: string;
  role: string;
  isVerified?: boolean;
  isCreator?: boolean;
}

interface SphereMembersTabProps {
  members: SphereMemberItem[];
  canModerateMembers: boolean;
  currentUserId: string | null;
  onUpdateRole: (memberId: string, currentRole: string) => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
}

export function SphereMembersTab({
  members,
  canModerateMembers,
  currentUserId,
  onUpdateRole,
  onRemoveMember,
}: SphereMembersTabProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const query = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        (m.username && m.username.toLowerCase().includes(query))
    );
  }, [members, search]);

  const renderRoleBadge = (m: SphereMemberItem) => {
    if (m.isCreator) {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 gap-1 font-semibold">
          <Crown className="h-3 w-3 text-amber-500" /> Créateur
        </Badge>
      );
    }
    if (m.role === "teacher") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 gap-1 font-semibold">
          <GraduationCap className="h-3 w-3 text-indigo-500" /> Enseignant
        </Badge>
      );
    }
    if (m.role === "admin") {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary bg-primary/10 gap-1 font-semibold">
          <ShieldCheck className="h-3 w-3 text-primary" /> Admin
        </Badge>
      );
    }
    return (
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
        Membre
      </span>
    );
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">
            Membres de la sphère
            <span className="ml-1.5 text-xs text-muted-foreground font-normal">
              ({filteredMembers.length}{search.trim() ? ` sur ${members.length}` : ""})
            </span>
          </h3>
        </div>
        {members.length > 5 && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher un membre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs rounded-lg"
            />
          </div>
        )}
      </div>

      {filteredMembers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          Aucun membre ne correspond à votre recherche.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              className="p-3 border rounded-xl flex justify-between items-center bg-card hover:border-primary/20 transition-colors"
            >
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity min-w-0"
                onClick={() => m.username && navigate(`/profile/${m.username}`)}
              >
                <Avatar className="h-9 w-9 border flex-shrink-0">
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback>{m.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-bold text-sm flex items-center gap-1 truncate">
                    <span className="truncate">{m.name}</span>
                    {m.isVerified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" weight="fill" />
                    )}
                  </p>
                  <div className="mt-0.5">{renderRoleBadge(m)}</div>
                </div>
              </div>

              {canModerateMembers &&
                !m.isCreator &&
                m.userId &&
                String(m.userId) !== String(currentUserId) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onUpdateRole(m.id, m.role)}>
                        {m.role === "admin" ? "Retirer Admin" : "Nommer Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 font-medium"
                        onClick={() => onRemoveMember(m.id)}
                      >
                        Retirer de la sphère
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

