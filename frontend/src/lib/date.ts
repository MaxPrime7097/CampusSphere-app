import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

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
  if (!date) return "Date inconnue";

  return formatDistanceToNowStrict(date, {
    addSuffix: true,
    locale: fr,
  });
}

export function formatFrenchDate(value?: string | number | Date | null, pattern = "dd/MM/yyyy") {
  const date = toDate(value);
  if (!date) return "Date inconnue";

  return format(date, pattern, { locale: fr });
}
