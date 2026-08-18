# Ajuster les limites d’envoi email Supabase (signup / resend)

## Périmètre : deux canaux d’email distincts

Ce document ne concerne **que les emails d’authentification envoyés par Supabase** (vérification
d’inscription, renvoi, réinitialisation de mot de passe). Leurs quotas se règlent dans le
dashboard Supabase et le backend n’a aucune prise dessus.

Le backend dispose par ailleurs de son **propre canal SMTP**
([`backend/src/services/email.ts`](../backend/src/services/email.ts)), utilisé pour les emails
transactionnels de l’application. Il est **inactif tant que `EMAIL_HOST_USER` et
`EMAIL_HOST_PASSWORD` ne sont pas tous deux renseignés** : Django embarquait des valeurs
placeholder, si bien qu’aucun email applicatif n’a jamais été envoyé. Ce canal a ses propres
limites — celles du fournisseur SMTP — sans rapport avec les quotas Supabase ci-dessous.

## Pourquoi

L’UI applique déjà :

- une détection explicite des erreurs `429` Supabase ;
- un message utilisateur avec délai d’attente ;
- un cooldown local de 60 secondes pour **Renvoyer l’email**.

Si la volumétrie légitime augmente (lancements, campagnes, pics journaliers), il faut également adapter la configuration côté projet Supabase pour éviter des blocages fréquents.

## Où configurer

Dans le dashboard Supabase du projet :

1. Aller sur **Authentication**.
2. Ouvrir les réglages de **Rate limits** / limites d’authentification.
3. Ajuster les quotas liés au flux email (signup, resend, reset password) selon la charge réelle.

> Recommandation : augmenter progressivement, monitorer, puis réajuster.

## Stratégie d’ajustement recommandée

1. **Mesurer** : collecter le volume d’inscriptions et de renvois email par heure/jour.
2. **Identifier les faux positifs** : taux de `429` sur des utilisateurs légitimes.
3. **Ajuster par palier** : ne pas multiplier les limites d’un coup.
4. **Surveiller après changement** :
   - taux d’erreurs `429` ;
   - latence d’envoi email ;
   - taux de conversion inscription → email confirmé.
5. **Conserver la défense anti-abus** : garder cooldown frontend + anti-double-soumission.

## Checklist release

- [ ] Les erreurs `429` sont explicites dans le frontend.
- [ ] Le bouton resend est verrouillé pendant cooldown + requête en cours.
- [ ] Les limites Supabase sont revues avec une justification volumétrique.
- [ ] Les métriques de suivi post-déploiement sont prêtes.
