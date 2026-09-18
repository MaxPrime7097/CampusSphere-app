/**
 * CampusSphere & Sphera — Centralized Error Parsing and Translation
 *
 * Provides user-friendly, empathetic French translations for all API errors,
 * HTTP status codes, machine slugs, rate limits, quotas, and network errors.
 */

export interface ParsedErrorDetails {
  title: string;
  message: string;
  isRateLimit: boolean;
  isQuotaLimit: boolean;
  isAuthError: boolean;
  statusCode?: number;
  retryAfterSeconds?: number;
  resetsOn?: string;
}

const FIELD_TRANSLATIONS: Record<string, string> = {
  username: "Nom d'utilisateur",
  email: "Adresse email",
  password: "Mot de passe",
  first_name: "Prénom",
  last_name: "Nom",
  name: "Nom",
  title: "Titre",
  description: "Description",
  content: "Contenu",
  file: "Fichier",
  tool_types: "Outils de révision",
  sphere: "Sphère",
  sphere_id: "Sphère",
  resource_id: "Ressource",
  role: "Rôle",
  bio: "Biographie",
  university: "Université",
  major: "Filière / Spécialité",
  degree: "Niveau d'études",
  avatar: "Photo de profil",
  banner: "Bannière",
  start_date: "Date de début",
  end_date: "Date de fin",
  location: "Lieu",
  max_participants: "Nombre max de participants",
};

export function translateField(field: string): string {
  if (!field) return "Ce champ";
  const normalized = field.toLowerCase().replace(/\[\d+\]/g, "");
  return FIELD_TRANSLATIONS[normalized] || field.replace(/_/g, " ");
}

/**
 * Parses technical messages or raw strings into clear, human-readable French.
 */
