import type { UserProfile } from "@/types";

export const GRACE_PERIOD_HOURS = 24;

export interface VerificationAccessStatus {
  isVerified: boolean;
  canPerformAction: boolean;
  isWithinGracePeriod: boolean;
  hoursRemainingInGrace: number;
  hasPendingVerification: boolean;
}

/**
 * Calcule les droits d'action d'un utilisateur selon sa certification et la période de grâce de 24h.
 * L'accès complet (publier, créer des hubs, commenter) est accordé si :
 * 1. Le compte est certifié (isVerified === true), OU
 * 2. Le compte est dans sa période de grâce de 24h post-inscription, OU
 * 3. Une demande de vérification est en cours d'examen.
 */
export function getVerificationAccessStatus(user: UserProfile | null | undefined): VerificationAccessStatus {
  if (!user) {
    return {
      isVerified: false,
      canPerformAction: false,
      isWithinGracePeriod: false,
      hoursRemainingInGrace: 0,
      hasPendingVerification: false,
    };
  }

  const isVerified = Boolean(user.isVerified || (user as any).is_verified);
  if (isVerified) {
    return {
      isVerified: true,
      canPerformAction: true,
      isWithinGracePeriod: false,
      hoursRemainingInGrace: 0,
      hasPendingVerification: false,
    };
  }

  // Vérifier si un justificatif a été soumis (demande en attente)
  const userPendingStorage = typeof window !== "undefined" && user.id
    ? localStorage.getItem(`cs_verification_submitted_${user.id}`) === "true"
    : false;

  const hasPendingVerification = Boolean(
    (user as any).verificationStatus === "PENDING" ||
    (user as any).cardImage ||
    (user as any).card_image ||
    userPendingStorage
  );

  // Calcul de la période de grâce de 24h depuis dateJoined / createdAt
  const joinedDate = user.dateJoined || (user as any).created_at || (user as any).createdAt;
  let isWithinGracePeriod = false;
  let hoursRemainingInGrace = 0;

  if (joinedDate) {
    const joinedTime = new Date(joinedDate).getTime();
    const now = Date.now();
    const elapsedHours = (now - joinedTime) / (1000 * 60 * 60);

    if (elapsedHours < GRACE_PERIOD_HOURS && elapsedHours >= 0) {
      isWithinGracePeriod = true;
      hoursRemainingInGrace = Math.max(1, Math.ceil(GRACE_PERIOD_HOURS - elapsedHours));
    }
  } else {
    // Si la date d'inscription n'est pas disponible, accorder la période de grâce par défaut
    isWithinGracePeriod = true;
    hoursRemainingInGrace = 24;
  }

  // Droits actifs si certifié OU dans les 24h OU demande en cours
  const canPerformAction = isVerified || isWithinGracePeriod || hasPendingVerification;

  return {
    isVerified,
    canPerformAction,
    isWithinGracePeriod,
    hoursRemainingInGrace,
    hasPendingVerification,
  };
}
