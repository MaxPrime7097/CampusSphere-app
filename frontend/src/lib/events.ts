/**
 * Déclenche un événement personnalisé pour ouvrir la modale de vérification
 * gérée par l'AppLayout (pour éviter les problèmes de cycle de vie avec les toasts).
 */
export const openVerificationModal = () => {
  window.dispatchEvent(new CustomEvent("open-verification-modal"));
};
