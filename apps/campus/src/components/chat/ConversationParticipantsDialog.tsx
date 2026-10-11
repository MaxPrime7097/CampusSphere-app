import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ConversationParticipant } from "@/types";
import type { ContactUser } from "./NewConversationDialog";

interface ConversationParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  participants: ConversationParticipant[];
  fallbackParticipants: any[];
  currentUserId?: string;
  isGroup: boolean;
  isGroupCreator: boolean;
  pendingParticipantId: string | null;
  connections: ContactUser[];
  onRemoveMember: (userId: string, displayName: string) => void;
  onAddMember: (userId: string) => void;
}

export function ConversationParticipantsDialog({
  open,
  onOpenChange,
  loading,
  participants,
  fallbackParticipants,
  currentUserId,
  isGroup,
  isGroupCreator,
  pendingParticipantId,
  connections,
  onRemoveMember,
  onAddMember,
}: ConversationParticipantsDialogProps) {
  const { t } = useTranslation("messages");
  const effectiveParticipants =
    participants.length > 0 ? participants : fallbackParticipants;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t("participantsDialog.title")}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">
            {t("participantsDialog.loading")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {effectiveParticipants.map((participant: any) => {
                const displayName =
                  participant.full_name ||
                  participant.name ||
                  participant.username ||
                  t("participantsDialog.user");
                const isCurrent =
                  String(participant.id) === String(currentUserId || "");
                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between border rounded-md p-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{participant.username || "utilisateur"}
                      </p>
                    </div>
                    {isGroupCreator && !isCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onRemoveMember(String(participant.id), displayName)
                        }
                        disabled={pendingParticipantId === String(participant.id)}
                      >
                        {t("participantsDialog.remove")}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {isGroup && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium">{t("participantsDialog.addMember")}</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {connections
                    .filter(
                      (contact) =>
                        !effectiveParticipants.some(
                          (p: any) => String(p.id) === String(contact.id)
                        )
                    )
                    .map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm truncate">{contact.name}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onAddMember(String(contact.id))}
                          disabled={
                            !isGroupCreator ||
                            pendingParticipantId === String(contact.id)
                          }
                        >
                          {t("participantsDialog.add")}
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