export function translateError(rawMsg: string, status?: number): string {
  if (!rawMsg || typeof rawMsg !== "string") {
    if (status) return getStatusFallback(status);
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }

  const trimmed = rawMsg.trim();
  const lower = trimmed.toLowerCase();

  // 1. Quota & Limites Sphera
  if (
    lower === "weekly_limit_reached" ||
    lower.includes("weekly_limit_reached") ||
    lower.includes("tu as utilisé tes") ||
    (lower.includes("limite") && lower.includes("semaine") && lower.includes("génération"))
  ) {
    return "Limite hebdomadaire atteinte : vous avez utilisé vos 5 générations Sphera gratuites pour cette semaine. Votre quota sera renouvelé lundi prochain !";
  }

  if (
    lower === "insufficient_quota" ||
    lower.includes("insufficient_quota") ||
    (lower.includes("quota") && lower.includes("insuffisant"))
  ) {
    return "Quota insuffisant : le nombre d'outils sélectionnés dépasse votre quota de générations restantes cette semaine.";
  }

  if (
    lower === "guest_limit_reached" ||
    lower.includes("guest_limit") ||
    (lower.includes("invité") && lower.includes("limite"))
  ) {
    return "Limite du mode invité atteinte. Connectez-vous ou créez un compte gratuit pour continuer à réviser avec Sphera !";
  }

  // 2. Throttling & Rate Limits HTTP 429
  if (
    status === 429 ||
    lower === "rate_limit" ||
    lower === "rate_limited" ||
    lower === "rate limit" ||
    lower === "throttled" ||
    lower === "too_many_requests" ||
    lower.includes("too many requests") ||
    lower.includes("request was throttled") ||
    lower.includes("rate limit") ||
    lower.includes("throttling")
  ) {
    const secondsMatch = trimmed.match(/available in (\d+)\s*seconds/i) || trimmed.match(/attendre (\d+)\s*secondes/i);
    if (secondsMatch?.[1]) {
      return `Trop de requêtes envoyées. Veuillez patienter environ ${secondsMatch[1]} seconde(s) avant de réessayer.`;
    }
    return "Trop de requêtes envoyées en peu de temps. Veuillez patienter quelques instants avant de réessayer.";
  }

  // 3. Fichiers & Formats (413, 415, OCR)
  if (
    status === 413 ||
    lower.includes("too large") ||
    lower.includes("file_too_large") ||
    lower.includes("payload too large") ||
    lower.includes("entity too large")
  ) {
    return "Le fichier sélectionné est trop volumineux. La taille maximale autorisée est de 20 Mo.";
  }

  if (
    status === 415 ||
    lower.includes("unsupported_media_type") ||
    lower.includes("invalid_file_type") ||
    lower.includes("format non supporté") ||
    lower.includes("unsupported format")
  ) {
    return "Format de document non supporté. Veuillez utiliser un fichier au format PDF, DOCX ou TXT.";
  }

  if (
    lower.includes("no_usable_text") ||
    lower.includes("unusable_text") ||
    lower.includes("aucun texte exploitable") ||
    lower.includes("texte vide") ||
    lower.includes("ocr_failed")
  ) {
    return "Aucun texte exploitable n'a été détecté dans ce document. Assurez-vous que le document contient du texte lisible et non scanné en basse qualité.";
  }

  // 4. Intelligence Artificielle & Fournisseurs (503)
  if (
    status === 503 ||
    lower.includes("ai_providers_failed") ||
    lower.includes("allprovidersfailederror") ||
    lower.includes("ai_service_unavailable") ||
    lower.includes("bedrock") ||
    lower.includes("fournisseurs d'ia ont échoué")
  ) {
    return "Le service d'intelligence artificielle Sphera est temporairement surchargé ou en cours de maintenance. Veuillez réessayer dans quelques instants.";
  }

  // 5. Unicité & Conflits (409)
  if (
    status === 409 ||
    lower.includes("already exists") ||
    lower.includes("already used") ||
    lower.includes("already registered") ||
    lower.includes("unique") ||
    lower.includes("déjà utilisé") ||
    lower.includes("existe déjà")
  ) {
    return "Cet élément ou ces identifiants sont déjà utilisés. Veuillez choisir une autre valeur.";
  }

  // 6. Limite de dossiers ou collections
  if (lower.includes("reached the limit") || (lower.includes("limit") && lower.includes("folder"))) {
    return "Vous avez atteint la limite maximale autorisée (4 dossiers maximum).";
  }

  // 7. Introuvable (404)
  if (status === 404 || lower.includes("not found") || lower === "not_found" || lower.includes("introuvable")) {
    return "L'élément ou la page demandé(e) est introuvable.";
  }

  // 8. Authentification & Session (401)
  if (
    status === 401 ||
    lower.includes("invalid credentials") ||
    lower.includes("bad credentials") ||
    lower.includes("unauthorized") ||
    lower.includes("identifiants incorrects") ||
    lower.includes("token not valid") ||
    lower.includes("token_not_valid") ||
    lower.includes("jwt expired") ||
    lower.includes("session expirée")
  ) {
    return "Identifiants incorrects ou session expirée. Veuillez vous reconnecter.";
  }

  // 9. Permissions & Droits (403)
  if (
    status === 403 ||
    lower.includes("permission_denied") ||
    lower.includes("forbidden") ||
    lower.includes("not allowed") ||
    lower.includes("droits insuffisants")
  ) {
    return "Vous n'avez pas l'autorisation d'effectuer cette action.";
  }

  // 10. Champs obligatoires
  if (lower.includes("this field is required") || lower.includes("is required") || lower === "required" || lower.includes("blank")) {
    return "Ce champ est obligatoire.";
  }

  // 11. Erreurs réseau / connexion
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("load failed") ||
    lower.includes("connexion refusée") ||
    lower.includes("econnrefused")
  ) {
    return "Impossible de joindre les serveurs de CampusSphere. Veuillez vérifier votre connexion Internet.";
  }

  // 12. Erreur Serveur (500, 502, 504)
  if (status && status >= 500) {
    return "Une erreur est survenue sur nos serveurs. Notre équipe a été alertée, veuillez réessayer d'ici un instant.";
  }

  // 13. Si le message est déjà une phrase complète en français, on la préserve
  if (/[àâäéèêëîïôöùûüç]/i.test(trimmed) && trimmed.length > 10 && trimmed.includes(" ")) {
    return trimmed;
  }

  // 14. Dernier repli : si le texte est un slug brut sans espaces (ex: "SOMETHING_FAILED"), donner une phrase claire
  if (!trimmed.includes(" ") && (trimmed.includes("_") || trimmed === trimmed.toUpperCase())) {
    return "L'opération n'a pas pu aboutir. Veuillez vérifier vos données et réessayer.";
  }

  return trimmed;
}

function getStatusFallback(status: number): string {
  switch (status) {
    case 400:
      return "Les données envoyées sont invalides. Veuillez vérifier votre saisie.";
    case 401:
      return "Session expirée. Veuillez vous reconnecter.";
    case 403:
      return "Action non autorisée.";
    case 404:
      return "Ressource introuvable.";
    case 409:
      return "Un conflit est survenu avec un élément existant.";
    case 413:
      return "Le fichier envoyé est trop volumineux (20 Mo maximum).";
    case 415:
      return "Format de document non supporté.";
    case 429:
      return "Trop de requêtes ont été envoyées. Veuillez patienter un instant.";
    case 503:
      return "Le service est temporairement indisponible. Veuillez réessayer plus tard.";
    default:
      if (status >= 500) {
        return "Une erreur serveur temporaire est survenue. Veuillez réessayer dans quelques instants.";
      }
      return `Une erreur inattendue est survenue (code ${status}).`;
  }
}

/**
 * Inspects a backend JSON response and extracts a user-friendly French message.
 */
