import { UniversalShareModal } from "@/components/shared/UniversalShareModal";
import { getResourceUrl } from "@/lib/utils";

interface ResourceShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSocialShare?: (platform: string) => void;
  onCopyLink?: () => void;
  isCopyingLink?: boolean;
  resource?: {
    id: string | number;
    title: string;
    description?: string;
    subject?: string;
    category?: string;
    uploader?: { name?: string };
    format?: string;
  } | null;
}

export function ResourceShareModal({
  open,
  onOpenChange,
  resource,
}: ResourceShareModalProps) {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const resourceUrl = resource ? getResourceUrl(resource) : currentUrl;
  const title = resource?.title || "Ressource académique";

  return (
    <UniversalShareModal
      open={open}
      onOpenChange={onOpenChange}
      type="resource"
      url={resourceUrl}
      title={title}
      preview={{
        title: title,
        description: resource?.description || "Consultez et téléchargez cette ressource sur CampusSphere.",
        subtitle: resource?.uploader?.name ? `Partagé par ${resource.uploader.name}` : "CampusSphere",
        badge: resource?.category || resource?.subject || "Ressource",
      }}
      allowDirectShare={true}
    />
  );
}
