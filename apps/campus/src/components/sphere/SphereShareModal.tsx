import { UniversalShareModal } from "@/components/shared/UniversalShareModal";
import { getSphereUrl } from "@/lib/utils";

interface SphereShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSocialShare?: (platform: string) => void;
  onCopyLink?: () => void;
  isCopyingLink?: boolean;
  sphere?: {
    id: string | number;
    name: string;
    description?: string;
    category?: string;
    bannerImage?: string;
  } | null;
}

export function SphereShareModal({
  open,
  onOpenChange,
  sphere,
}: SphereShareModalProps) {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const sphereUrl = sphere ? getSphereUrl(sphere) : currentUrl;
  const title = sphere?.name || "Sphère de collaboration";

  return (
    <UniversalShareModal
      open={open}
      onOpenChange={onOpenChange}
      type="sphere"
      url={sphereUrl}
      title={title}
      preview={{
        title: title,
        description: sphere?.description || "Rejoignez cette communauté sur CampusSphere.",
        subtitle: "Sphère de collaboration",
        badge: sphere?.category || "Sphère",
        imageUrl: sphere?.bannerImage || null,
      }}
      allowDirectShare={true}
    />
  );
}