export function parseBackendError(errJson: any, status?: number): string {
  if (!errJson) {
    return status ? getStatusFallback(status) : "Une erreur inattendue est survenue.";
  }

  if (typeof errJson === "string") {
    return translateError(errJson, status);
  }

  // 1. Validation field errors ({ field_errors: { email: ["Already used"] } })
  if (errJson.field_errors && typeof errJson.field_errors === "object") {
    const errorMessages: string[] = [];
    for (const [key, value] of Object.entries(errJson.field_errors)) {
      const fieldLabel = translateField(key);
      if (Array.isArray(value) && typeof value[0] === "string") {
        errorMessages.push(`${fieldLabel} : ${translateError(value[0], status)}`);
      } else if (typeof value === "string") {
        errorMessages.push(`${fieldLabel} : ${translateError(value, status)}`);
      }
    }
    if (errorMessages.length > 0) return errorMessages.join(" • ");
  }

  // 2. Si le backend a fourni un message explicite (ex: message de quota Sphera)
  if (typeof errJson.message === "string" && errJson.message.trim().length > 0) {
    const translatedMsg = translateError(errJson.message, status);
    // Si c'est un message clair ou s'il n'y a pas d'autre erreur, on le retourne
    if (translatedMsg !== errJson.message || !errJson.error) {
      return translatedMsg;
    }
  }

  // 3. Si le backend a un slug d'erreur spécifique (ex: "weekly_limit_reached", "throttled", "insufficient_quota")
  if (typeof errJson.error === "string" && errJson.error.trim().length > 0) {
    const translated = translateError(errJson.error, status);
    // Si la traduction a trouvé une règle spécifique, on la prend
    if (translated !== errJson.error) {
      return translated;
    }
    // Si errJson.message existe et n'était pas vide, on privilégie errJson.message
    if (typeof errJson.message === "string" && errJson.message.trim().length > 0) {
      return translateError(errJson.message, status);
    }
    return translated;
  }

  // 4. Cas du champ detail (DRF / standard)
  if (typeof errJson.detail === "string" && errJson.detail.trim().length > 0) {
    return translateError(errJson.detail, status);
  }

  // 5. Cas d'un objet de validation DRF sans enveloppe ({ email: ["..."] })
  if (typeof errJson === "object" && !Array.isArray(errJson)) {
    const errorMessages: string[] = [];
    for (const [key, value] of Object.entries(errJson)) {
      if (key === "success" || key === "timestamp" || key === "code" || key === "resetsOn") continue;
      const fieldLabel = translateField(key);
      if (Array.isArray(value) && typeof value[0] === "string") {
        errorMessages.push(`${fieldLabel} : ${translateError(value[0], status)}`);
      } else if (typeof value === "string") {
        errorMessages.push(`${fieldLabel} : ${translateError(value, status)}`);
      }
    }
    if (errorMessages.length > 0) return errorMessages.join(" • ");
  }

  // Fallback selon le status HTTP
  if (status) return getStatusFallback(status);

  return "Une erreur inattendue est survenue. Veuillez réessayer.";
}

/**
 * Unified helper to format any caught error into a friendly message for UI display.
 */
export function formatUserErrorMessage(error: unknown, fallback?: string): string {
  if (!error) return fallback || "Une erreur est survenue.";

  // Erreur de type string directe
  if (typeof error === "string") {
    return translateError(error);
  }

  // Erreur HTTP / Axios ou fetch personnalisée avec response
  const anyErr = error as any;
  const status = anyErr?.status ?? anyErr?.statusCode ?? anyErr?.response?.status;

  if (anyErr?.response?.data) {
    return parseBackendError(anyErr.response.data, status);
  }

  if (anyErr?.data) {
    return parseBackendError(anyErr.data, status);
  }

  // Erreur JS native
  if (anyErr?.message && typeof anyErr.message === "string") {
    return translateError(anyErr.message, status);
  }

  if (status) {
    return getStatusFallback(status);
  }

  return fallback || "Une erreur est survenue. Veuillez réessayer ultérieurement.";
}

/**
 * Checks whether an error is due to a rate limit or weekly quota exhaustion.
 */
export function isRateLimitOrQuotaError(error: unknown): boolean {
  if (!error) return false;
  const anyErr = error as any;
  const status = anyErr?.status ?? anyErr?.statusCode ?? anyErr?.response?.status;
  if (status === 429) return true;

  const msg = String(anyErr?.message || anyErr?.error || error).toLowerCase();
  return (
    msg.includes("rate_limit") ||
    msg.includes("rate limit") ||
    msg.includes("throttled") ||
    msg.includes("weekly_limit") ||
    msg.includes("insufficient_quota") ||
    msg.includes("too many requests") ||
    msg.includes("quota")
  );
}
