import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { enUS } from "date-fns/locale/en-US";
import i18n from "../i18n";

function getDateLocale() {
  const current = i18n.language || "fr";
  return current.startsWith("en") ? enUS : fr;
}

function toDate(value?: string | number | Date | null) {
  if (!value) return null;

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : null;
}

export function formatRelativeTime(value?: string | number | Date | null) {
  const date = toDate(value);
  if (!date) return i18n.language?.startsWith("en") ? "Unknown date" : "Date inconnue";

  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: getDateLocale(),
  });
}

export function formatLocalDate(value?: string | number | Date | null, pattern?: string) {
  const date = toDate(value);
  if (!date) return i18n.language?.startsWith("en") ? "Unknown date" : "Date inconnue";

  const defaultPattern = i18n.language?.startsWith("en") ? "MM/dd/yyyy" : "dd/MM/yyyy";
  return format(date, pattern || defaultPattern, { locale: getDateLocale() });
}

export function formatFrenchDate(value?: string | number | Date | null, pattern = "dd/MM/yyyy") {
  return formatLocalDate(value, pattern);
}

export const MINIMUM_AGE = 16;

export const parseISODate = (value?: string | null): Date | null => {
  if (!value || typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const [year, month, day] = value.trim().split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isExactMatch =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  return isExactMatch ? parsed : null;
};

export const getAgeFromDate = (birthDate: Date, today = new Date()): number => {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() >= birthDate.getUTCDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};

export const getBirthDateMax = (): string => {
  const now = new Date();
  const maxDate = new Date(Date.UTC(now.getUTCFullYear() - MINIMUM_AGE, now.getUTCMonth(), now.getUTCDate()));
  return maxDate.toISOString().split("T")[0];
};

export const validateBirthDate = (value?: string | null): { valid: boolean; error?: string } => {
  if (!value || !value.trim()) {
    return { valid: false, error: "La date de naissance est obligatoire" };
  }
  const birthDate = parseISODate(value.trim());
  if (!birthDate) {
    return { valid: false, error: "Format de date de naissance invalide (AAAA-MM-JJ attendu)" };
  }
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (birthDate > todayUtc) {
    return { valid: false, error: "La date de naissance ne peut pas être dans le futur" };
  }
  const age = getAgeFromDate(birthDate, todayUtc);
  if (age < MINIMUM_AGE) {
    return { valid: false, error: `Vous devez avoir au moins ${MINIMUM_AGE} ans` };
  }
  return { valid: true };
};
