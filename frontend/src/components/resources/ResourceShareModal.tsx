import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Copy, Loader2 } from "lucide-react";
import { FaFacebook, FaTwitter, FaWhatsapp, FaLinkedin } from "react-icons/fa";

interface ResourceShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSocialShare: (platform: string) => void;
  onCopyLink: () => void;
  isCopyingLink: boolean;
}

export function ResourceShareModal({
  open,
  onOpenChange,
  onSocialShare,
  onCopyLink,
  isCopyingLink,
}: ResourceShareModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager la ressource</DialogTitle>
          <DialogDescription>
            Partagez cette ressource avec votre réseau ou copiez le lien.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
              onClick={() => onSocialShare("whatsapp")}
            >
              <FaWhatsapp className="h-5 w-5 text-green-500" />
              <span>WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
              onClick={() => onSocialShare("facebook")}
            >
              <FaFacebook className="h-5 w-5 text-blue-600" />
              <span>Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-all"
              onClick={() => onSocialShare("twitter")}
            >
              <FaTwitter className="h-5 w-5 text-sky-500" />
              <span>Twitter / X</span>
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 h-12 justify-start px-4 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all"
              onClick={() => onSocialShare("linkedin")}
            >
              <FaLinkedin className="h-5 w-5 text-blue-700" />
              <span>LinkedIn</span>
            </Button>
          </div>

          <Separator />

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <label htmlFor="resource-link" className="sr-only">
                Lien
              </label>
              <div className="relative">
                <Input
                  id="resource-link"
                  defaultValue={typeof window !== "undefined" ? window.location.href : ""}
                  readOnly
                  className="pr-10 h-11 bg-muted/30"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1 h-9 px-3"
                  onClick={onCopyLink}
                  disabled={isCopyingLink}
                >
                  {isCopyingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
