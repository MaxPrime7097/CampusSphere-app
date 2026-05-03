import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseFileSizeToBytes(bytesOrString: unknown): number {
  if (typeof bytesOrString === "number" && Number.isFinite(bytesOrString)) {
    return Math.max(0, bytesOrString);
  }

  if (typeof bytesOrString !== "string") {
    return 0;
  }

  const raw = bytesOrString.trim();
  if (!raw) return 0;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return Math.max(0, numeric);
  }

  const match = raw.match(/^(\d+(?:[.,]\d+)?)\s*(b|bytes|kb|mb|gb)$/i);
  if (!match) return 0;

  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) return 0;

  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    b: 1,
    bytes: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  return Math.max(0, value * (multipliers[unit] ?? 1));
}

export function formatFileSize(bytesOrString: unknown): string {
  const bytes = parseFileSizeToBytes(bytesOrString);
  const KB = 1024;
  const MB = 1024 * 1024;
  const GB = 1024 * 1024 * 1024;

  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / KB).toFixed(1)} KB`;
}
export function formatSlugToLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  
  // Cas spéciaux connus (diplômes, etc.)
  const specials: Record<string, string> = {
    "gce_a": "GCE A Level",
    "gce_o": "GCE O Level",
    "bac": "Baccalauréat",
    "probatoire": "Probatoire",
    "bepc": "BEPC",
    "bts": "BTS",
    "hnd": "HND",
    "licence": "Licence",
    "master": "Master",
    "doctorat": "Doctorat",
  };

  if (specials[slug.toLowerCase()]) {
    return specials[slug.toLowerCase()];
  }

  // Transformation générique : python_dev -> Python Dev
  return slug
    .split(/[_-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
