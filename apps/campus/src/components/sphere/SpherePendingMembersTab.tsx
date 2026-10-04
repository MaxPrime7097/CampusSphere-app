import { UsersThree as Users, UserCheck, UserMinus as UserX } from "@phosphor-icons/react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export interface PendingMemberItem {
  id: string;
  name: string;
  avatar?: string;
}

interface SpherePendingMembersTabProps {
  pendingMembers: PendingMemberItem[];
  processingMemberIds: Record<string, boolean>;
  onApprove: (memberId: string) => Promise<void>;
  onReject: (memberId: string) => Promise<void>;
}

export function SpherePendingMembersTab({
  pendingMembers,
  processingMemberIds,
  onApprove,
  onReject,
}: SpherePendingMembersTabProps) {
  if (pendingMembers.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={Users}
          title="Aucune demande"
          description="Il n'y a aucune demande d'adhésion en attente pour le moment."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {pendingMembers.map((m) => (
        <div key={m.id} className="p-3 border rounded-xl bg-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.avatar} />
              </Avatar>
              <div>
                <p className="font-bold text-sm">{m.name}</p>
                <Badge variant="secondary" className="text-xs">
                  En attente
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-1"
                onClick={() => onApprove(m.id)}
                disabled={processingMemberIds[m.id]}
              >
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Approuver</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 gap-1"
                onClick={() => onReject(m.id)}
                disabled={processingMemberIds[m.id]}
              >
                <UserX className="h-4 w-4" />
                <span className="hidden sm:inline">Rejeter</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
