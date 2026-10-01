import { encodeHashId, decodeHashId, parseSlugId } from "./hashids";
export { encodeHashId, decodeHashId, parseSlugId };
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
    "iuc": "Institut Universitaire de la Côte",
    "bts1": "BTS 1 / HND 1",
    "bts2": "BTS 2 / HND 2",
    "l1": "Licence 1 / Bachelor 1",
    "l2": "Licence 2 / Bachelor 2",
    "l3": "Licence 3 / Bachelor 3",
    "l4": "Licence 4 / Bachelor 4",
    "m1": "Master 1",
    "m2": "Master 2",
    "d1": "Doctorat 1",
    "d2": "Doctorat 2",
    "d3": "Doctorat 3",
    "douala": "Douala",
    "yaounde": "Yaoundé",
    "garoua": "Garoua",
    "bamenda": "Bamenda",
    "maroua": "Maroua",
    "bafoussam": "Bafoussam",
    "ngaoundere": "Ngaoundéré",
    "bertoua": "Bertoua",
    "ebolowa": "Ebolowa",
    "buea": "Buea",
    "dschang": "Dschang",
    "kribi": "Kribi",
    "limbe": "Limbe",
    "foumban": "Foumban",
    "nkongsamba": "Nkongsamba",
    "genie_logiciel": "Génie logiciel",
    "genie_informatique": "Génie informatique",
    "genie_civil": "Génie civil",
    "genie_electrique": "Génie électrique",
    "medecine": "Médecine",
    "pharmacie": "Pharmacie",
    "droit": "Droit",
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

export function truncate(str: string | null | undefined, length: number): string {
  if (!str) return "";
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function toSlug(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, "") // Trim hyphens
    .slice(0, 60);
}

export function getSphereUrl(sphere: { id: string | number; name?: string; slug?: string }): string {
  if (sphere.slug) return `/spheres/${sphere.slug}`;
  const hash = encodeHashId(sphere.id);
  const slug = toSlug(sphere.name);
  if (!hash) return `/spheres/${sphere.id}`;
  return slug ? `/spheres/${slug}-${hash}` : `/spheres/${hash}`;
}

export function getResourceUrl(resource: { id: string | number; title?: string }): string {
  const hash = encodeHashId(resource.id);
  const slug = toSlug(resource.title);
  if (!hash) return `/resources/${resource.id}`;
  return slug ? `/resources/${slug}-${hash}` : `/resources/${hash}`;
}

export function getEventUrl(event: { id: string | number; title?: string }): string {
  const hash = encodeHashId(event.id);
  const slug = toSlug(event.title);
  if (!hash) return `/events/${event.id}`;
  return slug ? `/events/${slug}-${hash}` : `/events/${hash}`;
}

export function getPostUrl(post: { id: string | number; content?: string }): string {
  const hash = encodeHashId(post.id);
  if (!hash) return `/posts/${post.id}`;
  const rawWords = (post.content || "").trim().split(/\s+/).slice(0, 5).join(" ");
  const slug = toSlug(rawWords);
  return slug ? `/posts/${slug}-${hash}` : `/posts/post-${hash}`;
}
