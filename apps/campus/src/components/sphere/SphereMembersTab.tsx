import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SealCheck as BadgeCheck, Crown, DotsThreeVertical as MoreVertical } from "@phosphor-icons/react";

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
      {members.map((m) => (
        <div
          key={m.id}
          className="p-3 border rounded-xl flex justify-between items-center bg-card"
        >
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => m.username && navigate(`/profile/${m.username}`)}
          >
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={m.avatar} />
              <AvatarFallback>{m.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-sm flex items-center gap-1">
                {m.name}
                {m.isVerified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" weight="fill" />
                )}
                {m.isCreator && <Crown className="h-3 w-3 text-yellow-500" />}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                {m.role}
              </p>
            </div>
          </div>

          {canModerateMembers &&
            !m.isCreator &&
            m.userId &&
            String(m.userId) !== String(currentUserId) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
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
  );
}
